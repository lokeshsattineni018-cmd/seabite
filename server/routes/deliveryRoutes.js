import express from "express";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { sendStatusUpdateEmail } from "../utils/emailService.js";
import { sendPushNotification } from "../utils/webPush.js";

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
    const { status, podUrl, signature } = req.body;
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

    // Guard: Prevent modification of already delivered or cancelled orders
    if (order.status === "Delivered" || order.status.includes("Cancelled")) {
      return res.status(400).json({ message: "Cannot change status of already Delivered or Cancelled orders." });
    }

    // Populate user to get customer details
    const populatedOrder = await Order.findById(req.params.id).populate("user");
    if (!populatedOrder) return res.status(404).json({ message: "Order not found" });

    populatedOrder.status = status;
    
    if (status === "Delivered") {
      if (!podUrl || !signature) {
        return res.status(400).json({ message: "Both Photo POD and Customer Signature are required to mark as Delivered." });
      }
      populatedOrder.isDelivered = true;
      populatedOrder.deliveredAt = new Date();
      populatedOrder.deliveryProof = {
        photoUrl: podUrl,
        signature: signature,
        capturedAt: new Date()
      };
    }

    await populatedOrder.save();

    // Trigger customer notification e-mails & pushes
    try {
      if (populatedOrder.user && populatedOrder.user.email) {
        let partnerInfo = null;
        if (populatedOrder.deliveryPartner) {
          partnerInfo = await DeliveryPartner.findById(populatedOrder.deliveryPartner);
        }

        await sendStatusUpdateEmail(
          populatedOrder.user.email,
          populatedOrder.user.name || "Customer",
          populatedOrder.orderId || populatedOrder._id,
          status,
          populatedOrder.items || [],
          partnerInfo ? {
            name: partnerInfo.name,
            phone: partnerInfo.phone,
            vehicleNumber: partnerInfo.vehicleNumber,
            vehicleType: partnerInfo.vehicleType
          } : null
        );
      }
    } catch (e) {
      console.error("Email update notify failed:", e.message);
    }

    try {
      if (populatedOrder.user) {
        const orderIdentifier = populatedOrder.orderId || populatedOrder._id.toString().slice(-6).toUpperCase();
        await sendPushNotification(
          populatedOrder.user._id,
          "🚚 Delivery Status Update",
          `Your order #${orderIdentifier} is now ${status}.`,
          "/orders"
        );
      }
    } catch (e) {
      console.error("Push update notify failed:", e.message);
    }

    res.json({ message: `Order marked as ${status}`, order: populatedOrder });
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

