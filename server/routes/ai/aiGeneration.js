import express from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";

const router = express.Router();

// ─── Smart Reorder Suggestions ───
router.get("/reorder-suggestions", async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      active: true,
      $expr: { $lte: ["$countInStock", "$stockThreshold"] }
    }).select("name countInStock stockThreshold category basePrice buyingPrice").lean();

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
      const suggestedReorderQty = Math.max(Math.ceil(avgDailySales * 14), 10);

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

    const recentWindow = historical.slice(-14);
    const avgRevenue = recentWindow.reduce((s, d) => s + d.revenue, 0) / recentWindow.length;
    const avgOrders = recentWindow.reduce((s, d) => s + d.orders, 0) / recentWindow.length;

    const last30 = historical.slice(-30);
    const n = last30.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    last30.forEach((d, i) => { sumX += i; sumY += d.revenue; sumXY += i * d.revenue; sumX2 += i * i; });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trend = slope > 0 ? "upward" : slope < 0 ? "downward" : "flat";

    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();
      
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1;
      
      const projectedRevenue = Math.round((avgRevenue + slope * i) * weekendMultiplier);
      const projectedOrders = Math.round((avgOrders + (slope / (avgRevenue / avgOrders)) * i) * weekendMultiplier);

      forecast.push({
        date: forecastDate.toISOString().slice(0, 10),
        revenue: Math.max(0, projectedRevenue),
        orders: Math.max(0, projectedOrders),
        confidence: Math.max(50, 90 - i * 1.5),
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
