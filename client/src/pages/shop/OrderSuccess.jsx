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

// Clean, Premium Apple-style Theme Palette
const T = {
  bgGradient: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)",
  surface: "#FFFFFF",
  border: "#E8E8ED",
  primary: "#0071E3", // Apple classic blue
  sky: "#89C2D9",
  accent: "#FFB703",
  textDark: "#1D1D1F", // Apple primary black
  textMid: "#86868B",  // Apple secondary grey
  textLite: "#A1A1A6",
  cardBg: "#F5F5F7",   // Apple light background
  shadow: "none",
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
    if (dbId) {
      const viewedKey = `viewed_success_${dbId}`;
      if (sessionStorage.getItem(viewedKey)) {
        navigate("/orders", { replace: true });
        return;
      }
      sessionStorage.setItem(viewedKey, "true");
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

  // 🎊 High-Fidelity Fullscreen Confetti Explosion
  const fireConfetti = () => {
    // 1. Initial central blast
    confetti({
      particleCount: 200,
      spread: 130,
      origin: { y: 0.6 },
      colors: ['#0071E3', '#10B981', '#FFB703', '#ffffff'],
      scalar: 1.2,
      zIndex: 99999
    });

    // 2. Left side blast
    confetti({
      particleCount: 120,
      angle: 60,
      spread: 90,
      origin: { x: 0, y: 0.75 },
      colors: ['#0071E3', '#10B981', '#FFB703', '#ffffff'],
      zIndex: 99999
    });

    // 3. Right side blast
    confetti({
      particleCount: 120,
      angle: 120,
      spread: 90,
      origin: { x: 1, y: 0.75 },
      colors: ['#0071E3', '#10B981', '#FFB703', '#ffffff'],
      zIndex: 99999
    });

    // 4. Repeated fireworks shower
    const duration = 4.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0071E3', '#FFB703']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0071E3', '#FFB703']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
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

  // COD vs. Paid Logic
  const isPaid = order?.isPaid || (order && order.paymentMethod !== "COD" && order.paymentMethod !== "Cash" && order.paymentMethod !== "UPI" && order.isPaid !== false);
  const isCOD = order?.paymentMethod === "COD" || order?.paymentMethod === "Cash" || order?.paymentMethod === "UPI";
  
  const paymentStatusText = isPaid ? "Paid Successfully" : (isCOD ? "Cash on Delivery" : "Pending Payment");
  const paymentStatusColor = isPaid ? "#10B981" : (isCOD ? "#F59E0B" : "#EF4444");
  const paymentStatusBg = isPaid ? "rgba(16,185,129,0.08)" : (isCOD ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)");
  const paymentStatusBorder = isPaid ? "rgba(16,185,129,0.18)" : (isCOD ? "rgba(245,158,11,0.18)" : "rgba(239,68,68,0.18)");
  
  const totalAmountLabel = isPaid ? "Total Amount Paid" : "Total Amount to Pay";

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
          background: rgba(0, 113, 227, 0.25);
          border-radius: 100px;
        }
        .items-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 113, 227, 0.4);
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

      {/* ── MAIN APPLE-LIKE CONTAINER ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1040,
          padding: "40px 20px",
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
                  background: "rgba(0,113,227,0.08)", border: "1.5px solid rgba(0,113,227,0.18)",
                  borderRadius: 30, padding: "4px 14px 4px 8px", marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13 }}>🎉</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: T.primary, letterSpacing: "0.08em" }}>ORDER CONFIRMED</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ fontSize: 32, fontWeight: 800, color: T.textDark, margin: "0 0 8px", letterSpacing: "-0.03em", lineHeight: 1.2 }}
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
                style={{ fontSize: 14, color: T.textMid, margin: 0, fontWeight: 500, lineHeight: 1.5 }}
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
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              {/* ID Details Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px" }}>Order ID</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: T.textDark }}>#{displayId}</span>
                    <button onClick={copyId} style={{
                      background: copied ? "rgba(0,113,227,0.12)" : "#FFFFFF",
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
                    background: paymentStatusBg, border: `1px solid ${paymentStatusBorder}`,
                    borderRadius: 20, padding: "4px 12px",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: paymentStatusColor }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: paymentStatusColor }}>{paymentStatusText}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {order?.shippingAddress && (
                <div style={{
                  display: "flex", gap: 10,
                  padding: "14px", borderRadius: "14px", background: "#FFFFFF",
                  marginBottom: 20,
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
                      boxShadow: "0 0 10px rgba(0,113,227,0.2)"
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
                whileHover={{ scale: 1.02, background: "#000000" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/orders/${dbId}`)}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: "980px", border: "none", cursor: "pointer",
                  background: "#1D1D1F",
                  color: "#ffffff", fontSize: 13, fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <FiTruck size={16} /> Track Shipment
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, background: "#E8E8ED" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => order && generateInvoicePDF(order)}
                style={{
                  flex: 1, padding: "14px 20px", borderRadius: "980px",
                  border: "none", cursor: "pointer",
                  background: "#F5F5F7", color: T.textDark,
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
                        background: "#FFFFFF", border: `1px solid ${T.border}`,
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
                background: T.cardBg,
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
                <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark }}>{totalAmountLabel}</span>
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