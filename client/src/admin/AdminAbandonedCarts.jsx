import { useState, useEffect } from "react";
import axios from "axios";
import { FiShoppingBag, FiMail, FiClock, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function AdminAbandonedCarts() {
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(null);

    const fetchCarts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/carts/abandoned`, { withCredentials: true });
            setCarts(res.data);
        } catch (err) {
            toast.error("Failed to load carts");
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
            toast.success("Reminder sent!");
        } catch (err) {
            toast.error("Failed to send");
        } finally {
            setSending(null);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://images.pexels.com/photos/2903391/pexels-photo-2903391.jpeg?auto=compress&cs=tinysrgb&w=100";
        if (imagePath.startsWith("http")) return imagePath;
        return `${API_URL}${imagePath.startsWith("/") ? "" : "/uploads/"}${imagePath}`;
    };

    if (loading) return (
        <div className="p-8 text-center flex justify-center">
            <SeaBiteLoader />
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans min-h-screen bg-gradient-to-br from-white via-stone-50 to-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 border-b border-stone-200/50 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">
                        Abandoned Carts
                    </h1>
                    <p className="text-sm text-stone-500">Recover sales by reminding customers</p>
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl border border-stone-200/50 shadow-sm">
                    <span className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-1">Potential Revenue</span>
                    <span className="text-2xl font-light text-stone-900">
                        ₹{carts.reduce((acc, c) => acc + c.total, 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="space-y-5">
                {carts.length === 0 ? (
                    <div className="bg-white p-16 rounded-3xl border border-stone-200/50 shadow-sm text-center">
                        <FiShoppingBag size={48} className="mx-auto text-stone-300 mb-4" />
                        <h3 className="text-lg font-light text-stone-900 mb-1">No Abandoned Carts</h3>
                        <p className="text-sm text-stone-500">All customers completed their purchases!</p>
                    </div>
                ) : (
                    carts.map((user, idx) => (
                        <motion.div
                            key={user._id}
                            initial="hidden" animate="visible" variants={fadeUp}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-3xl border border-stone-200/50 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            <div className="p-6 flex flex-col md:flex-row gap-6">
                                {/* User Info */}
                                <div className="w-full md:w-1/4 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-sm">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-stone-900">{user.name}</h3>
                                                <p className="text-xs text-stone-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50/50 p-3 rounded-2xl border border-stone-100/50">
                                            <FiClock size={14} />
                                            {new Date(user.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemind(user._id)}
                                        disabled={sending === user._id}
                                        className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {sending === user._id ? (
                                            <>
                                                <SeaBiteLoader small />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <FiMail size={14} />
                                                Send Reminder
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Cart Items */}
                                <div className="flex-1 bg-stone-50/30 rounded-2xl p-4 border border-stone-100/50">
                                    <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4 flex justify-between">
                                        <span>Items ({user.cart.length})</span>
                                        <span className="font-medium text-stone-900">₹{user.total.toLocaleString()}</span>
                                    </h4>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {user.cart.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-100/50 hover:border-stone-200 transition-all">
                                                <img
                                                    src={getImageUrl(item.product?.image)}
                                                    alt={item.product?.name}
                                                    className="w-12 h-12 object-contain bg-stone-100 rounded-lg p-1"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-stone-900 line-clamp-1">{item.product?.name}</p>
                                                    <p className="text-xs text-stone-500 mt-0.5">Qty: {item.qty} × ₹{item.product?.price}</p>
                                                </div>
                                                <span className="font-medium text-stone-900 text-sm whitespace-nowrap">
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
}
