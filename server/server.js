/* --- 1. LOAD ENV VARIABLES FIRST --- */
import "dotenv/config";

if (!process.env.SESSION_SECRET) {
  throw new Error("FATAL: SESSION_SECRET is not configured in environment variables.");
}
if (!process.env.MONGO_URI) {
  throw new Error("FATAL: MONGO_URI is not configured in environment variables.");
}

import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || "development",
  });
}



import express from "express";
// 🛰️ System Pulse: Force-triggering server deployment sync (Deploy Hook Triggered)

import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import Order from "./models/Order.js"; // [Operational Intelligence]

/* --- ROUTE IMPORTS --- */
import authRoutes from "./routes/authRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import products from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import spinRoutes from "./routes/spinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import watchtowerRoutes from "./routes/watchtowerRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js"; // [Added]
import deliveryRoutes from "./routes/deliveryRoutes.js"; // [New: Delivery Management]
import enterpriseRoutes from "./routes/enterpriseRoutes.js"; // [New: Enterprise Suite]
import returnRoutes from "./routes/returnRoutes.js";
import supportRoutes from "./routes/supportRoutes.js"; // [New: Support Agent Dashboard]
import recommendationRoutes from "./routes/recommendationRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"; // [New: Real-time Chat]
import abTestRoutes from "./routes/abTestRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import checkMaintenance from "./middleware/checkMaintenance.js";
import auditTrail from "./middleware/auditMiddleware.js";
import traceMiddleware from "./middleware/traceMiddleware.js";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { protect, admin } from "./middleware/authMiddleware.js";
import { csrfProtection } from "./middleware/csrfMiddleware.js";

import logger from "./utils/logger.js";
import os from "os";
import osUtils from "os-utils";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import hpp from "hpp";
import compression from "compression";

// [Import Cron Workers]
import { initAbandonedCartWorker } from "./cron/abandonedCartWorker.js";
import happyHourCron from "./cron/happyHour.js";
import { initPricingCron } from "./cron/pricingCron.js";

const app = express();
app.disable("x-powered-by");

// Enterprise: Global Process Handlers
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! [CRITICAL] Shutting down...", { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! [CRITICAL] Shutting down...", { error: err.message, stack: err.stack });
  process.exit(1);
});

const httpServer = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --- 2. SECURITY & PROXY --- */
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://seabite.co.in",
  "https://www.seabite.co.in",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://seabite-server.vercel.app"
];

// 🟢 [THE WATCHTOWER] High-Visibility Request Sentinel
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    const shouldLog = process.env.NODE_ENV !== "production" || isError;
    if (shouldLog && req.path.startsWith("/api")) {
      console.log(`📡 [WATCHTOWER] ${isError ? '❌' : '✅'} ${req.method} ${req.path} | Status: ${res.statusCode} | Origin: ${req.headers.origin || 'NONE'} | ${duration}ms`);
    }
  });
  next();
});

// ✅ ROBURST CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // DEBUG LOG
  if (process.env.NODE_ENV !== "production" && req.path.startsWith("/api")) {
    console.log(`📡 [API DEBUG] ${req.method} ${req.path} | Origin: ${origin || "NONE"}`);
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin && process.env.NODE_ENV !== 'production') {
    // Allow local tools like postman
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With, X-CSRF-Token");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "10mb" })); // 🛡️ Limit body size to prevent attacks (increased to 10mb for POD uploads)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* --- SOCKET.IO SETUP --- */
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Force websocket/polling
});

// Track connected users
let connectedUsers = 0;

// Memory cache for driver GPS throttling
const driverLastUpdate = new Map();

// 🔐 SECURITY: Authenticate Socket.IO connections
io.use((socket, next) => {
  const req = socket.request;
  if (req.session && req.session.user) {
    socket.user = req.session.user;
    return next();
  }
  return next(new Error("Authentication failed: No active session"));
});

