import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getLoggedUser, updateUserProfile, googleLogin } from '../controllers/authController.js'; 

const router = express.Router();

// ----------------------------------------------------
// 🎯 PUBLIC ROUTES
// ----------------------------------------------------

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!user.password) 
      return res.status(400).json({ message: "Please log in with Google" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // ✅ SESSION SYNC: Save user to MongoDB session instead of just returning a token
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.role,
    };

    res.json({
      user: req.session.user,
      message: "Login successful"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GOOGLE LOGIN ================= */
router.post("/google", googleLogin);

/* ================= LOGOUT (New) ================= */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie('connect.sid'); // Clears the session cookie
    res.json({ message: "Logged out from MongoDB session" });
  });
});


// ----------------------------------------------------
// 🎯 PROTECTED ROUTES 
// ----------------------------------------------------

router.route("/me")
  .get(getLoggedUser)
  .put(updateUserProfile);

export default router;