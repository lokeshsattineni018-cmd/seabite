/* --- 1. LOAD ENV VARIABLES FIRST --- */
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";

/* --- ROUTE IMPORTS --- */
import authRoutes from "./routes/authRoutes.js";
import adminProductRoutes from "./routes/adminProducts.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import products from "./routes/products.js";
import productsRoutes from "./routes/productsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import spinRoutes from "./routes/spinRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --- 2. SECURITY & PROXY (CRITICAL FOR VERCEL) --- */
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://seabite.co.in",
  "https://www.seabite.co.in",
  "http://localhost:5173",
];

// ✅ MANUAL CORS (CREDENTIALS + EXACT ORIGINS)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Debug logging middleware (remove in production)
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log(`🍪 Cookies: ${req.headers.cookie || 'none'}`);
  console.log(`🌐 Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json());

// ✅ STATIC IMAGES
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

/* --- 3. DATABASE CONNECTION --- */
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log("➡️ Using existing MongoDB connection");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "seabite",
      serverSelectionTimeoutMS: 30000,    // ✅ Increased from 5000
      connectTimeoutMS: 30000,             // ✅ Increased from 10000
      socketTimeoutMS: 45000,              // ✅ Added socket timeout
      maxPoolSize: 10,                     // ✅ Connection pool
      minPoolSize: 2,                      // ✅ Minimum connections
      retryWrites: true,                   // ✅ Retry writes on failure
      retryReads: true,                    // ✅ Retry reads on failure
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};

// ✅ Add reconnection logic
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

await connectDB();

/* --- 4. MONGODB SESSION SETUP --- */
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "seabite_default_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60,
    touchAfter: 24 * 3600, // ✅ Lazy session update (once per 24h)
    stringify: false,       // ✅ Better performance
    autoRemove: 'native',   // ✅ Let MongoDB handle expired sessions
  }),
  name: "seabite.sid",
  proxy: true,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "lax",    // ✅ Changed from "none"
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  },
});

app.use(sessionMiddleware);

// ✅ Session save error handler
app.use((req, res, next) => {
  const originalSave = req.session.save.bind(req.session);
  req.session.save = function(callback) {
    originalSave(function(err) {
      if (err) {
        console.error('❌ Session save error:', err);
      }
      if (callback) callback(err);
    });
  };
  next();
});

// ✅ Session debug middleware (remove in production)
app.use((req, res, next) => {
  if (req.session) {
    console.log(`🔑 Session ID: ${req.sessionID || 'none'}`);
    console.log(`👤 Session User: ${req.session.user?.email || 'not logged in'}`);
  }
  next();
});

/* --- 5. ROUTES --- */
app.get("/", (req, res) => res.send("SeaBite Server Running 🚀"));

// ✅ Debug endpoint - check if cookies are working
app.get("/api/debug/cookie-test", (req, res) => {
  res.json({
    hasCookie: !!req.headers.cookie,
    cookies: req.headers.cookie,
    sessionID: req.sessionID,
    sessionData: req.session,
    origin: req.headers.origin,
    userAgent: req.headers["user-agent"],
    mongoStatus: mongoose.connection.readyState, // ✅ Added MongoDB status
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", products);
app.use("/api/productsRoutes", productsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/spin", spinRoutes);

app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({ 
    status: state === 1 ? "ok" : "down", 
    mongoState: state,
    stateDescription: ['disconnected', 'connected', 'connecting', 'disconnecting'][state]
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;