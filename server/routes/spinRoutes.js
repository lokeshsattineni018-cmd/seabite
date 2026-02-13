import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/spin", async (req, res) => {
  try {
    const userEmail = req.session?.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: "Please login first to spin!" });
    }

    // Check if user already spun (stored in User model)
    const user = await User.findOne({ email: userEmail.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user can spin (either never spun OR 24hrs passed since last order)
    const now = new Date();
    if (user.lastSpinTime && user.lastOrderCompletionTime) {
      const hoursSinceOrder = (now - new Date(user.lastOrderCompletionTime)) / (1000 * 60 * 60);
      const hoursSinceSpin = (now - new Date(user.lastSpinTime)) / (1000 * 60 * 60);
      
      // If less than 24hrs since last order, can't spin
      if (hoursSinceOrder < 24) {
        return res.status(403).json({ 
          error: "You can spin again 24 hours after your last order!",
          nextSpinTime: new Date(user.lastOrderCompletionTime.getTime() + 24 * 60 * 60 * 1000)
        });
      }
      
      // If already spun after last order, can't spin again
      if (user.lastSpinTime > user.lastOrderCompletionTime) {
        return res.status(403).json({ 
          error: "You've already used your spin! Complete an order to spin again.",
        });
      }
    } else if (user.lastSpinTime && !user.lastOrderCompletionTime) {
      // User spun but never ordered
      return res.status(403).json({ 
        error: "You've already used your spin! Complete an order to spin again.",
      });
    }

    // Spin probabilities matching the wheel
    const rand = Math.random() * 100;
    let outcome;

    if (rand < 16.66) {
      outcome = { type: "NO_PRIZE" };
    } else if (rand < 33.33) {
      outcome = { type: "PERCENT", value: 5 };
    } else if (rand < 50) {
      outcome = { type: "NO_PRIZE" };
    } else if (rand < 83.33) {
      outcome = { type: "PERCENT", value: 10 };
    } else if (rand < 66.66) {
      outcome = { type: "PERCENT", value: 20 };
    } else {
      outcome = { type: "PERCENT", value: 50 };
    }

    console.log("Spin outcome:", outcome);

    // Update user's last spin time
    user.lastSpinTime = now;
    await user.save();

    if (outcome.type === "NO_PRIZE") {
      return res.json({
        result: "BETTER_LUCK",
        message: "Better luck next time!",
      });
    }

    // Calculate expiry: 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return res.json({
      result: "COUPON",
      discountValue: outcome.value,
      expiresAt: expiresAt,
    });
  } catch (err) {
    console.error("❌ Spin Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Check if user can spin
router.get("/can-spin", async (req, res) => {
  try {
    const userEmail = req.session?.user?.email;
    if (!userEmail) {
      return res.json({ canSpin: false, reason: "Not logged in" });
    }

    const user = await User.findOne({ email: userEmail.toLowerCase() });
    if (!user) {
      return res.json({ canSpin: false, reason: "User not found" });
    }

    const now = new Date();
    
    // Never spun before
    if (!user.lastSpinTime) {
      return res.json({ canSpin: true });
    }

    // Spun but never ordered
    if (user.lastSpinTime && !user.lastOrderCompletionTime) {
      return res.json({ canSpin: false, reason: "Complete an order to spin again" });
    }

    // Check if 24hrs passed since last order
    const hoursSinceOrder = (now - new Date(user.lastOrderCompletionTime)) / (1000 * 60 * 60);
    
    if (hoursSinceOrder < 24) {
      const nextSpinTime = new Date(user.lastOrderCompletionTime.getTime() + 24 * 60 * 60 * 1000);
      return res.json({ 
        canSpin: false, 
        reason: "Wait 24hrs after your last order",
        nextSpinTime 
      });
    }

    // Check if already spun after last order
    if (user.lastSpinTime > user.lastOrderCompletionTime) {
      return res.json({ 
        canSpin: false, 
        reason: "Already spun after last order" 
      });
    }

    return res.json({ canSpin: true });
  } catch (err) {
    console.error("Can spin check error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;