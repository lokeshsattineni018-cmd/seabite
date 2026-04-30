import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// 1️⃣ Address Subdocument Schema
const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    houseNo: { type: String, required: true },
    street: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
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
    isBanned: { type: Boolean, default: false },

    // Google OAuth ID
    googleId: { type: String },

    // Phone validation
    phone: {
      type: String,
      minLength: 10,
      maxLength: 15,
      match: [/^\d+$/, "Phone number must contain only digits"],
    },

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

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre("save", function (next) {
  if (this.isNew && !this.referralCode) {
    const base = this.name ? this.name.substring(0, 3).replace(/[^a-zA-Z]/g, '').toUpperCase() : "SB";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referralCode = `${base}${random}`;
  }
  next();
});

export default mongoose.model("User", userSchema);
