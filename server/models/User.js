import mongoose from "mongoose";

// 1️⃣ Address Subdocument Schema
const addressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
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

    lastOrderCompletionTime: {
      type: Date,
      default: null,
    },

    // Embedded addresses
    addresses: [addressSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
