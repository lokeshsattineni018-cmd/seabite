import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending"],
      default: "pending",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    amount: { type: Number }, // Amount paid in INR
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    benefits: {
      freeDelivery: { type: Boolean, default: true },
      exclusiveDiscountPct: { type: Number, default: 5 }, // 5% extra off always
      earlyFlashSaleAccess: { type: Boolean, default: true },
      prioritySupport: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
