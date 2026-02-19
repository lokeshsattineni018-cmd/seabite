import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiX, FiZap, FiShoppingCart, FiCheck } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
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
  isWishlistMode = false,
  globalDiscount = 0,
}) => {
  const { addToCart } = useContext(CartContext);
  const { user, refreshMe } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

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
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    setTimeout(() => {
      addToCart({ ...product, quantity: 1, price: parseFloat(displayPrice) });
      toast.success(`${product.name} added`, {
        style: { background: "#5BBFB5", color: "#fff", fontSize: "13px", borderRadius: "12px" },
        icon: "🛒",
      });
      setIsAdding(false);
    }, 500);
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Login to save items"); return navigate("/login"); }
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

  const isOutOfStock = product.stock === "out" || !product.stock;
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
        fontFamily: "'Manrope', sans-serif",
      }}
      className="product-card-hover group"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
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
      `}</style>

      {/* Badge Row */}
      <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 10 }}>
        {product.trending && (
          <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "9px", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
        {loadingWishlist ? (
          <div style={{ width: "14px", height: "14px", border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        ) : isWishlistMode ? (
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
            width: "100%", height: "100%", objectFit: "contain",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: isOutOfStock ? "grayscale(0.4) opacity(0.6)" : "none",
            opacity: imageLoaded ? 1 : 0,
          }}
          onLoad={() => setImageLoaded(true)}
          className="group-hover:scale-105"
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
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {isAdding ? (
              <><FiCheck size={14} /> Added</>
            ) : isOutOfStock ? (
              "Sold Out"
            ) : (
              <><FiShoppingCart size={14} /> Add to Cart</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default EnhancedProductCard;