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
  getLoyaltyBalance,
  uploadReturnImages
} from "../controllers/enterpriseController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js";
import { validateFileSignatures } from "../middleware/validateFileSignatures.js";

const router = express.Router();



// Gift Cards
router.post("/giftcards/purchase", protect, purchaseGiftCard);
router.post("/giftcards/apply", applyGiftCard);

// Recommendations
router.get("/recommendations", getRecommendations);

// Blogs
router.post("/blogs", protect, admin, createBlogPost);
router.get("/blogs", getBlogPosts);
router.get("/blogs/:slug", getBlogPostBySlug);

// Group Carts
router.post("/group-cart", createGroupCart);
router.get("/group-cart/:code", getGroupCart);
router.post("/group-cart/:code/join", joinGroupCart);

// Returns
router.post("/returns", protect, createReturnRequest);
router.post("/returns/upload", protect, upload.array("images", 5), validateFileSignatures, uploadReturnImages);
router.get("/returns", protect, getReturnRequests);
router.put("/returns/:id", protect, admin, updateReturnStatus);

// Loyalty Points
router.get("/loyalty", getLoyaltyBalance);

export default router;
