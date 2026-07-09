import express from "express";
import supportTicket from "./support/supportTicket.js";
import supportStats from "./support/supportStats.js";

const router = express.Router();

router.use("/", supportTicket);
router.use("/", supportStats);

export default router;
