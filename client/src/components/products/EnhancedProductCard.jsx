import { useState, useContext, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiShoppingCart, FiZap, FiCheck, FiArrowRight, FiPlus } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "../../utils/toast"; 
import triggerHaptic from "../../utils/haptics"; 
import axios from "axios";
import { slugify } from "../../utils/slugify";

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
  
  let displayPrice = product.price || product.basePrice;
  if (isActiveFlashSale && product.flashSale.discountPrice) {
    displayPrice = product.flashSale.discountPrice;
  } else if (globalDiscount > 0) {
    displayPrice = Math.round(product.basePrice * (1 - globalDiscount / 100));
  }
  
  const discountPct = product.basePrice > displayPrice
    ? Math.round((1 - displayPrice / product.basePrice) * 100)
    : 0;

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

  const getUnitPriceString = () => {
    const unitStr = (product.unit || "").toLowerCase().trim();
    const price = parseFloat(displayPrice);
    
    if (unitStr.includes("kg")) {
      return `₹${Math.round(price)}/kg`;
    }
    
    const gramMatch = unitStr.match(/(\d+)\s*(g|gms|gram)/);
    if (gramMatch) {
      const grams = parseInt(gramMatch[1], 10);
      if (grams > 0) {
        const pricePerKg = Math.round((price / grams) * 1000);
        return `₹${pricePerKg}/kg`;
      }
    }
    
    return `₹${Math.round(price)}/pc`;
  };

  const isOutOfStock = product.stock === "out" || product.countInStock <= 0;

  return (
    <motion.div
      whileHover={isOutOfStock ? {} : { y: -6, boxShadow: "0 12px 24px rgba(0,0,0,0.06)", borderColor: "#E0E0E0" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        background: "#FFFFFF",
        borderRadius: "16px", // Licious clean rounded corners
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        border: "1px solid #E0E0E0", // Muted light border
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        contentVisibility: "auto",
        containIntrinsicSize: "0 380px",
        opacity: isOutOfStock ? 0.75 : 1,
        transition: "opacity 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* 🖼️ Image Container with Tendercuts Green Ribbon */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1.33/1", overflow: "hidden", background: "#F9FBFA" }}>
        <Link to={`/products/${slugify(product.name)}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <motion.img 
            src={getImageUrl(product.image)} 
            alt={product.name}
            width={400}
            height={300}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: imageLoaded ? (isOutOfStock ? 0.5 : 1) : 0, 
              filter: isOutOfStock ? "grayscale(35%)" : "none"
            }}
            transition={{ duration: 0.4 }}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {isOutOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ background: "#1A2E2C", color: "#FFF", fontSize: "10px", fontWeight: "800", padding: "6px 14px", borderRadius: "100px", letterSpacing: "0.05em" }}>SOLD OUT</span>
            </div>
          )}
        </Link>

        {/* 🟢 Tendercuts style solid green ribbon in top-left */}
        {discountPct > 0 && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            background: "#00B259", // Solid green
            color: "#FFF",
            padding: "5px 10px",
            fontSize: "11px",
            fontWeight: "800",
            borderBottomRightRadius: "8px",
            zIndex: 10,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            letterSpacing: "0.02em"
          }}>
            {discountPct}% OFF
          </div>
        )}

        {/* ❤️ Muted Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWishlistToggle}
          disabled={loadingWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: "12px", right: "12px",
            width: "36px", height: "36px",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isWishlisted ? "#FF3B30" : "#4A4A4A", // Red when wishlisted
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            zIndex: 5
          }}
        >
          <FiHeart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={isWishlisted ? 0 : 2.5} />
        </motion.button>
      </div>

      {/* ✍️ Compact Content Section */}
      <div style={{ padding: "14px 16px 16px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Title */}
        <Link to={`/products/${slugify(product.name)}`} style={{ textDecoration: "none" }}>
          <h3 style={{ 
            fontSize: "14.5px", 
            fontWeight: "700", 
            color: "#2B2B2B", 
            lineHeight: 1.3,
            height: "2.6em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            margin: 0
          }}>
            {product.name}
          </h3>
        </Link>

        {/* 🛵 Subtle 30 mins delivery line right under title */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px", color: "#9CA3AF", marginTop: "4px", fontWeight: "600", letterSpacing: "0.02em" }}>
          <span>🛵 30 mins delivery</span>
        </div>

        {/* Weight / Unit Metadata directly from backend (No static serves/pieces) */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "#7E7E7E", fontWeight: "600", marginTop: "10px", marginBottom: "14px" }}>
          <span>{product.unit || "500g"}</span>
        </div>

        {/* Bottom Price + Add Button Row */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "17px", fontWeight: "800", color: "#2B2B2B" }}>₹{displayPrice}</span>
              {product.basePrice > displayPrice && (
                <span style={{ fontSize: "12px", color: "#9E9E9E", textDecoration: "line-through", fontWeight: "500" }}>₹{product.basePrice}</span>
              )}
            </div>
            {product.basePrice > displayPrice && (
              <span style={{ fontSize: "11px", color: "#00B259", fontWeight: "700", display: "block", marginTop: "1px" }}>
                {discountPct}% off
              </span>
            )}
          </div>

          <motion.button
            whileHover={isOutOfStock ? {} : { scale: 1.04, backgroundColor: isAdding ? "#10B981" : "#5BBFB5", color: "#FFF", opacity: 1 }}
            whileTap={isOutOfStock ? {} : { scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            style={{
              background: isOutOfStock ? "#F3F4F6" : (isAdding ? "#10B981" : "transparent"),
              color: isOutOfStock ? "#9CA3AF" : (isAdding ? "#FFF" : "#5BBFB5"),
              border: isOutOfStock ? "none" : "1px solid #5BBFB5",
              borderRadius: "8px",
              height: "32px", // Slightly bigger height
              padding: "0 18px", // Slightly more padding
              fontSize: "12px", // Slightly bigger text
              fontWeight: "800",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              opacity: isOutOfStock ? 0.6 : 0.85,
              transition: "all 0.2s ease"
            }}
          >
            {isAdding ? "Added" : "Add"}
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

export default memo(EnhancedProductCard);