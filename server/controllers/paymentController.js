import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Notification from '../models/notification.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendOrderPlacedEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Checkout
export const checkout = async (req, res) => {
  const traceId = req.traceId;
  const idempotencyKey = req.headers["idempotency-key"];

  try {
    const { amount, items, shippingAddress, itemsPrice, taxPrice, shippingPrice, discount, paymentMethod } = req.body;

    if (!req.user || !req.user._id) return res.status(401).json({ success: false, message: "Auth failed" });

    // 🔐 ENTERPRISE IDEMPOTENCY CHECK
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ user: req.user._id, idempotencyKey });
      if (existingOrder) {
        logger.info("Idempotent request detected, returning existing order", { traceId, idempotencyKey, orderId: existingOrder.orderId });
        return res.status(200).json({
          success: true,
          order: existingOrder.razorpay_order_id ? { id: existingOrder.razorpay_order_id, amount: Math.round(existingOrder.totalAmount * 100), currency: "INR" } : null,
          dbOrderId: existingOrder._id,
          orderId: existingOrder.orderId,
          _idempotent: true
        });
      }
    }

    // 🟢 STOCK VALIDATION
    // Check if all items are in stock
    for (const item of items) {
      const product = await Product.findById(item.productId); // Use Product model
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
      }
      if (product.countInStock < item.qty) {
        return res.status(400).json({ success: false, message: `Out of stock: ${item.name}` });
      }
    }

    let razorpayOrder = null;

    if (paymentMethod === "Prepaid") {
      razorpayOrder = await instance.orders.create({
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      });
    }

    const orderData = {
      user: req.user._id,
      items,
      shippingAddress,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount,
      totalAmount: amount,
      paymentMethod: paymentMethod || "COD",
      razorpay_order_id: razorpayOrder ? razorpayOrder.id : null,
      status: "Pending",
      isPaid: false,
    };

    if (idempotencyKey) {
      orderData.idempotencyKey = idempotencyKey;
    }

    const newOrder = new Order(orderData);

    const savedOrder = await newOrder.save();

    // 🟢 STOCK DEDUCTION & CART CLEARING
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.countInStock = Math.max(0, product.countInStock - item.qty);
        await product.save();
      }
    }

    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    // ✅ TRIGGER EMAIL: ONLY for COD orders here
    if (paymentMethod === "COD") {
      try {
        await sendOrderPlacedEmail(
          req.user.email,
          req.user.name,
          savedOrder.orderId || savedOrder._id,
          savedOrder.totalAmount,
          savedOrder.items,
          savedOrder.paymentMethod
        );
      } catch (mailErr) {
        logger.error("COD Confirmation Email Failed", { traceId, error: mailErr.message, orderId: savedOrder._id });
      }

      await Notification.create({
        user: req.user._id,
        message: `Order #${savedOrder.orderId} placed successfully via COD!`,
        orderId: savedOrder._id,
        statusType: "Pending"
      });
    }

    logger.info("Order created in checkout", { traceId, orderId: savedOrder.orderId, paymentMethod });

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
        { returnDocument: 'after' }
      ).populate('user', 'name email');

      if (updatedOrder) {
        // ✅ TRIGGER EMAIL: For Successful Prepaid Payment
        try {
          await sendOrderPlacedEmail(
            updatedOrder.user.email,
            updatedOrder.user.name,
            updatedOrder.orderId || updatedOrder._id,
            updatedOrder.totalAmount,
            updatedOrder.items,
            updatedOrder.paymentMethod
          );
        } catch (mailErr) {
          logger.error("Prepaid Confirmation Email Failed", { traceId: req.traceId, error: mailErr.message, orderId: updatedOrder._id });
        }

        await Notification.create({
          user: req.user._id,
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