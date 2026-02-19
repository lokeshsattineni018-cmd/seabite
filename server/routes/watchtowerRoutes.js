import express from "express";
import ActivityLog from "../models/ActivityLog.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// GET /api/admin/watchtower/live
router.get("/live", adminAuth, async (req, res) => {
    try {
        // 1. Fetch latest 50 logs
        const logs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .populate("user", "name");

        // 2. Calculate Active Users (Unique users in last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeCount = await ActivityLog.distinct("user", {
            timestamp: { $gte: fiveMinutesAgo },
            user: { $ne: null }
        }).then(users => users.length);

        // Also count distinct guestIds for a more accurate count? 
        // For now, let's stick to logged-in users as per the "Active Users" card usually implying registered users.
        // If you want total visitors, we'd distinct on guestId too. 
        // Let's refine:
        const activeGuests = await ActivityLog.distinct("guestId", {
            timestamp: { $gte: fiveMinutesAgo },
            user: null
        }).then(guests => guests.length);

        res.json({
            logs,
            activeCount: activeCount + activeGuests
        });

    } catch (err) {
        console.error("Watchtower Error:", err);
        res.status(500).json({ message: "Failed to fetch live stream" });
    }
});

export default router;
