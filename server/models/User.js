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
    email: { type: String, unique: true, sparse: true, required: false },

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

    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number, default: 1 },
      }
    ],

    // 🟢 Cart Sync timestamps for recovery
    cartUpdatedAt: { type: Date, default: Date.now },
    abandonedCartEmailSent: { type: Boolean, default: false },

    // 🔐 Enterprise IAM: Brute-Force Protection
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },

    // 🎁 Referral & Loyalty System
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    walletBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    const base = this.name ? this.name.substring(0, 3).replace(/[^a-zA-Z]/g, '').toUpperCase() : "SB";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referralCode = `${base}${random}`;
  }
  next();
});

export default mongoose.model("User", userSchema);
