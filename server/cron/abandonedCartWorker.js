import cron from "node-cron";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import { sendAbandonedCartEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

// Generate a unique coupon code like CART-AB3F
const generateCouponCode = () => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CART-${random}`;
};

// Create a unique, single-use coupon for abandoned cart recovery
const createCartRecoveryCoupon = async (userEmail) => {
    // Avoid duplicates — check if user already has an active cart coupon
    const existing = await Coupon.findOne({
        userEmail: userEmail.toLowerCase(),
        code: { $regex: /^CART-/ },
        isActive: true,
        expiresAt: { $gt: new Date() }
    });
    if (existing) return existing.code;

    let code = generateCouponCode();
    // Ensure uniqueness
    let attempts = 0;
    while (await Coupon.findOne({ code }) && attempts < 5) {
        code = generateCouponCode();
        attempts++;
    }

    const coupon = new Coupon({
        code,
        discountType: "percent",
        value: 10,            // 10% off
        maxDiscount: 200,     // Max ₹200 discount
        minOrderAmount: 0,
        isActive: true,
        maxUses: 1,
        usedCount: 0,
        userEmail: userEmail.toLowerCase(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    });

    await coupon.save();
    logger.info(`Cart recovery coupon created: ${code} for ${userEmail}`);
    return code;
};

// 🟢 Refactored: Extract core logic to be callable by both Cron and API
export const runAbandonedCartWorker = async () => {
    try {
        // Find users with elements in cart, updated > 2 hours ago, email not sent yet
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const abandonedUsers = await User.find({
            "cart.0": { $exists: true }, // cart is not empty
            cartUpdatedAt: { $lt: twoHoursAgo },
            abandonedCartEmailSent: false,
        })
            .populate("cart.product", "name image basePrice flashSale")
            .limit(50);

        if (abandonedUsers.length === 0) return { processed: 0, message: "No abandoned carts found" };

        let sentCount = 0;
        for (const user of abandonedUsers) {
            if (!user.email) continue;

            const populatedCart = user.cart
                .filter(item => item.product)
                .map(item => {
                    const p = item.product;
                    const isFlashSale = p.flashSale?.isFlashSale && new Date(p.flashSale.saleEndDate) > new Date();
                    const price = isFlashSale ? p.flashSale.discountPrice : p.basePrice;
                    return {
                        name: p.name,
                        image: p.image,
                        price,
                        qty: item.qty,
                    };
                });

            if (populatedCart.length === 0) continue;

            try {
                // Auto-generate a unique coupon for this customer
                const couponCode = await createCartRecoveryCoupon(user.email);

                await sendAbandonedCartEmail(user.email, user.name, populatedCart, couponCode);
                user.abandonedCartEmailSent = true;
                await user.save();
                sentCount++;
                logger.info(`Abandoned cart email with coupon ${couponCode} sent to ${user.email}`);
            } catch (emailErr) {
                logger.error("Failed to send abandoned cart email", { error: emailErr.message });
            }
        }
        return { processed: sentCount, totalCandidates: abandonedUsers.length };
    } catch (error) {
        logger.error("Abandoned Cart Worker Error", { error: error.message });
        throw error;
    }
};

// Run every 30 minutes (Local/Traditional server fallback)
export const initAbandonedCartWorker = () => {
    cron.schedule("*/30 * * * *", async () => {
        logger.info("Running Scheduled Abandoned Cart Worker...");
        await runAbandonedCartWorker().catch(() => {});
    });
};
