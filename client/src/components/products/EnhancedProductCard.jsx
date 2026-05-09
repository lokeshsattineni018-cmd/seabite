import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiX, FiZap, FiShoppingCart, FiCheck, FiLayers } from "react-icons/fi";
import { CompareContext } from "../../context/CompareContext";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "../../utils/toast"; // Custom SeaBite toast
import triggerHaptic from "../../utils/haptics"; // 📱 Haptic feedback
import axios from "axios";
import Magnetic from "../common/Magnetic";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── Design Tokens ───────────────────────────────────────────────────────────
// Primary:    Seafoam   #5BBFB5
// Secondary:  Sky       #7EB8D4
// Accent:     Coral     #F07468
// Surface:    White     #FFFFFF
// Background: Off-white #F4F9F8
// Border:     Mist      #E2EEEC
// Text-1:     Slate     #1A2E2C
// Text-2:     Drift     #6B8F8A
// ─────────────────────────────────────────────────────────────────────────────

const EnhancedProductCard = ({
  product,
  onWishlistChange,
  onAddToCart,
  isWishlistMode = false,
  globalDiscount = 0,
}) => {
  const { addToCart, refreshCartCount } = useContext(CartContext);
  const { user, refreshMe } = useContext(AuthContext);
  const { compareItems, toggleCompare } = useContext(CompareContext);
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const [flyItems, setFlyItems] = useState([]);
  const flyIdRef = useRef(0);
  const prefetchTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    // Wait 100ms before prefetching to avoid unnecessary requests on quick mouse pass-through
    prefetchTimeoutRef.current = setTimeout(() => {
      axios.get(`${API_URL}/api/products/${product._id}`).catch(() => {});
    }, 100);
  };

  const handleMouseLeave = () => {
    if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current);
  };

  const isActiveFlashSale =
    product.flashSale?.isFlashSale &&
    new Date(product.flashSale.saleEndDate) > new Date();

  let displayPrice = isActiveFlashSale
    ? product.flashSale.discountPrice
    : product.basePrice;
  const globalDiscountApplied = !isActiveFlashSale && globalDiscount > 0;

  if (globalDiscountApplied) {
    displayPrice = Math.round(product.basePrice * (1 - globalDiscount / 100));
  }

  const discountPct = isActiveFlashSale
    ? Math.round((1 - product.flashSale.discountPrice / product.basePrice) * 100)
    : globalDiscountApplied
      ? globalDiscount
      : 0;

  useEffect(() => {
    if (!isActiveFlashSale) return;
    const timer = setInterval(() => {
      const diff = new Date(product.flashSale.saleEndDate) - new Date();
      if (diff <= 0) { setTimeLeft("EXPIRED"); clearInterval(timer); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [product.flashSale, isActiveFlashSale]);

  useEffect(() => {
    if (user?.wishlist) {
      setIsWishlisted(
        user.wishlist.some(
          (item) => (typeof item === "string" ? item : item._id) === product._id
        )
      );
    } else {
      setIsWishlisted(false);
    }
  }, [user, product._id]);

  const getImageUrl = (path) => {
    if (!path) return "https://placehold.co/400?text=No+Image";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return cleanPath.startsWith("/uploads")
      ? `${API_URL}${cleanPath}`
      : `${API_URL}/uploads${cleanPath}`;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);

    // Safety reset: if anything hangs, ensure we go back to "Add to Cart" after 4s
    const safetyTimer = setTimeout(() => setIsAdding(false), 4000);

    try {
      const btn = e.currentTarget;
      const btnRect = btn.getBoundingClientRect();
      
      const cartIcons = Array.from(document.querySelectorAll('[data-cart-icon]'));
      const cartIconEl = cartIcons.find(icon => {
        const r = icon.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      const cartRect = cartIconEl 
          ? cartIconEl.getBoundingClientRect() 
          : { left: window.innerWidth - 40, top: 20, width: 30, height: 30 };
      
      const startX = btnRect.left + btnRect.width / 2 - 25;
      const startY = btnRect.top + btnRect.height / 2 - 25;
      const endX = cartRect.left + cartRect.width / 2 - 10;
      const endY = cartRect.top + cartRect.height / 2 - 10;

      const flyId = ++flyIdRef.current;
      setFlyItems(prev => [...prev, {
        id: flyId,
        startX, startY, endX, endY,
        image: getImageUrl(product.image)
      }]);
      
      setTimeout(() => {
        if (cartIconEl) {
          cartIconEl.animate([
            { transform: "scale(1)" }, { transform: "scale(1.5)" }, 
            { transform: "scale(0.9)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }
          ], { duration: 500, easing: "ease-out" });
        }
      }, 1100);

    } catch (err) { 
      console.error("Cart animation computation failed: ", err);
      setIsAdding(false);
      clearTimeout(safetyTimer);
    }

    setTimeout(() => {
      try {
        triggerHaptic("medium"); // 📳 Haptic vibration
        addToCart({ ...product, quantity: 1, price: parseFloat(displayPrice), originalPrice: parseFloat(product.basePrice) });
        refreshCartCount();
        toast.success(`${product.name} added`, {
          icon: "🛒",
        });
        if (onAddToCart) onAddToCart(product._id);
      } finally {
        setIsAdding(false);
        clearTimeout(safetyTimer);
      }
    }, 1100); 
  };

  const handleFlyComplete = useCallback((fId) => {
    setFlyItems((prev) => prev.filter((item) => item.id !== fId));
  }, []);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic("soft"); // 📳 Haptic vibration
    if (!user) {
      toast.error("Please login to save items"); return navigate("/login"); }
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    setLoadingWishlist(true);
    try {
      await axios.post(`${API_URL}/api/user/wishlist/${product._id}`, {}, { withCredentials: true });
      await refreshMe();
      toast.success(prev ? "Removed from wishlist" : "Saved to wishlist", {
        style: { borderRadius: "12px", fontSize: "13px" },
        icon: prev ? "💔" : "❤️",
      });
      if (onWishlistChange && prev) onWishlistChange(product._id);
    } catch {
      setIsWishlisted(prev);
      toast.error("Failed to update wishlist");
    } finally {
      setLoadingWishlist(false);
    }
  };

  const isOutOfStock = product.stock === "out" || (product.countInStock !== undefined && product.countInStock <= 0);
  const isNew =
    product.createdAt &&
    new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <div
      className="product-card-root"
      style={{
        background: "#fff",
        border: "1px solid #f3f4f6",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <style>{`
        .product-card-root:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
          border-color: #5BBFB544;
        }
        .product-name-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.6em;
          line-height: 1.3;
        }
      `}</style>

      {/* Image Section */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden" }}>
        <Link to={`/products/${product._id}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <img 
            src={getImageUrl(product.image)} 
            alt={product.name} 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover",
              transition: "all 0.5s ease",
              transform: imageLoaded ? "scale(1)" : "scale(1.05)",
              opacity: imageLoaded ? 1 : 0
            }} 
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className="hover-zoom"
          />
          {isOutOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
              <span style={{ background: "#000", color: "#fff", fontSize: "10px", fontWeight: "800", padding: "6px 12px", borderRadius: "6px", letterSpacing: "0.05em" }}>SOLD OUT</span>
            </div>
          )}
        </Link>
        
        {/* Badges */}
        <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {product.trending && (
            <span style={{ background: "#1A2E2C", color: "#FFD700", fontSize: "8px", fontWeight: "900", padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase" }}>HOT</span>
          )}
          {discountPct > 0 && (
            <span style={{ background: "#F07468", color: "#fff", fontSize: "8px", fontWeight: "900", padding: "3px 8px", borderRadius: "4px" }}>-{discountPct}%</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={loadingWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: "10px", right: "10px",
            width: "34px", height: "34px",
            background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isWishlisted ? "#F07468" : "#000",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            cursor: "pointer",
            zIndex: 10,
            transition: "all 0.2s ease"
          }}
        >
          <FiHeart size={15} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info Section */}
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <Link to={`/products/${product._id}`} style={{ textDecoration: "none" }}>
          <h3 className="product-name-clamp" style={{ 
            fontSize: "15px", 
            fontWeight: "600", 
            color: "#1A2E2C", 
            marginBottom: "10px"
          }}>
            {product.name}
          </h3>
        </Link>

        {/* Action Row */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#1A2E2C" }}>
                ₹{displayPrice}
              </span>
              {product.basePrice > displayPrice && (
                <span style={{ fontSize: "12px", color: "#6B8F8A", textDecoration: "line-through", fontWeight: "500" }}>
                  ₹{product.basePrice}
                </span>
              )}
            </div>
            <span style={{ fontSize: "10px", color: "#6B8F8A", fontWeight: "600" }}>per {product.unit || "kg"}</span>
          </div>
          
          <motion.button
            whileHover={!isOutOfStock ? { 
              scale: 1.05,
              boxShadow: "0 8px 20px rgba(91,191,181,0.3)"
            } : {}}
            whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            aria-label={isOutOfStock ? "Out of stock" : "Add to cart"}
            style={{
              background: isOutOfStock ? "#E5E7EB" : "#5BBFB5",
              color: isOutOfStock ? "#9CA3AF" : "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: isOutOfStock ? "none" : "0 4px 12px rgba(91,191,181,0.2)",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            {isAdding ? "..." : isOutOfStock ? "Out of Stock" : (
              <>
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <FiShoppingCart size={14} />
                </motion.span>
                Add
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Fly Animation Portal */}
      {typeof document !== "undefined" && createPortal(
        flyItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ left: item.startX, top: item.startY, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ left: item.endX, top: item.endY, opacity: 0.6, scale: 0.2, rotate: 90 }}
            transition={{ duration: 1.1 }}
            onAnimationComplete={() => handleFlyComplete(item.id)}
            style={{ position: "fixed", width: "60px", height: "60px", zIndex: 99999999, borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
          >
            <img src={item.image} alt="Flying" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>
        )),
        document.body
      )}
    </div>
  );
};

export default EnhancedProductCard;