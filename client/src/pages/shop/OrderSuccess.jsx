import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiCopy, FiTruck,
  FiDownload, FiChevronRight, FiMapPin, FiBox
} from "react-icons/fi";
import confetti from "canvas-confetti";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// Clean, Premium Light & Minimalist Theme Palette (Matching SeaBite Storefront)
const T = {
  bgGradient: "linear-gradient(135deg, #F4F9F8 0%, #FFFFFF 100%)",
  surface: "#FFFFFF",
  border: "#E2EEEC",
  primary: "#5BBFB5", // SeaBite brand teal
  sky: "#89C2D9",
  accent: "#FFB703", // Subtle gold
  textDark: "#1A2E2C", // Dark charcoal/slate
  textMid: "#4A6572",  // Medium steel gray
  textLite: "#7FA3B7",
  cardBg: "#FAFCFC",
  shadow: "0 20px 50px rgba(91, 191, 181, 0.08)",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n || 0);

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const dbId = params.get("dbId");
  const discount = Number(params.get("discount") || 0);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redirectTime, setRedirectTime] = useState(45);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!location.state?.fromCheckout) {
      navigate("/orders", { replace: true });
      return;
    }
    if (!dbId) { setLoading(false); return; }
    axios.get(`${API_URL}/api/orders/${dbId}`, { withCredentials: true })
      .then(({ data }) => setOrder(data))
      .catch(() => { })
      .finally(() => { 
        setLoading(false); 
        setTimeout(() => {
          setVisible(true);
          fireConfetti();
        }, 100); 

        // A/B test conversion tracking
        const activeTestId = sessionStorage.getItem("active_ab_test_id");
        const variantIndex = sessionStorage.getItem("active_ab_test_variant");
        if (activeTestId && variantIndex !== null) {
          axios.post(`${API_URL}/api/ab-tests/${activeTestId}/track`, {
            variantIndex: parseInt(variantIndex, 10),
            event: "conversion"
          }).catch(() => {});
          sessionStorage.removeItem("active_ab_test_id");
          sessionStorage.removeItem("active_ab_test_variant");
        }
      });
  }, [dbId]);

  // 🎊 High-Fidelity Confetti Rain
  const fireConfetti = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 120, zIndex: 99999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 70 * (timeLeft / duration);
      
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 },
        colors: ['#5BBFB5', '#89C2D9', '#ffffff', '#FFB703'],
        shapes: ['circle', 'square'],
        scalar: randomInRange(0.5, 1.0)
      });
      
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 },
        colors: ['#5BBFB5', '#89C2D9', '#ffffff', '#FFB703'],
        shapes: ['circle', 'square'],
        scalar: randomInRange(0.5, 1.0)
      });
    }, 200);

    // Dynamic central fireworks
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#5BBFB5', '#FFB703', '#ffffff'],
        scalar: 1.2
      });
    }, 450);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setRedirectTime((p) => {
        if (p <= 1) { clearInterval(t); navigate("/orders", { replace: true }); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [navigate]);

  const copyId = () => {
    if (!order?.orderId) return;
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <SeaBiteLoader fullScreen />;

  const displayId = order?.orderId || (dbId ? dbId.slice(-8).toUpperCase() : "—");
  const subtotal = order?.itemsPrice ?? 0;
  const tax = order?.taxPrice ?? 0;
  const shipping = order?.shippingPrice ?? 0;
  const totalDisc = order?.discount ?? discount;
  const total = order?.totalAmount ?? order?.totalPrice ?? 0;

  return (
    <div style={{
      minHeight: "85vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: T.bgGradient,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: "30px 20px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* Custom Scrollbar for Items list */
        .items-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .items-scrollbar::-webkit-scrollbar-track {
          background: #F4F9F8;
          border-radius: 100px;
        }
        .items-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(91, 191, 181, 0.25);
          border-radius: 100px;
        }
        .items-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(91, 191, 181, 0.4);
        }

        .success-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
        }
        .success-col-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .success-col-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
        }
        @media (max-width: 868px) {
          .success-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .success-col-right {
            justify-content: flex-start;
          }
        }
      `}</style>

      {/* ── MAIN MINIMALIST CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1100,
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          borderRadius: "28px",
          padding: "40px",
          boxShadow: T.shadow,
        }}
      >
        <div className="success-grid">
          {/* ── LEFT COLUMN: Confirmation, Address, Timeline, Actions ── */}
          <div className="success-col-left">
            {/* ── HERO HEADER ── */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              {/* Checkmark Ring Animation */}
              <div style={{ position: "relative", width: 84, height: 84, margin: "0 auto 16px" }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                  style={{
                    position: "absolute", inset: -8, borderRadius: "50%",
                    border: `2px solid ${T.primary}`,
                    opacity: 0.3
                  }}
                />
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={visible ? { scale: 1, rotate: 0 } : {}}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  onClick={fireConfetti}
                  style={{
                    width: 84, height: 84, borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
                    cursor: "pointer",
                    position: "relative", zIndex: 1,
                  }}
                >
                  <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M10 20.5L16.5 27L30 13.5"
                      stroke="#ffffff"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={visible ? { pathLength: 1 } : {}}
                      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              </div>

              {/* Sparkly Confirm Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(91,191,181,0.08)", border: "1.5px solid rgba(91,191,181,0.18)",
                  borderRadius: 30, padding: "4px 14px 4px 8px", marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13 }}>🎉</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#429B90", letterSpacing: "0.08em" }}>ORDER CONFIRMED</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: 28, fontWeight: 800, color: T.textDark, margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.2 }}
              >
                Catch Secured!{" "}
                <span style={{ color: T.primary }}>
                  Harvest underway.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: 13, color: T.textMid, margin: 0, fontWeight: 500, lineHeight: 1.5 }}
              >
                Harbor dispatch team is packaging your order with direct ice-compliance.
              </motion.p>
            </div>

            {/* ── ORDER TIMELINE & REFERENCE CARD ── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              style={{
                background: T.cardBg,
                border: `1.5px solid ${T.border}`,
                borderRadius: "20px",
                padding: "20px",
              }}
            >
              {/* ID Details Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Order ID</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: T.textDark }}>#{displayId}</span>
                    <button onClick={copyId} style={{
                      background: copied ? "rgba(91,191,181,0.12)" : "#FFFFFF",
                      border: `1.5px solid ${copied ? T.primary : T.border}`,
                      borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 10, fontWeight: 700, color: copied ? T.primary : T.textMid,
                      transition: "all 0.2s",
                    }}>
                      {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Payment Status</span>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)",
                    borderRadius: 20, padding: "4px 12px",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>Paid Successfully</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {order?.shippingAddress && (
                <div style={{
                  display: "flex", gap: 10,
                  padding: "12px 14px", borderRadius: "14px", background: "#FFFFFF", border: `1.5px solid ${T.border}`,
                  marginBottom: 16,
                }}>
                  <FiMapPin size={16} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.4 }}>
                    <p style={{ fontWeight: 850, margin: "0 0 2px", color: T.textDark }}>Delivery Address</p>
                    <p style={{ margin: 0, opacity: 0.85 }}>
                      {[order.shippingAddress.houseNo, order.shippingAddress.street, order.shippingAddress.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Delivery Timeline */}
              <div style={{ position: "relative", marginTop: 22, padding: "0 10px" }}>
                <div style={{ position: "absolute", top: 12, left: "10%", right: "10%", height: 2, background: T.border, zIndex: 0 }} />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 0.2 }}
                  transition={{ duration: 1.2, delay: 0.8 }}
                  style={{
                    position: "absolute", top: 12, left: "10%", right: "10%", height: 2,
                    background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`,
                    transformOrigin: "left", zIndex: 1
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: T.primary, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                      boxShadow: "0 0 10px rgba(91,191,181,0.2)"
                    }}>
                      <FiCheck size={14} color="#ffffff" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: T.primary }}>Confirmed</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#FFFFFF", border: `1.5px solid ${T.border}`,
                      display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
                    }}>
                      <FiTruck size={12} color={T.textLite} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.textLite }}>On The Way</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#FFFFFF", border: `1.5px solid ${T.border}`,
                      display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
                    }}>
                      <FiBox size={12} color={T.textLite} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.textLite }}>Delivered</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── ACTION BUTTONS ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{ display: "flex", gap: 12, marginTop: 10 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(91,191,181,0.2)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/orders/${dbId}`)}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: "100px", border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${T.primary} 0%, #46a198 100%)`,
                  color: "#ffffff", fontSize: 13, fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 15px rgba(91,191,181,0.15)",
                }}
              >
                <FiTruck size={16} /> Track Shipment
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, background: "rgba(0,0,0,0.01)", borderColor: T.primary }}
                whileTap={{ scale: 0.98 }}
                onClick={() => order && generateInvoicePDF(order)}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: "100px",
                  border: `1.5px solid ${T.border}`, cursor: "pointer",
                  background: "#FFFFFF", color: T.textDark,
                  fontSize: 13, fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.25s",
                }}
              >
                <FiDownload size={15} /> Get Invoice
              </motion.button>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Purchased Items, Bill Summary, Footer redirect ── */}
          <div className="success-col-right">
            {/* ── PURCHASED ITEMS PREVIEW ── */}
            {order?.items && order.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Your Order Items ({order.items.length})</p>
                <div 
                  className="items-scrollbar"
                  style={{
                    display: "flex", flexDirection: "column", gap: 10, maxHeight: "240px", overflowY: "auto", paddingRight: 6
                  }}
                >
                  {order.items.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: "#FFFFFF", border: `1.5px solid ${T.border}`,
                        borderRadius: "16px", padding: "10px 14px"
                      }}
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", border: `1.5px solid ${T.border}` }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.textDark, margin: "0 0 2px" }}>{item.name}</p>
                        <p style={{ fontSize: 10, color: T.textLite, margin: 0 }}>
                          {item.qty} {item.unit || "kg"} • <span style={{ color: T.primary, fontWeight: 800 }}>{fmt(item.price)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── DYNAMIC BILL RECEIPT PANEL ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              style={{
                background: T.cardBg, border: `1.5px solid ${T.border}`,
                borderRadius: "20px", padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.textMid }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
              </div>
              {shipping === 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.primary }}>
                  <span>Delivery Fee</span>
                  <span style={{ fontWeight: 700 }}>FREE ✓</span>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.textMid }}>
                  <span>Delivery Fee</span>
                  <span style={{ fontWeight: 600 }}>{fmt(shipping)}</span>
                </div>
              )}
              {totalDisc > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.primary }}>
                  <span>Saved Discount</span>
                  <span style={{ fontWeight: 700 }}>−{fmt(totalDisc)}</span>
                </div>
              )}
              <div style={{ height: 1.5, background: T.border, margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark }}>Total Amount Paid</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: T.primary, letterSpacing: "-0.03em" }}>{fmt(total)}</span>
              </div>
            </motion.div>

            {/* ── FOOTER ACTIONS & REDIRECT ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1.5px solid ${T.border}`, paddingTop: 18, marginTop: "auto" }}
            >
              <Link to="/products" style={{
                fontSize: 12, fontWeight: 700, color: T.primary, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <FiShoppingBag size={14} />
                Shop More Fresh Cuts
                <FiChevronRight size={14} />
              </Link>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 44, height: 4, borderRadius: 10, background: T.border, overflow: "hidden" }}>
                  <motion.div
                    initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
                    transition={{ duration: 45, ease: "linear" }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, borderRadius: 10, transformOrigin: "left" }}
                  />
                </div>
                <span style={{ fontSize: 11, color: T.textLite, fontWeight: 600 }}>
                  {redirectTime}s
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}