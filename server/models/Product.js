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
    unit: { type: String, required: true, default: 'kg' }, 
    category: String,
    desc: String,
    image: String, 
    trending: { type: Boolean, default: false },
    stock: { type: String, default: "in" },
    active: { type: Boolean, default: true }, 
    
    // --- NEW REVIEW FIELDS ---
    reviews: [reviewSchema], // Array of review objects
    rating: { type: Number, required: true, default: 0 }, // Average rating
    numReviews: { type: Number, required: true, default: 0 }, // Total review count
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);