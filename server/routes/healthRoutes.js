import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ── GET /api/admin/bi/health-scores ──
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("name email phone createdAt walletBalance loyaltyPoints").lean();

    const scores = [];
    const now = new Date();

    for (const u of users) {
      // Find orders for this user
      const orders = await Order.find({ user: u._id, isPaid: true }).select("totalAmount createdAt").sort({ createdAt: -1 }).lean();

      let recencyDays = 999;
      let frequency = orders.length;
      let monetary = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      let lastOrderDate = null;

      if (orders.length > 0) {
        lastOrderDate = orders[0].createdAt;
        recencyDays = Math.floor((now - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24));
      }

      // Health Score Calculation Logic (0 to 100)
      // Recency Score (max 30 pts): 30 points if ordered within 7 days, scaling down to 0 after 60 days
      const rScore = recencyDays <= 7 ? 30 : Math.max(0, 30 - (recencyDays - 7) * 0.5);

      // Frequency Score (max 30 pts): 5 points per order, caps at 6 orders (30 pts)
      const fScore = Math.min(30, frequency * 5);

      // Monetary Score (max 30 pts): 1 point per ₹200 spent, caps at ₹6,000 (30 pts)
      const mScore = Math.min(30, monetary / 200);

      // Bonus points (max 10 pts) for loyalty points / wallet engagement
      const bonusScore = Math.min(10, ((u.loyaltyPoints || 0) / 100) + ((u.walletBalance || 0) / 500));

      const healthScore = Math.round(rScore + fScore + mScore + bonusScore);

      // Churn Risk Assessment
      let risk = "Green";
      if (healthScore < 40) risk = "Red";
      else if (healthScore < 70) risk = "Yellow";

      // Estimated Next Order Date
      let estimatedNextOrder = "N/A";
      if (orders.length >= 2) {
        const intervals = [];
        for (let i = 0; i < orders.length - 1; i++) {
          intervals.push((new Date(orders[i].createdAt) - new Date(orders[i+1].createdAt)) / (1000 * 60 * 60 * 24));
        }
        const avgInterval = intervals.reduce((s, val) => s + val, 0) / intervals.length;
        const nextDate = new Date(orders[0].createdAt);
        nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));
        estimatedNextOrder = nextDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      }

      scores.push({
        _id: u._id,
        name: u.name || "Customer",
        email: u.email || "—",
        phone: u.phone || "—",
        healthScore,
        risk,
        recencyDays: recencyDays === 999 ? "Never Ordered" : `${recencyDays}d ago`,
        totalOrders: frequency,
        ltv: Math.round(monetary),
        wallet: Math.round(u.walletBalance || 0),
        estimatedNextOrder
      });
    }

    // Sort by health score ascending (prioritize showing at-risk users)
    scores.sort((a, b) => a.healthScore - b.healthScore);

    res.json(scores);
  } catch (err) {
    console.error("Health score compilation failed:", err);
    res.status(500).json({ message: "Failed to compile customer health score dashboard" });
  }
});

export default router;
