import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// ─── AI "For You" Feed ───
router.get("/for-you", async (req, res) => {
  try {
    const products = await Product.find({ active: true }).select("-buyingPrice -waitlist").limit(8).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate For You feed" });
  }
});

// ─── Weather-based recommendations ───
router.get("/weather-picks", async (req, res) => {
  try {
    const { weather = "sunny" } = req.query;
    
    // Pick different categories based on simulated weather
    let category = "Seafood";
    if (weather.toLowerCase() === "rainy" || weather.toLowerCase() === "cold") {
      category = "Soup Cuts"; // Soups/Stew cuts
    } else if (weather.toLowerCase() === "hot") {
      category = "Fillets"; // Easy grill fillets
    }

    const products = await Product.find({ 
      active: true,
      $or: [
        { category },
        { tags: { $in: [weather] } }
      ]
    }).select("-buyingPrice -waitlist").limit(4).lean();

    // Fallback if none found
    if (products.length === 0) {
      const fallback = await Product.find({ active: true }).select("-buyingPrice -waitlist").limit(4).lean();
      return res.json({ weather, products: fallback, message: "Standard fresh picks for today" });
    }

    res.json({
      weather,
      products,
      message: weather === "rainy" 
        ? "Cozy rainy day? Perfect ingredients for warm fish stew!"
        : "Hot day? Easy-to-grill fish fillets for a light meal!"
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get weather picks" });
  }
});

export default router;
