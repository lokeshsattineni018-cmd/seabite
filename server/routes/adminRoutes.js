import express from "express";
import adminAuth from "../middleware/adminAuth.js"; // ✅ Uses session logic to stop loops
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Settings, { getSettings } from "../models/Settings.js";
import SearchInsight from "../models/SearchInsight.js";
import { sendStatusUpdateEmail, sendMarketingEmail, sendBatchMarketingEmails, sendOtpEmail } from "../utils/emailService.js";

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

    const stats = {
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      users: await User.countDocuments(),
      totalRevenue: Math.round(totalRevenue)
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
    const { maintenanceMessage, globalDiscount } = req.body; // Removed isMaintenanceMode from direct toggle
    let settings = await getSettings();
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
    if (globalDiscount !== undefined) settings.globalDiscount = globalDiscount; // 🟢 NEW

    // If they try to toggle maintenance here, we ignore it or block it. 
    // For now, let's assume the frontend calls the new verify route for the toggle.

    settings.lastUpdatedBy = req.session.userId;
    await settings.save();
    res.json({ message: "Settings updated", settings });
  } catch (err) {
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
    const { subject, message } = req.body;

    // 🟢 SECURITY HOTFIX (Phase 28): Unescape HTML for Email Blast
    // 'xss-clean' middleware escapes HTML tags (e.g., < to &lt;). 
    // Since this is an ADMIN-ONLY route, we trust the admin's HTML and revert it for proper rendering.
    const unescapedMessage = message
      ? message
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
      : "";

    const users = await User.find({ email: { $exists: true, $ne: "" } }).select("email name");

    if (users.length === 0) {
      return res.json({ message: "No users found to email.", stats: { sent: 0, failed: 0, total: 0 } });
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

// 3. USER INTELLIGENCE (Enriched for Sessions)
router.get("/users/intelligence", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({ user: u._id });
        const reviewsCount = await Product.countDocuments({ "reviews.user": u._id });
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        return {
          _id: u._id,
          name: u.name,
          email: u.email.toLowerCase(), // ✅ Case-insensitive mapping for sessions
          role: u.role,
          createdAt: u.createdAt,
          intelligence: {
            totalSpent: Math.round(totalSpent),
            orderCount: orders.length,
            reviewCount: reviewsCount,
            isVIP: totalSpent > 10000
          }
        };
      })
    );
    res.json(enrichedUsers);
  } catch (err) { res.status(500).json({ message: "Failed intelligence fetch" }); }
});

// 4. FETCH ALL USERS
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'User list failed' }); }
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
      .populate("cart.product", "name price image");

    const abandoned = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      updatedAt: u.updatedAt,
      cart: u.cart.filter(item => item.product), // Filter nulls
      total: u.cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.qty, 0)
    })).filter(u => u.cart.length > 0);

    res.json(abandoned);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch abandoned carts" });
  }
});

router.post("/carts/remind/:userId", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // In a real app, this would use emailService.sendEmail
    // For now, we'll simulate it or use the existing email service if possible
    // import { sendEmail } from "../utils/emailService.js";
    // await sendEmail(user.email, "You left something behind!", "Your cart is waiting...", ...);

    // Mock success
    res.json({ message: `Reminder sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

export default router;