import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import User from "../models/User.js";
import { getLoggedUser, updateUserProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= 1. MANUAL LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.password) return res.status(400).json({ message: "Please log in with Google" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    // ✅ FIX: Wait for Save
    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "Session save failed" });
      res.status(200).json({ user: req.session.user, message: "Login successful" });
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= 2. GOOGLE LOGIN (FIXED) =================
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body; // Token from frontend
    if (!token) return res.status(400).json({ message: "No token provided" });

    // 1. Verify Token directly with Google (No extra libraries needed)
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const { email, name, sub: googleId, picture } = googleRes.data;

    // 2. Find or Create User
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: "user",
      });
    }

    // 3. Set Session
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    // 4. ✅ CRITICAL FIX: Force Save before responding
    // This stops the "Login Loop" by ensuring the session exists before the frontend redirects.
    req.session.save((err) => {
      if (err) {
        console.error("❌ Google Session Save Error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }
      console.log("✅ Google Login Saved:", email);
      res.status(200).json({ user: req.session.user, message: "Google Login successful" });
    });

  } catch (err) {
    console.error("❌ Google Login Error:", err.message);
    res.status(401).json({ message: "Google authentication failed" });
  }
});

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  // Clear the exact cookie name from index.js
  res.clearCookie("seabite_session_v5", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    domain: process.env.NODE_ENV === 'production' ? '.seabite.co.in' : undefined,
  });

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role: "user" });

    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "Session save failed" });
      res.status(201).json({ user: req.session.user, message: "Registration successful" });
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= CURRENT USER =================
router.route("/me").get(protect, getLoggedUser).put(protect, updateUserProfile);

export default router;