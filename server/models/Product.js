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
    images: [{ type: String }], // 🟢 Photos uploaded by user
  },
  { timestamps: true }
);

// --- PRODUCT SCHEMA ---
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, index: true },
    basePrice: { type: Number, required: true },
    price: { type: Number, default: 0 }, // 🟢 Current Selling Price
    buyingPrice: { type: Number, default: 0 }, // 🟢 NEW: Cost Price for Profit Calc
    unit: { type: String, required: true, default: 'kg' },
    category: String,
    desc: String,
    image: String,
    images: [{ type: String }], // Multi-image gallery support
    trending: { type: Boolean, default: false },
    stock: { type: String, default: "in" },
    countInStock: { type: Number, default: 10, required: true },
    stockThreshold: { type: Number, default: 2 }, // 🟢 NEW: Warning trigger (e.g. 2kg)
    active: { type: Boolean, default: true },

    // 🔪 CHOOSE YOUR CUT
    cuts: [{
      name: { type: String }, // e.g. "Whole", "Cleaned & Gutted", "Steaks", "Fillets", "Boneless Cubes"
      priceAdjustmentPct: { type: Number, default: 0 }, // % added to basePrice
      available: { type: Boolean, default: true },
      emoji: { type: String, default: "🐟" },
    }],
    hasCuts: { type: Boolean, default: false }, // Toggle to enable cut selector on PDP

    // ⚖️ LIVE WEIGHT-BASED PRICING
    pricePerKg: { type: Number, default: 0 }, // For products sold by weight
    minOrderWeight: { type: Number, default: 250 }, // Min grams (250g default)
    maxOrderWeight: { type: Number, default: 5000 }, // Max grams (5kg default)
    weightVariancePct: { type: Number, default: 5 }, // e.g. 5 = ±5% variance guarantee

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

    // --- MULTI-VENDOR & SEASONAL CATCH ---
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    catchOfTheDay: { type: Boolean, default: false },
    dockSource: { type: String, default: "Mogalthur Docks" },

    // --- CATCH LIFE CYCLE & SCARCITY SCALING ---
    catchDate: { type: Date, default: Date.now },
    shelfLifeHours: { type: Number, default: 48 },
    sourceOrigin: { type: String, default: "Bhimavaram Farm Gate" },
    algorithmicScaling: { type: Boolean, default: false },
    scalingRule: {
      minStockThreshold: { type: Number, default: 50 },
      discountIncreasePct: { type: Number, default: 5 },
      intervalHours: { type: Number, default: 1 },
      maxDiscountPct: { type: Number, default: 50 }
    }
  },
  { timestamps: true }
);

productSchema.pre("save", function(next) {
  if (this.isModified("name")) {
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };
    this.slug = slugify(this.name);
  }
  next();
});

productSchema.pre(["findOneAndUpdate", "update", "updateOne"], function(next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.name) {
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };
    update.$set.slug = slugify(update.$set.name);
  } else if (update.name) {
    const slugify = (text) => {
      if (!text) return "";
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };
    update.slug = slugify(update.name);
  }
  next();
});

export default mongoose.models.Product || mongoose.model("Product", productSchema);