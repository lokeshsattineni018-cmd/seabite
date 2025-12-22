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
    const products = await Product.countDocuments();
    const orders = await Order.countDocuments();
    const users = await User.countDocuments();

    // --- RECENT ORDERS ---
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name'); 

    // --- TOP SELLING ---
    const allOrders = await Order.find({}, 'items');
    const salesMap = {};
    allOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const pId = item.product || item.productId || item._id;
          if (pId) {
            const idStr = pId.toString(); 
            const qty = item.quantity || 1; 
            salesMap[idStr] = (salesMap[idStr] || 0) + qty;
          }
        });
      }
    });

    const sortedIds = Object.keys(salesMap).sort((a, b) => salesMap[b] - salesMap[a]).slice(0, 5);
    const productDetails = await Product.find({ _id: { $in: sortedIds } });

    const popularProducts = sortedIds.map(id => {
      const p = productDetails.find(prod => prod._id.toString() === id);
      if (!p) return null;
      
      let finalImage = p.image;
      if (!finalImage && p.images && p.images.length > 0) finalImage = p.images[0];

      return {
        _id: p._id,
        name: p.name,
        image: finalImage || "", 
        totalSold: salesMap[id]
      };
    }).filter(item => item !== null);

    res.json({
      stats: { products, orders, users },
      graph: finalGraph,
      recentOrders,
      popularProducts,
    });

  } catch (err) {
    console.error("❌ ADMIN DASHBOARD CRASH:", err);
    res.status(500).json({ message: "Dashboard error: Check server console." });
  }
});

// ===============================================
// 🟢 NEW: COMPREHENSIVE USER INTELLIGENCE (GET /api/admin/users/intelligence)
// ===============================================
router.get("/users/intelligence", adminAuth, async (req, res) => {
  try {
    // 1. Fetch all users sorted by most recent
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    // 2. Aggregate data for each user
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        // Find all orders placed by this user
        const orders = await Order.find({ user: u._id }).sort({ createdAt: -1 });
        
        // Find total reviews written by this user across products
        const reviewsCount = await Product.countDocuments({ "reviews.user": u._id });

        // Calculate Totals
        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const couponsUsed = orders.filter(o => o.discount > 0).length;
        const lastOrder = orders[0]; // Get their latest order info

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
            couponCount: couponsUsed,
            lastLocation: lastOrder?.deliveryAddress?.state || "N/A",
            isVIP: totalSpent > 10000 // Flag high-value users
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
// 2. FETCH ALL USERS (GET /api/admin/users)
// ===============================================
router.get("/users", adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        res.status(500).json({ message: 'Failed to retrieve user list.' });
    }
});

// ===============================================
// 3. UPDATE USER ROLE (PUT /api/admin/users/:id/role)
// ===============================================
router.put("/users/:id/role", adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; 

        if (!['admin', 'customer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role: role },
            { new: true } 
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: `Role updated to ${role}.`, user: updatedUser });

    } catch (err) {
        console.error("Error updating user role:", err);
        res.status(500).json({ message: 'Failed to update user role on the server.' });
    }
});

export default router;