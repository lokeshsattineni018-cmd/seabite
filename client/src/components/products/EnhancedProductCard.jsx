import { useState, useContext, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiShoppingCart, FiZap, FiCheck, FiArrowRight, FiPlus, FiX } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "../../utils/toast"; 
import triggerHaptic from "../../utils/haptics"; 
import axios from "axios";
import { slugify } from "../../utils/slugify";

const API_URL = import.meta.env.VITE_API_URL || "";

// Decode HTML entities like &amp; → &
const decodeEntities = (str) => {
  if (!str) return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};

const QuickViewModal = ({ isOpen, onClose, product, displayPrice, discountPct, getImageUrl, addToCart, refreshCartCount, isAdding, setIsAdding }) => {
  const [selectedCut, setSelectedCut] = useState(null);
  
  if (!isOpen || !product) return null;
  
  const handleAdd = (e) => {
    e.stopPropagation();
    if (isAdding || product.stock === "out") return;
    setIsAdding(true);
    triggerHaptic("medium");
    addToCart({
      ...product,
      quantity: 1,
      price: parseFloat(displayPrice),
      originalPrice: parseFloat(product.basePrice),
      selectedCut: selectedCut?.name || "",
    });
    refreshCartCount();
    setTimeout(() => {
      setIsAdding(false);
      toast.success(`${product.name} added!`, { icon: "🛒" });
      onClose();
    }, 800);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,46,44,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 680, background: "#FFF", borderRadius: 24, overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column",
          maxHeight: "90vh", position: "relative", border: "1px solid rgba(255,255,255,0.2)"
        }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "#F4F9F8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, color: "#1A2E2C" }}>
          <FiX size={18} />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 640 ? "1fr" : "1fr 1.2fr", overflowY: "auto" }}>
          <div style={{ position: "relative", width: "100%", height: window.innerWidth < 640 ? "200px" : "100%", minHeight: "320px", background: "#F9FBFA" }}>
            <img src={getImageUrl(product.image)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {discountPct > 0 && (
              <div style={{ position: "absolute", top: 0, left: 0, background: "#00B259", color: "#FFF", padding: "6px 12px", fontSize: "12px", fontWeight: "800", borderBottomRightRadius: "12px" }}>
                {discountPct}% OFF
              </div>
            )}
          </div>

          <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em" }}>{product.category}</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A2E2C", margin: "4px 0 0", letterSpacing: "-0.02em" }}>{product.name}</h2>
            </div>

            {product.desc && (
              <p style={{ fontSize: 13, color: "#4A6572", lineHeight: 1.5, margin: 0 }}>
                {product.desc}
              </p>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#1A2E2C" }}>₹{displayPrice}</span>
              {product.basePrice > displayPrice && (
                <>
                  <span style={{ fontSize: 16, color: "#B8CFCC", textDecoration: "line-through" }}>₹{product.basePrice}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#00B259" }}>({discountPct}% off)</span>
                </>
              )}
            </div>

            {product.cuts && product.cuts.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Choose Cut</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.cuts.map(cut => {
                    const isSelected = selectedCut?.name === cut.name;
                    return (
                      <button
                        key={cut.name}
                        onClick={() => setSelectedCut(isSelected ? null : cut)}
                        style={{
                          padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          border: isSelected ? "1.5px solid #1A2E2C" : "1.5px solid #E2EEEC",
                          background: isSelected ? "#1A2E2C" : "#FFF",
                          color: isSelected ? "#FFF" : "#4A6A67",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {cut.emoji && <span style={{ marginRight: 4 }}>{cut.emoji}</span>}
                        {decodeEntities(cut.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              disabled={product.stock === "out" || isAdding}
              style={{
                width: "100%", padding: "14px 20px", borderRadius: 14,
                background: product.stock === "out" ? "#F3F4F6" : (isAdding ? "#10B981" : "#5BBFB5"),
                color: product.stock === "out" ? "#9CA3AF" : "#FFF",
                border: "none", fontSize: 14, fontWeight: 800,
                cursor: product.stock === "out" ? "not-allowed" : "pointer",
                boxShadow: product.stock === "out" ? "none" : "0 4px 16px rgba(91,168,160,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8
              }}
            >
              <FiShoppingCart size={16} />
              {product.stock === "out" ? "Sold Out" : (isAdding ? "Added!" : "Add to Cart")}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

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
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

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

  const renderMetadata = () => {
    const parts = [];
    let unitDisplay = (product.unit || "").trim();
    const unitLower = unitDisplay.toLowerCase();
    
    // Normalize unitDisplay
    if (unitLower === "pc" || unitLower === "piece" || unitLower === "1pc" || unitLower === "1 pc") {
      unitDisplay = "1 pc";
    } else if (unitLower === "kg" || unitLower === "1kg" || unitLower === "1 kg") {
      unitDisplay = "1 kg";
    } else if (unitLower === "g" || unitLower === "1g" || unitLower === "1 g") {
      unitDisplay = "1 g";
    }

    // Prepare pieces
    let piecesDisplay = "";
    if (product.pieces) {
      let p = product.pieces.trim();
      if (p) {
        if (/^\d+(-\d+)?$/.test(p)) {
          piecesDisplay = `${p} Pieces`;
        } else {
          piecesDisplay = p;
        }
      }
    }

    // Prepare serves
    let servesDisplay = "";
    if (product.serves) {
      let s = product.serves.trim();
      // Ensure servesDisplay is not generated if it's just the word "serves" or empty/whitespace
      if (s && s.toLowerCase() !== "serves") {
        if (/^\d+(-\d+)?$/.test(s)) {
          servesDisplay = `Serves ${s}`;
        } else if (!s.toLowerCase().startsWith("serves")) {
          servesDisplay = `Serves ${s}`;
        } else {
          servesDisplay = s;
        }
      }
    }

    // Deduplicate logic:
    // If unit is "1 pc" (or "1 piece") and pieces is "1 Pieces" (or "1 pc"), they are redundant.
    const isSingleUnit = unitDisplay.toLowerCase() === "1 pc" || unitDisplay.toLowerCase() === "1 piece";
    const isSinglePiece = piecesDisplay.toLowerCase() === "1 pieces" || piecesDisplay.toLowerCase() === "1 piece" || piecesDisplay.toLowerCase() === "1 pc";
    
    if (isSingleUnit && isSinglePiece) {
      piecesDisplay = "";
    }

    // If unitDisplay and piecesDisplay are identical or represent the exact same thing, deduplicate.
    if (unitDisplay.toLowerCase() === piecesDisplay.toLowerCase()) {
      piecesDisplay = "";
    }

    if (unitDisplay) parts.push(unitDisplay);
    if (piecesDisplay) parts.push(piecesDisplay);
    if (servesDisplay) parts.push(servesDisplay);

    return parts.join(" | ");
  };

  const isOutOfStock = product.stock === "out" || product.countInStock <= 0;
  const metadataStr = renderMetadata();

  // Smart duplicate description checker
  const descText = product.desc || "";
  const hasMetadata = !!metadataStr;
  const isDescDuplicate = hasMetadata && (
    descText.toLowerCase().includes("pieces:") ||
    descText.toLowerCase().includes("serves:") ||
    descText.toLowerCase().includes("piece:") ||
    descText.toLowerCase().trim() === (product.unit || "").toLowerCase().trim()
  );
  const showDescription = descText && !isDescDuplicate;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={isOutOfStock ? {} : { y: -6, boxShadow: "0 12px 24px rgba(0,0,0,0.06)", borderColor: "#E0E0E0" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        background: "#FFFFFF",
        borderRadius: "16px", // Licious clean rounded corners
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minWidth: 0,
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
      <div style={{ position: "relative", width: "100%", aspectRatio: "1.45/1", overflow: "hidden", background: "#F9FBFA" }}>
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

        {/* Quick View Button Overlay on Hover */}
        {isHovered && !isOutOfStock && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsQuickViewOpen(true);
            }}
            style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              background: "rgba(255,255,255,0.95)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.4)", borderRadius: 100,
              padding: "8px 16px", color: "#1A2E2C", fontSize: "11px", fontWeight: "800",
              cursor: "pointer", zIndex: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.04em",
              textTransform: "uppercase"
            }}
          >
            🔍 Quick View
          </motion.button>
        )}

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

      {/* ✍️ Premium Padded Content Section */}
      <div className="product-card-content">
        {/* Title */}
        <Link to={`/products/${slugify(product.name)}`} style={{ textDecoration: "none" }}>
          <h3 style={{ 
            fontSize: "15px", 
            fontWeight: "700", 
            color: "#2B2B2B", 
            lineHeight: 1.35,
            height: "2.7em",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            margin: 0
          }}>
            {product.name}
          </h3>
        </Link>

        {/* Subtitle / Category Origin (always rendered to maintain equal card heights) */}
        <div style={{ 
          fontSize: "12px", 
          color: "#8E8E8E", 
          marginTop: "2px", 
          marginBottom: "6px", 
          whiteSpace: "nowrap", 
          overflow: "hidden", 
          textOverflow: "ellipsis",
          lineHeight: "1.4",
          minHeight: "1.4em"
        }}>
          {showDescription ? descText.split(".")[0] : "\u00A0"}
        </div>

        {/* Weight / Unit / Pieces / Serves Metadata dynamically formatted (only if non-empty) */}
        {metadataStr && (
          <div className="product-card-metadata">
            <span>{metadataStr}</span>
          </div>
        )}

        {/* Bottom Price + Add Button Row */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="product-card-price">₹{displayPrice}</span>
            {product.basePrice > displayPrice && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginTop: "1px" }}>
                <span className="product-card-mrp">₹{product.basePrice}</span>
                <span className="product-card-discount">{discountPct}% off</span>
              </div>
            )}
          </div>

          <motion.button
            whileHover={isOutOfStock ? {} : { scale: 1.04, backgroundColor: isAdding ? "#10B981" : "#5BBFB5", color: "#FFF", opacity: 1 }}
            whileTap={isOutOfStock ? {} : { scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="product-card-btn"
            style={{
              background: isOutOfStock ? "#F3F4F6" : (isAdding ? "#10B981" : "transparent"),
              color: isOutOfStock ? "#9CA3AF" : (isAdding ? "#FFF" : "#5BBFB5"),
              border: isOutOfStock ? "none" : "1px solid #5BBFB5",
              borderRadius: "8px",
              fontWeight: "800",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              opacity: isOutOfStock ? 0.6 : 0.9,
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
      {/* 🚀 Quick View Modal */}
      <AnimatePresence>
        {isQuickViewOpen && (
          <QuickViewModal
            isOpen={isQuickViewOpen}
            onClose={() => setIsQuickViewOpen(false)}
            product={product}
            displayPrice={displayPrice}
            discountPct={discountPct}
            getImageUrl={getImageUrl}
            addToCart={addToCart}
            refreshCartCount={refreshCartCount}
            isAdding={isAdding}
            setIsAdding={setIsAdding}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(EnhancedProductCard);