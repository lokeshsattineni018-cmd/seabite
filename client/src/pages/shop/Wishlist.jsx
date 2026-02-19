import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { ThemeContext } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import { FiHeart, FiArrowRight } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    show: {
        opacity: 1, y: 0, scale: 1,
        transition: { type: "spring", stiffness: 180, damping: 20 },
    },
    exit: {
        opacity: 0, scale: 0.88, y: -10,
        transition: { duration: 0.22, ease: "easeInOut" },
    },
};

export default function Wishlist() {
    const { user } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);
    const { globalDiscount } = useContext(CartContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchWishlist(); }, [user]);

    const fetchWishlist = async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${API_URL}/api/user/wishlist`, {
                withCredentials: true,
            });
            setWishlist(res.data);
        } catch (err) {
            console.error("Failed to fetch wishlist", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = (productId) => {
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
    };

    // ── Loader ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-2 border-sky-200 border-t-sky-500 animate-spin" />
                        <div
                            className="absolute inset-[7px] rounded-full border-2 border-rose-200 border-b-rose-400 animate-spin"
                            style={{ animationDirection: "reverse", animationDuration: "0.75s" }}
                        />
                    </div>
                    <p className="text-xs tracking-[0.2em] uppercase text-slate-400 font-medium">
                        Fetching your catches…
                    </p>
                </div>
            </div>
        );
    }

    // ── Page ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#f8f6f2] pt-28 pb-20 px-4 relative overflow-hidden transition-colors duration-500">

            {/* Soft atmospheric blobs */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-200/15 rounded-full blur-[90px] pointer-events-none translate-x-1/4 translate-y-1/4" />
            <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-teal-200/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

            <div className="max-w-7xl mx-auto relative z-10">

                {/* ── Header ─────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-14 text-center"
                >
                    <span className="text-sky-500 font-medium tracking-[0.22em] text-[0.65rem] uppercase mb-3 block">
                        ✦ Your Personal Collection
                    </span>

                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight leading-tight">
                        My Wishlist
                    </h1>

                    {wishlist.length > 0 && (
                        <motion.span
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
                            className="inline-block text-[0.7rem] font-medium tracking-widest uppercase text-sky-600 bg-sky-50 border border-sky-200/60 px-4 py-1.5 rounded-full mb-5"
                        >
                            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
                        </motion.span>
                    )}

                    {/* Decorative divider */}
                    <div className="flex items-center justify-center gap-3 mt-2">
                        <div className="w-16 h-px bg-gradient-to-r from-transparent to-slate-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <div className="w-16 h-px bg-gradient-to-l from-transparent to-slate-300" />
                    </div>
                </motion.div>

                {/* ── Empty State ─────────────────────────────────────── */}
                {wishlist.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center justify-center mx-auto max-w-md text-center
                                   bg-white/70 backdrop-blur-xl border border-white/90
                                   rounded-[2rem] px-10 py-16
                                   shadow-[0_4px_6px_rgba(0,0,0,0.03),0_20px_60px_rgba(0,0,0,0.07)]"
                    >
                        {/* Pulsing icon with ripple rings */}
                        <div className="relative w-20 h-20 flex items-center justify-center mb-7">
                            <div className="absolute inset-0 rounded-full border border-rose-300/40 animate-ping" />
                            <div className="absolute inset-0 rounded-full border border-rose-200/30 animate-ping [animation-delay:0.6s]" />
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                                <FiHeart size={28} className="text-rose-400" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                            Nothing saved yet
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            You haven't saved any fresh catches yet.<br />
                            Dive into the market and heart what you love!
                        </p>

                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-sky-500 to-cyan-500
                                       text-white text-sm font-semibold rounded-full
                                       shadow-[0_8px_24px_rgba(14,165,233,0.35)]
                                       hover:shadow-[0_12px_32px_rgba(14,165,233,0.5)]
                                       hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            Start Exploring
                            <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </motion.div>

                ) : (
                    /* ── Product Grid ───────────────────────────────── */
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-7"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        <AnimatePresence mode="popLayout">
                            {wishlist.map((product) => (
                                <motion.div
                                    key={product._id}
                                    layout
                                    variants={cardVariants}
                                    exit="exit"
                                    className="rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                                >
                                    <EnhancedProductCard
                                        product={product}
                                        onWishlistChange={handleRemoveFromWishlist}
                                        isWishlistMode={true}
                                        globalDiscount={globalDiscount}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

            </div>
        </div>
    );
}