import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { getVapidPublicKey } from "../utils/webPush.js";

const router = express.Router();

// GET /api/notifications/vapid-public-key
router.get("/vapid-public-key", protect, (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// POST /api/notifications/subscribe
router.post("/subscribe", protect, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ message: "Invalid subscription payload" });
  }

  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if subscription endpoint already exists for this user to avoid duplication
    const exists = user.pushSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      });
      await user.save();
    }

    res.status(201).json({ message: "Subscription saved successfully" });
  } catch (err) {
    console.error("❌ Subscription save error:", err);
    res.status(500).json({ message: "Failed to save push subscription" });
  }
});

// POST /api/notifications/unsubscribe
router.post("/unsubscribe", protect, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ message: "Endpoint is required" });
  }

  try {
    const userId = req.user.id || req.user._id;
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint: endpoint } }
    });
    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (err) {
    console.error("❌ Unsubscribe error:", err);
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

export default router;
