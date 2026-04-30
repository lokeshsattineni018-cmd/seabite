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
        addToCart({ ...product, quantity: 1, price: parseFloat(displayPrice) });
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
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2EEEC",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 1px 4px rgba(91,191,181,0.06)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      className="product-card-hover group"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .product-card-hover:hover {
          box-shadow: 0 8px 32px rgba(91,191,181,0.14);
          transform: translateY(-2px);
          border-color: #B8DDD9;
        }
        .cart-btn-wave:hover {
          background: #5BBFB5 !important;
          color: white !important;
          border-color: #5BBFB5 !important;
        }
        
        .shimmer-badge {
          position: relative;
          overflow: hidden;
        }
        .shimmer-badge::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -60%;
          width: 20%;
          height: 200%;
          background: rgba(255, 255, 255, 0.4);
          transform: rotate(30deg);
          animation: shimmerSweep 3s infinite cubic-bezier(0.19, 1, 0.22, 1);
        }
        @keyframes shimmerSweep {
          0% { left: -60%; opacity: 0; }
          10% { opacity: 0.5; }
          20% { left: 140%; opacity: 0; }
          100% { left: 140%; opacity: 0; }
        }
      `}</style>
      
      {/* Framer Motion Parabolic Flight Animation (Immune to iOS Battery Saver) */}
      {typeof document !== "undefined" && createPortal(
        flyItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ left: item.startX, top: item.startY, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ left: item.endX, top: item.endY, opacity: 0.6, scale: 0.2, rotate: 90 }}
            transition={{ 
              duration: 1.1,
              left: { ease: "linear", duration: 1.1 },
              top: { ease: [0.3, -0.4, 0.7, 1], duration: 1.1 },
              scale: { ease: "easeOut", duration: 1.1 },
              rotate: { ease: "easeOut", duration: 1.1 },
            }}
            onAnimationComplete={() => handleFlyComplete(item.id)}
            style={{ 
              position: "fixed", 
              width: "60px", 
              height: "60px", 
              zIndex: 99999999, 
              pointerEvents: "none",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
            }}
          >
            <img src={item.image} alt="Flying item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>
        )),
        document.body
      )}

      {/* Badge Row */}
      <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 10 }}>
        {product.trending && (
          <span 
            className="shimmer-badge"
            style={{ 
              background: "#1A2E2C", // Dark obsidian for more premium 'HOT' feel
              color: "#FFD700", // Gold text
              fontSize: "9px", 
              fontWeight: "900", 
              padding: "4px 10px", 
              borderRadius: "6px", 
              letterSpacing: "0.1em", 
              textTransform: "uppercase",
              boxShadow: "0 2px 10px rgba(26,46,44,0.15)"
            }}
          >
            HOT
          </span>
        )}
        {isNew && !product.trending && (
          <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: "9px", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            NEW
          </span>
        )}
        {discountPct > 0 && (
          <span style={{
            background: isActiveFlashSale ? "#FEE2E2" : "#EDE9FE",
            color: isActiveFlashSale ? "#B91C1C" : "#6D28D9",
            fontSize: "9px", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.06em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: "3px"
          }}>
            {isActiveFlashSale && <FiZap size={7} />} -{discountPct}%
          </span>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={handleWishlistToggle}
        disabled={loadingWishlist}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute", top: "12px", right: "12px", zIndex: 20,
          width: "34px", height: "34px",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #E2EEEC",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          color: isWishlisted ? "#F07468" : "#A0B8B5",
          transition: "all 0.2s ease",
          backdropFilter: "blur(4px)",
        }}
      >
        {isWishlistMode ? (
          <FiX size={15} />
        ) : (
          <FiHeart size={15} fill={isWishlisted ? "currentColor" : "none"} />
        )}
      </button>

      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        style={{
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F9F8",
          overflow: "hidden",
          padding: "24px",
          position: "relative",
        }}
      >
        {isOutOfStock && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(244,249,248,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
          }}>
            <span style={{ background: "#F4F9F8", border: "1px solid #E2EEEC", color: "#9AB5B1", fontSize: "10px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              SOLD OUT
            </span>
          </div>
        )}
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "all 0.4s ease",
            transform: imageLoaded ? "scale(1)" : "scale(1.05)",
            opacity: imageLoaded ? 1 : 0
          }}
          onLoad={() => setImageLoaded(true)}
          className="group-hover:scale-105 product-image"
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Category */}
        <span style={{ fontSize: "10px", fontWeight: "700", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", display: "block" }}>
          {product.category || "Fresh Catch"}
        </span>

        {/* Name */}
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1A2E2C", lineHeight: "1.35", marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </h3>

        {/* Stock dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: !isOutOfStock ? "#5BBFB5" : "#FDA29B", flexShrink: 0 }} />
          <span style={{ fontSize: "10px", fontWeight: "600", color: !isOutOfStock ? "#5BBFB5" : "#F04438", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {!isOutOfStock ? "In Stock" : "Out of Stock"}
          </span>
          {isActiveFlashSale && timeLeft && (
            <span style={{ marginLeft: "auto", fontSize: "9px", fontWeight: "800", color: "#DC2626", background: "#FEF2F2", padding: "2px 6px", borderRadius: "6px" }}>
              ⏱ {timeLeft}
            </span>
          )}
        </div>

        {/* Compare Checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product); }}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px", 
              background: "none", 
              border: "none", 
              padding: 0, 
              cursor: "pointer", 
              fontSize: "11px", 
              fontWeight: "700", 
              color: compareItems?.find(i => i._id === product._id) ? "#5BBFB5" : "#A8C5C0",
              transition: "color 0.2s"
            }}
          >
            <div style={{ 
              width: "14px", 
              height: "14px", 
              borderRadius: "4px", 
              border: `1.5px solid ${compareItems?.find(i => i._id === product._id) ? "#5BBFB5" : "#DDE9E7"}`,
              background: compareItems?.find(i => i._id === product._id) ? "#5BBFB5" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}>
              {compareItems?.find(i => i._id === product._id) && <FiCheck size={10} style={{ color: "#fff" }} />}
            </div>
            Compare
          </button>
        </div>

        {/* Price + CTA */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "12px" }}>
            {(isActiveFlashSale || globalDiscountApplied) && (
              <span style={{ fontSize: "13px", color: "#B8CFCC", textDecoration: "line-through", fontWeight: "500" }}>
                ₹{product.basePrice}
              </span>
            )}
            <span style={{ fontSize: "22px", fontWeight: "800", color: "#1A2E2C", letterSpacing: "-0.02em" }}>
              ₹{displayPrice}
            </span>
            <span style={{ fontSize: "11px", color: "#9AB5B1", fontWeight: "500" }}>
              /{product.unit || "kg"}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="cart-btn-wave"
            aria-label={isAdding ? "Product added to cart" : isOutOfStock ? "Product sold out" : "Add product to cart"}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: "10px",
              border: "1.5px solid",
              borderColor: isOutOfStock ? "#E2EEEC" : isAdding ? "#5BBFB5" : "#5BBFB5",
              background: isAdding ? "#5BBFB5" : "transparent",
              color: isOutOfStock ? "#B8CFCC" : isAdding ? "#fff" : "#5BBFB5",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "0.02em",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isAdding ? (
                <><FiCheck size={14} /> Added</>
              ) : isOutOfStock ? (
                "Sold Out"
              ) : (
                <><FiShoppingCart size={14} /> Add to Cart</>
              )}
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cart-btn-wave { position: relative; overflow: hidden; }
        .cart-btn-wave:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
};

export default EnhancedProductCard;