// middleware/authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  console.log("🛡️ Protect Middleware: Checking authentication");
  
  try {
    // 1. Check Passport's built-in authentication method
    // This is the most reliable check for Passport-based sessions
    if (req.isAuthenticated && req.isAuthenticated()) {
      console.log("✅ Passport: User is authenticated", req.user?.email);
      return next();
    }

    // 2. Fallback: Manual session check (for manual login/register)
    if (req.session?.user?.id) {
      console.log("✅ Manual Session found:", req.session.user.email);
      
      const sessUser = req.session.user;
      // Re-populate req.user so controllers can use it
      req.user = {
        _id: sessUser.id,
        id: sessUser.id,
        name: sessUser.name,
        email: sessUser.email,
        role: sessUser.role,
      };
      return next();
    }

    // 3. Last Resort: Database check if only a ID is lingering
    const userId = req.session?.passport?.user || req.session?.userId;
    if (userId) {
      console.log("🔍 Fetching user from DB for ID:", userId);
      const user = await User.findById(userId).select("-password");
      
      if (user) {
        req.user = user;
        console.log("✅ Auth successful after DB fetch");
        return next();
      }
    }

    // No session found
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