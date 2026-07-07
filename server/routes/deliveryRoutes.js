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

    // Find corresponding User for this DeliveryPartner to emit direct socket alert
    const User = (await import("../models/User.js")).default;
    const driverUser = await User.findOne({
      $or: [
        { email: partner.email },
        { phone: partner.phone }
      ]
    });

    if (req.io) {
      req.io.emit("FLEET_UPDATE");
      if (driverUser) {
        req.io.emit("ORDER_DISPATCHED", {
          driverId: driverUser._id.toString(),
          order: order
        });
      }
    }

    res.json({ success: true, message: "Rider assigned and order dispatched!" });
  } catch (err) {
    res.status(500).json({ message: "Assignment failed" });
  }
});

// ── GET /api/delivery/my-orders — Fetch assigned orders for logged-in driver ──
router.get("/my-orders", protect, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "admin") {
      filter = { status: { $in: ["Processing", "Shipped", "Out for Delivery"] } };
    } else {
      // Find the corresponding DeliveryPartner document for this logged-in user
      const partner = await DeliveryPartner.findOne({
        $or: [
          { email: req.user.email },
          { phone: req.user.phone }
        ]
      });

      if (!partner) {
        return res.json([]);
      }

      filter = {
        deliveryPartner: partner._id,
        status: { $in: ["Processing", "Shipped", "Out for Delivery"] }
      };
    }
    
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

    // Guard: Verify order is assigned to this driver (if they are not an admin)
    if (req.user.role !== "admin") {
      const partner = await DeliveryPartner.findOne({
        $or: [
          { email: req.user.email },
          { phone: req.user.phone }
        ]
      });

      if (!partner || order.deliveryPartner.toString() !== partner._id.toString()) {
        return res.status(403).json({ message: "Access denied: Order is not assigned to you." });
      }
    }

    order.status = status;
    
    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (podUrl) order.proofOfDelivery = podUrl;
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
    const partner = await DeliveryPartner.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });

    if (!partner) {
      return res.json({
        dailyEarnings: 0,
        tips: 0,
        fuelBonus: 0,
        totalDeliveries: 0,
        onTimeDeliveryRate: 100
      });
    }

    const totalDeliveries = await Order.countDocuments({
      deliveryPartner: partner._id,
      status: "Delivered"
    });

    res.json({
      dailyEarnings: totalDeliveries * 45, // ₹45 per delivery
      tips: totalDeliveries * 10,         // ₹10 tip average
      fuelBonus: totalDeliveries * 5,     // ₹5 fuel bonus
      totalDeliveries,
      onTimeDeliveryRate: 98
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
