import mongoose from "mongoose";

// 1️⃣ Address Subdocument Schema
// 1️⃣ Address Subdocument Schema
const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    houseNo: { type: String, required: true }, // Added
    street: { type: String, required: true },
    landmark: { type: String }, // Added
    city: { type: String, required: true },
    state: { type: String, required: true }, // Added (for restriction check)
    postalCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }, // Added
  },
  { timestamps: true }
);

// 2️⃣ User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },

    // Password optional (for Google login)
    password: { type: String, required: false },

    role: { type: String, default: "user" },
    isBanned: { type: Boolean, default: false }, // 🟢 NEW

    // Google OAuth ID
    googleId: { type: String },

    // Phone validation
    phone: {
      type: String,
      minLength: 10,
      maxLength: 15,
      match: [/^\d+$/, "Phone number must contain only digits"],
    },

    // 🆕 Added inside schema properly
    lastSpinTime: {
      type: Date,
      default: null,
    },

    // 🟢 Wishlist
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    lastOrderCompletionTime: {
      type: Date,
      default: null,
    },

    // Embedded addresses
    addresses: [addressSchema],

    // 🛒 ABANDONED CART RECOVERY
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number, default: 1 },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
