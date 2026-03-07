import express from "express";
import Complaint from "../models/Complaint.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @desc    Get all complaints
 * @route   GET /api/admin/complaints
 * @access  Private/Admin
 */
router.get("/", protect, admin, async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate("user", "name email")
            .populate({
                path: "order",
                select: "orderId totalAmount status items",
            })
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch complaints" });
    }
});

/**
 * @desc    Get single complaint
 * @route   GET /api/admin/complaints/:id
 * @access  Private/Admin
 */
router.get("/:id", protect, admin, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate("user", "name email phone")
            .populate({
                path: "order",
                populate: { path: "items.productId", select: "name image" }
            });
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: "Error loading complaint details" });
    }
});

/**
 * @desc    Reply to complaint
 * @route   PUT /api/admin/complaints/:id/reply
 * @access  Private/Admin
 */
router.put("/:id/reply", protect, admin, async (req, res) => {
    try {
        const { adminReply, status } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        complaint.adminReply = adminReply;
        if (status) complaint.status = status;
        complaint.repliedAt = Date.now();

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: "Failed to send reply" });
    }
});

export default router;
