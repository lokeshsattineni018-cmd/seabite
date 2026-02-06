import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  try {
    // ✅ SESSION CHECK: Identity is now in req.session, not headers
    if (!req.session || !req.session.user) {
      console.log("⛔ AdminAuth Failed: No Active Session in MongoDB");
      return res.status(401).json({ message: "Session expired or not found. Please login." });
    }

    // ✅ ROLE VERIFICATION: Pull the role directly from the session
    if (req.session.user.role !== "admin") {
      console.log(`⛔ AdminAuth Failed: User ${req.session.user.email} is not an admin`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // Optional: Double-check database if you want extra security
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
       return res.status(403).json({ message: "Access denied: User not authorized" });
    }

    next(); // Identity and Role confirmed, proceed to Dashboard
  } catch (err) {
    console.log("⛔ AdminAuth System Error:", err.message);
    res.status(500).json({ message: "Internal server error during authorization" });
  }
};

export default adminAuth;