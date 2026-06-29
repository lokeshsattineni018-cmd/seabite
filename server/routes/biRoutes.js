import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// Get custom sales metrics
router.get("/custom-reports", async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const orders = await Order.find({ createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } }).lean();

    res.json({
      title: "Monthly Custom Sales Ledger",
      totalRevenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      orderCount: orders.length,
      averageOrderValue: orders.length > 0
        ? Math.round(orders.reduce((s, o) => s + (o.totalAmount || 0), 0) / orders.length)
        : 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load custom reports" });
  }
});

export default router;
