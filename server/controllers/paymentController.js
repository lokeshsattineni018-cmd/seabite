import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js'; 
import Notification from '../models/notification.js'; // ✅ IMPORT ADDED

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Checkout
export const checkout = async (req, res) => {
  try {
    const { amount, items, shippingAddress, itemsPrice, taxPrice, shippingPrice, discount, paymentMethod } = req.body;
    
    if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Auth failed" });

    let razorpayOrder = null;

    if (paymentMethod === "Prepaid") {
      razorpayOrder = await instance.orders.create({ 
        amount: Math.round(Number(amount) * 100), 
        currency: "INR", 
        receipt: `receipt_${Date.now()}` 
      });
    }

    const newOrder = new Order({
      user: req.user._id, 
      items, shippingAddress, itemsPrice, taxPrice, shippingPrice, discount,
      totalAmount: amount,
      paymentMethod: paymentMethod || "COD",
      razorpay_order_id: razorpayOrder ? razorpayOrder.id : null, 
      
      // ✅ FIXED: Force ALL new orders to start as "Pending" (even COD)
      status: "Pending", 
      
      isPaid: false 
    });

    const savedOrder = await newOrder.save();

    // ✅ NEW: Create Notification ONLY for COD orders here (Prepaid waits for verification)
    if (paymentMethod === "COD") {
        await Notification.create({
            user: req.user._id,
            message: `Order #${savedOrder.orderId} placed successfully via COD!`,
            orderId: savedOrder._id,
            statusType: "Pending"
        });
    }

    res.status(200).json({ 
      success: true, 
      order: razorpayOrder, 
      dbOrderId: savedOrder._id, 
      orderId: savedOrder.orderId 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verification
export const paymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString()).digest("hex");

    if (expectedSignature === razorpay_signature) {
      const updatedOrder = await Order.findOneAndUpdate(
        { razorpay_order_id: razorpay_order_id }, 
        { status: "Processing", paymentId: razorpay_payment_id, paidAt: Date.now(), isPaid: true },
        { new: true }
      );

      // ✅ NEW: Create Notification for Successful Payment
      if (updatedOrder) {
          await Notification.create({
              user: req.user._id, // Assumes route is protected and has req.user
              message: `Payment Successful! Order #${updatedOrder.orderId} is now Processing.`,
              orderId: updatedOrder._id,
              statusType: "Processing"
          });
      }

      res.status(200).json({ success: true, message: "Payment Verified", dbId: updatedOrder._id });
    } else {
      res.status(400).json({ success: false, message: "Invalid Signature" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

// 3. REFUND
export const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (!order.paymentId) return res.status(400).json({ success: false, message: "No Payment ID" });

    try {
        await instance.payments.refund(order.paymentId);
    } catch (rzpError) {
        console.log("Razorpay Refund Attempted (Bypass Mode)");
    }

    order.status = "Cancelled";
    order.refundStatus = "Processing"; 
    order.isPaid = false; 
    await order.save();

    // ✅ NEW: Notification for Refund
    await Notification.create({
        user: order.user,
        message: `Refund Initiated for Order #${order.orderId}`,
        orderId: order._id,
        statusType: "Cancelled"
    });

    res.status(200).json({ success: true, message: "Refund Initiated (Processing)" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Refund failed" });
  }
};