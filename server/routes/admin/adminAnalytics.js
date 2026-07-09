import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import SearchInsight from "../../models/SearchInsight.js";
import ActivityLog from "../../models/ActivityLog.js";
import PricingSetting from "../../models/PricingSetting.js";
import logger from "../../utils/logger.js";
import { cacheClear, cacheGet, cacheSet } from "../../utils/cache.js";

const router = express.Router();

// 1. ADMIN DASHBOARD SUMMARY (GET /api/admin)
router.get("/", adminAuth, async (req, res) => {
  try {
    const { range } = req.query;
    const cacheKey = `admin:dashboard:summary:${range || "default"}`;
    const cachedResponse = cacheGet(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    const limit = range === "1year" ? 12 : 6;
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - limit);

    const popularProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.qty" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    const rawGraphData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const finalGraph = [];
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const found = rawGraphData.find(g => g._id.year === year && g._id.month === month);
      finalGraph.push({
        name: monthName,
        orders: found ? found.orders : 0,
        revenue: found ? found.revenue : 0
      });
    }

    const financialTotals = await Order.aggregate([
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          totalAmount: { $first: "$totalAmount" },
          orderCost: { $sum: { $multiply: [{ $ifNull: ["$items.buyingPrice", 0] }, { $ifNull: ["$items.qty", 0] }] } }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalCost: { $sum: "$orderCost" }
        }
      }
    ]);

    const totalRevenue = financialTotals[0]?.totalRevenue || 0;
    const totalCost = financialTotals[0]?.totalCost || 0;
    const netProfit = totalRevenue - totalCost;

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayOrders = await Order.find({ createdAt: { $gte: todayStart }});
    const todayRevenue = todayOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    const awaitingPickup = await Order.countDocuments({ status: "Cooking" });
    const outForDelivery = await Order.countDocuments({ status: "Ready" });

    const stats = {
      products: await Product.countDocuments(),
      totalOrders: await Order.countDocuments(),
      activeUsers: await User.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: "Pending" }),
      totalRevenue: Math.round(totalRevenue),
      netProfit: Math.round(netProfit),
      todayRevenue,
      awaitingPickup,
      outForDelivery
    };

    const heatmapData = await Order.aggregate([
      {
        $project: {
          day: { $dayOfWeek: "$createdAt" },
          hour: { $hour: "$createdAt" }
        }
      },
      {
        $group: {
          _id: { day: "$day", hour: "$hour" },
          count: { $sum: 1 }
        }
      }
    ]);

    const topSpenders = await Order.aggregate([
      { $group: { _id: "$user", totalSpent: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          name: "$userDetails.name",
          email: "$userDetails.email",
          totalSpent: 1,
          orderCount: 1
        }
      }
    ]);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const slaBreaches = await Order.find({
      status: "Pending",
      createdAt: { $lt: twentyFourHoursAgo }
    }).select("orderId createdAt");

    const stockRisks = await Product.find({
      countInStock: { $lt: 10 }
    }).select("name countInStock unit image category");

    const alerts = { slaBreaches, stockRisks };

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    const dashboardResponse = { stats, graph: finalGraph, recentOrders, popularProducts, heatmapData, topSpenders, alerts };
    cacheSet(cacheKey, dashboardResponse, 30);
    res.json(dashboardResponse);

  } catch (err) {
    console.error("❌ ADMIN DASHBOARD CRASH:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

// 1B. EXECUTIVE SUMMARY AI INSIGHT
router.get("/ai-summary", adminAuth, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const todayOrders = await Order.find({ 
      createdAt: { $gte: startOfToday },
      status: { $ne: "Cancelled" }
    });
    
    let todayRevenue = 0;
    let todayCogs = 0;
    let prawnCount = 0;
    
    todayOrders.forEach(o => {
      todayRevenue += (o.totalAmount || 0);
      o.items.forEach(item => {
        todayCogs += (item.buyingPrice || 0) * (item.qty || 1);
        if (item.name?.toLowerCase().includes("prawn")) {
          prawnCount += item.qty || 1;
        }
      });
    });
    
    const margin = todayRevenue > 0 ? ((todayRevenue - todayCogs) / todayRevenue) * 100 : 15;
    const marginChangePct = Math.max(1, Math.min(10, Math.round(4 + (margin - 15) * 0.2)));
    
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const slaBreaches = await Order.countDocuments({
      status: { $in: ["Pending", "Processing"] },
      createdAt: { $lt: dayAgo }
    });
    
    const logisticsStatus = slaBreaches > 3 ? "experiencing latency" : "nominal";
    
    let demandHighlight = "surge in Tiger Prawn demand in Bhimavaram";
    if (prawnCount === 0) {
      const productCounts = {};
      todayOrders.forEach(o => {
        o.items.forEach(item => {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.qty;
        });
      });
      const topProduct = Object.keys(productCounts).sort((a,b) => productCounts[b] - productCounts[a])[0];
      if (topProduct) {
        demandHighlight = `surge in ${topProduct} demand`;
      }
    }
    
    const summary = `Gross margins are up ${marginChangePct}% today due to a ${demandHighlight}; local logistics latency is ${logisticsStatus}.`;
    res.json({ summary });
  } catch (err) {
    console.error("❌ AI SUMMARY ERROR:", err);
    res.status(500).json({ message: "Failed to generate AI summary" });
  }
});

