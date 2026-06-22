import express from "express";
import Recipe from "../models/Recipe.js";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Slugify helper
const slugify = (text) =>
  text.toString().toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET all published recipes
router.get("/", async (req, res) => {
  try {
    const { featured, tag, search } = req.query;
    let query = { published: true };
    if (featured === "true") query.featured = true;
    if (tag) query.tags = { $in: [tag.toLowerCase()] };
    if (search) query.title = { $regex: search, $options: "i" };

    const recipes = await Recipe.find(query)
      .populate("ingredients.productId", "name basePrice image unit flashSale globalDiscount")
      .sort({ featured: -1, createdAt: -1 });

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single recipe by slug
router.get("/:slug", async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ slug: req.params.slug, published: true })
      .populate("ingredients.productId", "name basePrice price image unit flashSale globalDiscount stock countInStock");

    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    // Increment view count
    await Recipe.findByIdAndUpdate(recipe._id, { $inc: { views: 1 } });

    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// CREATE recipe
router.post("/", protect, admin, async (req, res) => {
  try {
    const { title, description, coverImage, cookTimeMinutes, prepTimeMinutes,
            servings, difficulty, cuisine, tags, ingredients, otherIngredients,
            steps, published, featured } = req.body;

    const slug = slugify(title) + "-" + Date.now();
    const recipe = await Recipe.create({
      title, slug, description, coverImage, cookTimeMinutes, prepTimeMinutes,
      servings, difficulty, cuisine, tags, ingredients, otherIngredients,
      steps, published: published || false, featured: featured || false,
    });
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE recipe
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE recipe
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: "Recipe deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL recipes (admin - includes unpublished)
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("ingredients.productId", "name basePrice image")
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
