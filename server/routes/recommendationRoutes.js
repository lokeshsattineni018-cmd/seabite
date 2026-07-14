import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = express.Router();

// ── GET /api/recommendations/co-occurrence/:productId ──
// Find products frequently bought together with the given product
router.get("/co-occurrence/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = Number(req.query.limit) || 4;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const targetId = new mongoose.Types.ObjectId(productId);

    // Find orders containing this product, then find what else was ordered
    const coProducts = await Order.aggregate([
      { $match: { "items.productId": { $exists: true } } },
      { $unwind: "$items" },
      { $group: { _id: "$_id", products: { $push: "$items.productId" } } },
      { $match: { products: { $in: [targetId] } } },
      { $unwind: "$products" },
      { $match: { products: { $ne: targetId } } },
      { $group: { _id: "$products", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    if (coProducts.length === 0) {
      // Fallback: return trending products from same category
      const sourceProduct = await Product.findById(productId).select("category").lean();
      const fallback = await Product.find({
        _id: { $ne: targetId },
        active: true,
        category: sourceProduct?.category,
      }).select("-buyingPrice -waitlist").sort({ numReviews: -1 }).limit(limit).lean();
      return res.json(fallback);
    }

    const productIds = coProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds }, active: true }).select("-buyingPrice -waitlist").lean();

    // Maintain the sorted order
    const sorted = productIds
      .map(id => products.find(p => p._id.toString() === id.toString()))
      .filter(Boolean);

    res.json(sorted);
  } catch (err) {
    console.error("Co-occurrence error:", err);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
});

// ── GET /api/recommendations/cart-upsell ──
// Suggest products based on current cart items
router.get("/cart-upsell", async (req, res) => {
  try {
    const cartIds = req.query.ids ? req.query.ids.split(",") : [];
    const limit = Number(req.query.limit) || 3;

    const validCartIds = cartIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (validCartIds.length === 0) {
      const trending = await Product.find({ active: true }).select("-buyingPrice -waitlist").sort({ numReviews: -1 }).limit(limit).lean();
      return res.json(trending);
    }

    // Find products co-purchased with ANY of the cart items
    const coProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$_id", products: { $push: "$items.productId" } } },
      { $match: { products: { $in: validCartIds } } },
      { $unwind: "$products" },
      { $match: { products: { $nin: validCartIds } } },
      { $group: { _id: "$products", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    if (coProducts.length === 0) {
      const fallback = await Product.find({ _id: { $nin: validCartIds }, active: true })
        .select("-buyingPrice -waitlist").sort({ numReviews: -1 }).limit(limit).lean();
      return res.json(fallback);
    }

    const productIds = coProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds }, active: true }).select("-buyingPrice -waitlist").lean();
    res.json(products);
  } catch (err) {
    console.error("Cart upsell error:", err);
    res.status(500).json({ message: "Failed to get upsell suggestions" });
  }
});

export default router;
