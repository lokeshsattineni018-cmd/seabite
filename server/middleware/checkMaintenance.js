import Settings, { getSettings } from "../models/Settings.js";

const checkMaintenance = async (req, res, next) => {
    try {
        const settings = await getSettings();

        // 1. Always allow auth and admin routes
        if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/admin")) {
            return next();
        }

        // 2. Allow admins to bypass maintenance everywhere
        if (settings.isMaintenanceMode && req.session?.user?.role !== "admin") {
            return res.status(503).json({
                maintenance: true,
                message: settings.maintenanceMessage
            });
        }

        next();
    } catch (err) {
        next(); // Don't block on DB error
    }
};

export default checkMaintenance;
