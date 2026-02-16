import express from "express";
import adminAuth from "../middleware/adminAuth.js"; // ✅ Uses session logic to stop loops
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Settings, { getSettings } from "../models/Settings.js";
import SearchInsight from "../models/SearchInsight.js";
import { sendStatusUpdateEmail } from "../utils/emailService.js";

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
      finalGraph.push({ month: monthName, orders: found ? found.orders : 0 });
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
router.put("/enterprise/settings", adminAuth, async (req, res) => {
  try {
    const { isMaintenanceMode, maintenanceMessage } = req.body;
    let settings = await getSettings();
    settings.isMaintenanceMode = isMaintenanceMode ?? settings.isMaintenanceMode;
    settings.maintenanceMessage = maintenanceMessage ?? settings.maintenanceMessage;
    settings.lastUpdatedBy = req.session.userId;
    await settings.save();
    res.json({ message: "Enterprise settings updated", settings });
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

// 1.7 FETCH ALL PRODUCTS FOR ADMIN (GET /api/admin/products)
router.get("/products", adminAuth, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// 1.8 CONFIGURE FLASH SALE (PUT /api/admin/products/:id/flash-sale)
router.put("/products/:id/flash-sale", adminAuth, async (req, res) => {
  try {
    const { discountPrice, saleEndDate, isFlashSale } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.flashSale = {
      discountPrice: discountPrice || 0,
      saleEndDate: saleEndDate,
      isFlashSale: isFlashSale
    };

    await product.save();
    res.json({ message: "Flash Sale updated successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update Flash Sale" });
  }
});

// 1.9 BULK EMAIL MARKETING (POST /api/admin/marketing/email-blast)
router.post("/marketing/email-blast", adminAuth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const users = await User.find({});

    // Batch send (logic should ideally be in a worker but for this phase we loop)
    let successCount = 0;
    for (const user of users) {
      try {
        await sendMarketingEmail(user.email, user.name, subject, message);
        successCount++;
      } catch (e) {
        console.error(`Failed to send email to ${user.email}:`, e.message);
      }
    }

    res.json({ message: `Successfully sent to ${successCount} customers.` });
  } catch (err) {
    res.status(500).json({ message: "Marketing blast failed." });
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

export default router;