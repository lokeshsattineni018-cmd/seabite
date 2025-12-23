import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// 1. Validate Coupon (For User at Checkout)
router.post("/validate", async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid Coupon Code" });
    }

    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Add items worth ₹${coupon.minOrderAmount - cartTotal} more to use this coupon.` 
      });
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
      message: "Coupon Applied!" 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. Create Coupon (For Admin)
router.post("/", async (req, res) => {
  try {
    const { code, value, minOrderAmount } = req.body;
    const newCoupon = await Coupon.create({ code, value, minOrderAmount });
    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(500).json({ message: "Error creating coupon" });
  }
});

// 3. Get All Coupons (For Admin)
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