// authMiddleware.js
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // Case 1: session.login stored a compact user object
    if (req.session && req.session.user && req.session.user.id) {
      const sessUser = req.session.user;

      req.user = {
        _id: sessUser.id,
        id: sessUser.id,          // ensure id is always present
        name: sessUser.name,
        email: sessUser.email,
        role: sessUser.role,
      };

      return next();
    }

    // Case 2: only userId stored in session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        ...user.toObject(),
        id: user._id.toString(),  // normalize to id
      };

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
    return res
      .status(403)
      .json({ message: "Not authorized as an administrator" });
  }
};
