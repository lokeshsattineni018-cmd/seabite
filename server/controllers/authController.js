import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendAuthEmail } from "../utils/emailService.js"; 
import { OAuth2Client } from "google-auth-library";
import axios from "axios"; // ✅ Added axios to handle 2-segment tokens manually

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

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  const segments = token.split('.');
  console.log(`📡 Auth Log: Processing token with ${segments.length} segments.`);

  try {
    let userData;

    // ✅ CASE A: It's a proper 3-segment ID Token (JWT)
    if (segments.length === 3) {
      console.log("📡 Auth Log: Verifying standard ID Token (JWT)");
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      userData = ticket.getPayload();
    } 
    // ✅ CASE B: It's a 2-segment Access Token (ya29)
    else {
      console.log("📡 Auth Log: Fetching user info for Access Token (ya29) via Google API");
      const googleRes = await axios.get(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
      );
      userData = googleRes.data;
    }

    if (!userData || !userData.email) {
      return res.status(400).json({ message: "Failed to retrieve user data from Google" });
    }

    const email = userData.email;
    const name = userData.name || userData.given_name;
    const googleId = userData.sub || userData.id;

    let user = await User.findOne({ email });
    let isNewUser = false; 

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      user = new User({ name, email, googleId, role: "user" });
      await user.save();
      isNewUser = true;
    }

    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    sendAuthEmail(user.email, user.name, isNewUser).catch(err => 
        console.error("❌ Email Trigger Failed:", err.message)
    );

    res.status(200).json({
      token: authToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("❌ Google Auth Error:", error.message);
    res.status(401).json({ message: "Google verification failed.", error: error.message });
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