import {
    sendOrderPlacedEmail,
    sendStatusUpdateEmail
} from "../utils/emailService.js";
import logger from "../utils/logger.js";
import Order from "../models/Order.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/notification.js";
import mongoose from "mongoose";

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            items,
            itemsPrice,
            discount,
            deliveryAddress,
            shippingAddress,
            idempotencyKey
        } = req.body;

        if (items && items.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'No order items' });
        }

        const subtotal = itemsPrice || 0;
        const shippingPrice = subtotal < 1000 ? 99 : 0;
        const taxPrice = Math.round((subtotal - (discount || 0)) * 0.05);
        const totalAmount = subtotal - (discount || 0) + shippingPrice + taxPrice;

        const orderData = {
            user: req.user._id,
            items,
            itemsPrice: subtotal,
            taxPrice,
            shippingPrice,
            totalAmount,
            discount: discount || 0,
            shippingAddress: deliveryAddress || shippingAddress,
        };

        if (idempotencyKey) {
            orderData.idempotencyKey = idempotencyKey;
        }

        const order = new Order(orderData);

        const createdOrder = await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        logger.info("Order Created Successfully", { orderId: createdOrder.orderId, user: req.user.email });

        if (req.io) {
            req.io.emit("ORDER_PLACED", {
                ...createdOrder._doc,
                user: { name: req.user.name }
            });
        }

        if (req.user && req.user.email) {
            try {
                await sendOrderPlacedEmail(
                    req.user.email,
                    req.user.name,
                    createdOrder.orderId || createdOrder._id,
                    createdOrder.totalAmount,
                    createdOrder.items
                );
            } catch (err) {
                logger.error("Order Confirmation Email Failed", { error: err.message, orderId: createdOrder._id });
            }
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        logger.error("Create Order Transaction Failed", { error: error.message, user: req.user?.email });
        res.status(500).json({ message: error.code === 11000 ? 'Duplicate order detected.' : 'Server error during order creation' });
    }
};

/**
 * @desc    Update order status (ADMIN ONLY)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
    const { status, refundStatus } = req.body;
    console.log(`[STATUS_UPDATE] Initiating update for Order ID: ${req.params.id} | New Status: ${status}`);

    try {
        // 1. Fetch Order
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            console.warn(`[STATUS_UPDATE] 404 - Order not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;
        console.log(`[STATUS_UPDATE] Found order: #${order.orderId} | Current status: ${oldStatus}`);

        // 2. Apply Changes
        if (status) order.status = status;
        if (refundStatus) {
            order.refundStatus = refundStatus;
            if (refundStatus === "Success") {
                order.isPaid = false;
            }
        }

        // 3. Save Order (Critical Step)
        const updatedOrder = await order.save();
        console.log(`[STATUS_UPDATE] Order saved successfully: #${order.orderId}`);

        // 4. Audit Logging (Non-Critical)
        try {
            if (ActivityLog) {
                await ActivityLog.create({
                    user: req.user._id,
                    action: `ORDER_STATUS_UPDATE`,
                    details: `Order #${order.orderId} status changed to ${status || 'N/A'}${refundStatus ? `, Refund: ${refundStatus}` : ''}`,
                    meta: {
                        orderId: order._id,
                        orderNumber: order.orderId,
                        oldStatus,
                        newStatus: status
                    }
                });
            }
        } catch (auditErr) {
            console.error("[STATUS_UPDATE] AuditLog failed:", auditErr.message);
        }

        // 5. Audit Trace (Non-Critical)
        try {
            if (logger && logger.audit) {
                logger.audit("Order Status Updated", {
                    orderId: order.orderId,
                    admin: req.user?.email,
                    status
                });
            }
        } catch (logErr) {
            console.error("[STATUS_UPDATE] Logger audit failed:", logErr.message);
        }

        // 6. Push Notification / Socket (Non-Critical)
        try {
            if (req.io) {
                req.io.to(`order_${order._id}`).emit('ORDER_UPDATED', updatedOrder);
                req.io.emit('ADMIN_ORDER_UPDATED', updatedOrder);
            }
        } catch (socketErr) {
            console.error("[STATUS_UPDATE] Socket notification failed:", socketErr.message);
        }

        // 7. Email Notification (Non-Critical)
        try {
            if (status && order.user && order.user.email && typeof sendStatusUpdateEmail === 'function') {
                await sendStatusUpdateEmail(
                    order.user.email,
                    order.user.name,
                    order.orderId || order._id,
                    status
                );
            }
        } catch (mailErr) {
            console.error("[STATUS_UPDATE] Email notification failed:", mailErr.message);
            if (logger && logger.error) {
                logger.error("Status Update Email Failed", { error: mailErr.message, orderId: order._id });
            }
        }

        console.log(`[STATUS_UPDATE] Successfully completed update for #${order.orderId}`);
        res.status(200).json(updatedOrder);

    } catch (error) {
        console.error("[STATUS_UPDATE] CRITICAL CRASH:", error);
        res.status(500).json({
            message: 'Internal server error during status update',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

/**
 * @desc    Cancel an order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Authorization check
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Business logic: prevent cancellation of shipped items
        if (order.status === 'Shipped' || order.status === 'Delivered') {
            return res.status(400).json({ message: 'Cannot cancel an order already in transit.' });
        }

        order.status = 'Cancelled by User';
        order.cancelReason = reason || "No reason provided";

        const updatedOrder = await order.save();

        // 🔐 AUDIT TRAIL: Log cancellation
        await ActivityLog.create({
            user: req.user._id,
            action: `ORDER_CANCELLED`,
            details: `Order #${order.orderId} was cancelled. Reason: ${reason}`,
            meta: { orderId: order._id, reason }
        });

        logger.info("Order Cancelled", { orderId: order.orderId, user: req.user.email, reason });

        // Sync with internal dashboard notifications
        await Notification.create({
            user: req.user._id,
            message: `🔴 Order #${order.orderId || order._id} was cancelled. Reason: ${order.cancelReason}`,
            orderId: order._id,
            statusType: "Cancelled"
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all orders (ADMIN ONLY)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

/**
 * @desc    Get logged-in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('items.productId', 'name image reviews')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
};

/**
 * @desc    Migration tool for pricing consistency
 * @access  Private/Admin
 */
export const migrateOldOrderDiscounts = async (req, res) => {
    try {
        const orders = await Order.find();
        let updatedCount = 0;
        for (let order of orders) {
            if (!order.itemsPrice || order.itemsPrice === 0) {
                const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                order.itemsPrice = subtotal;
                order.shippingPrice = subtotal < 1000 ? 99 : 0;
                order.taxPrice = Math.round((subtotal - (order.discount || 0)) * 0.05);
                await order.save();
                updatedCount++;
            }
        }
        res.status(200).json({ message: `Fixed ${updatedCount} orders.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * @desc    Delete an order (ADMIN ONLY)
 * @route   DELETE /api/orders/:id
 * @access  Private/Admin
 */
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        await order.deleteOne();

        // 🔐 AUDIT TRAIL: Log deletion
        await ActivityLog.create({
            user: req.user._id,
            action: `ORDER_DELETED`,
            details: `Order #${order.orderId || order._id} was permanently deleted by Admin.`,
            meta: { orderId: order._id, orderNumber: order.orderId }
        });

        logger.warn("Order Deleted", { orderId: order.orderId, admin: req.user.email });

        res.json({ message: "Order removed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};