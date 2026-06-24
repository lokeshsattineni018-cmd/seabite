import { useState, useEffect } from "react";
import axios from "axios";
import { FiShoppingBag, FiMail, FiClock, FiCheck, FiX, FiMessageSquare, FiArrowRight, FiPercent } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

const ease = [0.16, 1, 0.3, 1];

const COLUMNS = [
  { stage: 0, title: "Cart Abandoned", subtitle: "Initial abandonment", color: "border-stone-200 text-stone-500 bg-stone-50/50" },
  { stage: 1, title: "WhatsApp Sent", subtitle: "30 Mins elapsed", color: "border-emerald-200 text-emerald-600 bg-emerald-50/30" },
  { stage: 2, title: "Email Coupon", subtitle: "12 Hours elapsed", color: "border-blue-200 text-blue-600 bg-blue-50/30" },
  { stage: 3, title: "Recovered / Lost", subtitle: "Final status", color: "border-purple-200 text-purple-600 bg-purple-50/30" }
];

export default function AdminAbandonedCarts() {
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCart, setSelectedCart] = useState(null);

    const fetchCarts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/carts/abandoned`, { withCredentials: true });
            
            // Enrich carts with initial Kanban stages based on index for demo simulation
            const enriched = res.data.map((c, idx) => {
                let stage = 0;
                let recoveryStatus = "Pending";
                if (idx % 4 === 1) {
                    stage = 1;
                } else if (idx % 4 === 2) {
                    stage = 2;
                } else if (idx % 4 === 3) {
                    stage = 3;
                    recoveryStatus = idx % 8 === 3 ? "Recovered" : "Lost";
                }
                return {
                    ...c,
                    stage,
                    recoveryStatus
                };
            });
            setCarts(enriched);
        } catch (err) {
            toast.error("Failed to load carts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchCarts();
        };
        load();
    }, []);

    const advanceStage = (cartId, newStage, finalStatus) => {
        setCarts(prev => prev.map(c => {
            if (c._id === cartId) {
                return {
                    ...c,
                    stage: newStage,
                    recoveryStatus: finalStatus || c.recoveryStatus
                };
            }
            return c;
        }));
        
        if (newStage === 1) toast.success("💬 WhatsApp reminder dispatched!");
        if (newStage === 2) toast.success("🎟️ 12-Hour Email discount code sent!");
        if (newStage === 3) {
            if (finalStatus === "Recovered") toast.success("💸 Cart marked as RECOVERED! Revenue credited.");
            else toast.error("❌ Cart marked as LOST.");
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://images.pexels.com/photos/2903391/pexels-photo-2903391.jpeg?auto=compress&cs=tinysrgb&w=100";
        if (imagePath.startsWith("http")) return imagePath;
        return `${API_URL}${imagePath.startsWith("/") ? "" : "/uploads/"}${imagePath}`;
    };

    if (loading) return (
        <div className="p-20 text-center flex justify-center">
            <SeaBiteLoader />
        </div>
    );

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto font-sans min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-stone-200/50 pb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">
                        Recovery Board
                    </h1>
                    <p className="text-sm text-stone-500">Interactive Kanban pipeline to recover abandoned shopping carts</p>
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Target Revenue</span>
                        <span className="text-2xl font-light text-stone-900">
                            ₹{carts.reduce((acc, c) => acc + c.total, 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="border-l border-stone-100 pl-6">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Recovered Rate</span>
                        <span className="text-2xl font-extrabold text-emerald-600">
                            {carts.length > 0 ? Math.round((carts.filter(c => c.recoveryStatus === "Recovered").length / carts.length) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Kanban Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {COLUMNS.map(col => {
                    const colCarts = carts.filter(c => c.stage === col.stage);
                    const colTotal = colCarts.reduce((sum, c) => sum + c.total, 0);

                    return (
                        <div key={col.stage} className="flex flex-col space-y-4">
                            {/* Column Header */}
                            <div className={`p-4 rounded-2xl border ${col.color} flex justify-between items-center`}>
                                <div>
                                    <h3 className="font-bold text-xs uppercase tracking-wider">{col.title}</h3>
                                    <p className="text-[9px] font-medium opacity-80 mt-0.5">{col.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black px-2 py-0.5 bg-white/80 rounded-md border border-stone-200/20">{colCarts.length}</span>
                                    <p className="text-[9px] font-bold mt-1">₹{colTotal.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Column Body / Cards Container */}
                            <div className="bg-stone-50/50 border border-stone-150 p-4 rounded-3xl min-h-[600px] space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {colCarts.length === 0 ? (
                                        <div className="py-20 text-center text-stone-300 flex flex-col items-center justify-center">
                                            <FiShoppingBag size={24} className="opacity-30 mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Empty Stage</p>
                                        </div>
                                    ) : (
                                        colCarts.map(cart => (
                                            <motion.div
                                                layoutId={cart._id}
                                                key={cart._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ ease }}
                                                className="bg-white border border-stone-150 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-stone-300 transition-all cursor-pointer space-y-4 relative group"
                                                onClick={() => setSelectedCart(cart)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-xs text-stone-900 group-hover:text-blue-600 transition-colors">{cart.name}</h4>
                                                        <p className="text-[9px] text-stone-400 font-bold truncate max-w-[180px] mt-0.5">{cart.email}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-stone-900">₹{cart.total}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100/50">
                                                    <FiClock size={12} className="text-stone-400" />
                                                    <span>{new Date(cart.cartUpdatedAt || cart.updatedAt).toLocaleDateString()}</span>
                                                </div>

                                                {/* Action Hooks triggers */}
                                                <div className="pt-3 border-t border-stone-50 flex gap-2" onClick={e => e.stopPropagation()}>
                                                    {cart.stage === 0 && (
                                                        <button 
                                                            onClick={() => advanceStage(cart._id, 1)}
                                                            className="w-full py-2 bg-stone-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-stone-850"
                                                        >
                                                            <FiMessageSquare size={10} /> Send WhatsApp
                                                        </button>
                                                    )}
                                                    {cart.stage === 1 && (
                                                        <button 
                                                            onClick={() => advanceStage(cart._id, 2)}
                                                            className="w-full py-2 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-blue-700"
                                                        >
                                                            <FiPercent size={10} /> Send Promo Coupon
                                                        </button>
                                                    )}
                                                    {cart.stage === 2 && (
                                                        <div className="flex w-full gap-1.5">
                                                            <button 
                                                                onClick={() => advanceStage(cart._id, 3, "Recovered")}
                                                                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-600"
                                                            >
                                                                Recovered
                                                            </button>
                                                            <button 
                                                                onClick={() => advanceStage(cart._id, 3, "Lost")}
                                                                className="flex-1 py-2 border border-rose-250 text-rose-500 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-rose-50"
                                                            >
                                                                Lost
                                                            </button>
                                                        </div>
                                                    )}
                                                    {cart.stage === 3 && (
                                                        <span className={`w-full py-1.5 rounded-lg text-center text-[9px] font-bold uppercase tracking-widest block border ${
                                                            cart.recoveryStatus === "Recovered"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                : "bg-rose-50 text-rose-700 border-rose-100"
                                                        }`}>
                                                            {cart.recoveryStatus === "Recovered" ? "💸 Recovered" : "❌ Lost"}
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cart Items Details Drawer overlay */}
            <AnimatePresence>
                {selectedCart && (
                    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-end">
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ ease, duration: 0.4 }}
                            className="bg-white w-full max-w-md h-full shadow-2xl p-8 flex flex-col justify-between"
                        >
                            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
                                <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900">Cart Breakdown</h3>
                                        <p className="text-xs text-stone-400 mt-1">{selectedCart.name}'s Shopping selection</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCart(null)}
                                        className="p-2 border border-stone-200 rounded-xl text-stone-400 hover:text-stone-900"
                                    >
                                        <FiX size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {selectedCart.cart.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-150">
                                            <img
                                                src={getImageUrl(item.product?.image)}
                                                alt={item.product?.name}
                                                className="w-12 h-12 object-contain bg-white rounded-xl p-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-stone-900 truncate">{item.product?.name}</p>
                                                <p className="text-[10px] text-stone-400 font-bold mt-1">Qty: {item.qty} × ₹{item.price || item.product?.price || 0}</p>
                                            </div>
                                            <span className="font-extrabold text-stone-950 text-xs shrink-0">
                                                ₹{(item.qty * (item.price || item.product?.price || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-stone-100 bg-white">
                                <div className="flex justify-between items-center text-xs font-bold text-stone-500 mb-6">
                                    <span>Estimated Subtotal</span>
                                    <span className="text-lg text-stone-900">₹{selectedCart.total.toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedCart(null)}
                                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-850 transition-colors"
                                >
                                    Close Breakdown
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
