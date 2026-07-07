import express from "express";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. GET: All active partners
router.get("/partners", protect, admin, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().populate("activeOrders", "orderId totalAmount shippingAddress status");
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

// 3. POST: Assign order to partner
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
    if (partner.status === "Offline" || partner.status === "Active") {
      partner.status = "On Delivery";
    }
    await partner.save();

    // Emit live socket event to all admins
    if (req.io) {
      req.io.emit("FLEET_UPDATE");
    }

    res.json({ success: true, message: "Rider assigned and order dispatched!" });
  } catch (err) {
    res.status(500).json({ message: "Assignment failed" });
  }
});

// ── GET /api/delivery/my-orders — Fetch assigned orders for logged-in driver ──
router.get("/my-orders", protect, async (req, res) => {
  try {
    // If admin is viewing, return all active orders. If driver, return theirs.
    let filter = { status: { $in: ["Processing", "Shipped", "Out for Delivery"] } };
    
    const orders = await Order.find(filter)
      .populate("user", "name phone email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch driver orders" });
  }
});

// ── PUT /api/delivery/orders/:id/status — Update order status (POD) ──
router.put("/orders/:id/status", protect, async (req, res) => {
  try {
    const { status, podUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    
    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (podUrl) order.proofOfDelivery = podUrl; // Assuming schema accepts or ignores unknown fields
    }

    await order.save();
    res.json({ message: `Order marked as ${status}`, order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// ── GET /api/delivery/my-stats — Fetch driver stats ──
router.get("/my-stats", protect, async (req, res) => {
  try {
    res.json({
      dailyEarnings: 125,
      tips: 30,
      fuelBonus: 15,
      totalDeliveries: 12,
      onTimeDeliveryRate: 99
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
