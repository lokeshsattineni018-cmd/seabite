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

/**
 * Coupon Validation Limiter (Abuse Prevention)
 */
export const couponLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 validation checks per 5 minutes
  message: {
    message: "Too many coupon validation attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Search Query Limiter (DoS Prevention)
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search queries per minute
  message: {
    message: "Too many search requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
