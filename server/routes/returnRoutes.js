import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../config/multerConfig.js";
import { logActivity } from "../utils/activityLogger.js";

const router = express.Router();

// ── POST /api/returns — Customer creates a return request ──
router.post("/", protect, upload.array("images", 3), async (req, res) => {
  try {
    const { orderId, reason, items } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }
    if (order.returnRequest?.status && order.returnRequest.status !== "none") {
      return res.status(400).json({ message: "A return request already exists for this order" });
    }

    // Check 7-day return window
    const deliveredAt = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ message: "Return window has expired (7 days from delivery)" });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    // Update the embedded returnRequest on the order
    order.returnRequest = {
      status: "requested",
      reason: reason || "Not satisfied with the product",
      requestedAt: new Date(),
      images,
      refundAmount: 0,
      refundMethod: null,
      adminNotes: "",
    };

    await order.save();

    logActivity("RETURN_REQUESTED", `Return requested for Order #${order.orderId}`, req, {
      orderId: order._id,
      reason,
    });

    res.status(201).json({ message: "Return request submitted successfully", returnRequest: order.returnRequest });
  } catch (err) {
    console.error("Return request error:", err);
    res.status(500).json({ message: "Failed to create return request" });
  }
});

// ── GET /api/returns — Admin fetches all return requests ──
router.get("/", adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const match = { "returnRequest.status": { $ne: "none", $exists: true } };
    if (status && status !== "all") {
      match["returnRequest.status"] = status;
    }

    const orders = await Order.find(match)
      .populate("user", "name email phone")
      .sort({ "returnRequest.requestedAt": -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Order.countDocuments(match);

    // Count by status
    const counts = await Order.aggregate([
      { $match: { "returnRequest.status": { $ne: "none", $exists: true } } },
      { $group: { _id: "$returnRequest.status", count: { $sum: 1 } } },
    ]);
    const statusCounts = {};
    counts.forEach(c => { statusCounts[c._id] = c.count; });

    res.json({ orders, total, statusCounts });
  } catch (err) {
    console.error("Fetch returns error:", err);
    res.status(500).json({ message: "Failed to fetch return requests" });
  }
});

// ── PUT /api/returns/:id/approve — Admin approves return ──
router.put("/:id/approve", adminAuth, async (req, res) => {
  try {
    const { refundAmount, refundMethod, adminNotes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.returnRequest.status = "approved";
    order.returnRequest.approvedBy = req.session?.user?.id || req.user?._id;
    order.returnRequest.approvedAt = new Date();
    order.returnRequest.refundAmount = refundAmount || order.totalAmount;
    order.returnRequest.refundMethod = refundMethod || "wallet";
    order.returnRequest.adminNotes = adminNotes || "";
    order.refundStatus = "Approved";

    // If refund method is wallet, credit the user's wallet
    if (refundMethod === "wallet" || !refundMethod) {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(order.user);
      if (user) {
        const amt = refundAmount || order.totalAmount;
        user.walletBalance = (user.walletBalance || 0) + amt;
        user.walletTransactions.push({
          amount: amt,
          type: "Credit",
          description: `Refund for Order #${order.orderId} (Return Approved)`,
        });
        await user.save();
        order.returnRequest.refundedAt = new Date();
        order.returnRequest.status = "refunded";
        order.refundStatus = "Refunded";
      }
    }

    await order.save();

    logActivity("RETURN_APPROVED", `Return approved for Order #${order.orderId} — ₹${order.returnRequest.refundAmount} via ${order.returnRequest.refundMethod}`, req, {
      orderId: order._id,
      refundAmount: order.returnRequest.refundAmount,
    });

    res.json({ message: "Return approved and refund processed", order });
  } catch (err) {
    console.error("Approve return error:", err);
    res.status(500).json({ message: "Failed to approve return" });
  }
});

// ── PUT /api/returns/:id/reject — Admin rejects return ──
router.put("/:id/reject", adminAuth, async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.returnRequest.status = "rejected";
    order.returnRequest.adminNotes = adminNotes || "Return request rejected by admin";
    order.refundStatus = "Rejected";

    await order.save();

    logActivity("RETURN_REJECTED", `Return rejected for Order #${order.orderId}`, req, {
      orderId: order._id,
      reason: adminNotes,
    });

    res.json({ message: "Return request rejected", order });
  } catch (err) {
    console.error("Reject return error:", err);
    res.status(500).json({ message: "Failed to reject return" });
  }
});

export default router;
