import express from "express";
import Order from "../models/Order.js"; 
// 🟢 Ensure Notification model is imported if you use it, or comment it out if not needed
// import Notification from "../models/notification.js"; 
import { protect, admin } from "../middleware/authMiddleware.js";
import { cancelOrder, updateOrderStatus } from "../controllers/orderController.js"; 

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
    console.error("Admin Order Fetch Error:", error);
    res.status(500).json({ message: "Failed to load admin orders" });
  }
});

// --- USER ORDERS HISTORY ---
router.get("/myorders", protect, async (req, res) => {
  try {
    // 🟢 Use req.user._id to ensure ObjectId matching
    const orders = await Order.find({ user: req.user._id })
      .populate("items.productId", "name image reviews") 
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// --- SINGLE ORDER DETAILS ---
router.get("/:orderId", protect, async (req, res) => {
  try {
    // 🟢 Check if orderId is a valid numeric ID (from your counter) or Mongo ID
    const isNumeric = !isNaN(req.params.orderId);
    
    let query;
    if (isNumeric) {
        query = { orderId: req.params.orderId };
    } else {
        query = { _id: req.params.orderId };
    }

    const order = await Order.findOne(query)
      .populate("user", "name email")
      .populate("items.productId", "name image reviews");
    
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    console.error("Order Detail Error:", error);
    res.status(500).json({ message: "Invalid Order ID format" });
  }
});

// --- ADMIN STATUS UPDATE ---
router.put("/:id/status", protect, admin, updateOrderStatus);

// --- USER CANCEL ORDER ---
router.put("/:id/cancel", protect, cancelOrder);

// 🟢 PLACE ORDER (Legacy/Manual Route - Updated to match Schema)
// Note: Your Razorpay checkout currently uses paymentRoutes.js, not this one.
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

    // Safety check for images
    const processedItems = items.map(item => ({
      ...item,
      image: item.image ? item.image.split('/').pop().split('\\').pop() : "" 
    }));

    const newOrder = new Order({
      user: req.user._id, // Use _id for consistency
      items: processedItems,
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
        // 🟢 ADDED houseNo to match your Schema requirements
        houseNo: deliveryAddress.houseNo || "", 
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zip: deliveryAddress.zip
      }
    });

    const savedOrder = await newOrder.save();
    
    // Notification logic (Optional - ensure Notification model exists)
    // await Notification.create({
    //   user: req.user._id,
    //   message: `📦 Order #${savedOrder.orderId} successfully placed!`,
    //   orderId: savedOrder._id,
    //   statusType: "Pending"
    // });

    res.status(201).json(savedOrder); 
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;