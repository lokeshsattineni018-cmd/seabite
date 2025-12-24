import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = express.Router();

// ===============================================
// 1. ADMIN DASHBOARD SUMMARY (GET /api/admin)
// ===============================================
router.get("/", adminAuth, async (req, res) => {
  try {
    const { range } = req.query; 

    // --- DATE CONFIG ---
    const limit = range === "1year" ? 12 : 6;
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - limit);

    // --- GRAPH DATA ---
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
      finalGraph.push({
        month: monthName,
        orders: found ? found.orders : 0
      });
    }

    // --- COUNTS ---
    const stats = {
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      users: await User.countDocuments()
    };

    // --- RECENT ORDERS ---
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name'); 

    res.json({
      stats,
      graph: finalGraph,
      recentOrders,
    });

  } catch (err) {
    console.error("❌ ADMIN DASHBOARD CRASH:", err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

// ===============================================
// 2. USER INTELLIGENCE (GET /api/admin/users/intelligence)
// ===============================================
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
          email: u.email,
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
  } catch (err) {
    console.error("❌ USER INTELLIGENCE CRASH:", err);
    res.status(500).json({ message: "Failed to gather user intelligence." });
  }
});

// ===============================================
// 3. FETCH ALL USERS (GET /api/admin/users)
// ===============================================
router.get("/users", adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve user list.' });
    }
});

// ===============================================
// 4. DELETE PRODUCT REVIEW (DELETE /api/admin/products/:productId/reviews/:reviewId)
// ===============================================
router.delete("/products/:productId/reviews/:reviewId", adminAuth, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Remove the specific review from the array
    product.reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== reviewId
    );

    // Recalculate average rating and review count
    if (product.reviews.length > 0) {
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    } else {
      product.rating = 0;
    }
    product.numReviews = product.reviews.length;

    await product.save();
    res.json({ message: "Review deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting review" });
  }
});

export default router;