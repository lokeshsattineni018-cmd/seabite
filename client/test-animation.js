import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to local site...");
  await page.goto("http://localhost:5173/");

  // Wait for products to load and click on the first product
  console.log("Waiting for products...");
  await page.waitForSelector("a[href^='/products/']");
  
  const productLink = await page.$("a[href^='/products/']");
  if (productLink) {
    console.log("Clicking product link...");
    await productLink.click();
    
    console.log("Waiting for Product Details page to load...");
    await page.waitForSelector(".add-btn", { timeout: 10000 });
    
    console.log("Clicking Add to Cart...");
    await page.click(".add-btn");
    
    console.log("Waiting 2 seconds to observe animation...");
    await page.waitForTimeout(2000);
    
    console.log("Done.");
  } else {
    console.log("No product links found.");
  }
  
  await browser.close();
})();
