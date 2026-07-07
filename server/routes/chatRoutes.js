import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── GET /api/chat/history/:participantId — Fetch conversation history ──
router.get("/history/:participantId", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { participantId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, recipient: participantId },
        { sender: participantId, recipient: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

// ── GET /api/chat/conversations — Get list of active support dialogs for agent ──
router.get("/conversations", protect, async (req, res) => {
  try {
    // Return all distinct user chats with drivers or support
    const userId = req.user._id;
    const recentMessages = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderRole: "user" },
            { recipientRole: "user" }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$message" },
          lastSender: { $first: "$sender" },
          updatedAt: { $first: "$createdAt" }
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]);

    // Populate user info manually
    const User = (await import("../models/User.js")).default;
    const populated = await Promise.all(
      recentMessages.map(async (msg) => {
        const otherUser = await User.findById(msg._id).select("name email role");
        return {
          ...msg,
          user: otherUser
        };
      })
    );

    res.json(populated.filter(p => p.user));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

export default router;
