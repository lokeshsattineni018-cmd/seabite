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

// Helper for vendor split credit payouts
const processVendorSplits = async (orderItems) => {
  try {
    const Vendor = (await import("../models/Vendor.js")).default;
    const Product = (await import("../models/Product.js")).default;
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (product && product.vendor) {
        const vendor = await Vendor.findById(product.vendor);
        if (vendor) {
          // Credit 85% of item price * qty to vendor balance, remaining 15% is platform commission
          const creditAmount = Math.round((item.price || product.price || 0) * item.qty * 0.85);
          vendor.balance = (vendor.balance || 0) + creditAmount;
          await vendor.save();
          console.log(`⚓ [VENDOR SPLIT] Credited ₹${creditAmount} to Fisherman Vendor: ${vendor.name} for item: ${product.name}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ VENDOR SPLIT ERROR:", err);
  }
};

// 1. Checkout
export const checkout = async (req, res) => {
  const traceId = req.traceId;
  const idempotencyKey = req.headers["idempotency-key"];

  try {
    const {
      amount,
      items,
      shippingAddress,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discount,
      paymentMethod,
      deliverySlot,
      deliveryDate,
      isGift,
      giftMessage,
      useLoyalty,
      loyaltyPointsToRedeem,
      giftCardCode,
      couponCode: reqCouponCode
    } = req.body;

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

    const userDoc = await User.findById(req.user._id);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Apply Wallet Balance if requested
    const useWallet = !!req.body.useWallet;
    const walletAppliedAmount = req.body.walletAppliedAmount ? Number(req.body.walletAppliedAmount) : 0;
    if (useWallet && walletAppliedAmount > 0) {
      if (userDoc.walletBalance < walletAppliedAmount) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }
      userDoc.walletBalance -= walletAppliedAmount;
    }

    let loyaltyDiscount = 0;
    let pointsUsed = 0;
    if (useLoyalty && userDoc.loyaltyPoints > 0) {
      const requestedPoints = loyaltyPointsToRedeem !== undefined ? Math.min(Number(loyaltyPointsToRedeem), userDoc.loyaltyPoints) : userDoc.loyaltyPoints;
      const calculatedSubtotal = Number(itemsPrice || 0) - Number(discount || 0);
      const calculatedTax = Math.round(calculatedSubtotal * 0.05);
      const maxDiscountable = calculatedSubtotal + Number(shippingPrice || 0) + calculatedTax;

      loyaltyDiscount = Math.min(requestedPoints * 0.5, maxDiscountable);
      pointsUsed = Math.min(requestedPoints, Math.ceil(loyaltyDiscount / 0.5));

      userDoc.loyaltyPoints = Math.max(0, userDoc.loyaltyPoints - pointsUsed);
    }

    // Apply Gift Card Code if provided
    let giftCardDiscount = 0;
    let giftCardDocToSave = null;
    if (giftCardCode) {
      const GiftCard = (await import("../models/GiftCard.js")).default;
      const card = await GiftCard.findOne({ code: giftCardCode.trim().toUpperCase(), active: true });
      if (card) {
        if (new Date() > card.expiryDate) {
          card.active = false;
          giftCardDocToSave = card;
        } else {
          const calculatedSubtotal = Number(itemsPrice || 0) - Number(discount || 0) - loyaltyDiscount;
          const calculatedTax = Math.round(calculatedSubtotal * 0.05);
          const currentTotal = Math.max(0, calculatedSubtotal + Number(shippingPrice || 0) + calculatedTax);

          giftCardDiscount = Math.min(card.currentBalance, currentTotal);
          card.currentBalance = Math.max(0, card.currentBalance - giftCardDiscount);
          if (card.currentBalance <= 0) {
            card.active = false;
          }
          giftCardDocToSave = card;
        }
      }
    }

    let razorpayOrder = null;

    if (paymentMethod === "Prepaid" && Number(amount) > 0) {
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
      discount: Number(discount || 0) + loyaltyDiscount + giftCardDiscount + walletAppliedAmount,
      couponCode: reqCouponCode || undefined,
      couponDiscount: Number(discount || 0),
      walletAppliedAmount: walletAppliedAmount || 0,
      totalAmount: amount,
      paymentMethod: paymentMethod || "COD",
      razorpay_order_id: razorpayOrder ? razorpayOrder.id : null,
      status: paymentMethod === "Wallet" ? "Processing" : "Pending",
      isPaid: paymentMethod === "Wallet" ? true : false,
      paidAt: paymentMethod === "Wallet" ? new Date() : undefined,
      deliverySlot,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      isGift: !!isGift,
      giftMessage: giftMessage || "",
    };

    if (idempotencyKey) {
      orderData.idempotencyKey = idempotencyKey;
    }

    const newOrder = new Order(orderData);

    const savedOrder = await newOrder.save();

    // Log the wallet transaction and save userDoc updates (wallet, loyalty, cart clearing)
    if (useWallet && walletAppliedAmount > 0) {
      if (!userDoc.walletTransactions) {
        userDoc.walletTransactions = [];
      }
      userDoc.walletTransactions.push({
        amount: walletAppliedAmount,
        type: "Debit",
        description: `Applied to Order #${savedOrder.orderId || savedOrder._id.toString().substring(18)}`,
        date: new Date()
      });
    }

    userDoc.cart = [];
    await userDoc.save();

    // Save gift card updates if applicable
    if (giftCardDocToSave) {
      await giftCardDocToSave.save();
    }

    // 🟢 STOCK DEDUCTION
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.countInStock = Math.max(0, product.countInStock - item.qty);
        if (product.countInStock <= 0) {
          product.stock = "out";
        }
        await product.save();
      }
    }

    // ✅ TRIGGER EMAIL & WHATSAPP: ONLY for COD or Wallet orders here
    if (paymentMethod === "COD" || paymentMethod === "Wallet") {
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
        logger.error("Order Confirmation Email Failed", { traceId, error: mailErr.message, orderId: savedOrder._id });
      }

      try {
        const { sendWhatsAppNotification } = await import("../utils/whatsapp.js");
        await sendWhatsAppNotification(
          shippingAddress.phone || req.user.phone || "9999999999",
          `🚢 SeaBite: Your order #${savedOrder.orderId} of ₹${savedOrder.totalAmount} has been placed successfully via ${paymentMethod === "Wallet" ? "Wallet" : "COD"}. Selected slot: ${deliverySlot || 'Standard Delivery'}.`
        );
      } catch (waErr) {
        logger.error("WhatsApp Dispatch Failed", { traceId, error: waErr.message });
      }

      await Notification.create({
        user: req.user._id,
        message: `Order #${savedOrder.orderId} placed successfully via ${paymentMethod === "Wallet" ? "Wallet" : "COD"}!`,
        orderId: savedOrder._id,
        statusType: paymentMethod === "Wallet" ? "Processing" : "Pending"
      });

      // Split payout splits for COD or Wallet orders
      await processVendorSplits(savedOrder.items);
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
      ).populate('user', 'name email phone');

      if (updatedOrder) {
        // ✅ TRIGGER EMAIL & WHATSAPP: For Successful Prepaid Payment
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

        try {
          const { sendWhatsAppNotification } = await import("../utils/whatsapp.js");
          await sendWhatsAppNotification(
            updatedOrder.shippingAddress.phone || updatedOrder.user.phone || "9999999999",
            `🚢 SeaBite: Ahoy ${updatedOrder.user.name}! Your payment of ₹${updatedOrder.totalAmount} for order #${updatedOrder.orderId} was verified successfully. Selected slot: ${updatedOrder.deliverySlot || 'Standard Delivery'}.`
          );
        } catch (waErr) {
          logger.error("Prepaid WhatsApp Dispatch Failed", { traceId: req.traceId, error: waErr.message });
        }

        await Notification.create({
          user: updatedOrder.user._id,
          message: `Payment Successful! Order #${updatedOrder.orderId} is now Processing.`,
          orderId: updatedOrder._id,
          statusType: "Processing"
        });

        // Split payout splits for Prepaid orders upon verification
        await processVendorSplits(updatedOrder.items);
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