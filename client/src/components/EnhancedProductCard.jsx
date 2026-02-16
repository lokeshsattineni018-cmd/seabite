import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiShoppingBag, FiCheck } from "react-icons/fi"; // Used feather icons for cleaner look
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const EnhancedProductCard = ({ product, onWishlistChange }) => {
    const { addToCart } = useContext(CartContext);
    const { user, refreshMe } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);

    // Check if product is in user's wishlist
    const isWishlisted = user?.wishlist?.some(
        (item) => (typeof item === "string" ? item : item._id) === product._id
    );

    const getImageUrl = (path) => {
        if (!path) return "https://placehold.co/400?text=No+Image";
        return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAdding(true);

        // Simulate small delay for feedback
        setTimeout(() => {
            addToCart({ ...product, quantity: 1 });
            toast.success(`Added ${product.name}`, {
                style: { background: '#10b981', color: '#fff', fontSize: '12px' },
                icon: '🛒'
            });
            setIsAdding(false);
        }, 600);
    };

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Login to save items");
            return navigate("/login");
        }

        setLoadingWishlist(true);
        try {
            await axios.post(
                `${API_URL}/api/user/wishlist/${product._id}`,
                {},
                { withCredentials: true }
            );

            await refreshMe();
            if (onWishlistChange && isWishlisted) {
                onWishlistChange(product._id);
            }
        } catch (err) {
            // silent fail or minimal toast
        } finally {
            setLoadingWishlist(false);
        }
    };

    const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (
        <Link to={`/products/${product._id}`} className="block h-full group">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl overflow-hidden h-full flex flex-col shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative">

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    {product.trending && (
                        <span className="bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm tracking-wider uppercase">
                            HOT
                        </span>
                    )}
                    {isNew && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wider uppercase">
                            NEW
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistToggle}
                    disabled={loadingWishlist}
                    className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isWishlisted
                            ? "bg-red-50 text-red-500"
                            : "bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                >
                    <FiHeart size={16} fill={isWishlisted ? "currentColor" : "none"} className={loadingWishlist ? "animate-pulse" : ""} />
                </button>

                {/* Image Area - Clean & Spacious */}
                <div className="h-48 md:h-56 p-4 flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                </div>

                {/* Content Area - Minimal */}
                <div className="p-4 flex flex-col flex-grow">
                    <div className="mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {product.category || "Fresh"}
                        </p>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {product.name}
                        </h3>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                        <div>
                            <p className="text-xs text-slate-500 line-through">₹{(product.basePrice * 1.2).toFixed(0)}</p>
                            <p className="font-extrabold text-slate-900 dark:text-white text-lg">
                                ₹{product.basePrice}
                            </p>
                        </div>

                        {/* Compact Add Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={!product.stock || isAdding}
                            className={`h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wide transition-all ${!product.stock
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : isAdding
                                        ? "bg-emerald-500 text-white"
                                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white dark:hover:text-white"
                                }`}
                        >
                            {isAdding ? (
                                <FiCheck size={14} />
                            ) : !product.stock ? (
                                "Sold"
                            ) : (
                                <>
                                    Add <FiShoppingBag size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EnhancedProductCard;
