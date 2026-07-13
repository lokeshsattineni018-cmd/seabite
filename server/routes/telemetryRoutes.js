import express from "express";
import geoip from "geoip-lite";
import rateLimit from "express-rate-limit";
import VisitorLog from "../models/VisitorLog.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Rate limiter for telemetry to prevent spam / DB floods
const telemetryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per 5 minutes
  message: { message: "Too many telemetry pings." }
});

// 🟢 PUBLIC POST: /api/telemetry/ping
router.post("/ping", telemetryLimiter, async (req, res) => {
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

    // Resolve City and Coordinates using geoip-lite
    let city = "Unknown";
    let lat = null;
    let lng = null;
    const geo = geoip.lookup(ipAddress);
    if (geo) {
      if (geo.city) city = `${geo.city}, ${geo.country}`;
      if (geo.ll && Array.isArray(geo.ll)) {
        lat = geo.ll[0];
        lng = geo.ll[1];
      }
    }

    // Upsert Visitor Log
    const visitor = await VisitorLog.findOneAndUpdate(
      { visitorId },
      {
        userId: userId || null,
        ipAddress,
        currentPath,
        city,
        lastActive: new Date(),
        ...(lat && lng ? { lat, lng } : {})
      },
      { returnDocument: 'after', upsert: true }
    );

    if (req.io) {
      req.io.to("admins").emit("CLICKSTREAM_PULSE", {
        type: "page_view",
        visitorId,
        userId: userId || null,
        currentPath,
        ipAddress,
        city,
        timestamp: new Date()
      });
    }

    res.status(200).json({ success: true, visitor });
  } catch (error) {
    console.error("Telemetry Ping Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
