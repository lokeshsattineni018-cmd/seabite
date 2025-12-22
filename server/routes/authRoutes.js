import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
// Added googleLogin to the import list
import { getLoggedUser, updateUserProfile, googleLogin } from '../controllers/authController.js'; 

const router = express.Router();

// ----------------------------------------------------
// 🎯 PUBLIC ROUTES (REGISTER & LOGIN - Defined Locally)
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

    // If user has no password (e.g., Google user trying to login via form), block them nicely
    if (!user.password) 
      return res.status(400).json({ message: "Please log in with Google" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GOOGLE LOGIN (New) ================= */
router.post("/google", googleLogin);


// ----------------------------------------------------
// 🎯 PROTECTED ROUTES 
// ----------------------------------------------------

/* ================= GET & UPDATE LOGGED USER ================= */
router.route("/me")
  .get(getLoggedUser)
  .put(updateUserProfile);

export default router;