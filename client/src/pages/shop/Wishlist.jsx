import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { ThemeContext } from "../../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import { FiHeart } from "react-icons/fi";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1, y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
        opacity: 0, scale: 0.95,
        transition: { duration: 0.2 },
    },
};

export default function Wishlist() {
    const { user, refreshMe } = useContext(AuthContext);
    const { addToCart, globalDiscount } = useContext(CartContext);
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

    const handleMoveToCart = (productId) => {
        const product = wishlist.find(p => p._id === productId);
        if (!product) return;

        // The EnhancedProductCard already handles the toast and addToCart
        // so we just need to ensure the wishlist UI updates.
        // But if called directly (e.g. from "Add all"), we handle it here.
        handleRemoveFromWishlist(productId);
    };

    const handleAddAllToCart = () => {
        if (wishlist.length === 0) return;

        wishlist.forEach(product => {
            // Calculate price with potential discount
            const isActiveFlashSale = product.flashSale?.isFlashSale && new Date(product.flashSale.saleEndDate) > new Date();
            let displayPrice = isActiveFlashSale ? product.flashSale.discountPrice : product.basePrice;
            if (!isActiveFlashSale && globalDiscount > 0) {
                displayPrice = Math.round(product.basePrice * (1 - globalDiscount / 100));
            }

            addToCart({ ...product, quantity: 1, price: parseFloat(displayPrice) });
        });

        // Bulk remove from backend (optional, but good practice if available)
        // For simplicity, we just clear the local state and refresh
        setWishlist([]);
        toast.success(`Success! ${wishlist.length} items moved to cart`, {
            style: { background: "#1A2E2C", color: "#fff", borderRadius: "12px" }
        });
    };

    if (loading) {
        return <SeaBiteLoader fullScreen />;
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-12 px-6 font-['Plus_Jakarta_Sans',_sans-serif]">
            <div className="max-w-7xl mx-auto">

                {/* ── Minimal Header (Apple/H&M Style) ── */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Wishlist
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">
                            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
                        </p>
                    </div>

                    {wishlist.length > 0 && (
                        <button
                            onClick={handleAddAllToCart}
                            className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                        >
                            Add all to cart
                        </button>
                    )}
                </div>

                {/* ── Empty State ── */}
                {wishlist.length === 0 ? (
                    <div className="text-center py-32">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiHeart size={32} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Your wishlist is empty
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                            Save items you love for later. They'll be waiting here for you.
                        </p>
                        <Link
                            to="/products"
                            className="mt-8 inline-block px-8 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    /* ── Product Grid ── */
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
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
                                    className="group relative"
                                >
                                    <EnhancedProductCard
                                        product={product}
                                        isWishlistMode={true}
                                        globalDiscount={globalDiscount}
                                        onAddToCart={handleMoveToCart}
                                        onWishlistChange={handleRemoveFromWishlist}
                                    />

                                    {/* Quick Move Overlay (Optional Mobile/Desktop Refinement) */}
                                    <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
                                        <div className="bg-black text-white text-[10px] font-black py-2 px-3 rounded-lg text-center shadow-xl uppercase tracking-widest">
                                            Quick View
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}