import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { RevenueGoal } from "../models/Financial.js";

const router = express.Router();

// ─── AI Daily Briefing (via Gemini) ───
router.get("/briefing", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeekSameDay = new Date(today);
    lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);

    // Today's stats
    const todayOrders = await Order.find({ createdAt: { $gte: today } });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayCount = todayOrders.length;

    // Yesterday's stats
    const yesterdayOrders = await Order.find({ createdAt: { $gte: yesterday, $lt: today } });
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const yesterdayCount = yesterdayOrders.length;

    // Last week same day
    const lastWeekEnd = new Date(lastWeekSameDay);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 1);
    const lastWeekOrders = await Order.find({ createdAt: { $gte: lastWeekSameDay, $lt: lastWeekEnd } });
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Top selling products today
    const topProducts = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        topProducts[item.name] = (topProducts[item.name] || 0) + item.qty;
      });
    });
    const topSelling = Object.entries(topProducts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // New customers today
    const newCustomers = await User.countDocuments({ createdAt: { $gte: today } });

    // Pending orders
    const pendingOrders = await Order.countDocuments({ status: { $in: ["Pending", "Processing"] } });

    // Low stock products
    const lowStock = await Product.countDocuments({ countInStock: { $lte: 5 }, active: true });

    // Revenue change percentages
    const revenueVsYesterday = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;
    const revenueVsLastWeek = lastWeekRevenue > 0 ? Math.round(((todayRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;

    // Generate AI briefing text
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    
    const alerts = [];
    if (pendingOrders > 10) alerts.push(`⚠️ ${pendingOrders} orders pending — delivery pressure is HIGH`);
    if (lowStock > 0) alerts.push(`📦 ${lowStock} products running low on stock`);
    if (revenueVsYesterday < -20) alerts.push(`📉 Revenue is down ${Math.abs(revenueVsYesterday)}% vs yesterday`);
    if (revenueVsYesterday > 20) alerts.push(`📈 Revenue is up ${revenueVsYesterday}% vs yesterday — great momentum!`);

    const briefing = {
      greeting,
      summary: `Today so far: ₹${todayRevenue.toLocaleString()} revenue from ${todayCount} orders. ${newCustomers} new customers joined.`,
      todayStats: {
        revenue: todayRevenue,
        orders: todayCount,
        newCustomers,
        avgOrderValue: todayCount > 0 ? Math.round(todayRevenue / todayCount) : 0,
      },
      comparisons: {
        vsYesterday: { revenue: revenueVsYesterday, orders: yesterdayCount > 0 ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : 0 },
        vsLastWeek: { revenue: revenueVsLastWeek },
      },
      topSelling,
      alerts,
      pendingOrders,
      lowStockCount: lowStock,
      generatedAt: new Date(),
    };

    res.json(briefing);
  } catch (err) {
    console.error("Dashboard briefing error:", err);
    res.status(500).json({ error: "Failed to generate briefing" });
  }
});

// ─── Cohort Retention Analysis ───
router.get("/cohorts", async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const cohorts = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      // Users who signed up in this month
      const cohortUsers = await User.find({ createdAt: { $gte: start, $lt: end } }).select("_id");
      const userIds = cohortUsers.map(u => u._id);

      if (userIds.length === 0) {
        cohorts.push({ month: start.toISOString().slice(0, 7), signups: 0, retention: [] });
        continue;
      }

      // For each subsequent month, check how many ordered
      const retention = [];
      for (let j = 0; j <= Math.min(i, 5); j++) {
        const retStart = new Date(start);
        retStart.setMonth(retStart.getMonth() + j);
        const retEnd = new Date(retStart);
        retEnd.setMonth(retEnd.getMonth() + 1);

        const activeUsers = await Order.distinct("user", {
          user: { $in: userIds },
          createdAt: { $gte: retStart, $lt: retEnd },
        });
        retention.push({
          monthOffset: j,
          activeUsers: activeUsers.length,
          retentionPct: Math.round((activeUsers.length / userIds.length) * 100),
        });
      }

      cohorts.push({
        month: start.toISOString().slice(0, 7),
        signups: userIds.length,
        retention,
      });
    }

    res.json(cohorts);
  } catch (err) {
    console.error("Cohort analysis error:", err);
    res.status(500).json({ error: "Failed to generate cohorts" });
  }
});

// ─── Geographic Heatmap Data ───
router.get("/geo-heatmap", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await Order.find({ createdAt: { $gte: since } })
      .select("shippingAddress.city shippingAddress.state totalAmount createdAt")
      .lean();

    // Aggregate by city
    const cityMap = {};
    orders.forEach(order => {
      const city = order.shippingAddress?.city || "Unknown";
      const state = order.shippingAddress?.state || "Unknown";
      const key = `${city}, ${state}`;
      if (!cityMap[key]) {
        cityMap[key] = { city, state, orders: 0, revenue: 0 };
      }
      cityMap[key].orders += 1;
      cityMap[key].revenue += order.totalAmount || 0;
    });

    const heatmapData = Object.values(cityMap).sort((a, b) => b.orders - a.orders);

    res.json({
      totalLocations: heatmapData.length,
      data: heatmapData,
    });
  } catch (err) {
    console.error("Geo heatmap error:", err);
    res.status(500).json({ error: "Failed to generate heatmap" });
  }
});

