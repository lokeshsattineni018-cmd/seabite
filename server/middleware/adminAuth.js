import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
  try {
    // 1. Check if a session exists in MongoDB
    if (!req.session || !req.session.user) {
      // ✅ Header-based session recovery (Mobile/Cross-Origin fallback)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const sessionId = authHeader.split(" ")[1];
        console.log("🔑 [Admin] Attempting session recovery from header SID:", sessionId);
        
        return new Promise((resolve) => {
          req.sessionStore.get(sessionId, async (err, session) => {
            if (!err && session && session.user && session.user.role === "admin") {
              console.log("✅ [Admin] Header session recovered for:", session.user.email);
              req.user = await User.findById(session.user.id);
              return resolve(next());
            }
            console.warn(`🚨 [INTRUSION DETECTED] Unauthorized Admin Access Attempt (Header Fallback Failed)`);
            resolve(res.status(401).json({ message: "Session expired or not found. Please login." }));
          });
        });
      }

      console.warn(`🚨 [INTRUSION DETECTED] Unauthorized Admin Access Attempt`);
      console.warn(`   IP: ${req.ip} | User-Agent: ${req.get('User-Agent')}`);
      return res.status(401).json({ message: "Session expired or not found. Please login." });
    }

    // 2. Check role from session
    if (req.session.user.role !== "admin") {
      console.warn(`🚨 [INTRUSION DETECTED] Non-Admin attempted Admin Access`);
      console.warn(`   User: ${req.session.user.email} | IP: ${req.ip}`);
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // 3. Sync with live Database for final confirmation
    const user = await User.findById(req.session.user.id);
    if (!user || user.role !== "admin") {
      console.error(`🚨 [CRITICAL] Admin Role Revoked detected for ${req.session.user.email}`);
      return res.status(403).json({ message: "Access denied: User not authorized" });
    }

    // 🔒 ACCESS SENTINEL: Check for Brute-Force Lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      console.warn(`🛡️ [ACCESS SENTINEL] Locked Admin attempted access: ${user.email}`);
      return res.status(403).json({
        message: "Account is temporarily locked due to security protocols. Please wait 15 minutes.",
        isLocked: true,
        lockUntil: user.lockUntil
      });
    }

    req.user = user; // 🟢 Attach user to request for routes to use
    next(); // Identity confirmed, allow access to dashboard
  } catch (err) {
    console.error("⛔ AdminAuth Error:", err.message);
    res.status(500).json({ message: "Internal server error during authorization" });
  }
};

export default adminAuth;