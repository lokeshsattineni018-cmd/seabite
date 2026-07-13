import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// Get live order location tracking simulation
router.get("/track/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate("deliveryPartner")
      .lean();
      
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Fallback coordinates (Bhimavaram zone)
    const baseLat = 16.5449;
    const baseLng = 81.5212;

    const coordinates = (order.deliveryPartner && order.deliveryPartner.currentLocation && order.deliveryPartner.currentLocation.lat) 
      ? { lat: order.deliveryPartner.currentLocation.lat, lng: order.deliveryPartner.currentLocation.lng }
      : { lat: baseLat, lng: baseLng };

    const customerCoordinates = (order.shippingAddress && order.shippingAddress.lat)
      ? { lat: order.shippingAddress.lat, lng: order.shippingAddress.lng }
      : { lat: baseLat, lng: baseLng };

    res.json({
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      estimatedDeliveryTime: order.estimatedDeliveryTime || new Date(Date.now() + 30 * 60 * 1000),
      driverName: order.deliveryPartner ? order.deliveryPartner.name : "Rider Pending",
      driverPhone: order.deliveryPartner ? order.deliveryPartner.phone : "None",
      coordinates,
      customerCoordinates
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
