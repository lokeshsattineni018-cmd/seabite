// middleware/authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // Case 1: Session already has user object
    if (req.session?.user?.id) {
      const sessUser = req.session.user;

      req.user = {
        _id: sessUser.id,
        id: sessUser.id,
        name: sessUser.name,
        email: sessUser.email,
        role: sessUser.role,
      };

      return next();
    }

    // Case 2: Fallback if only userId stored
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res
          .status(401)
          .json({ message: "User not found. Please login again." });
      }

      req.user = {
        ...user.toObject(),
        id: user._id.toString(),
      };

      return next();
    }

    // No session found
    console.log("⛔ Protect Middleware: No active session found");
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
  console.log(`⛔ Admin Access Denied for: ${req.user?.email || "Unknown"}`);
  return res
    .status(403)
    .json({ message: "Access denied: Administrator privileges required" });
};
