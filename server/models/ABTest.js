import mongoose from "mongoose";

const abTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ["banner", "product_card", "cta_button", "pricing_display", "page_layout"],
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "running", "paused", "completed"],
    default: "draft",
  },
  variants: [{
    name: { type: String, required: true }, // "Variant A", "Variant B"
    content: { type: mongoose.Schema.Types.Mixed }, // Flexible content (text, imageUrl, config)
    trafficRatio: { type: Number, default: 50 }, // Percentage of traffic
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    isWinner: { type: Boolean, default: false },
  }],
  winnerMetric: {
    type: String,
    enum: ["click_rate", "conversion_rate", "revenue"],
    default: "click_rate",
  },
  confidence: { type: Number, default: 0 }, // Statistical significance %
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

abTestSchema.index({ status: 1 });
abTestSchema.index({ createdAt: -1 });

export default mongoose.models.ABTest || mongoose.model("ABTest", abTestSchema);
