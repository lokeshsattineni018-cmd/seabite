import express from "express";
import { protect, supportAuth } from "../middleware/authMiddleware.js";
import Order from "../models/Order.js";

const router = express.Router();

// ── GET /api/support/tickets — Fetch all active tickets/issues ──
router.get("/tickets", protect, supportAuth, async (req, res) => {
  try {
    // For now, let's treat recent return requests or complaints as tickets.
    // In a full implementation, you'd have a Complaint/Ticket model.
    // Let's just fetch recent orders to simulate "Order X-Ray" capability.
    const recentOrders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(recentOrders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

// ── GET /api/support/order/:id — Order X-Ray (Detailed Lookup) ──
router.get("/order/:id", protect, supportAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone addresses");

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to lookup order" });
  }
});

// ── POST /api/support/refund — Restricted Refund Action ──
router.post("/refund", protect, supportAuth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    
    // Support constraint: Limit refunds to max $50 / ₹500 equivalent per action
    const MAX_REFUND_LIMIT = 500; 

    if (amount > MAX_REFUND_LIMIT && req.user.role !== "admin") {
      return res.status(403).json({ 
        message: `Restricted Action: Your authorization limit is ₹${MAX_REFUND_LIMIT}. Please escalate to an Admin.` 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Process refund logic (in real life, connect to payment gateway or wallet)
    // For now, we mock the success.
    res.json({ message: `Refund of ₹${amount} initiated successfully for Order ${orderId}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to process refund" });
  }
});

export default router;
