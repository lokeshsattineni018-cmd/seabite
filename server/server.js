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

// ✅ MANUAL CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");

  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// ✅ STATIC IMAGES
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

/* --- 3. ROBUST DATABASE CONNECTION (Prevents Vercel Timeouts) --- */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log("➡️ Using existing MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "seabite",
      serverSelectionTimeoutMS: 15000, // Fail fast (15s) so Vercel doesn't hang
      socketTimeoutMS: 45000,          // Keep connection alive
      maxPoolSize: 5,                  // Limit connections for Serverless
      minPoolSize: 0,
      retryWrites: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
};

mongoose.connection.on('error', err => console.error('⚠️ DB Error:', err.message));
await connectDB();

/* --- 🚨 CRITICAL FIX: FORCE DELETE CORRUPTED SESSIONS --- */
// Deletes old data causing the "expires" error crash.
try {
  const collections = await mongoose.connection.db.listCollections({ name: 'sessions' }).toArray();
  if (collections.length > 0) {
    console.log("🔥 Startup Cleanup: Deleting old sessions to fix cookie format...");
    await mongoose.connection.db.dropCollection('sessions');
    console.log("✅ Sessions cleared. System ready.");
  }
} catch (e) {
  console.log("⚠️ Session cleanup skipped:", e.message);
}

/* --- 4. SESSION SETUP --- */
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "seabite_default_secret",
  resave: false,
  saveUninitialized: false, 
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Use URL directly for reliability
    dbName: "seabite",
    collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60,
    touchAfter: 24 * 3600,
    autoRemove: 'native',
  }),
  // ✅ V4 NAME: Forces all devices to get a brand new cookie
  name: "seabite_session_v4", 
  proxy: true, 
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    httpOnly: true,
    secure: true,    
    sameSite: "none", // Required for Laptop/Cross-Site
    partitioned: true, // Required for Mobile/iOS
    path: "/",
  },
});

app.use(sessionMiddleware);

/* --- 5. ROUTES --- */
app.get("/", (req, res) => res.send("SeaBite Server Running 🚀"));

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
  res.json({ status: mongoose.connection.readyState === 1 ? "ok" : "down" });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;