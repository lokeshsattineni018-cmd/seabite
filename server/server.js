/* --- 1. LOAD ENV VARIABLES FIRST --- */
import "dotenv/config";
import express from "express";
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
import adminProductRoutes from "./routes/adminProducts.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import products from "./routes/products.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import spinRoutes from "./routes/spinRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import watchtowerRoutes from "./routes/watchtowerRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js"; // [Added]
import deliveryRoutes from "./routes/deliveryRoutes.js"; // [New: Delivery Management]
import checkMaintenance from "./middleware/checkMaintenance.js";
import auditTrail from "./middleware/auditMiddleware.js";
import traceMiddleware from "./middleware/traceMiddleware.js";
import logger from "./utils/logger.js";
import os from "os";
import osUtils from "os-utils";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";

// [Import Cron Workers]
import { initAbandonedCartWorker } from "./cron/abandonedCartWorker.js";
import happyHourCron from "./cron/happyHour.js";

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
    if (req.path.startsWith("/api")) {
      console.log(`📡 [WATCHTOWER] ${res.statusCode >= 400 ? '❌' : '✅'} ${req.method} ${req.path} | Status: ${res.statusCode} | Origin: ${req.headers.origin || 'NONE'} | ${duration}ms`);
    }
  });
  next();
});

// ✅ ROBURST CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // DEBUG LOG
  if (req.path.startsWith("/api")) {
    console.log(`📡 [API DEBUG] ${req.method} ${req.path} | Origin: ${origin || "NONE"}`);
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin && process.env.NODE_ENV !== 'production') {
    // Allow local tools like postman
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: "10kb" })); // 🛡️ Limit body size to prevent attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

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

io.on("connection", (socket) => {
  connectedUsers++;
  io.emit("USER_COUNT_UPDATE", connectedUsers);
  // console.log(`🔌 New client connected. Total: ${connectedUsers}`);

  socket.on("disconnect", () => {
    connectedUsers = Math.max(0, connectedUsers - 1);
    io.emit("USER_COUNT_UPDATE", connectedUsers);
    // console.log(`🔌 Client disconnected. Total: ${connectedUsers}`);
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
app.use("/api", limiter);

// 3. Stricter Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts to 5 per 15 minutes
  message: "Too many login attempts, please try again later."
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// 4. 🛡️ ADMIN FORTRESS: Strict Admin Rate Limiting (Phase 26)
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit admin actions to 50 per hour per IP
  message: "⛔ Admin Rate Limit Exceeded: Action blocked for security."
});
app.use("/api/admin", adminLimiter);

// 5. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 5. Data Sanitization against XSS
app.use(xss());

// 6. Prevent Parameter Pollution
app.use(hpp());


// ✅ Handle static uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

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
      ssl: true,
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
  } catch (err) {
    logger.error("Initial DB Connection Failed", { error: err.message });
  }
})();

// Global handlers for connection events
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

// ✅ Session Setup (Optimized: Reuses Mongoose Connection)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "seabite_default_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
    ttl: 60 * 60, // 1 hour session TTL in MongoDB
    autoRemove: 'native',
  }),
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
app.use("/api/admin", auditTrail);

/* --- 5. ROUTES --- */
app.get("/", (req, res) => res.send("SeaBite Server Running 🚀"));

// ✅ Enterprise: Maintenance Mode
app.use(checkMaintenance);

app.use("/api/auth", authRoutes);
app.use("/api/products", products);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", auditTrail, adminRoutes);
app.use("/api/admin/products", auditTrail, adminProductRoutes);
app.use("/api/admin/watchtower", auditTrail, watchtowerRoutes);
app.use("/api/admin/complaints", auditTrail, complaintRoutes); 
app.use("/api/delivery", deliveryRoutes); 
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/spin", spinRoutes);
app.use("/api/user", userRoutes);
app.use("/api/settings", settingsRoutes);

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

  res.json({
    status: dbStatus === "ok" ? "healthy" : "degraded",
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

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  console.error(`❌ [ERROR HANDLER] ${req.method} ${req.path} | Status: ${statusCode} | Error:`, err.message);
  if (!isProduction && err.stack) console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message: isProduction ? "Internal server error" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

export { io }; // Export real IO

const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
  logger.info(`Server started`, { port: PORT, mode: process.env.NODE_ENV || 'development' });
  
  // 🟢 Start Background Workers
  initAbandonedCartWorker();
  happyHourCron.start();

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

      io.emit("SYSTEM_PULSE", {
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
