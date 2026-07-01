import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiCopy, FiTruck,
  FiDownload, FiChevronRight, FiMapPin, FiCalendar, FiBox, FiArrowRight
} from "react-icons/fi";
import confetti from "canvas-confetti";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// God-Level Ocean Theme Palette
const T = {
  bgGradient: "linear-gradient(135deg, #050e17 0%, #0c233c 50%, #061220 100%)",
  glass: "rgba(12, 35, 60, 0.5)",
  glassBorder: "rgba(91, 191, 181, 0.2)",
  primary: "#5BBFB5", // SeaBite brand teal
  sky: "#8ecae6",
  accent: "#ffb703", // Gold highlight
  textDark: "#ffffff",
  textMid: "#a8dadc",
  textLite: "#7fa3b7",
  cardBg: "rgba(255, 255, 255, 0.03)",
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
        colors: ['#5BBFB5', '#8ecae6', '#ffffff', '#ffb703'],
        shapes: ['circle', 'square'],
        scalar: randomInRange(0.5, 1.0)
      });
      
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 },
        colors: ['#5BBFB5', '#8ecae6', '#ffffff', '#ffb703'],
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
        colors: ['#5BBFB5', '#ffb703', '#ffffff'],
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
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: T.bgGradient,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: "hidden",
      position: "relative",
      padding: "40px 20px"
    }}>
      {/* 🌊 CSS Animated Bio-Luminescent Waves & Bubbles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        @keyframes float-bubble {
          0% { transform: translateY(100vh) scale(0.8); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
        }

        @keyframes wave-flow {
          0% { background-position-x: 0px; }
          100% { background-position-x: 1000px; }
        }

        .bubble {
          position: absolute;
          background: radial-gradient(circle, rgba(91,191,181,0.2) 0%, rgba(142,202,230,0.05) 70%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          pointer-events: none;
          bottom: -50px;
        }

        .bubble-1 { left: 10%; width: 40px; height: 40px; animation: float-bubble 12s infinite linear; }
        .bubble-2 { left: 30%; width: 20px; height: 20px; animation: float-bubble 8s infinite linear 2s; }
        .bubble-3 { left: 75%; width: 50px; height: 50px; animation: float-bubble 15s infinite linear 4s; }
        .bubble-4 { left: 90%; width: 30px; height: 30px; animation: float-bubble 10s infinite linear 1s; }
        .bubble-5 { left: 50%; width: 15px; height: 15px; animation: float-bubble 7s infinite linear 5s; }

        /* Custom Scrollbar for Items list */
        .items-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .items-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 100px;
        }
        .items-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(91, 191, 181, 0.25);
          border-radius: 100px;
        }
        .items-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(91, 191, 181, 0.4);
        }
      `}</style>

      {/* Floating Bubbles */}
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />
      <div className="bubble bubble-4" />
      <div className="bubble bubble-5" />

      {/* ── MAIN GLASS CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 540,
          background: T.glass,
          backdropFilter: "blur(24px)",
          border: `1px solid ${T.glassBorder}`,
          borderRadius: "32px",
          padding: "36px",
          boxShadow: "0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Glowing Ambient Aura */}
        <div style={{
          position: "absolute",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "150px",
          background: "radial-gradient(circle, rgba(91,191,181,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: -1
        }} />

        {/* ── HERO HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          {/* Checkmark Ring Animation */}
          <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 18px" }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
              style={{
                position: "absolute", inset: -10, borderRadius: "50%",
                border: `2px solid ${T.primary}`,
              }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.7, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "easeOut" }}
              style={{
                position: "absolute", inset: -15, borderRadius: "50%",
                border: `2px solid ${T.sky}`,
              }}
            />
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={visible ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: "spring", stiffness: 220, damping: 15 }}
              onClick={fireConfetti}
              style={{
                width: 90, height: 90, borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 30px rgba(16,185,129,0.3)",
                border: "3px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
                position: "relative", zIndex: 1,
              }}
            >
              <svg width="46" height="46" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  d="M10 20.5L16.5 27L30 13.5"
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={visible ? { pathLength: 1 } : {}}
                  transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                />
              </svg>
            </motion.div>
          </div>

          {/* Sparkly Confirm Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(91,191,181,0.08)", border: "1px solid rgba(91,191,181,0.2)",
              borderRadius: 30, padding: "5px 16px 5px 10px", marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14 }}>🐠</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.primary, letterSpacing: "0.1em" }}>FRESH CATCH CONFIRMED</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ease: "easeOut" }}
            style={{ fontSize: 28, fontWeight: 800, color: T.textDark, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.25 }}
          >
            Catch Secured!{" "}
            <span style={{ background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Harvest underway.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ fontSize: 13, color: T.textMid, margin: 0, fontWeight: 500, opacity: 0.85 }}
          >
            Harbor dispatch team is packaging your order with direct ice-compliance.
          </motion.p>
        </div>

        {/* ── ORDER TIMELINE & REFERENCE CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "24px",
            padding: "20px",
            marginBottom: 20,
          }}
        >
          {/* ID Details Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Order ID</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15, color: T.textDark }}>#{displayId}</span>
                <button onClick={copyId} style={{
                  background: copied ? "rgba(91,191,181,0.12)" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${copied ? T.primary : "rgba(255, 255, 255, 0.1)"}`,
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
              <span style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Status</span>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 20, padding: "4px 12px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>Paid Successfully</span>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          {order?.shippingAddress && (
            <div style={{
              display: "flex", gap: 10,
              padding: "12px 14px", borderRadius: "16px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)",
              marginBottom: 16,
            }}>
              <FiMapPin size={16} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 11, color: T.textMid, lineHeight: 1.4 }}>
                <p style={{ fontWeight: 700, margin: "0 0 2px", color: T.textDark }}>Delivery Address</p>
                <p style={{ margin: 0, opacity: 0.8 }}>
                  {[order.shippingAddress.houseNo, order.shippingAddress.street, order.shippingAddress.city].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Delivery Timeline */}
          <div style={{ position: "relative", marginTop: 24, padding: "0 10px" }}>
            {/* Timeline Progress track */}
            <div style={{ position: "absolute", top: 12, left: "10%", right: "10%", height: 2, background: "rgba(255,255,255,0.08)", zIndex: 0 }} />
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
              {/* Step 1 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: T.primary, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center",
                  boxShadow: "0 0 15px rgba(91,191,181,0.4)"
                }}>
                  <FiCheck size={14} color="#050e17" strokeWidth={3} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.primary }}>Confirmed</span>
              </div>
              {/* Step 2 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#0c233c", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
                }}>
                  <FiTruck size={12} color={T.textLite} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: T.textLite }}>On The Way</span>
              </div>
              {/* Step 3 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#0c233c", border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center"
                }}>
                  <FiBox size={12} color={T.textLite} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: T.textLite }}>Delivered</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── PURCHASED ITEMS PREVIEW (GOD-LEVEL TOUCH) ── */}
        {order?.items && order.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ marginBottom: 20 }}
          >
            <p style={{ fontSize: 10, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Your Order Items ({order.items.length})</p>
            <div 
              className="items-scrollbar"
              style={{
                display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10,
              }}
            >
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "16px", padding: "10px 14px", flexShrink: 0, minWidth: "190px"
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(255,255,255,0.05)" }}
                  />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.textDark, margin: "0 0 2px" }}>{item.name}</p>
                    <p style={{ fontSize: 10, color: T.textLite, margin: 0 }}>
                      {item.qty} {item.unit || "kg"} • <span style={{ color: T.primary, fontWeight: 700 }}>{fmt(item.price)}</span>
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
          transition={{ delay: 0.75 }}
          style={{
            background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: "20px", padding: "16px", marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.textMid }}>
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {shipping === 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.primary }}>
              <span>Delivery Fee</span>
              <span style={{ fontWeight: 700 }}>FREE ✓</span>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.textMid }}>
              <span>Delivery Fee</span>
              <span>{fmt(shipping)}</span>
            </div>
          )}
          {totalDisc > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: T.primary }}>
              <span>Saved Discount</span>
              <span>−{fmt(totalDisc)}</span>
            </div>
          )}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark }}>Total Amount Paid</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.primary, letterSpacing: "-0.02em" }}>{fmt(total)}</span>
          </div>
        </motion.div>

        {/* ── PREMIUM GLOWING ACTION BUTTONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: "flex", gap: 12, marginBottom: 20 }}
        >
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 8px 25px rgba(91,191,181,0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/orders/${dbId}`)}
            style={{
              flex: 1, padding: "14px 20px", borderRadius: "100px", border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${T.primary} 0%, #46a198 100%)`,
              color: "#050e17", fontSize: 13, fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 15px rgba(91,191,181,0.2)",
            }}
          >
            <FiTruck size={16} /> Track Fresh Shipment
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.06)", borderColor: T.primary }}
            whileTap={{ scale: 0.98 }}
            onClick={() => order && generateInvoicePDF(order)}
            style={{
              flex: 1, padding: "14px 20px", borderRadius: "100px",
              border: "1.5px solid rgba(255,255,255,0.1)", cursor: "pointer",
              background: "rgba(255,255,255,0.02)", color: T.textDark,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.25s",
            }}
          >
            <FiDownload size={15} /> Get Invoice
          </motion.button>
        </motion.div>

        {/* ── FOOTER DURATION LOOPER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 18 }}
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
            <div style={{ width: 44, height: 4, borderRadius: 10, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
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
      </motion.div>
    </div>
  );
}