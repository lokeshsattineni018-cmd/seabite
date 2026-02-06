import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true 
  },

  // Global logic for standard coupons
  discountType: { 
    type: String, 
    enum: ["percent", "flat"], 
    default: "percent" 
  },
  value: { 
    type: Number, 
    required: true 
  }, // e.g., 20 for 20%
  maxDiscount: { 
    type: Number, 
    default: 0 
  }, // Max discount in Rupees (0 = no limit)
  minOrderAmount: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },

  // Extra fields for spin-wheel unique coupons
  isSpinCoupon: { 
    type: Boolean, 
    default: false 
  },
  userEmail: { 
    type: String, 
    default: null, 
    lowercase: true, // ✅ FIX: Ensures email matching always works with sessions
    trim: true 
  }, 
  expiresAt: { 
    type: Date, 
    default: null 
  },   
  maxUses: { 
    type: Number, 
    default: 1 // ✅ Default to 1 use for spin rewards
  },      
  usedCount: { 
    type: Number, 
    default: 0 
  },
});

export default mongoose.model("Coupon", couponSchema);