import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import Product from "../models/Product.js";
import { logActivity } from "../utils/activityLogger.js"; // 🟢 Added import
import {
    addAddress,
    getAddresses,
    deleteAddress,
    updateAddress,
} from "../controllers/addressController.js";

const router = express.Router();

// 🟢 TOGGLE WISHLIST ITEM (Add/Remove)
router.post("/wishlist/:id", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.id;
        console.log(`🔍 [DEBUG] Wishlist toggle triggered for user: ${req.user?._id}, product: ${productId}`);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.log("❌ [WISHLIST] Invalid Product ID:", productId);
            return res.status(400).json({ message: "Invalid Product ID" });
        }

        if (!user) {
            console.log("❌ [WISHLIST] User not found:", req.user?._id);
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure wishlist exists
        if (!user.wishlist) user.wishlist = [];

        const isWishlisted = user.wishlist.some(id => id.toString() === productId);

        if (isWishlisted) {
            // Remove
            user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
            await user.save();
            console.log(`✅ [WISHLIST] Removed product ${productId}`);
            logActivity("WISHLIST_REMOVE", `Removed product ${productId} from wishlist`, req);
            res.json({ message: "Removed from Wishlist", wishlist: user.wishlist });
        } else {
            // Add
            user.wishlist.push(productId);
            await user.save();
            console.log(`✅ [WISHLIST] Added product ${productId}`);
            logActivity("WISHLIST_ADD", `Added product ${productId} to wishlist`, req);
            res.json({ message: "Added to Wishlist", wishlist: user.wishlist });
        }
    } catch (error) {
        console.error("❌ [WISHLIST] Wishlist Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 🟢 GET WISHLIST
router.get("/wishlist", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("wishlist");
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 🟢 ADDRESS MANAGEMENT
// 🟢 ADDRESS MANAGEMENT
router.post("/address", protect, addAddress);
router.get("/address", protect, getAddresses);
router.put("/address/:id", protect, updateAddress);
router.delete("/address/:id", protect, deleteAddress);

// 🛒 CART SYNC (Abandoned Cart Recovery)
router.post("/cart", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const cart = req.body.cart || []; // Default to empty array

        if (!Array.isArray(cart)) {
            return res.status(400).json({ message: "Invalid cart data" });
        }

        // Simple overwrite sync
        user.cart = cart.map(item => {
            if (!item) return null;
            return {
                product: item.product?._id || item.product || item._id, // Handle full object or ID
                qty: item.qty || 1,
                selectedCut: item.selectedCut || "",
                cutPriceAdjustmentPct: Number(item.cutPriceAdjustmentPct || 0),
                orderedWeightGrams: Number(item.orderedWeightGrams || 0),
            };
        }).filter(item => item && item.product != null); // remove any null products

        user.cartUpdatedAt = new Date();
        user.abandonedCartEmailSent = false;

        await user.save();

        // 🟢 WATCHTOWER LOG (Debounce or check if cart not empty)
        if (cart.length > 0) {
            logActivity("CART_UPDATE", `Updated Cart: ${cart.length} items`, req, {
                itemCount: cart.length,
                items: cart.map(i => ({ id: i.product?._id || i.product || i._id, qty: i.qty }))
            });
        }

        res.json({ message: "Cart synced", cart: user.cart });
    } catch (error) {
        // console.error("Cart sync error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

router.get("/cart", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("cart.product");
        if (!user) return res.status(404).json({ message: "User not found" });
        
        // Filter out null products (if deleted)
        const validCart = (user.cart || []).filter(item => item && item.product);
        res.json(validCart);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 🤝 REFERRAL SYSTEM (Phase 28)
router.get("/referrals", protect, async (req, res) => {
    try {
        const referredUsers = await User.find({ referredBy: req.user._id })
            .select("name createdAt walletBalance orderCount")
            .sort("-createdAt");

        // Simple heuristic: if a user has at least 1 order, they are 'completed'
        // In a real app, you'd check specific order statuses.
        const referralList = referredUsers.map(u => ({
            name: u.name,
            createdAt: u.createdAt,
            status: (u.orderCount || 0) > 0 ? 'completed' : 'pending'
        }));

        const stats = {
            totalReferrals: referredUsers.length,
            earnedCredits: referralList.filter(r => r.status === 'completed').length * 100,
            pendingReferrals: referralList.filter(r => r.status === 'pending').length,
            referralList
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 💰 MOCK WALLET DEPOSIT
router.post("/wallet/deposit", protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const depositAmount = Number(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            return res.status(400).json({ message: "Invalid deposit amount" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.walletBalance = (user.walletBalance || 0) + depositAmount;

        if (!user.walletTransactions) {
            user.walletTransactions = [];
        }
        user.walletTransactions.push({
            amount: depositAmount,
            type: "Credit",
            description: "Deposit via Mock Payment",
            date: new Date()
        });

        await user.save();
        logActivity("WALLET_DEPOSIT", `Deposited ₹${depositAmount} via mock payment`, req);

        res.json({
            success: true,
            message: `₹${depositAmount} deposited successfully!`,
            walletBalance: user.walletBalance,
            walletTransactions: user.walletTransactions
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 💎 LOYALTY POINTS CONVERSION
router.post("/wallet/convert-loyalty", protect, async (req, res) => {
    try {
        const { points } = req.body;
        const pointsToConvert = Number(points);
        if (isNaN(pointsToConvert) || pointsToConvert <= 0) {
            return res.status(400).json({ message: "Invalid loyalty points quantity" });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if ((user.loyaltyPoints || 0) < pointsToConvert) {
            return res.status(400).json({ message: "Insufficient loyalty points" });
        }

        // Conversion: 2 points = ₹1
        const creditAmount = Math.round(pointsToConvert * 0.5);
        if (creditAmount <= 0) {
            return res.status(400).json({ message: "Points convert to ₹0. Must convert at least 2 points." });
        }

        user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - pointsToConvert);
        user.walletBalance = (user.walletBalance || 0) + creditAmount;

        if (!user.walletTransactions) {
            user.walletTransactions = [];
        }
        user.walletTransactions.push({
            amount: creditAmount,
            type: "Credit",
            description: `Converted ${pointsToConvert} Loyalty Points to Wallet Cash`,
            date: new Date()
        });

        await user.save();
        logActivity("LOYALTY_CONVERSION", `Converted ${pointsToConvert} points to ₹${creditAmount}`, req);

        res.json({
            success: true,
            message: `Successfully converted ${pointsToConvert} loyalty points to ₹${creditAmount}!`,
            loyaltyPoints: user.loyaltyPoints,
            walletBalance: user.walletBalance,
            walletTransactions: user.walletTransactions
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

export default router;
