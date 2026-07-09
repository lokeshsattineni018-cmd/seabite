import crypto from "crypto";

export const csrfProtection = (req, res, next) => {
  // 1. Safe methods: generate and sync token if session exists
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.session) {
      if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
      }
    }
    return next();
  }

  // 2. State-changing methods: enforce check ONLY if user is logged in (session has userId)
  if (req.session && req.session.userId) {
    const clientToken = req.headers["x-csrf-token"] || req.body?._csrf || req.query?._csrf;
    
    if (!clientToken || clientToken !== req.session.csrfToken) {
      console.warn(`🚨 [CSRF ALERT] Mismatch or missing token. IP: ${req.ip} | Path: ${req.path}`);
      return res.status(403).json({
        success: false,
        message: "Invalid or missing CSRF token. Please refresh the page.",
      });
    }
  }

  next();
};
