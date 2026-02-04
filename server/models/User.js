import mongoose from "mongoose";

// 1. Define the Schema for an Address Subdocument
const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
}, { timestamps: true });

// 2. Define the User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    // Password is NOT required now (for Google Users)
    password: { type: String, required: false }, 
    role: { type: String, default: "user" },
    
    // Google ID for OAuth
    googleId: { type: String },

    // Explicit validation for phone number
    phone: { 
        type: String,
        minLength: 10,
        maxLength: 15,
        match: [/^\d+$/, 'is invalid. Phone number must contain only digits.'],
    }, 
    
    addresses: [addressSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);