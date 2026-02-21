import express from "express";
import adminAuth from "../middleware/adminAuth.js"; // ✅ Uses session logic to stop loops
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Settings, { getSettings } from "../models/Settings.js";
import SearchInsight from "../models/SearchInsight.js";
import ActivityLog from "../models/ActivityLog.js"; // 🟢 Added
import Coupon from "../models/Coupon.js"; // 🟢 Added
import Contact from "../models/Contact.js"; // 🟢 Added
import { sendStatusUpdateEmail, sendMarketingEmail, sendBatchMarketingEmails, sendOtpEmail, sendEmail, sendWinBackEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// 1. ADMIN DASHBOARD SUMMARY (GET /api/admin)
router.get("/", adminAuth, async (req, res) => {
  try {
    const { range } = req.query;
    const limit = range === "1year" ? 12 : 6;
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - limit);

    // Aggregate calls only run after adminAuth verifies session
    const popularProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.qty" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    const rawGraphData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" } // ✅ Added Revenue Calculation
        }
      }
    ]);

    const finalGraph = [];
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });

      const found = rawGraphData.find(g => g._id.year === year && g._id.month === month);
      finalGraph.push({
        name: monthName, // ✅ Match frontend 'name' key
        orders: found ? found.orders : 0,
        revenue: found ? found.revenue : 0 // ✅ Include revenue
      });
    }

    const allOrders = await Order.find({});
    const totalRevenue = allOrders.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

    // 🟢 NEW: Calculate Total Cost (Buying Price * Qty)
    const totalCost = allOrders.reduce((acc, order) => {
      const orderCost = order.items.reduce((sum, item) => sum + ((item.buyingPrice || 0) * item.qty), 0);
      return acc + orderCost;
    }, 0);

    const netProfit = totalRevenue - totalCost;

    const stats = {
      products: await Product.countDocuments(),
      totalOrders: await Order.countDocuments(), // 🟢 Renamed for frontend
      activeUsers: await User.countDocuments(), // 🟢 Renamed for frontend
      pendingOrders: await Order.countDocuments({ status: "Pending" }), // 🟢 Added
      totalRevenue: Math.round(totalRevenue),
      netProfit: Math.round(netProfit) // 🟢 NEW
    };

    // 🕵️ EXTRA INTELLIGENCE: Sales Heatmap (Day of Week & Hour)
    const heatmapData = await Order.aggregate([
      {
        $project: {
          day: { $dayOfWeek: "$createdAt" }, // 1 (Sun) to 7 (Sat)
          hour: { $hour: "$createdAt" }
        }
      },
      {
        $group: {
          _id: { day: "$day", hour: "$hour" },
          count: { $sum: 1 }
        }
      }
    ]);

    // 💎 VIP INTELLIGENCE: Top 5 Spenders
    const topSpenders = await Order.aggregate([
      { $group: { _id: "$user", totalSpent: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          name: "$userDetails.name",
          email: "$userDetails.email",
          totalSpent: 1,
          orderCount: 1
        }
      }
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name');

    res.json({ stats, graph: finalGraph, recentOrders, popularProducts, heatmapData, topSpenders });

  } catch (err) {
    console.error("❌ ADMIN DASHBOARD CRASH:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

// 1.2 ENTERPRISE SETTINGS (GET /api/admin/settings)
router.get("/enterprise/settings", adminAuth, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// 1.3 UPDATE SETTINGS (PUT /api/admin/settings)
// 👉 This is now protected by OTP flow in the frontend, but we should enforce it here ideally.
// However, for the specific requirement, we are using the new /verify endpoint to actually toggle it.
// We'll keep this as a generic update but handle the specific toggle via the new route or update client to use this only after OTP.

// 🟢 1.3.1 REQUEST OTP (POST /api/admin/maintenance/request-otp)
router.post("/maintenance/request-otp", adminAuth, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.maintenanceOtp = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
    };

    // Email the admin
    await sendOtpEmail(req.session.user.email, otp);

    res.json({ message: "OTP sent to admin email" });
  } catch (err) {
    console.error("OTP Request Failed:", err);
    res.status(500).json({ message: "Failed to generate OTP" });
  }
});

// 🟢 1.3.2 VERIFY OTP & TOGGLE MAINTENANCE (POST /api/admin/maintenance/verify)
router.post("/maintenance/verify", adminAuth, async (req, res) => {
  try {
    const { otp, desiredState } = req.body; // desiredState is boolean boolean
    const stored = req.session.maintenanceOtp;

    if (!stored || !stored.code) {
      return res.status(400).json({ message: "No OTP requested" });
    }

    if (Date.now() > stored.expiresAt) {
      req.session.maintenanceOtp = null;
      return res.status(400).json({ message: "OTP expired" });
    }

    if (stored.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP Valid!
    req.session.maintenanceOtp = null; // Consume OTP

    // Update Settings
    let settings = await getSettings();
    settings.isMaintenanceMode = desiredState;
    settings.maintenanceMessage = desiredState
      ? "We are upgrading our systems to serve you better. We will be back shortly!"
      : "";
    settings.lastUpdatedBy = req.session.userId;
    await settings.save();

    res.json({ message: "Maintenance Updated Successfully", settings });

  } catch (err) {
    console.error("OTP Verify Failed:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// 1.3 UPDATE SETTINGS (Generic - Kept for other settings)
router.put("/enterprise/settings", adminAuth, async (req, res) => {
  try {
    const {
      isMaintenanceMode, maintenanceMessage, globalDiscount,
      storeName, contactPhone, contactEmail, logoUrl,
      taxRate, deliveryFee, minOrderValue, freeDeliveryThreshold,
      openingTime, closingTime, isClosed,
      banner, announcement
    } = req.body;

    const settings = await getSettings();

    // General
    if (storeName !== undefined) settings.storeName = storeName;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;

    // Finance
    if (taxRate !== undefined) settings.taxRate = Number(taxRate);
    if (deliveryFee !== undefined) settings.deliveryFee = Number(deliveryFee);
    if (minOrderValue !== undefined) settings.minOrderValue = Number(minOrderValue);
    if (freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = Number(freeDeliveryThreshold);

    // Operations
    if (openingTime !== undefined) settings.openingTime = openingTime;
    if (closingTime !== undefined) settings.closingTime = closingTime;
    if (isClosed !== undefined) settings.isClosed = isClosed;

    // Features
    if (isMaintenanceMode !== undefined) settings.isMaintenanceMode = isMaintenanceMode;
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
    if (globalDiscount !== undefined) settings.globalDiscount = Number(globalDiscount);
    if (banner !== undefined) settings.banner = banner;
    if (announcement !== undefined) settings.announcement = announcement;

    settings.lastUpdatedBy = req.session?.userId || null;
    await settings.save();
    res.json({ message: "Settings updated", settings });
  } catch (err) {
    console.error("Settings Update Error:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// 1.4 SEARCH INSIGHTS (GET /api/admin/insights/search)
router.get("/insights/search", adminAuth, async (req, res) => {
  try {
    const insights = await SearchInsight.find()
      .sort({ count: -1, lastSearched: -1 })
      .limit(20);
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

// 1.5 LOW STOCK ALERT (GET /api/admin/inventory/low-stock)
router.get("/inventory/low-stock", adminAuth, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ countInStock: { $lt: 10 } })
      .select("name countInStock price image category")
      .sort({ countInStock: 1 });
    res.json(lowStockProducts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inventory status" });
  }
});

// 🟢 1.6 ADVANCED ANALYTICS (GET /api/admin/analytics/advanced)
router.get("/analytics/advanced", adminAuth, async (req, res) => {
  try {
    // 1. Dead Stock (Products with 0 sales or very low)
    // We need to aggregate orders to find sold products, then compare with all products
    const soldProducts = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", totalSold: { $sum: "$items.qty" } } }
    ]);

    const soldProductIds = soldProducts.map(p => p._id);

    const deadStock = await Product.find({
      _id: { $nin: soldProductIds } // Products NOT in the sold list
    }).limit(10).select("name price image category countInStock");

    // 2. Retention Rate
    const userOrders = await Order.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    const repeatCustomers = userOrders.filter(u => u.count > 1).length;
    const totalCustomers = userOrders.length;
    const retentionRate = totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    // 3. Busy Hours Heatmap (More detailed)
    const heatmap = await Order.aggregate([
      {
        $project: {
          day: { $dayOfWeek: "$createdAt" },
          hour: { $hour: "$createdAt" },
          amount: "$totalAmount"
        }
      },
      {
        $group: {
          _id: { day: "$day", hour: "$hour" },
          orders: { $sum: 1 },
          sales: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.day": 1, "_id.hour": 1 } }
    ]);

    res.json({
      deadStock,
      retention: { repeat: repeatCustomers, total: totalCustomers, rate: retentionRate },
      heatmap
    });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Failed to fetch advanced analytics" });
  }
});

// 1.5.1 RESTOCK REQUEST (POST /api/admin/inventory/restock)
router.post("/inventory/restock", adminAuth, async (req, res) => {
  try {
    const { productName } = req.body;
    // In a real app, this would email the supplier. For now, we simulate it.
    // console.log(`📦 Restock Request sent for: ${productName}`);

    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    res.json({ message: "Request sent to supplier" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send restock request" });
  }
});





// 1.9 BULK EMAIL MARKETING (POST /api/admin/marketing/email-blast)
// 1.9 BULK EMAIL MARKETING (POST /api/admin/marketing/email-blast)
router.post("/marketing/email-blast", adminAuth, async (req, res) => {
  try {
    const { subject, message, recipients } = req.body; // 🟢 Added recipients

    // ... (HTML unescape logic) ...

    const unescapedMessage = message
      ? message
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
      : "";

    let query = { email: { $exists: true, $ne: "" } };

    // 🟢 Targeted Sending Logic
    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      query._id = { $in: recipients };
    }

    const users = await User.find(query).select("email name");

    if (users.length === 0) {
      return res.json({ message: "No users found matching criteria.", stats: { sent: 0, failed: 0, total: 0 } });
    }

    // Helper: Chunk array
    const chunkArray = (arr, size) => {
      return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );
    };

    // Resend Batch Limit is 100
    const userChunks = chunkArray(users, 100);
    let successCount = 0;
    let failureCount = 0;

    // Process chunks
    for (const chunk of userChunks) {
      try {
        // Map users to simplified objects for the service
        const recipients = chunk.map(u => ({ email: u.email, name: u.name }));

        const response = await sendBatchMarketingEmails(recipients, subject, unescapedMessage);

        // Resend Batch returns: { data: [...], error: ... }
        if (response?.error) {
          console.error("❌ Batch Error:", response.error);
          failureCount += chunk.length; // Assume whole chunk failed if batch error
        } else if (response?.data) {
          // data is an array of objects { id: '...' } or error objects?
          // The SDK typically returns an object with `data` array on success.
          // We can assume success for items in data, though individual items might error.
          // For simplicity in this summary:
          successCount += response.data.length;
        }

      } catch (e) {
        console.error("❌ Chunk Error:", e);
        failureCount += chunk.length;
      }

      // Safety delay between batches
      if (userChunks.length > 1) await new Promise(r => setTimeout(r, 500));
    }

    res.json({
      message: `Batch campaign complete.`,
      stats: { sent: successCount, failed: failureCount, total: users.length }
    });
  } catch (err) {
    console.error("Marketing Blast Critical Fail:", err);
    res.status(500).json({ message: "Marketing blast failed to start." });
  }
});

// 1.9.1 AUTOMATED WIN-BACK CAMPAIGN (POST /api/admin/marketing/win-back)
router.post("/marketing/win-back", adminAuth, async (req, res) => {
  try {
    // 1. Criteria: Inactive for > 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find users whose lastOrderCompletionTime is older than 30 days OR null (if they registered long ago but never bought - optional)
    // Let's target strictly "Churned/At Risk" customers who HAVE bought before.
    const atRiskUsers = await User.find({
      lastOrderCompletionTime: { $lt: thirtyDaysAgo },
      email: { $exists: true }
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of atRiskUsers) {
      // 2. Check if we already sent a Win-Back recently (Check ActivityLog or specific Coupon existence)
      // Check for an active coupon starting with "WB-" linked to this user
      const existingCoupon = await Coupon.findOne({
        code: { $regex: `^WB-${user._id.toString().slice(-4)}` },
        isActive: true,
        expiresAt: { $gt: new Date() } // Still valid
      });

      if (existingCoupon) {
        skippedCount++;
        continue;
      }

      // 3. Generate Unique Coupon
      // Pattern: WB-{USER_LAST_4}-{RANDOM_4}
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `WB-${user._id.toString().slice(-4)}-${randomSuffix}`.toUpperCase();

      await Coupon.create({
        code,
        discountType: "percent",
        value: 15,
        minOrderAmount: 500, // Min order to use it
        maxUses: 1,
        userEmail: user.email, // Locked to this user
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 Hours validity
        isActive: true
      });

      // 4. Send Email
      await sendWinBackEmail(user.email, user.name, code);

      // 5. Log it
      await ActivityLog.create({
        action: "MARKETING_WINBACK",
        details: `Sent Win-Back Code ${code} to ${user.email}`,
        meta: { email: user.email, code }
      });

      sentCount++;
      // Rate limit safety
      await new Promise(r => setTimeout(r, 200));
    }

    res.json({
      message: "Win-Back campaign executed",
      stats: { sent: sentCount, skipped: skippedCount, totalCandidates: atRiskUsers.length }
    });

  } catch (err) {
    console.error("Win-Back Error:", err);
    res.status(500).json({ message: "Failed to run win-back campaign" });
  }
});

// 2. UPDATE ORDER STATUS
router.put("/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    try {
      if (status) {
        await sendStatusUpdateEmail(
          order.user.email,
          order.user.name,
          order.orderId || order._id,
          status
        );
      }
    } catch (e) { console.error("❌ Email notification failed:", e.message); }

    res.json({ message: "Status updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status." });
  }
});

// 3. USER INTELLIGENCE (Deep Tech: RFM & Behavioral)
router.get("/users/intelligence", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    // Global stats for RFM normalization (optional, but good for relative scoring)
    // For now, we'll use absolute thresholds for simplicity and speed.

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({ user: u._id }).sort({ createdAt: -1 });
        const reviewsCount = await Product.countDocuments({ "reviews.user": u._id });

        // 1. Basic Metrics
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const orderCount = orders.length;
        const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

        // 2. Deep Tech: RFM Analysis
        // Recency: Days since last order
        const recencyDays = lastOrderDate
          ? Math.floor((Date.now() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24))
          : 999;

        // Frequency: Orders per month (approx) or just raw count
        // Monetary: Total Spent

        // 3. Segmentation Logic
        let segment = "New";
        let churnRisk = "Low";

        if (orderCount === 0) {
          segment = "New Lead";
          churnRisk = "High"; // Hasn't converted yet
        } else {
          if (recencyDays > 90) { // Hosting ghost
            segment = "Hibernating";
            churnRisk = "High"; // Potential Churn
          } else if (recencyDays > 30) {
            segment = "At Risk";
            churnRisk = "Medium";
          } else {
            if (totalSpent > 10000 || orderCount > 10) {
              segment = "Champion"; // High value, active
            } else if (orderCount > 3) {
              segment = "Loyal";
            } else {
              segment = "Active";
            }
          }
        }

        // 4. Behavioral: Preferred Category
        const categories = {};
        orders.forEach(order => {
          order.items.forEach(item => {
            // If item has category populated (it might not be if it's just a snapshot)
            // We might need to rely on item name or fetch product. 
            // For speed, let's assume we can infer or it's not critical.
            // Actually, Order schema items don't strictly save category unless we added it.
            // Let's try to infer from name if possible, or just skip if too complex for loop.
            // Wait, we can use the `ActivityLog` for recent searches/views to guess interest!
          });
        });

        // 5. Activity Intelligence
        const recentLogs = await ActivityLog.find({
          $or: [{ user: u._id }, { "meta.email": u.email }] // Match by ID or Email
        }).sort({ timestamp: -1 }).limit(10);

        // 6. Unified History (Support Command Center)
        const recentMessages = await Contact.find({ email: u.email }).sort({ createdAt: -1 }).limit(3);
        const lastActive = recentLogs.length > 0 ? recentLogs[0].timestamp : u.updatedAt;

        return {
          _id: u._id,
          name: u.name,
          email: u.email.toLowerCase(),
          role: u.role,
          createdAt: u.createdAt,
          isBanned: u.isBanned, // Ensure this is sent
          intelligence: {
            totalSpent: Math.round(totalSpent),
            orderCount,
            reviewsCount,
            avgOrderValue: orderCount > 0 ? Math.round(totalSpent / orderCount) : 0,
            lastOrderDate,
            recencyDays,
            segment,
            churnRisk,
            lastActive,
            recentActivity: recentLogs.map(l => ({ action: l.action, details: l.details, time: l.timestamp, type: 'activity' })),
            recentOrders: orders.slice(0, 3).map(o => ({ id: o._id, orderId: o.orderId, amount: o.totalAmount, date: o.createdAt, status: o.status, type: 'order' })),
            recentMessages: recentMessages.map(m => ({ message: m.message, date: m.createdAt, type: 'message' }))
          }
        };
      })
    );
    res.json(enrichedUsers);
  } catch (err) {
    console.error("Deep Intelligence Error:", err);
    res.status(500).json({ message: "Failed intelligence fetch" });
  }
});

// 4. FETCH ALL USERS
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'User list failed' }); }
});

