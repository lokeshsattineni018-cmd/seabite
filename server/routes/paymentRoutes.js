import express from "express";
const router = express.Router();
import { checkout, paymentVerification, refundPayment, createStandardOrder, verifyStandardPayment } from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { purchaseVelocityCheck, promoFingerprintCheck } from "../middleware/fraudProtection.js";
import { refundToWallet } from "../controllers/walletController.js";

import { validate, checkoutSchema } from "../middleware/validationMiddleware.js";

// Routes for Razorpay Payment flow
router.post("/checkout", protect, validate(checkoutSchema), purchaseVelocityCheck, promoFingerprintCheck, checkout);

// Standard Razorpay Order Creation & Verification
router.post("/create-order", protect, createStandardOrder);
router.post("/verify-payment", protect, verifyStandardPayment);

// Wallet Refund
router.post("/refund-wallet", protect, admin, refundToWallet);

// Verification route
router.post("/verify", protect, paymentVerification);

// Secure Refund Route
router.put("/refund", protect, admin, refundPayment);

export default router;