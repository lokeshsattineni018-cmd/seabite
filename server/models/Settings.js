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
