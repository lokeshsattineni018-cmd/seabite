import User from "../models/User.js";
import Order from "../models/Order.js";

/**
 * 💰 One-Click Refund to Wallet
 * Cancels the order and adds the amount to user's virtual wallet
 */
export const refundToWallet = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Cancelled") return res.status(400).json({ message: "Already cancelled" });
    if (order.refundStatus === "Refunded to Wallet" || order.refundStatus === "Success" || order.refundStatus === "Processing") {
      return res.status(400).json({ message: "Refund already processed for this order." });
    }

    // 1. Update Order Status atomically
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        refundStatus: { $nin: ["Refunded to Wallet", "Success", "Processing"] },
        status: { $ne: "Cancelled" }
      },
      {
        $set: {
          status: "Cancelled",
          refundStatus: "Refunded to Wallet"
        }
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).json({ message: "Refund already processed or order cancelled by another transaction." });
    }

    // 2. Add to User Wallet
    const userId = updatedOrder.user?._id || updatedOrder.user;
    if (!userId) {
      return res.status(400).json({ message: "No customer associated with this order." });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Customer account not found." });
    }
    user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
    
    // Add transaction to history
    if (!user.walletTransactions) {
      user.walletTransactions = [];
    }
    user.walletTransactions.push({
      amount: order.totalAmount,
      type: "Credit",
      description: `Refund for Order #${order.orderId || order._id}`,
      date: new Date()
    });
    
    await user.save();

    res.json({
      success: true,
      message: `₹${order.totalAmount} refunded to ${user.name}'s wallet successfully.`
    });
  } catch (error) {
    console.error("❌ WALLET REFUND ERROR:", error);
    res.status(500).json({ message: "Failed to process wallet refund." });
  }
};
