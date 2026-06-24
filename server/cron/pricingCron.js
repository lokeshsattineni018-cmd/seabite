import cron from "node-cron";
import Product from "../models/Product.js";

// Run every hour (and can be triggered on command) to check inventory scaling
export const initPricingCron = () => {
  // Check hourly
  const job = cron.schedule("0 * * * *", async () => {
    await runPricingScaling();
  });
  job.start();
  console.log("🚀 Algorithmic Pricing cron scheduler initialized");
};

export const runPricingScaling = async () => {
  console.log("⏰ RUNNING ALGORITHMIC PRICING DENSITY TRIGGER RUN...");
  try {
    // Find active flash sale products with algorithmic scaling enabled
    const products = await Product.find({
      algorithmicScaling: true,
      "flashSale.isFlashSale": true,
      "flashSale.saleEndDate": { $gt: new Date() }
    });

    for (const product of products) {
      const rule = product.scalingRule;
      if (!rule || !rule.minStockThreshold || !rule.discountIncreasePct) continue;

      // If inventory is higher than threshold, escalate discount
      if (product.countInStock > rule.minStockThreshold) {
        const currentDiscountPrice = product.flashSale.discountPrice || product.basePrice;
        const currentDiscountPct = product.basePrice > 0 
          ? ((product.basePrice - currentDiscountPrice) / product.basePrice) * 100 
          : 0;
        
        const newDiscountPct = Math.min(rule.maxDiscountPct || 50, currentDiscountPct + rule.discountIncreasePct);
        const newDiscountPrice = Math.round(product.basePrice * (1 - newDiscountPct / 100));

        if (newDiscountPrice < currentDiscountPrice) {
          product.flashSale.discountPrice = newDiscountPrice;
          await product.save();
          console.log(`📈 Scaled discount for ${product.name}: ${currentDiscountPct.toFixed(0)}% -> ${newDiscountPct.toFixed(0)}% (Price: ₹${newDiscountPrice})`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Algorithmic Pricing Cron Run Error:", err);
  }
};

export default { initPricingCron, runPricingScaling };
