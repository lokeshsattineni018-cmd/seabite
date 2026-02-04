import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// 1. POST: User sends a message (Public)
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

// 2. GET: Admin fetches all messages (✅ THIS WAS MISSING)
router.get("/", async (req, res) => {
  try {
    // Fetch all contacts and sort by newest first (-1)
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;