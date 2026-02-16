import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiX, FiZap } from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

const EnhancedProductCard = ({ product, onWishlistChange, isWishlistMode = false }) => {
    const { addToCart } = useContext(CartContext);
    const { user, refreshMe } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);

    // Optimistic Wishlist State
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    const isActiveFlashSale = product.flashSale?.isFlashSale &&
        new Date(product.flashSale.saleEndDate) > new Date();

    const displayPrice = isActiveFlashSale ? product.flashSale.discountPrice : product.basePrice;

    useEffect(() => {
        if (!isActiveFlashSale) return;

        const timer = setInterval(() => {
            const end = new Date(product.flashSale.saleEndDate);
            const now = new Date();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft("EXPIRED");
                clearInterval(timer);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [product.flashSale, isActiveFlashSale]);

    useEffect(() => {
        if (user && user.wishlist) {
            const exists = user.wishlist.some(
                (item) => (typeof item === "string" ? item : item._id) === product._id
            );
            setIsWishlisted(exists);
        } else {
            setIsWishlisted(false);
        }
    }, [user, product._id]);

    const getImageUrl = (path) => {
        if (!path) return "https://placehold.co/400?text=No+Image";
        return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAdding(true);

        setTimeout(() => {
            addToCart({
                ...product,
                quantity: 1,
                price: parseFloat(displayPrice)
            });
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

        const previousState = isWishlisted;
        setIsWishlisted(!previousState); // Optimistic update
        setLoadingWishlist(true);

        try {
            await axios.post(
                `${API_URL}/api/user/wishlist/${product._id}`,
                {},
                { withCredentials: true }
            );

            await refreshMe();

            if (!previousState && !isWishlistMode) {
                toast.success("Added to Wishlist", {
                    style: { background: '#ef4444', color: '#fff', fontSize: '12px' },
                    icon: '❤️'
                });
            } else {
                toast.success("Removed from Wishlist", {
                    style: { fontSize: '12px' },
                    icon: '💔'
                });
            }

            if (onWishlistChange && previousState) {
                // If it was wishlisted and we toggled it (removed), notify parent instantly
                onWishlistChange(product._id);
            }
        } catch (err) {
            setIsWishlisted(previousState); // Revert on error
            toast.error("Failed to update wishlist");
        } finally {
            setLoadingWishlist(false);
        }
    };

    const isOutOfStock = product.stock === "out" || !product.stock;

    const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden h-full flex flex-col shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-lg relative group">

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointers-events-none">
                {product.trending && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">
                        HOT
                    </span>
                )}
                {isNew && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">
                        NEW
                    </span>
                )}
                {isActiveFlashSale && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md uppercase animate-pulse flex items-center gap-1">
                        <FiZap size={8} /> FLASH DEAL
                    </span>
                )}
            </div>

            {/* Wishlist/Remove Button */}
            <button
                onClick={handleWishlistToggle}
                disabled={loadingWishlist}
                className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors shadow-sm ${isWishlistMode
                    ? "bg-white text-slate-400 hover:bg-red-50 hover:text-red-500"
                    : isWishlisted
                        ? "text-red-600 bg-red-50"
                        : "text-slate-900 bg-white/80 hover:text-red-600 hover:bg-white"
                    }`}
                title={isWishlistMode ? "Remove from Wishlist" : isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
                {loadingWishlist ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isWishlistMode ? (
                    <FiX size={18} />
                ) : (
                    <FiHeart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                )}
            </button>

            {/* Image Area */}
            <Link to={`/products/${product._id}`} className="h-48 p-4 flex items-center justify-center bg-white dark:bg-[#0f172a] overflow-hidden">
                <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                    loading="lazy"
                />
            </Link>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
                        {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {product.category || "Fresh Catch"}
                    </p>
                </div>

                {/* Stock Indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${!isOutOfStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${!isOutOfStock ? 'text-slate-500' : 'text-red-500'}`}>
                        {!isOutOfStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>

                <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-sm text-slate-400 line-through">
                            ₹{(isActiveFlashSale ? product.basePrice : product.basePrice * 1.2).toFixed(0)}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-xl">
                            ₹{displayPrice}
                        </span>
                        {isActiveFlashSale && timeLeft && (
                            <span className="ml-auto text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100 uppercase tracking-tighter">
                                {timeLeft}
                            </span>
                        )}
                    </div>

                    {/* Outlined Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || isAdding}
                        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all border ${isOutOfStock
                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                            : isAdding
                                ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                : "bg-white dark:bg-transparent border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            }`}
                    >
                        {isAdding ? "Added" : isOutOfStock ? "Sold Out" : "Add to Cart"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnhancedProductCard;
