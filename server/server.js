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
import checkMaintenance from "./middleware/checkMaintenance.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --- 2. SECURITY & PROXY --- */
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://seabite.co.in",
  "https://www.seabite.co.in",
  "http://localhost:5173",
];

// ✅ Manual CORS for cross-origin requests
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

// ✅ Attach IO to request for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Handle static uploads
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
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

await connectDB();

/* --- 4. SESSION SETUP --- */
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "seabite_default_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60,
    touchAfter: 24 * 3600,
    stringify: false,
    autoRemove: "native",
  }),
  name: "seabite.sid",
  proxy: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,           // ✅ CHANGED from "auto"
    sameSite: "lax",        // ✅ CHANGED from "none"
    path: "/",
  },
});

app.use(sessionMiddleware);

// ✅ Session save error handler
app.use((req, res, next) => {
  const originalSave = req.session.save.bind(req.session);
  req.session.save = function (callback) {
    originalSave(function (err) {
      if (err) console.error('❌ Session save error:', err);
      if (callback) callback(err);
    });
  };
  next();
});

/* --- 5. ROUTES --- */
app.get("/", (req, res) => res.send("SeaBite Server Running 🚀"));

// ✅ Enterprise: Maintenance Mode
app.use(checkMaintenance);

app.use("/api/auth", authRoutes);
app.use("/api/products", products);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/spin", spinRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: state === 1 ? "ok" : "down",
    mongoState: state,
  });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

export { io }; // Export io for controllers

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ✅ FIXED FOR VERCEL: Default export for serverless functions
export default app;
