import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import upload from "../config/multerConfig.js";
import { protect } from "../middleware/authMiddleware.js";
import SearchInsight from "../models/SearchInsight.js";

const router = express.Router();

// 🟢 NEW: GET TOP RECENT REVIEWS FOR HOME PAGE
router.get("/top-reviews", async (req, res) => {
  try {
    // Fetch products that have at least one review
    const products = await Product.find({ numReviews: { $gt: 0 } })
      .select("name reviews")
      .limit(10);

    let allReviews = [];

    // Flatten reviews into a single list with product context
    products.forEach((product) => {
      product.reviews.forEach((review) => {
        allReviews.push({
          _id: review._id,
          productName: product.name,
          userName: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        });
      });
    });

    // Sort by newest and take the top 6
    const latestReviews = allReviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    res.json(latestReviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// --- GET ALL PRODUCTS ---
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, inStock, sort } = req.query;
    let query = { active: true };

    // Category Filter
    if (category && category !== "all") query.category = { $regex: `^${category}$`, $options: "i" };

    // Search Filter
    if (search) query.name = { $regex: search, $options: "i" };

    // Price Range Filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    // Stock Filter (Assuming "out" means out of stock)
    if (inStock === "true") {
      query.stock = { $ne: "out" };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest
    if (sort === "price-asc") sortOptions = { basePrice: 1 };
    if (sort === "price-desc") sortOptions = { basePrice: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "newest") sortOptions = { createdAt: -1 };

    const products = await Product.find(query).sort(sortOptions);

    // ✅ Enterprise: Log Search Insight
    if (search) {
      try {
        await SearchInsight.findOneAndUpdate(
          { query: search.toLowerCase().trim() },
          {
            $inc: { count: 1 },
            found: products.length > 0,
            lastSearched: Date.now()
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Search Insight Error:", err);
      }
    }

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET SINGLE PRODUCT WITH RELATED ITEMS ---
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🟢 NEW: Fetch Related Products (Same category, excluding current)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      active: true
    })
      .select('name image basePrice stock averageRating')
      .limit(3);

    res.json({ ...product.toObject(), relatedProducts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 NEW: SMART SEARCH AUTOSUGGEST
router.get("/search/suggest", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const suggestions = await Product.find({
      name: { $regex: q, $options: "i" },
      active: true
    })
      .select("name image category basePrice")
      .limit(5);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

// --- CREATE PRODUCT (ADMIN) ---
router.post("/", upload.single('image'), async (req, res) => {
  const { name, category, desc, trending, stock, basePrice, unit } = req.body;
  if (!req.file) return res.status(400).json({ message: "Image required" });

  try {
    const product = await Product.create({
      name, category, desc, stock, unit,
      basePrice: parseFloat(basePrice),
      trending: trending === 'true',
      image: `/uploads/${req.file.filename}`,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🟢 ADD OR UPDATE REVIEW ROUTE (Restricted to Valid Buyers)
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    // 1. Verify Purchase & Delivery
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      isDelivered: true,
      "items.productId": req.params.id,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: "You can only review products you have purchased and received."
      });
    }

    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        alreadyReviewed.rating = Number(rating);
        alreadyReviewed.comment = comment;
      } else {
        const review = {
          name: req.user.name,
          rating: Number(rating),
          comment,
          user: req.user._id,
        };
        product.reviews.push(review);
      }

      product.numReviews = product.reviews.length;
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Review Saved Successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🟢 CHECK REVIEW ELIGIBILITY
router.get("/:id/can-review", protect, async (req, res) => {
  try {
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      isDelivered: true,
      "items.productId": req.params.id,
    });

    res.json({ canReview: !!hasPurchased });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🟡 ENTERPRISE: JOIN WAITLIST
router.post("/:id/waitlist", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if user is already in waitlist
    if (product.waitlist.includes(req.user._id)) {
      return res.status(400).json({ message: "You are already on the waitlist for this product" });
    }

    product.waitlist.push(req.user._id);
    await product.save();

    res.json({ message: "Successfully joined the waitlist! We'll notify you when it's back in stock." });
  } catch (err) {
    res.status(500).json({ message: "Failed to join waitlist" });
  }
});

export default router;