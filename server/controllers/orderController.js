import Order from '../models/Order.js'; 
import Notification from "../models/notification.js";
import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendOrderPlacedEmail } from "../utils/emailService.js";

// @desc    Create new order
export const createOrder = async (req, res) => {
    try {
        const { 
            items, 
            itemsPrice, 
            discount, 
            deliveryAddress, 
            shippingAddress 
        } = req.body;

        if (items && items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // 🟢 NEW DELIVERY LOGIC: Calculate shipping based on subtotal (itemsPrice)
        // If subtotal is less than 1000, charge 99. Otherwise, it is 0.
        const subtotal = itemsPrice || 0;
        const shippingPrice = subtotal < 1000 ? 99 : 0;
        
        // Calculate Tax (5% of subtotal after discount)
        const taxPrice = Math.round((subtotal - (discount || 0)) * 0.05);
        
        // Final Grand Total calculation
        const totalAmount = subtotal - (discount || 0) + shippingPrice + taxPrice;

        const order = new Order({
            user: req.user._id,
            items,
            itemsPrice: subtotal,
            taxPrice,
            shippingPrice, // 🟢 Set to 99 or 0 based on the rule
            totalAmount, 
            discount: discount || 0,
            shippingAddress: deliveryAddress || shippingAddress
        });

        const createdOrder = await order.save();

        // Email Notification
        sendOrderPlacedEmail(req.user.email, req.user.name, createdOrder._id, createdOrder.totalAmount)
            .catch(err => console.error("Email Error:", err.message));

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 🟢 CANCEL ORDER LOGIC (Maintains Reason & Status lock)
export const cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body; 
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (order.status === 'Shipped' || order.status === 'Delivered') {
            return res.status(400).json({ message: 'Cannot cancel an order that has already been shipped.' });
        }

        order.status = 'Cancelled by User';
        order.cancelReason = reason || "No reason provided"; 
        
        const updatedOrder = await order.save();

        await Notification.create({
            user: req.user._id,
            message: `🔴 Order #${order.orderId} was cancelled. Reason: ${order.cancelReason}`,
            orderId: order._id,
            statusType: "Cancelled"
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// 🟢 UPDATED: This now correctly saves refundStatus to the DB
export const updateOrderStatus = async (req, res) => {
    const { status, refundStatus } = req.body; 
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status) order.status = status;
        
        // 🟢 SAVING THE REFUND STATUS
        if (refundStatus) {
            order.refundStatus = refundStatus;
            
            // If admin marks as Success, order is no longer "Paid" internally
            if (refundStatus === "Success") {
                order.isPaid = false;
            }
        }

        await order.save(); 

        if (status === 'Shipped') sendOrderShippedEmail(order.user.email, order.user.name, order._id).catch(e => {});
        if (status === 'Delivered') sendOrderDeliveredEmail(order.user.email, order.user.name, order._id).catch(e => {});

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('items.productId', 'name image reviews').sort({ createdAt: -1 }); 
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history' });
    }
};

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