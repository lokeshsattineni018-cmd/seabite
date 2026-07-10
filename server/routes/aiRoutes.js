import express from "express";
import aiInsights from "./ai/aiInsights.js";
import aiGeneration from "./ai/aiGeneration.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Apply admin protection to all AI intelligence routes
router.use(adminAuth);

router.use("/", aiInsights);
router.use("/", aiGeneration);

export default router;
