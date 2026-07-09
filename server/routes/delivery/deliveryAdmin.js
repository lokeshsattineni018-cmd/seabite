import express from "express";
import DeliveryPartner from "../../models/DeliveryPartner.js";
import Order from "../../models/Order.js";
import { protect, admin } from "../../middleware/authMiddleware.js";
import auditTrail from "../../middleware/auditMiddleware.js";
import crypto from "crypto";

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
    const securePassword = password || crypto.randomBytes(8).toString("hex");
    const partner = await DeliveryPartner.create({ 
      name, 
      phone, 
      vehicleNumber, 
      vehicleType,
      email: email || `${phone}@seabite.com`,
      password: securePassword
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

    order.status = "Shipped";
    order.isShipped = true;
    order.shippedAt = Date.now();
    order.deliveryPartner = partnerId;
    await order.save();

    partner.activeOrders.push(orderId);
    if (partner.status === "Offline" || partner.status === "Active") {
      partner.status = "On Delivery";
    }
    await partner.save();

    const User = (await import("../../models/User.js")).default;
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

// ── GET /api/delivery/fleet-overview — Admin fleet console aggregated data ──
router.get("/fleet-overview", protect, admin, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOrders = await Order.find({
      deliveryPartner: { $ne: null },
      status: { $in: ["Shipped", "Out for Delivery", "Processing"] }
    }).populate("user", "name phone").populate("deliveryPartner", "name phone vehicleNumber").lean();

    const todayDelivered = await Order.find({
      status: "Delivered",
      deliveredAt: { $gte: today }
    }).populate("deliveryPartner", "name").lean();

    const partnerStats = await Promise.all(partners.map(async (p) => {
      const myActive = activeOrders.filter(o => o.deliveryPartner?._id?.toString() === p._id.toString());
      const myDelivered = todayDelivered.filter(o => o.deliveryPartner?._id?.toString() === p._id.toString());
      const todayEarnings = myDelivered.reduce((sum, o) => sum + (o.totalAmount || 0) * 0.08, 0);

      let onlineMinutes = p.totalOnlineMinutesToday || 0;
      if (p.status === "Active" && p.onlineStartedAt) {
        onlineMinutes += Math.floor((Date.now() - new Date(p.onlineStartedAt).getTime()) / 60000);
      }

      return {
        _id: p._id,
        name: p.name,
        phone: p.phone,
        vehicleNumber: p.vehicleNumber,
        vehicleType: p.vehicleType,
        status: p.status,
        activeOrders: myActive.length,
        activeOrderDetails: myActive.map(o => ({
          _id: o._id,
          orderId: o.orderId,
          customer: o.shippingAddress?.fullName || o.user?.name,
          status: o.status,
          area: o.shippingAddress?.city || o.shippingAddress?.street
        })),
        todayDeliveries: myDelivered.length,
        todayEarnings: Math.round(todayEarnings),
        onlineMinutes,
        fatigueWarning: onlineMinutes >= 480,
        fatigueLocked: onlineMinutes >= 600,
        streak: p.streak || 0,
        lastSOS: p.sosHistory?.length > 0 ? p.sosHistory[p.sosHistory.length - 1] : null,
        inspectionPassed: p.inspectionLog?.length > 0 && 
          new Date(p.inspectionLog[p.inspectionLog.length - 1].date).toDateString() === new Date().toDateString()
      };
    }));

    const onlineCount = partnerStats.filter(p => p.status === "Active").length;
    const offlineCount = partnerStats.filter(p => p.status !== "Active").length;
    const deliveringCount = partnerStats.filter(p => p.activeOrders > 0).length;
    const totalDeliveriesToday = todayDelivered.length;
    const totalEarningsToday = partnerStats.reduce((s, p) => s + p.todayEarnings, 0);
    const fatigueWarnings = partnerStats.filter(p => p.fatigueWarning).length;
    const avgDeliveriesPerDriver = onlineCount > 0 ? Math.round(totalDeliveriesToday / onlineCount * 10) / 10 : 0;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSOS = partners
      .flatMap(p => (p.sosHistory || []).map(s => ({ ...s, driverName: p.name, driverId: p._id })))
      .filter(s => new Date(s.triggeredAt) >= yesterday)
      .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));

    res.json({
      partners: partnerStats,
      activeDeliveries: activeOrders.map(o => ({
        _id: o._id,
        orderId: o.orderId,
        driver: o.deliveryPartner?.name,
        customer: o.shippingAddress?.fullName || o.user?.name,
        customerPhone: o.shippingAddress?.phone || o.user?.phone,
        area: o.shippingAddress?.city,
        status: o.status,
        createdAt: o.createdAt
      })),
      fleetStats: {
        online: onlineCount,
        offline: offlineCount,
        delivering: deliveringCount,
        totalDeliveriesToday,
        totalEarningsToday,
        fatigueWarnings,
        avgDeliveriesPerDriver,
        inspectionPassRate: partners.length > 0
          ? Math.round(partnerStats.filter(p => p.inspectionPassed).length / partners.length * 100)
          : 0
      },
      sosAlerts: recentSOS.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fleet overview" });
  }
});

export default router;
