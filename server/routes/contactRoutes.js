import express from "express";
import Contact from "../models/Contact.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. POST: User sends a message (Public)
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ success: false, message: "Email and message are required" });
    }

    // 🧠 AI Intent Tagging (Keyword Based)
    const tags = [];
    const lowerMsg = message.toLowerCase();
    
    const complaintKeywords = ["bad", "smell", "rotten", "delayed", "late", "wrong", "missing", "worst"];
    const salesKeywords = ["bulk", "kg", "restaurant", "hotel", "order", "price for 10kg", "discount"];
    
    if (complaintKeywords.some(k => lowerMsg.includes(k))) tags.push("Complaint");
    if (salesKeywords.some(k => lowerMsg.includes(k))) tags.push("Sales Lead");

    const status = tags.includes("Complaint") ? "Urgent" : "New";

    await Contact.create({ name, email, subject, message, tags, status });
    res.status(201).json({ success: true, message: "Message Sent Successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 2. GET: Admin fetches all messages
router.get("/", async (req, res) => {
  try {
    // Fetch all contacts and sort by newest first (-1)
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// 3. PUT: Update status or mark as read
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { status, tags, read } = req.body;
    const msg = await Contact.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    if (status) msg.status = status;
    if (tags) msg.tags = tags;
    if (read !== undefined) msg.read = read;

    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 4. GET: Customer 360 (Context for Sidebar)
router.get("/customer-360/:email", protect, admin, async (req, res) => {
  try {
    const email = req.params.email;
    
    // Fetch User Profile & Cart
    const user = await User.findOne({ email }).populate('cart.product', 'name image basePrice');
    
    // Fetch Recent Orders
    let orders = [];
    if (user) {
      orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    } else {
      orders = await Order.find({ "shippingAddress.email": email }).sort({ createdAt: -1 }).limit(5);
    }

    res.json({
      user: user ? {
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance,
        cart: user.cart,
      } : null,
      recentOrders: orders
    });
  } catch (err) {
    res.status(500).json({ message: "Context fetch failed" });
  }
});

// 5. POST: Admin replies to a message
import { sendEmail } from "../utils/emailService.js";

router.post("/reply", protect, admin, async (req, res) => {
  try {
    const { to, subject, message, originalMessageId } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: "Recipient and message required" });
    }

    // Send email using existing service
    await sendEmail(to, subject || "Response from SeaBite Support", message);

    // Update status to Pending Reply if it was New
    if (originalMessageId) {
      await Contact.findByIdAndUpdate(originalMessageId, { status: "Pending Reply" });
    }

    res.json({ success: true, message: "Reply sent successfully!" });
  } catch (err) {
    console.error("Reply Error:", err);
    res.status(500).json({ success: false, message: "Failed to send reply" });
  }
});

export default router;