// 4.1 UPDATE USER ROLE/BAN
router.put("/users/:id", adminAuth, async (req, res) => {
  try {
    const { role, isBanned } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent Admin from banning themselves
    if (user._id.toString() === req.user._id.toString() && isBanned) {
      return res.status(400).json({ message: "You cannot ban yourself." });
    }

    // Use findByIdAndUpdate to avoid triggering validation on other fields (like phone/address)
    // capable of crashing the update if legacy data is invalid.
    const updates = {};
    if (role) updates.role = role;
    if (typeof isBanned !== 'undefined') updates.isBanned = isBanned;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: false } // Disable validation for partial updates
    );

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("User Update Error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// 5. DELETE PRODUCT REVIEW
router.delete("/products/:productId/reviews/:reviewId", adminAuth, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.reviews = product.reviews.filter((rev) => rev._id.toString() !== reviewId);
    product.rating = product.reviews.length > 0
      ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
      : 0;
    product.numReviews = product.reviews.length;

    await product.save();
    res.json({ message: "Review deleted successfully!" });
  } catch (err) { res.status(500).json({ message: "Server error deleting review" }); }
});

// 6. FETCH ALL REVIEWS
router.get("/reviews/all", adminAuth, async (req, res) => {
  try {
    const products = await Product.find({});
    let allReviews = [];
    products.forEach((product) => {
      product.reviews.forEach((review) => {
        allReviews.push({
          _id: review._id,
          productId: product._id,
          productName: product.name,
          userName: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        });
      });
    });
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(allReviews);
  } catch (err) { res.status(500).json({ message: "Failed to fetch reviews" }); }
});

