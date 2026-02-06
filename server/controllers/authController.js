import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendAuthEmail } from "../utils/emailService.js"; 
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: "No token provided" });

  try {
    let userData;
    const segments = token.split('.');

    if (segments.length === 3) {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      userData = ticket.getPayload();
    } else {
      const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
      userData = googleRes.data;
    }

    if (!userData || !userData.email) return res.status(400).json({ message: "Failed to retrieve Google data" });

    const email = userData.email.toLowerCase();
    const name = userData.name || userData.given_name;
    const googleId = userData.sub || userData.id;

    let user = await User.findOne({ email });
    let isNewUser = false; 

    if (user) {
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    } else {
      user = new User({ name, email, googleId, role: "user" });
      await user.save();
      isNewUser = true;
    }

    // ✅ FIX: Verify session middleware exists before setting property
    if (!req.session) {
      console.error("❌ Session middleware not initialized correctly.");
      return res.status(500).json({ message: "Internal Session Error" });
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.save((err) => {
      if (err) return res.status(500).json({ message: "Session save failed" });
      sendAuthEmail(user.email, user.name, isNewUser).catch(() => {});
      res.status(200).json({ user: req.session.user });
    });

  } catch (error) {
    console.error("❌ Google Auth Error:", error.message);
    res.status(401).json({ message: "Google verification failed." });
  }
};

export const getLoggedUser = async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: "Not authenticated" });
    
    try {
        const user = await User.findById(req.session.user.id).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            addresses: user.addresses || [], 
        });
    } catch (err) { res.status(500).json({ message: "Server error" }); }
};

export const updateUserProfile = async (req, res) => {
    const { name, phone } = req.body;
    if (!req.session?.user) return res.status(401).json({ message: "Not authenticated" });

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id, 
            { $set: { name, phone } }, 
            { new: true, runValidators: true, select: '-password' } 
        );
        res.json({
            message: 'Profile updated successfully',
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
        });
    } catch (error) { res.status(500).json({ message: 'Profile update failed' }); }
};