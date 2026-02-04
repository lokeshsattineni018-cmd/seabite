import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// 1. CONFIGURE CLOUDINARY (Uses the keys you added to Vercel)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ========== MULTER SETUP (MEMORY STORAGE) ========== */
// ✅ FIXED: Changed from diskStorage to memoryStorage for Vercel
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

/* ========== GET PRODUCT BY ID (ADMIN) ========== */
router.get("/:id", adminAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        console.error("❌ GET ADMIN PRODUCT ERROR:", err);
        res.status(500).json({ message: "Failed to fetch product details" });
    }
});

/* ========== ADD PRODUCT (POST /api/admin/products) ========== */
router.post(
  "/",
  adminAuth, 
  upload.single("image"),
  async (req, res) => {
    
    const { name, category, desc, trending, stock, basePrice, unit } = req.body;

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      if (!basePrice || !unit) {
          return res.status(400).json({ message: "Missing required price details." });
      }

      // ✅ FIXED: Convert Buffer to Cloudinary Data URI
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      // ✅ FIXED: Upload to Cloudinary instead of saving to 'uploads/'
      const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
        folder: "seabite-products",
      });

      const product = await Product.create({
        name: name,
        category: category,
        desc: desc || "",
        trending: trending === "true", 
        stock: stock || "in",
        active: true,
        image: cloudinaryResponse.secure_url, // Use Cloudinary URL
        basePrice: Number(basePrice),
        unit: unit,
      });

      res.status(201).json(product);
      
    } catch (err) {
      console.error("❌ ADD PRODUCT ERROR:", err);
      res.status(400).json({ message: "Failed to add product: " + err.message });
    }
  }
);

/* ========== UPDATE PRODUCT (PUT /api/admin/products/:id) ========== */
router.put("/:id", adminAuth, async (req, res) => {
    const { name, category, desc, trending, stock, basePrice, unit, image } = req.body;
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name,
                    category,
                    desc,
                    trending,
                    stock,
                    image, 
                    basePrice: Number(basePrice), 
                    unit,
                }
            },
            { new: true, runValidators: true }
        );
        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: "Unable to update product: " + err.message });
    }
});

/* ========== GET ALL PRODUCTS (ADMIN) ========== */
router.get("/", adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products }); 
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* ========== DELETE PRODUCT ========== */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;