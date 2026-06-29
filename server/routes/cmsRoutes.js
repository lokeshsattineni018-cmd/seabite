import express from "express";
import CMSPage from "../models/CMSPage.js";

const router = express.Router();

// Get all pages
router.get("/pages", async (req, res) => {
  try {
    const list = await CMSPage.find({ type: "page" }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to load pages" });
  }
});

// Create page
router.post("/pages", async (req, res) => {
  try {
    const page = await CMSPage.create({
      ...req.body,
      type: "page"
    });
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ error: "Failed to create page" });
  }
});

// Update page
router.put("/pages/:id", async (req, res) => {
  try {
    const page = await CMSPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(page);
  } catch (err) {
    res.status(500).json({ error: "Failed to update page" });
  }
});

export default router;
