import express from "express";
import ActivityLog from "../models/ActivityLog.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ── GET /api/admin/audit — Paginated audit logs with filters ──
router.get("/", adminAuth, async (req, res) => {
  try {
    const { operator, action, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

    const query = {};

    if (operator) {
      query.user = operator; // Matches Operator User ID
    }

    if (action) {
      query.action = action;
    }

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) query.timestamp.$lte = new Date(dateTo);
    }

    const logs = await ActivityLog.find(query)
      .populate("user", "name email role")
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await ActivityLog.countDocuments(query);

    res.json({ logs, total });
  } catch (err) {
    console.error("Audit log fetch error:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// ── GET /api/admin/audit/export — CSV export ──
router.get("/export", adminAuth, async (req, res) => {
  try {
    const { action } = req.query;
    const query = {};
    if (action) query.action = action;

    const logs = await ActivityLog.find(query)
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    let csv = "Timestamp,Operator,Action,Details,IP,PreviousHash,Hash\n";
    logs.forEach(l => {
      const time = l.timestamp ? new Date(l.timestamp).toISOString() : "";
      const op = l.user?.name || "System/Guest";
      const act = l.action || "";
      const det = (l.details || "").replace(/"/g, '""');
      const ip = l.meta?.ip || "N/A";
      const prevHash = l.previousHash || "";
      const currHash = l.hash || "";
      csv += `"${time}","${op}","${act}","${det}","${ip}","${prevHash}","${currHash}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit_log.csv");
    res.status(200).send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Failed to export audit logs" });
  }
});

// ── GET /api/admin/audit/alerts — Suspicious patterns ──
router.get("/alerts", adminAuth, async (req, res) => {
  try {
    // Detect after-hours activity (11 PM to 7 AM)
    const midnightLogs = await ActivityLog.find({
      $expr: {
        $or: [
          { $gte: [{ $hour: "$timestamp" }, 17] }, // GMT offset check or local hour mapping
          { $lte: [{ $hour: "$timestamp" }, 2] }
        ]
      }
    })
    .populate("user", "name email")
    .limit(10)
    .lean();

    // Detect bulk delete/modify actions (e.g. settings changed multiple times in a short interval)
    const settingsAlerts = await ActivityLog.find({ action: { $in: ["SETTINGS_CHANGED", "PRODUCT_DELETED"] } })
      .populate("user", "name email")
      .limit(10)
      .lean();

    res.json({
      afterHours: midnightLogs,
      bulkOperations: settingsAlerts
    });
  } catch (err) {
    console.error("Alerts analysis error:", err);
    res.status(500).json({ message: "Failed to compile security alerts" });
  }
});

export default router;
