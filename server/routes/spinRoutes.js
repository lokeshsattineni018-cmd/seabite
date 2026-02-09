import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

function generateCode(prefix) {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

router.post("/spin", async (req, res) => {
  try {
    // ✅ Identify user strictly via session
    const userEmail = req.session?.user?.email;
    if (!userEmail)
      return res
        .status(401)
        .json({ error: "Please login first to spin!" });

    // ❌ REMOVE this block for unlimited spins:
    // const existing = await Coupon.findOne({ userEmail: userEmail.toLowerCase(), isSpinCoupon: true });
    // if (existing) return res.status(403).json({ error: "One spin per account only!" });

    const rand = Math.random() * 100;
    let outcome;

    if (rand < 20) outcome = { type: "NO_PRIZE" };
    else if (rand < 40) outcome = { type: "NO_PRIZE" };
    else if (rand < 60) outcome = { type: "PERCENT", value: 5, prefix: "SB5" };
    else if (rand < 80) outcome = { type: "PERCENT", value: 10, prefix: "SB10" };
    else if (rand < 95) outcome = { type: "PERCENT", value: 20, prefix: "SB20" };
    else outcome = { type: "PERCENT", value: 50, prefix: "SB50" };

    if (outcome.type === "NO_PRIZE")
      return res.json({
        result: "BETTER_LUCK",
        message: "Better luck next time!",
      });

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
      discountType: "percent",
      value: outcome.value,
      userEmail: userEmail.toLowerCase(),
      isSpinCoupon: true,
      maxUses: 1,
      expiresAt,
      isActive: true,
    });

    return res.json({
      result: "COUPON",
      discountValue: outcome.value,
      code: coupon.code,
      expiresAt: coupon.expiresAt,
    });
  } catch (err) {
    console.error("❌ Spin Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
