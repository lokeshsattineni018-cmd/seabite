import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

function generateCode(prefix) {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

router.post("/spin", async (req, res) => {
  try {
    const userEmail = req.session?.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: "Please login first to spin!" });
    }

    // ✅ FOR PRODUCTION: Enable this to restrict to one spin per user
    // Comment out for testing
    /*
    const existing = await Coupon.findOne({ 
      userEmail: userEmail.toLowerCase(), 
      isSpinCoupon: true 
    });
    
    if (existing) {
      return res.status(403).json({ error: "You've already used your spin!" });
    }
    */

    // Spin probabilities matching the wheel
    const rand = Math.random() * 100;
    let outcome;

    // Match the 6 segments on the wheel exactly
    // Segments: Better Luck (0-16.66%), 5% OFF (16.66-33.33%), Better Luck (33.33-50%), 
    //           10% OFF (50-66.66%), 20% OFF (66.66-83.33%), 50% OFF (83.33-100%)
    
    if (rand < 16.66) {
      outcome = { type: "NO_PRIZE" };
    } else if (rand < 33.33) {
      outcome = { type: "PERCENT", value: 5, prefix: "SB5" };
    } else if (rand < 50) {
      outcome = { type: "NO_PRIZE" };
    } else if (rand < 66.66) {
      outcome = { type: "PERCENT", value: 10, prefix: "SB10" };
    } else if (rand < 83.33) {
      outcome = { type: "PERCENT", value: 20, prefix: "SB20" };
    } else {
      outcome = { type: "PERCENT", value: 50, prefix: "SB50" };
    }

    console.log("Spin outcome:", outcome);

    if (outcome.type === "NO_PRIZE") {
      // ✅ Still create a record so they can't spin again (for production)
      // Comment out for unlimited testing
      /*
      await Coupon.create({
        code: "NO_PRIZE",
        discountType: "none",
        value: 0,
        userEmail: userEmail.toLowerCase(),
        isSpinCoupon: true,
        isActive: false,
      });
      */
      
      return res.json({
        result: "BETTER_LUCK",
        message: "Better luck next time!",
      });
    }

    // Calculate expiry: 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    let code;
    let exists = true;
    while (exists) {
      code = generateCode(outcome.prefix);
      exists = await Coupon.findOne({ code });
    }

    // Create the coupon (for tracking purposes, though we use percentage directly)
    const coupon = await Coupon.create({
      code,
      discountType: "percent",
      value: outcome.value,
      userEmail: userEmail.toLowerCase(),
      isSpinCoupon: true,
      maxUses: 1,
      expiresAt,
      isActive: true,
    });

    console.log("Created spin coupon:", coupon);

    return res.json({
      result: "COUPON",
      discountValue: outcome.value,
      code: coupon.code,
      expiresAt: coupon.expiresAt,
    });
  } catch (err) {
    console.error("❌ Spin Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;