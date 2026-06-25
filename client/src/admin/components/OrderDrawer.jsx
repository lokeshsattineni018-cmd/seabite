import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPackage, FiTruck, FiCheckCircle, FiDollarSign, FiClock, FiPrinter, FiUser, FiPhone, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const StatusPill = ({ status }) => {
    const map = {
        "Pending": "bg-amber-50 text-amber-600",
        "Processing": "bg-blue-50 text-blue-600",
        "Shipped": "bg-indigo-50 text-indigo-600",
        "Delivered": "bg-emerald-50 text-emerald-600",
        "Cancelled": "bg-rose-50 text-rose-600"
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${map[status] || 'bg-stone-50 text-stone-600'}`}>
            {status}
        </span>
    );
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
                        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#f5f5f7] shadow-2xl z-[101] overflow-y-auto flex flex-col"
                        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 flex justify-between items-center z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)] shrink-0">
                            <div>
                                <h2 className="text-xl font-medium text-stone-900">
                                    Order <span className="font-mono">#{order.orderId}</span>
                                </h2>
                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">ID: {order._id}</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-stone-100 active:scale-95 text-stone-500 hover:text-stone-900 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 p-8 space-y-8 pb-36 overflow-y-auto">
                            {/* Status & Quick Actions */}
                            <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Current Status</p>
                                    <StatusPill status={order.status} />
                                </div>
                                <div className="flex gap-2">
                                    {order.shippingAddress?.phone && (
                                        <a 
                                            href={`tel:${order.shippingAddress.phone}`} 
                                            className="p-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-stone-750 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 flex items-center justify-center"
                                        >
                                            <FiPhone size={18} />
                                        </a>
                                    )}
                                    <button 
                                        onClick={handleWalletRefund} 
                                        disabled={order.status === "Cancelled"} 
                                        className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white disabled:text-stone-400 rounded-2xl font-semibold text-xs tracking-wide transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95 disabled:pointer-events-none"
                                    >
                                        Refund to Wallet
                                    </button>
                                </div>
                            </div>

                            {/* Customer Profile */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Customer Profile</h3>
                                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex items-center gap-4">
                                    <div className="w-16 h-16 bg-[#f5f5f7] rounded-2xl flex items-center justify-center text-stone-400">
                                        <FiUser size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-stone-900 text-base">{order.user?.name || "Guest"}</h4>
                                        <p className="text-sm text-stone-500">{order.user?.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-md">
                                                LTV: <span className="font-mono">₹{(order.totalAmount * 1.5).toLocaleString()}</span>
                                            </span>
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-md">3rd Order</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Order Items</h3>
                                <div className="space-y-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                            <img 
                                                src={`/uploads/${item.image?.split(/[/\\]/).pop()}`} 
                                                className="w-14 h-14 object-cover rounded-xl bg-[#f5f5f7] p-1 border border-stone-100" 
                                                alt={item.name}
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                                                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                                                    Qty: <span className="font-mono">{item.qty}</span> • <span className="font-mono">₹{item.price}</span>/unit
                                                </p>
                                            </div>
                                            <p className="font-semibold text-stone-900 font-mono">₹{(item.price * item.qty).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Delivery Details</h3>
                                <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-[#f5f5f7] text-stone-600 rounded-xl shrink-0">
                                            <FiTruck size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-stone-900">{order.shippingAddress?.fullName}</p>
                                            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                                                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street},<br />
                                                {order.shippingAddress?.city}, {order.shippingAddress?.state} - <span className="font-mono">{order.shippingAddress?.zip}</span>
                                                {order.shippingAddress?.phone && (
                                                    <>
                                                        <br />
                                                        Phone: <span className="font-mono">{order.shippingAddress.phone}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="absolute bottom-0 left-0 right-0 bg-stone-900 text-white p-8 shrink-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Total Payable</p>
                                    <h3 className="text-2xl font-semibold font-mono">₹{order.totalAmount.toLocaleString()}</h3>
                                </div>
                                <button 
                                    onClick={() => window.print()} 
                                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-95"
                                >
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
