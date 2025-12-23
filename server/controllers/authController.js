import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { sendLoginNotification } from "../utils/emailService.js"; 

// --- Helper Function to verify token and get decoded user ---
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

// ===================================================
// AUTH CONTROLLERS (GOOGLE)
// ===================================================

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // 🟢 1. FETCH USER INFO USING ACCESS TOKEN
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!googleRes.ok) {
      throw new Error("Failed to fetch user from Google");
    }

    const { name, email, sub: googleId } = await googleRes.json();

    // 2. Check DB
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = new User({
        name,
        email,
        googleId,
      });
      await user.save();
    }

    // 3. Generate Token
    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🟢 4. SEND LOGIN NOTIFICATION EMAIL (FIXED: Added await for Vercel)
    // We wrap this in a try/catch so the login still works even if the email fails
    try {
        await sendLoginNotification(user.email, user.name);
        console.log(`✅ Login notification sent to ${user.email}`);
    } catch (err) {
        console.error("❌ Email Error (Login Notification):", err.message);
    }

    res.status(200).json({
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google Login failed" });
  }
};

// ===================================================
// PROTECTED PROFILE CONTROLLERS
// ===================================================

// @desc    Get logged-in user details
export const getLoggedUser = async (req, res) => {
    const decoded = getDecodedUser(req);
    if (!decoded) return res.status(401).json({ message: "Invalid or missing token" });

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
        res.status(500).json({ message: "Server error fetching user data" });
    }
};

// @desc    Update user profile (name, phone)
export const updateUserProfile = async (req, res) => {
    const { name, phone } = req.body;
    const decoded = getDecodedUser(req);
    if (!decoded) return res.status(401).json({ message: "Invalid or missing token" });

    try {
        const fieldsToUpdate = {};
        
        if (name !== undefined) fieldsToUpdate.name = name;
        if (phone !== undefined) fieldsToUpdate.phone = phone;

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            decoded.id, 
            { $set: fieldsToUpdate }, 
            { new: true, runValidators: true, select: '-password' } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        res.json({
            message: 'Profile updated successfully',
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                message: 'Validation failed during save.',
                errors: messages 
            });
        }
        
        console.error("Server Error during profile update:", error);
        res.status(500).json({ message: 'Server error during profile update' });
    }
};