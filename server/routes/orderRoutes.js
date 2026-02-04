import express from "express";
import Order from "../models/Order.js"; 
import { protect, admin } from "../middleware/authMiddleware.js";
import { cancelOrder, updateOrderStatus } from "../controllers/orderController.js"; 
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
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Invalid Order ID format" });
  }
});

// --- ADMIN STATUS UPDATE ---
router.put("/:id/status", protect, admin, updateOrderStatus);

// --- USER CANCEL ORDER ---
router.put("/:id/cancel", protect, cancelOrder);

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