import express from "express";
import aiInsights from "./ai/aiInsights.js";
import aiGeneration from "./ai/aiGeneration.js";

const router = express.Router();

router.use("/", aiInsights);
router.use("/", aiGeneration);

export default router;
