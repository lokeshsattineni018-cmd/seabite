import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// 1. Validate Coupon (For User at Checkout)
router.post("/validate", async (req, res) => {
  try {
    const { code, cartTotal, email, isAutoCheck } = req.body;
    let coupon;

    // ✅ NEW: Direct MongoDB Sync based on user account
    if (isAutoCheck && email) {
      coupon = await Coupon.findOne({
        userEmail: email.toLowerCase(),
        isSpinCoupon: true,
        isActive: true,
        usedCount: 0
      });
    } else if (code) {
      coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: "No active discount found." });
    }

    // Strict account check to ensure the coupon belongs to this user
    if (coupon.userEmail && email.toLowerCase() !== coupon.userEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "This reward is bound to another account.",
      });
    }

    // Check expiry
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon has expired." });
    }

    // Calculate Discount
    let discountAmount = 0;
    if (coupon.discountType === "percent") {
      discountAmount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    res.json({
      success: true,
      discountAmount: Math.floor(discountAmount),
      code: coupon.code,
      message: "Reward applied successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 2. Create Coupon (Admin)
router.post("/", async (req, res) => {
  try {
    const { code, value, minOrderAmount, discountType, maxDiscount, isActive } = req.body;
    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      value,
      minOrderAmount: minOrderAmount || 0,
      discountType: discountType || "percent",
      maxDiscount: maxDiscount || 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
      isSpinCoupon: false,
    });
    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(500).json({ message: "Error creating coupon" });
  }
});

// 3. Get All Coupons (Admin Dashboard)
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// 4. Delete Coupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

export default router;