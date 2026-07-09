import express from "express";
import { protect, supportAuth } from "../../middleware/authMiddleware.js";
import Order from "../../models/Order.js";

const router = express.Router();

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

    order.npsScore = score * 2;
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

// ── GET /api/support/console-overview — Admin support console aggregated data ──
router.get("/console-overview", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

    const User = (await import("../../models/User.js")).default;
    const ChatMessage = (await import("../../models/ChatMessage.js")).default;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agents = await User.find({ role: { $in: ["support", "admin"] } }).select("name email role").lean();

    const allOrders = await Order.find().sort({ createdAt: -1 }).limit(500).lean();
    const pending = allOrders.filter(o => o.status === "Pending");
    const processing = allOrders.filter(o => o.status === "Processing");
    const escalated = allOrders.filter(o => o.escalated);
    const resolved = allOrders.filter(o => o.resolvedAt);
    const cancelled = allOrders.filter(o => o.status?.includes("Cancelled"));

    const ratedOrders = allOrders.filter(o => o.csatScore);
    const avgCSAT = ratedOrders.length > 0
      ? Math.round(ratedOrders.reduce((s, o) => s + o.csatScore, 0) / ratedOrders.length * 10) / 10
      : 4.2;
    const csatDistribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: ratedOrders.filter(o => Math.round(o.csatScore) === star).length
    }));

    const todayMessages = await ChatMessage.find({
      createdAt: { $gte: today },
      senderRole: { $in: ["support", "admin"] }
    }).lean();

    const agentStats = agents.map(a => {
      const myMessages = todayMessages.filter(m => m.sender?.toString() === a._id.toString());
      return {
        _id: a._id,
        name: a.name,
        email: a.email,
        role: a.role,
        messagesToday: myMessages.length,
        lastActive: myMessages.length > 0
          ? myMessages[myMessages.length - 1].createdAt
          : null,
        isOnline: myMessages.length > 0 && (Date.now() - new Date(myMessages[myMessages.length - 1].createdAt).getTime()) < 15 * 60 * 1000
      };
    });

    const escalationList = escalated.map(o => ({
      _id: o._id,
      orderId: o.orderId,
      customer: o.shippingAddress?.fullName || "Unknown",
      phone: o.shippingAddress?.phone,
      status: o.status,
      category: o.supportCategory || "General",
      escalatedAt: o.escalatedAt,
      ageMinutes: o.escalatedAt ? Math.round((Date.now() - new Date(o.escalatedAt).getTime()) / 60000) : null
    }));

    const categories = {};
    allOrders.forEach(o => {
      const cat = o.supportCategory || (o.status?.includes("Cancelled") ? "Cancellation" : o.status === "Pending" ? "Pending Query" : "General");
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const issueBreakdown = Object.entries(categories)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recentChats = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      queueStats: {
        pending: pending.length,
        processing: processing.length,
        escalated: escalated.length,
        resolved: resolved.length,
        cancelled: cancelled.length,
        total: allOrders.length
      },
      agents: agentStats,
      escalations: escalationList.sort((a, b) => (b.ageMinutes || 0) - (a.ageMinutes || 0)).slice(0, 15),
      csat: {
        average: avgCSAT,
        totalRatings: ratedOrders.length,
        distribution: csatDistribution
      },
      issueBreakdown,
      recentChats: recentChats.map(c => ({
        _id: c._id,
        sender: c.sender,
        recipient: c.recipient,
        message: c.message?.substring(0, 100),
        senderRole: c.senderRole,
        recipientRole: c.recipientRole,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch support console overview" });
  }
});

export default router;
