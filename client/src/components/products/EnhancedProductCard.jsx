import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiShoppingCart, FiZap, FiCheck, FiArrowRight, FiPlus } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "../../utils/toast"; 
import triggerHaptic from "../../utils/haptics"; 
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * 🌊 EnhancedProductCard: Liquid Luxury Edition
 * Premium coastal aesthetic with ultra-smooth interactions.
 */
const EnhancedProductCard = ({
  product,
  onWishlistChange,
  onAddToCart,
  globalDiscount = 0,
}) => {
  const { addToCart, refreshCartCount } = useContext(CartContext);
  const { user, refreshMe } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [flyItems, setFlyItems] = useState([]);
  const flyIdRef = useRef(0);

  // 1. Flash Sale & Pricing Logic
  const isActiveFlashSale = product.flashSale?.isFlashSale && new Date(product.flashSale.saleEndDate) > new Date();
  let displayPrice = isActiveFlashSale ? product.flashSale.discountPrice : product.basePrice;
  const globalDiscountApplied = !isActiveFlashSale && globalDiscount > 0;
  if (globalDiscountApplied) displayPrice = Math.round(product.basePrice * (1 - globalDiscount / 100));
  
  const discountPct = isActiveFlashSale
    ? Math.round((1 - product.flashSale.discountPrice / product.basePrice) * 100)
    : globalDiscountApplied ? globalDiscount : 0;

  // 2. Robust Wishlist Sync
  useEffect(() => {
    if (user?.wishlist) {
      const isSaved = user.wishlist.some(item => {
        const id = typeof item === 'object' ? (item._id || item.id) : item;
        return id?.toString() === product._id?.toString();
      });
      setIsWishlisted(isSaved);
    } else {
      setIsWishlisted(false);
    }
  }, [user?.wishlist, product._id]);

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/400?text=No+Image";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return cleanPath.startsWith("/uploads") ? `${API_URL}${cleanPath}` : `${API_URL}/uploads${cleanPath}`;
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      triggerHaptic("rigid");
      return window.dispatchEvent(new CustomEvent('open-auth-drawer'));
    }
    
    triggerHaptic("soft");
    const prevState = isWishlisted;
    setIsWishlisted(!prevState); // Optimistic Update
    setLoadingWishlist(true);

    try {
      await axios.post(`${API_URL}/api/user/wishlist/${product._id}`, {}, { withCredentials: true });
      await refreshMe();
      toast.success(prevState ? "Removed from wishlist" : "Added to wishlist", {
        icon: prevState ? "💔" : "❤️",
      });
      if (onWishlistChange && prevState) onWishlistChange(product._id);
    } catch (err) {
      setIsWishlisted(prevState); // Rollback
      toast.error("Wishlist sync failed");
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || product.stock === "out") return;
    setIsAdding(true);

    const btnRect = e.currentTarget.getBoundingClientRect();
    const cartIconEl = document.querySelector('[data-cart-icon]');
    const cartRect = cartIconEl ? cartIconEl.getBoundingClientRect() : { left: window.innerWidth - 40, top: 20 };

    const flyId = ++flyIdRef.current;
    setFlyItems(prev => [...prev, {
      id: flyId,
      startX: btnRect.left + btnRect.width/2,
      startY: btnRect.top + btnRect.height/2,
      endX: cartRect.left + 15,
      endY: cartRect.top + 15,
      image: getImageUrl(product.image)
    }]);

    setTimeout(() => {
      triggerHaptic("medium");
      addToCart({ ...product, quantity: 1, price: parseFloat(displayPrice), originalPrice: parseFloat(product.basePrice) });
      refreshCartCount();
      setIsAdding(false);
      toast.success(`${product.name} added!`, { icon: "🛒" });
    }, 1000);
  };

  const isOutOfStock = product.stock === "out" || product.countInStock <= 0;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        background: "#FFFFFF",
        borderRadius: "24px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        border: "1.5px solid #F0F4F4",
        boxShadow: "0 10px 40px rgba(26, 46, 44, 0.03)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* 🖼️ Premium Image Container */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#F9FBFA" }}>
        <Link to={`/products/${product._id}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <motion.img 
            src={getImageUrl(product.image)} 
            alt={product.name}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 1.1 }}
            transition={{ duration: 0.6 }}
            onLoad={() => setImageLoaded(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {isOutOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ background: "#1A2E2C", color: "#FFF", fontSize: "11px", fontWeight: "800", padding: "8px 16px", borderRadius: "100px", letterSpacing: "0.05em" }}>SOLD OUT</span>
            </div>
          )}
        </Link>

        {/* 🏷️ Glassmorphic Badges */}
        <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
          {isActiveFlashSale ? (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(240, 116, 104, 0.95)",
                backdropFilter: "blur(12px)",
                color: "#FFF",
                padding: "6px 12px", 
                borderRadius: "100px",
                fontSize: "10px", 
                fontWeight: 800,
                boxShadow: "0 4px 15px rgba(240, 116, 104, 0.2)",
                display: "flex", 
                alignItems: "center", 
                gap: "6px",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              <FiZap size={12} fill="currentColor" />
              <span>Flash Sale</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>{discountPct}% OFF</span>
            </motion.div>
          ) : (
            discountPct > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(12px)",
                  color: "#1A2E2C",
                  padding: "5px 10px", 
                  borderRadius: "100px",
                  fontSize: "10px", 
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.03)",
                  display: "flex", 
                  alignItems: "center", 
                  gap: "5px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#5BBFB5" }} />
                {discountPct}% OFF
              </motion.div>
            )
          )}
        </div>

        {/* ❤️ Luxury Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWishlistToggle}
          disabled={loadingWishlist}
          style={{
            position: "absolute", top: "16px", right: "16px",
            width: "42px", height: "42px",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isWishlisted ? "#F07468" : "#1A2E2C",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            cursor: "pointer",
            zIndex: 5
          }}
        >
          <FiHeart size={18} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* ✍️ Content Section */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {product.category || "Fresh Catch"}
          </span>
          <Link to={`/products/${product._id}`} style={{ textDecoration: "none" }}>
            <h3 style={{ 
              fontSize: "17px", 
              fontWeight: "700", 
              color: "#1A2E2C", 
              marginTop: "4px",
              lineHeight: 1.3,
              height: "2.6em",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical"
            }}>
              {product.name}
            </h3>
          </Link>
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "24px", fontWeight: "800", color: "#1A2E2C" }}>₹{displayPrice}</span>
              {product.basePrice > displayPrice && (
                <span style={{ fontSize: "13px", color: "#6B8F8A", textDecoration: "line-through", fontWeight: "500" }}>₹{product.basePrice}</span>
              )}
            </div>
            <p style={{ fontSize: "11px", color: "#6B8F8A", fontWeight: "600", marginTop: "2px" }}>
              Net Wt: <span style={{ color: "#1A2E2C" }}>{product.unit || "500g"}</span>
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#4AA89F" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            style={{
              background: isOutOfStock ? "#F1F5F5" : "#5BBFB5",
              color: isOutOfStock ? "#9CA3AF" : "#FFF",
              border: "none",
              borderRadius: "10px",
              height: "38px",
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              boxShadow: isOutOfStock ? "none" : "0 4px 14px rgba(91,191,181,0.25)",
              transition: "all 0.3s ease",
              fontFamily: "inherit"
            }}
          >
            {isAdding ? <FiCheck size={14} /> : <FiShoppingCart size={14} />}
            {isOutOfStock ? "Out of Stock" : (isAdding ? "Added" : "Add")}
          </motion.button>
        </div>
      </div>

      {/* 🚀 Fly Animation Portal */}
      {typeof document !== "undefined" && createPortal(
        flyItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ left: item.startX, top: item.startY, opacity: 1, scale: 0.8 }}
            animate={{ left: item.endX, top: item.endY, opacity: 0.2, scale: 0.1, rotate: 360 }}
            transition={{ duration: 0.8, ease: "circIn" }}
            onAnimationComplete={() => setFlyItems(prev => prev.filter(f => f.id !== item.id))}
            style={{ position: "fixed", width: "40px", height: "40px", zIndex: 999999, borderRadius: "50%", overflow: "hidden", border: "2px solid #5BBFB5" }}
          >
            <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>
        )),
        document.body
      )}
    </motion.div>
  );
};

export default EnhancedProductCard;