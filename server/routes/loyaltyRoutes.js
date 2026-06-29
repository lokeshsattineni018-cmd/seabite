import express from "express";
import Loyalty from "../models/Loyalty.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware to check authentication
const checkAuth = (req, res, next) => {
  if (!req.session?.userId && !req.headers.authorization) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

const getUserId = (req) => {
  if (req.session?.userId) return req.session.userId;
  if (req.headers.authorization) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

// Get user loyalty status
router.get("/status", checkAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
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
router.post("/checkin", checkAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
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
