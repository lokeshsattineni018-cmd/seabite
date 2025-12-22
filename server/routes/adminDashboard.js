import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = express.Router();

router.get("/", adminAuth, async (req, res) => {
  try {
    /* COUNTS */
    // 🔴 CRITICAL FIX: Changed .find().count() to .countDocuments()
    const products = await Product.countDocuments();
    const orders = await Order.countDocuments();
    const users = await User.countDocuments();

    /* MONTHLY ORDERS GRAPH (LAST 12 MONTHS) */
    const monthly = await Order.aggregate([
      {
        $group: {
          // Extracts the month number from the createdAt timestamp
          _id: { $month: "$createdAt" }, 
          orders: { $sum: 1 },
        },
      },
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Fill missing months with 0
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
      .limit(5);

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
    // This console.error is CRITICAL. It tells us why the dashboard crashes.
    console.error("❌ ADMIN DASHBOARD CRASH:", err); 
    res.status(500).json({ message: "Dashboard error: Check server console for details." });
  }
});

export default router;