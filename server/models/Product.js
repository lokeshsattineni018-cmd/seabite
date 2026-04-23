import mongoose from "mongoose";

// --- REVIEW SCHEMA ---
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: { type: String, required: true }, // Store user's name for display
    rating: { type: Number, required: true, default: 0 }, // 1 to 5 stars
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// --- PRODUCT SCHEMA ---
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    basePrice: { type: Number, required: true },
    buyingPrice: { type: Number, default: 0 }, // 🟢 NEW: Cost Price for Profit Calc
    unit: { type: String, required: true, default: 'kg' },
    category: String,
    desc: String,
    image: String,
    images: [{ type: String }], // Multi-image gallery support
    trending: { type: Boolean, default: false },
    stock: { type: String, default: "in" },
    countInStock: { type: Number, default: 10, required: true },
    active: { type: Boolean, default: true },

    // --- FLASH SALE ---
    flashSale: {
      discountPrice: { type: Number, default: 0 },
      saleEndDate: { type: Date },
      isFlashSale: { type: Boolean, default: false }
    },

    // --- NEW REVIEW FIELDS ---
    reviews: [reviewSchema], // Array of review objects
    rating: { type: Number, required: true, default: 0 }, // Average rating
    numReviews: { type: Number, required: true, default: 0 }, // Total review count

    // --- ENTERPRISE: WAITLIST ---
    waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);