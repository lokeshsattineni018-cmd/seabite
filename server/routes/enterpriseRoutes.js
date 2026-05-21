import express from "express";
import {
  createSubscription,
  getSubscriptions,
  cancelSubscription,
  toggleSubscriptionStatus,
  purchaseGiftCard,
  applyGiftCard,
  getRecommendations,
  createBlogPost,
  getBlogPosts,
  getBlogPostBySlug,
  createGroupCart,
  getGroupCart,
  joinGroupCart,
  createReturnRequest,
  getReturnRequests,
  updateReturnStatus,
  getLoyaltyBalance
} from "../controllers/enterpriseController.js";

const router = express.Router();

// Subscriptions
router.post("/subscriptions", createSubscription);
router.get("/subscriptions", getSubscriptions);
router.put("/subscriptions/cancel/:id", cancelSubscription);
router.put("/subscriptions/:id/status", toggleSubscriptionStatus);

// Gift Cards
router.post("/giftcards/purchase", purchaseGiftCard);
router.post("/giftcards/apply", applyGiftCard);

// Recommendations
router.get("/recommendations", getRecommendations);

// Blogs
router.post("/blogs", createBlogPost);
router.get("/blogs", getBlogPosts);
router.get("/blogs/:slug", getBlogPostBySlug);

// Group Carts
router.post("/group-cart", createGroupCart);
router.get("/group-cart/:code", getGroupCart);
router.post("/group-cart/:code/join", joinGroupCart);

// Returns
router.post("/returns", createReturnRequest);
router.get("/returns", getReturnRequests);
router.put("/returns/:id", updateReturnStatus);

// Loyalty Points
router.get("/loyalty", getLoyaltyBalance);

export default router;
