import express from "express";
import ProductView from "../models/ProductView.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// 🛰️ Track a product view (Public)
router.post("/track/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { guestId } = req.body;
    
    await ProductView.create({
      productId,
      userId: req.session?.user?.id || null,
      guestId,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Tracking failed" });
  }
});

// 🛰️ Get Pulse Stats (Admin Only)
router.get("/stats", protect, adminAuth, async (req, res) => {
  try {
    // 1. Get total views in last 24h per product
    const stats = await ProductView.aggregate([
      { $match: { viewedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { 
          _id: "$productId", 
          totalViews: { $sum: 1 },
          uniqueUsers: { $addToSet: { $ifNull: ["$userId", "$guestId"] } }
        } 
      },
      { $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      { $project: {
          productId: "$_id",
          name: "$product.name",
          image: "$product.image",
          basePrice: "$product.basePrice",
          stock: "$product.countInStock",
          views: "$totalViews",
          uniques: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { views: -1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// 🛰️ Get Detailed History for a Product (Admin Only)
router.get("/history/:productId", protect, adminAuth, async (req, res) => {
  try {
    const history = await ProductView.find({ productId: req.params.productId })
      .populate("userId", "name email phone")
      .sort({ viewedAt: -1 })
      .limit(100);
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ⚡ Trigger Instant Pulse Flash Sale (Admin Only)
router.post("/flash/:productId", protect, adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { discountPrice, durationMinutes = 30 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Set flash sale ending in X minutes
    product.flashSale = {
      isFlashSale: true,
      discountPrice,
      saleEndDate: new Date(Date.now() + durationMinutes * 60 * 1000)
    };

    await product.save();
    
    // Broadcast to all users in the product room
    req.io.to(`product:${productId}`).emit("FLASH_SALE_STARTED", {
      productId,
      discountPrice,
      endTime: product.flashSale.saleEndDate
    });

    res.json({ message: "Pulse Flash Sale started!", product });
  } catch (err) {
    res.status(500).json({ error: "Failed to start flash sale" });
  }
});

export default router;
