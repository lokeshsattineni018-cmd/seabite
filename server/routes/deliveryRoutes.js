import express from "express";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// 🟢 GET ALL PARTNERS
router.get("/partners", adminAuth, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find();
    res.json(partners);
  } catch (err) {
    res.status(500).json({ message: "Error fetching partners" });
  }
});

// 🟢 CREATE PARTNER
router.post("/partners", adminAuth, async (req, res) => {
  try {
    const partner = new DeliveryPartner(req.body);
    await partner.save();
    res.status(201).json(partner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🟢 UPDATE PARTNER
router.put("/partners/:id", adminAuth, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(partner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 🟢 ASSIGN ORDER
router.post("/assign", adminAuth, async (req, res) => {
  const { orderId, partnerId } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    // Update Order
    order.deliveryPartner = partnerId;
    order.deliveryStatus = "Assigned";
    order.status = "Shipped"; // Auto transition
    order.statusHistory.push({
      status: "Shipped",
      message: `Order assigned to delivery partner: ${partner.name}`
    });
    await order.save();

    // Update Partner
    partner.activeOrders.push(orderId);
    partner.status = "On Delivery";
    await partner.save();

    res.json({ message: "Order assigned successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟢 UPDATE DELIVERY STATUS (For Partner App/View)
router.put("/status/:orderId", async (req, res) => {
  const { status, lat, lng } = req.body;
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.deliveryStatus = status;
    if (status === "Delivered") {
      order.status = "Delivered";
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.statusHistory.push({
        status: "Delivered",
        message: "Order successfully delivered by partner."
      });
      
      // Update Partner stats
      if (order.deliveryPartner) {
        const partner = await DeliveryPartner.findById(order.deliveryPartner);
        if (partner) {
            partner.activeOrders = partner.activeOrders.filter(id => id.toString() !== order._id.toString());
            partner.completedOrdersCount += 1;
            if (partner.activeOrders.length === 0) partner.status = "Active";
            await partner.save();
        }
      }
    } else {
        order.statusHistory.push({
            status: "Out for Delivery",
            message: `Delivery status updated to: ${status}`
        });
    }
    await order.save();

    // Update location if provided
    if (lat && lng && order.deliveryPartner) {
        await DeliveryPartner.findByIdAndUpdate(order.deliveryPartner, {
            location: { lat, lng },
            lastLocationUpdate: Date.now()
        });
    }

    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
