import express from "express";
import adminAnalytics from "./admin/adminAnalytics.js";
import adminOperations from "./admin/adminOperations.js";
import adminUsers from "./admin/adminUsers.js";

const router = express.Router();

router.use("/", adminAnalytics);
router.use("/", adminOperations);
router.use("/", adminUsers);

export default router;