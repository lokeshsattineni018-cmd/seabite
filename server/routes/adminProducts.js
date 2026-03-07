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
        buyingPrice: Number(req.body.buyingPrice || 0), // 🟢 NEW
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
  const { name, category, desc, trending, stock, basePrice, unit, image, countInStock } = req.body;
  try {
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return res.status(404).json({ message: "Product not found" });

    const wasOutOfStock = oldProduct.stock === "out" || (oldProduct.countInStock !== undefined && oldProduct.countInStock <= 0);

    // 🟢 Smart Sync: If admin sets to 'in' but count is 0, default to 10 to avoid ghost out-of-stock
    let finalCount = countInStock !== undefined ? Number(countInStock) : oldProduct.countInStock;
    let finalStock = stock;
    if (stock === "in" && finalCount <= 0) {
      finalCount = 10;
    } else if (finalCount <= 0) {
      finalStock = "out";
    }

    const isNowInStock = finalStock === "in" && finalCount > 0;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          category,
          desc,
          trending,
          stock: finalStock,
          image,
          basePrice: Number(basePrice),
          buyingPrice: Number(req.body.buyingPrice || 0), // 🟢 NEW
          unit,
          countInStock: finalCount
        }
      },
      { returnDocument: "after", runValidators: true }
    ).populate('waitlist', 'name email');

    // ✅ Enterprise: Trigger Waitlist Notifications
    if (wasOutOfStock && isNowInStock && updatedProduct.waitlist.length > 0) {
      const { sendWaitlistEmail } = await import("../utils/emailService.js");

      // Send emails in background
      Promise.all(updatedProduct.waitlist.map(user =>
        sendWaitlistEmail(user.email, user.name, updatedProduct.name, updatedProduct.image)
          .catch(err => console.error(`Waitlist Email Error for ${user.email}:`, err))
      )).then(async () => {
        // Clear waitlist after successful notification
        updatedProduct.waitlist = [];
        await updatedProduct.save();
      });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: "Unable to update product: " + err.message });
  }
});

/* ========== CONFIGURE FLASH SALE (PUT /api/admin/products/:id/flash-sale) ========== */
router.put("/:id/flash-sale", adminAuth, async (req, res) => {
  try {
    const { discountPrice, saleEndDate, isFlashSale } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.flashSale = {
      discountPrice: discountPrice || 0,
      saleEndDate: saleEndDate,
      isFlashSale: isFlashSale
    };

    await product.save();
    res.json({ message: "Flash Sale updated successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update Flash Sale" });
  }
});

/* ========== GET ALL PRODUCTS (ADMIN) ========== */
router.get("/", adminAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
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