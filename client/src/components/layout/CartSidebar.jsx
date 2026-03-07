import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
  FiPackage,
  FiLock,
} from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import { removeFromCart, updateQty } from "../../utils/cartStorage";
import StripeButton from "../common/StripeButton";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${API_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
};

export default function CartSidebar({ isOpen, onClose }) {
  const { cartCount, refreshCartCount, cartItems, subtotal: subtotalStr, storeSettings } = useContext(CartContext);
  const navigate = useNavigate();

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
    onClose();
    navigate("/checkout");
  };

  const font = "'Plus Jakarta Sans', sans-serif";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(26,43,53,0.32)", backdropFilter: "blur(6px)", zIndex: 1000 }}
          />

          {/* SIDEBAR DRAWER */}
          <motion.div
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 260, mass: 0.8 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100%",
              width: "100%",
              maxWidth: 420,
              background: T.bg,
              zIndex: 1010,
              display: "flex",
              flexDirection: "column",
              borderLeft: `1px solid ${T.border}`,
              boxShadow: "-12px 0 40px rgba(10,24,36,0.35)",
              fontFamily: font,
            }}
          >
            {/* ── HEADER ── */}
            <div
              style={{
                padding: "18px 20px 16px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: T.surface,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: "linear-gradient(135deg, #5BA8A0, #89C2D9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      boxShadow: "0 8px 24px rgba(91,168,160,0.35)",
                    }}
                  >
                    <FiShoppingBag size={18} />
                  </motion.div>
                  <div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: T.textDark,
                        margin: 0,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Order summary
                    </h2>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.textLite,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        margin: 0,
                      }}
                    >
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <StripeButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close cart"
                  onClick={onClose}
                  style={{
                    borderRadius: 999,
                    width: 32,
                    height: 32,
                    padding: 0,
                    borderColor: T.border,
                    color: T.textLite,
                    boxShadow: "none",
                  }}
                >
                  <FiX size={14} />
                </StripeButton>
              </div>

              {/* Free delivery progress */}
              {cartItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Free Delivery
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textLite }}>
                      {remaining > 0 ? `₹${remaining.toFixed(0)} more` : "🎉 Unlocked!"}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#EEF5F4",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deliveryProgress}%` }}
                      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: "100%",
                        background: "linear-gradient(90deg, #5BA8A0, #89C2D9)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── ITEMS ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 18px 18px",
                background: T.bg,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 72, height: 72, borderRadius: "50%", background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "0 4px 20px rgba(91,168,160,0.10)" }}
                  >
                    <FiPackage size={28} style={{ color: T.border }} />
                  </motion.div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 6 }}>Your cart is empty</h3>
                  <p style={{ fontSize: 13, color: T.textLite, maxWidth: 220, lineHeight: 1.7, marginBottom: 24 }}>Add some fresh catch to get started.</p>
                  <StripeButton
                    variant="primary"
                    size="md"
                    onClick={onClose}
                    style={{ borderRadius: 12, paddingInline: 22 }}
                  >
                    Browse products
                  </StripeButton>
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
                      whileHover={{ boxShadow: "0 4px 20px rgba(91,168,160,0.10)", y: -1 }}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: T.surface,
                        border: `1px solid ${T.border}`,
                        boxShadow: "0 1px 4px rgba(26,43,53,0.04)",
                        transition: "box-shadow 0.18s ease, transform 0.18s ease",
                      }}
                    >
                      {/* Image */}
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 10,
                          flexShrink: 0,
                          background: T.bg,
                          border: `1px solid ${T.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 6,
                          overflow: "hidden",
                        }}
                      >
                        <motion.img
                          src={getFullImageUrl(item.image)}
                          alt={item.name}
                          whileHover={{ scale: 1.08 }}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                            {item.name}
                          </h4>
                          <StripeButton
                            variant="link"
                            size="sm"
                            onClick={() => handleRemove(item._id)}
                            style={{ color: T.textLite, fontSize: 10 }}
                          >
                            <FiTrash2 size={11} />
                          </StripeButton>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          {/* Qty stepper */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0,
                              background: T.bg,
                              borderRadius: 999,
                              border: `1px solid ${T.border}`,
                              overflow: "hidden",
                            }}
                          >
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

                          <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark }}>
                            ₹{(item.price * item.qty).toFixed(0)}
                          </span>
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
                style={{
                  padding: "18px 20px 20px",
                  background: T.surface,
                  borderTop: `1px solid ${T.border}`,
                }}
              >
                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: T.textLite,
                        margin: "0 0 2px",
                      }}
                    >
                      Total due
                    </p>
                    <motion.p
                      key={subtotal}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: T.textDark,
                        margin: 0,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      ₹{subtotal.toLocaleString()}
                    </motion.p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 10,
                        color: T.textLite,
                        margin: 0,
                      }}
                    >
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                {/* Checkout button */}
                <StripeButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckout}
                  style={{
                    borderRadius: 14,
                    fontSize: 14,
                  }}
                >
                  Checkout now
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <FiArrowRight size={16} />
                  </motion.span>
                </StripeButton>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: 10,
                    color: T.textLite,
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
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