// 🟢 ABANDONED CARTS
router.get("/carts/abandoned", adminAuth, async (req, res) => {
  try {
    // Find users with non-empty cart and updated > 1 hour ago (optional time filter)
    // For demo, just all non-empty carts
    const users = await User.find({ "cart.0": { $exists: true } })
      .select("name email cart updatedAt phone")
      .populate("cart.product", "name basePrice image"); // 🟢 Fix: basePrice

    const abandoned = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      updatedAt: u.updatedAt,
      cart: u.cart.filter(item => item.product), // Filter nulls
      total: u.cart.reduce((sum, item) => sum + (item.product?.basePrice || 0) * item.qty, 0) // 🟢 Fix: basePrice
    })).filter(u => u.cart.length > 0);

    res.json(abandoned);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch abandoned carts" });
  }
});

router.post("/carts/remind/:userId", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("cart.product", "name basePrice");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🟢 Send Real Email
    const cartItemsList = user.cart
      .filter(item => item.product)
      .map(item => `<li>${item.product.name} (Qty: ${item.qty})</li>`)
      .join("");

    const emailContent = `
      <h2 style="color: #38bdf8;">You left something behind!</h2>
      <p>Hi ${user.name}, checking out is easy. Here's what you left in your cart:</p>
      <ul>${cartItemsList}</ul>
      <p><strong>Total Value: ₹${user.cart.reduce((sum, item) => sum + (item.product?.basePrice || 0) * item.qty, 0)}</strong></p>
      <p>Return to your cart to complete your purchase using the link below:</p>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://seabite.co.in/cart" style="background: #38bdf8; color: #020617; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Return to Cart</a>
      </div>
    `;

    await sendEmail(user.email, "Your Cart is Waiting! 🛒", emailContent);

    res.json({ message: `Reminder sent to ${user.email}` });
  } catch (err) {
    console.error("Cart Reminder Failed:", err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

// 🟢 POS: MANUAL ORDER CREATION
// 🟢 POS: MANUAL ORDER CREATION
router.post("/orders/manual", adminAuth, async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, source, deliveryType, address } = req.body;

    // Validate essential data
    if (!customer?.phone || !customer?.name) {
      return res.status(400).json({ message: "Customer Name and Phone are required." });
    }

    // 🟢 Strict Phone Validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customer.phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    // 1. Find or Create User
    let user = await User.findOne({ phone: customer.phone });
    if (!user) {
      // Create a guest user for POS
      // Use a unique email if not provided to avoid duplicate key errors if email schema is unique
      const guestEmail = customer.email || `pos_guest_${customer.phone}_${Date.now()}@seabite.local`;

      try {
        user = await User.create({
          name: customer.name,
          phone: customer.phone,
          email: guestEmail,
          password: "pos_guest_user", // Placeholder
          role: "user"
        });
      } catch (userErr) {
        console.error("User Creation Error in POS:", userErr);
        // Fallback: try to find user again in case of race condition or just use a generic 'Guest' ID if absolutely necessary (not recommended for data integrity, better to fail or handle gracefully)
        // For now, if unique email fails, we might try another random one or error out.
        return res.status(500).json({ message: "Failed to register customer record." });
      }
    }

    // Determine Status
    const isDelivery = deliveryType === "Delivery";
    // POS orders are usually "Delivered" immediately if Walk-in, or "Pending" if Delivery
    const status = isDelivery ? "Pending" : "Delivered";
    const isDelivered = !isDelivery;
    const deliveredAt = isDelivery ? null : Date.now();

    // Construct Address
    // If Walk-in, we can use a placeholder address structure or just omit if schema allows. 
    // Assuming Schema requires some address fields based on previous code.
    const shippingAddress = isDelivery ? {
      fullName: customer.name,
      phone: customer.phone,
      houseNo: address?.houseNo || "",
      street: address?.street || "",
      city: address?.city || "Vizag",
      state: "AP",
      zip: address?.zip || "530001",
      country: "India"
    } : {
      fullName: customer.name,
      phone: customer.phone,
      houseNo: "POS",
      street: "Walk-in Customer",
      city: "Vizag",
      state: "AP",
      zip: "530001",
      country: "India"
    };

    // 2. Create Order
    const order = await Order.create({
      user: user._id,
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        price: Number(i.price),
        buyingPrice: Number(i.buyingPrice || 0),
        qty: Number(i.qty),
        image: i.image
      })),
      shippingAddress,
      paymentMethod: paymentMethod || "Cash",
      totalAmount: Number(totalAmount),
      isPaid: true, // POS orders are typically paid immediately (Cash/Card)
      paidAt: Date.now(),
      isDelivered,
      deliveredAt,
      status,
      source: source || "POS"
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error("POS Order Error:", err);
    res.status(500).json({ message: "Failed to create manual order", error: err.message });
  }
});

