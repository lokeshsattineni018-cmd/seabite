import express from "express";
import { getSettings } from "../models/Settings.js";

const router = express.Router();

// GET /api/settings (Public)
router.get("/", async (req, res) => {
    try {
        const settings = await getSettings();

        // Return only safe/public information
        const publicSettings = {
            storeName: settings.storeName,
            taxRate: settings.taxRate,
            deliveryFee: settings.deliveryFee,
            minOrderValue: settings.minOrderValue,
            freeDeliveryThreshold: settings.freeDeliveryThreshold,
            isMaintenanceMode: settings.isMaintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            banner: settings.banner,
            announcement: settings.announcement, // 🟢 Added
            contactPhone: settings.contactPhone,
            contactEmail: settings.contactEmail,
            logoUrl: settings.logoUrl,
            openingTime: settings.openingTime,
            closingTime: settings.closingTime,
            isClosed: settings.isClosed,
            globalDiscount: settings.globalDiscount
        };

        res.json(publicSettings);
    } catch (err) {
        console.error("Public Settings Error:", err);
        res.status(500).json({ message: "Failed to fetch store settings" });
    }
});

export default router;
