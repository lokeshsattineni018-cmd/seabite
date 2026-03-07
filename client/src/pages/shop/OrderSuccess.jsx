import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiCopy, FiTruck,
  FiDownload, FiChevronRight, FiMapPin, FiTag,
} from "react-icons/fi";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8",
  surface: "#ffffff",
  border: "#E2EEEC",
  textDark: "#1A2B35",
  textMid: "#4A6572",
  textLite: "#8BA5B3",
  primary: "#5BA8A0",
  sky: "#89C2D9",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n || 0);

// ── Particle dot (subtle floating dots) ─────────────────────────────────
function Particle({ x, y, delay, size, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 0 }}
      animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], y: -60 }}
      transition={{ duration: 1.8, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 3 + Math.random() * 2 }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Ripple ring ──────────────────────────────────────────────────────────
function RippleRing({ delay }) {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0.5 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 2.2, delay, repeat: Infinity, ease: "easeOut" }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: `1.5px solid ${T.primary}`,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Timeline Step ────────────────────────────────────────────────────────
function TimelineStep({ label, sub, active, icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: active ? `linear-gradient(135deg, ${T.primary}, ${T.sky})` : T.surface,
        border: active ? "none" : `1.5px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: active ? `0 6px 18px rgba(91,168,160,0.30)` : "none",
        color: active ? "#fff" : T.textLite, fontSize: 15,
      }}>
        {active ? <FiCheck size={18} strokeWidth={2.5} /> : icon}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: active ? T.primary : T.textLite, margin: "0 0 1px", lineHeight: 1.3 }}>{label}</p>
        <p style={{ fontSize: 9, color: T.textLite, margin: 0 }}>{sub}</p>
      </div>
    </motion.div>
  );
}

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const dbId = params.get("dbId");
  const discount = Number(params.get("discount") || 0);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redirectTime, setRedirectTime] = useState(30);
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
      .finally(() => { setLoading(false); setTimeout(() => setVisible(true), 60); });
  }, [dbId]);

  useEffect(() => {
    if (!loading) setTimeout(() => setVisible(true), 60);
  }, [loading]);

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

  // Particle dots config
  const particles = [
    { x: "10%", y: "20%", delay: 0, size: 6, color: T.primary },
    { x: "85%", y: "12%", delay: 0.6, size: 5, color: T.sky },
    { x: "20%", y: "75%", delay: 1.1, size: 4, color: T.primary },
    { x: "78%", y: "68%", delay: 0.3, size: 7, color: T.sky },
    { x: "50%", y: "5%", delay: 0.9, size: 5, color: "#E8816A" },
    { x: "5%", y: "50%", delay: 1.4, size: 4, color: T.sky },
    { x: "92%", y: "45%", delay: 0.7, size: 6, color: T.primary },
  ];

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: T.bg,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Ambient gradient */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(180deg, rgba(91,168,160,0.08) 0%, transparent 100%)" }} />
      </div>

      {/* Floating particles */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {particles.map((p, i) => <Particle key={i} {...p} />)}
      </div>

      {/* ── MAIN CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 480,
          padding: "0 20px",
        }}
      >
        {/* ── HERO ── */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {/* Checkmark circle */}
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 14px" }}>
            <RippleRing delay={0} />
            <RippleRing delay={0.9} />
            <motion.div
              initial={{ scale: 0 }}
              animate={visible ? { scale: 1 } : {}}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 14
              }}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#635BFF,#7A73FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                margin: "auto",
                position: "relative",
                zIndex: 1,
                boxShadow: "0 16px 48px rgba(99,91,255,0.38)",
              }}
            >
              <FiCheck size={34} strokeWidth={3} />
            </motion.div>
          </div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.38, duration: 0.35 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(91,168,160,0.10)", border: "1px solid rgba(91,168,160,0.22)",
              borderRadius: 20, padding: "3px 12px 3px 7px", marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13 }}>🎉</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: "0.07em" }}>ORDER CONFIRMED</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 26, fontWeight: 800, color: T.textDark, margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.2 }}
          >
            Thank you!{" "}
            <span style={{ background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your catch is on its way.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52, duration: 0.4 }}
            style={{ fontSize: 12.5, color: T.textMid, margin: 0, lineHeight: 1.6, fontWeight: 500 }}
          >
            Packed fresh and heading to your door 🌊
          </motion.p>
        </div>

        {/* ── ORDER INFO + TIMELINE (single card) ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`,
            boxShadow: "0 4px 24px rgba(91,168,160,0.08)", overflow: "hidden", marginBottom: 10,
          }}
        >
          {/* Top gradient strip */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${T.primary}, ${T.sky})` }} />

          <div style={{ padding: "14px 18px" }}>
            {/* Order ID row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 8, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 3px" }}>Order Reference</p>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: T.textDark }}>#{displayId}</span>
                  <motion.button whileTap={{ scale: 0.86 }} onClick={copyId} style={{
                    background: copied ? "rgba(91,168,160,0.1)" : "#F4F9F8",
                    border: `1px solid ${copied ? T.primary : T.border}`,
                    borderRadius: 6, padding: "3px 7px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                    fontSize: 9, fontWeight: 700, color: copied ? T.primary : T.textLite,
                    fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
                  }}>
                    {copied ? <FiCheck size={9} /> : <FiCopy size={9} />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "rgba(91,168,160,0.09)", border: "1px solid rgba(91,168,160,0.18)",
                  borderRadius: 8, padding: "3px 8px",
                }}>
                  <FiCheck size={9} style={{ color: T.primary }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.primary }}>Paid</span>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "#F4F9F8", border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: "3px 8px",
                }}>
                  <FiTruck size={9} style={{ color: T.textLite }} />
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.textLite }}>2–3 Days</span>
                </div>
              </div>
            </div>

            {/* Address */}
            {order?.shippingAddress?.city && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 8, background: "#F7FAFA", border: `1px solid ${T.border}`,
                marginBottom: 12,
              }}>
                <FiMapPin size={10} style={{ color: T.primary, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: T.textMid, fontWeight: 500 }}>
                  {[order.shippingAddress.address, order.shippingAddress.city, order.shippingAddress.postalCode].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: T.border, margin: "0 0 12px" }} />

            {/* Timeline */}
            <div style={{ position: "relative" }}>
              {/* Track line */}
              <div style={{ position: "absolute", top: 19, left: "calc(16.66% + 8px)", right: "calc(16.66% + 8px)", height: 2, background: T.border, zIndex: 0 }} />
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 0.12 }}
                transition={{ duration: 1, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "absolute", top: 19, left: "calc(16.66% + 8px)", right: "calc(16.66% + 8px)", height: 2, background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, transformOrigin: "left", zIndex: 1 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
                <TimelineStep label="Order Confirmed" sub="Just now" active={true} icon="📦" index={0} />
                <TimelineStep label="Out for Delivery" sub="2–3 days" active={false} icon="🚚" index={1} />
                <TimelineStep label="Delivered" sub="At your door" active={false} icon="🏠" index={2} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── BILL SUMMARY (compact strip) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
            padding: "12px 18px", marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Subtotal", value: fmt(subtotal) },
            shipping === 0 && { label: "Shipping", value: "FREE ✓", green: true },
            totalDisc > 0 && { label: "Saved", value: `−${fmt(totalDisc)}`, green: true },
            tax > 0 && { label: "Tax", value: fmt(tax) },
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em" }}>{row.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: row.green ? T.primary : T.textMid }}>{row.value}</span>
            </div>
          ))}
          <div style={{ height: 28, width: 1, background: T.border }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Paid</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em" }}>{fmt(total)}</span>
          </div>
        </motion.div>

        {/* ── CTA BUTTONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.76, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", gap: 8, marginBottom: 14 }}
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/orders/${dbId}`)}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 48, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${T.primary}, ${T.sky})`,
              color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: "0 8px 24px rgba(91,168,160,0.30)",
              letterSpacing: "-0.01em",
            }}
          >
            <FiTruck size={14} /> Track Order
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => order && generateInvoicePDF(order)}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: 48,
              border: `1.5px solid ${T.border}`, cursor: "pointer",
              background: T.surface, color: T.textMid,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              letterSpacing: "-0.01em", transition: "border-color 0.18s, color 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
          >
            <FiDownload size={14} /> Invoice
          </motion.button>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.84, duration: 0.4 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <motion.div whileHover={{ x: 3 }}>
            <Link to="/products" style={{
              fontSize: 12, fontWeight: 700, color: T.textMid, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <FiShoppingBag size={12} style={{ color: T.primary }} />
              Continue Shopping
              <FiChevronRight size={12} style={{ color: T.primary }} />
            </Link>
          </motion.div>

          {/* Progress bar + timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 48, height: 3, borderRadius: 3, background: T.border, overflow: "hidden" }}>
              <motion.div
                initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
                transition={{ duration: 30, ease: "linear" }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, borderRadius: 3, transformOrigin: "left" }}
              />
            </div>
            <span style={{ fontSize: 10, color: T.textLite, fontWeight: 500 }}>
              {redirectTime}s
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}