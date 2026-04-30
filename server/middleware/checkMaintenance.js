import Settings, { getSettings } from "../models/Settings.js";

const checkMaintenance = async (req, res, next) => {
    try {
        const settings = await getSettings();

        // 1. Always allow auth and admin routes
        if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/admin")) {
            return next();
        }

        // 2. Allow admins to bypass maintenance everywhere
        const userRole = req.session?.role || req.session?.user?.role;
        if (settings && settings.isMaintenanceMode && userRole !== "admin") {
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
