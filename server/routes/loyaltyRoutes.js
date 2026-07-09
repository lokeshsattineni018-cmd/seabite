import express from "express";
import Loyalty from "../models/Loyalty.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user loyalty status
router.get("/status", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let loyalty = await Loyalty.findOne({ user: userId });
    
    if (!loyalty) {
      loyalty = await Loyalty.create({ user: userId });
    }

    res.json(loyalty);
  } catch (err) {
    res.status(500).json({ error: "Failed to load loyalty status" });
  }
});

// Daily Check-in
router.post("/checkin", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    let loyalty = await Loyalty.findOne({ user: userId });
    
    if (!loyalty) {
      loyalty = await Loyalty.create({ user: userId });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (loyalty.lastCheckinDate) {
      const lastCheckin = new Date(loyalty.lastCheckinDate);
      lastCheckin.setHours(0, 0, 0, 0);
      if (today.getTime() === lastCheckin.getTime()) {
        return res.status(400).json({ error: "Already checked in today!" });
      }
    }

    // Add points
    loyalty.addPoints(10, "daily_checkin", "Daily Check-in Reward");
    loyalty.lastCheckinDate = new Date();
    loyalty.monthlyCheckinCount = (loyalty.monthlyCheckinCount || 0) + 1;
    
    await loyalty.save();
    
    res.json({ message: "Check-in successful! +10 Points earned.", loyalty });
  } catch (err) {
    res.status(500).json({ error: "Check-in failed" });
  }
});

export default router;
