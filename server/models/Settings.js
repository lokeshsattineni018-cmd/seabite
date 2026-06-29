import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "SeaBite is currently undergoing scheduled maintenance. We'll be back shortly with fresh catches!" },
    globalDiscount: { type: Number, default: 0 },
    banner: {
        active: { type: Boolean, default: false },
        imageUrl: { type: String, default: "" },
        link: { type: String, default: "" }
    },
    // 🟢 Announcement Bar
    announcement: {
        active: { type: Boolean, default: false },
        text: { type: String, default: "" },
        bgColor: { type: String, default: "#1c1917" }, // stone-900
        textColor: { type: String, default: "#ffffff" }
    },
    // 🟢 General
    storeName: { type: String, default: "SeaBite" },
    contactPhone: { type: String, default: "+91 98765 43210" },
    contactEmail: { type: String, default: "support@seabite.in" },
    logoUrl: { type: String, default: "/logo.png" },

    // 🟢 Finance
    taxRate: { type: Number, default: 5 }, // GST %
    deliveryFee: { type: Number, default: 40 },
    minOrderValue: { type: Number, default: 200 },
    freeDeliveryThreshold: { type: Number, default: 500 },

    // 🟢 Operations
    openingTime: { type: String, default: "09:00" },
    closingTime: { type: String, default: "23:00" },
    isClosed: { type: Boolean, default: false }, // Manual Override

    // 🎡 Gamification
    spinWheelEnabled: { type: Boolean, default: true },

    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    securityLevel: { type: String, enum: ['normal', 'high', 'fortress'], default: 'normal' },

    // 🏆 Loyalty Program Configuration
    loyaltyConfig: {
      enabled: { type: Boolean, default: true },
      pointsPerRupee: { type: Number, default: 1 }, // 1 point per ₹1 spent
      pointsRedemptionRate: { type: Number, default: 100 }, // 100 points = ₹1
      tierThresholds: {
        Silver: { type: Number, default: 500 },
        Gold: { type: Number, default: 2000 },
        Platinum: { type: Number, default: 5000 }
      },
      tierBenefits: {
        Silver: { discountPct: { type: Number, default: 3 }, freeDelivery: { type: Boolean, default: false } },
        Gold: { discountPct: { type: Number, default: 5 }, freeDelivery: { type: Boolean, default: true } },
        Platinum: { discountPct: { type: Number, default: 10 }, freeDelivery: { type: Boolean, default: true } }
      },
      streakBonusPoints: { type: Number, default: 50 }, // Bonus every 7-day streak
      dailyCheckinPoints: { type: Number, default: 5 },
      reviewPoints: { type: Number, default: 20 },
      referralPoints: { type: Number, default: 100 },
      birthdayBonusPoints: { type: Number, default: 200 },
      badgeDefinitions: [{
        id: { type: String },
        name: { type: String },
        icon: { type: String },
        description: { type: String },
        condition: { type: { type: String }, threshold: { type: Number } }
      }]
    },

    // 🚚 Delivery Slot Configuration
    deliverySlots: [{
      id: { type: String },
      label: { type: String }, // e.g., "Morning Fresh"
      startTime: { type: String }, // "06:00"
      endTime: { type: String }, // "09:00"
      maxOrders: { type: Number, default: 20 },
      premiumCharge: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      daysAvailable: [{ type: String }] // ["Mon", "Tue", ...]
    }],
    deliveryModificationWindowMinutes: { type: Number, default: 5 }, // Grace window

    // 🏢 Multi-Store Configuration
    multiStore: {
      enabled: { type: Boolean, default: false },
      stores: [{
        storeId: { type: String },
        name: { type: String },
        domain: { type: String },
        logo: { type: String },
        primaryColor: { type: String, default: '#0ea5e9' },
        secondaryColor: { type: String, default: '#0284c7' },
        isActive: { type: Boolean, default: true },
        timezone: { type: String, default: 'Asia/Kolkata' }
      }]
    },

    // 📢 Notification Channel Configuration
    notificationChannels: {
      email: { enabled: { type: Boolean, default: true }, provider: { type: String, default: 'resend' } },
      push: { enabled: { type: Boolean, default: true } },
      whatsapp: { enabled: { type: Boolean, default: false }, apiKey: { type: String }, templateNamespace: { type: String } },
      sms: { enabled: { type: Boolean, default: false }, provider: { type: String }, apiKey: { type: String } }
    },

    // 🔒 Security Configuration
    securityConfig: {
      enforce2FA: { type: Boolean, default: false },
      ipWhitelist: [{ type: String }],
      sessionTimeoutMinutes: { type: Number, default: 60 },
      maxLoginAttempts: { type: Number, default: 5 },
      lockoutDurationMinutes: { type: Number, default: 30 },
      passwordMinLength: { type: Number, default: 8 },
      requireSpecialChar: { type: Boolean, default: true },
    },

    // 🚩 Feature Flags
    featureFlags: {
      loyaltyProgram: { type: Boolean, default: true },
      subscriptions: { type: Boolean, default: true },
      giftCards: { type: Boolean, default: true },
      socialLogin: { type: Boolean, default: true },
      liveChat: { type: Boolean, default: false },
      aiRecommendations: { type: Boolean, default: true },
      weatherBasedRecommendations: { type: Boolean, default: true },
      deliveryTracking: { type: Boolean, default: true },
      multiStore: { type: Boolean, default: false },
      apiHub: { type: Boolean, default: false },
    },

    // 🎯 Revenue Goals
    revenueGoals: [{
      period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'] },
      target: { type: Number },
      startDate: { type: Date },
      endDate: { type: Date },
    }],

    // 📊 Custom Order Statuses
    customOrderStatuses: [{
      name: { type: String },
      color: { type: String, default: '#6b7280' },
      icon: { type: String, default: '📦' },
      description: { type: String },
      position: { type: Number } // Sort order in pipeline
    }],

    // 🌐 API & Integrations
    integrations: {
      googleAnalytics: { trackingId: { type: String }, enabled: { type: Boolean, default: false } },
      metaPixel: { pixelId: { type: String }, enabled: { type: Boolean, default: false } },
      googleMerchant: { merchantId: { type: String }, enabled: { type: Boolean, default: false } },
      shiprocket: { apiKey: { type: String }, enabled: { type: Boolean, default: false } },
      weatherApi: { apiKey: { type: String }, enabled: { type: Boolean, default: false } },
    },
}, { timestamps: true });

const Settings = mongoose.model("Settings", settingsSchema);

// Ensure a single settings document exists
export const getSettings = async () => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    return settings;
};

export default Settings;
