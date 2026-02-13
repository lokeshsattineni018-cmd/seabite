import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// ✅ Validate ADMIN Coupons Only (not spin coupons)
router.post("/validate", async (req, res) => {
  try {
    const { code, cartTotal, email } = req.body;
    
    if (!code) {
      return res.status(404).json({ success: false, message: "No coupon code provided." });
    }

    const safeEmail = (email || "").toLowerCase();

    // ✅ Find ADMIN coupon only (not spin coupons)
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      isSpinCoupon: false, // ✅ Only admin coupons
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code." });
    }

    // Check if user-specific
    if (coupon.userEmail && safeEmail !== coupon.userEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not valid for your account.",
      });
    }

    // Check expiry
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon has expired." });
    }

    // Check min order amount
    if (coupon.minOrderAmount > 0 && cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order amount ₹${coupon.minOrderAmount} required.` 
      });
    }

    // Check usage limit
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached." });
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
      message: `${coupon.value}${coupon.discountType === 'percent' ? '%' : '₹'} discount applied!`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin: Create Coupon
router.post("/", async (req, res) => {
  try {
    const { code, value, minOrderAmount, discountType, maxDiscount, isActive, expiresAt, maxUses } = req.body;
    
    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      value,
      minOrderAmount: minOrderAmount || 0,
      discountType: discountType || "percent",
      maxDiscount: maxDiscount || 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
      isSpinCoupon: false, // ✅ Admin coupons are NOT spin coupons
      expiresAt: expiresAt || null,
      maxUses: maxUses || 0,
    });
    
    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(500).json({ message: "Error creating coupon" });
  }
});

// ✅ Admin: Get ALL admin coupons (for admin panel)
router.get("/", async (req, res) => {
  try {
    // Only return admin coupons in admin panel
    const coupons = await Coupon.find({ isSpinCoupon: false }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// ✅ Public: Get ACTIVE admin coupons (for homepage display)
router.get("/public", async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      isSpinCoupon: false, // ✅ Only admin coupons
      $or: [
        { expiresAt: { $gte: new Date() } },
        { expiresAt: null }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// Admin: Update coupon
router.put("/:id", async (req, res) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating coupon" });
  }
});

// Admin: Delete coupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

export default router;