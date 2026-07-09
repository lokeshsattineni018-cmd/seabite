import GiftCard from "../models/GiftCard.js";
import BlogPost from "../models/BlogPost.js";
import GroupCart from "../models/GroupCart.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Vendor from "../models/Vendor.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { GoogleGenerativeAI } from "@google/generative-ai";



// ----------------------------------------------------
// 2. GIFT CARD CONTROLLER
// ----------------------------------------------------
export const purchaseGiftCard = async (req, res) => {
  try {
    const { amount, senderName, recipientEmail, message } = req.body;
    if (!amount || !senderName || !recipientEmail || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Missing or invalid gift card details" });
    }

    const senderId = req.user?._id || req.session?.userId;
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const user = await User.findById(senderId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.walletBalance < Number(amount)) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance to purchase gift card." });
    }

    // Generate random 12 character code e.g. SB-XXXX-XXXX
    const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `SB-${rand()}-${rand()}`;

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

    const newGift = await GiftCard.create({
      code,
      initialBalance: amount,
      currentBalance: amount,
      senderName,
      recipientEmail,
      message,
      senderId,
      expiryDate
    });

    // Deduct from sender's wallet
    user.walletBalance -= Number(amount);
    if (!user.walletTransactions) {
      user.walletTransactions = [];
    }
    user.walletTransactions.push({
      amount: Number(amount),
      type: "Debit",
      description: `Gift Card Purchase (${code})`,
      date: new Date()
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: "Gift card purchased successfully! Send this code to recipient: " + code,
      giftCard: newGift
    });
  } catch (error) {
    console.error("❌ GIFT CARD PURCHASE ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to purchase gift card" });
  }
};

export const applyGiftCard = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Gift card code is required" });

    const card = await GiftCard.findOne({ code, active: true });
    if (!card) return res.status(404).json({ success: false, message: "Invalid or inactive gift card" });

    if (new Date() > card.expiryDate) {
      card.active = false;
      await card.save();
      return res.status(400).json({ success: false, message: "Gift card has expired" });
    }

    res.json({
      success: true,
      code: card.code,
      balance: card.currentBalance,
      message: `Gift card verified. Balance: ₹${card.currentBalance}`
    });
  } catch (error) {
    console.error("❌ APPLY GIFT CARD ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to verify gift card" });
  }
};

// ----------------------------------------------------
// 3. AI RECOMMENDER CONTROLLER
// ----------------------------------------------------
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.session.userId || req.user?._id;
    let products = await Product.find({ active: true });

    // AI recommendation using Gemini if available, or fall back to high-rated
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let promptText = `Given this catalog of seafood: ${JSON.stringify(products.map(p => ({ id: p._id, name: p.name, category: p.category, rating: p.rating })))}, select the top 4 products perfect for a customer looking for premium fresh coastal catches. Return only a JSON array of the string IDs.`;
        
        const result = await model.generateContent(promptText);
        const responseText = result.response.text();
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const ids = JSON.parse(cleanedText);
        
        if (Array.isArray(ids) && ids.length > 0) {
          const recommended = products.filter(p => ids.includes(p._id.toString()));
          if (recommended.length > 0) {
            return res.json({ success: true, recommendations: recommended });
          }
        }
      } catch (aiErr) {
        console.warn("⚠️ AI Recommendation fell back to rules-based:", aiErr.message);
      }
    }

    // Default Fallback: sort by rating & trending status
    const recommended = products.sort((a, b) => b.rating - a.rating).slice(0, 4);
    res.json({ success: true, recommendations: recommended });
  } catch (error) {
    console.error("❌ RECOMMENDATIONS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
  }
};

// ----------------------------------------------------
// 4. BLOG CONTROLLER
// ----------------------------------------------------
export const createBlogPost = async (req, res) => {
  try {
    const { title, slug, content, author, image, tags, productsAssociated } = req.body;
    const newPost = await BlogPost.create({
      title,
      slug,
      content,
      author,
      image,
      tags,
      productsAssociated
    });
    res.status(201).json({ success: true, blogPost: newPost });
  } catch (error) {
    console.error("❌ CREATE BLOG ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create blog post" });
  }
};

export const getBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({}).populate("productsAssociated");
    res.json({ success: true, posts });
  } catch (error) {
    console.error("❌ GET BLOGS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blog posts" });
  }
};

export const getBlogPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug }).populate("productsAssociated");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, post });
  } catch (error) {
    console.error("❌ GET BLOG POST ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to get blog post" });
  }
};

