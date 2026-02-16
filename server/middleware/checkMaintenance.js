import Settings, { getSettings } from "../models/Settings.js";

const checkMaintenance = async (req, res, next) => {
    try {
        const settings = await getSettings();

        // Allow admins to bypass maintenance
        if (settings.isMaintenanceMode && !req.session?.isAdmin) {
            return res.status(503).json({
                maintenance: true,
                message: settings.maintenanceMessage
            });
        }

        next();
    } catch (err) {
        next(); // Don't block on DB error, just log it
    }
};

export default checkMaintenance;
