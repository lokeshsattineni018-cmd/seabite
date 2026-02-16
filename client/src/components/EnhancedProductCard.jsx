import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star } from "lucide-react";
import { FiHeart } from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const EnhancedProductCard = ({ product, onWishlistChange }) => {
    const { addToCart } = useContext(CartContext);
    const { user, refreshMe } = useContext(AuthContext); // Get user context
    const navigate = useNavigate();

    const [quantity, setQuantity] = useState(1);
    const [showQuantity, setShowQuantity] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);

    // Check if product is in user's wishlist
    const isWishlisted = user?.wishlist?.some(
        (item) => (typeof item === "string" ? item : item._id) === product._id
    );

    const getImageUrl = (path) => {
        if (!path) return "";
        return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({ ...product, quantity });
        toast.success(`${quantity}x ${product.name} added to cart!`, {
            icon: "🛒",
        });
        setShowQuantity(false);
        setQuantity(1);
    };

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Please login to save items!");
            return navigate("/login");
        }

        setLoadingWishlist(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/user/wishlist/${product._id}`,
                {},
                { withCredentials: true }
            );

            toast.success(res.data.message, { icon: "❤️" });
            await refreshMe(); // Update local user context

            // Optional callback for parent to handle removal (e.g. in Wishlist page)
            if (onWishlistChange && isWishlisted) {
                onWishlistChange(product._id);
            }
        } catch (err) {
            toast.error("Failed to update wishlist");
        } finally {
            setLoadingWishlist(false);
        }
    };

    const getStockStatus = () => {
        if (!product.stock || product.stock === 0)
            return { label: "OUT OF STOCK", color: "bg-red-500" };
        if (product.stock < 10)
            return { label: "LOW STOCK", color: "bg-orange-500" };
        return { label: "IN STOCK", color: "bg-green-500" };
    };

    const stockStatus = getStockStatus();
    const isNew =
        product.createdAt &&
        new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (
        <Link to={`/products/${product._id}`} className="block h-full">
            <motion.div
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden h-full flex flex-col relative"
            >
                {/* Wishlist Button (Absolute Top Right) */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleWishlistToggle}
                    disabled={loadingWishlist}
                    className={`absolute top-3 right-3 z-20 p-2 rounded-full shadow-sm transition-all ${isWishlisted
                        ? "bg-red-50 text-red-500"
                        : "bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-500"
                        }`}
                >
                    <FiHeart
                        size={18}
                        fill={isWishlisted ? "currentColor" : "none"}
                        className={`${loadingWishlist ? "animate-pulse" : ""}`}
                    />
                </motion.button>

                {/* Image Section */}
                <div className="relative h-36 md:h-44 bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden">
                    <motion.img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        whileHover={{ scale: 1.12, rotate: 2 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.trending && (
                            <motion.span
                                initial={{ x: -60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1"
                            >
                                <Flame size={10} /> HOT
                            </motion.span>
                        )}
                        {isNew && (
                            <motion.span
                                initial={{ x: -60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
                            >
                                NEW
                            </motion.span>
                        )}
                        {product.stock < 10 && product.stock > 0 && (
                            <motion.span
                                initial={{ x: -60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
                            >
                                ONLY {product.stock} LEFT
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-3 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {product.netWeight || "Fresh Catch"}
                    </p>

                    {/* Stock Status */}
                    <div className="flex items-center gap-2 mb-3">
                        <div
                            className={`w-2 h-2 rounded-full ${stockStatus.color} animate-pulse`}
                        />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {stockStatus.label}
                        </span>
                        {/* Rating if available */}
                        {product.rating > 0 && (
                            <div className="flex items-center gap-1 ml-auto">
                                <Star size={12} className="text-amber-500" fill="currentColor" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="mt-auto">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <span className="text-xs text-slate-400 line-through mr-2">
                                    {"\u20B9"}{(product.basePrice * 1.2).toFixed(0)}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {"\u20B9"}{product.basePrice}
                                </span>
                            </div>
                        </div>

                        {/* Quick Add to Cart */}
                        <AnimatePresence mode="wait">
                            {showQuantity ? (
                                <motion.div
                                    key="quantity"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex gap-2"
                                >
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 flex-1 justify-between">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setQuantity(Math.max(1, quantity - 1));
                                            }}
                                            className="p-1 px-2 text-slate-500"
                                        >
                                            -
                                        </button>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setQuantity(quantity + 1);
                                            }}
                                            className="p-1 px-2 text-slate-500"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                                    >
                                        ADD
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowQuantity(false);
                                        }}
                                        className="bg-slate-200 text-slate-500 px-2 rounded-lg"
                                    >
                                        x
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="add-btn"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (product.stock && product.stock > 0) setShowQuantity(true);
                                    }}
                                    disabled={!product.stock || product.stock === 0}
                                    className={`w-full py-2 rounded-lg text-sm font-bold border border-blue-600 transition-colors ${!product.stock || product.stock === 0
                                        ? "opacity-50 cursor-not-allowed border-slate-300 text-slate-400"
                                        : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        }`}
                                >
                                    {(!product.stock || product.stock === 0) ? "Sold Out" : "Add to Cart"}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default EnhancedProductCard;
