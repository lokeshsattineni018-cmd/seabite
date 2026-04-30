import User from "../models/User.js";
import Order from "../models/Order.js";

/**
 * 💰 One-Click Refund to Wallet
 * Cancels the order and adds the amount to user's virtual wallet
 */
export const refundToWallet = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user');
    
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Cancelled") return res.status(400).json({ message: "Already cancelled" });

    // 1. Update Order Status
    order.status = "Cancelled";
    order.refundStatus = "Refunded to Wallet";
    await order.save();

    // 2. Add to User Wallet (assuming User model has a wallet balance)
    const user = await User.findById(order.user._id);
    user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
    
    // Add transaction to history if it exists
    if (user.walletTransactions) {
      user.walletTransactions.push({
        amount: order.totalAmount,
        type: "Credit",
        description: `Refund for Order #${order.orderId}`,
        date: new Date()
      });
    }
    
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
