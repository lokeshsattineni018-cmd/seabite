import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag,
  FiArrowRight, FiPackage, FiLock, FiTruck, FiCheck,
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import { removeFromCart, updateQty } from "../../utils/cartStorage";
import { slugify } from "../../utils/slugify";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath; // Return absolute URLs as-is
  return `${API_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
};

// Decode HTML entities like &amp; → &
const decodeEntities = (str) => {
  if (!str) return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};

export default function CartSidebar({ onClose }) {
  const { cartCount, refreshCartCount, cartItems, subtotal: subtotalStr, storeSettings, isCartOpen, setIsCartOpen, addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [upsells, setUpsells] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);

  useEffect(() => {
    if (user && isCartOpen) {
      axios.get(`${API_URL}/api/user/address`, { withCredentials: true })
        .then(res => {
          const defaultAddr = res.data.find(a => a.isDefault);
          setDefaultAddress(defaultAddr);
        })
        .catch(() => {});
    }
  }, [user, isCartOpen]);

  useEffect(() => {
    if (isCartOpen && cartItems.length === 0) {
      axios.get(`${API_URL}/api/products?sort=popular&limit=4`)
        .then(res => setTrending(res.data.products || res.data || []))
        .catch(() => {});
    }
  }, [isCartOpen, cartItems.length]);

  useEffect(() => {
    if (isCartOpen && cartItems.length > 0) {
      const ids = cartItems.map(i => i._id || i.productId).filter(Boolean).join(",");
      axios.get(`${API_URL}/api/recommendations/cart-upsell?ids=${ids}&limit=3`)
        .then(res => setUpsells(res.data || []))
        .catch(() => {});
    } else {
      setUpsells([]);
    }
  }, [isCartOpen, cartItems]);

  // Prevent background scrolling to eliminate compositing paint jank while the sidebar is active
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Use either prop onClose OR context setIsCartOpen(false)
  const closeCart = onClose || (() => setIsCartOpen(false));

  const subtotal = parseFloat(subtotalStr || "0");
  const FREE_DELIVERY_THRESHOLD = storeSettings?.freeDeliveryThreshold || 1000;
  const deliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const handleUpdate = (item, newQty) => {
    if (newQty < 1) return;
    updateQty(item._id, newQty, item.selectedCut, item.orderedWeightGrams);
    refreshCartCount();
  };

  const handleRemove = (item) => {
    removeFromCart(item._id, item.selectedCut, item.orderedWeightGrams);
    refreshCartCount();
  };

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const font = "'Plus Jakarta Sans', sans-serif";

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={closeCart}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1500, willChange: "opacity" }}
          />

          {/* SIDEBAR DRAWER */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
            style={{
              position: "fixed", top: 0, right: 0, height: "100%",
              width: "85vw", maxWidth: 400,
              background: T.surface, zIndex: 1510,
              display: "flex", flexDirection: "column",
              borderLeft: `1px solid ${T.border}`,
              boxShadow: "-8px 0 48px rgba(0,0,0,0.15)",
              fontFamily: font,
              willChange: "transform",
            }}
          >
            {/* ── HEADER ── */}
            <div style={{
              padding: "20px 24px", borderBottom: `1px solid ${T.border}`,
              display: "flex", flexDirection: "column", gap: 16,
              background: T.surface,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "linear-gradient(135deg, #5BA8A0, #89C2D9)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", boxShadow: "0 4px 16px rgba(91,168,160,0.28)",
                    }}
                  >
                    <FiShoppingBag size={18} />
                  </motion.div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "-0.02em" }}>Your Cart</h2>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <motion.button
                  aria-label="Close cart"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={closeCart}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: T.bg, border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.textLite, cursor: "pointer",
                  }}
                >
                  <FiX size={16} />
                </motion.button>
              </div>

              {/* Free delivery progress */}
              {cartItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: remaining > 0 ? T.primary : "#10B981", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 4 }}>
                      {remaining > 0 ? <FiPackage size={12} /> : <FiCheck size={12} />}
                      Free Delivery
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: remaining > 0 ? T.textLite : "#10B981" }}>
                      {remaining > 0 ? `Add ₹${remaining.toFixed(0)} more` : (
                        <motion.span 
                          initial={{ scale: 0.8, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }}
                          style={{ background: "#DCFCE7", padding: "2px 8px", borderRadius: 20, color: "#166534" }}
                        >
                          🎉 GOAL REACHED!
                        </motion.span>
                      )}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#EEF5F4", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${deliveryProgress}%`,
                        background: remaining > 0 
                          ? "linear-gradient(90deg, #5BA8A0, #89C2D9)" 
                          : "linear-gradient(90deg, #10B981, #34D399)"
                      }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: "100%", borderRadius: 4, position: "relative" }}
                    >
                      {remaining > 0 && (
                        <motion.div
                          animate={{ x: ["0%", "100%"], opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {remaining <= 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#166534", fontWeight: "600", display: "flex", alignItems: "center", gap: 6 }}>
                          <FiTruck style={{ color: "#10B981" }} /> You saved ₹{FREE_DELIVERY_THRESHOLD >= 1000 ? "99" : "49"} in delivery fees!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Estimated delivery date */}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(91,168,160,0.06), rgba(137,194,217,0.06))",
                      border: `1px solid rgba(91,168,160,0.12)`,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <FiTruck size={14} style={{ color: T.primary, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: T.textDark, margin: 0 }}>
                        Arriving{" "}
                        <span style={{ color: T.primary }}>
                          {(() => {
                            const now = new Date();
                            const cutoff = new Date(now);
                            cutoff.setHours(14, 0, 0, 0);
                            const delivery = new Date(now);
                            if (now > cutoff) delivery.setDate(delivery.getDate() + 2);
                            else delivery.setDate(delivery.getDate() + 1);
                            return `Tomorrow by 4:00 PM`;
                          })()}
                        </span>
                      </p>
                      <p style={{ fontSize: 10, color: T.textLite, margin: "2px 0 0", fontWeight: 500 }}>
                        Order within{" "}
                        {(() => {
                          const now = new Date();
                          const cutoff = new Date(now);
                          cutoff.setHours(14, 0, 0, 0);
                          if (now > cutoff) cutoff.setDate(cutoff.getDate() + 1);
                          const diff = cutoff - now;
                          const hrs = Math.floor(diff / 3600000);
                          const mins = Math.floor((diff % 3600000) / 60000);
                          return `${hrs}h ${mins}m`;
                        })()}{" "}
                        for express dispatch
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* ── ITEMS ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: T.bg, display: "flex", flexDirection: "column", gap: 10 }}>
              {cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    textAlign: "center", 
                    padding: "60px 20px 40px" 
                  }}
                >
                  <motion.div
                    animate={{ 
                      y: [0, -12, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    style={{ 
                      width: 180, 
                      height: 180, 
                      marginBottom: 24,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {/* Decorative glow behind image */}
                    {/* C4: Custom animated ocean SVG illustration */}
                    <svg viewBox="0 0 200 200" width="160" height="160" style={{ zIndex: 1, filter: "drop-shadow(0 16px 24px rgba(91,168,160,0.15))" }}>
                      <defs>
                        <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#EAF6F5" />
                          <stop offset="100%" stopColor="#C5E6E4" />
                        </linearGradient>
                        <linearGradient id="fishGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#5BBFB5" />
                          <stop offset="100%" stopColor="#89C2D9" />
                        </linearGradient>
                      </defs>
                      
                      <circle cx="100" cy="100" r="85" fill="url(#oceanGrad)" />
                      
                      <path d="M 20 130 Q 60 115 100 130 T 180 130 L 180 185 L 20 185 Z" fill="rgba(91,168,160,0.2)" />
                      <path d="M 15 145 Q 55 135 95 145 T 185 145 L 185 185 L 15 185 Z" fill="rgba(91,168,160,0.3)" />
                      
                      <g className="hook-group">
                        <line x1="100" y1="0" x2="100" y2="90" stroke="#4A6572" strokeWidth="1.5" strokeDasharray="3,3" />
                        <path d="M 100 90 Q 100 102 108 102 Q 115 102 115 94" fill="none" stroke="#4A6572" strokeWidth="2" strokeLinecap="round" />
                        <line x1="115" y1="94" x2="112" y2="97" stroke="#4A6572" strokeWidth="2" strokeLinecap="round" />
                      </g>
                      
                      <g className="fish-group">
                        <path d="M 50 110 C 65 100 80 110 90 105 C 85 110 85 115 90 120 C 80 115 65 125 50 115 Z" fill="url(#fishGrad)" />
                        <polygon points="50,115 42,108 42,122" fill="#5BBFB5" />
                        <circle cx="80" cy="110" r="1.5" fill="#FFF" />
                      </g>
                      
                      <g className="small-fish-group">
                        <path d="M 120 70 C 130 63 140 70 147 67 C 143 70 143 73 147 76 C 140 73 130 80 120 73 Z" fill="rgba(137,194,217,0.7)" />
                        <polygon points="120,73 115,69 115,77" fill="rgba(137,194,217,0.7)" />
                      </g>
                      
                      <circle className="bubble bubble-1" cx="70" cy="150" r="3" fill="#FFF" opacity="0.6" />
                      <circle className="bubble bubble-2" cx="130" cy="160" r="4" fill="#FFF" opacity="0.5" />
                      <circle className="bubble bubble-3" cx="105" cy="140" r="2" fill="#FFF" opacity="0.7" />
                      
                      <style>{`
                        @keyframes sway {
                          0%, 100% { transform: translate(0, 0) rotate(0deg); }
                          50% { transform: translate(8px, -4px) rotate(3deg); }
                        }
                        @keyframes hook-sway {
                          0%, 100% { transform: rotate(-2deg); transform-origin: 100px 0px; }
                          50% { transform: rotate(2deg); transform-origin: 100px 0px; }
                        }
                        @keyframes bubble-rise {
                          0% { transform: translateY(0); opacity: 0; }
                          50% { opacity: 0.6; }
                          100% { transform: translateY(-60px); opacity: 0; }
                        }
                        .fish-group { animation: sway 4s ease-in-out infinite; }
                        .small-fish-group { animation: sway 5s ease-in-out infinite reverse; }
                        .hook-group { animation: hook-sway 6s ease-in-out infinite; }
                        .bubble-1 { animation: bubble-rise 3s infinite ease-in; }
                        .bubble-2 { animation: bubble-rise 4s infinite ease-in 1.5s; }
                        .bubble-3 { animation: bubble-rise 2.5s infinite ease-in 0.8s; }
                      `}</style>
                    </svg>
                  </motion.div>

                  <h3 style={{ 
                    fontSize: 22, 
                    fontWeight: 800, 
                    color: T.textDark, 
                    marginBottom: 12,
                    letterSpacing: "-0.02em"
                  }}>
                    Your cart is empty
                  </h3>
                  
                  <p style={{ 
                    fontSize: 14, 
                    color: T.textLite, 
                    maxWidth: 260, 
                    lineHeight: 1.6, 
                    marginBottom: 32,
                    fontWeight: 500
                  }}>
                    Looks like you haven't added anything yet. Explore our fresh catch and fill it up!
                  </p>

                  <motion.button
                    whileHover={{ y: -3, scale: 1.02, boxShadow: "0 12px 32px rgba(91,168,160,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={closeCart}
                    style={{
                      padding: "16px 32px", 
                      borderRadius: 16, 
                      background: T.primary,
                      color: "#fff", 
                      fontWeight: 800, 
                      fontSize: 14, 
                      border: "none",
                      cursor: "pointer", 
                      fontFamily: font, 
                      marginBottom: 60,
                      boxShadow: "0 8px 24px rgba(91,168,160,0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    Start Shopping
                    <FiArrowRight size={16} />
                  </motion.button>

                  {trending.length > 0 && (
                    <div style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                        <p style={{ 
                          fontSize: 11, 
                          fontWeight: 800, 
                          color: T.textMid, 
                          textTransform: "uppercase", 
                          letterSpacing: "0.12em",
                          margin: 0
                        }}>
                          Recommended for you
                        </p>
                        <div style={{ height: 1, flex: 1, background: T.border, marginLeft: 16 }} />
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {trending.slice(0, 3).map((p, idx) => (
                          <motion.div 
                            key={p._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (idx * 0.1) }}
                            onClick={() => { navigate(`/products/${slugify(p.name)}`); closeCart(); }}
                            whileHover={{ x: 8, background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: 16, 
                              padding: "12px", 
                              borderRadius: 16, 
                              background: "rgba(255,255,255,0.6)", 
                              border: `1px solid ${T.border}`, 
                              cursor: "pointer",
                              transition: "all 0.3s ease"
                            }}
                          >
                            <div style={{ 
                              width: 56, 
                              height: 56, 
                              borderRadius: 12, 
                              overflow: "hidden", 
                              background: "#fff",
                              border: `1px solid ${T.border}`
                            }}>
                              <img 
                                src={getFullImageUrl(p.image)} 
                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h5 style={{ fontSize: 13, fontWeight: 700, color: T.textDark, margin: "0 0 4px" }}>{p.name}</h5>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <p style={{ fontSize: 13, fontWeight: 800, color: T.primary, margin: 0 }}>
                                  ₹{p.flashSale?.isFlashSale ? p.flashSale.discountPrice : p.basePrice}
                                </p>
                                {p.flashSale?.isFlashSale && (
                                  <p style={{ fontSize: 11, color: T.textLite, textDecoration: "line-through", margin: 0 }}>
                                    ₹{p.basePrice}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: "50%", 
                              background: T.surface, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              color: T.primary,
                              border: `1px solid ${T.border}`
                            }}>
                              <FiArrowRight size={14} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

              ) : (
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item._id}-${item.selectedCut || ""}-${item.orderedWeightGrams || 0}`}
                      layout
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                      exit={{ opacity: 0, x: -40, scale: 0.94, transition: { duration: 0.25 } }}
                      whileHover={{ boxShadow: "0 4px 20px rgba(91,168,160,0.10)" }}
                      style={{
                        display: "flex", gap: 12, padding: "12px 14px",
                        borderRadius: 14, background: T.surface,
                        border: `1px solid ${T.border}`,
                        boxShadow: "0 1px 4px rgba(26,43,53,0.04)",
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                        background: T.bg, border: `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 6, overflow: "hidden",
                      }}>
                        <motion.img
                          src={getFullImageUrl(item.image)}
                          alt={item.name}
                          whileHover={{ scale: 1.08 }}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                              {item.name}
                            </h4>
                            {(item.selectedCut || item.orderedWeightGrams > 0) && (
                              <div style={{ fontSize: "11px", color: T.primary, fontWeight: "600", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.selectedCut && `Cut: ${decodeEntities(item.selectedCut)}`}
                                {item.selectedCut && item.orderedWeightGrams > 0 && " | "}
                                {item.orderedWeightGrams > 0 && `Weight: ${item.orderedWeightGrams >= 1000 ? `${item.orderedWeightGrams/1000}kg` : `${item.orderedWeightGrams}g`}`}
                              </div>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.2, color: T.coral }}
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
                            style={{ color: T.textLite, background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Remove item"
                          >
                            <FiX size={14} />
                          </motion.button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          {/* Qty stepper */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 0,
                            background: T.bg, borderRadius: 9, border: `1px solid ${T.border}`,
                            overflow: "hidden",
                          }}>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleUpdate(item, item.qty - 1)}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: T.textLite, background: "none", border: "none", cursor: "pointer" }}
                            >
                              <FiMinus size={10} />
                            </motion.button>
                            <motion.span
                              key={item.qty}
                              initial={{ scale: 1.3, color: T.primary }}
                              animate={{ scale: 1, color: T.textDark }}
                              style={{ width: 28, textAlign: "center", fontSize: 12, fontWeight: 800 }}
                            >
                              {item.qty}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleUpdate(item, item.qty + 1)}
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: T.textLite, background: "none", border: "none", cursor: "pointer" }}
                            >
                              <FiPlus size={10} />
                            </motion.button>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            {item.originalPrice > item.price && (
                              <div style={{ fontSize: 10, color: T.textLite, textDecoration: "line-through", marginBottom: 2 }}>
                                ₹{(item.originalPrice * item.qty).toFixed(0)}
                              </div>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark }}>
                              ₹{(item.price * item.qty).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {upsells.length > 0 && (
                    <div style={{ marginTop: 24, padding: "0 4px" }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.textMid, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>
                        Complete Your Meal 🍱
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {upsells.map(p => (
                          <div
                            key={p._id}
                            style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                              borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`,
                            }}
                          >
                            <img src={getFullImageUrl(p.image)} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h5 style={{ fontSize: 12, fontWeight: 700, color: T.textDark, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h5>
                              <p style={{ fontSize: 11, fontWeight: 800, color: T.primary, margin: 0 }}>₹{p.price || p.basePrice}</p>
                            </div>
                            <button
                              onClick={() => {
                                addToCart(p);
                                refreshCartCount();
                                toast.success(`${p.name} added to cart!`);
                              }}
                              style={{
                                padding: "6px 12px", borderRadius: 8, background: T.primary, color: "#fff",
                                border: "none", fontSize: 11, fontWeight: 800, cursor: "pointer"
                              }}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* ── FOOTER ── */}
            {cartItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                style={{ padding: "20px 24px", background: T.surface, borderTop: `1px solid ${T.border}` }}
              >
                {/* Savings summary */}
                {(() => {
                  const totalSaved = cartItems.reduce((acc, item) => {
                    const saved = (item.originalPrice && item.originalPrice > item.price)
                      ? (item.originalPrice - item.price) * item.qty
                      : 0;
                    return acc + saved;
                  }, 0);
                  return totalSaved > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #DCFCE7, #D1FAE5)",
                        border: "1px solid #BBF7D0",
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🎉</span>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", margin: 0 }}>
                        You're saving ₹{Math.round(totalSaved).toLocaleString()} on this order!
                      </p>
                    </motion.div>
                  ) : null;
                })()}

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: T.textLite, margin: "0 0 2px" }}>Total Amount</p>
                    <motion.p
                      key={subtotal}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: 26, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "-0.03em" }}
                    >
                      ₹{subtotal.toLocaleString()}
                    </motion.p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 10, color: T.textLite, margin: 0 }}>
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                {/* Checkout button */}
                <motion.button
                  whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(91,168,160,0.30)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  style={{
                    width: "100%", padding: "15px 20px", borderRadius: 14,
                    background: T.primary, color: "#fff", border: "none",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    fontFamily: font, boxShadow: "0 4px 20px rgba(91,168,160,0.24)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Checkout Now
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  >
                    <FiArrowRight size={16} />
                  </motion.span>
                </motion.button>



                <p style={{ textAlign: "center", fontSize: 10, color: T.textLite, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <FiLock size={10} /> Secured checkout
                </p>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}