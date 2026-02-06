import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  try {
    // Identity is verified strictly through the MongoDB session cookie
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: "Session expired or not found. Please login." });
    }

    if (req.session.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Final security check against current DB state
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
       return res.status(403).json({ message: "Access denied: User not authorized" });
    }

    next(); 
  } catch (err) {
    res.status(500).json({ message: "Internal server error during authorization" });
  }
};

export default adminAuth;