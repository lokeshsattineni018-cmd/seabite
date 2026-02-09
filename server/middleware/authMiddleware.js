// authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // If full user object is stored in session
    if (req.session && req.session.user && req.session.user._id) {
      req.user = req.session.user;
      return next();
    }

    // If only userId is stored in session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
      return next();
    }

    // No user in session
    return res.status(401).json({ message: "Not authenticated" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    return res.status(403).json({ message: "Not authorized as an administrator" });
  }
};
