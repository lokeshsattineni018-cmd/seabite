import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPackage, FiTruck, FiCheckCircle, FiDollarSign, FiClock, FiPrinter, FiUser, FiPhone, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const StatusPill = ({ status }) => {
    const map = {
        "Pending": "bg-amber-100 text-amber-700 border-amber-200",
        "Processing": "bg-blue-100 text-blue-700 border-blue-200",
        "Shipped": "bg-indigo-100 text-indigo-700 border-indigo-200",
        "Delivered": "bg-emerald-100 text-emerald-700 border-emerald-200",
        "Cancelled": "bg-rose-100 text-rose-700 border-rose-200"
    };
    return <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${map[status] || 'bg-stone-100'}`}>{status}</span>;
};

export default function OrderDrawer({ order, isOpen, onClose, onUpdate }) {
    if (!order) return null;

    const handleWalletRefund = async () => {
        if (!window.confirm(`Refund ₹${order.totalAmount} to ${order.user?.name}'s wallet?`)) return;
        const t = toast.loading("Processing wallet refund...");
        try {
            await axios.post("/api/payment/refund-wallet", { orderId: order._id }, { withCredentials: true });
            toast.success("Refunded to wallet!", { id: t });
            onUpdate();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Refund failed", { id: t });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[101] overflow-y-auto"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">Order #{order.orderId}</h2>
                                <p className="text-[10px] text-stone-400 font-mono">ID: {order._id}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 pb-32">
                            {/* Status & Quick Actions */}
                            <div className="flex items-center justify-between bg-stone-50 p-6 rounded-3xl border border-stone-100">
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Current Status</p>
                                    <StatusPill status={order.status} />
                                </div>
                                <div className="flex gap-2">
                                    <a href={`tel:${order.shippingAddress?.phone}`} className="p-3 bg-white text-emerald-600 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all">
                                        <FiPhone size={18} />
                                    </a>
                                    <button onClick={handleWalletRefund} disabled={order.status === "Cancelled"} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                                        Refund to Wallet
                                    </button>
                                </div>
                            </div>

                            {/* Customer Profile */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Customer Profile</h3>
                                <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                                        <FiUser size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-stone-900">{order.user?.name || "Guest"}</h4>
                                        <p className="text-sm text-stone-500">{order.user?.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">LTV: ₹{(order.totalAmount * 1.5).toLocaleString()}</span>
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md">3rd Order</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Order Items</h3>
                                <div className="space-y-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-stone-50/50 border border-stone-100 rounded-2xl">
                                            <img src={`/uploads/${item.image?.split(/[/\\]/).pop()}`} className="w-14 h-14 object-cover rounded-xl bg-white p-1 border border-stone-100" />
                                            <div className="flex-1">
                                                <p className="font-bold text-stone-900 text-sm">{item.name}</p>
                                                <p className="text-xs text-stone-500 font-medium">Qty: {item.qty} • ₹{item.price}/unit</p>
                                            </div>
                                            <p className="font-bold text-stone-900">₹{(item.price * item.qty).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Delivery Details</h3>
                                <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <FiTruck className="text-stone-400 mt-1" size={18} />
                                        <div>
                                            <p className="text-sm font-semibold text-stone-900">{order.shippingAddress?.fullName}</p>
                                            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                                                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street},<br />
                                                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="absolute bottom-0 left-0 right-0 bg-stone-900 text-white p-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Total Payable</p>
                                    <h3 className="text-2xl font-bold">₹{order.totalAmount.toLocaleString()}</h3>
                                </div>
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold uppercase transition-all">
                                    <FiPrinter size={16} /> Print Invoice
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
