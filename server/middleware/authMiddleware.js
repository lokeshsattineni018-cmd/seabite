// middleware/authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const isDevMode = process.env.NODE_ENV !== "production";
  if (isDevMode) {
    console.log("🛡️ Protect Middleware: Checking authentication");
    console.log("🔑 Session exists:", !!req.session?.userId || !!req.session?.user);
  }
  
  try {
    const isMeRequest = req.originalUrl && req.originalUrl.includes("/auth/me");

    if (!req.session) {
      console.log("❌ No session object");
      if (isMeRequest) return res.status(200).json({ success: false, user: null });
      return res.status(401).json({ message: "Session not available" });
    }

    // Check manual session
    if (req.session?.user?.id) {
      if (isDevMode) console.log("✅ Session user found");
      
      const sessUser = req.session.user;
      req.user = {
        _id: sessUser.id,
        id: sessUser.id,
        name: sessUser.name,
        email: sessUser.email,
        role: sessUser.role,
      };

      if (isDevMode) console.log("✅ Protect: Authentication successful");
      return next();
    }

    // Fallback: userId only
    if (req.session?.userId) {
      if (isDevMode) console.log("🔍 Found userId, fetching from DB");
      
      const user = await User.findById(req.session.userId).select("-password");
      
      if (!user) {
        if (isDevMode) console.log("❌ User not found in DB");
        if (isMeRequest) return res.status(200).json({ success: false, user: null });
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
      if (isDevMode) console.log("🔑 Attempting session recovery from header");
      
      return new Promise((resolve) => {
        req.sessionStore.get(sessionId, async (err, session) => {
          if (err || !session || !session.user) {
            console.log("❌ Header session recovery failed:", err?.message || "No session found");
            if (isMeRequest) return resolve(res.status(200).json({ success: false, user: null }));
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
    if (isMeRequest) return res.status(200).json({ success: false, user: null });
    return res.status(401).json({ message: "Not authenticated" });
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    if (req.originalUrl && req.originalUrl.includes("/auth/me")) {
      return res.status(200).json({ success: false, user: null });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    const isWriteRequest = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
    const isSuperAdmin = !!req.user.isSuperAdmin || req.user.email?.toLowerCase().includes("lokeshsattineni018");
    if (isWriteRequest && !isSuperAdmin) {
      return res.status(403).json({ message: "Access denied: Read-only Admin role" });
    }
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admin only" });
};

export const driverAuth = (req, res, next) => {
  if (req.user && (req.user.role === "driver" || req.user.role === "admin")) {
    const isWriteRequest = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
    const isSuperAdmin = !!req.user.isSuperAdmin || req.user.email?.toLowerCase().includes("lokeshsattineni018");
    if (req.user.role === "admin" && isWriteRequest && !isSuperAdmin) {
      return res.status(403).json({ message: "Access denied: Read-only Admin role" });
    }
    return next();
  }
  return res.status(403).json({ message: "Access denied: Drivers only" });
};

export const supportAuth = (req, res, next) => {
  if (req.user && (req.user.role === "support" || req.user.role === "admin")) {
    const isWriteRequest = ["POST", "PUT", "DELETE", "PATCH"].includes(req.method);
    const isSuperAdmin = !!req.user.isSuperAdmin || req.user.email?.toLowerCase().includes("lokeshsattineni018");
    if (req.user.role === "admin" && isWriteRequest && !isSuperAdmin) {
      return res.status(403).json({ message: "Access denied: Read-only Admin role" });
    }
    return next();
  }
  return res.status(403).json({ message: "Access denied: Support only" });
};