io.on("connection", (socket) => {
  connectedUsers++;
  io.emit("USER_COUNT_UPDATE", connectedUsers);

  // 🛰️ Real-Time Product Pulse: Join product room
  socket.on("join-product", (productId) => {
    socket.join(`product:${productId}`);
    const roomSize = io.sockets.adapter.rooms.get(`product:${productId}`)?.size || 0;
    io.to(`product:${productId}`).emit("PRODUCT_VIEWER_COUNT", { productId, count: roomSize });
  });

  // 🛰️ Real-Time Product Pulse: Leave product room
  socket.on("leave-product", (productId) => {
    socket.leave(`product:${productId}`);
    const roomSize = io.sockets.adapter.rooms.get(`product:${productId}`)?.size || 0;
    io.to(`product:${productId}`).emit("PRODUCT_VIEWER_COUNT", { productId, count: roomSize });
  });

  // 🔍 X-Ray: Frustration Events (Authorized Admins Only)
  socket.on("join-admin", () => {
    if (!socket.user || socket.user.role !== "admin") {
      console.warn(`🚨 [INTRUSION] Unauthorized Socket Attempted to Join Admin Room: ${socket.id}`);
      return;
    }
    socket.join("admins");
  });

  socket.on("FRUSTRATION_EVENT", (data) => {
    // Only logged-in users can send frustration signals (prevents anonymous bot floods)
    if (!socket.user) return;
    
    // Broadcast to all admins
    io.to("admins").emit("FRUSTRATION_EVENT", {
      ...data,
      userId: socket.user.id,
      timestamp: new Date()
    });
  });

  // 🛒 Abandoned Cart Nudge System (Real-time Intent)
  const cartTimers = new Map();

  socket.on("CART_ACTIVITY", (data) => {
    const { userId, cartItems } = data;
    
    // Prevent spoofing CART_ACTIVITY userId
    if (!socket.user || socket.user.id !== userId) {
      return;
    }
    
    // Broadcast to admins
    if (cartItems && cartItems.length > 0) {
      io.to("admins").emit("CLICKSTREAM_PULSE", {
        type: "cart_update",
        userId: userId || null,
        cartItems: cartItems.map(item => ({ name: item.name || "Seafood Item", qty: item.qty })),
        timestamp: new Date()
      });
    }

    if (!userId || !cartItems || cartItems.length === 0) {
      if (cartTimers.has(socket.id)) {
        clearTimeout(cartTimers.get(socket.id));
        cartTimers.delete(socket.id);
      }
      return;
    }

    // Reset abandonment timer
    if (cartTimers.has(socket.id)) {
      clearTimeout(cartTimers.get(socket.id));
    }

    const timer = setTimeout(() => {
      socket.emit("NUDGE_OFFER", {
        message: "Your catch is still waiting! Get 5% extra off if you checkout now.",
        coupon: "SEABITE5",
        expiresIn: 900 // 15 mins
      });
      console.log(`📡 [NUDGE] Sent abandonment offer to socket: ${socket.id}`);
    }, 10 * 60 * 1000); // 10 minutes

    cartTimers.set(socket.id, timer);
  });

  // ── 🛵 REAL-TIME DRIVER TRACKING (GPS Geolocation Streams) ──
  socket.on("driver-location", async (data) => {
    const { driverId, location } = data;
    
    // 🔐 SECURITY: Prevent driver-location spoofing. Ensure user is authenticated, and either is the driver or is an admin.
    if (!socket.user || (socket.user.id !== driverId && socket.user.role !== "admin")) {
      return;
    }
    
    // Broadcast coordinates immediately to tracking users for zero lag
    io.emit("DRIVER_LOCATION_STREAM", { driverId, location });

    // Throttle database writes to once every 15 seconds per driver
    const now = Date.now();
    const lastUpdate = driverLastUpdate.get(driverId) || 0;
    if (now - lastUpdate > 15000) {
      driverLastUpdate.set(driverId, now);
      try {
        const DeliveryPartner = (await import("./models/DeliveryPartner.js")).default;
        await DeliveryPartner.findByIdAndUpdate(driverId, {
          currentLocation: { lat: location.lat, lng: location.lng }
        });
      } catch (err) {
        console.error("GPS tracking DB sync failed:", err);
      }
    }
  });

  // ── 👤 REAL-TIME VISITOR/CUSTOMER TRACKING ──
  socket.on("visitor-location", async (data) => {
    const { visitorId, userId, location, city } = data;
    if (!visitorId || !location) return;
    console.log(`🔌 [SOCKET] Received visitor-location from ${visitorId}:`, location);

    // Broadcast immediately to listening admin radar
    io.to("admins").emit("VISITOR_LOCATION_STREAM", { visitorId, userId, location, locationSource: "gps", city });

    // Update in-memory visitor logs or VisitorLog DB model (throttled to avoid DB flood)
    try {
      const VisitorLog = (await import("./models/VisitorLog.js")).default;
      await VisitorLog.findOneAndUpdate(
        { visitorId },
        { 
          lat: location.lat, 
          lng: location.lng, 
          userId: userId || null, 
          locationSource: "gps",
          ...(city ? { city } : {})
        },
        { upsert: false }
      );
    } catch (err) {
      console.error("Failed to update visitor GPS coordinate in DB:", err);
    }
  });

  socket.on("visitor-location-error", async (data) => {
    const { visitorId, code } = data;
    if (!visitorId) return;

    try {
      const VisitorLog = (await import("./models/VisitorLog.js")).default;
      await VisitorLog.findOneAndUpdate(
        { visitorId },
        { locationError: code },
        { upsert: false }
      );
    } catch (err) {
      console.error("Failed to update visitor GPS error in DB:", err);
    }
  });

  socket.on("register-visitor", (data) => {
    const { visitorId } = data;
    if (visitorId) {
      socket.visitorId = visitorId;
      socket.join(`visitor-${visitorId}`);
      console.log(`🔌 [SOCKET] Visitor registered: ${visitorId} joined room visitor-${visitorId}`);
    }
  });

  socket.on("send-promo-offer", (data) => {
    const { visitorId, promoCode, discountPercent, message } = data;
    if (!visitorId || !promoCode) return;

    console.log(`🎁 [PROMO] Sending promo ${promoCode} (${discountPercent}%) to visitor ${visitorId}`);

    // Route event specifically to that visitor's target room
    io.to(`visitor-${visitorId}`).emit("RECEIVE_PROMO_OFFER", {
      promoCode,
      discountPercent,
      message
    });
  });

  // ── 🎧 REAL-TIME SUPPORT & DRIVER CHAT ROOMS ──
  socket.on("join-chat", (data) => {
    const { userId } = data;
    
    // 🔐 SECURITY: Prevent eavesdropping. Only allow joining own chat room unless user is admin or support.
    if (!socket.user || (socket.user.id !== userId && !["admin", "support", "driver"].includes(socket.user.role))) {
      return;
    }
    socket.join(`chat:${userId}`);
  });

  socket.on("send-chat-message", async (data) => {
    const { sender, recipient, message, senderRole, recipientRole } = data;
    
    // 🔐 SECURITY: Prevent chat message impersonation. Sender must match logged in user id.
    if (!socket.user || socket.user.id !== sender) {
      return;
    }
    
    try {
      const ChatMessage = (await import("./models/ChatMessage.js")).default;
      const chatMsg = await ChatMessage.create({
        sender,
        recipient,
        message,
        senderRole,
        recipientRole
      });

      // Emit to sender and recipient rooms
      io.to(`chat:${sender}`).to(`chat:${recipient}`).emit("chat-message", chatMsg);
    } catch (err) {
      console.error("Failed to save/emit chat message:", err);
    }
  });

  socket.on("typing", (data) => {
    const { sender, recipient, isTyping, senderRole } = data;
    
    // 🔐 SECURITY: Prevent typing spoofing. Sender must match logged in user id.
    if (!socket.user || socket.user.id !== sender) {
      return;
    }
    io.to(`chat:${recipient}`).emit("typing-indicator", { sender, isTyping, senderRole });
  });

  socket.on("disconnect", () => {
    if (cartTimers.has(socket.id)) {
      clearTimeout(cartTimers.get(socket.id));
      cartTimers.delete(socket.id);
    }
    connectedUsers = Math.max(0, connectedUsers - 1);
    io.emit("USER_COUNT_UPDATE", connectedUsers);
  });
});

