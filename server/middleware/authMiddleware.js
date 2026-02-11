// middleware/authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  console.log("🛡️ Protect Middleware: Checking authentication");
  console.log("🍪 Cookie header:", req.headers.cookie || "NONE");
  console.log("🔑 Session ID:", req.sessionID || "NONE");
  console.log("📱 User-Agent:", req.headers["user-agent"]?.substring(0, 50));
  console.log("🌐 Origin:", req.headers.origin || "NONE");
  
  try {
    // Check if session exists
    if (!req.session) {
      console.log("❌ No session object exists");
      return res.status(401).json({ message: "Session not available" });
    }

    console.log("📦 Full session object:", JSON.stringify(req.session, null, 2));

    // Case 1: Session already has user object
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

    // Case 2: Fallback if only userId stored
    if (req.session?.userId) {
      console.log("🔍 Found userId in session, fetching user from DB:", req.session.userId);
      
      const user = await User.findById(req.session.userId).select("-password");
      
      if (!user) {
        console.log("❌ User not found in DB for userId:", req.session.userId);
        return res
          .status(401)
          .json({ message: "User not found. Please login again." });
      }

      console.log("✅ User fetched from DB:", user.email);

      req.user = {
        ...user.toObject(),
        id: user._id.toString(),
      };

      return next();
    }

    // No session found
    console.log("❌ Protect: No active session found");
    console.log("Session keys:", Object.keys(req.session || {}));
    return res.status(401).json({ 
      message: "Not authenticated",
      debug: {
        hasSession: !!req.session,
        hasCookie: !!req.headers.cookie,
        sessionId: req.sessionID
      }
    });
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    console.error("Stack:", err.stack);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export const admin = (req, res, next) => {
  console.log("👑 Admin Middleware: Checking admin privileges");
  console.log("👤 User:", req.user?.email);
  console.log("🎭 Role:", req.user?.role);
  
  if (req.user && req.user.role === "admin") {
    console.log("✅ Admin access granted");
    return next();
  }
  
  console.log(`❌ Admin Access Denied for: ${req.user?.email || "Unknown"}`);
  return res
    .status(403)
    .json({ message: "Access denied: Administrator privileges required" });
};