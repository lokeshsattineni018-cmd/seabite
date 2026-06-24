import express from "express";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import Razorpay from "razorpay";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const PLANS = {
  monthly: { amount: 14900, label: "Monthly", durationDays: 30 }, // ₹149 in paise
  yearly:  { amount: 99900, label: "Yearly",  durationDays: 365 }, // ₹999 in paise
};

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET current user's prime status
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("isPrime primeExpiry primePlan");
    const subscription = await Subscription.findOne({ user: req.user._id, status: "active" });
    res.json({
      isPrime: user.isPrime && user.primeExpiry && new Date(user.primeExpiry) > new Date(),
      primeExpiry: user.primeExpiry,
      primePlan: user.primePlan,
      subscription,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE Razorpay order for Prime subscription
router.post("/create", protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: "Invalid plan" });

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: "INR",
      receipt: `prime_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), plan },
    });

    res.json({ orderId: order.id, amount: PLANS[plan].amount, plan });
  } catch (err) {
    console.error("Prime Order Error:", err);
    res.status(500).json({ message: "Failed to create payment" });
  }
});

// VERIFY payment and activate Prime
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    // Signature verification
    const crypto = await import("crypto");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.default
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const planInfo = PLANS[plan];
    const now = new Date();
    const endDate = new Date(now.getTime() + planInfo.durationDays * 24 * 60 * 60 * 1000);

    // Create subscription record
    await Subscription.create({
      user: req.user._id,
      plan,
      status: "active",
      startDate: now,
      endDate,
      amount: planInfo.amount / 100,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    // Update user prime status
    await User.findByIdAndUpdate(req.user._id, {
      isPrime: true,
      primeExpiry: endDate,
      primePlan: plan,
    });

    res.json({ success: true, message: "🎉 Welcome to SeaBite Prime!", expiresAt: endDate });
  } catch (err) {
    console.error("Prime Verify Error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// CANCEL Prime (admin or self)
router.post("/cancel", protect, async (req, res) => {
  try {
    await Subscription.findOneAndUpdate(
      { user: req.user._id, status: "active" },
      { status: "cancelled" }
    );
    // Keep prime until expiry, don't revoke early
    res.json({ message: "Prime cancelled. Benefits remain until expiry." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
