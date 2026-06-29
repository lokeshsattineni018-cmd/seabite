import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// ─── Workflow Definition Schema (in-memory for now, can be moved to DB) ───
// Workflows are stored in Settings model's customOrderStatuses or a new Workflow model

// ─── Workflow Templates ───
const WORKFLOW_TEMPLATES = [
  {
    id: "order_confirmed",
    name: "Order Confirmed Flow",
    trigger: { event: "order.status_change", condition: { status: "Processing" } },
    actions: [
      { type: "send_email", template: "order_confirmed", delay: 0 },
      { type: "send_whatsapp", template: "order_confirmed", delay: 0 },
      { type: "deduct_inventory", delay: 0 },
      { type: "notify_warehouse", delay: 0 },
    ],
    isActive: true,
    category: "order"
  },
  {
    id: "order_shipped",
    name: "Order Shipped Flow",
    trigger: { event: "order.status_change", condition: { status: "Shipped" } },
    actions: [
      { type: "send_email", template: "order_shipped", delay: 0 },
      { type: "send_push", title: "Your order is on the way! 🚚", delay: 0 },
      { type: "update_delivery_status", value: "Assigned", delay: 0 },
    ],
    isActive: true,
    category: "delivery"
  },
  {
    id: "order_delivered",
    name: "Post-Delivery Flow",
    trigger: { event: "order.status_change", condition: { status: "Delivered" } },
    actions: [
      { type: "send_email", template: "delivery_confirmation", delay: 0 },
      { type: "award_loyalty_points", delay: 0 },
      { type: "request_review", delay: 24 }, // 24 hours later
      { type: "send_nps_survey", delay: 48 }, // 48 hours later
    ],
    isActive: true,
    category: "post_delivery"
  },
  {
    id: "abandoned_cart_recovery",
    name: "Abandoned Cart Recovery",
    trigger: { event: "cart.abandoned", condition: { minValue: 200, minItems: 1 } },
    actions: [
      { type: "send_email", template: "cart_reminder", delay: 1 }, // 1 hour
      { type: "send_push", title: "Your cart misses you! 🛒", delay: 6 }, // 6 hours
      { type: "send_whatsapp", template: "cart_recovery", delay: 24 }, // 24 hours
      { type: "apply_coupon", code: "COMEBACK5", delay: 48 }, // 48 hours
    ],
    isActive: true,
    category: "retention"
  },
  {
    id: "low_stock_alert",
    name: "Low Stock Alert",
    trigger: { event: "inventory.low_stock", condition: { threshold: "stockThreshold" } },
    actions: [
      { type: "notify_admin", channel: "email", delay: 0 },
      { type: "notify_admin", channel: "push", delay: 0 },
      { type: "create_reorder_suggestion", delay: 0 },
    ],
    isActive: true,
    category: "operations"
  },
  {
    id: "return_requested",
    name: "Return Request Flow",
    trigger: { event: "order.return_requested" },
    actions: [
      { type: "send_email", template: "return_received", delay: 0 },
      { type: "notify_admin", channel: "push", delay: 0 },
      { type: "create_ticket", category: "refund", delay: 0 },
    ],
    isActive: true,
    category: "returns"
  }
];

// Get all workflows
router.get("/", (req, res) => {
  res.json({
    workflows: WORKFLOW_TEMPLATES,
    categories: [...new Set(WORKFLOW_TEMPLATES.map(w => w.category))],
  });
});

// Get workflow by ID
router.get("/:id", (req, res) => {
  const workflow = WORKFLOW_TEMPLATES.find(w => w.id === req.params.id);
  if (!workflow) return res.status(404).json({ error: "Workflow not found" });
  res.json(workflow);
});

// Get workflow execution logs (from order.workflowLogs)
router.get("/logs/recent", async (req, res) => {
  try {
    const Order = mongoose.model("Order");
    const recentOrders = await Order.find({
      "workflowLogs.0": { $exists: true }
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .select("orderId workflowLogs status")
    .lean();

    const logs = [];
    recentOrders.forEach(order => {
      order.workflowLogs.forEach(log => {
        logs.push({
          orderId: order.orderId,
          orderDbId: order._id,
          orderStatus: order.status,
          ...log,
        });
      });
    });

    logs.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

    res.json({
      totalLogs: logs.length,
      logs: logs.slice(0, 100),
    });
  } catch (err) {
    console.error("Workflow logs error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;
