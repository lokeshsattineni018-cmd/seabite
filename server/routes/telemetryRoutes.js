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

    // Find the existing log first to preserve high-accuracy coords if present
    const existingLog = await VisitorLog.findOne({ visitorId });
    const shouldUpdateCoords = !existingLog || !existingLog.lat;

    // Upsert Visitor Log
    const visitor = await VisitorLog.findOneAndUpdate(
      { visitorId },
      {
        userId: userId || null,
        ipAddress,
        currentPath,
        city,
        lastActive: new Date(),
        ...(shouldUpdateCoords && lat && lng ? { lat, lng, locationSource: "geoip" } : {})
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

// 🟢 PUBLIC POST: /api/telemetry/location-update
router.post("/location-update", async (req, res) => {
  try {
    const { visitorId, userId, lat, lng, locationError } = req.body;
    
    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    const updateFields = {
      lastActive: new Date()
    };

    if (userId) updateFields.userId = userId;
    if (lat && lng) {
      updateFields.lat = lat;
      updateFields.lng = lng;
      updateFields.locationSource = "gps";
      updateFields.locationError = null; // Clear previous errors if we got coords

      // Server-Side Reverse Geocoding to bypass browser CORS constraints
      try {
        const fetchRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "SeaBite-Server-Telemetry/1.0"
            },
            signal: AbortSignal.timeout(3000) // ✅ Prevent hanging requests and Vercel 503 timeouts
          }
        );
        const addrData = await fetchRes.json();
        if (addrData && addrData.address) {
          const addr = addrData.address;
          let city = addr.city || addr.town || addr.village || addr.county || "Unknown";
          if (addr.state) city += `, ${addr.state}`;
          updateFields.city = city;
        }
      } catch (geocodeErr) {
        console.error("Server-side geocoding failed:", geocodeErr.message);
      }
    }
    if (locationError !== undefined) {
      updateFields.locationError = locationError;
    }

    const visitor = await VisitorLog.findOneAndUpdate(
      { visitorId },
      { $set: updateFields },
      { returnDocument: 'after', upsert: true }
    );

    // Emit live pulse through socket if running
    if (req.io && lat && lng) {
      req.io.to("admins").emit("VISITOR_LOCATION_STREAM", {
        visitorId,
        userId: userId || null,
        location: { lat, lng },
        locationSource: "gps",
        city: updateFields.city || visitor.city
      });
    }

    res.status(200).json({ success: true, visitor });
  } catch (error) {
    console.error("Telemetry Location Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🟢 POST: /api/telemetry/push-promo
router.post("/push-promo", adminAuth, async (req, res) => {
  try {
    const { visitorId, promoCode, discountPercent, message } = req.body;
    
    if (!visitorId || !promoCode) {
      return res.status(400).json({ message: "visitorId and promoCode are required" });
    }

    // 1. Dynamically register Coupon in database restricted to this visitorId
    const Coupon = (await import("../models/Coupon.js")).default;
    await Coupon.findOneAndDelete({ code: promoCode.toUpperCase() });

    const newCoupon = new Coupon({
      code: promoCode.toUpperCase(),
      discountType: "percent",
      value: parseInt(discountPercent, 10) || 15,
      isActive: true,
      maxUses: 1,
      isPromoPush: true,
      visitorId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    });
    await newCoupon.save();

    // 2. Save promo offer and set status to "sent" in VisitorLog
    const visitor = await VisitorLog.findOneAndUpdate(
      { visitorId },
      {
        $set: {
          pendingPromo: {
            promoCode,
            discountPercent: parseInt(discountPercent, 10) || 15,
            message: message || "We noticed you looking at our fresh seafood collection! Here is a special treat just for you.",
            pushedAt: new Date()
          },
          promoStatus: "sent"
        }
      },
      { returnDocument: 'after' }
    );

    res.status(200).json({ success: true, visitor });
  } catch (error) {
    console.error("Push Promo Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🟢 PUBLIC POST: /api/telemetry/promo-copied
router.post("/promo-copied", async (req, res) => {
  try {
    const { visitorId, promoCode } = req.body;
    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    const visitor = await VisitorLog.findOneAndUpdate(
      { visitorId, "pendingPromo.promoCode": promoCode },
      { $set: { promoStatus: "copied" } },
      { returnDocument: 'after' }
    );

    res.status(200).json({ success: true, visitor });
  } catch (error) {
    console.error("Promo Copied Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
