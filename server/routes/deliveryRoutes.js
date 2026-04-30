import express from "express";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. GET: All active partners
router.get("/partners", protect, admin, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find();
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch partners" });
  }
});

// 2. POST: Create a new partner
router.post("/partners", protect, admin, async (req, res) => {
  try {
    const { name, phone, vehicleNumber, vehicleType, email, password } = req.body;
    const partner = await DeliveryPartner.create({ 
      name, 
      phone, 
      vehicleNumber, 
      vehicleType,
      email: email || `${phone}@seabite.com`,
      password: password || "rider123" // Default password for now
    });
    res.status(201).json(partner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 2. POST: Assign order to partner
router.post("/assign", protect, admin, async (req, res) => {
  try {
    const { orderId, partnerId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) return res.status(404).json({ message: "Rider not found" });

    // Update Order
    order.status = "Shipped"; // Or "Out for Delivery"
    order.isShipped = true;
    order.shippedAt = Date.now();
    order.deliveryPartner = partnerId;
    await order.save();

    // Update Partner
    partner.activeOrders.push(orderId);
    await partner.save();

    res.json({ success: true, message: "Rider assigned and order dispatched!" });
  } catch (err) {
    res.status(500).json({ message: "Assignment failed" });
  }
});

export default router;
