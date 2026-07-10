import express from "express";
import adminAuth from "../../middleware/adminAuth.js";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import Contact from "../../models/Contact.js";
import Notification from "../../models/Notification.js";
import Coupon from "../../models/Coupon.js";
import ActivityLog from "../../models/ActivityLog.js";
import DeliveryPartner from "../../models/DeliveryPartner.js";
import { sendBatchMarketingEmails, sendWinBackEmail, sendAbandonedCartEmail } from "../../utils/emailService.js";
import logger from "../../utils/logger.js";
import { runAbandonedCartWorker } from "../../cron/abandonedCartWorker.js";
import { validate, adjustWalletSchema } from "../../middleware/validationMiddleware.js";
const router = express.Router();

// Helper for dynamic RFM user filtering
async function getUsersInSegment(targetSegment) {
  const userOrders = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: "$user",
        lastOrderDate: { $max: "$createdAt" },
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
      },
    },
  ]);

  const now = Date.now();
  const targetUserIds = [];

  userOrders.forEach((u) => {
    if (!u._id) return;
    const recencyDays = Math.floor((now - new Date(u.lastOrderDate)) / (1000 * 60 * 60 * 24));
    const r = recencyDays <= 7 ? 5 : recencyDays <= 14 ? 4 : recencyDays <= 30 ? 3 : recencyDays <= 60 ? 2 : 1;
    const f = u.orderCount >= 10 ? 5 : u.orderCount >= 5 ? 4 : u.orderCount >= 3 ? 3 : u.orderCount >= 2 ? 2 : 1;
    const m = u.totalSpent >= 10000 ? 5 : u.totalSpent >= 5000 ? 4 : u.totalSpent >= 2000 ? 3 : u.totalSpent >= 500 ? 2 : 1;
    const rfmScore = r + f + m;

    let segment;
    if (rfmScore >= 13) segment = "champions";
    else if (rfmScore >= 10) segment = "loyal";
    else if (recencyDays > 60 && f >= 2) segment = "at_risk";
    else if (recencyDays > 90) segment = "hibernating";
    else if (u.orderCount === 1 && recencyDays > 30) segment = "churned";
    else segment = "new";

    if (segment === targetSegment) {
      targetUserIds.push(u._id);
    }
  });

  return targetUserIds;
}

// USER INTELLIGENCE (GET /api/admin/users/intelligence)
router.get("/users/intelligence", adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({ user: u._id }).sort({ createdAt: -1 });
        const reviewsCount = await Product.countDocuments({ "reviews.user": u._id });

        const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const orderCount = orders.length;
        const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

        const recencyDays = lastOrderDate
          ? Math.floor((Date.now() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24))
          : 999;

        let segment = "New";
        let churnRisk = "Low";

        if (orderCount === 0) {
          segment = "New Lead";
          churnRisk = "High";
        } else {
          if (recencyDays > 90) {
            segment = "Hibernating";
            churnRisk = "High";
          } else if (recencyDays > 30) {
            segment = "At Risk";
            churnRisk = "Medium";
          } else {
            if (totalSpent > 10000 || orderCount > 10) {
              segment = "Champion";
            } else if (orderCount > 3) {
              segment = "Loyal";
            } else {
              segment = "Active";
            }
          }
        }

        const recentLogs = await ActivityLog.find({
          $or: [{ user: u._id }, { "meta.email": u.email }]
        }).sort({ timestamp: -1 }).limit(10);

        const recentMessages = await Contact.find({ email: u.email }).sort({ createdAt: -1 }).limit(3);
        const lastActive = recentLogs.length > 0 ? recentLogs[0].timestamp : u.updatedAt;

        return {
          _id: u._id,
          name: u.name,
          email: u.email.toLowerCase(),
          role: u.role,
          createdAt: u.createdAt,
          isBanned: u.isBanned,
          walletBalance: u.walletBalance || 0,
          walletTransactions: u.walletTransactions || [],
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

// FETCH ALL USERS
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'User list failed' }); }
});

