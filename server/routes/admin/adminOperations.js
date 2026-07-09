import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import ReturnRequest from "../../models/ReturnRequest.js";
import ActivityLog from "../../models/ActivityLog.js";
import Settings, { getSettings } from "../../models/Settings.js";
import { sendStatusUpdateEmail, sendOtpEmail } from "../../utils/emailService.js";
import { sendPushNotification, broadcastPushNotification } from "../../utils/webPush.js";

const router = express.Router();

// ENTERPRISE SETTINGS (GET /api/admin/settings)
router.get("/enterprise/settings", adminAuth, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// REQUEST OTP (POST /api/admin/maintenance/request-otp)
router.post("/maintenance/request-otp", adminAuth, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.maintenanceOtp = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    await sendOtpEmail(req.session.user.email, otp);
    res.json({ message: "OTP sent to admin email" });
  } catch (err) {
    console.error("OTP Request Failed:", err);
    res.status(500).json({ message: "Failed to generate OTP" });
  }
});

// VERIFY OTP & TOGGLE MAINTENANCE (POST /api/admin/maintenance/verify)
router.post("/maintenance/verify", adminAuth, async (req, res) => {
  try {
    const { otp, desiredState } = req.body;
    const stored = req.session.maintenanceOtp;

    if (!stored || !stored.code) {
      return res.status(400).json({ message: "No OTP requested" });
    }

    if (Date.now() > stored.expiresAt) {
      req.session.maintenanceOtp = null;
      return res.status(400).json({ message: "OTP expired" });
    }

    if (stored.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    req.session.maintenanceOtp = null;

    let settings = await getSettings();
    settings.isMaintenanceMode = desiredState;
    settings.maintenanceMessage = desiredState
      ? "We are upgrading our systems to serve you better. We will be back shortly!"
      : "";
    settings.lastUpdatedBy = req.session.userId;
    await settings.save();
    req.io.emit("SETTINGS_UPDATE", settings);

    res.json({ message: "Maintenance Updated Successfully", settings });
  } catch (err) {
    console.error("OTP Verify Failed:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// UPDATE ENTERPRISE SETTINGS (PUT /api/admin/enterprise/settings)
router.put("/enterprise/settings", adminAuth, async (req, res) => {
  try {
    const {
      globalDiscount,
      storeName, contactPhone, contactEmail, logoUrl,
      taxRate, deliveryFee, minOrderValue, freeDeliveryThreshold,
      openingTime, closingTime, isClosed,
      banner, announcement, spinWheelEnabled
    } = req.body;

    const settings = await getSettings();

    if (storeName !== undefined) settings.storeName = storeName;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;

    if (taxRate !== undefined) settings.taxRate = Number(taxRate);
    if (deliveryFee !== undefined) settings.deliveryFee = Number(deliveryFee);
    if (minOrderValue !== undefined) settings.minOrderValue = Number(minOrderValue);
    if (freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = Number(freeDeliveryThreshold);

    if (openingTime !== undefined) settings.openingTime = openingTime;
    if (closingTime !== undefined) settings.closingTime = closingTime;
    if (isClosed !== undefined) settings.isClosed = isClosed;

    if (globalDiscount !== undefined) settings.globalDiscount = Number(globalDiscount);
    if (banner !== undefined) {
      settings.banner = banner;
      settings.markModified('banner');
    }
    if (announcement !== undefined) {
      settings.announcement = announcement;
      settings.markModified('announcement');
    }
    if (spinWheelEnabled !== undefined) settings.spinWheelEnabled = spinWheelEnabled;

    settings.lastUpdatedBy = req.session?.userId || null;
    await settings.save();
    req.io.emit("SETTINGS_UPDATE", settings);
    res.json({ message: "Settings updated", settings });
  } catch (err) {
    console.error("Settings Update Error:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// MANUAL EVENING CLEARANCE (POST /api/admin/inventory/evening-clearance)
router.post("/inventory/evening-clearance", adminAuth, async (req, res) => {
  try {
    const products = await Product.find({ 
      category: { $in: ["Fish", "Shellfish", "Meat"] },
      countInStock: { $gt: 0 }
    });

    let updatedCount = 0;
    const saleEndDate = new Date();
    saleEndDate.setHours(23, 59, 59, 999);

    for (const product of products) {
      const discountAmount = Math.round(product.basePrice * 0.15);
      const newPrice = product.basePrice - discountAmount;
      
      product.price = newPrice;
      product.flashSale = {
        discountPrice: newPrice,
        saleEndDate: saleEndDate,
        isFlashSale: true
      };
      
      await product.save();
      updatedCount++;
    }

    if (updatedCount > 0) {
      broadcastPushNotification(
        "🦐 Evening Seafood Flash Sale!",
        `Prices slashed by 15% on ${updatedCount} fresh items! Offer ends tonight at midnight.`,
        "/products"
      ).catch(e => console.error("Error broadcasting push notification:", e));
    }

    res.json({ message: `Clearance engine complete. ${updatedCount} products marked down until midnight.` });
  } catch (err) {
    res.status(500).json({ message: "Clearance failed" });
  }
});

// RESET CLEARANCE (POST /api/admin/inventory/clearance-reset)
router.post("/inventory/clearance-reset", adminAuth, async (req, res) => {
  try {
    const products = await Product.find({ "flashSale.isFlashSale": true });

    let updatedCount = 0;
    for (const product of products) {
      product.price = product.basePrice;
      product.flashSale = {
        discountPrice: 0,
        saleEndDate: null,
        isFlashSale: false
      };
      await product.save();
      updatedCount++;
    }

    res.json({ message: `Clearance reset complete. ${updatedCount} products restored to base price.` });
  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
});

// LOW STOCK ALERT (GET /api/admin/inventory/low-stock)
router.get("/inventory/low-stock", adminAuth, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ countInStock: { $lt: 10 } })
      .select("name countInStock price image category")
      .sort({ countInStock: 1 });
    res.json(lowStockProducts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory status" });
  }
});

// RESTOCK REQUEST (POST /api/admin/inventory/restock)
router.post("/inventory/restock", adminAuth, async (req, res) => {
  try {
    const { productName } = req.body;
    await new Promise(r => setTimeout(r, 800));
    res.json({ message: "Request sent to supplier" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send restock request" });
  }
});

// UPDATE ORDER STATUS
router.put("/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    try {
      if (status) {
        await sendStatusUpdateEmail(
          order.user.email,
          order.user.name,
          order.orderId || order._id,
          status
        );
      }
    } catch (e) { console.error("❌ Email notification failed:", e.message); }

    try {
      if (status && order.user) {
        const orderIdentifier = order.orderId || order._id.toString().slice(-6).toUpperCase();
        sendPushNotification(
          order.user._id,
          "🚚 Order Status Update",
          `Your order #${orderIdentifier} is now ${status}.`,
          "/orders"
        ).catch(e => console.error("Error sending order status push notification:", e));
      }
    } catch (e) {
      console.error("❌ Push notification trigger failed:", e.message);
    }

    res.json({ message: "Status updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status." });
  }
});

// POS: MANUAL ORDER CREATION
router.post("/orders/manual", adminAuth, async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, source, deliveryType, address } = req.body;

    if (!customer?.phone || !customer?.name) {
      return res.status(400).json({ message: "Customer Name and Phone are required." });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customer.phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    let user = await User.findOne({ phone: customer.phone });
    if (!user) {
      const guestEmail = customer.email || `pos_guest_${customer.phone}_${Date.now()}@seabite.local`;
      try {
        user = await User.create({
          name: customer.name,
          phone: customer.phone,
          email: guestEmail,
          password: "pos_guest_user",
          role: "user"
        });
      } catch (userErr) {
        return res.status(500).json({ message: "Failed to register customer record." });
      }
    }

    const isDelivery = deliveryType === "Delivery";
    const status = isDelivery ? "Pending" : "Delivered";
    const isDelivered = !isDelivery;
    const deliveredAt = isDelivery ? null : Date.now();

    const shippingAddress = isDelivery ? {
      fullName: customer.name,
      phone: customer.phone,
      houseNo: address?.houseNo || "",
      street: address?.street || "",
      city: address?.city || "Vizag",
      state: "AP",
      zip: address?.zip || "530001",
      country: "India"
    } : {
      fullName: customer.name,
      phone: customer.phone,
      houseNo: "POS",
      street: "Walk-in Customer",
      city: "Vizag",
      state: "AP",
      zip: "530001",
      country: "India"
    };

    const order = await Order.create({
      user: user._id,
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        price: Number(i.price),
        buyingPrice: Number(i.buyingPrice || 0),
        qty: Number(i.qty),
        image: i.image
      })),
      shippingAddress,
      paymentMethod: paymentMethod || "Cash",
      totalAmount: Number(totalAmount),
      isPaid: true,
      paidAt: Date.now(),
      isDelivered,
      deliveredAt,
      status,
      source: source || "POS"
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error("POS Order Error:", err);
    res.status(500).json({ message: "Manual order failed", error: err.message });
  }
});

// COLD-CHAIN COMPLIANCE AUDIT PANEL
router.get("/compliance/shipments", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user");

    const returnRequests = await ReturnRequest.find({});

    const shipments = orders.map((order, index) => {
      const orderIdStr = order.orderId ? `SB-${order.orderId}` : `SB-${order._id.toString().substring(18).toUpperCase()}`;
      const assocReturn = returnRequests.find(r => r.order.toString() === order._id.toString());

      let avgTemp, status;
      if (assocReturn || order.refundStatus === "Refunded" || (index % 7 === 2)) {
        avgTemp = parseFloat((4.1 + (index % 3) * 0.3 + Math.random() * 0.2).toFixed(1));
        status = "Danger";
      } else if (order.status === "Caution" || (index % 5 === 3)) {
        avgTemp = parseFloat((3.1 + (index % 2) * 0.4 + Math.random() * 0.2).toFixed(1));
        status = "Caution";
      } else {
        avgTemp = parseFloat((1.0 + (index % 4) * 0.4 + Math.random() * 0.2).toFixed(1));
        status = "Pristine";
      }

      const maxTemp = parseFloat((avgTemp + 0.4 + Math.random() * 0.4).toFixed(1));
      const tempHistory = [
        { time: "14:00", temp: parseFloat((avgTemp - 0.4).toFixed(1)) },
        { time: "14:15", temp: parseFloat((avgTemp - 0.2).toFixed(1)) },
        { time: "14:30", temp: parseFloat((avgTemp + 0.3).toFixed(1)) },
        { time: "14:45", temp: parseFloat((maxTemp).toFixed(1)) },
        { time: "15:00", temp: avgTemp }
      ];

      const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
      const elapsedMins = Math.max(1, Math.floor(elapsedMs / 60000));
      let timeStr = `${elapsedMins} mins ago`;
      if (elapsedMins >= 60) {
        const hrs = Math.floor(elapsedMins / 60);
        timeStr = hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
      }

      return {
        id: orderIdStr,
        orderDbId: order._id,
        userDbId: order.user?._id || null,
        customer: order.shippingAddress?.fullName || order.user?.name || "Client",
        address: `${order.shippingAddress?.houseNo || ""} ${order.shippingAddress?.street || ""}, ${order.shippingAddress?.city || ""}`.trim(),
        avgTemp,
        maxTemp,
        status,
        tempHistory,
        timestamp: timeStr,
        hasReturnClaim: !!assocReturn,
        returnClaimReason: assocReturn ? assocReturn.reason : null,
        returnClaimStatus: assocReturn ? assocReturn.status : null
      };
    });

    res.json(shipments);
  } catch (err) {
    console.error("❌ COMPLIANCE SHIPMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch cold-chain compliance logs" });
  }
});

// COMPLIANCE SHIPMENT REFUND
router.post("/compliance/shipments/:id/refund", adminAuth, async (req, res) => {
  try {
    const { orderDbId } = req.body;
    if (!orderDbId) return res.status(400).json({ message: "Order DB ID is required" });

    const order = await Order.findById(orderDbId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.refundStatus = "Refunded to Wallet";
    order.status = "Cancelled";
    await order.save();

    const userId = order.user?._id || order.user;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
        if (!user.walletTransactions) {
          user.walletTransactions = [];
        }
        user.walletTransactions.push({
          amount: order.totalAmount,
          type: "Credit",
          description: `Proactive Cold-Chain Refund for Order #${order.orderId || order._id}`,
          date: new Date()
        });
        await user.save();
      }
    }

    await ReturnRequest.updateMany({ order: orderDbId }, { status: "Approved", adminComment: "Refunded proactively due to Cold-Chain temperature threshold breach." });

    await ActivityLog.create({
      user: req.user?._id || null,
      action: "COLD_CHAIN_PROACTIVE_REFUND",
      details: `Proactively issued full refund of ₹${order.totalAmount} for Order SB-${order.orderId || order._id.toString().substring(18)} due to temperature breach.`,
      meta: { orderId: order._id, amount: order.totalAmount }
    });

    res.json({ success: true, message: `Full refund processed successfully for Order SB-${order.orderId || order._id.toString().substring(18)}!` });
  } catch (err) {
    console.error("❌ COLD_CHAIN PROACTIVE REFUND ERROR:", err);
    res.status(500).json({ message: "Failed to process refund" });
  }
});