// ── PUT /api/delivery/status — Toggle driver duty with fatigue + inspection gating ──
router.put("/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Offline"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });

    if (!partner) return res.status(404).json({ message: "Delivery partner not found" });

    // Going Online checks
    if (status === "Active") {
      // Fatigue guard: check if already online 10+ hours today
      if (partner.totalOnlineMinutesToday >= 600) {
        return res.status(403).json({ message: "FATIGUE_LIMIT", detail: "You've been online 10+ hours today. Take a break!" });
      }

      // Inspection guard: check if today's inspection is done
      const today = new Date().toISOString().slice(0, 10);
      const inspectedToday = partner.inspectionLog?.some(i => 
        i.date && new Date(i.date).toISOString().slice(0, 10) === today && i.passed
      );
      if (!inspectedToday) {
        return res.status(403).json({ message: "INSPECTION_REQUIRED", detail: "Complete your vehicle inspection before going online." });
      }

      partner.onlineStartedAt = new Date();
    }

    // Going Offline: calculate session minutes
    if (status === "Offline" && partner.onlineStartedAt) {
      const mins = Math.round((Date.now() - new Date(partner.onlineStartedAt).getTime()) / 60000);
      partner.totalOnlineMinutesToday = (partner.totalOnlineMinutesToday || 0) + mins;
      partner.onlineStartedAt = null;
    }

    partner.status = status;
    await partner.save();

    if (req.io) req.io.emit("FLEET_UPDATE");

    res.json({ message: `Duty status updated to ${status}`, status: partner.status, partner });
  } catch (error) {
    res.status(500).json({ message: "Failed to update duty status" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TIER 1: OPERATIONAL INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════

// ── POST /api/delivery/inspection — Submit daily vehicle inspection ──
router.post("/inspection", protect, async (req, res) => {
  try {
    const { items } = req.body; // { tires: true, lights: true, iceBox: true, documents: true }
    const allPassed = items && items.tires && items.lights && items.iceBox && items.documents;

    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    partner.inspectionLog.push({ date: new Date(), items, passed: allPassed });
    // Reset daily online minutes at inspection time (start of shift)
    partner.totalOnlineMinutesToday = 0;
    await partner.save();

    res.json({ passed: allPassed, message: allPassed ? "Inspection passed! You can go online." : "Inspection incomplete. Please fix flagged items." });
  } catch (err) {
    res.status(500).json({ message: "Failed to save inspection" });
  }
});

// ── GET /api/delivery/inspection/today — Check if today's inspection is done ──
router.get("/inspection/today", protect, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    if (!partner) return res.json({ done: false });

    const today = new Date().toISOString().slice(0, 10);
    const entry = partner.inspectionLog?.find(i => 
      i.date && new Date(i.date).toISOString().slice(0, 10) === today && i.passed
    );

    res.json({ done: !!entry, inspection: entry || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to check inspection" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TIER 2: GAMIFICATION & ENGAGEMENT
// ═══════════════════════════════════════════════════════════════════

// ── GET /api/delivery/leaderboard — Top drivers ranked by performance ──
router.get("/leaderboard", protect, async (req, res) => {
  try {
    // Aggregate completed deliveries per partner this week
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    
    const pipeline = [
      { $match: { status: "Delivered", deliveryPartner: { $exists: true, $ne: null }, deliveredAt: { $gte: weekAgo } } },
      { $group: {
        _id: "$deliveryPartner",
        weeklyDeliveries: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" }
      }},
      { $sort: { weeklyDeliveries: -1 } },
      { $limit: 15 }
    ];

    const results = await Order.aggregate(pipeline);

    // Populate partner details
    const populated = await Promise.all(results.map(async (r) => {
      const p = await DeliveryPartner.findById(r._id).select("name phone rating streak onTimeDeliveries lateDeliveries totalDeliveries");
      if (!p) return null;
      const total = (p.onTimeDeliveries || 0) + (p.lateDeliveries || 0);
      const onTimePct = total > 0 ? Math.round((p.onTimeDeliveries / total) * 100) : 100;
      return {
        partnerId: r._id,
        name: p.name,
        rating: p.rating || 5,
        weeklyDeliveries: r.weeklyDeliveries,
        totalDeliveries: p.totalDeliveries || 0,
        streak: p.streak || 0,
        onTimePct,
        totalRevenue: r.totalRevenue
      };
    }));

    res.json(populated.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// ── GET /api/delivery/streak — Get current driver's streak and achievements ──
router.get("/streak", protect, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    if (!partner) return res.json({ streak: 0, achievements: [] });

    // Auto-compute streak: check if lastDeliveryDate was yesterday or today
    let computedStreak = partner.streak || 0;
    if (partner.lastDeliveryDate) {
      const last = new Date(partner.lastDeliveryDate).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (last !== today && last !== yesterday) {
        computedStreak = 0; // streak broken
        partner.streak = 0;
        await partner.save();
      }
    }

    res.json({ 
      streak: computedStreak, 
      achievements: partner.achievements || [],
      totalDeliveries: partner.totalDeliveries || 0,
      lastDeliveryDate: partner.lastDeliveryDate
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch streak" });
  }
});

// ── GET /api/delivery/payout-calendar — Monthly daily earnings breakdown ──
router.get("/payout-calendar", protect, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    if (!partner) return res.json([]);

    // Get deliveries for current month grouped by day
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyData = await Order.aggregate([
      { $match: { 
        deliveryPartner: partner._id, 
        status: "Delivered",
        deliveredAt: { $gte: startOfMonth }
      }},
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" } },
        deliveries: { $sum: 1 },
        revenue: { $sum: "$totalAmount" }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Compute earnings per day (₹45 base + ₹10 tip + ₹5 fuel per delivery)
    const calendar = dailyData.map(d => ({
      date: d._id,
      deliveries: d.deliveries,
      base: d.deliveries * 45,
      tips: d.deliveries * 10,
      fuel: d.deliveries * 5,
      total: d.deliveries * 60
    }));

    res.json(calendar);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payout calendar" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// TIER 3: SAFETY & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════

// ── POST /api/delivery/sos — Emergency SOS button ──
router.post("/sos", protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    partner.sosHistory.push({ lat, lng, triggeredAt: new Date(), resolved: false });
    await partner.save();

    // Emit SOS to all admin sockets
    if (req.io) {
      req.io.emit("SOS_ALERT", {
        driverId: partner._id,
        driverName: partner.name,
        driverPhone: partner.phone,
        lat, lng,
        time: new Date()
      });
    }

    res.json({ message: "🆘 SOS sent! Help is being dispatched." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send SOS" });
  }
});

// ── GET /api/delivery/fatigue — Get current session fatigue data ──
router.get("/fatigue", protect, async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({
      $or: [{ email: req.user.email }, { phone: req.user.phone }]
    });
    if (!partner) return res.json({ totalMinutes: 0, sessionStart: null });

    let currentSessionMin = 0;
    if (partner.onlineStartedAt && partner.status === "Active") {
      currentSessionMin = Math.round((Date.now() - new Date(partner.onlineStartedAt).getTime()) / 60000);
    }

    res.json({ 
      totalMinutesToday: (partner.totalOnlineMinutesToday || 0) + currentSessionMin,
      sessionStart: partner.onlineStartedAt,
      limit: 600 // 10 hours in minutes
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fatigue data" });
  }
});
// ── GET /api/delivery/fleet-overview — Admin fleet console aggregated data ──
router.get("/fleet-overview", protect, admin, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active/recent deliveries
    const activeOrders = await Order.find({
      deliveryPartner: { $ne: null },
      status: { $in: ["Shipped", "Out for Delivery", "Processing"] }
    }).populate("user", "name phone").populate("deliveryPartner", "name phone vehicleNumber").lean();

    // Today's completed deliveries
    const todayDelivered = await Order.find({
      status: "Delivered",
      deliveredAt: { $gte: today }
    }).populate("deliveryPartner", "name").lean();

    // Build per-partner stats
    const partnerStats = await Promise.all(partners.map(async (p) => {
      const myActive = activeOrders.filter(o => o.deliveryPartner?._id?.toString() === p._id.toString());
      const myDelivered = todayDelivered.filter(o => o.deliveryPartner?._id?.toString() === p._id.toString());
      const todayEarnings = myDelivered.reduce((sum, o) => sum + (o.totalAmount || 0) * 0.08, 0); // 8% commission estimate

      // Calculate fatigue
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
        fatigueWarning: onlineMinutes >= 480, // 8hr soft warn
        fatigueLocked: onlineMinutes >= 600, // 10hr hard lock
        streak: p.streak || 0,
        lastSOS: p.sosHistory?.length > 0 ? p.sosHistory[p.sosHistory.length - 1] : null,
        inspectionPassed: p.inspectionLog?.length > 0 && 
          new Date(p.inspectionLog[p.inspectionLog.length - 1].date).toDateString() === new Date().toDateString()
      };
    }));

    // Aggregate fleet stats
    const onlineCount = partnerStats.filter(p => p.status === "Active").length;
    const offlineCount = partnerStats.filter(p => p.status !== "Active").length;
    const deliveringCount = partnerStats.filter(p => p.activeOrders > 0).length;
    const totalDeliveriesToday = todayDelivered.length;
    const totalEarningsToday = partnerStats.reduce((s, p) => s + p.todayEarnings, 0);
    const fatigueWarnings = partnerStats.filter(p => p.fatigueWarning).length;
    const avgDeliveriesPerDriver = onlineCount > 0 ? Math.round(totalDeliveriesToday / onlineCount * 10) / 10 : 0;

    // Recent SOS alerts (last 24 hours)
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
