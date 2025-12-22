import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ========== MULTER SETUP ========== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, '-');
    cb(null, Date.now() + "-" + cleanName);
  },
});

const upload = multer({ storage });

/* ========== GET PRODUCT BY ID (ADMIN) ========== */
// 🔴 FIX 1: ADDED GET BY ID ROUTE FOR ADMIN PANEL
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
    
    console.log("📥 Admin adding product...");

    const { name, category, desc, trending, stock, basePrice, unit } = req.body;

    try {
      if (!req.file) {
        console.error("❌ No image file received");
        return res.status(400).json({ message: "Image is required" });
      }

      if (!basePrice || !unit) {
          return res.status(400).json({ message: "Missing required price details (Base Price or Unit)." });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      console.log("📸 Image saved at:", imageUrl);

      const product = await Product.create({
        name: name,
        category: category,
        desc: desc || "",
        trending: trending === "true", 
        stock: stock || "in",
        active: true,
        image: imageUrl,
        
        basePrice: Number(basePrice),
        unit: unit,
      });

      console.log("✅ Product Created:", product.name);
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

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(updatedProduct);
        
    } catch (err) {
        console.error("❌ UPDATE PRODUCT ERROR:", err);
        res.status(400).json({ message: "Unable to update product: " + err.message });
    }
});


/* ========== GET ALL PRODUCTS (ADMIN) ========== */
router.get("/", adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // 🔴 NOTE: products are returned as res.json({ products }) which is correct for AdminProducts.jsx
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