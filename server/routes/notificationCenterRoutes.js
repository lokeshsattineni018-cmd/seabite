import express from "express";

const router = express.Router();

// Simulated endpoints for Unified notification channel scheduling and blasts
router.get("/templates", async (req, res) => {
  res.json([
    { id: "order_confirmation", name: "Order Confirmation Email Template" },
    { id: "delivery_alert", name: "Delivery Alert Notification template" },
    { id: "weekly_digest", name: "Weekly Fresh Catch Promotional Digest" }
  ]);
});

router.post("/blast", async (req, res) => {
  res.json({
    message: `Blast campaign triggered successfully to selected channel target segment!`,
    timestamp: new Date()
  });
});

export default router;
