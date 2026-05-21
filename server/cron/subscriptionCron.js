import cron from "node-cron";
import Subscription from "../models/Subscription.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

/**
 * 📦 Automated Subscription Order Processing
 * Runs daily at midnight (0 0 * * *)
 */
const subscriptionCron = cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Starting Daily Subscription Order Generation...");

  try {
    const today = new Date();
    const activeSubs = await Subscription.find({
      status: "active",
      nextBillingDate: { $lte: today }
    });

    for (const sub of activeSubs) {
      console.log(`📦 Processing Subscription for User ${sub.user}...`);

      // 1. Gather subscription items details
      const itemsList = [];
      let totalAmount = 0;

      for (const item of sub.items) {
        itemsList.push({
          productId: item.product,
          name: "Subscribed Item",
          price: item.priceSnapshot,
          qty: item.qty,
          image: "https://res.cloudinary.com/seabite/image/upload/v1/default_fish.jpg" // fallback placeholder
        });
        totalAmount += item.priceSnapshot * item.qty;
      }

      // 2. Auto-generate Order
      const newOrder = await Order.create({
        user: sub.user,
        items: itemsList,
        itemsPrice: totalAmount,
        totalAmount: totalAmount,
        paymentMethod: sub.paymentMethod,
        isPaid: sub.paymentMethod === "Wallet",
        shippingAddress: {
          fullName: "Subscriber",
          phone: sub.shippingAddress.phone,
          houseNo: sub.shippingAddress.houseNo,
          street: sub.shippingAddress.street,
          city: sub.shippingAddress.city,
          state: sub.shippingAddress.state,
          zip: sub.shippingAddress.postalCode
        },
        status: "Pending"
      });

      // 3. Deduct from User's wallet if Wallet chosen as payment method
      if (sub.paymentMethod === "Wallet") {
        const user = await User.findById(sub.user);
        if (user && user.walletBalance >= totalAmount) {
          user.walletBalance -= totalAmount;
          await user.save();
        } else {
          // If wallet has insufficient balance, mark as unpaid COD fallback
          newOrder.paymentMethod = "COD";
          newOrder.isPaid = false;
          await newOrder.save();
        }
      }

      // 4. Update subscription next billing date & last billing date
      sub.lastBillingDate = today;
      const nextBilling = new Date();
      if (sub.frequency === "weekly") {
        nextBilling.setDate(nextBilling.getDate() + 7);
      } else if (sub.frequency === "bi-weekly") {
        nextBilling.setDate(nextBilling.getDate() + 14);
      } else if (sub.frequency === "monthly") {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }
      sub.nextBillingDate = nextBilling;
      await sub.save();

      console.log(`✅ Automated Order #${newOrder.orderId || newOrder._id} generated from subscription.`);
    }
  } catch (error) {
    console.error("❌ Subscription Cron Error:", error);
  }
});

export default subscriptionCron;
