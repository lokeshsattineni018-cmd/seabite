import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "SeaBite is currently undergoing scheduled maintenance. We'll be back shortly with fresh catches!" },
    globalDiscount: { type: Number, default: 0 }, // 🟢 NEW
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
