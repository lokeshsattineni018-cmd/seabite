import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

// 1. POST: User sends a message (Public)
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ success: false, message: "Email and message are required" });
    }

    await Contact.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: "Message Sent Successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. GET: Admin fetches all messages
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

// 3. POST: Admin replies to a message
import { sendEmail } from "../utils/emailService.js";

router.post("/reply", async (req, res) => {
  try {
    const { to, subject, message, originalMessageId } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: "Recipient and message required" });
    }

    // Send email using existing service
    await sendEmail(to, subject || "Response from SeaBite Support", message);

    res.json({ success: true, message: "Reply sent successfully!" });
  } catch (err) {
    console.error("Reply Error:", err);
    res.status(500).json({ success: false, message: "Failed to send reply" });
  }
});

export default router;