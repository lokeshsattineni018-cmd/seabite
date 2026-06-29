import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

const router = express.Router();

// ─── Anomaly Detection ───
router.get("/anomalies", async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    const anomalies = [];

    // 1. Return spike detection
    const todayReturns = await Order.countDocuments({ 
      "returnRequest.status": { $ne: "none" },
      "returnRequest.requestedAt": { $gte: today }
    });
    const avgDailyReturns = await Order.countDocuments({
      "returnRequest.status": { $ne: "none" },
      "returnRequest.requestedAt": { $gte: lastWeek }
    }) / 7;

    if (todayReturns > avgDailyReturns * 2 && todayReturns > 2) {
      anomalies.push({
        type: "return_spike",
        severity: "high",
        title: "Return Requests Spiked",
        description: `${todayReturns} returns today vs ${Math.round(avgDailyReturns)} daily average (${Math.round((todayReturns / Math.max(avgDailyReturns, 1)) * 100)}% increase)`,
        metric: todayReturns,
        baseline: Math.round(avgDailyReturns),
        icon: "📦",
        actionUrl: "/admin/orders?filter=returns"
      });
    }

    // 2. Revenue anomaly
    const todayOrders = await Order.find({ createdAt: { $gte: today }, status: { $ne: "Cancelled" } });
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const lastWeekOrders = await Order.find({ createdAt: { $gte: lastWeek, $lt: today }, status: { $ne: "Cancelled" } });
    const avgDailyRevenue = lastWeekOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) / 7;

    if (avgDailyRevenue > 0 && todayRevenue < avgDailyRevenue * 0.5) {
      anomalies.push({
        type: "revenue_drop",
        severity: "critical",
        title: "Revenue Significantly Below Average",
        description: `₹${todayRevenue.toLocaleString()} today vs ₹${Math.round(avgDailyRevenue).toLocaleString()} daily average`,
        metric: todayRevenue,
        baseline: Math.round(avgDailyRevenue),
        icon: "📉",
        actionUrl: "/admin/analytics"
      });
    }

    // 3. Cancellation rate spike
    const todayCancelled = await Order.countDocuments({ status: "Cancelled", updatedAt: { $gte: today } });
    const todayTotal = todayOrders.length + todayCancelled;
    const cancelRate = todayTotal > 0 ? (todayCancelled / todayTotal) * 100 : 0;
    if (cancelRate > 20 && todayCancelled > 3) {
      anomalies.push({
        type: "cancel_spike",
        severity: "high",
        title: "High Cancellation Rate",
        description: `${Math.round(cancelRate)}% cancellation rate today (${todayCancelled} of ${todayTotal} orders)`,
        metric: cancelRate,
        icon: "❌",
        actionUrl: "/admin/orders?filter=cancelled"
      });
    }

    // 4. Unusual order volume (spike)
    if (todayOrders.length > avgDailyRevenue > 0 && todayOrders.length > (lastWeekOrders.length / 7) * 2.5) {
      anomalies.push({
        type: "order_surge",
        severity: "info",
        title: "Order Volume Surge Detected",
        description: `${todayOrders.length} orders today — ${Math.round((todayOrders.length / Math.max(lastWeekOrders.length / 7, 1)) * 100)}% above average`,
        metric: todayOrders.length,
        icon: "🚀",
        actionUrl: "/admin/orders"
      });
    }

    // 5. Low stock critical
    const criticalStock = await Product.find({ countInStock: { $lte: 2 }, active: true }).select("name countInStock").lean();
    if (criticalStock.length > 0) {
      anomalies.push({
        type: "critical_stock",
        severity: "warning",
        title: `${criticalStock.length} Products Critically Low`,
        description: criticalStock.slice(0, 3).map(p => `${p.name} (${p.countInStock} left)`).join(", "),
        metric: criticalStock.length,
        products: criticalStock.slice(0, 5),
        icon: "⚠️",
        actionUrl: "/admin/inventory-alerts"
      });
    }

    res.json({ anomalies, generatedAt: new Date() });
  } catch (err) {
    console.error("Anomaly detection error:", err);
    res.status(500).json({ error: "Failed to detect anomalies" });
  }
});

