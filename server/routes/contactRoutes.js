import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

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

export default router;