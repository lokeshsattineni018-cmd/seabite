import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  getLoggedUser,
  updateUserProfile,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendOtpEmail, sendAuthEmail } from "../utils/emailService.js";
import generateToken from "../utils/generateToken.js";
import { authLimiter } from "../middleware/rateLimiter.js";

import OTP from "../models/OTP.js";

const router = express.Router();

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

      // 📧 Send login notification email (Non-blocking)
      sendAuthEmail(user.email, user.name).catch(e => 
        console.error("Login Email Failed:", e.message)
      );
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
  
  try {
    // Clear any existing OTP for this email
    await OTP.deleteMany({ email, type: "SIGNUP" });
    await OTP.create({ email, otp, type: "SIGNUP" });
    
    await sendOtpEmail(email, otp, "SIGNUP");
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("OTP Send Error:", err);
    res.status(500).json({ message: "Failed to send OTP email" });
  }
});

router.post("/verify-otp-signup", async (req, res) => {
  try {
    const { name, email, phone, password, otp, referralCode } = req.body;
    
    console.log(`🔍 [DEBUG] verify-otp-signup triggered for: ${email}, Phone: ${phone}`);

    if (!phone || phone.length < 10) {
        console.log("❌ [DEBUG] Signup Verification Failed: Invalid phone number length");
        return res.status(400).json({ message: "Phone number must be at least 10 digits" });
    }
    const storedOtpData = await OTP.findOne({ email, otp, type: "SIGNUP" });
    if (!storedOtpData) {
      console.log(`❌ [AUTH] Invalid OTP for: ${email}`);
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ [AUTH] User already exists: ${email}`);
      if (existingUser.googleId && !existingUser.password) {
        return res.status(400).json({ message: "This email is already associated with a Google account. Please use Google Login." });
      }
      return res.status(400).json({ message: "User already exists with this email. Please login." });
    }

    let referrerId = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referrerId = referrer._id;
        console.log(`✅ [AUTH] Referral matched: ${referralCode}`);
      } else {
        console.log(`⚠️ [AUTH] Referral not found: ${referralCode}`);
      }
    }

    try {
      console.log(`🔍 [DEBUG] Attempting User.create for: ${email}`);
      const user = await User.create({
        name: name || "User",
        email,
        phone: phone && phone.trim() !== "" ? phone : undefined,
        password,
        referredBy: referrerId,
      });

      console.log(`✅ [AUTH] User created successfully: ${user._id}`);
      await OTP.deleteMany({ email, type: "SIGNUP" });

      // Create session
      req.session.userId = user._id;
      req.session.role = user.role;
      
      generateToken(res, user._id);
      
      // 📧 Send Welcome Email
      try {
        await sendAuthEmail(user.email, user.name, true);
      } catch (emailErr) {
        console.error("Welcome email failed:", emailErr);
      }

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
      console.error("❌ SIGNUP VERIFICATION ERROR:", err);
      res.status(500).json({ message: "Error creating user", error: err.message });
    }
  } catch (globalErr) {
    console.error("❌ GLOBAL SIGNUP ERROR:", globalErr);
    res.status(500).json({ message: "Internal server error during signup" });
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
  
  try {
    await OTP.deleteMany({ email, type: "FORGOT" });
    await OTP.create({ email, otp, type: "FORGOT" });

    await sendOtpEmail(email, otp, "FORGOT");
    res.json({ message: "Reset OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reset OTP" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  const storedOtpData = await OTP.findOne({ email, otp, type: "FORGOT" });
  if (!storedOtpData) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email, type: "FORGOT" });
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