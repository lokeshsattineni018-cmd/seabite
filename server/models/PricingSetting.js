import mongoose from "mongoose";

const pricingSettingSchema = new mongoose.Schema({
  aiEnabled: { type: Boolean, default: true },
  stormOverride: { type: Boolean, default: false },
  marginOffset: { type: Number, default: 15 },
  competitorMatch: { type: Boolean, default: false },
  demandDensity: { type: Boolean, default: false },
  marketSurgeIndex: { type: Number, default: 1.0 }
}, { timestamps: true });

// Ensure a single setting document helper
pricingSettingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      aiEnabled: true,
      stormOverride: false,
      marginOffset: 15,
      competitorMatch: false,
      demandDensity: false,
      marketSurgeIndex: 1.0
    });
  }
  return settings;
};

export default mongoose.models.PricingSetting || mongoose.model("PricingSetting", pricingSettingSchema);
