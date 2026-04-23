import cron from "node-cron";
import User from "../models/User.js";
import { sendAbandonedCartEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

// Run every 30 minutes
export const initAbandonedCartWorker = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      // logger.info("Running Abandoned Cart Worker...");
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Find users with elements in cart, updated > 2 hours ago, email not sent yet
      const abandonedUsers = await User.find({
        "cart.0": { $exists: true }, // cart is not empty
        cartUpdatedAt: { $lt: twoHoursAgo },
        abandonedCartEmailSent: false,
      }).limit(50); // Process in batches

      if (abandonedUsers.length === 0) return;

      for (const user of abandonedUsers) {
        if (!user.email) continue;
        
        try {
          await sendAbandonedCartEmail(user.email, user.name, user.cart);
          user.abandonedCartEmailSent = true;
          await user.save();
          logger.info(`Abandoned cart email sent to ${user.email}`);
        } catch (emailErr) {
          logger.error("Failed to send abandoned cart email", { error: emailErr.message });
        }
      }
    } catch (error) {
      logger.error("Abandoned Cart Worker Error", { error: error.message });
    }
  });
};
