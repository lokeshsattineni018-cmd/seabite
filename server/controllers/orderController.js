import Order from '../models/Order.js'; 
import Notification from "../models/notification.js";
import { 
    sendOrderShippedEmail, 
    sendOrderDeliveredEmail, 
    sendOrderPlacedEmail 
} from "../utils/emailService.js";

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

        // 🟢 DELIVERY LOGIC: Shipping based on subtotal (itemsPrice)
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
            shippingPrice, 
            totalAmount, 
            discount: discount || 0,
            shippingAddress: deliveryAddress || shippingAddress
        });

        const createdOrder = await order.save();

        // ✅ OFFICIAL NOTIFICATION: Using Brevo to send from info@seabite.co.in
        // We use .then() to avoid blocking the user's response while the email sends
        sendOrderPlacedEmail(
            req.user.email, 
            req.user.name, 
            createdOrder._id, 
            createdOrder.totalAmount
        )
        .then(() => console.log(`✅ Official Order Email sent to ${req.user.email}`))
        .catch(err => console.error("❌ Brevo Email Error:", err.message));

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 🟢 CANCEL ORDER LOGIC
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
            message: `🔴 Order #${order._id} was cancelled. Reason: ${order.cancelReason}`,
            orderId: order._id,
            statusType: "Cancelled"
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🟢 GET ALL ORDERS (ADMIN)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// 🟢 UPDATE ORDER STATUS (ADMIN)
export const updateOrderStatus = async (req, res) => {
    const { status, refundStatus } = req.body; 
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status) order.status = status;
        
        if (refundStatus) {
            order.refundStatus = refundStatus;
            if (refundStatus === "Success") {
                order.isPaid = false;
            }
        }

        await order.save(); 

        // ✅ Triggering Official Status Update Emails via Brevo
        if (status === 'Shipped') {
            sendOrderShippedEmail(order.user.email, order.user.name, order._id)
                .catch(e => console.error("Shipped Email Failed:", e.message));
        }
        
        if (status === 'Delivered') {
            sendOrderDeliveredEmail(order.user.email, order.user.name, order._id)
                .catch(e => console.error("Delivered Email Failed:", e.message));
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

// 🟢 GET MY ORDERS (USER)
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

// 🟢 MIGRATION TOOL
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