import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import upload from "../config/multerConfig.js";
import { cacheGet, cacheSet, cacheClear } from "../utils/cache.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validateFileSignatures } from "../middleware/validateFileSignatures.js";
import SearchInsight from "../models/SearchInsight.js";
import { getSettings } from "../models/Settings.js";
import { logActivity } from "../utils/activityLogger.js"; // 🟢 Added import

import { searchLimiter } from "../middleware/rateLimiter.js";

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

// ── GET /api/products/filter-meta ──
router.get("/filter-meta", async (req, res) => {
  try {
    const products = await Product.find({ active: true }).select("basePrice category cuts").lean();
    
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    const categories = new Set();
    const cuts = new Set();

    products.forEach(p => {
      if (p.basePrice < minPrice) minPrice = p.basePrice;
      if (p.basePrice > maxPrice) maxPrice = p.basePrice;
      if (p.category) categories.add(p.category);
      if (p.cuts && p.cuts.length > 0) {
        p.cuts.forEach(c => {
          if (c.name) cuts.add(c.name);
        });
      }
    });

    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === -Infinity) maxPrice = 2000;

    res.json({
      minPrice,
      maxPrice,
      categories: Array.from(categories),
      cuts: Array.from(cuts)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch filter metadata" });
  }
});

// --- GET ALL PRODUCTS ---
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, inStock, sort, visitorId: queryVisitorId } = req.query;

    const visitorId = queryVisitorId || req.headers["x-visitor-id"] || null;
    const userId = req.session?.user?.id || req.session?.userId || null;

    // Use a visitor/user-specific cache key to prevent cross-profile cache pollution
    const cacheKey = `products:all:${category || 'all'}:${search || 'none'}:${minPrice || '0'}:${maxPrice || '0'}:${inStock || 'all'}:${sort || 'default'}:${req.query.flashSale || 'false'}:${userId || visitorId || 'guest'}`;
    const cachedData = cacheGet(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

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

    // 🟢 CUSTOM CUTS FILTER
    if (req.query.cut) {
      query["cuts.name"] = { $regex: `^${req.query.cut}$`, $options: "i" };
    }

    // 🟢 CATCH OF THE DAY FILTER
    if (req.query.catchOfTheDay === "true") {
      query.catchOfTheDay = true;
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest
    if (sort === "price-asc") sortOptions = { basePrice: 1 };
    if (sort === "price-desc") sortOptions = { basePrice: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };
    if (sort === "newest") sortOptions = { createdAt: -1 };

    const products = await Product.find(query).select("-buyingPrice -waitlist").sort(sortOptions).lean();

    // 🧬 DYNAMIC CATEGORY AFFINITY ORDERING (Fingerprinting)
    let orderedProducts = products;
    if (!category || category === "all" || category.toLowerCase() === "all") {
      try {
        const scores = { Fish: 0, Prawn: 0, Crab: 0 };
        
        // 1. Order History Score (Weight: 3)
        if (userId) {
          const recentOrders = await Order.find({ user: userId }).select("items").limit(5).lean();
          recentOrders.forEach(order => {
            order.items.forEach(item => {
              const name = (item.name || "").toLowerCase();
              if (name.includes("fish")) scores.Fish += 3 * (item.qty || 1);
              else if (name.includes("prawn") || name.includes("shrimp")) scores.Prawn += 3 * (item.qty || 1);
              else if (name.includes("crab")) scores.Crab += 3 * (item.qty || 1);
            });
          });
        }
        
        // 2. Wishlist & User Profile Score (Weight: 2)
        if (userId) {
          const User = (await import("../models/User.js")).default;
          const userDoc = await User.findById(userId).populate("wishlist", "category name").lean();
          if (userDoc && userDoc.wishlist) {
            userDoc.wishlist.forEach(item => {
              const cat = item.category;
              if (cat && scores[cat] !== undefined) {
                scores[cat] += 2;
              }
            });
          }
        }
        
        // 3. Recent Activity Log Score (Weight: 1)
        const ActivityLog = (await import("../models/ActivityLog.js")).default;
        const orConditions = [];
        if (userId) orConditions.push({ user: userId });
        if (visitorId) orConditions.push({ guestId: visitorId });

        let recentLogs = [];
        if (orConditions.length > 0) {
          recentLogs = await ActivityLog.find({
            $or: orConditions,
            action: { $in: ["SEARCH", "WISHLIST_ADD", "CART_UPDATE"] }
          }).select("details").limit(15).lean();
        }
        
        recentLogs.forEach(log => {
          const details = (log.details || "").toLowerCase();
          if (details.includes("fish")) scores.Fish += 1;
          if (details.includes("prawn") || details.includes("shrimp")) scores.Prawn += 1;
          if (details.includes("crab")) scores.Crab += 1;
        });

        // 4. Sort categories by affinity score, fallback to default order (Fish -> Prawn -> Crab)
        const defaultOrder = ["Fish", "Prawn", "Crab"];
        const hasAffinities = Object.values(scores).some(s => s > 0);
        
        let priorityOrder = defaultOrder;
        if (hasAffinities) {
          priorityOrder = Object.keys(scores).sort((a, b) => {
            if (scores[b] !== scores[a]) return scores[b] - scores[a];
            return defaultOrder.indexOf(a) - defaultOrder.indexOf(b); // Keep relative default order on ties
          });
        }

        // Group products by category
        const groups = {
          Fish: [],
          Prawn: [],
          Crab: [],
          Others: []
        };

        products.forEach(p => {
          const cat = p.category || "Others";
          if (groups[cat]) {
            groups[cat].push(p);
          } else {
            groups["Others"].push(p);
          }
        });

        // Reassemble products list based on priority order
        orderedProducts = [];
        priorityOrder.forEach(cat => {
          orderedProducts.push(...groups[cat]);
        });
        orderedProducts.push(...groups["Others"]);
      } catch (fingerprintErr) {
        console.error("Failed to compute category affinity:", fingerprintErr);
      }
    }

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
                found: orderedProducts.length > 0,
                lastSearched: Date.now()
              }
            },
            { upsert: true, returnDocument: "after" }
          );

          // 🟢 WATCHTOWER LOGGING
          logActivity("SEARCH", `Searched for "${sanitizedSearch}"`, req, { results: orderedProducts.length });

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

    const responsePayload = { products: orderedProducts, globalDiscount };
    cacheSet(cacheKey, responsePayload, 120); // Cache for 120s

    res.json(responsePayload);
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
router.get("/search/suggest", searchLimiter, async (req, res) => {
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
    const cacheKey = `product:detail:${req.params.id}`;
    const cachedData = cacheGet(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let product;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(req.params.id).select("-buyingPrice -waitlist").populate('reviews.user', 'name').lean();
    } else {
      // 🚀 Performance: Query directly by slug first (O(1) database read)
      product = await Product.findOne({ slug: req.params.id, active: true }).select("-buyingPrice -waitlist").populate('reviews.user', 'name').lean();
      
      // Fallback: If not found (legacy products without slug field populated), query name directly with fuzzy regex
      if (!product) {
        const nameQuery = req.params.id.split("-").join(" ");
        product = await Product.findOne({
          name: { $regex: new RegExp("^" + nameQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") },
          active: true
        }).select("-buyingPrice -waitlist").populate('reviews.user', 'name').lean();
      }
    }
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🟢 NEW: Fetch Related Products (Same category, excluding current)
    let relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      active: true
    })
      .select('name image basePrice stock averageRating')
      .limit(3)
      .lean();

    // 🟢 FALLBACK: If no related products in category, fetch random active products
    if (relatedProducts.length < 3) {
      const moreProducts = await Product.find({
        _id: { $ne: product._id, $nin: relatedProducts.map(p => p._id) },
        active: true
      })
        .select('name image basePrice stock averageRating')
        .limit(3 - relatedProducts.length)
        .lean();

      relatedProducts = [...relatedProducts, ...moreProducts];
    }

    // 🟢 FETCH GLOBAL SETTINGS (Safe)
    let globalDiscount = 0;
    try {
      const settings = await getSettings();
      if (settings) globalDiscount = settings.globalDiscount || 0;
    } catch (err) {}

    // 🟢 NEW: Calculate Sales in last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrdersCount = await Order.find({
      createdAt: { $gte: twentyFourHoursAgo },
      "items.productId": product._id,
      status: { $ne: "Cancelled" }
    }).lean();

    let salesLast24h = 0;
    recentOrdersCount.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.productId && item.productId.toString() === product._id.toString()) {
            salesLast24h += item.qty || 1;
          }
        });
      }
    });

    const responsePayload = { ...product, relatedProducts, globalDiscount, salesLast24h };
    cacheSet(cacheKey, responsePayload, 120); // Cache for 120s

    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CREATE PRODUCT (ADMIN) ---
router.post("/", protect, admin, upload.single('image'), validateFileSignatures, async (req, res) => {
  const { name, category, desc, trending, stock, basePrice, unit } = req.body;
  if (!req.file) return res.status(400).json({ message: "Image required" });

  try {
    const product = await Product.create({
      name, category, desc, stock, unit,
      basePrice: parseFloat(basePrice),
      trending: trending === 'true',
      image: `/uploads/${req.file.filename}`,
    });
    cacheClear();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🟢 ADD OR UPDATE REVIEW ROUTE (Restricted to Valid Buyers) - With Photos (Cloudinary Optimized)
router.post("/:id/reviews", protect, upload.array('images', 3), validateFileSignatures, async (req, res) => {
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
      cacheClear();
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

// 🟢 POST /api/products/price-sync
router.post("/price-sync", async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: "Invalid productIds" });
    }
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name basePrice pricePerKg unit flashSale active image");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;