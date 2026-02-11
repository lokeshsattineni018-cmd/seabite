import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  getLoggedUser,
  updateUserProfile,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= LOGIN (Manual Save Fix) =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Please log in with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Populate Session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // ✅ FORCE SAVE: Wait for DB write before sending response
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session Save Error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }
      console.log("✅ Login successful - Session saved for:", user.email);
      res.status(200).json({
        user: req.session.user,
        message: "Login successful",
      });
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  console.log("🚪 Logout requested");
  
  // ✅ Clear the cookie with EXACT matching settings
  res.clearCookie("seabite_session_v4", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
  });

  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout Session Destroy Error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    console.log("✅ Logout successful");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: "user",
    });

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // ✅ FORCE SAVE
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session Save Error (register):", err);
        return res.status(500).json({ message: "Session save failed" });
      }
      res.status(201).json({
        user: req.session.user,
        message: "Registration successful",
      });
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GOOGLE LOGIN =================
router.post("/google", googleLogin);

// ================= CURRENT USER =================
router
  .route("/me")
  .get(protect, getLoggedUser)
  .put(protect, updateUserProfile);

export default router;