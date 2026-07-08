import express from "express";
import ChatMessage from "../models/ChatMessage.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── GET /api/chat/history/:participantId — Fetch conversation history ──
router.get("/history/:participantId", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { participantId } = req.params;

    let query;
    if (participantId === "support-agent" || participantId === "support") {
      // Customer fetching their own chat with support
      query = {
        $or: [
          { sender: userId, recipientRole: "support" },
          { recipient: userId, senderRole: "support" },
          { recipient: userId, senderRole: "admin" }
        ]
      };
    } else if (req.user.role === "support" || req.user.role === "admin") {
      // Support agent fetching chat with a specific customer
      query = {
        $or: [
          { sender: participantId, recipientRole: "support" },
          { recipient: participantId, senderRole: "support" },
          { recipient: participantId, senderRole: "admin" },
          { sender: userId, recipient: participantId },
          { sender: participantId, recipient: userId }
        ]
      };
    } else {
      // Fallback/direct user-to-user (e.g. driver-to-customer or driver-to-support)
      query = {
        $or: [
          { sender: userId, recipient: participantId },
          { sender: participantId, recipient: userId }
        ]
      };
    }

    const messages = await ChatMessage.find(query)
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

// ── POST /api/chat/message — Send a chat message (REST + Socket hybrid) ──
router.post("/message", protect, async (req, res) => {
  try {
    const { recipient, message, senderRole, recipientRole } = req.body;
    const sender = req.user._id;

    if (!recipient || !message || !senderRole || !recipientRole) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const chatMsg = await ChatMessage.create({
      sender,
      recipient,
      message,
      senderRole,
      recipientRole
    });

    // If socket is available, emit it to rooms
    if (req.io) {
      req.io.to(`chat:${sender}`).to(`chat:${recipient}`).emit("chat-message", chatMsg);
    }

    res.status(201).json(chatMsg);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default router;
