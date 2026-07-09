import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";

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

    const activeUsersBefore = await Order.distinct("user", { createdAt: { $lt: thirtyDaysAgo } });
    const recentActiveUsers = await Order.distinct("user", { createdAt: { $gte: thirtyDaysAgo } });
    const recentActiveSet = new Set(recentActiveUsers.map(id => id.toString()));

    const atRiskUserIds = activeUsersBefore.filter(id => !recentActiveSet.has(id.toString()));

    const atRiskUsers = await User.find({ _id: { $in: atRiskUserIds.slice(0, 50) } })
      .select("name email phone loyaltyTier lifetimeOrderValue lifetimeOrderCount lastStreakDate createdAt")
      .lean();

    const enriched = await Promise.all(atRiskUsers.map(async (user) => {
      const lastOrder = await Order.findOne({ user: user._id }).sort({ createdAt: -1 }).select("createdAt totalAmount").lean();
      const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)) : 999;
      
      let riskScore = 0;
      if (daysSinceLastOrder > 90) riskScore = 95;
      else if (daysSinceLastOrder > 60) riskScore = 80;
      else if (daysSinceLastOrder > 45) riskScore = 60;
      else riskScore = 40;

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

export default router;
