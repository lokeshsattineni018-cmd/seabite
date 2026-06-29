import express from "express";

const router = express.Router();

router.get("/metrics", async (req, res) => {
  res.json({
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: 0.15
  });
});

export default router;
