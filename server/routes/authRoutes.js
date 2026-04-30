import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  getLoggedUser,
  updateUserProfile,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendOtpEmail } from "../utils/emailService.js";
import generateToken from "../utils/generateToken.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Memory store for OTPs (in production, use Redis or DB with TTL)
const otpStore = new Map();

// ================= LOGIN =================
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.googleId && !user.password) {
      return res.status(400).json({ message: "You have an account via Google login. Please use Google to sign in." });
    }
    if (await user.matchPassword(password)) {
      req.session.userId = user._id;
      req.session.role = user.role;
      generateToken(res, user._id);
      res.json({
        sessionId: req.sessionID,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          wishlist: user.wishlist,
          walletBalance: user.walletBalance,
          referralCode: user.referralCode,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  console.log("🚪 Logout requested for session:", req.sessionID);

  res.clearCookie("seabite.sid", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none", // Updated for production
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

// ================= THIRD PARTY LOGIN =================
router.post("/google", googleLogin);

// ================= OTP SIGNUP =================
router.post("/send-otp", authLimiter, async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.googleId && !existingUser.password) {
      return res.status(400).json({ message: "Email already registered via Google. Please sign in with Google." });
    }
    return res.status(400).json({ message: "Email already registered. Please login with your password." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

  try {
    await sendOtpEmail(email, otp, "SIGNUP");
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP email" });
  }
});

router.post("/verify-otp-signup", async (req, res) => {
  const { name, email, phone, password, otp, referralCode } = req.body;
  
  const storedOtpData = otpStore.get(email);
  if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.googleId && !existingUser.password) {
      return res.status(400).json({ message: "This email is already associated with a Google account. Please use Google Login." });
    }
    return res.status(400).json({ message: "User already exists with this email. Please login." });
  }

  let referrerId = null;
  let initialWalletBalance = 0;

  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (referrer) {
      referrerId = referrer._id;
      initialWalletBalance = 100; // New user gets ₹100 off their first order via wallet
    }
  }

  try {
    const user = await User.create({
      name,
      email,
      phone,
      password,
      referredBy: referrerId,
      walletBalance: initialWalletBalance
    });

    otpStore.delete(email);

    // Create session
    req.session.userId = user._id;
    req.session.role = user.role;
    
    generateToken(res, user._id);

    res.status(201).json({
      message: "Registration successful",
      sessionId: req.sessionID,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot-password-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Not registered in our website" });
  if (user.googleId && !user.password) {
    return res.status(400).json({ message: "This email is registered via Google login. Please use Google to sign in." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000, type: 'FORGOT' });

  try {
    await sendOtpEmail(email, otp, "FORGOT");
    res.json({ message: "Reset OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reset OTP" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  const storedOtpData = otpStore.get(email);
  if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.type !== 'FORGOT' || storedOtpData.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    otpStore.delete(email);
    res.json({ message: "Password reset successful. Please login." });
  } catch (err) {
    res.status(500).json({ message: "Error resetting password" });
  }
});

// ================= CHANGE PASSWORD =================
router.put("/change-password", protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user || !user.password) {
      return res.status(400).json({ message: "Action not allowed for this account type" });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error during password change" });
  }
});

// ================= CURRENT USER =================
router
  .route("/me")
  .get(protect, getLoggedUser)
  .put(protect, updateUserProfile);

export default router;