import express from "express";
import { protect, supportAuth } from "../../middleware/authMiddleware.js";
import Order from "../../models/Order.js";

const router = express.Router();

// ── GET /api/support/tickets — Fetch all active tickets/issues ──
router.get("/tickets", protect, supportAuth, async (req, res) => {
  try {
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
    const MAX_REFUND_LIMIT = 500; 

    if (amount > MAX_REFUND_LIMIT && req.user.role !== "admin") {
      return res.status(403).json({ 
        message: `Restricted Action: Your authorization limit is ₹${MAX_REFUND_LIMIT}. Please escalate to an Admin.` 
      });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.refundStatus = "Initiated";
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: `Refund ₹${amount}`, timestamp: new Date(), message: `Refund of ₹${amount} initiated by agent` });
    await order.save();

    res.json({ message: `Refund of ₹${amount} initiated successfully for Order ${orderId}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to process refund" });
  }
});

// ── GET /api/support/customer-profile/:userId — Customer 360° Profile ──
router.get("/customer-profile/:userId", protect, supportAuth, async (req, res) => {
  try {
    const User = (await import("../../models/User.js")).default;
    const customer = await User.findById(req.params.userId).select("name email phone role createdAt");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    
    const totalOrders = orders.length;
    const lifetimeSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
    const cancelledOrders = orders.filter(o => o.status === "Cancelled").length;
    const avgRating = orders.filter(o => o.npsScore).length > 0 
      ? (orders.reduce((sum, o) => sum + (o.npsScore || 0), 0) / orders.filter(o => o.npsScore).length).toFixed(1) 
      : "N/A";
    
    let loyaltyTier = "Bronze 🥉";
    if (lifetimeSpend > 10000) loyaltyTier = "Gold 🥇";
    else if (lifetimeSpend > 5000) loyaltyTier = "Silver 🥈";
    if (lifetimeSpend > 25000) loyaltyTier = "Platinum 💎";

    const complaints = orders.filter(o => 
      o.refundStatus !== "None" || (o.returnRequest && o.returnRequest.status !== "none")
    ).length;

    const recentOrders = orders.slice(0, 5).map(o => ({
      orderId: o.orderId,
      status: o.status,
      total: o.totalAmount,
      date: o.createdAt
    }));

    res.json({
      customer: { name: customer.name, email: customer.email, phone: customer.phone, memberSince: customer.createdAt },
      totalOrders, lifetimeSpend, deliveredOrders, cancelledOrders, avgRating,
      loyaltyTier, complaints, recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customer profile" });
  }
});

// ── POST /api/support/notes — Add internal note to an order ──
router.post("/notes", protect, supportAuth, async (req, res) => {
  try {
    const { orderId, note } = req.body;
    if (!note?.trim()) return res.status(400).json({ message: "Note cannot be empty" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.internalNotes) order.internalNotes = [];
    order.internalNotes.push({
      agentId: req.user._id,
      agentName: req.user.name || req.user.email,
      note: note.trim(),
      createdAt: new Date()
    });
    await order.save();

    res.json({ message: "Note added", notes: order.internalNotes });
  } catch (error) {
    res.status(500).json({ message: "Failed to add note" });
  }
});

// ── GET /api/support/notes/:orderId — Fetch internal notes for an order ──
router.get("/notes/:orderId", protect, supportAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).select("internalNotes");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order.internalNotes || []);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

export default router;
