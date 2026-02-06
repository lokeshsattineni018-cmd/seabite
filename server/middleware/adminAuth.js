import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  try {
    // 1. Check if a session exists in MongoDB
    if (!req.session || !req.session.user) {
      console.log("⛔ Auth Failed: No session found");
      return res.status(401).json({ message: "Session expired or not found. Please login." });
    }

    // 2. Check role from session
    if (req.session.user.role !== "admin") {
      console.log(`⛔ Auth Failed: User ${req.session.user.email} is not an admin`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // 3. Sync with live Database for final confirmation
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
       return res.status(403).json({ message: "Access denied: User not authorized" });
    }

    next(); // Identity confirmed, allow access to dashboard
  } catch (err) {
    console.error("⛔ AdminAuth Error:", err.message);
    res.status(500).json({ message: "Internal server error during authorization" });
  }
};

export default adminAuth;