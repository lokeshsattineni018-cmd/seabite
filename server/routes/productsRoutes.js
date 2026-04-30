import express from "express";
import Product from "../models/Product.js";
import upload from "../config/multerConfig.js";
import { protect } from "../middleware/authMiddleware.js"; // 🟢 Ensure this path is correct
import SearchInsight from "../models/SearchInsight.js";

const router = express.Router();

// --- GET ALL PRODUCTS ---
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { active: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

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
          { upsert: true, returnDocument: "after" }
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

// --- GET SINGLE PRODUCT ---
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name'); // Populate reviewer name if needed
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CREATE PRODUCT (ADMIN) ---
router.post("/", upload.single('image'), async (req, res) => {
  const { name, category, desc, trending, stock, basePrice, unit } = req.body;

  if (!req.file) return res.status(400).json({ message: "Image file is required." });
  if (!name || !basePrice || !unit) return res.status(400).json({ message: "Missing required details." });

  try {
    const product = await Product.create({
      name,
      category,
      desc,
      basePrice: parseFloat(basePrice),
      unit,
      trending: trending === 'true',
      stock,
      image: `/uploads/${req.file.filename}`,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🟢 NEW ROUTE: ADD REVIEW (With Photos)
router.post("/:id/reviews", protect, upload.array('images', 5), async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Check if user already reviewed
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: "Product already reviewed" });
      }

      const reviewImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        images: reviewImages,
        user: req.user._id,
      };

      product.reviews.push(review);

      // Recalculate Average Rating
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Review added successfully!" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Review Error:", error);
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

// 🔍 GLOBAL SEARCH SUGGESTIONS
router.get("/search/suggest", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const products = await Product.find({
      name: { $regex: q, $options: "i" },
      active: true
    })
    .select("name image")
    .limit(5);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Search suggestion failed" });
  }
});

export default router;