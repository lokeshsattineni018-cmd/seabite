import jwt from "jsonwebtoken";
import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("⛔ AdminAuth Failed: No Token Provided");
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("⛔ AdminAuth Failed: User not found in DB");
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      console.log(`⛔ AdminAuth Failed: User ${user.email} is role '${user.role}', not 'admin'`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.log("⛔ AdminAuth Error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default adminAuth;