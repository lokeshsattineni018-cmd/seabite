// controllers/authController.js
import User from "../models/User.js";
import { sendAuthEmail } from "../utils/emailService.js";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

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
    let isNewUser = false;

    if (user) {
      console.log("👤 Existing user found:", email);
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
        console.log("🔗 Google ID linked to existing user");
      }
    } else {
      console.log("👤 Creating new user:", email);
      user = new User({ name, email, googleId, role: "user" });
      await user.save();
      isNewUser = true;
      console.log("✅ New user created");
    }

    // ✅ SESSION VERIFICATION
    if (!req.session) {
      //console.error(
      //  "❌ Session middleware failed to initialize. Check MongoDB connection."
     // );
      return res.status(500).json({ message: "Server Session Error" });
    }

    console.log("🔑 Current Session ID:", req.sessionID);
    console.log("🔑 Session before save:", req.session);

    // ✅ POPULATE MONGO SESSION (consistent shape)
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log("💾 Attempting to save session...");

    // ✅ FORCE SAVE: Sync with MongoDB before responding
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }

      console.log("✅ Session saved successfully!");
      console.log("🔑 Session ID after save:", req.sessionID);
      console.log("👤 Session user:", req.session.user);
      
      // Send welcome email (non-blocking)
      sendAuthEmail(user.email, user.name, isNewUser).catch((err) => {
        console.log("⚠️ Email send failed (non-critical):", err.message);
      });

      // ✅ Explicitly set cookie in response headers (redundant but ensures it's sent)
      const cookieHeader = res.getHeader('Set-Cookie');
      console.log("🍪 Set-Cookie header:", cookieHeader);

      res.status(200).json({ 
        user: req.session.user,
        sessionId: req.sessionID, // Include for debugging
        debug: {
          mobile: /mobile/i.test(req.headers["user-agent"]),
          origin: req.headers.origin
        }
      });
    });
  } catch (error) {
    console.error("❌ Google Auth Error:", error.message);
    console.error("Stack:", error.stack);
    res.status(401).json({ message: "Google verification failed." });
  }
};

// ✅ Use req.user from protect, do not re-query Mongo unless needed
export const getLoggedUser = async (req, res) => {
  console.log("👤 getLoggedUser called");
  console.log("🍪 Cookie header:", req.headers.cookie);
  console.log("🔑 Session ID:", req.sessionID);
  console.log("👤 Session user:", req.session?.user);
  
  if (!req.user) {
    console.log("❌ No user in request (protect middleware failed)");
    return res.status(401).json({ message: "Not authenticated" });
  }

  console.log("✅ Returning user data");
  res.json({
    id: req.user.id || req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone || "",
    addresses: req.user.addresses || [],
  });
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
      { new: true, runValidators: true, select: "-password" }
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