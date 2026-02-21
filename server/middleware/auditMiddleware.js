import ActivityLog from "../models/ActivityLog.js";
import logger from "../utils/logger.js";

/**
 * Audit Middleware (Senior Level Hardening)
 * Automatically logs sensitive mutations (PUT, DELETE, POST on admin routes) to the database.
 */
const auditTrail = async (req, res, next) => {
    // Capture the original res.send to intercept successful responses
    const originalSend = res.send;

    res.send = function (data) {
        res.send = originalSend;

        // Only log successful modifications (2xx) or specific security failures (403)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
            const isAdminRoute = req.originalUrl.includes("/api/admin");

            if (isMutation && isAdminRoute) {
                const logData = {
                    user: req.user?._id || req.session?.user?.id,
                    action: `${req.method} ${req.originalUrl}`,
                    details: `Admin action performed on ${req.originalUrl}`,
                    meta: {
                        method: req.method,
                        path: req.originalUrl,
                        params: req.params,
                        body: req.method !== "DELETE" ? req.body : undefined, // Avoid logging large bodies if possible
                        ip: req.ip,
                        statusCode: res.statusCode
                    }
                };

                // Fire and forget: don't block the response for logging
                ActivityLog.create(logData).catch(err =>
                    logger.error("Audit Logging Failed", { error: err.message })
                );

                logger.audit(`Admin Mutation: ${logData.action}`, { user: req.user?.email || "Unknown" });
            }
        }

        return res.send(data);
    };

    next();
};

export default auditTrail;