// ✅ Attach Real IO to request
let globalReqCount = 0;
app.use((req, res, next) => {
  globalReqCount++;
  req.io = io;
  next();
});

/* --- SECURITY HARDENING (Phase 25) --- */

// 0. Compress all responses
app.use(compression());

// 1. Assign unique trace ID to every request for enterprise observability
app.use(traceMiddleware);

// 2. Set Strict Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://www.google-analytics.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.razorpay.com", "https://lh3.googleusercontent.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://lokeshsattineni018-cmd.p.pcloud.xyz", "https://seabite-server.vercel.app"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

// 2. Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to avoid blocking legitimate UI polling
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/v1", limiter);

// 3. Stricter Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts to 5 per 15 minutes
  message: "Too many login attempts, please try again later."
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// 4. 🛡️ ADMIN FORTRESS: Strict Admin Rate Limiting (Phase 26)
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit admin actions to 50 per hour per IP
  message: "⛔ Admin Rate Limit Exceeded: Action blocked for security."
});
app.use("/api/v1/admin", adminLimiter);

// Enable mutability on req.query for Express 5 compatibility with mongoSanitize
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, "query", {
      value: { ...req.query },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
});

// 5. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 5. Data Sanitization against XSS
app.use(xss());

// 6. Prevent Parameter Pollution
app.use(hpp());


