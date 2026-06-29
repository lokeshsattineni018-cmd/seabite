import mongoose from "mongoose";

// ─── A/B Test Variant ───
const abVariantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Variant A", "Variant B"
  subject: { type: String },
  content: { type: String },
  sendRatio: { type: Number, default: 50 }, // Percentage of audience
  metrics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
  },
  isWinner: { type: Boolean, default: false }
});

// ─── Channel Content ───
const channelContentSchema = new mongoose.Schema({
  channel: { 
    type: String, 
    enum: ["email", "push", "whatsapp", "sms"],
    required: true 
  },
  subject: { type: String }, // Email subject
  title: { type: String },   // Push title
  body: { type: String, required: true },
  templateId: { type: String }, // Reference to NotificationTemplate
  imageUrl: { type: String },
  ctaText: { type: String },
  ctaUrl: { type: String },
});

// ─── Audience Segment Filter ───
const audienceFilterSchema = new mongoose.Schema({
  field: { type: String, required: true }, // e.g., "loyaltyTier", "totalOrders", "lastOrderDate"
  operator: { 
    type: String, 
    enum: ["equals", "not_equals", "gt", "gte", "lt", "lte", "contains", "in", "not_in", "between", "before", "after"],
    required: true 
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  conjunction: { type: String, enum: ["AND", "OR"], default: "AND" }
});

// ─── Main Campaign Schema ───
const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  
  type: { 
    type: String, 
    enum: ["email", "push", "whatsapp", "sms", "multi_channel", "abandoned_cart", "win_back", "welcome", "birthday"],
    required: true,
    index: true
  },
  
  status: { 
    type: String, 
    enum: ["draft", "scheduled", "running", "paused", "completed", "cancelled", "failed"],
    default: "draft",
    index: true
  },

  // ── Audience ──
  audienceType: { 
    type: String, 
    enum: ["all", "segment", "manual", "csv_import"],
    default: "all" 
  },
  audienceFilters: [audienceFilterSchema],
  audienceSegmentId: { type: String }, // Reference to saved segment
  manualRecipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  estimatedAudience: { type: Number, default: 0 },

  // ── Content (per channel) ──
  channels: [channelContentSchema],

  // ── A/B Testing ──
  isABTest: { type: Boolean, default: false },
  abVariants: [abVariantSchema],
  abWinnerMetric: { type: String, enum: ["open_rate", "click_rate", "conversion_rate"], default: "open_rate" },
  abTestDuration: { type: Number, default: 24 }, // Hours before picking winner

  // ── Scheduling ──
  scheduledAt: { type: Date },
  timezone: { type: String, default: "Asia/Kolkata" },
  isRecurring: { type: Boolean, default: false },
  recurringCron: { type: String }, // Cron expression for recurring
  lastRunAt: { type: Date },
  nextRunAt: { type: Date },

  // ── Multi-Step (Drip/Journey) ──
  isJourney: { type: Boolean, default: false },
  journeySteps: [{
    stepNumber: { type: Number },
    delayHours: { type: Number, default: 0 }, // Hours to wait before this step
    channel: { type: String, enum: ["email", "push", "whatsapp", "sms"] },
    content: { type: String },
    subject: { type: String },
    condition: { type: String }, // e.g., "not_opened_previous", "not_purchased"
    metrics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
    }
  }],

  // ── UTM Tracking ──
  utmParams: {
    source: { type: String },
    medium: { type: String },
    campaign: { type: String },
    content: { type: String },
    term: { type: String }
  },

  // ── Aggregate Metrics ──
  metrics: {
    totalSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalOpened: { type: Number, default: 0 },
    totalClicked: { type: Number, default: 0 },
    totalConverted: { type: Number, default: 0 },
    totalUnsubscribed: { type: Number, default: 0 },
    totalBounced: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }, // Revenue attributed to campaign
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
  },

  // ── Metadata ──
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tags: [{ type: String }],
  
  // ── Execution Log ──
  executionLog: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String },
    details: { type: String },
    success: { type: Boolean, default: true }
  }],

  startedAt: { type: Date },
  completedAt: { type: Date },

}, { timestamps: true });

// ── Indexes ──
campaignSchema.index({ status: 1, scheduledAt: 1 });
campaignSchema.index({ type: 1, status: 1 });
campaignSchema.index({ createdAt: -1 });

export default mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
