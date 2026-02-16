import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedProductCard from "../components/EnhancedProductCard";
import { FiHeart, FiArrowRight } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Wishlist() {
    const { user } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, [user]);

    const fetchWishlist = async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${API_URL}/api/user/wishlist`, {
                withCredentials: true,
            });
            setWishlist(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch wishlist", err);
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = (productId) => {
        setWishlist((prev) => prev.filter((item) => item._id !== productId));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-28 pb-20 px-4 transition-colors duration-500">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest text-xs uppercase mb-2 block">
                        Your Personal Collection
                    </span>
                    <h1 className="text-3xl md:text-4xl font-sans font-bold text-slate-900 dark:text-white mb-4">
                        My Wishlist
                    </h1>
                    <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full" />
                </motion.div>

                {wishlist.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 mx-auto max-w-2xl px-6 text-center"
                    >
                        <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-6">
                            <FiHeart size={40} className="text-red-400 dark:text-red-500/50" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Your Heart is Empty
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                            You haven't saved any fresh catches yet. Explore our market and save your favorites for later!
                        </p>
                        <Link
                            to="/products"
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 group"
                        >
                            Start Shopping
                            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                        <AnimatePresence>
                            {wishlist.map((product) => (
                                <motion.div
                                    key={product._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <EnhancedProductCard
                                        product={product}
                                        onWishlistChange={handleRemoveFromWishlist} // Pass callback to remove from list instantly
                                        isWishlistMode={true}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
