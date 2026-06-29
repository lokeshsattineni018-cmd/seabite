import express from "express";
import Campaign from "../models/Campaign.js";

const router = express.Router();

// CRUD Campaigns
router.get("/", async (req, res) => {
  try {
    const list = await Campaign.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to load campaigns" });
  }
});

router.post("/", async (req, res) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

export default router;
