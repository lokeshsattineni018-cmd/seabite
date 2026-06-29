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
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        keys: {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true }
        },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // Google OAuth ID
    googleId: { type: String },

    // Phone validation
    phone: {
      type: String,
      minLength: 10,
      maxLength: 15,
      match: [/^[0-9+\s-]+$/, "Phone number contains invalid characters"],
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
        selectedCut: { type: String, default: "" },
        cutPriceAdjustmentPct: { type: Number, default: 0 },
        orderedWeightGrams: { type: Number, default: 0 },
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
    walletTransactions: [
      {
        amount: { type: Number, required: true },
        type: { type: String, enum: ["Credit", "Debit"], required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now }
      }
    ],
    loyaltyPoints: { type: Number, default: 0 },

    // 💎 SeaBite Prime
    isPrime: { type: Boolean, default: false },
    primeExpiry: { type: Date, default: null },
    primePlan: { type: String, enum: ['monthly', 'yearly', null], default: null },

    // 🏆 Loyalty & Gamification (Phase: Enterprise Upgrade)
    loyaltyTier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' },
    totalLoyaltyPoints: { type: Number, default: 0 },
    lifetimeOrderCount: { type: Number, default: 0 },
    lifetimeOrderValue: { type: Number, default: 0 },
    badges: [{
      id: { type: String },
      name: { type: String },
      icon: { type: String, default: '🏅' },
      unlockedAt: { type: Date, default: Date.now }
    }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastStreakDate: { type: Date },
    birthday: { type: Date },
    anniversary: { type: Date },

    // 🎯 Personalization
    preferences: {
      dietaryRestrictions: [{ type: String }],
      favoriteCategories: [{ type: String }],
      communicationPrefs: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
      }
    },
    browsingHistory: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      viewedAt: { type: Date, default: Date.now },
      duration: { type: Number, default: 0 } // seconds spent
    }],
    personalizedDiscountPct: { type: Number, default: 0 },

    // 🔐 Security (Enterprise)
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    activeSessions: [{
      sessionId: { type: String },
      ip: { type: String },
      userAgent: { type: String },
      loginAt: { type: Date, default: Date.now },
      lastActiveAt: { type: Date, default: Date.now },
      location: { type: String }
    }],
    lastLoginIP: { type: String },
    lastLoginAt: { type: Date },

    // 📱 Notification Preferences
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      newArrivals: { type: Boolean, default: true },
      loyaltyUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre("save", async function () {
  if (this.isNew && !this.referralCode) {
    const base = this.name ? this.name.substring(0, 3).replace(/[^a-zA-Z]/g, '').toUpperCase() : "SB";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referralCode = `${base}${random}`;
  }
});

export default mongoose.model("User", userSchema);
