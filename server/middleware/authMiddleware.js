import User from "../models/User.js";

/**
 * @desc Verifies if the user has an active MongoDB session
 */
export const protect = async (req, res, next) => {
  try {
    // ✅ Case 1: Session contains the compact user object (Google/Standard Login)
    if (req.session?.user?.id) {
      const sessUser = req.session.user;

      req.user = {
        _id: sessUser.id,
        id: sessUser.id,          // Normalize for frontend consistency
        name: sessUser.name,
        email: sessUser.email,
        role: sessUser.role,
      };

      return next();
    }

    // ✅ Case 2: Fallback if only userId is stored in the session
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found. Please login again." });
      }

      req.user = {
        ...user.toObject(),
        id: user._id.toString(),
      };

      return next();
    }

    // ⛔ No session found: This is what causes the redirect loop
    console.log("⛔ Protect Middleware: No active session found");
    return res.status(401).json({ message: "Not authenticated. Please login." });

  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

/**
 * @desc Restricts access to Admin roles only
 */
export const admin = (req, res, next) => {
  // Uses the role populated in the protect middleware
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    console.log(`⛔ Admin Access Denied for: ${req.user?.email || "Unknown"}`);
    return res
      .status(403)
      .json({ message: "Access denied: Administrator privileges required" });
  }
};