import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag,
  FiArrowRight, FiPackage, FiLock, FiTruck, FiCheck,
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { removeFromCart, updateQty } from "../../utils/cartStorage";

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

export default function CartSidebar({ onClose }) {
  const { cartCount, refreshCartCount, cartItems, subtotal: subtotalStr, storeSettings, isCartOpen, setIsCartOpen } = useContext(CartContext);
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    if (isCartOpen && cartItems.length === 0) {
      axios.get(`${API_URL}/api/products?sort=popular&limit=4`)
        .then(res => setTrending(res.data.products || res.data || []))
        .catch(() => {});
    }
  }, [isCartOpen, cartItems.length]);

  // Use eitherprop onClose OR context setIsCartOpen(false)
  const closeCart = onClose || (() => setIsCartOpen(false));

  const subtotal = parseFloat(subtotalStr || "0");
  const FREE_DELIVERY_THRESHOLD = storeSettings?.freeDeliveryThreshold || 1000;
  const deliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const handleUpdate = (item, newQty) => {
    if (newQty < 1) return;
    updateQty(item._id, newQty);
    refreshCartCount();
  };

  const handleRemove = (id) => {
    removeFromCart(id);
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
            transition={{ duration: 0.28 }}
            onClick={closeCart}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1500 }}
          />

          {/* SIDEBAR DRAWER */}
          <motion.div
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 260, mass: 0.8 }}
            style={{
              position: "fixed", top: 0, right: 0, height: "100%",
              width: "85vw", maxWidth: 400,
              background: T.surface, zIndex: 1510,
              display: "flex", flexDirection: "column",
              borderLeft: `1px solid ${T.border}`,
              boxShadow: "-8px 0 48px rgba(0,0,0,0.15)",
              fontFamily: font,
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
                    <div style={{
                      position: "absolute",
                      width: "120%",
                      height: "120%",
                      background: "radial-gradient(circle, rgba(91,168,160,0.12) 0%, rgba(91,168,160,0) 70%)",
                      zIndex: 0
                    }} />
                    
                    <img 
                      src="/empty-cart.png" 
                      alt="Empty Cart" 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "contain",
                        zIndex: 1,
                        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.08))"
                      }} 
                    />
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
                            onClick={() => { navigate(`/products/${p._id}`); closeCart(); }}
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
                      key={item._id}
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
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                            {item.name}
                          </h4>
                          <motion.button
                            whileHover={{ scale: 1.2, color: T.coral }}
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); handleRemove(item._id); }}
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