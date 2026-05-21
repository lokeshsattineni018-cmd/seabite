import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      name: { type: String, required: true },
      qty: { type: Number, required: true }
    }
  ],
  reason: {
    type: String,
    required: true
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  adminComment: {
    type: String
  },
  refundedAmount: {
    type: Number
  }
}, { timestamps: true });

export default mongoose.models.ReturnRequest || mongoose.model("ReturnRequest", returnRequestSchema);
