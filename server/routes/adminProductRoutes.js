import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";
import { cacheClear } from "../utils/cache.js";

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
  upload.fields([{ name: "image", maxCount: 1 }, { name: "images", maxCount: 5 }]),
  async (req, res) => {

    const { name, category, desc, trending, stock, basePrice, unit, countInStock } = req.body;

    try {
      if (!req.files || (!req.files.image && !req.files.images)) {
        return res.status(400).json({ message: "At least one image is required" });
      }

      if (!basePrice || !unit) {
        return res.status(400).json({ message: "Missing required price details." });
      }

      let mainImageUrl = "";
      if (req.files.image) {
        const b64 = Buffer.from(req.files.image[0].buffer).toString("base64");
        let dataURI = "data:" + req.files.image[0].mimetype + ";base64," + b64;
        const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
          folder: "seabite-products",
        });
        mainImageUrl = cloudinaryResponse.secure_url;
      }

      let galleryImageUrls = [];
      if (req.files.images) {
        for (const file of req.files.images) {
          const b64 = Buffer.from(file.buffer).toString("base64");
          let dataURI = "data:" + file.mimetype + ";base64," + b64;
          const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
            folder: "seabite-products",
          });
          galleryImageUrls.push(cloudinaryResponse.secure_url);
        }
      }

      // If main image wasn't provided but gallery was, use first gallery image as main
      if (!mainImageUrl && galleryImageUrls.length > 0) {
        mainImageUrl = galleryImageUrls[0];
      }

      let parsedCuts = [];
      if (req.body.cuts) {
        try {
          parsedCuts = typeof req.body.cuts === "string" ? JSON.parse(req.body.cuts) : req.body.cuts;
        } catch (e) {
          console.error("Failed to parse cuts:", e);
        }
      }

      let parsedScalingRule = {};
      if (req.body.scalingRule) {
        try {
          parsedScalingRule = typeof req.body.scalingRule === "string" ? JSON.parse(req.body.scalingRule) : req.body.scalingRule;
        } catch (e) {
          console.error("Failed to parse scalingRule:", e);
        }
      }

      const product = await Product.create({
        name: name,
        category: category,
        desc: desc || "",
        trending: trending === "true",
        stock: stock || "in",
        active: true,
        image: mainImageUrl, 
        images: galleryImageUrls,
        basePrice: Number(basePrice),
        buyingPrice: Number(req.body.buyingPrice || 0),
        unit: unit,
        countInStock: countInStock !== undefined ? Number(countInStock) : (stock === "out" ? 0 : 10),
        hasCuts: req.body.hasCuts === "true" || req.body.hasCuts === true,
        cuts: parsedCuts,
        pricePerKg: req.body.pricePerKg ? Number(req.body.pricePerKg) : 0,
        minOrderWeight: req.body.minOrderWeight ? Number(req.body.minOrderWeight) : 250,
        maxOrderWeight: req.body.maxOrderWeight ? Number(req.body.maxOrderWeight) : 5000,
        weightVariancePct: req.body.weightVariancePct ? Number(req.body.weightVariancePct) : 5,
        catchDate: req.body.catchDate || Date.now(),
        shelfLifeHours: req.body.shelfLifeHours ? Number(req.body.shelfLifeHours) : 48,
        sourceOrigin: req.body.sourceOrigin || "Bhimavaram Farm Gate",
        algorithmicScaling: req.body.algorithmicScaling === "true" || req.body.algorithmicScaling === true,
        scalingRule: parsedScalingRule
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
  const { name, category, desc, trending, stock, basePrice, unit, image, images, countInStock, catchDate, shelfLifeHours, sourceOrigin, algorithmicScaling, scalingRule } = req.body;
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

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (desc !== undefined) updateData.desc = desc;
    if (trending !== undefined) updateData.trending = trending;
    if (finalStock !== undefined) updateData.stock = finalStock;
    if (image !== undefined) updateData.image = image;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
    if (req.body.buyingPrice !== undefined) updateData.buyingPrice = Number(req.body.buyingPrice);
    if (unit !== undefined) updateData.unit = unit;
    if (finalCount !== undefined) updateData.countInStock = finalCount;
    if (req.body.hasCuts !== undefined) updateData.hasCuts = req.body.hasCuts === "true" || req.body.hasCuts === true;
    if (req.body.cuts !== undefined) {
      try {
        updateData.cuts = typeof req.body.cuts === "string" ? JSON.parse(req.body.cuts) : req.body.cuts;
      } catch (e) {
        console.error("Failed to parse cuts:", e);
      }
    }
    if (req.body.pricePerKg !== undefined) updateData.pricePerKg = Number(req.body.pricePerKg);
    if (req.body.minOrderWeight !== undefined) updateData.minOrderWeight = Number(req.body.minOrderWeight);
    if (req.body.maxOrderWeight !== undefined) updateData.maxOrderWeight = Number(req.body.maxOrderWeight);
    if (req.body.weightVariancePct !== undefined) updateData.weightVariancePct = Number(req.body.weightVariancePct);
    if (catchDate !== undefined) updateData.catchDate = catchDate;
    if (shelfLifeHours !== undefined) updateData.shelfLifeHours = Number(shelfLifeHours);
    if (sourceOrigin !== undefined) updateData.sourceOrigin = sourceOrigin;
    if (algorithmicScaling !== undefined) updateData.algorithmicScaling = algorithmicScaling === "true" || algorithmicScaling === true;
    if (scalingRule !== undefined) {
      try {
        updateData.scalingRule = typeof scalingRule === "string" ? JSON.parse(scalingRule) : scalingRule;
      } catch (e) {
        console.error("Failed to parse scalingRule:", e);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).populate('waitlist', 'name email');

    // 🔔 Trigger Low Stock Alert for Admin if updated to low stock
    const threshold = updatedProduct.stockThreshold || 5;
    if (updatedProduct.countInStock <= threshold) {
      const { sendInventoryAlertEmail } = await import("../utils/emailService.js");
      const adminEmail = process.env.ADMIN_EMAIL || "lokeshsattineni018@gmail.com";
      sendInventoryAlertEmail(adminEmail, updatedProduct.name, updatedProduct.countInStock).catch(e => 
        console.error("Admin Inventory Alert Failed:", e.message)
      );
    }

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

    cacheClear();
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
    cacheClear();
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
    cacheClear();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;