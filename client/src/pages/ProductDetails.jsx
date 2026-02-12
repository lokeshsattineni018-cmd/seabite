import { useParams, Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext";
import { addToCart } from "../utils/cartStorage";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTruck,
  FiInfo,
  FiCheck,
  FiPackage,
} from "react-icons/fi";

const API_URL =
  import.meta.env.VITE_API_URL || "";

export default function ProductDetails() {
  const { id } = useParams();
  const { refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");
  const [isAdded, setIsAdded] = useState(false);

  // Derived state (safe to calc even if product is null initially)
  const basePrice = product ? parseFloat(product.basePrice) : 0;
  const totalPrice = (basePrice * qty).toFixed(2);

  // ✅ FIX: Enhanced Image Loader logic
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    
    // If it's already a full URL (like Cloudinary), return it as is
    if (imagePath.startsWith("http")) return imagePath;
    
    // Normalize path to ensure it starts with /uploads or /
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    
    // If path doesn't start with /uploads, assume it needs it (optional, depends on your DB)
    if (!cleanPath.startsWith("/uploads")) {
        return `${API_URL}/uploads${cleanPath}`;
    }
    
    return `${API_URL}${cleanPath}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true); // Ensure loader shows on id change
    axios
      .get(`${API_URL}/api/products/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch product:", err);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ ...product, qty: qty, price: parseFloat(totalPrice) });
    refreshCartCount();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6" />
        <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">
          Loading Fresh Catch...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] text-center px-4">
        <FiPackage className="text-slate-300 mb-4" size={48} />
        <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
          Item Not Found
        </h2>
        <p className="text-slate-500 mb-6">
          We couldn't find the fresh catch you were looking for.
        </p>
        <Link
          to="/products"
          className="px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Back to Market
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] relative font-sans pt-24 md:pt-28 pb-12 md:pb-20 px-4 md:px-6 transition-colors duration-500 overflow-x-hidden">
      {/* SOFT AMBIENT BACKGROUND */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/40 to-transparent dark:from-blue-900/10 pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back Navigation */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors mb-6 md:mb-10 text-xs md:text-sm font-bold tracking-wide group"
        >
          <FiArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Market
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start">
          {/* ================= LEFT: PRODUCT IMAGE ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative w-full"
          >
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none aspect-square flex items-center justify-center relative overflow-hidden group border border-slate-100 dark:border-white/5">
              {/* Soft Glow Behind Image */}
              <div className="absolute w-[80%] h-[80%] bg-blue-500/5 rounded-full blur-3xl" />

              <motion.img
                key={product.image}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src={getFullImageUrl(product.image)}
                alt={product.name}
                className="relative z-10 w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500 ease-out"
              />

              {/* Trending Badge */}
              {product.trending && (
                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 bg-blue-600/90 backdrop-blur text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                  Trending
                </div>
              )}
            </div>
          </motion.div>

          {/* ================= RIGHT: PRODUCT DETAILS ================= */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col h-full justify-center pt-2 md:pt-4"
          >
            <span className="text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3">
              Fresh From The Sea
            </span>

            <h1 className="text-3xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-3 md:mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Price & Status */}
            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <p className="text-2xl md:text-3xl font-sans font-bold text-slate-900 dark:text-white">
                ₹{basePrice.toFixed(2)}
                <span className="text-base md:text-lg text-slate-400 font-normal ml-1">
                  /{product.unit || "kg"}
                </span>
              </p>

              <div className="h-6 md:h-8 w-px bg-slate-200 dark:bg-white/10" />

              {product.stock === "out" ? (
                <span className="px-2.5 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full">
                  Sold Out
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 md:gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
                  In Stock
                </span>
              )}
            </div>

            {/* Tabs Area */}
            <div className="mb-8 md:mb-10">
              <div className="flex gap-6 md:gap-8 border-b border-slate-200 dark:border-slate-700 mb-4 md:mb-6 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("desc")}
                  className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                    activeTab === "desc"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
                  }`}
                >
                  Description
                  {activeTab === "desc" && (
                    <motion.div
                      layoutId="tabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                    activeTab === "shipping"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 hover:text-slate-600 dark:text-slate-500"
                  }`}
                >
                  Delivery
                  {activeTab === "shipping" && (
                    <motion.div
                      layoutId="tabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    />
                  )}
                </button>
              </div>

              <div className="min-h-[60px] md:min-h-[80px]">
                <AnimatePresence mode="wait">
                  {activeTab === "desc" ? (
                    <motion.p
                      key="desc"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base"
                    >
                      {product.desc ||
                        "Premium quality seafood sourced directly from local fishermen. Guaranteed fresh and stored at optimal temperatures to maintain flavor and texture."}
                    </motion.p>
                  ) : (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="grid grid-cols-1 gap-3 md:gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <FiTruck className="text-blue-600 mt-1 shrink-0" />
                        <div>
                          <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                            Express Delivery
                          </p>
                          <p className="text-xs md:text-sm text-slate-500">
                            Delivered within 1-2 days of order confirmation.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FiInfo className="text-blue-600 mt-1 shrink-0" />
                        <div>
                          <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                            Packaging
                          </p>
                          <p className="text-xs md:text-sm text-slate-500">
                            Vacuum sealed to ensure maximum freshness.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ACTION AREA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 md:pt-8 border-t border-slate-100 dark:border-white/10">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1.5 w-full sm:w-48 shadow-sm">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-white transition-colors"
                >
                  <FiMinus size={14} />
                </button>

                <span className="font-bold text-slate-900 dark:text-white text-base md:text-lg">
                  {qty}
                </span>

                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-white transition-colors"
                >
                  <FiPlus size={14} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                whileHover={
                  !isAdded && product.stock !== "out" ? { scale: 1.02 } : {}
                }
                whileTap={
                  !isAdded && product.stock !== "out" ? { scale: 0.98 } : {}
                }
                onClick={handleAddToCart}
                disabled={isAdded || product.stock === "out"}
                className={`
                  flex-1 py-3.5 md:py-4 px-6 md:px-8 rounded-full font-bold text-xs md:text-sm uppercase tracking-wider shadow-lg transition-all duration-300 flex items-center justify-center gap-2 md:gap-3
                  ${
                    isAdded
                      ? "bg-emerald-500 text-white shadow-emerald-500/20"
                      : product.stock === "out"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-200 hover:text-white"
                  }
                `}
              >
                {isAdded ? (
                  <>
                    <FiCheck size={18} /> Added
                  </>
                ) : product.stock === "out" ? (
                  "Sold Out"
                ) : (
                  <>
                    <FiShoppingBag size={16} /> ₹{totalPrice} — Add
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}