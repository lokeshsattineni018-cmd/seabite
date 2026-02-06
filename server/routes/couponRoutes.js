import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// 1. Validate Coupon (For User at Checkout)
router.post("/validate", async (req, res) => {
  try {
    const { code, cartTotal, email } = req.body; 
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid Coupon Code" });
    }

    // ✅ FIX: Case-insensitive email binding check
    if (coupon.isSpinCoupon && coupon.userEmail) {
      const incomingEmail = (email || "").toLowerCase();
      const storedEmail = (coupon.userEmail || "").toLowerCase();

      if (incomingEmail !== storedEmail) {
        return res.status(400).json({
          success: false,
          message: "This coupon is not valid for this account.",
        });
      }
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon has expired." });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached." });
    }

    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Add items worth ₹${coupon.minOrderAmount - cartTotal} more to use this coupon.`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === "percent") {
      discountAmount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Increment count after validation
    if (coupon.isSpinCoupon && coupon.maxUses > 0) {
      coupon.usedCount += 1;
      await coupon.save();
    }

    res.json({
      success: true,
      discountAmount: Math.floor(discountAmount),
      code: coupon.code,
      message: "Coupon Applied!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. Create Coupon (Admin)
router.post("/", async (req, res) => {
  try {
    const { code, value, minOrderAmount, discountType, maxDiscount, isActive } = req.body;
    const newCoupon = await Coupon.create({
      code, value, minOrderAmount, 
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

// 3. Get All Coupons
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