// ✅ Handle static uploads
const uploadDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  logger.warn("Could not create uploads directory (expected in read-only / serverless environment):", { error: err.message });
}
app.use("/uploads", express.static(uploadDir, {
  maxAge: "7d",
  etag: true,
  lastModified: true
}));

/* --- 3. DATABASE CONNECTION (Optimized for Serverless) --- */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    console.log("➡️ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 30000, // Increased to 30s for resilience
      connectTimeoutMS: 30000, // Increased to 30s
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      minPoolSize: 0,
      retryWrites: true,
      retryReads: true,
      ssl: process.env.MONGO_URI.includes("mongodb+srv") || process.env.MONGO_URI.includes("ssl=true") || false,
    };

    // 🛡️ Debugging: Verify URI presence (Sanitized)
    if (process.env.MONGO_URI) {
      const sanitizedUri = process.env.MONGO_URI.replace(/\/\/.*@/, "//***:***@");
      console.log(`🔗 Attempting connection to: ${sanitizedUri}`);
    } else {
      console.error("❌ CRITICAL: MONGO_URI is missing from environment variables!");
    }

    console.log("🔄 Initializing new MongoDB connection...");
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB Connection Error:", e);
    throw e;
  }
};

(async () => {
  try {
    await connectDB();
    // 🚀 Startup Migration: Populate missing product slugs for O(1) fast-path queries
    try {
      const Product = (await import("./models/Product.js")).default;
      const productsWithoutSlugs = await Product.find({
        $or: [
          { slug: { $exists: false } },
          { slug: "" },
          { slug: null }
        ]
      });
      if (productsWithoutSlugs.length > 0) {
        console.log(`[Migration] Found ${productsWithoutSlugs.length} products without slugs. Migrating...`);
        const slugify = (text) => {
          if (!text) return "";
          return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
        };
        for (const prod of productsWithoutSlugs) {
          const generatedSlug = slugify(prod.name);
          await Product.updateOne({ _id: prod._id }, { $set: { slug: generatedSlug } });
        }
        console.log("[Migration] Slug migration completed successfully.");
      }
    } catch (err) {
      console.error("[Migration] Slug migration failed:", err);
    }
  } catch (err) {
    logger.error("Initial DB Connection Failed", { error: err.message });
  }
})();

// Global handlers for connection events
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

const sessionStore = MongoStore.create({
  client: mongoose.connection.getClient(),
  collectionName: "sessions",
  ttl: 60 * 60, // 1 hour session TTL in MongoDB
  autoRemove: 'native',
});

// ✅ Session Setup (Optimized: Reuses Mongoose Connection)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  name: "seabite.sid",
  proxy: true,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour cookie max age
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  },
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
app.use(csrfProtection);

// ✅ Session save error handler
app.use((req, res, next) => {
  const originalSave = req.session.save.bind(req.session);
  req.session.save = function (callback) {
    originalSave(function (err) {
      if (err) logger.error('Session save error', { error: err.message });
      if (callback) callback(err);
    });
  };
  next();
});

// ✅ AUDIT TRAIL: Global Admin Observer (Senior Level)
app.use("/api/v1/admin", auditTrail);

/* --- 5. ROUTES --- */
app.get("/", (req, res) => res.send("SeaBite Server Running 🚀"));

// ✅ Enterprise: Maintenance Mode
app.use(checkMaintenance);

