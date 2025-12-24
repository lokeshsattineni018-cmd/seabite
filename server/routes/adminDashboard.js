import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = express.Router();

// ===============================================
// 1. ADMIN DASHBOARD SUMMARY
// ===============================================
router.get("/", adminAuth, async (req, res) => {
  try {
    /* COUNTS */
    const products = await Product.countDocuments();
    const orders = await Order.countDocuments();
    const users = await User.countDocuments();

    /* MONTHLY ORDERS GRAPH (LAST 12 MONTHS) */
    const monthly = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, 
          orders: { $sum: 1 },
        },
      },
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const graph = months.map((m, i) => {
      const found = monthly.find(x => x._id === i + 1);
      return {
        month: m,
        orders: found ? found.orders : 0,
      };
    });

    /* RECENT ORDERS */
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name'); // Added populate to show customer name

    /* POPULAR PRODUCTS */
    const popularProducts = await Product.find({ trending: true })
      .limit(5);

    res.json({
      stats: { products, orders, users },
      graph,
      recentOrders,
      popularProducts,
    });
  } catch (err) {
    console.error("❌ ADMIN DASHBOARD CRASH:", err); 
    res.status(500).json({ message: "Dashboard error: Check server console for details." });
  }
});

// ===============================================
// 2. USER INTELLIGENCE (Business Analytics)
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
// 3. FETCH ALL USERS
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
// 4. DELETE PRODUCT REVIEW (Admin Function)
// ===============================================
router.delete("/products/:productId/reviews/:reviewId", adminAuth, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Filter out the review matching the ID
    product.reviews = product.reviews.filter(
      (rev) => rev._id.toString() !== reviewId
    );

    // Recalculate average rating and total review count
    if (product.reviews.length > 0) {
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    } else {
      product.rating = 0;
    }
    product.numReviews = product.reviews.length;

    await product.save();
    res.json({ message: "Review deleted successfully!" });
  } catch (err) {
    console.error("❌ REVIEW DELETE ERROR:", err);
    res.status(500).json({ message: "Server error deleting review" });
  }
});

export default router;