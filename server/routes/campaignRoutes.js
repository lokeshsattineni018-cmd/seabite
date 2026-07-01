import express from "express";
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";
import { sendBatchMarketingEmails } from "../utils/emailService.js";
import { broadcastPushNotification } from "../utils/webPush.js";
import { logActivity } from "../utils/activityLogger.js";

const router = express.Router();

// ── POST /api/campaigns — Create campaign ──
router.post("/", adminAuth, async (req, res) => {
  try {
    const campaign = new Campaign({
      ...req.body,
      createdBy: req.session?.user?.id || req.user?._id,
    });
    await campaign.save();
    logActivity("CAMPAIGN_CREATED", `Campaign "${campaign.name}" created`, req, { campaignId: campaign._id });
    res.status(201).json(campaign);
  } catch (err) {
    console.error("Create campaign error:", err);
    res.status(500).json({ message: "Failed to create campaign" });
  }
});

// ── GET /api/campaigns — List all campaigns ──
router.get("/", adminAuth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Campaign.countDocuments(filter);
    res.json({ campaigns, total });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
});

// ── GET /api/campaigns/:id — Get single campaign ──
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaign" });
  }
});

// ── PUT /api/campaigns/:id — Update draft campaign ──
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: "Failed to update campaign" });
  }
});

// ── POST /api/campaigns/:id/send — Execute campaign ──
router.post("/:id/send", adminAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Build audience query
    let userFilter = {};
    if (campaign.audienceType === "all") {
      userFilter = { role: "user" };
    } else if (campaign.audienceType === "segment") {
      // Apply audience filters
      campaign.audienceFilters.forEach(f => {
        switch (f.operator) {
          case "equals": userFilter[f.field] = f.value; break;
          case "gt": userFilter[f.field] = { $gt: f.value }; break;
          case "gte": userFilter[f.field] = { $gte: f.value }; break;
          case "lt": userFilter[f.field] = { $lt: f.value }; break;
          case "lte": userFilter[f.field] = { $lte: f.value }; break;
          case "contains": userFilter[f.field] = { $regex: f.value, $options: "i" }; break;
          case "in": userFilter[f.field] = { $in: Array.isArray(f.value) ? f.value : [f.value] }; break;
          default: break;
        }
      });
    }

    const users = await User.find(userFilter).select("name email pushSubscriptions").lean();

    let sentCount = 0;
    const emailChannel = campaign.channels.find(c => c.channel === "email");
    const pushChannel = campaign.channels.find(c => c.channel === "push");

    // Send emails
    if (emailChannel) {
      const emailUsers = users.filter(u => u.email);
      if (emailUsers.length > 0) {
        try {
          const result = await sendBatchMarketingEmails(
            emailUsers.map(u => u.email),
            emailChannel.subject || campaign.name,
            emailChannel.body
          );
          sentCount += result?.sent || emailUsers.length;
        } catch (e) {
          console.error("Email blast error:", e);
        }
      }
    }

    // Send push notifications
    if (pushChannel) {
      const pushUsers = users.filter(u => u.pushSubscriptions?.length > 0);
      for (const user of pushUsers) {
        for (const sub of user.pushSubscriptions) {
          try {
            await broadcastPushNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              pushChannel.title || campaign.name,
              pushChannel.body
            );
            sentCount++;
          } catch (e) { /* skip failed push */ }
        }
      }
    }

    // Update campaign status and metrics
    campaign.status = "completed";
    campaign.startedAt = new Date();
    campaign.completedAt = new Date();
    campaign.metrics.totalSent = sentCount;
    campaign.metrics.totalDelivered = sentCount;
    campaign.estimatedAudience = users.length;
    campaign.executionLog.push({
      action: "EXECUTED",
      details: `Sent to ${sentCount} recipients across ${campaign.channels.length} channel(s)`,
      success: true,
    });
    await campaign.save();

    logActivity("CAMPAIGN_SENT", `Campaign "${campaign.name}" sent to ${sentCount} recipients`, req, {
      campaignId: campaign._id,
      sentCount,
    });

    res.json({ message: "Campaign executed", sentCount, totalAudience: users.length });
  } catch (err) {
    console.error("Send campaign error:", err);
    res.status(500).json({ message: "Failed to execute campaign" });
  }
});

// ── DELETE /api/campaigns/:id — Delete campaign ──
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete campaign" });
  }
});

// ── GET /api/campaigns/audience/count — Preview audience count ──
router.post("/audience/count", adminAuth, async (req, res) => {
  try {
    const { audienceType, audienceFilters } = req.body;
    let filter = { role: "user" };

    if (audienceType === "segment" && audienceFilters?.length) {
      audienceFilters.forEach(f => {
        switch (f.operator) {
          case "equals": filter[f.field] = f.value; break;
          case "gt": filter[f.field] = { $gt: f.value }; break;
          case "gte": filter[f.field] = { $gte: f.value }; break;
          case "lt": filter[f.field] = { $lt: f.value }; break;
          case "contains": filter[f.field] = { $regex: f.value, $options: "i" }; break;
          case "in": filter[f.field] = { $in: Array.isArray(f.value) ? f.value : [f.value] }; break;
          default: break;
        }
      });
    }

    const count = await User.countDocuments(filter);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Failed to count audience" });
  }
});

export default router;
