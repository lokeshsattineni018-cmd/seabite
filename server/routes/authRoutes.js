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

// ----------------------------------------------------
// 🎯 PUBLIC ROUTES
// ----------------------------------------------------

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email & password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid email or password" });

    if (!user.password)
      return res
        .status(400)
        .json({ message: "Please log in with Google" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Invalid email or password" });

    // ✅ MONGO SESSION SYNC: Store user directly in the database session store
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Explicitly save session before responding to prevent race conditions
    req.session.save((err) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Session save failed" });

      res.json({
        user: req.session.user,
        message: "Login successful",
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= GOOGLE LOGIN =================
router.post("/google", googleLogin);

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  // ✅ DESTROY MONGO SESSION: Removes the document from the 'sessions' collection
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout Error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }

    // Clear the session cookie from the browser
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({ message: "Logged out successfully" });
  });
});

// ----------------------------------------------------
// 🎯 PROTECTED ROUTES
// ----------------------------------------------------

router
  .route("/me")
  .get(protect, getLoggedUser)
  .put(protect, updateUserProfile);

export default router;
