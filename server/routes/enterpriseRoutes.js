import express from "express";
import {
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
