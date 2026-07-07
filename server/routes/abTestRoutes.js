import express from "express";
import ABTest from "../models/ABTest.js";
import adminAuth from "../middleware/adminAuth.js";
import { logActivity } from "../utils/activityLogger.js";

const router = express.Router();

// ── POST /api/admin/ab-tests — Create test ──
router.post("/", adminAuth, async (req, res) => {
  try {
    const test = new ABTest({
      ...req.body,
      createdBy: req.session?.user?.id || req.user?._id,
    });
    await test.save();
    logActivity("ABTEST_CREATED", `A/B Test "${test.name}" created`, req);
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to create A/B test" });
  }
});

// ── GET /api/ab-tests/active — Fetch active running tests ──
router.get("/active", async (req, res) => {
  try {
    const activeTests = await ABTest.find({ status: "running" }).lean();
    res.json(activeTests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch active tests" });
  }
});

// ── GET /api/admin/ab-tests — List all tests ──
router.get("/", adminAuth, async (req, res) => {
  try {
    const tests = await ABTest.find().sort({ createdAt: -1 }).lean();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch A/B tests" });
  }
});

// ── GET /api/admin/ab-tests/:id — Get single test ──
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id).lean();
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch test" });
  }
});

// ── PUT /api/admin/ab-tests/:id — Update test ──
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const test = await ABTest.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to update test" });
  }
});

// ── POST /api/admin/ab-tests/:id/start — Start test ──
router.post("/:id/start", adminAuth, async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });
    test.status = "running";
    test.startedAt = new Date();
    await test.save();
    logActivity("ABTEST_STARTED", `A/B Test "${test.name}" started`, req);
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to start test" });
  }
});

// ── POST /api/admin/ab-tests/:id/stop — Stop and declare winner ──
router.post("/:id/stop", adminAuth, async (req, res) => {
  try {
    const test = await ABTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Calculate winner based on metric
    let bestIdx = 0;
    let bestScore = 0;
    test.variants.forEach((v, i) => {
      let score = 0;
      if (test.winnerMetric === "click_rate") {
        score = v.metrics.impressions > 0 ? v.metrics.clicks / v.metrics.impressions : 0;
      } else if (test.winnerMetric === "conversion_rate") {
        score = v.metrics.impressions > 0 ? v.metrics.conversions / v.metrics.impressions : 0;
      } else {
        score = v.metrics.revenue;
      }
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });

    test.variants.forEach((v, i) => { v.isWinner = i === bestIdx; });
    test.status = "completed";
    test.completedAt = new Date();

    // Simple confidence calc
    const totalImpressions = test.variants.reduce((s, v) => s + v.metrics.impressions, 0);
    test.confidence = totalImpressions > 100 ? Math.min(95, 50 + totalImpressions / 20) : Math.min(50, totalImpressions / 2);

    await test.save();
    logActivity("ABTEST_COMPLETED", `A/B Test "${test.name}" completed. Winner: ${test.variants[bestIdx].name}`, req);
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Failed to stop test" });
  }
});

// ── POST /api/ab-tests/:testId/track — Public tracking endpoint ──
router.post("/:testId/track", async (req, res) => {
  try {
    const { variantIndex, event } = req.body; // event: "impression", "click", "conversion"
    const test = await ABTest.findById(req.params.testId);
    if (!test || test.status !== "running") return res.status(404).json({ message: "Test not running" });

    const variant = test.variants[variantIndex];
    if (!variant) return res.status(400).json({ message: "Invalid variant" });

    if (event === "impression") variant.metrics.impressions++;
    else if (event === "click") variant.metrics.clicks++;
    else if (event === "conversion") variant.metrics.conversions++;

    await test.save();
    res.json({ tracked: true });
  } catch (err) {
    res.status(500).json({ message: "Tracking failed" });
  }
});

// ── DELETE /api/admin/ab-tests/:id — Delete test ──
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await ABTest.findByIdAndDelete(req.params.id);
    res.json({ message: "Test deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete test" });
  }
});

export default router;
