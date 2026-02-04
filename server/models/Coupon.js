import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ["percent", "flat"], default: "percent" }, // percent off or flat amount off
  value: { type: Number, required: true }, // e.g., 20 for 20%
  maxDiscount: { type: Number, default: 0 }, // Max discount in Rupees (0 = no limit)
  minOrderAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Coupon", couponSchema);