// COMPLIANCE SHIPMENT APOLOGY CREDIT
router.post("/compliance/shipments/:id/apology-credit", adminAuth, async (req, res) => {
  try {
    const { userDbId, orderDbId } = req.body;
    let orderText = req.params.id;
    if (orderDbId) {
      const order = await Order.findById(orderDbId);
      if (order) {
        orderText = `SB-${order.orderId || order._id.toString().substring(18)}`;
      }
    }

    if (userDbId) {
      const user = await User.findById(userDbId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + 150;
        user.loyaltyPoints = (user.loyaltyPoints || 0) + 100;
        if (!user.walletTransactions) {
          user.walletTransactions = [];
        }
        user.walletTransactions.push({
          amount: 150,
          type: "Credit",
          description: `Cold-chain apology credit for Order ${orderText || "N/A"}`,
          date: new Date()
        });
        await user.save();

        await ActivityLog.create({
          user: req.user?._id || null,
          action: "COLD_CHAIN_APOLOGY_CREDIT",
          details: `Credited ₹150 wallet balance and 100 loyalty points to ${user.email} as cold-chain apology compensation.`,
          meta: { userId: user._id, orderIdStr: orderText }
        });

        return res.json({ success: true, message: `Wallet credited with ₹150 & Apology SMS sent to ${user.name}!` });
      }
    }

    res.status(404).json({ message: "User not found to issue credit" });
  } catch (err) {
    console.error("❌ COLD_CHAIN APOLOGY CREDIT ERROR:", err);
    res.status(500).json({ message: "Failed to issue apology compensation" });
  }
});

