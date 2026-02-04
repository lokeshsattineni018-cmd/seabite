import express from "express";
import Order from "./models/Order.js"; 
import adminAuth from "../middleware/adminAuth.js"; 
import authMiddleware from "../middleware/authMiddleware.js"; 
import mongoose from "mongoose";

const router = express.Router();

/* ================== CREATE NEW ORDER (AUTHENTICATED USER) ================== */
// POST /api/orders
router.post("/", authMiddleware, async (req, res) => {
  const { items, totalAmount, deliveryAddress } = req.body;
  
  const userId = req.user?._id; 

  if (!userId) {
     return res.status(401).json({ message: "Not authorized. Please log in." });
  }

  // Check: Ensure the userId is a valid MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid User ID Format:", userId);
      return res.status(400).json({ message: "Invalid user ID format provided." });
  }

  // Basic validation
  if (!items || items.length === 0 || !totalAmount || !deliveryAddress) {
    return res.status(400).json({ message: "Order data is incomplete (missing items, total, or address)." });
  }

  try {
    const order = new Order({
      user: userId,
      items,
      totalAmount,
      shippingAddress: deliveryAddress,
    });

    const createdOrder = await order.save();
    
    res.status(201).json(createdOrder);
    
  } catch (err) {
    console.error("❌ ORDER SAVE FAILED:", err);
    
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ 
            message: "Order validation failed.", 
            details: messages 
        });
    } 
    
    if (err.name === 'CastError') {
         return res.status(400).json({ 
            message: "Data format error.", 
            details: `Failed to cast field: ${err.path}`
        });
    }

    res.status(500).json({ 
        message: "An unexpected server error occurred.",
        error: err.message
    });
  }
});

/* ================== GET USER'S ORDERS (AUTHENTICATED USER) ================== */
// GET /api/orders/my
router.get("/my", authMiddleware, async (req, res) => {
  try {
    // Find all orders where the 'user' field matches the ID of the logged-in user
    const orders = await Order.find({ user: req.user._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ GET USER ORDERS FAILED:", err);
    res.status(500).json({ message: "Failed to fetch user orders.", error: err.message });
  }
});


/* ================== GET ALL ORDERS (ADMIN) ================== */
// GET /api/orders
// NOTE: This must remain *after* the /my route to prevent blocking it.
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================== UPDATE ORDER STATUS (ADMIN) ================== */
router.put("/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;