// ----------------------------------------------------
// 5. GROUP CART CONTROLLER
// ----------------------------------------------------
export const createGroupCart = async (req, res) => {
  try {
    const userId = req.session.userId || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Please log in to start a group cart" });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCart = await GroupCart.create({
      code,
      host: userId,
      members: [{ user: userId, name: req.user?.name || "Host", items: [] }]
    });

    res.status(201).json({ success: true, groupCart: newCart });
  } catch (error) {
    console.error("❌ CREATE GROUP CART ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create group cart" });
  }
};

export const getGroupCart = async (req, res) => {
  try {
    const { code } = req.params;
    const group = await GroupCart.findOne({ code }).populate("members.items.product").populate("host");
    if (!group) return res.status(404).json({ success: false, message: "Group cart not found" });
    res.json({ success: true, groupCart: group });
  } catch (error) {
    console.error("❌ GET GROUP CART ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to get group cart" });
  }
};

export const joinGroupCart = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.session.userId || req.user?._id;
    const name = req.body.name || req.user?.name || "Guest Rider";

    const group = await GroupCart.findOne({ code });
    if (!group) return res.status(404).json({ success: false, message: "Group cart not found" });

    // Check if user already in members list
    const isMember = group.members.some(m => m.user?.toString() === userId?.toString());
    if (!isMember) {
      group.members.push({ user: userId || null, name, items: [] });
      await group.save();
    }

    res.json({ success: true, groupCart: group });
  } catch (error) {
    console.error("❌ JOIN GROUP CART ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to join group cart" });
  }
};

// ----------------------------------------------------
// 6. RETURNS & REFUND CONTROLLER
// ----------------------------------------------------
export const createReturnRequest = async (req, res) => {
  try {
    const userId = req.session.userId || req.user?._id;
    const { orderId, items, reason, images } = req.body;

    if (!orderId || !items || items.length === 0 || !reason) {
      return res.status(400).json({ success: false, message: "Missing return claim details" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const newRequest = await ReturnRequest.create({
      order: orderId,
      user: userId,
      items,
      reason,
      images: images || [],
      status: "Pending"
    });

    res.status(201).json({ success: true, returnRequest: newRequest, message: "Fresh return request submitted successfully" });
  } catch (error) {
    console.error("❌ CREATE RETURN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create return request" });
  }
};

export const getReturnRequests = async (req, res) => {
  try {
    const requests = await ReturnRequest.find({}).populate("order").populate("user");
    res.json({ success: true, returnRequests: requests });
  } catch (error) {
    console.error("❌ GET RETURNS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch return requests" });
  }
};

export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;
    const request = await ReturnRequest.findById(id).populate("user").populate("order");

    if (!request) return res.status(404).json({ success: false, message: "Return request not found" });

    request.status = status;
    if (adminComment) request.adminComment = adminComment;

    if (status === "Approved") {
      // Refund to wallet automatically
      const user = await User.findById(request.user._id);
      const refundAmount = request.refundedAmount || request.order.totalAmount;
      user.walletBalance = (user.walletBalance || 0) + refundAmount;
      if (!user.walletTransactions) {
        user.walletTransactions = [];
      }
      user.walletTransactions.push({
        amount: refundAmount,
        type: "Credit",
        description: `Approved Return Request for Order #${request.order.orderId || request.order._id}`,
        date: new Date()
      });
      await user.save();
      request.refundedAmount = refundAmount;
    }

    await request.save();
    res.json({ success: true, returnRequest: request, message: `Return status updated to ${status}` });
  } catch (error) {
    console.error("❌ UPDATE RETURN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update return status" });
  }
};

// ----------------------------------------------------
// 6.5 UPLOAD RETURN IMAGES
// ----------------------------------------------------
export const uploadReturnImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files provided" });
    }

    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadedUrls = [];
    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      let dataURI = "data:" + file.mimetype + ";base64," + b64;
      const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
        folder: "seabite-returns",
      });
      uploadedUrls.push(cloudinaryResponse.secure_url);
    }

    res.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error("❌ CLOUDINARY UPLOAD ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to upload images" });
  }
};

// ----------------------------------------------------
// 7. LOYALTY BALANCE
// ----------------------------------------------------
export const getLoyaltyBalance = async (req, res) => {
  try {
    const userId = req.session.userId || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const user = await User.findById(userId);
    res.json({ success: true, loyaltyPoints: user.loyaltyPoints || 0 });
  } catch (error) {
    console.error("❌ GET LOYALTY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch loyalty points" });
  }
};
