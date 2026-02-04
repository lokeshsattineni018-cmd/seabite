import express from "express";
import Product from "../models/Product.js";
import upload from "../config/multerConfig.js"; 
import { protect } from "../middleware/authMiddleware.js"; 

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
    const { category, search } = req.query;
    let query = { active: true };

    if (category && category !== "all") query.category = { $regex: `^${category}$`, $options: "i" };
    if (search) query.name = { $regex: search, $options: "i" };

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET SINGLE PRODUCT ---
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name'); 
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
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

// 🟢 ADD OR UPDATE REVIEW ROUTE
router.post("/:id/reviews", protect, async (req, res) => {
  const { rating, comment } = req.body;
  
  try {
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

export default router;