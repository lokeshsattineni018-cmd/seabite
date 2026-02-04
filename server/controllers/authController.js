import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// 🟢 FIXED: Updated import to match the new smart auth email function
import { sendAuthEmail } from "../utils/emailService.js"; 

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
 * Detects new vs returning users and sends Amazon-level emails
 */
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!googleRes.ok) throw new Error("Failed to fetch user from Google");

    const { name, email, sub: googleId } = await googleRes.json();

    let user = await User.findOne({ email });
    let isNewUser = false; 

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      isNewUser = false; // 🟢 Returning user
    } else {
      user = new User({ name, email, googleId });
      await user.save();
      isNewUser = true; // 🟢 New signup!
    }

    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🟢 SMART EMAIL LOGIC: High-level Welcome vs Welcome Back
    try {
        // We await this so Vercel completes the task before sending the response
        await sendAuthEmail(user.email, user.name, isNewUser);
        console.log(`✅ ${isNewUser ? 'Welcome' : 'Login'} email sent to ${user.email}`);
    } catch (err) {
        console.error("❌ Email Trigger Failed:", err.message);
    }

    res.status(200).json({
      token: authToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google Login failed" });
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