// ─── P&L Breakdown ───
router.get("/pnl", async (req, res) => {
  try {
    const period = req.query.period || "month"; // day, week, month, quarter, year
    const now = new Date();
    let start = new Date();

    switch (period) {
      case "day": start.setHours(0, 0, 0, 0); break;
      case "week": start.setDate(start.getDate() - 7); break;
      case "month": start.setMonth(start.getMonth() - 1); break;
      case "quarter": start.setMonth(start.getMonth() - 3); break;
      case "year": start.setFullYear(start.getFullYear() - 1); break;
    }

    const orders = await Order.find({ createdAt: { $gte: start }, status: { $ne: "Cancelled" } }).lean();

    // Revenue
    const grossRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalDiscount = orders.reduce((sum, o) => sum + (o.discount || 0) + (o.couponDiscount || 0), 0);
    const netRevenue = grossRevenue;

    // COGS (from buyingPrice in items)
    let totalCOGS = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        totalCOGS += (item.buyingPrice || 0) * (item.qty || 1);
      });
    });

    const grossProfit = netRevenue - totalCOGS;

    // Tax
    const totalTax = orders.reduce((sum, o) => sum + (o.taxPrice || 0), 0);

    // Shipping costs (revenue from delivery fees)
    const shippingRevenue = orders.reduce((sum, o) => sum + (o.shippingPrice || 0), 0);

    // Refunds
    const refunds = orders
      .filter(o => o.refundStatus === "Completed" || o.refundStatus === "Processed")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      period,
      startDate: start,
      endDate: now,
      totalOrders: orders.length,
      pnl: {
        grossRevenue,
        discounts: totalDiscount,
        netRevenue,
        cogs: totalCOGS,
        grossProfit,
        grossMarginPct: netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 100) : 0,
        shippingRevenue,
        taxCollected: totalTax,
        refunds,
        netProfit: grossProfit - refunds, // Simplified; expenses added later
      },
      breakdown: {
        avgOrderValue: orders.length > 0 ? Math.round(grossRevenue / orders.length) : 0,
        avgProfitPerOrder: orders.length > 0 ? Math.round(grossProfit / orders.length) : 0,
      }
    });
  } catch (err) {
    console.error("P&L error:", err);
    res.status(500).json({ error: "Failed to generate P&L" });
  }
});

// ─── Revenue Goals ───
router.get("/goals", async (req, res) => {
  try {
    const goals = await RevenueGoal.find({ endDate: { $gte: new Date() } }).sort({ createdAt: -1 });
    
    // Update current progress for each goal
    const enrichedGoals = await Promise.all(goals.map(async (goal) => {
      let current = 0;
      if (goal.type === "revenue") {
        const orders = await Order.find({
          createdAt: { $gte: goal.startDate, $lte: goal.endDate },
          status: { $ne: "Cancelled" }
        });
        current = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      } else if (goal.type === "orders") {
        current = await Order.countDocuments({
          createdAt: { $gte: goal.startDate, $lte: goal.endDate },
          status: { $ne: "Cancelled" }
        });
      } else if (goal.type === "customers") {
        current = await User.countDocuments({
          createdAt: { $gte: goal.startDate, $lte: goal.endDate }
        });
      }

      return {
        ...goal.toObject(),
        current,
        progressPct: goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0,
        isAchieved: current >= goal.target,
      };
    }));

    res.json(enrichedGoals);
  } catch (err) {
    console.error("Goals error:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.post("/goals", async (req, res) => {
  try {
    const goal = await RevenueGoal.create(req.body);
    res.status(201).json(goal);
  } catch (err) {
    console.error("Create goal error:", err);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// ─── Period Comparison ───
router.get("/comparison", async (req, res) => {
  try {
    const periodDays = parseInt(req.query.days) || 7;
    const now = new Date();
    
    // Current period
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - periodDays);
    
    // Previous period
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - periodDays);

    const [currentOrders, previousOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: currentStart, $lte: now }, status: { $ne: "Cancelled" } }).lean(),
      Order.find({ createdAt: { $gte: previousStart, $lt: currentStart }, status: { $ne: "Cancelled" } }).lean(),
    ]);

    const calcStats = (orders) => ({
      revenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      orders: orders.length,
      avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (o.totalAmount || 0), 0) / orders.length) : 0,
      uniqueCustomers: new Set(orders.map(o => o.user?.toString())).size,
    });

    const current = calcStats(currentOrders);
    const previous = calcStats(previousOrders);

    const calcChange = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

    res.json({
      periodDays,
      current: { ...current, startDate: currentStart, endDate: now },
      previous: { ...previous, startDate: previousStart, endDate: currentStart },
      changes: {
        revenue: calcChange(current.revenue, previous.revenue),
        orders: calcChange(current.orders, previous.orders),
        avgOrderValue: calcChange(current.avgOrderValue, previous.avgOrderValue),
        uniqueCustomers: calcChange(current.uniqueCustomers, previous.uniqueCustomers),
      },
    });
  } catch (err) {
    console.error("Comparison error:", err);
    res.status(500).json({ error: "Failed to generate comparison" });
  }
});

// ─── Revenue Timeline (for charts) ───
router.get("/revenue-timeline", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const timeline = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const orders = await Order.find({
        createdAt: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "Cancelled" }
      }).lean();

      timeline.push({
        date: dayStart.toISOString().slice(0, 10),
        revenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        orders: orders.length,
        avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (o.totalAmount || 0), 0) / orders.length) : 0,
      });
    }

    res.json(timeline);
  } catch (err) {
    console.error("Revenue timeline error:", err);
    res.status(500).json({ error: "Failed to generate timeline" });
  }
});

export default router;
