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

    // ✅ Header-based session recovery (Mobile/Cross-Origin fallback)
    const authHeader = req.headers.authorization;
    if (!req.session?.user && authHeader && authHeader.startsWith("Bearer ")) {
      const sessionId = authHeader.split(" ")[1];
      console.log("🔑 Attempting session recovery from header SID:", sessionId);
      
      return new Promise((resolve) => {
        req.sessionStore.get(sessionId, async (err, session) => {
          if (err || !session || !session.user) {
            console.log("❌ Header session recovery failed:", err?.message || "No session found");
            return resolve(res.status(401).json({ message: "Invalid or expired session token" }));
          }

          console.log("✅ Header session recovered for:", session.user.email);
          req.user = {
            _id: session.user.id,
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role
          };
          resolve(next());
        });
      });
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