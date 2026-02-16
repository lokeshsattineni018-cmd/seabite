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

export default router;
