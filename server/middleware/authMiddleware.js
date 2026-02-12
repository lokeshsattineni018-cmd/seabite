// middleware/authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  console.log("🛡️ Protect Middleware: Checking authentication");
  console.log("🍪 Cookie header:", req.headers.cookie || "NONE");
  console.log("🔑 Session ID:", req.sessionID || "NONE");
  console.log("👤 Session user:", req.session?.user);
  
  try {
    if (!req.session) {
      console.log("❌ No session object");
      return res.status(401).json({ message: "Session not available" });
    }

    // Check manual session
    if (req.session?.user?.id) {
      console.log("✅ Session user found:", req.session.user.email);
      
      const sessUser = req.session.user;
      req.user = {
        _id: sessUser.id,
        id: sessUser.id,
        name: sessUser.name,
        email: sessUser.email,
        role: sessUser.role,
      };

      console.log("✅ Protect: Authentication successful");
      return next();
    }

    // Fallback: userId only
    if (req.session?.userId) {
      console.log("🔍 Found userId, fetching from DB:", req.session.userId);
      
      const user = await User.findById(req.session.userId).select("-password");
      
      if (!user) {
        console.log("❌ User not found in DB");
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        ...user.toObject(),
        id: user._id.toString(),
      };

      return next();
    }

    console.log("❌ Protect: No active session found");
    return res.status(401).json({ message: "Not authenticated" });
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admin only" });
};