// routes/notificationsRoutes.js
import express from "express";
import Notification from "../models/notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/notifications - fetch latest notifications for logged in user
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Notifications fetch error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/read-all - mark notifications as read
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res
      .status(200)
      .json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Notifications read-all error:", error);
    res.status(500).json({ message: "Update failed" });
  }
});

// DELETE /api/notifications/:id - delete a single notification
router.delete("/:id", protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    res.status(200).json({ message: "Notification removed" });
  } catch (error) {
    console.error("Notification delete error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

// DELETE /api/notifications/clear/all - clear all notifications
router.delete("/clear/all", protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res
      .status(200)
      .json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Notifications clear-all error:", error);
    res.status(500).json({ message: "Clear failed" });
  }
});

export default router;
