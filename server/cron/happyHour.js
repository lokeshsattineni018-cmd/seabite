import cron from 'node-cron';
import Product from '../models/Product.js';

/**
 * 🐟 Automated Clearance Pricing (Evening Catch)
 * Runs at 7:00 PM every day
 * If stock is high, applies a 15% discount to clear inventory
 */
const happyHourCron = cron.schedule('0 19 * * *', async () => {
  console.log('🌅 Starting "Evening Catch" Automated Clearance...');
  
  try {
    // Find products with high stock (> 5kg) to clear before end of day
    const productsToClear = await Product.find({
      countInStock: { $gt: 5 },
      active: true
    });

    for (const product of productsToClear) {
      // Apply 15% discount
      const clearancePrice = Math.round(product.basePrice * 0.85);
      
      product.flashSale = {
        discountPrice: clearancePrice,
        isFlashSale: true,
        saleEndDate: new Date(new Date().setHours(23, 59, 59)) // Ends at midnight
      };
      
      await product.save();
    }

    console.log(`✅ Applied Evening Catch discounts to ${productsToClear.length} products.`);
  } catch (error) {
    console.error('❌ Happy Hour Cron Error:', error);
  }
});

export default happyHourCron;
