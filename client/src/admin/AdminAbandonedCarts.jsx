import { useState, useEffect } from "react";
import axios from "axios";
import { FiShoppingBag, FiMail, FiClock, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const AdminAbandonedCarts = () => {
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(null);

    const fetchCarts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/carts/abandoned`, { withCredentials: true });
            setCarts(res.data);
        } catch (err) {
            toast.error("Failed to load abandoned carts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarts();
    }, []);

    const handleRemind = async (userId) => {
        setSending(userId);
        try {
            await axios.post(`${API_URL}/api/admin/carts/remind/${userId}`, {}, { withCredentials: true });
            toast.success("Reminder email sent!");
        } catch (err) {
            toast.error("Failed to send reminder");
        } finally {
            setSending(null);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://placehold.co/100?text=No+Image";
        if (imagePath.startsWith("http")) return imagePath;
        return `${API_URL}${imagePath.startsWith("/") ? "" : "/uploads/"}${imagePath}`;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading carts...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Abandoned Carts</h1>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">Recover lost sales by reminding customers.</p>
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Potential Revenue</span>
                    <span className="text-emerald-600 font-bold text-xl">
                        ₹{carts.reduce((acc, c) => acc + c.total, 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {carts.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-slate-300">
                        <FiShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No Abandoned Carts</h3>
                        <p className="text-slate-500">All carts are empty or converted!</p>
                    </div>
                ) : (
                    carts.map((user) => (
                        <motion.div
                            key={user._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                        >
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                {/* User Info */}
                                <div className="w-full md:w-1/4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{user.name}</h3>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                                        <FiClock />
                                        Last active: {new Date(user.updatedAt).toLocaleDateString()} {new Date(user.updatedAt).toLocaleTimeString()}
                                    </div>
                                    <button
                                        onClick={() => handleRemind(user._id)}
                                        disabled={sending === user._id}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {sending === user._id ? "Sending..." : <><FiMail /> Send Reminder</>}
                                    </button>
                                </div>

                                {/* Cart Items */}
                                <div className="flex-1 bg-slate-50 rounded-xl p-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between">
                                        <span>Cart Contents ({user.cart.length})</span>
                                        <span>Total: ₹{user.total.toLocaleString()}</span>
                                    </h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {user.cart.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                                                <img
                                                    src={getImageUrl(item.product?.image)}
                                                    alt={item.product?.name}
                                                    className="w-12 h-12 object-contain bg-slate-50 rounded-md p-1"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.product?.name}</p>
                                                    <p className="text-xs text-slate-500">Qty: {item.qty} × ₹{item.product?.price}</p>
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm">
                                                    ₹{(item.qty * (item.product?.price || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminAbandonedCarts;