// ─── Churn Risk Prediction ───
router.get("/churn-risk", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Users who ordered before but not in the last 30 days
    const activeUsersBefore = await Order.distinct("user", { createdAt: { $lt: thirtyDaysAgo } });
    const recentActiveUsers = await Order.distinct("user", { createdAt: { $gte: thirtyDaysAgo } });
    const recentActiveSet = new Set(recentActiveUsers.map(id => id.toString()));

    const atRiskUserIds = activeUsersBefore.filter(id => !recentActiveSet.has(id.toString()));

    // Get user details with order history
    const atRiskUsers = await User.find({ _id: { $in: atRiskUserIds.slice(0, 50) } })
      .select("name email phone loyaltyTier lifetimeOrderValue lifetimeOrderCount lastStreakDate createdAt")
      .lean();

    // Enrich with last order info
    const enriched = await Promise.all(atRiskUsers.map(async (user) => {
      const lastOrder = await Order.findOne({ user: user._id }).sort({ createdAt: -1 }).select("createdAt totalAmount").lean();
      const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)) : 999;
      
      // Calculate risk score (higher = more at risk)
      let riskScore = 0;
      if (daysSinceLastOrder > 90) riskScore = 95;
      else if (daysSinceLastOrder > 60) riskScore = 80;
      else if (daysSinceLastOrder > 45) riskScore = 60;
      else riskScore = 40;

      // Higher LTV users at risk = higher priority
      const priority = (user.lifetimeOrderValue || 0) > 5000 ? "high" : (user.lifetimeOrderValue || 0) > 1000 ? "medium" : "low";

      return {
        ...user,
        lastOrderDate: lastOrder?.createdAt,
        lastOrderAmount: lastOrder?.totalAmount,
        daysSinceLastOrder,
        riskScore,
        priority,
        riskLevel: riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : "medium",
        suggestedAction: riskScore >= 80 
          ? "Send personalized win-back email with 15% discount"
          : riskScore >= 60 
            ? "Send 'We miss you' WhatsApp message"
            : "Include in next promotional campaign"
      };
    }));

    // Sort by risk score (highest first)
    enriched.sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      totalAtRisk: enriched.length,
      critical: enriched.filter(u => u.riskLevel === "critical").length,
      high: enriched.filter(u => u.riskLevel === "high").length,
      medium: enriched.filter(u => u.riskLevel === "medium").length,
      potentialRevenueLoss: enriched.reduce((s, u) => s + (u.lifetimeOrderValue || 0) / Math.max(u.lifetimeOrderCount || 1, 1), 0),
      users: enriched,
    });
  } catch (err) {
    console.error("Churn risk error:", err);
    res.status(500).json({ error: "Failed to calculate churn risk" });
  }
});