// ✅ Versioned Router Setup
const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/products", products);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/admin/products", auditTrail, adminProductRoutes);
apiRouter.use("/admin/watchtower", auditTrail, watchtowerRoutes);
apiRouter.use("/admin/complaints", auditTrail, complaintRoutes); 
apiRouter.use("/admin", auditTrail, adminRoutes);
apiRouter.use("/delivery", deliveryRoutes); 
apiRouter.use("/support", supportRoutes);
apiRouter.use("/chat", chatRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/notifications", pushRoutes);
apiRouter.use("/payment", paymentRoutes);
apiRouter.use("/contact", contactRoutes);
apiRouter.use("/coupons", couponRoutes);
apiRouter.use("/spin", spinRoutes);
apiRouter.use("/user", userRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/telemetry", telemetryRoutes);
apiRouter.use("/enterprise", enterpriseRoutes);
apiRouter.use("/returns", returnRoutes);
apiRouter.use("/recommendations", recommendationRoutes);
apiRouter.use("/admin/campaigns", auditTrail, campaignRoutes);
apiRouter.use("/ab-tests", abTestRoutes);
apiRouter.use("/admin/audit-logs", auditTrail, auditRoutes);
apiRouter.use("/admin/bi/health-scores", auditTrail, healthRoutes);

import pulseRoutes from "./routes/pulseRoutes.js";
apiRouter.use("/pulse", pulseRoutes);

import dashboardRoutes from "./routes/dashboardRoutes.js";
apiRouter.use("/admin/dashboard", auditTrail, dashboardRoutes);

import aiRoutes from "./routes/aiRoutes.js";
apiRouter.use("/admin/ai", auditTrail, aiRoutes);

import personalizationRoutes from "./routes/personalizationRoutes.js";
apiRouter.use("/personalization", personalizationRoutes);

import loyaltyRoutes from "./routes/loyaltyRoutes.js";
apiRouter.use("/loyalty", loyaltyRoutes);

import deliveryTrackingRoutes from "./routes/deliveryTrackingRoutes.js";
apiRouter.use("/delivery-tracking", deliveryTrackingRoutes);

app.use("/api/v1", apiRouter);

// Configure Cloudinary for direct uploads
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Allow up to 10MB
  fileFilter: (req, file, cb) => {
    if (file && file.mimetype && !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
});

app.post("/api/upload", protect, admin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "seabite-products",
    });
    res.json({ file: result.secure_url, url: result.secure_url });
  } catch (err) {
    console.error("❌ DIRECT UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed: " + err.message });
  }
});

app.get("/health", async (req, res) => {
  const start = Date.now();
  let dbStatus = "down";
  try {
    await mongoose.connection.db.admin().ping();
    dbStatus = "ok";
  } catch (e) {
    dbStatus = "error";
  }
  const latency = Date.now() - start;

  const basicStatus = {
    status: dbStatus === "ok" ? "healthy" : "degraded",
  };

  // Only expose internal system details if logged in as admin
  const isAdmin = req.session?.user?.role === "admin";
  if (!isAdmin) {
    return res.json(basicStatus);
  }

  res.json({
    ...basicStatus,
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
    system: {
      load: os.loadavg(),
      freeMem: `${Math.round(os.freemem() / 1024 / 1024)} MB`
    },
    database: {
      status: dbStatus,
      latency: `${latency}ms`,
      readyState: mongoose.connection.readyState
    }
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  console.error(`❌ [ERROR HANDLER] ${req.method} ${req.path} | Status: ${statusCode} | Error:`, err.message);
  if (!isProduction && err.stack) console.error(err.stack);

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? "Internal server error" : err.message,
  });
});

export { io }; // Export real IO

const PORT = process.env.PORT || 5005;
const server = httpServer.listen(PORT, () => {
  logger.info(`Server started`, { port: PORT, mode: process.env.NODE_ENV || 'development' });
  
  // 🟢 Start Background Workers
  initAbandonedCartWorker();
  happyHourCron.start();
  initPricingCron();

  // 🟢 Start System Pulse
  setInterval(() => {
    osUtils.cpuUsage(async (cpu) => {
      let latency = 0;
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        latency = Date.now() - start;
      } catch (e) {}
      
      // 🟢 Predictive Operational Intelligence: Delivery Pressure
      let pendingOrders = 0;
      try {
        pendingOrders = await Order.countDocuments({ status: { $in: ["Pending", "Cooking", "Ready"] } });
      } catch (err) {}

      io.to("admins").emit("SYSTEM_PULSE", {
        cpu: cpu,
        freeRam: osUtils.freemem(),
        totalRam: osUtils.totalmem(),
        latency: latency,
        load: osUtils.loadavg(1),
        reqCount: globalReqCount,
        pendingOrders: pendingOrders, // [New: Delivery Pressure Metric]
        alert: pendingOrders > 15 ? "HIGH_DELIVERY_PRESSURE" : null
      });
      globalReqCount = 0; // Reset every 5s
    });
  }, 5000);


});

// 🛡️ GRACEFUL SHUTDOWN (Phase 27)
const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await mongoose.connection.close(false);
      logger.info("MongoDB connection closed");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { error: err.message });
      process.exit(1);
    }
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.error("⚠️ Could not close connections in time, forcefully shutting down.");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;
