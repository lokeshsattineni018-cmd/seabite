import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// Get live order location tracking simulation
router.get("/track/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Simulated coordinates (e.g. around Bhimavaram/Hyderabad)
    const baseLat = 17.3850;
    const baseLng = 78.4867;
    const randomOffset = (Math.random() - 0.5) * 0.02;

    res.json({
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      estimatedDeliveryTime: order.estimatedDeliveryTime || new Date(Date.now() + 30 * 60 * 1000),
      driverName: "Ravi Kumar",
      driverPhone: "+91 98765 43211",
      coordinates: {
        lat: baseLat + randomOffset,
        lng: baseLng + randomOffset
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load tracking data" });
  }
});

// Modify order within grace window (e.g. 5 minutes)
router.put("/:id/modify", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Check grace window
    const diff = (Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60;
    if (diff > 5) {
      return res.status(400).json({ error: "Modification grace window (5 minutes) has expired." });
    }

    if (req.body.items) order.items = req.body.items;
    if (req.body.shippingAddress) order.shippingAddress = req.body.shippingAddress;
    
    order.modifications.push({
      modifiedBy: "customer",
      changes: req.body,
      reason: req.body.reason || "Customer requested change"
    });

    await order.save();
    res.json({ message: "Order modified successfully!", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to modify order" });
  }
});

export default router;
