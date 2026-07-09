import express from "express";
import deliveryAdmin from "./delivery/deliveryAdmin.js";
import deliveryDriver from "./delivery/deliveryDriver.js";

const router = express.Router();

router.use("/", deliveryAdmin);
router.use("/", deliveryDriver);

export default router;
