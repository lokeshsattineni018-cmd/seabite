import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get audit logs simulation
router.get("/audit-logs", async (req, res) => {
  res.json([
    { id: "log_1", action: "User Login", user: "Admin User", ip: "127.0.0.1", timestamp: new Date() },
    { id: "log_2", action: "Update Settings", user: "Admin User", ip: "127.0.0.1", timestamp: new Date(Date.now() - 30 * 60 * 1000) }
  ]);
});

export default router;
