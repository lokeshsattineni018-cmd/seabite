import Settings, { getSettings } from "../models/Settings.js";

const checkMaintenance = async (req, res, next) => {
    try {
        const settings = await getSettings();

        // 1. Always allow auth and admin routes (account for /api/v1 prefix)
        if (req.path.includes("/api/auth") || req.path.includes("/api/admin") || req.path.includes("/api/v1/auth") || req.path.includes("/api/v1/admin")) {
            return next();
        }

        // 2. Allow admins to bypass maintenance everywhere
        if (settings && settings.isMaintenanceMode && req.session?.user?.role !== "admin") {
            return res.status(503).json({
                maintenance: true,
                message: settings.maintenanceMessage
            });
        }

        next();
    } catch (err) {
        // console.error("Maintenance check failed:", err);
        next(); // Proceed even if DB check fails
    }
};

export default checkMaintenance;