// UPDATE USER ROLE/BAN
router.put("/users/:id", adminAuth, async (req, res) => {
  try {
    const { role, isBanned } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isSuperAdminUser = !!user.isSuperAdmin;
    if (isSuperAdminUser) {
      return res.status(403).json({ message: "Access denied: Super Admin is protected and cannot be modified." });
    }

    if (user._id.toString() === req.user._id.toString() && isBanned) {
      return res.status(400).json({ message: "You cannot ban yourself." });
    }

    const updates = {};
    if (role) updates.role = role;
    if (typeof isBanned !== 'undefined') updates.isBanned = isBanned;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { returnDocument: "after", runValidators: false }
    );

    if (role === "driver") {
      const conditions = [];
      if (updatedUser.phone) conditions.push({ phone: updatedUser.phone });
      if (updatedUser.email) conditions.push({ email: updatedUser.email });

      const existingPartner = conditions.length > 0
        ? await DeliveryPartner.findOne({ $or: conditions })
        : null;

      if (!existingPartner) {
        const crypto = await import("crypto");
        const securePassword = crypto.randomBytes(8).toString("hex");
        await DeliveryPartner.create({
          name: updatedUser.name,
          phone: updatedUser.phone || `00000${Math.floor(10000 + Math.random() * 90000)}`,
          email: updatedUser.email || `${updatedUser._id}@seabite.com`,
          password: securePassword,
          status: "Offline",
          vehicleType: "Scooter"
        });
      }
    }

    if (req.io) {
      req.io.emit("USER_ROLE_UPDATED", {
        userId: updatedUser._id,
        role: updatedUser.role,
        isBanned: updatedUser.isBanned,
        name: updatedUser.name,
        email: updatedUser.email
      });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("User Update Error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// ADJUST USER WALLET
router.post("/users/:id/adjust-wallet", adminAuth, validate(adjustWalletSchema), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (typeof amount !== "number") {
      return res.status(400).json({ message: "Amount must be a number" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance = (user.walletBalance || 0) + amount;
    if (!user.walletTransactions) {
      user.walletTransactions = [];
    }

    user.walletTransactions.push({
      amount: Math.abs(amount),
      type: amount >= 0 ? "Credit" : "Debit",
      description: reason || "Manual admin adjustment",
      date: new Date()
    });

    await user.save();

    await ActivityLog.create({
      user: req.user?._id || null,
      action: "MANUAL_WALLET_ADJUSTMENT",
      details: `Manually adjusted ${user.email}'s wallet by ₹${amount >= 0 ? "+" : ""}${amount}. Reason: ${reason || "None"}.`,
      meta: { userId: user._id, amount, reason }
    });

    res.json({ message: "Wallet adjusted successfully", user });
  } catch (err) {
    console.error("Wallet Adjustment Error:", err);
    res.status(500).json({ message: "Failed to adjust wallet" });
  }
});

// DELETE PRODUCT REVIEW
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

// FETCH ALL REVIEWS
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

// ABANDONED CARTS
router.get("/carts/abandoned", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ "cart.0": { $exists: true } })
      .select("name email cart updatedAt phone")
      .populate("cart.product", "name basePrice price flashSale image");

    const abandoned = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      updatedAt: u.updatedAt,
      cartUpdatedAt: u.cartUpdatedAt,
      cart: u.cart.filter(item => item.product).map(item => {
        const p = item.product;
        const currentPrice = p.flashSale?.isFlashSale ? p.flashSale.discountPrice : (p.price || p.basePrice || 0);
        return {
          ...item.toObject(),
          price: currentPrice
        };
      }),
      total: u.cart.reduce((sum, item) => {
        const p = item.product;
        if (!p) return sum;
        const currentPrice = p.flashSale?.isFlashSale ? p.flashSale.discountPrice : (p.price || p.basePrice || 0);
        return sum + currentPrice * item.qty;
      }, 0)
    })).filter(u => u.cart.length > 0);

    res.json(abandoned);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch abandoned carts" });
  }
});

// REMIND ABANDONED CART
router.post("/carts/remind/:userId", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("cart.product", "name basePrice price flashSale image");
    if (!user) return res.status(404).json({ message: "User not found" });

    await sendAbandonedCartEmail(user.email, user.name, user.cart);
    res.json({ message: `Reminder sent to ${user.email}` });
  } catch (err) {
    console.error("Cart Reminder Failed:", err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

// CRON TRIGGER: ABANDONED CARTS
router.get("/cron/abandoned-carts", async (req, res) => {
  try {
    const secret = req.query.secret;
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: "Unauthorized cron call" });
    }

    const stats = await runAbandonedCartWorker();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ message: "Cron process failed", error: err.message });
  }
});

