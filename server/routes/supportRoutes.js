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

    // Record refund in order
    order.refundStatus = "Initiated";
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: `Refund ₹${amount}`, timestamp: new Date(), message: `Refund of ₹${amount} initiated by agent` });
    await order.save();

    res.json({ message: `Refund of ₹${amount} initiated successfully for Order ${orderId}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to process refund" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TIER 1: RESOLUTION INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

// ── GET /api/support/customer-profile/:userId — Customer 360° Profile ──
router.get("/customer-profile/:userId", protect, supportAuth, async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;
    const customer = await User.findById(req.params.userId).select("name email phone role createdAt");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Aggregate order history
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
    
    const totalOrders = orders.length;
    const lifetimeSpend = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
    const cancelledOrders = orders.filter(o => o.status === "Cancelled").length;
    const avgRating = orders.filter(o => o.npsScore).length > 0 
      ? (orders.reduce((sum, o) => sum + (o.npsScore || 0), 0) / orders.filter(o => o.npsScore).length).toFixed(1) 
      : "N/A";
    
    // Loyalty tier based on spend
    let loyaltyTier = "Bronze 🥉";
    if (lifetimeSpend > 10000) loyaltyTier = "Gold 🥇";
    else if (lifetimeSpend > 5000) loyaltyTier = "Silver 🥈";
    if (lifetimeSpend > 25000) loyaltyTier = "Platinum 💎";

    // Past complaints (orders with returnRequest or refundStatus)
    const complaints = orders.filter(o => 
      o.refundStatus !== "None" || (o.returnRequest && o.returnRequest.status !== "none")
    ).length;

    // Recent orders summary (last 5)
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

// ═══════════════════════════════════════════════════════════════════
// TIER 2: ANALYTICS & MONITORING
// ═══════════════════════════════════════════════════════════════════

// ── GET /api/support/queue-stats — Live queue metrics ──
router.get("/queue-stats", protect, supportAuth, async (req, res) => {
  try {
    const pendingCount = await Order.countDocuments({ status: { $in: ["Pending", "Processing"] } });
    const inTransitCount = await Order.countDocuments({ status: { $in: ["Shipped", "Out for Delivery"] } });
    const deliveredToday = await Order.countDocuments({ 
      status: "Delivered", 
      deliveredAt: { $gte: new Date(new Date().toISOString().slice(0, 10)) } 
    });
    const cancelledToday = await Order.countDocuments({
      status: "Cancelled",
      updatedAt: { $gte: new Date(new Date().toISOString().slice(0, 10)) }
    });

    // Average time from order creation to resolution (delivered/cancelled) for today
    const resolvedToday = await Order.find({
      status: { $in: ["Delivered", "Cancelled"] },
      updatedAt: { $gte: new Date(new Date().toISOString().slice(0, 10)) }
    }).select("createdAt updatedAt");

    let avgResolutionMin = 0;
    if (resolvedToday.length > 0) {
      const totalMin = resolvedToday.reduce((sum, o) => {
        return sum + Math.round((new Date(o.updatedAt) - new Date(o.createdAt)) / 60000);
      }, 0);
      avgResolutionMin = Math.round(totalMin / resolvedToday.length);
    }

    res.json({ pendingCount, inTransitCount, deliveredToday, cancelledToday, avgResolutionMin, totalResolved: resolvedToday.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch queue stats" });
  }
});

// ── POST /api/support/csat — Record customer satisfaction rating ──
router.post("/csat", protect, supportAuth, async (req, res) => {
  try {
    const { orderId, score, feedback } = req.body;
    if (!score || score < 1 || score > 5) return res.status(400).json({ message: "Score must be 1-5" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.npsScore = score * 2; // Convert 1-5 to 2-10 NPS scale
    order.npsFeedback = feedback || "";
    order.npsSubmittedAt = new Date();
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: `CSAT ${score}★`, timestamp: new Date(), message: feedback || "" });
    await order.save();

    res.json({ message: `CSAT score of ${score}★ recorded` });
  } catch (error) {
    res.status(500).json({ message: "Failed to record CSAT" });
  }
});

// ── GET /api/support/agent-stats — Current agent's performance metrics ──
router.get("/agent-stats", protect, supportAuth, async (req, res) => {
  try {
    // For now, compute from CSAT scores and resolved orders
    const allOrders = await Order.find({ npsSubmittedAt: { $exists: true } }).select("npsScore");
    const avgCSAT = allOrders.length > 0 
      ? (allOrders.reduce((sum, o) => sum + (o.npsScore || 0), 0) / allOrders.length / 2).toFixed(1) 
      : "N/A";

    const today = new Date(new Date().toISOString().slice(0, 10));
    const resolvedToday = await Order.countDocuments({
      status: { $in: ["Delivered", "Cancelled"] },
      updatedAt: { $gte: today }
    });

    res.json({
      avgCSAT,
      ticketsResolvedToday: resolvedToday,
      totalCSATResponses: allOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agent stats" });
  }
});

// ── GET /api/support/issue-heatmap — Issue category distribution ──
router.get("/issue-heatmap", protect, supportAuth, async (req, res) => {
  try {
    // Categorize based on order status patterns
    const cancelled = await Order.countDocuments({ status: "Cancelled" });
    const returned = await Order.countDocuments({ "returnRequest.status": { $ne: "none" } });
    const refunded = await Order.countDocuments({ refundStatus: { $ne: "None" } });
    const late = await Order.countDocuments({
      status: "Delivered",
      estimatedDeliveryTime: { $exists: true },
      $expr: { $gt: ["$actualDeliveryTime", "$estimatedDeliveryTime"] }
    });

    res.json({
      categories: [
        { label: "Cancellations", count: cancelled, color: "#EA4335" },
        { label: "Returns", count: returned, color: "#FF6B35" },
        { label: "Refunds", count: refunded, color: "#A855F7" },
        { label: "Late Delivery", count: late, color: "#F59E0B" }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch heatmap" });
  }
});

export default router;

