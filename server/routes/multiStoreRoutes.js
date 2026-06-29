import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

// Get list of all stores
router.get("/stores", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings?.multiStore?.stores || [
      { storeId: "default", name: "SeaBite Default Store", domain: "seabite.co.in", isActive: true }
    ]);
  } catch (err) {
    res.status(500).json({ error: "Failed to load stores list" });
  }
});

export default router;
