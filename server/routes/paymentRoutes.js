import express from "express";
const router = express.Router();
import { checkout, paymentVerification, refundPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

// Routes for Razorpay Payment flow
// 🟢 FIXED: Added 'protect' middleware here to populate req.user
router.post("/checkout", protect, checkout);

// Verification usually comes from the client after payment; 
// protect it to ensure only logged-in users can verify their own payments
router.post("/verify", protect, paymentVerification);

// Secure Refund Route
router.put("/refund", protect, refundPayment);

export default router;