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

/* --- EXTRA IMPORTS --- */
import Product from "./models/Product.js";
import upload from "./config/multerConfig.js";
import { protect } from "./middleware/authMiddleware.js";
import paymentRoutes from "./routes/paymentRoutes.js";

/* --- 2. EXPRESS APP SETUP --- */
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --- 3. AUTO-CREATE UPLOADS FOLDER --- */
// Note: On Vercel, this folder is read-only. Images should ideally go to Cloudinary/S3 in production.
const uploadDir = path.join(__dirname, "uploads"); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 'uploads' folder created successfully.");
}

/* --- 4. MIDDLEWARE --- */
app.use(cors({
  // 🟢 Update this with your Vercel Frontend URL after deployment
  // Example: origin: ["http://localhost:5173", "https://seabite.vercel.app"],
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use("/uploads", express.static(uploadDir)); 

/* --- 5. REQUEST LOGGER --- */
app.use((req, res, next) => {
  console.log(`📡 INCOMING: ${req.method} ${req.url}`);
  next();
});

/* --- 6. DATABASE --- */
// Ensure MONGO_URI is added in Vercel Environment Variables
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

/* --- 7. ROUTES --- */
// 🟢 NEW: Home Route to check server status
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

/* --- 8. SERVER SETUP (VERCEL COMPATIBLE) --- */
const PORT = process.env.PORT || 5001;

// 🟢 VERCEL LOGIC: Only listen manually if NOT in production (running locally)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

// 🟢 EXPORT APP FOR VERCEL
export default app;