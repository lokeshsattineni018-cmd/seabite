import mongoose from "mongoose";

const productViewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  guestId: {
    type: String,
    default: null
  },
  ip: String,
  userAgent: String,
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Optimization: TTL index to auto-delete data older than 30 days (keep DB lean)
productViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const ProductView = mongoose.model("ProductView", productViewSchema);
export default ProductView;