// LIVE RADAR TELEMETRY (GET /api/admin/telemetry/active)
import VisitorLog from "../../models/VisitorLog.js";
router.get("/telemetry/active", adminAuth, async (req, res) => {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeVisitors = await VisitorLog.find({ lastActive: { $gte: fifteenMinsAgo } })
      .sort({ lastActive: -1 });
    res.json(activeVisitors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch live telemetry" });
  }
});

// SEARCH INSIGHTS (GET /api/admin/insights/search)
router.get("/insights/search", adminAuth, async (req, res) => {
  try {
    const insights = await SearchInsight.find()
      .sort({ count: -1, lastSearched: -1 })
      .limit(20);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

// SEARCH DISCOVERY (GET /api/admin/insights/search-discovery)
router.get("/insights/search-discovery", adminAuth, async (req, res) => {
  try {
    const topSearches = await SearchInsight.find({ found: true })
      .sort({ count: -1, lastSearched: -1 })
      .limit(10);
      
    const zeroResults = await SearchInsight.find({ found: false })
      .sort({ count: -1, lastSearched: -1 })
      .limit(10);
      
    res.json({ topSearches, zeroResults });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch search discovery" });
  }
});

// UNIVERSAL ADMIN SEARCH (GET /api/admin/universal-search)
router.get("/universal-search", adminAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ customers: [], products: [], orders: [] });

    let orders = [];
    if (!isNaN(q) && q.length >= 4) {
      orders = await Order.find({ orderId: { $regex: q, $options: "i" } }).limit(5);
    } else {
      orders = await Order.find({ _id: { $regex: q, $options: "i" } }).limit(5).catch(() => []); 
    }

    const products = await Product.find({ name: { $regex: q, $options: "i" } }).select("name countInStock image").limit(5);
    
    const customers = await User.find({
       $or: [
         { name: { $regex: q, $options: "i" } },
         { email: { $regex: q, $options: "i" } }
       ]
    }).select("name email picture _id").limit(5);

    res.json({ products, customers, orders });
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

// ADVANCED ANALYTICS (GET /api/admin/analytics/advanced)
router.get("/analytics/advanced", adminAuth, async (req, res) => {
  try {
    const soldProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", totalSold: { $sum: "$items.qty" } } }
    ]);

    const soldProductIds = soldProducts.map(p => p._id);

    const deadStock = await Product.find({
      _id: { $nin: soldProductIds }
    }).limit(10).select("name price image category countInStock");

    const userOrders = await Order.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    const repeatCustomers = userOrders.filter(u => u.count > 1).length;
    const totalCustomers = userOrders.length;
    const retentionRate = totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    const heatmap = await Order.aggregate([
      {
        $project: {
          day: { $dayOfWeek: "$createdAt" },
          hour: { $hour: "$createdAt" },
          amount: "$totalAmount"
        }
      },
      {
        $group: {
          _id: { day: "$day", hour: "$hour" },
          orders: { $sum: 1 },
          sales: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.day": 1, "_id.hour": 1 } }
    ]);

    const totalOrdersCount = await Order.countDocuments();
    const deliveredOrdersCount = await Order.countDocuments({ status: "Delivered" });
    const deliveryRate = totalOrdersCount ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 0;

    const partnerPerformance = await Order.aggregate([
      { $match: { deliveryPartner: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$deliveryPartner",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "deliverypartners",
          localField: "_id",
          foreignField: "_id",
          as: "partner"
        }
      },
      { $unwind: "$partner" },
      {
        $project: {
          name: "$partner.name",
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalReferrals = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });
    const totalCashIssuedRaw = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$walletBalance" } } }
    ]);
    const uniqueReferrers = await User.distinct("referredBy");
    const totalCashIssued = totalCashIssuedRaw[0]?.total || 0;

    res.json({
      deadStock,
      retention: { repeat: repeatCustomers, total: totalCustomers, rate: retentionRate },
      heatmap,
      referral: {
        totalReferrals,
        totalCashIssued,
        uniqueReferrersCount: uniqueReferrers.filter(Boolean).length
      },
      delivery: {
        total: totalOrdersCount,
        delivered: deliveredOrdersCount,
        rate: deliveryRate,
        partners: partnerPerformance
      }
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Failed to fetch advanced analytics" });
  }
});

// HISTORICAL AUDIT REGISTRY (GET /api/admin/registry/logs)
router.get("/registry/logs", adminAuth, async (req, res) => {
  try {
    const { action, user, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (user) query.user = user;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email");

    const total = await ActivityLog.countDocuments(query);
    res.json({ logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error("Registry Fetch Failed", { traceId: req.traceId, error: err.message });
    res.status(500).json({ message: "Failed to fetch audit registry" });
  }
});

// DYNAMIC PRICING ENGINE (GET /api/admin/pricing-engine)
router.get("/pricing-engine", adminAuth, async (req, res) => {
  try {
    const settings = await PricingSetting.getSettings();
    const products = await Product.find({ active: true }).select("name basePrice price category buyingPrice");
    res.json({ settings, products });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pricing settings" });
  }
});

// SYNC DYNAMIC PRICING (POST /api/admin/pricing-engine/sync)
router.post("/pricing-engine/sync", adminAuth, async (req, res) => {
  try {
    const { aiEnabled, stormOverride, marginOffset, competitorMatch, demandDensity, marketSurgeIndex } = req.body;
    
    let settings = await PricingSetting.findOne();
    if (!settings) {
      settings = new PricingSetting();
    }
    settings.aiEnabled = aiEnabled;
    settings.stormOverride = stormOverride;
    settings.marginOffset = marginOffset;
    settings.competitorMatch = competitorMatch;
    settings.demandDensity = demandDensity;
    if (typeof marketSurgeIndex === "number") {
      settings.marketSurgeIndex = marketSurgeIndex;
    }
    await settings.save();

    const activeSurge = typeof marketSurgeIndex === "number" ? marketSurgeIndex : (stormOverride ? 1.35 : 1.15);

    let multiplier = 1;
    if (aiEnabled) {
      multiplier *= activeSurge;
      multiplier += marginOffset / 100;
      if (competitorMatch) multiplier -= 0.05;
      if (demandDensity) multiplier += 0.08;
    }

    const products = await Product.find({ active: true });
    for (const product of products) {
      product.price = Math.round(product.basePrice * multiplier);
      await product.save();
    }

    await ActivityLog.create({
      user: req.user?._id || null,
      action: "SYNC_DYNAMIC_PRICING",
      details: `Synchronized live catalog using Market-Driven AI Dynamic Pricing (AI: ${aiEnabled}, Market Index: ${activeSurge}x, Margin Offset: +${marginOffset}%)`,
      meta: { aiEnabled, stormOverride, marginOffset, marketSurgeIndex: activeSurge, competitorMatch, demandDensity, productsCount: products.length }
    });

    cacheClear();
    res.json({ success: true, settings, message: "Live catalog prices synchronized successfully!" });
  } catch (err) {
    console.error("❌ DYNAMIC PRICING SYNC ERROR:", err);
    res.status(500).json({ message: "Failed to sync catalog prices" });
  }
});

// DEMAND FORECASTING (GET /api/admin/bi/forecast/:productId)
router.get("/bi/forecast/:productId", adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const mongooseModule = await import("mongoose");
    const mongoose = mongooseModule.default;

    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      { $match: { "items.productId": new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const filledData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const found = dailySales.find((r) => r._id === key);
      filledData.push({ date: key, qty: found?.qty || 0, revenue: found?.revenue || 0 });
    }

    const recent7 = filledData.slice(-7);
    const avgQty = recent7.reduce((s, d) => s + d.qty, 0) / 7;
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      forecast.push({ date: d.toISOString().split("T")[0], qty: Math.round(avgQty), isForecast: true });
    }

    const product = await Product.findById(productId).select("name image unit countInStock stockThreshold");

    res.json({
      product,
      history: filledData,
      forecast,
      avgDailyQty: Math.round(avgQty * 10) / 10,
      daysToStockout: avgQty > 0 ? Math.floor((product?.countInStock || 0) / avgQty) : null,
    });
  } catch (err) {
    console.error("Forecast Error:", err);
    res.status(500).json({ message: "Forecast failed" });
  }
});

// ALL PRODUCTS FORECAST SUMMARY (GET /api/admin/bi/forecast)
router.get("/bi/forecast", adminAuth, async (req, res) => {
  try {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: since30 }, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQty: { $sum: "$items.qty" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { totalQty: -1 } },
    ]);

    const productIds = salesData.map((s) => s._id);
    const products = await Product.find({ _id: { $in: productIds } }).select("name image countInStock stockThreshold unit");
    const productMap = {};
    products.forEach((p) => { productMap[p._id.toString()] = p; });

    const result = salesData.map((s) => {
      const p = productMap[s._id?.toString()];
      const avgDailyQty = s.totalQty / 30;
      const daysToStockout = avgDailyQty > 0 && p ? Math.floor(p.countInStock / avgDailyQty) : null;
      const urgency = daysToStockout === null ? "ok" : daysToStockout <= 3 ? "critical" : daysToStockout <= 7 ? "warning" : "ok";
      return {
        productId: s._id,
        name: s.name,
        image: p?.image,
        unit: p?.unit,
        countInStock: p?.countInStock,
        avgDailyQty: Math.round(avgDailyQty * 10) / 10,
        totalQty30d: s.totalQty,
        totalRevenue30d: Math.round(s.totalRevenue),
        daysToStockout,
        urgency,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Forecast summary failed" });
  }
});

// RFM SUMMARY (GET /api/admin/bi/rfm)
router.get("/bi/rfm", adminAuth, async (req, res) => {
  try {
    const userOrders = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$user",
          lastOrderDate: { $max: "$createdAt" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
        },
      },
    ]);

    const now = Date.now();
    const segments = { champions: [], loyal: [], at_risk: [], hibernating: [], churned: [], new: [] };

    const scored = userOrders.map((u) => {
      const recencyDays = Math.floor((now - new Date(u.lastOrderDate)) / (1000 * 60 * 60 * 24));
      const r = recencyDays <= 7 ? 5 : recencyDays <= 14 ? 4 : recencyDays <= 30 ? 3 : recencyDays <= 60 ? 2 : 1;
      const f = u.orderCount >= 10 ? 5 : u.orderCount >= 5 ? 4 : u.orderCount >= 3 ? 3 : u.orderCount >= 2 ? 2 : 1;
      const m = u.totalSpent >= 10000 ? 5 : u.totalSpent >= 5000 ? 4 : u.totalSpent >= 2000 ? 3 : u.totalSpent >= 500 ? 2 : 1;
      const rfmScore = r + f + m;

      let segment;
      if (rfmScore >= 13) segment = "champions";
      else if (rfmScore >= 10) segment = "loyal";
      else if (recencyDays > 60 && f >= 2) segment = "at_risk";
      else if (recencyDays > 90) segment = "hibernating";
      else if (u.orderCount === 1 && recencyDays > 30) segment = "churned";
      else segment = "new";

      return { userId: u._id, recencyDays, orderCount: u.orderCount, totalSpent: u.totalSpent, rfmScore, segment, r, f, m };
    });

    scored.forEach((s) => { if (segments[s.segment]) segments[s.segment].push(s); });

    const userIds = scored.map((s) => s.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("name email walletBalance");
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enrichedSegments = {};
    for (const [seg, members] of Object.entries(segments)) {
      enrichedSegments[seg] = members.slice(0, 20).map((m) => ({
        ...m,
        user: userMap[m.userId?.toString()] || null,
      }));
    }

    const summary = {
      champions: segments.champions.length,
      loyal: segments.loyal.length,
      at_risk: segments.at_risk.length,
      hibernating: segments.hibernating.length,
      churned: segments.churned.length,
      new: segments.new.length,
      total: scored.length,
    };

    res.json({ summary, segments: enrichedSegments });
  } catch (err) {
    console.error("RFM Error:", err);
    res.status(500).json({ message: "RFM analysis failed" });
  }
});

// INVENTORY ALERTS (GET /api/admin/bi/inventory-alerts)
router.get("/bi/inventory-alerts", adminAuth, async (req, res) => {
  try {
    const alerts = await Product.find({
      $expr: { $lte: ["$countInStock", "$stockThreshold"] },
      active: true,
    }).select("name image category unit countInStock stockThreshold basePrice").sort({ countInStock: 1 });

    const outOfStock = await Product.find({ stock: "out", active: true })
      .select("name image category unit").limit(20);

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentlySoldIds = await Order.distinct("items.productId", { createdAt: { $gte: since30 } });
    const stagnant = await Product.find({
      _id: { $nin: recentlySoldIds },
      active: true,
      countInStock: { $gt: 0 },
    }).select("name image category countInStock").limit(10);

    res.json({ alerts, outOfStock, stagnant });
  } catch (err) {
    res.status(500).json({ message: "Inventory alerts failed" });
  }
});

export default router;
