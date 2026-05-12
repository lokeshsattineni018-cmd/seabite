import cron from "node-cron";
import User from "../models/User.js";
import { sendAbandonedCartEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

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
                await sendAbandonedCartEmail(user.email, user.name, populatedCart);
                user.abandonedCartEmailSent = true;
                await user.save();
                sentCount++;
                logger.info(`Abandoned cart email sent to ${user.email}`);
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
