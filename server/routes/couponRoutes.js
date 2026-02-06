import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// 1. Validate Coupon (For User at Checkout)
router.post("/validate", async (req, res) => {
  try {
    const { code, cartTotal, email } = req.body; // email is optional, used for spin coupons
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Coupon Code" });
    }

    // If it is a spin coupon and bound to a specific user
    if (coupon.isSpinCoupon && coupon.userEmail) {
      if (!email || email.toLowerCase() !== coupon.userEmail.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "This coupon is not valid for this account.",
        });
      }
    }

    // Check expiry for spin coupons (if set)
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon has expired." });
    }

    // Check usage limit for spin coupons (if set)
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon usage limit reached." });
    }

    // Min order check (same as before)
    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Add items worth ₹${
          coupon.minOrderAmount - cartTotal
        } more to use this coupon.`,
      });
    }

    // Calculate Discount (UNCHANGED CORE LOGIC)
    let discountAmount = 0;
    if (coupon.discountType === "percent") {
      discountAmount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Optionally increment usedCount here for spin coupons,
    // or do it after order is successfully placed in your order logic.
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
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. Create Coupon (For Admin) – global coupons only
router.post("/", async (req, res) => {
  try {
    const {
      code,
      value,
      minOrderAmount,
      discountType,
      maxDiscount,
      isActive,
    } = req.body;

    const newCoupon = await Coupon.create({
      code,
      value,
      minOrderAmount,
      discountType: discountType || "percent",
      maxDiscount: maxDiscount || 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
      isSpinCoupon: false, // admin-created are global by default
    });

    res.status(201).json(newCoupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating coupon" });
  }
});

// 3. Get All Coupons (For Admin)
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// 4. Delete Coupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

export default router;
