import express from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getLoggedUser, updateUserProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= GOOGLE LOGIN =================

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) return res.redirect("https://seabite.co.in/login?error=auth_failed");
    if (!user) return res.redirect("https://seabite.co.in/login?error=no_user");

    req.logIn(user, (err) => {
      if (err) return res.redirect("https://seabite.co.in/login?error=login_error");

      // ✅ SYNC: Ensure manual session user matches Passport user
      req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

      req.session.save((err) => {
        if (err) return res.redirect("https://seabite.co.in/login?error=save_failed");
        res.redirect("https://seabite.co.in/admin/dashboard");
      });
    });
  })(req, res, next);
});

// ================= NORMAL LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // ✅ USE PASSPORT LOGIN: This ensures both Passport and manual session are synced
    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: "Login failed" });
      
      req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
      
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session save failed" });
        res.status(200).json({ user: req.session.user, message: "Login successful" });
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  // ✅ Clear the v10 cookie (matching the name in server.js)
  res.clearCookie("seabite_session_v10", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
  });

  // ✅ Logout from Passport AND destroy session
  req.logout((err) => {
    req.session.destroy((err) => {
      res.status(200).json({ message: "Logged out successfully" });
    });
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

    req.logIn(user, (err) => {
      req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session save failed" });
        res.status(201).json({ user: req.session.user, message: "Registration successful" });
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.route("/me").get(protect, getLoggedUser).put(protect, updateUserProfile);

export default router;