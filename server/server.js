/* --- 1. LOAD ENV VARIABLES FIRST --- */
import "dotenv/config";
import express from "express";
import { createServer } from "http";
// import { Server } from "socket.io";
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
import settingsRoutes from "./routes/settingsRoutes.js"; // 🟢 NEW
import checkMaintenance from "./middleware/checkMaintenance.js";

const app = express();
const httpServer = createServer(app); // ✅ Restore httpServer definition
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --- 2. SECURITY & PROXY --- */
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://seabite.co.in",
  "https://www.seabite.co.in",
  "http://localhost:5173",
  "https://seabite-server.vercel.app"
];

// ✅ ROBURST CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
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

app.use(express.json());

// ✅ Attach IO to request for controllers
app.use((req, res, next) => {
  req.io = { emit: () => { } }; // Mock for Vercel
  next();
});

/* --- SECURITY HARDENING (Phase 25) --- */
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

// 1. Set Security Headers
app.use(helmet());

// 2. Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// 3. Stricter Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit login attempts
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
      serverSelectionTimeoutMS: 5000, // Fail fast (5s)
      connectTimeoutMS: 10000, // 10s
      socketTimeoutMS: 45000,
      maxPoolSize: 5, // 🟢 Increased from 1 to 5 for better concurrency
      minPoolSize: 0,
      retryWrites: true,
      retryReads: true,
      ssl: true,
    };

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

// Global handlers for connection events
mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));

await connectDB();

// ✅ Session Setup (Optimized: Reuses Mongoose Connection)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "seabite_default_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: mongoose.connection.getClient(), // 🟢 Reuse existing connection
    // mongoUrl removed to prevent duplicate connection
    collectionName: "sessions",
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native', // Enable MongoDB TTL expiry
  }),
  name: "seabite.sid",
  proxy: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true, // Always true for production/SSL
    sameSite: "none",
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
app.use("/api/settings", settingsRoutes); // 🟢 NEW

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

const io = { emit: () => { } }; // Mock IO for Vercel
export { io };

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ✅ FIXED FOR VERCEL: Default export for serverless functions
export default app;
