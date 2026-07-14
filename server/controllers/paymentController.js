import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import { getSettings } from '../models/Settings.js';
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
      couponCode: reqCouponCode,
      visitorId
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

    const userDoc = await User.findById(req.user._id);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🟢 SERVER-SIDE PRICE RECALCULATION
    // Load store settings dynamically
    let freeThreshold = 1000;
    let deliveryFee = 99;
    let taxRate = 5;
    let globalDiscount = 0;
    try {
      const settings = await getSettings();
      if (settings) {
        freeThreshold = settings.freeDeliveryThreshold !== undefined ? settings.freeDeliveryThreshold : 1000;
        deliveryFee = settings.deliveryFee !== undefined ? settings.deliveryFee : 99;
        taxRate = settings.taxRate !== undefined ? settings.taxRate : 5;
        globalDiscount = settings.globalDiscount !== undefined ? settings.globalDiscount : 0;
      }
    } catch (err) {
      logger.error("Failed to load store settings in checkout", { error: err.message });
    }

    let recalculatedItemsPrice = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
      }

      // Check if product is in flash sale
      const isActiveFlashSale = product.flashSale && product.flashSale.isFlashSale && product.flashSale.discountPrice > 0 && (!product.flashSale.saleEndDate || new Date(product.flashSale.saleEndDate) > new Date());
      
      let basePrice = product.basePrice;
      if (isActiveFlashSale) {
        basePrice = product.flashSale.discountPrice;
      } else {
        // If weight-based pricing is active, scale by grams
        if (product.pricePerKg > 0 && item.orderedWeightGrams > 0) {
          basePrice = Math.round((product.pricePerKg / 1000) * item.orderedWeightGrams);
        }
        
        // Apply global discount if active
        if (globalDiscount > 0) {
          basePrice = Math.round(basePrice * (1 - globalDiscount / 100));
        }
      }

      // True unit price calculated with cutPriceAdjustmentPct
      const adjustment = item.cutPriceAdjustmentPct ? Number(item.cutPriceAdjustmentPct) : 0;
      const itemUnitPrice = Math.round(basePrice * (1 + adjustment / 100));

      recalculatedItemsPrice += itemUnitPrice * item.qty;

      verifiedItems.push({
        productId: item.productId,
        name: product.name,
        price: itemUnitPrice,
        qty: item.qty,
        image: product.image || item.image,
        selectedCut: item.selectedCut || "",
        cutPriceAdjustmentPct: adjustment,
        orderedWeightGrams: item.orderedWeightGrams || 0,
      });
    }

    // 🟢 COUPON RECALCULATION
    let calculatedCouponDiscount = 0;
    let couponDoc = null;
    if (reqCouponCode) {
      couponDoc = await Coupon.findOne({
        code: reqCouponCode.toUpperCase().trim(),
        isActive: true
      });

      if (!couponDoc) {
        return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
      }

      // Check if user-specific (spin wheel)
      if (couponDoc.isSpinCoupon && couponDoc.userEmail && userDoc.email.toLowerCase() !== couponDoc.userEmail.toLowerCase()) {
        return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
      }

      // Check if restricted to specific visitor session
      if (couponDoc.isPromoPush && couponDoc.visitorId && visitorId !== couponDoc.visitorId) {
        return res.status(400).json({ success: false, message: "Invalid or expired coupon code" });
      }

      // Expiry Check
      if (couponDoc.expiresAt && couponDoc.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: "Coupon has expired." });
      }

      // Min order check
      if (couponDoc.minOrderAmount > 0 && recalculatedItemsPrice < couponDoc.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Minimum order amount ₹${couponDoc.minOrderAmount} required.` });
      }

      // Usage limits check
      if (couponDoc.maxUses > 0 && couponDoc.usedCount >= couponDoc.maxUses) {
        return res.status(400).json({ success: false, message: "Coupon usage limit reached." });
      }

      // First-time only check
      if (couponDoc.firstTimeOnly) {
        const orderCount = await Order.countDocuments({ user: userDoc._id, status: { $ne: "Cancelled" } });
        if (orderCount > 0) {
          return res.status(400).json({ success: false, message: "This coupon is valid for first-time users only." });
        }
      }

      if (couponDoc.discountType === "percent") {
        calculatedCouponDiscount = (recalculatedItemsPrice * couponDoc.value) / 100;
        if (couponDoc.maxDiscount > 0 && calculatedCouponDiscount > couponDoc.maxDiscount) {
          calculatedCouponDiscount = couponDoc.maxDiscount;
        }
      } else {
        calculatedCouponDiscount = couponDoc.value;
      }
      calculatedCouponDiscount = Math.min(Math.floor(calculatedCouponDiscount), recalculatedItemsPrice);
    }

    // 🟢 SHIPPING RECALCULATION (Calculated early for discount limit formulas)
    const isShippingCoupon = couponDoc && couponDoc.discountType === "shipping";
    const calculatedShippingPrice = (recalculatedItemsPrice >= freeThreshold || isShippingCoupon) ? 0 : deliveryFee;

    // 🟢 LOYALTY RECALCULATION
    let loyaltyDiscount = 0;
    let pointsUsed = 0;
    if (useLoyalty && userDoc.loyaltyPoints > 0) {
      const requestedPoints = loyaltyPointsToRedeem !== undefined ? Math.min(Number(loyaltyPointsToRedeem), userDoc.loyaltyPoints) : userDoc.loyaltyPoints;
      const calculatedSubtotal = recalculatedItemsPrice - calculatedCouponDiscount;
      const calculatedTax = Math.round(calculatedSubtotal * (taxRate / 100));
      const maxDiscountable = calculatedSubtotal + calculatedShippingPrice + calculatedTax;

      loyaltyDiscount = Math.min(requestedPoints * 0.5, maxDiscountable);
      pointsUsed = Math.min(requestedPoints, Math.ceil(loyaltyDiscount / 0.5));
    }

    // 🟢 GIFT CARD RECALCULATION
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
          const calculatedSubtotal = recalculatedItemsPrice - calculatedCouponDiscount - loyaltyDiscount;
          const calculatedTax = Math.round(calculatedSubtotal * (taxRate / 100));
          const currentTotal = Math.max(0, calculatedSubtotal + calculatedShippingPrice + calculatedTax);

          giftCardDiscount = Math.min(card.currentBalance, currentTotal);
          card.currentBalance = Math.max(0, card.currentBalance - giftCardDiscount);
          if (card.currentBalance <= 0) {
            card.active = false;
          }
          giftCardDocToSave = card;
        }
      }
    }

    // Recalculate Subtotal, Tax, and Grand Total
    const finalSubtotal = Math.max(0, recalculatedItemsPrice - calculatedCouponDiscount - loyaltyDiscount - giftCardDiscount);
    const calculatedTaxPrice = Math.round(finalSubtotal * (taxRate / 100));
    const totalBeforeWallet = finalSubtotal + calculatedShippingPrice + calculatedTaxPrice;

    // Apply Wallet Balance if requested
    const useWallet = !!req.body.useWallet;
    const walletAppliedAmount = req.body.walletAppliedAmount ? Number(req.body.walletAppliedAmount) : 0;
    let calculatedWalletAppliedAmount = 0;
    if (useWallet && walletAppliedAmount > 0) {
      calculatedWalletAppliedAmount = Math.min(userDoc.walletBalance, totalBeforeWallet, walletAppliedAmount);
    }

    const calculatedTotalAmount = Math.max(0, totalBeforeWallet - calculatedWalletAppliedAmount);

    // 🟢 ASSERT AMOUNT MATCH
    if (Math.round(amount) !== Math.round(calculatedTotalAmount)) {
      return res.status(400).json({
        success: false,
        message: `Security validation: Price calculation mismatch. Expected: ₹${calculatedTotalAmount}, Received: ₹${amount}.`
      });
    }

    // Apply database updates to userDoc (deduct balances only now)
    if (useWallet && calculatedWalletAppliedAmount > 0) {
      userDoc.walletBalance -= calculatedWalletAppliedAmount;
    }
    if (pointsUsed > 0) {
      userDoc.loyaltyPoints = Math.max(0, userDoc.loyaltyPoints - pointsUsed);
    }

    const session = await mongoose.startSession();
    let transactionActive = false;
    try {
      await session.startTransaction();
      transactionActive = true;
    } catch (sessionError) {
      logger.info("MongoDB session/transaction could not be started, falling back to non-transactional flow.", { traceId });
    }

    const deductedProducts = [];
    let savedOrder;
    let razorpayOrder = null;

    try {
      // 🟢 THREAD-SAFE ATOMIC INVENTORY VALIDATION & LOCK LOOP (TOCTOU Proof)
      for (const item of verifiedItems) {
        const product = await Product.findOneAndUpdate(
          { _id: item.productId, countInStock: { $gte: item.qty } },
          { $inc: { countInStock: -item.qty } },
          { session: transactionActive ? session : undefined, new: true }
        );
        if (!product) {
          throw new Error(`Out of stock: ${item.name}`);
        }
        if (product.countInStock <= 0) {
          await Product.findByIdAndUpdate(
            item.productId,
            { stock: "out" },
            { session: transactionActive ? session : undefined }
          );
        }
        deductedProducts.push({ productId: item.productId, qty: item.qty });
      }

      if (paymentMethod === "Razorpay" && Number(amount) > 0) {
        // External APIs are called outside transaction locks as they shouldn't block DB
        razorpayOrder = await instance.orders.create({
          amount: Math.round(Number(amount) * 100),
          currency: "INR",
          receipt: `receipt_${Date.now()}`
        });
      }

      const orderData = {
        user: req.user._id,
        items: verifiedItems,
        shippingAddress,
        itemsPrice: recalculatedItemsPrice,
        taxPrice: calculatedTaxPrice,
        shippingPrice: calculatedShippingPrice,
        discount: calculatedCouponDiscount + loyaltyDiscount + giftCardDiscount + calculatedWalletAppliedAmount,
        couponCode: reqCouponCode || undefined,
        couponDiscount: calculatedCouponDiscount,
        walletAppliedAmount: calculatedWalletAppliedAmount,
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
        fraudFingerprint: req.fraudFingerprint || undefined,
      };

      if (idempotencyKey) {
        orderData.idempotencyKey = idempotencyKey;
      }

      const newOrder = new Order(orderData);
      savedOrder = await newOrder.save({ session: transactionActive ? session : undefined });

      // Log the wallet transaction
      if (useWallet && calculatedWalletAppliedAmount > 0) {
        if (!userDoc.walletTransactions) {
          userDoc.walletTransactions = [];
        }
        userDoc.walletTransactions.push({
          amount: calculatedWalletAppliedAmount,
          type: "Debit",
          description: `Applied to Order #${savedOrder.orderId || savedOrder._id.toString().substring(18)}`,
          date: new Date()
        });
      }

      // Increment coupon used count if applicable
      if (couponDoc) {
        couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
        await couponDoc.save({ session: transactionActive ? session : undefined });

        if (couponDoc.isPromoPush && couponDoc.visitorId) {
          try {
            const VisitorLog = (await import("../models/VisitorLog.js")).default;
            await VisitorLog.findOneAndUpdate(
              { visitorId: couponDoc.visitorId },
              { $set: { promoStatus: "used" } }
            );
          } catch (vErr) {
            console.error("Failed to update VisitorLog promoStatus to used:", vErr.message);
          }
        }
      }

      userDoc.cart = [];
      await userDoc.save({ session: transactionActive ? session : undefined });

      // Save gift card updates if applicable
      if (giftCardDocToSave) {
        await giftCardDocToSave.save({ session: transactionActive ? session : undefined });
      }

      if (transactionActive) {
        await session.commitTransaction();
      }
    } catch (checkoutError) {
      if (transactionActive) {
        await session.abortTransaction();
      } else {
        // Rollback any successfully locked products in this execution loop manually
        for (const rolledBack of deductedProducts) {
          await Product.findByIdAndUpdate(rolledBack.productId, {
            $inc: { countInStock: rolledBack.qty },
            $set: { stock: "in" }
          });
        }
      }
      session.endSession();
      return res.status(400).json({ success: false, message: checkoutError.message });
    }
    session.endSession();

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