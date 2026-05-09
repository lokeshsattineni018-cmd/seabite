import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import upload from "../config/multerConfig.js";
import { protect } from "../middleware/authMiddleware.js";
import SearchInsight from "../models/SearchInsight.js";
import { getSettings } from "../models/Settings.js";
import { logActivity } from "../utils/activityLogger.js"; // 🟢 Added import

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
          images: review.images || [], // 🟢 Include review images
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

    // 🟢 FLASH SALE FILTER
    if (req.query.flashSale === "true") {
      query["flashSale.isFlashSale"] = true;
      query["flashSale.saleEndDate"] = { $gt: new Date() };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest
    if (sort === "price-asc") sortOptions = { basePrice: 1 };
    if (sort === "price-desc") sortOptions = { basePrice: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "newest") sortOptions = { createdAt: -1 };

    const products = await Product.find(query).sort(sortOptions);

    // ✅ Enterprise: Log Search Insight (ZRO: Zero-Result Optimization)
    if (search && search.trim().length > 2) {
      const sanitizedSearch = search.toLowerCase().trim();
      // Filter out common "test" junk
      const junk = ["hi", "h", "hello", "test", "hey"];
      if (!junk.includes(sanitizedSearch)) {
        try {
          await SearchInsight.findOneAndUpdate(
            { query: sanitizedSearch },
            {
              $inc: { count: 1 },
              $set: {
                found: products.length > 0,
                lastSearched: Date.now()
              }
            },
            { upsert: true, returnDocument: "after" }
          );

          // 🟢 WATCHTOWER LOGGING
          logActivity("SEARCH", `Searched for "${sanitizedSearch}"`, req, { results: products.length });

        } catch (err) {
          console.error("Search Insight Error:", err);
        }
      }
    }

    // 🟢 FETCH GLOBAL SETTINGS for Dynamic Pricing (Safe)
    let globalDiscount = 0;
    try {
      const settings = await getSettings();
      if (settings) globalDiscount = settings.globalDiscount || 0;
    } catch (err) {
      // console.error("Failed to fetch settings:", err);
    }

    res.json({ products, globalDiscount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simple Levenshtein Distance for "Did you mean?"
const levenshtein = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion/deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// 🟢 SMART SEARCH AUTOSUGGEST
router.get("/search/suggest", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ suggestions: [], globalDiscount: 0 });

    let suggestions = await Product.find({
      name: { $regex: q, $options: "i" },
      active: true
    })
      .select("name image category basePrice flashSale")
      .limit(5);

    // 🟢 "DID YOU MEAN?" LOGIC (If no results)
    if (suggestions.length === 0 && q.length > 2) {
      const allProducts = await Product.find({ active: true }).select("name image category basePrice flashSale");

      const fuzzyMatches = allProducts.map(p => ({
        ...p.toObject(),
        dist: levenshtein(q.toLowerCase(), p.name.toLowerCase())
      }))
        .filter(p => p.dist <= 3) // Allow up to 3 typos
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
        .map(p => ({ ...p, isDidYouMean: true }));

      if (fuzzyMatches.length > 0) {
        suggestions = fuzzyMatches;
      }
    }

    // Fetch Global Discount
    let globalDiscount = 0;
    try {
      const settings = await getSettings();
      if (settings) globalDiscount = settings.globalDiscount || 0;
    } catch (err) {}

    res.json({ suggestions, globalDiscount });
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

// 🟢 GET TRENDING SEARCHES
router.get("/search/trending", async (req, res) => {
  try {
    const trending = await SearchInsight.find({ found: true })
      .sort({ count: -1 })
      .limit(6)
      .select("query");
    res.json(trending.map(t => t.query));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trending searches" });
  }
});

// --- GET SINGLE PRODUCT ---
// --- GET SINGLE PRODUCT WITH RELATED ITEMS ---
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name');
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🟢 NEW: Fetch Related Products (Same category, excluding current)
    let relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      active: true
    })
      .select('name image basePrice stock averageRating')
      .limit(3);

    // 🟢 FALLBACK: If no related products in category, fetch random active products
    if (relatedProducts.length < 3) {
      const moreProducts = await Product.find({
        _id: { $ne: product._id, $nin: relatedProducts.map(p => p._id) },
        active: true
      })
        .select('name image basePrice stock averageRating')
        .limit(3 - relatedProducts.length);

      relatedProducts = [...relatedProducts, ...moreProducts];
    }

    // 🟢 FETCH GLOBAL SETTINGS (Safe)
    let globalDiscount = 0;
    try {
      const settings = await getSettings();
      if (settings) globalDiscount = settings.globalDiscount || 0;
    } catch (err) {
      // console.error("Global discount fetch failed", err);
    }

    res.json({ ...product.toObject(), relatedProducts, globalDiscount });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

// 🟢 ADD OR UPDATE REVIEW ROUTE (Restricted to Valid Buyers) - With Photos (Cloudinary Optimized)
router.post("/:id/reviews", protect, upload.array('images', 5), async (req, res) => {
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

      // Cloudinary Upload Logic (Consistent with Admin)
      let reviewImages = [];
      if (req.files && req.files.length > 0) {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        for (const file of req.files) {
          const b64 = Buffer.from(file.buffer).toString("base64");
          let dataURI = "data:" + file.mimetype + ";base64," + b64;
          const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
            folder: "seabite-reviews",
          });
          reviewImages.push(cloudinaryResponse.secure_url);
        }
      }

      if (alreadyReviewed) {
        alreadyReviewed.rating = Number(rating);
        alreadyReviewed.comment = comment;
        if (reviewImages.length > 0) alreadyReviewed.images = reviewImages;
      } else {
        const review = {
          name: req.user.name,
          rating: Number(rating),
          comment,
          images: reviewImages,
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