import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟢 TOGGLE WISHLIST ITEM (Add/Remove)
router.post("/wishlist/:id", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const productId = req.params.id;

        if (!user) return res.status(404).json({ message: "User not found" });

        const isWishlisted = user.wishlist.includes(productId);

        if (isWishlisted) {
            // Remove
            user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
            await user.save();
            res.json({ message: "Removed from Wishlist", wishlist: user.wishlist });
        } else {
            // Add
            user.wishlist.push(productId);
            await user.save();
            res.json({ message: "Added to Wishlist", wishlist: user.wishlist });
        }
    } catch (error) {
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
import {
    addAddress,
    getAddresses,
    deleteAddress,
} from "../controllers/addressController.js";

router.post("/address", protect, addAddress);
router.get("/address", protect, getAddresses);
router.delete("/address/:id", protect, deleteAddress);

// 🛒 CART SYNC (Abandoned Cart Recovery)
router.post("/cart", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { cart } = req.body; // Expecting [{ product: id, qty: n }, ...]

        // Simple overwrite sync
        user.cart = cart.map(item => ({
            product: item.product?._id || item.product || item._id, // Handle full object or ID
            qty: item.qty
        }));

        await user.save();
        res.json({ message: "Cart synced", cart: user.cart });
    } catch (error) {
        // console.error("Cart sync error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

router.get("/cart", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("cart.product");
        // Filter out null products (if deleted)
        const validCart = user.cart.filter(item => item.product);
        res.json(validCart);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
