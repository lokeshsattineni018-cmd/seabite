import express from "express";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// Get all support tickets
router.get("/tickets", async (req, res) => {
  try {
    const list = await Ticket.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to load tickets" });
  }
});

// Create new ticket
router.post("/tickets", async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to create support ticket" });
  }
});

// Update support ticket details (e.g. status, priority, category)
router.put("/tickets/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

export default router;
