// routes/spinRoutes.js
import express from "express";
import Coupon from "../models/Coupon.js"; // your Mongo model

const router = express.Router();

function generateCode(prefix) {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

// 6‑outcome wheel with weighted chances
router.post("/spin", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // probabilities in %
    const rand = Math.random() * 100;
    let outcome;

    if (rand < 20) outcome = { type: "NO_PRIZE" };              // Better luck 1
    else if (rand < 40) outcome = { type: "NO_PRIZE" };         // Better luck 2
    else if (rand < 60) outcome = { type: "PERCENT", value: 5, prefix: "SB5" };
    else if (rand < 80) outcome = { type: "PERCENT", value: 10, prefix: "SB10" };
    else if (rand < 95) outcome = { type: "PERCENT", value: 20, prefix: "SB20" };
    else outcome = { type: "PERCENT", value: 50, prefix: "SB50" }; // 5%

    if (outcome.type === "NO_PRIZE") {
      return res.json({ result: "BETTER_LUCK", message: "Better luck next time!" });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    let code;
    let exists = true;
    while (exists) {
      code = generateCode(outcome.prefix);
      exists = await Coupon.findOne({ code });
    }

    const coupon = await Coupon.create({
      code,
      discountType: "PERCENT",
      discountValue: outcome.value,
      maxDiscountAmount: outcome.value === 50 ? 500 : undefined,
      email,
      maxUses: 1,
      isSpinCoupon: true,
      expiresAt,
    });

    return res.json({
      result: "COUPON",
      discountValue: outcome.value,
      code: coupon.code,
      expiresAt: coupon.expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
