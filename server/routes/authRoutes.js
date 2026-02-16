import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  getLoggedUser,
  updateUserProfile,
  googleLogin,  // ✅ Import the token-based googleLogin
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= LOGIN & REGISTER REMOVED =================
// Security Hardening (Phase 26): Email/Password auth disabled in favor of Google OAuth only.

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

// ================= GOOGLE LOGIN (Token-based) =================
router.post("/google", googleLogin);  // ✅ POST route that accepts token

// ================= CURRENT USER =================
router
  .route("/me")
  .get(protect, getLoggedUser)
  .put(protect, updateUserProfile);

export default router;