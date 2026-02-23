// controllers/authController.js
import User from "../models/User.js";
import { sendAuthEmail } from "../utils/emailService.js";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { logActivity } from "../utils/activityLogger.js";
import logger from "../utils/logger.js";
import admin from "../utils/firebaseAdmin.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  console.log("🔐 Google Login: Request received");
  console.log("📱 User-Agent:", req.headers["user-agent"]);
  console.log("🌐 Origin:", req.headers.origin);
  console.log("🍪 Has Cookie Header:", !!req.headers.cookie);

  if (!token) {
    console.log("❌ No token provided");
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    let userData;
    const segments = token.split(".");

    // Verify Google Token (ID Token vs Access Token)
    if (segments.length === 3) {
      console.log("🔑 Verifying ID token...");
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      userData = ticket.getPayload();
    } else {
      console.log("🔑 Verifying access token...");
      const googleRes = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
      );
      userData = googleRes.data;
    }

    if (!userData || !userData.email) {
      console.log("❌ Failed to retrieve Google data");
      return res
        .status(400)
        .json({ message: "Failed to retrieve Google data" });
    }

    console.log("✅ Google data retrieved for:", userData.email);

    const email = userData.email.toLowerCase();
    const name = userData.name || userData.given_name;
    const googleId = userData.sub || userData.id;

    let user = await User.findOne({ email });

    // 🔐 ENTERPRISE IAM: Brute-Force Check
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      logger.security("Blocked login attempt: Account locked", { traceId: req.traceId, email: user.email });
      return res.status(403).json({ message: "Too many failed attempts. Account is temporarily locked." });
    }

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = new User({ name, email, googleId, role: "user" });
      await user.save();
    }

    // 🚫 BAN CHECK
    if (user.isBanned) {
      logger.security("Banned user attempted login", { traceId: req.traceId, email: user.email });
      return res.status(403).json({ message: "Access Denied: Your account has been suspended." });
    }

    // ✅ Reset login attempts on success
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    if (!req.session) {
      return res.status(500).json({ message: "Server Session Error" });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.session.save((err) => {
      if (err) {
        logger.error("Session save failed", { traceId: req.traceId, error: err.message });
        return res.status(500).json({ message: "Session save failed" });
      }

      logger.info("User Authenticated", { traceId: req.traceId, userId: user._id, email: user.email });

      // Send welcome email (non-blocking)
      sendAuthEmail(user.email, user.name, user.createdAt > (Date.now() - 5000)).catch((err) => {
        logger.warn("Welcome Email Failed", { traceId: req.traceId, error: err.message });
      });

      logActivity("LOGIN", `User Logged In: ${user.name} (${user.email})`, req);

      res.status(200).json({
        user: req.session.user,
        sessionId: req.sessionID
      });
    });
  } catch (error) {
    logger.error("Auth Failure", { traceId: req.traceId, error: error.message });
    res.status(401).json({ message: "Google verification failed." });
  }
};

export const firebaseLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    logger.warn("Firebase Login attempt without token", { traceId: req.traceId });
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { phone_number, uid } = decodedToken;

    if (!phone_number) {
      logger.warn("Firebase token lacks phone number", { traceId: req.traceId, uid });
      return res.status(400).json({ message: "Phone number verification required." });
    }

    let user = await User.findOne({ phone: phone_number });

    if (!user) {
      // New User: Create with phone as primary identifier
      user = new User({
        name: `Customer ${phone_number.slice(-4)}`,
        phone: phone_number,
        role: "user"
      });
      await user.save();
      logger.info("New user registered via Phone OTP", { traceId: req.traceId, phone: phone_number });
    }

    // 🚫 BAN CHECK
    if (user.isBanned) {
      logger.security("Banned user attempted phone login", { traceId: req.traceId, phone: phone_number });
      return res.status(403).json({ message: "Access Denied: Your account has been suspended." });
    }

    // ✅ Establish Session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email || "",
      role: user.role,
    };

    req.session.save((err) => {
      if (err) {
        logger.error("Session save failed (Firebase)", { traceId: req.traceId, error: err.message });
        return res.status(500).json({ message: "Session initialization failed" });
      }

      logger.info("User Authenticated via Phone", { traceId: req.traceId, userId: user._id, phone: phone_number });
      logActivity("LOGIN", `User Logged In via Phone: ${phone_number}`, req);

      res.status(200).json({
        user: req.session.user,
        sessionId: req.sessionID
      });
    });

  } catch (error) {
    logger.error("Firebase Auth Bridge Failure", { traceId: req.traceId, error: error.message });
    res.status(401).json({ message: "Phone verification session expired. Please login again." });
  }
};

// ✅ Use req.user from protect, do not re-query Mongo unless needed
export const getLoggedUser = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  try {
    // Full DB fetch to get createdAt, picture, phone, addresses
    const dbUser = await User.findById(req.user.id || req.user._id)
      .select("name email role phone picture avatar addresses wishlist createdAt")
      .lean();

    if (!dbUser) return res.status(404).json({ message: "User not found" });

    res.json({
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone || "",
      picture: dbUser.picture || dbUser.avatar || "",
      addresses: dbUser.addresses || [],
      wishlist: dbUser.wishlist || [],
      createdAt: dbUser.createdAt,
    });
  } catch (err) {
    logger.error("getLoggedUser DB failure", { traceId: req.traceId, error: err.message });
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  console.log("✏️ updateUserProfile called");

  if (!req.session?.user) {
    console.log("❌ No session user");
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      { $set: req.body },
      { returnDocument: "after", runValidators: true, select: "-password" }
    );

    console.log("✅ Profile updated for:", updatedUser.email);

    res.json({
      message: "Profile updated successfully",
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
    });
  } catch (error) {
    console.error("❌ Profile update failed:", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};