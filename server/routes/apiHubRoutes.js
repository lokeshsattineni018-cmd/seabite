import express from "express";

const router = express.Router();

// Mock endpoints for Developer integrations
router.get("/keys", async (req, res) => {
  res.json([
    { id: "key_1", label: "Zapier integration webhook key", value: "sb_live_4k83kdla92k", active: true }
  ]);
});

export default router;
