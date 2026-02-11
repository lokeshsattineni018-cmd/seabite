import express from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getLoggedUser, updateUserProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= GOOGLE LOGIN (Manual Save Injection) =================

// 1. Trigger Google Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 2. Custom Callback (Fixes Vercel Race Condition)
router.get("/google/callback", (req, res, next) => {
  // We manually call passport to intercept the redirect
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      console.error("❌ Passport Error:", err);
      return res.redirect("https://seabite.co.in/login?error=auth_failed");
    }
    if (!user) {
      return res.redirect("https://seabite.co.in/login?error=no_user");
    }

    // Log the user in manually
    req.logIn(user, (err) => {
      if (err) {
        console.error("❌ Login Error:", err);
        return res.redirect("https://seabite.co.in/login?error=login_error");
      }

      // ✅ CRITICAL FIX: Manually SAVE session before redirecting
      req.session.save((err) => {
        if (err) {
          console.error("❌ Session Save Error:", err);
          return res.redirect("https://seabite.co.in/login?error=save_failed");
        }
        console.log("✅ Session saved manually. Redirecting...");
        res.redirect("https://seabite.co.in/admin/dashboard");
      });
    });
  })(req, res, next);
});

// ================= NORMAL LOGIN (Manual Save) =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });
    if (!user.password) return res.status(400).json({ message: "Please log in with Google" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Manually set session
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    // ✅ FORCE SAVE
    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "Session save failed" });
      res.status(200).json({ user: req.session.user, message: "Login successful" });
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  // Clear the v7 cookie
  res.clearCookie("seabite_session_v7", {
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