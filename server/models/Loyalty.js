import mongoose from "mongoose";

// ─── Badge Definition ───
const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: "🏅" },
  category: { 
    type: String, 
    enum: ["purchase", "social", "streak", "milestone", "seasonal", "special"],
    default: "milestone"
  },
  unlockedAt: { type: Date, default: Date.now },
  condition: {
    type: { type: String }, // e.g., "orderCount", "totalSpent", "streak", "review"
    threshold: { type: Number },
  }
});

// ─── Scratch Card ───
const scratchCardSchema = new mongoose.Schema({
  code: { type: String, required: true },
  reward: {
    type: { type: String, enum: ["points", "discount", "freeDelivery", "cashback"], required: true },
    value: { type: Number, required: true },
    description: { type: String }
  },
  isScratched: { type: Boolean, default: false },
  scratchedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  isRedeemed: { type: Boolean, default: false },
  redeemedAt: { type: Date }
}, { timestamps: true });

// ─── Points Transaction ───
const pointsTransactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ["earn", "redeem", "expire", "bonus", "adjustment"], required: true },
  source: { 
    type: String, 
    enum: ["purchase", "review", "referral", "social_share", "daily_checkin", "streak_bonus", "birthday", "anniversary", "scratch_card", "admin_bonus", "redemption"],
    required: true 
  },
  description: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  balanceAfter: { type: Number },
  date: { type: Date, default: Date.now }
});

// ─── Main Loyalty Schema ───
const loyaltySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true,
    index: true
  },

  // ── Tier System ──
  tier: { 
    type: String, 
    enum: ["Bronze", "Silver", "Gold", "Platinum"],
    default: "Bronze"
  },
  tierProgress: {
    currentPoints: { type: Number, default: 0 },
    nextTierThreshold: { type: Number, default: 500 },
    nextTier: { type: String, default: "Silver" },
    progressPct: { type: Number, default: 0 }
  },
  tierHistory: [{
    tier: { type: String },
    achievedAt: { type: Date, default: Date.now },
    pointsAtTime: { type: Number }
  }],

  // ── Points ──
  totalPoints: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  pointsTransactions: [pointsTransactionSchema],

  // ── Badges & Achievements ──
  badges: [badgeSchema],
  
  // ── Streaks ──
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastStreakDate: { type: Date },
  streakFreezeAvailable: { type: Number, default: 0 }, // Can freeze streak

  // ── Daily Check-in ──
  dailyCheckins: [{
    date: { type: Date },
    pointsEarned: { type: Number, default: 5 },
    dayNumber: { type: Number } // Day 1-30 for progressive rewards
  }],
  lastCheckinDate: { type: Date },
  monthlyCheckinCount: { type: Number, default: 0 },

  // ── Scratch Cards ──
  scratchCards: [scratchCardSchema],

  // ── Special Rewards ──
  birthdayRewardClaimed: { type: Boolean, default: false },
  birthdayRewardYear: { type: Number }, // Track which year was claimed
  anniversaryRewardClaimed: { type: Boolean, default: false },
  anniversaryRewardYear: { type: Number },

  // ── Referral Tracking ──
  referralPointsEarned: { type: Number, default: 0 },
  successfulReferrals: { type: Number, default: 0 },

  // ── Tier Benefits ──
  activeBenefits: {
    discountPct: { type: Number, default: 0 },
    freeDelivery: { type: Boolean, default: false },
    earlyAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    exclusiveProducts: { type: Boolean, default: false },
    birthdayMultiplier: { type: Number, default: 1 }, // 2x, 3x points on birthday
  }

}, { timestamps: true });

// ── Tier Calculation Method ──
loyaltySchema.methods.recalculateTier = function() {
  const thresholds = {
    Bronze: 0,
    Silver: 500,
    Gold: 2000,
    Platinum: 5000
  };

  const benefits = {
    Bronze:   { discountPct: 0,  freeDelivery: false, earlyAccess: false, prioritySupport: false, exclusiveProducts: false, birthdayMultiplier: 1 },
    Silver:   { discountPct: 3,  freeDelivery: false, earlyAccess: true,  prioritySupport: false, exclusiveProducts: false, birthdayMultiplier: 2 },
    Gold:     { discountPct: 5,  freeDelivery: true,  earlyAccess: true,  prioritySupport: true,  exclusiveProducts: false, birthdayMultiplier: 3 },
    Platinum: { discountPct: 10, freeDelivery: true,  earlyAccess: true,  prioritySupport: true,  exclusiveProducts: true,  birthdayMultiplier: 5 },
  };

  let newTier = "Bronze";
  if (this.lifetimePoints >= thresholds.Platinum) newTier = "Platinum";
  else if (this.lifetimePoints >= thresholds.Gold) newTier = "Gold";
  else if (this.lifetimePoints >= thresholds.Silver) newTier = "Silver";

  if (newTier !== this.tier) {
    this.tierHistory.push({ tier: newTier, achievedAt: new Date(), pointsAtTime: this.lifetimePoints });
  }

  this.tier = newTier;
  this.activeBenefits = benefits[newTier];

  // Calculate progress to next tier
  const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
  const currentIndex = tiers.indexOf(newTier);
  if (currentIndex < tiers.length - 1) {
    const nextTier = tiers[currentIndex + 1];
    const nextThreshold = thresholds[nextTier];
    const currentThreshold = thresholds[newTier];
    this.tierProgress = {
      currentPoints: this.lifetimePoints,
      nextTierThreshold: nextThreshold,
      nextTier: nextTier,
      progressPct: Math.min(100, Math.round(((this.lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    };
  } else {
    this.tierProgress = {
      currentPoints: this.lifetimePoints,
      nextTierThreshold: 0,
      nextTier: "MAX",
      progressPct: 100
    };
  }
};

// ── Add Points Method ──
loyaltySchema.methods.addPoints = function(amount, source, description, orderId = null) {
  this.totalPoints += amount;
  this.lifetimePoints += amount;
  this.pointsTransactions.push({
    amount,
    type: "earn",
    source,
    description,
    orderId,
    balanceAfter: this.totalPoints
  });
  this.recalculateTier();
};

// ── Redeem Points Method ──
loyaltySchema.methods.redeemPoints = function(amount, description) {
  if (this.totalPoints < amount) throw new Error("Insufficient points");
  this.totalPoints -= amount;
  this.pointsTransactions.push({
    amount: -amount,
    type: "redeem",
    source: "redemption",
    description,
    balanceAfter: this.totalPoints
  });
};

// ── Check Streak Method ──
loyaltySchema.methods.updateStreak = function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (this.lastStreakDate) {
    const lastDate = new Date(this.lastStreakDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      this.currentStreak += 1;
    } else if (diffDays > 1) {
      this.currentStreak = 1; // Reset streak
    }
    // diffDays === 0 means already ordered today, no change
  } else {
    this.currentStreak = 1;
  }

  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  this.lastStreakDate = today;
};

export default mongoose.models.Loyalty || mongoose.model("Loyalty", loyaltySchema);
