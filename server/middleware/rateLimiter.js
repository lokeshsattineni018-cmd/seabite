import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";

/**
 * Enterprise Rate Limiter for Auth Routes
 * Prevents brute-force attacks by limiting attempts from the same IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/signup requests per windowMs
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  handler: (req, res, next, options) => {
    logger.security("Rate limit exceeded", { 
      ip: req.ip, 
      path: req.path, 
      userAgent: req.headers["user-agent"] 
    });
    res.status(429).json(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Standard Rate Limiter for General API Routes
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
