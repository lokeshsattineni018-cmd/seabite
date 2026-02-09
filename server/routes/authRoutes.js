// routes/authRoutes.js
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

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    // Ensure they didn't sign up with Google only
    if (!user.password) {
      return res
        .status(400)
        .json({ message: "Please log in with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    // ✅ SESSION DATA: Must match what adminAuth.js expects
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // Critical for adminAuth.js
    };

    // ✅ FORCE SYNC: Ensure MongoDB record is created BEFORE sending response
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session Save Error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }

      // Only now send response to frontend
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
  // Clear cookie first to prevent immediate auto-relogin
  res.clearCookie("connect.sid", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout Session Destroy Error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// ================= REGISTER (FILL IN YOUR LOGIC) =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation – adjust as needed
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
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
      role: "user", // or whatever default role you use
    });

    // Optionally auto-login after register
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

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
