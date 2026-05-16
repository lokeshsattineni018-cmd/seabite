// client/src/components/common/ProductCard.jsx
import React, { useState, useContext, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { FiShoppingCart, FiHeart, FiZap } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { tokens } from "../../utils/design-tokens";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * SeaBite Product Card Component (Standard)
 * Upgraded with strike-off pricing and wishlist support.
 */
const ProductCard = ({ product, globalDiscount = 0 }) => {
  const { colors, typography, spacing, shadows, borderRadius } = tokens;
  const { user, refreshMe } = useContext(AuthContext);
  const { addToCart, refreshCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    if (user?.wishlist) {
      setIsWishlisted(user.wishlist.some(id => (typeof id === 'string' ? id : id._id) === product._id));
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

  const isActiveFlashSale = product.flashSale?.isFlashSale && new Date(product.flashSale.saleEndDate) > new Date();
  let displayPrice = isActiveFlashSale ? product.flashSale.discountPrice : product.basePrice;
  const globalDiscountApplied = !isActiveFlashSale && globalDiscount > 0;
  if (globalDiscountApplied) displayPrice = Math.round(product.basePrice * (1 - globalDiscount / 100));
  
  const discountPct = isActiveFlashSale
    ? Math.round((1 - product.flashSale.discountPrice / product.basePrice) * 100)
    : globalDiscountApplied ? globalDiscount : 0;
  
  const hasDiscount = discountPct > 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      return window.dispatchEvent(new CustomEvent('open-auth-drawer'));
    }
    
    setLoadingWishlist(true);
    try {
      await axios.post(`${API_URL}/api/user/wishlist/${product._id}`, {}, { withCredentials: true });
      await refreshMe();
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch (err) {
      toast.error("Wishlist update failed");
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, quantity: 1, originalPrice: product.basePrice });
    refreshCartCount();
    toast.success("Added to cart");
  };

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: shadows.premium }}
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.subtle,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        border: `1px solid ${colors.grayscaleBackground}`,
        position: "relative",
        // 🌟 FRESHNESS AURA
        animation: product.trending ? "aura-pulse 4s infinite ease-in-out" : "none"
      }}
    >
      <style>{`
        @keyframes aura-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(91, 168, 160, 0.1); border-color: rgba(91, 168, 160, 0.2); }
          50% { box-shadow: 0 4px 40px rgba(91, 168, 160, 0.3); border-color: rgba(91, 168, 160, 0.6); }
        }
      `}</style>
      <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Image Section */}
        <div style={{
          backgroundColor: colors.grayscaleBackground,
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: 'hidden'
        }}>
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          
          {discountPct > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "absolute", top: 12, left: 12,
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(12px)",
                color: "#1A2E2C",
                padding: "5px 10px", 
                borderRadius: "100px",
                fontSize: "10px", 
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.03)",
                zIndex: 2,
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
          )}

          {product.countInStock > 0 && product.countInStock <= 5 && (
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: ["0 4px 12px rgba(232,129,106,0.1)", "0 4px 12px rgba(232,129,106,0.3)", "0 4px 12px rgba(232,129,106,0.1)"]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                position: "absolute", bottom: 12, left: 12,
                background: "#FEF2F2",
                color: "#991B1B",
                padding: "4px 8px", 
                borderRadius: "6px",
                fontSize: "9px", 
                fontWeight: 800,
                border: "1px solid #FCA5A5",
                zIndex: 2,
                display: "flex", 
                alignItems: "center", 
                gap: "4px",
                textTransform: "uppercase"
              }}
            >
              <FiZap size={10} style={{ color: "#EF4444" }} />
              Only {product.countInStock}{product.unit || 'kg'} left
            </motion.div>
          )}

          <button
            onClick={handleWishlist}
            disabled={loadingWishlist}
            style={{
              position: "absolute", top: 12, right: 12,
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: isWishlisted ? colors.accentFresh : colors.primarySea,
              boxShadow: shadows.subtle, zIndex: 2
            }}
          >
            <FiHeart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: colors.primarySea,
            margin: "0 0 8px 0", height: "2.4em", overflow: "hidden"
          }}>
            {product.name}
          </h3>

          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: colors.primarySea }}>
                ₹{displayPrice}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: 12, color: colors.textDrift, textDecoration: "line-through" }}>
                  ₹{product.basePrice}
                </span>
              )}
            </div>

            <button
              onClick={handleCart}
              style={{
                width: "100%", padding: "10px", borderRadius: 8,
                background: "#1A2E2C", color: "#fff",
                border: "none", fontWeight: 700, fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer", transition: "all 0.2s ease"
              }}
            >
              <FiShoppingCart size={14} /> Add
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default memo(ProductCard);
