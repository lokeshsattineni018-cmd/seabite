/* --- 1. LOAD ENV VARIABLES FIRST --- */
import 'dotenv/config'; 

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

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

/* --- EXTRA IMPORTS --- */
import upload from "./config/multerConfig.js";

/* --- 2. EXPRESS APP SETUP --- */
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --- 3. AUTO-CREATE UPLOADS FOLDER --- */
const uploadDir = path.join(__dirname, "uploads"); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 'uploads' folder created successfully.");
}

/* --- 4. MIDDLEWARE & SECURITY HEADERS --- */
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ FIX: Add COOP/COEP headers to allow Google Auth popups
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.json());
app.use("/uploads", express.static(uploadDir)); 

/* --- 5. DATABASE CONNECTION --- */
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "seabite",
      serverSelectionTimeoutMS: 5000, 
    });
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected (Re-established)");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

/* --- 6. REQUEST LOGGER --- */
app.use((req, res, next) => {
  console.log(`📡 INCOMING: ${req.method} ${req.url}`);
  next();
});

/* --- 7. ROUTES --- */
app.get('/', (req, res) => {
    res.send("Server is Running! 🚀");
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

/* --- 8. SERVER SETUP --- */
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

export default app;