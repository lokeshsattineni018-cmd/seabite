import express from "express";
import Order from "../models/Order.js";
import Complaint from "../models/Complaint.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { cancelOrder, updateOrderStatus, deleteOrder, createComplaint } from "../controllers/orderController.js";
// 🟢 ADDED: Import the email service to trigger the confirmation mail
import { sendOrderPlacedEmail } from "../utils/emailService.js";

const router = express.Router();

// 🟢 GET ALL ORDERS (Admin Only)
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate({
        path: "items.productId",
        select: "name image reviews"
      })
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin orders" });
  }
});

// 🟢 GET UNASSIGNED ORDERS (For Fleet Management)
router.get("/unassigned", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ["Pending", "Processing", "Cooking", "Ready"] },
      deliveryPartner: { $exists: false }
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unassigned orders" });
  }
});

// --- USER ORDERS HISTORY ---
router.get("/myorders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.productId", "name image reviews")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// --- SINGLE ORDER DETAILS ---
router.get("/:orderId", protect, async (req, res) => {
  try {
    const isNumeric = !isNaN(req.params.orderId);
    let query = isNumeric ? { orderId: req.params.orderId } : { _id: req.params.orderId };

    const order = await Order.findOne(query)
      .populate("user", "name email")
      .populate("items.productId", "name image reviews");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🟢 NEW: Fetch associated complaints for this order
    const complaints = await Complaint.find({ order: order._id }).sort({ createdAt: -1 });

    // 🔐 ENHANCEMENT: Fallback calculation for legacy orders missing summary fields
    const orderObj = order.toObject();
    orderObj.complaints = complaints; // Attach complaints to the response
    if (!orderObj.itemsPrice || orderObj.itemsPrice === 0) {
      orderObj.itemsPrice = orderObj.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      orderObj.shippingPrice = orderObj.itemsPrice < 1000 ? 99 : 0;
      orderObj.taxPrice = Math.round((orderObj.itemsPrice - (orderObj.discount || 0)) * 0.05);
      // We don't save back to DB here to avoid side effects on GET, just return for display
    }

    res.status(200).json(orderObj);
  } catch (error) {
    res.status(500).json({ message: "Invalid Order ID format" });
  }
});

// --- ADMIN STATUS UPDATE ---
router.put("/:id/status", protect, admin, updateOrderStatus);

// --- USER CANCEL ORDER ---
router.put("/:id/cancel", protect, cancelOrder);

// --- USER SUBMIT COMPLAINT ---
router.post("/:id/complaint", protect, createComplaint);

// --- USER CONFIRM QUALITY ---
router.put("/:id/confirm-quality", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Not authorized" });

    order.qualityConfirmed = true;
    order.qualityConfirmedAt = Date.now();
    await order.save();

    res.status(200).json({ message: "Quality confirmed! Thank you." });
  } catch (error) {
    res.status(500).json({ message: "Failed to confirm quality" });
  }
});

// --- ADMIN DELETE ORDER ---
router.delete("/:id", protect, admin, deleteOrder);

// ===============================================
// 🟢 PLACE ORDER (With Email Trigger)
// ===============================================
router.post("/", protect, async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      deliveryAddress,
      discount,
      itemsPrice,
      taxPrice,
      shippingPrice,
      paymentMethod,
      isPaid,
      paymentId,
      razorpay_order_id
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // 🛡️ PIN CODE VALIDATION: Only AP & TS delivery (500001–535999)
    const zip = deliveryAddress?.zip;
    if (!zip) {
      return res.status(400).json({ message: "Pincode is required for delivery" });
    }
    const pinNum = parseInt(zip, 10);
    if (isNaN(pinNum) || pinNum < 500001 || pinNum > 535999) {
      return res.status(400).json({ message: "Sorry, we currently deliver only in Andhra Pradesh & Telangana (Pincode: 500001–535999)" });
    }

    const newOrder = new Order({
      user: req.user._id,
      items,
      totalAmount,
      discount: discount || 0,
      itemsPrice: itemsPrice || 0,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      paymentMethod: paymentMethod || "COD",
      isPaid: isPaid || false,
      paidAt: isPaid ? Date.now() : null,
      paymentId: paymentId || null,
      razorpay_order_id: razorpay_order_id || null,
      shippingAddress: {
        fullName: deliveryAddress.fullName,
        phone: deliveryAddress.phone,
        houseNo: deliveryAddress.houseNo || "",
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zip: deliveryAddress.zip
      }
    });

    const savedOrder = await newOrder.save();

    // 🟢 TRIGGER: Send the Premium Order Confirmation Email
    // Since we are inside 'protect', req.user is available
    try {
      await sendOrderPlacedEmail(
        req.user.email,
        req.user.name,
        savedOrder.orderId || savedOrder._id,
        savedOrder.totalAmount,
        savedOrder.items
      );
      console.log(`✅ Confirmation email sent for Order #${savedOrder.orderId}`);
    } catch (mailErr) {
      console.error("❌ Email Trigger Failed:", mailErr.message);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;