// NOTIFICATIONS MANAGEMENT (GET /api/admin/notifications)
router.get("/notifications", adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// MARK ALL READ (PUT /api/admin/notifications/read-all)
router.put("/notifications/read-all", adminAuth, async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

// DELETE NOTIFICATION (DELETE /api/admin/notifications/:id)
router.delete("/notifications/:id", adminAuth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// ACCESS SENTINEL (IAM MANAGEMENT)
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

// UNLOCK USER
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

// COHORT CREDIT WALLET
router.post("/bi/rfm/credit-wallet", adminAuth, async (req, res) => {
  try {
    const { segment, amount, reason } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }
    if (!segment) {
      return res.status(400).json({ message: "Segment is required" });
    }

    const userIds = await getUsersInSegment(segment);
    if (userIds.length === 0) {
      return res.json({ message: "No customers found in this segment.", count: 0 });
    }

    const users = await User.find({ _id: { $in: userIds } });
    for (const user of users) {
      user.walletBalance = (user.walletBalance || 0) + amount;
      if (!user.walletTransactions) user.walletTransactions = [];
      user.walletTransactions.push({
        amount,
        type: "Credit",
        description: reason || `Cohort credit for ${segment} segment`,
        date: new Date()
      });
      await user.save();

      await ActivityLog.create({
        user: req.user?._id || null,
        action: "COHORT_WALLET_CREDIT",
        details: `Credited ₹${amount} to ${user.email} in segment "${segment}". Reason: ${reason || "None"}.`,
        meta: { userId: user._id, amount, segment, reason }
      });
    }

    res.json({ message: `Successfully credited ₹${amount} to ${users.length} users in ${segment}.`, count: users.length });
  } catch (err) {
    console.error("Cohort Wallet Credit Error:", err);
    res.status(500).json({ message: "Failed to credit wallets." });
  }
});

// COHORT PROMO SEND
router.post("/bi/rfm/send-promo", adminAuth, async (req, res) => {
  try {
    const { segment } = req.body;
    if (!segment) {
      return res.status(400).json({ message: "Segment is required" });
    }

    const userIds = await getUsersInSegment(segment);
    if (userIds.length === 0) {
      return res.json({ message: "No customers found in this segment.", count: 0 });
    }

    const users = await User.find({ _id: { $in: userIds } });
    let sentCount = 0;

    for (const user of users) {
      const existingCoupon = await Coupon.findOne({
        code: { $regex: `^WB-${user._id.toString().slice(-4)}` },
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (existingCoupon) continue;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `WB-${user._id.toString().slice(-4)}-${randomSuffix}`.toUpperCase();

      await Coupon.create({
        code,
        discountType: "percent",
        value: 15,
        minOrderAmount: 500,
        maxUses: 1,
        userEmail: user.email,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true
      });

      await sendWinBackEmail(user.email, user.name || "Customer", code);

      await ActivityLog.create({
        user: req.user?._id || null,
        action: "COHORT_PROMO_CODE",
        details: `Sent 15% coupon ${code} to ${user.email} in segment "${segment}".`,
        meta: { userId: user._id, code, segment }
      });

      sentCount++;
    }

    res.json({ message: `Successfully generated and emailed promo codes to ${sentCount} users in ${segment}.`, count: sentCount });
  } catch (err) {
    console.error("Cohort Promo Send Error:", err);
    res.status(500).json({ message: "Failed to send cohort promo codes." });
  }
});

// BULK EMAIL MARKETING
router.post("/marketing/email-blast", adminAuth, async (req, res) => {
  try {
    const { subject, message, imageUrl, recipients } = req.body;

    const unescapedMessage = message
      ? message
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
      : "";

    let query = { email: { $exists: true, $ne: "" } };

    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      query._id = { $in: recipients };
    }

    const users = await User.find(query).select("email name");

    if (users.length === 0) {
      return res.json({ message: "No users found matching criteria.", stats: { sent: 0, failed: 0, total: 0 } });
    }

    const chunkArray = (arr, size) => {
      return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
      );
    };

    const userChunks = chunkArray(users, 100);
    let successCount = 0;
    let failureCount = 0;

    const promoData = {
      title: subject,
      subtitle: "SeaBite Fresh Coastal Catch",
      description: unescapedMessage,
      image: imageUrl || undefined,
      ctaText: "Shop Fresh Catch",
      ctaLink: "https://seabite.co.in/products"
    };

    for (const chunk of userChunks) {
      try {
        const mappedRecipients = chunk.map(u => ({ email: u.email, name: u.name }));
        const response = await sendBatchMarketingEmails(mappedRecipients, promoData);

        if (response?.error) {
          console.error("❌ Batch Error:", response.error);
          failureCount += chunk.length;
        } else if (response?.data) {
          successCount += response.data.length;
        }
      } catch (e) {
        console.error("❌ Chunk Error:", e);
        failureCount += chunk.length;
      }

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

// AUTOMATED WIN-BACK CAMPAIGN
router.post("/marketing/win-back", adminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const atRiskUsers = await User.find({
      lastOrderCompletionTime: { $lt: thirtyDaysAgo },
      email: { $exists: true }
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of atRiskUsers) {
      const existingCoupon = await Coupon.findOne({
        code: { $regex: `^WB-${user._id.toString().slice(-4)}` },
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (existingCoupon) {
        skippedCount++;
        continue;
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const code = `WB-${user._id.toString().slice(-4)}-${randomSuffix}`.toUpperCase();

      await Coupon.create({
        code,
        discountType: "percent",
        value: 15,
        minOrderAmount: 500,
        maxUses: 1,
        userEmail: user.email,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true
      });

      await sendWinBackEmail(user.email, user.name, code);

      await ActivityLog.create({
        action: "MARKETING_WINBACK",
        details: `Sent Win-Back Code ${code} to ${user.email}`,
        meta: { email: user.email, code }
      });

      sentCount++;
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

export default router;
