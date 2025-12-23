import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// 1. POST: User sends a message
router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    await Contact.create({ email, message });
    res.status(201).json({ success: true, message: "Message Sent Successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. GET: Admin sees all messages (✅ NEW)
router.get("/", async (req, res) => {
  try {
    // Sort by newest first (-1)
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;