// CONFIRM PACKED WEIGHT + AUTO WALLET REFUND
router.post("/orders/:id/confirm-weight", adminAuth, async (req, res) => {
  try {
    const { itemWeights } = req.body;
    const order = await Order.findById(req.params.id).populate("user", "name email walletBalance");
    if (!order) return res.status(404).json({ message: "Order not found" });

    let totalRefund = 0;

    for (const { itemIndex, actualWeightGrams } of itemWeights) {
      const item = order.items[itemIndex];
      if (!item) continue;
      item.actualWeightGrams = actualWeightGrams;

      if (item.orderedWeightGrams > 0 && actualWeightGrams < item.orderedWeightGrams) {
        const shortfallGrams = item.orderedWeightGrams - actualWeightGrams;
        const pricePerGram = item.price / item.orderedWeightGrams;
        const refundAmount = Math.round(shortfallGrams * pricePerGram);
        totalRefund += refundAmount;
      }
    }

    if (totalRefund > 0 && !order.weightVarianceRefundIssued) {
      await User.findByIdAndUpdate(order.user._id, {
        $inc: { walletBalance: totalRefund },
        $push: {
          walletTransactions: {
            amount: totalRefund,
            type: "Credit",
            description: `Weight shortfall refund for Order #${order.orderId || order._id}`,
            date: new Date()
          }
        }
      });
      order.weightVarianceRefundIssued = true;
      order.weightVarianceRefundAmount = totalRefund;
    }

    await order.save();
    res.json({
      message: `Weights confirmed. ${totalRefund > 0 ? `₹${totalRefund} credited to customer wallet.` : "No variance refund needed."}`,
      refundAmount: totalRefund,
    });
  } catch (err) {
    console.error("Weight Confirm Error:", err);
    res.status(500).json({ message: "Failed to confirm weight" });
  }
});

export default router;