// ─── Sentiment Analysis (on reviews) ───
router.get("/sentiment", async (req, res) => {
  try {
    const products = await Product.find({ "reviews.0": { $exists: true } })
      .select("name reviews rating numReviews")
      .lean();

    let totalPositive = 0, totalNeutral = 0, totalNegative = 0;
    const flaggedProducts = [];

    const sentimentData = products.map(product => {
      let positive = 0, neutral = 0, negative = 0;
      
      product.reviews.forEach(review => {
        if (review.rating >= 4) { positive++; totalPositive++; }
        else if (review.rating === 3) { neutral++; totalNeutral++; }
        else { negative++; totalNegative++; }
      });

      const negativeRate = product.reviews.length > 0 ? (negative / product.reviews.length) * 100 : 0;
      
      if (negativeRate > 40 && product.reviews.length >= 3) {
        flaggedProducts.push({
          productId: product._id,
          name: product.name,
          negativeRate: Math.round(negativeRate),
          totalReviews: product.reviews.length,
          avgRating: product.rating,
          recentNegative: product.reviews
            .filter(r => r.rating <= 2)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .map(r => ({ comment: r.comment, rating: r.rating, date: r.createdAt }))
        });
      }

      return { productId: product._id, name: product.name, positive, neutral, negative, total: product.reviews.length };
    });

    const totalReviews = totalPositive + totalNeutral + totalNegative;

    res.json({
      overview: {
        totalReviews,
        positive: totalPositive,
        neutral: totalNeutral,
        negative: totalNegative,
        sentimentScore: totalReviews > 0 ? Math.round(((totalPositive * 1 + totalNeutral * 0.5) / totalReviews) * 100) : 0,
      },
      flaggedProducts: flaggedProducts.sort((a, b) => b.negativeRate - a.negativeRate),
      byProduct: sentimentData.sort((a, b) => b.negative - a.negative).slice(0, 20),
    });
  } catch (err) {
    console.error("Sentiment analysis error:", err);
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

// ─── Smart Reorder Suggestions ───
router.get("/reorder-suggestions", async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      active: true,
      $expr: { $lte: ["$countInStock", "$stockThreshold"] }
    }).select("name countInStock stockThreshold category basePrice buyingPrice").lean();

    // Calculate average daily sales for each product
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const suggestions = await Promise.all(lowStockProducts.map(async (product) => {
      const orders = await Order.find({
        "items.productId": product._id,
        createdAt: { $gte: thirtyDaysAgo },
        status: { $ne: "Cancelled" }
      }).lean();

      let totalSold = 0;
      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.productId?.toString() === product._id.toString()) {
            totalSold += item.qty || 1;
          }
        });
      });

      const avgDailySales = totalSold / 30;
      const daysUntilStockout = avgDailySales > 0 ? Math.round(product.countInStock / avgDailySales) : 999;
      const suggestedReorderQty = Math.max(Math.ceil(avgDailySales * 14), 10); // 2 weeks supply or minimum 10

      return {
        ...product,
        avgDailySales: Math.round(avgDailySales * 10) / 10,
        totalSold30d: totalSold,
        daysUntilStockout,
        urgency: daysUntilStockout <= 2 ? "critical" : daysUntilStockout <= 5 ? "high" : "medium",
        suggestedReorderQty,
        estimatedCost: suggestedReorderQty * (product.buyingPrice || product.basePrice * 0.6),
      };
    }));

    suggestions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    res.json({
      totalSuggestions: suggestions.length,
      critical: suggestions.filter(s => s.urgency === "critical").length,
      totalEstimatedCost: suggestions.reduce((s, p) => s + p.estimatedCost, 0),
      suggestions,
    });
  } catch (err) {
    console.error("Reorder suggestions error:", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

// ─── Auto-generate Product Description (Gemini) ───
router.post("/generate-description", async (req, res) => {
  try {
    const { productName, category, price, features } = req.body;
    
    // Use Gemini API if available
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate a compelling, SEO-friendly product description for a seafood e-commerce store called SeaBite.

Product: ${productName}
Category: ${category || "Seafood"}
Price: ₹${price || "N/A"}
Features: ${features || "Fresh, premium quality"}

Requirements:
- 2-3 short paragraphs
- Highlight freshness, quality, and taste
- Include cooking suggestions
- Mention SeaBite's quality guarantee
- Keep it under 150 words
- Tone: Premium yet approachable`;

    const result = await model.generateContent(prompt);
    const description = result.response.text();

    res.json({ description, generatedAt: new Date() });
  } catch (err) {
    console.error("Description generation error:", err);
    res.status(500).json({ error: "Failed to generate description", fallback: `Premium ${req.body.productName || "seafood"} sourced fresh daily. Our quality guarantee ensures you receive the finest catch, perfect for your kitchen.` });
  }
});

// ─── Revenue Forecast ───
router.get("/forecast", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const historical = [];

    // Get last 90 days of revenue data
    for (let i = 89; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const orders = await Order.find({
        createdAt: { $gte: dayStart, $lt: dayEnd },
        status: { $ne: "Cancelled" }
      }).lean();

      historical.push({
        date: dayStart.toISOString().slice(0, 10),
        revenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0),
        orders: orders.length,
      });
    }

    // Simple moving average forecast
    const recentWindow = historical.slice(-14);
    const avgRevenue = recentWindow.reduce((s, d) => s + d.revenue, 0) / recentWindow.length;
    const avgOrders = recentWindow.reduce((s, d) => s + d.orders, 0) / recentWindow.length;

    // Detect trend (simple linear regression on last 30 days)
    const last30 = historical.slice(-30);
    const n = last30.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    last30.forEach((d, i) => { sumX += i; sumY += d.revenue; sumXY += i * d.revenue; sumX2 += i * i; });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trend = slope > 0 ? "upward" : slope < 0 ? "downward" : "flat";

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();
      
      // Weekend adjustment (weekends usually higher for food delivery)
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1;
      
      const projectedRevenue = Math.round((avgRevenue + slope * i) * weekendMultiplier);
      const projectedOrders = Math.round((avgOrders + (slope / (avgRevenue / avgOrders)) * i) * weekendMultiplier);

      forecast.push({
        date: forecastDate.toISOString().slice(0, 10),
        revenue: Math.max(0, projectedRevenue),
        orders: Math.max(0, projectedOrders),
        confidence: Math.max(50, 90 - i * 1.5), // Confidence decreases with time
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    res.json({
      historical: historical.slice(-30),
      forecast,
      trend,
      avgDailyRevenue: Math.round(avgRevenue),
      avgDailyOrders: Math.round(avgOrders),
      projected30dRevenue: forecast.slice(0, 30).reduce((s, d) => s + d.revenue, 0),
      growthRate: trend === "upward" ? `+${Math.round(slope / avgRevenue * 100)}% daily` : trend === "downward" ? `${Math.round(slope / avgRevenue * 100)}% daily` : "Flat",
    });
  } catch (err) {
    console.error("Forecast error:", err);
    res.status(500).json({ error: "Failed to generate forecast" });
  }
});

export default router;