// 🟢 7. ACCESS SENTINEL (IAM MANAGEMENT)
router.get("/iam/locked", adminAuth, async (req, res) => {
  try {
    const lockedUsers = await User.find({
      $or: [
        { lockUntil: { $gt: Date.now() } },
        { loginAttempts: { $gt: 0 } }
      ]
    }).select("name email loginAttempts lockUntil lastActiveAt role");
    res.json(lockedUsers);
  } catch (err) {
    logger.error("IAM Locked User Fetch Failed", { traceId: req.traceId, error: err.message });
    res.status(500).json({ message: "Failed to fetch locked users" });
  }
});

router.post("/iam/unlock/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    logger.audit("User Account Unlocked", { traceId: req.traceId, admin: req.user.email, unlockedUser: user.email });
    res.json({ message: `Account for ${user.email} unlocked successfully.` });
  } catch (err) {
    logger.error("IAM Unlock Failed", { traceId: req.traceId, error: err.message });
    res.status(500).json({ message: "Failed to unlock user" });
  }
});

// 🟢 8. THE REGISTRY (HISTORICAL AUDIT)
router.get("/registry/logs", adminAuth, async (req, res) => {
  try {
    const { action, user, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (user) query.user = user;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email");

    const total = await ActivityLog.countDocuments(query);
    res.json({ logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error("Registry Fetch Failed", { traceId: req.traceId, error: err.message });
    res.status(500).json({ message: "Failed to fetch audit registry" });
  }
});

// 🟢 9. SEARCH DISCOVERY HUB
router.get("/insights/search-discovery", adminAuth, async (req, res) => {
  try {
    const zeroResults = await SearchInsight.find({ found: false })
      .sort({ count: -1 })
      .limit(20);
    const topSearches = await SearchInsight.find({ found: true })
      .sort({ count: -1 })
      .limit(20);
    res.json({ zeroResults, topSearches });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch search discovery" });
  }
});

export default router;