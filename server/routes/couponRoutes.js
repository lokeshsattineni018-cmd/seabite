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
    console.error("❌ Validate coupon error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin: Create Coupon (FIXED WITH PROPER ERROR HANDLING)
router.post("/", async (req, res) => {
  try {
    console.log("📥 Received coupon creation request:", req.body);

    const { code, value, minOrderAmount, discountType, maxDiscount, isActive, expiresAt, maxUses } = req.body;
    
    // ✅ Validation
    if (!code || code.trim() === "") {
      console.log("❌ Validation failed: No code provided");
      return res.status(400).json({ message: "Coupon code is required" });
    }

    if (!value || isNaN(value) || Number(value) <= 0) {
      console.log("❌ Validation failed: Invalid value");
      return res.status(400).json({ message: "Valid discount value is required" });
    }

    // ✅ Check for duplicate code
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      console.log(`❌ Duplicate code: ${code.toUpperCase()} already exists`);
      return res.status(400).json({ message: `Coupon code "${code.toUpperCase()}" already exists!` });
    }

    // ✅ Prepare coupon data with proper type conversion
    const couponData = {
      code: code.toUpperCase().trim(),
      value: Number(value),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      discountType: discountType || "percent",
      maxDiscount: maxDiscount ? Number(maxDiscount) : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
      isSpinCoupon: false, // ✅ Admin coupons are NOT spin coupons
      expiresAt: expiresAt || null,
      maxUses: maxUses ? Number(maxUses) : 0,
      usedCount: 0, // ✅ Initialize usedCount
    };

    console.log("💾 Creating coupon with data:", couponData);

    const newCoupon = await Coupon.create(couponData);
    
    console.log("✅ Coupon created successfully:", newCoupon._id);
    
    res.status(201).json(newCoupon);
  } catch (error) {
    console.error("❌ Create coupon error:");
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
    console.error("   Error code:", error.code);
    if (error.errors) {
      console.error("   Validation errors:", error.errors);
    }
    console.error("   Full error:", error);
    
    // ✅ Send detailed error response
    res.status(500).json({ 
      message: "Error creating coupon", 
      error: error.message,
      errorType: error.name,
      details: error.errors ? Object.keys(error.errors).join(", ") : null
    });
  }
});

// ✅ Admin: Get ALL admin coupons (for admin panel)
router.get("/", async (req, res) => {
  try {
    // Only return admin coupons in admin panel
    const coupons = await Coupon.find({ isSpinCoupon: false }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("❌ Fetch coupons error:", error);
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
    console.error("❌ Fetch public coupons error:", error);
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// Admin: Update coupon
router.put("/:id", async (req, res) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("❌ Update coupon error:", error);
    res.status(500).json({ message: "Error updating coupon" });
  }
});

// Admin: Delete coupon
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    
    res.json({ success: true, message: "Coupon Deleted" });
  } catch (error) {
    console.error("❌ Delete coupon error:", error);
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

export default router;