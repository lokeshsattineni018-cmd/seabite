import ActivityLog from "../models/ActivityLog.js";

/**
 * Logs a system activity for "The Watchtower"
 * @param {string} action - CONSTANT style action name (e.g., "LOGIN", "CART_ADD")
 * @param {string} details - Human readable detail
 * @param {Object} req - Express Request object (to extract user/session)
 * @param {Object} meta - Optional metadata
 */
export const logActivity = async (action, details, req = null, meta = {}) => {
    try {
        const userId = req?.user?._id || req?.session?.user?.id || null;
        const guestId = req?.sessionID || "unknown";

        const log = new ActivityLog({
            user: userId,
            guestId: userId ? null : guestId,
            action,
            details,
            meta
        });

        await log.save();
        // Console log for local debugging
        // console.log(`📡 Activity: [${action}] ${details}`);
    } catch (err) {
        console.error("Starting Watchtower Log failed:", err.message);
    }
};
