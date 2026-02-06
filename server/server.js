/* --- 1. LOAD ENV VARIABLES FIRST --- */
import 'dotenv/config'; 
import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
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
  "http://localhost:5173"
];

// ✅ BULLETPROOF CORS: Forces the browser to accept the session cookie
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// ✅ STATIC IMAGES
const uploadDir = path.join(__dirname, "uploads"); 
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir)); 

/* --- 3. DATABASE CONNECTION --- */
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, { dbName: "seabite" });
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error);
  }
};
await connectDB();

/* --- 4. MONGODB SESSION SETUP (MUST BE BEFORE ROUTES) --- */
app.use(session({
  secret: process.env.SESSION_SECRET || "seabite_default_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 
  }),
  cookie: {
    secure: true, 
    httpOnly: true,
    sameSite: "none", // ✅ Required for cross-domain sessions
    maxAge: 7 * 24 * 60 * 60 * 1000 
  }
}));

/* --- 5. ROUTES --- */
app.get('/', (req, res) => res.send("SeaBite Server Running 🚀"));
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

export default app;