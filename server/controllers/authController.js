import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendAuthEmail } from "../utils/emailService.js"; 
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getDecodedUser = (req) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return null;
    const token = auth.split(" ")[1];
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

/**
 * 🟢 GOOGLE LOGIN (SMART AUTH)
 * Error-free verification using Google ID Token
 */
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  // 🚨 DEBUG LOGS: Remove these after the issue is fixed
  console.log("--- GOOGLE AUTH DEBUG START ---");
  if (token) {
    const segments = token.split('.');
    console.log("Token received starts with:", token.substring(0, 10)); // Checks for 'ya29' vs 'eyJ'
    console.log("Number of segments detected:", segments.length); // Verifies if it's a 3-part JWT
    
    if (segments.length !== 3) {
      console.error("⚠️ FORMAT ERROR: Expected 3 segments (JWT), but received", segments.length);
    }
  } else {
    console.log("No token found in request body.");
  }
  console.log("--- GOOGLE AUTH DEBUG END ---");

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token, // This library strictly requires the 3-segment JWT ID Token
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });
    let isNewUser = false; 

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = new User({ name, email, googleId });
      await user.save();
      isNewUser = true;
    }

    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Email trigger in background
    sendAuthEmail(user.email, user.name, isNewUser).catch(err => 
        console.error("❌ Email Trigger Failed:", err.message)
    );

    res.status(200).json({
      token: authToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("Google Auth Error:", error.message);
    res.status(401).json({ 
      message: "Google verification failed. Ensure you are sending an ID Token (JWT).",
      debug_error: error.message 
    });
  }
};

export const getLoggedUser = async (req, res) => {
    const decoded = getDecodedUser(req);
    if (!decoded) return res.status(401).json({ message: "Invalid token" });
    try {
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            addresses: user.addresses || [], 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUserProfile = async (req, res) => {
    const { name, phone } = req.body;
    const decoded = getDecodedUser(req);
    if (!decoded) return res.status(401).json({ message: "Invalid token" });

    try {
        const fieldsToUpdate = {};
        if (name !== undefined) fieldsToUpdate.name = name;
        if (phone !== undefined) fieldsToUpdate.phone = phone;

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id, 
            { $set: fieldsToUpdate }, 
            { new: true, runValidators: true, select: '-password' } 
        );

        res.json({
            message: 'Profile updated successfully',
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
        });
    } catch (error) {
        res.status(500).json({ message: 'Profile update failed' });
    }
};