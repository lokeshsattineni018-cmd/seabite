import express from "express";
import geoip from "geoip-lite";
import VisitorLog from "../models/VisitorLog.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// 🟢 PUBLIC POST: /api/telemetry/ping
router.post("/ping", async (req, res) => {
  try {
    const { visitorId, userId, currentPath } = req.body;
    
    if (!visitorId || !currentPath) {
      return res.status(400).json({ message: "visitorId and currentPath are required" });
    }

    // Extract IP Address
    let ipAddress = req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress;
    if (ipAddress && ipAddress.includes(",")) {
      ipAddress = ipAddress.split(",")[0].trim(); // Handle comma-separated IPs
    }
    
    if (ipAddress === "::1" || ipAddress === "127.0.0.1") {
      // Use a public test IP for localhost
      ipAddress = "8.8.8.8";
    }

    // Resolve City using geoip-lite
    let city = "Unknown";
    const geo = geoip.lookup(ipAddress);
    if (geo && geo.city) {
      city = `${geo.city}, ${geo.country}`;
    }

    // Upsert Visitor Log
    const visitor = await VisitorLog.findOneAndUpdate(
      { visitorId },
      {
        userId: userId || null,
        ipAddress,
        currentPath,
        city,
        lastActive: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, visitor });
  } catch (error) {
    console.error("Telemetry Ping Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
