import Order from '../models/Order.js';
import User from '../models/User.js';

/**
 * 🛡️ Purchase Velocity Check
 * Prevents rapid-fire orders (potential botting/fraud)
 */
export const purchaseVelocityCheck = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Check how many orders this user placed in the last hour
    const orderCount = await Order.countDocuments({
      user: userId,
      createdAt: { $gt: oneHourAgo }
    });

    if (orderCount >= 3) {
      return res.status(429).json({
        success: false,
        message: "Security Alert: Too many orders in a short period. Please try again in an hour."
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 🛡️ Promo Code Fingerprinting
 * Prevents "Coupon Abuse" by checking if the same device/IP has used the coupon before
 */
export const promoFingerprintCheck = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    if (!couponCode) return next();

    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const fingerprint = `${userIp}-${userAgent}`;

    // Check if this fingerprint has already used this coupon
    const usedBefore = await Order.findOne({
      couponCode: couponCode.toUpperCase(),
      $or: [
        { 'fraudFingerprint': fingerprint },
        { 'user': req.user._id }
      ]
    });

    if (usedBefore) {
      return res.status(403).json({
        success: false,
        message: "This promo code has already been redeemed by your account or device."
      });
    }

    // Attach fingerprint to request so order controller can save it
    req.fraudFingerprint = fingerprint;
    next();
  } catch (error) {
    next(error);
  }
};
