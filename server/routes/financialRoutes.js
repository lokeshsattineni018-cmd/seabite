import express from "express";
import { Expense } from "../models/Financial.js";
import Order from "../models/Order.js";

const router = express.Router();

// Get revenue breakdown
router.get("/revenue", async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const orders = await Order.find({ createdAt: { $gte: startOfMonth }, status: { $ne: "Cancelled" } }).lean();

    const stats = {
      monthlyRevenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      codRevenue: orders.filter(o => o.paymentMethod === "COD").reduce((s, o) => s + (o.totalAmount || 0), 0),
      onlineRevenue: orders.filter(o => o.paymentMethod !== "COD").reduce((s, o) => s + (o.totalAmount || 0), 0),
      discountTotal: orders.reduce((s, o) => s + (o.discount || 0), 0)
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to load revenue details" });
  }
});

// Expenses endpoints
router.get("/expenses", async (req, res) => {
  try {
    const list = await Expense.find().sort({ date: -1 }).limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to load expenses" });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to log expense" });
  }
});

export default router;
