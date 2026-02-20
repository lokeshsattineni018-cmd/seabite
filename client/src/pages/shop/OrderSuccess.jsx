import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiArrowRight, FiPackage,
  FiTag, FiCopy, FiTruck, FiClock, FiDownload
} from "react-icons/fi";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};

const font = "'Plus Jakarta Sans', sans-serif";

// ── Light confetti (seafoam / sky / sand tones only)
const Particle = ({ index }) => {
  const colors = ["#5BA8A0", "#89C2D9", "#B5D5CE", "#E8816A22", "#D4EAE7", "#A8D4CF"];
  const size = Math.random() * 7 + 4;
  const xStart = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = 3 + Math.random() * 3;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: `${xStart}vw`, scale: 0 }}
      animate={{ opacity: [0, 0.8, 0.6, 0], y: ["0vh", "100vh"], x: [`${xStart}vw`, `${xStart + (Math.random() * 16 - 8)}vw`], rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)], scale: [0, 1, 1, 0.4] }}
      transition={{ duration, delay, ease: "easeOut" }}
      style={{
        position: "absolute", borderRadius: Math.random() > 0.5 ? "50%" : 2,
        background: colors[index % colors.length], pointerEvents: "none",
        width: size, height: size,
      }}
    />
  );
};

// ── Subtle pulse ring
const PulseRing = ({ delay, size }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0.4 }}
    animate={{ scale: 2.2, opacity: 0 }}
    transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay }}
    style={{ position: "absolute", background: "rgba(91,168,160,0.08)", borderRadius: "50%", width: size, height: size }}
  />
);

// ── Mini timeline step
const TimelineStep = ({ icon, label, active, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.0 + index * 0.1, duration: 0.4 }}
    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
  >
    <div style={{
      width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
      background: active ? "rgba(91,168,160,0.1)" : "#F0F5F4",
      color: active ? T.primary : T.textLite,
      transition: "all 0.3s",
    }}>
      {icon}
    </div>
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
      color: active ? T.primary : T.textLite,
    }}>{label}</span>
  </motion.div>
);

export default function OrderSuccess() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const dbId = queryParams.get("dbId");
  const discount = queryParams.get("discount") || 0;

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [orderFetchSuccess, setOrderFetchSuccess] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!dbId) { setLoading(false); return; }
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${dbId}`, { withCredentials: true });
        setOrderDetails(data);
        setOrderFetchSuccess(true);
      } catch {
        setOrderFetchSuccess(false);
      }
      finally { setLoading(false); }
    };
    fetchOrder();
  }, [dbId]);

  useEffect(() => {
    if (orderFetchSuccess) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [orderFetchSuccess]);

  const copyOrderId = () => {
    if (orderDetails?.orderId) {
      navigator.clipboard.writeText(orderDetails.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden",
      fontFamily: font,
    }}>
      {/* Ambient radials */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,168,160,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(137,194,217,0.08) 0%, transparent 70%)" }} />
        {/* Wave bottom decoration */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", opacity: 0.4 }} viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z" fill="rgba(91,168,160,0.07)" />
        </svg>
      </div>

      {/* Confetti */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {showContent && [...Array(18)].map((_, i) => <Particle key={i} index={i} />)}
      </div>

      {/* ── MAIN CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 90, delay: 0.1 }}
        style={{
          position: "relative", background: T.surface,
          width: "100%", maxWidth: 480,
          borderRadius: 24, border: `1px solid ${T.border}`,
          boxShadow: "0 8px 60px rgba(91,168,160,0.12), 0 2px 8px rgba(26,43,53,0.06)",
          padding: "40px 36px", textAlign: "center",
        }}
      >
        {/* ── SUCCESS ICON ── */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.3 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: 100, height: 100, margin: "0 auto 28px" }}
        >
          <PulseRing delay={0} size={100} />
          <PulseRing delay={0.9} size={100} />

          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.5 }}
            style={{
              position: "relative", zIndex: 1,
              width: 68, height: 68, borderRadius: 18,
              background: "linear-gradient(135deg, #5BA8A0, #89C2D9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 28px rgba(91,168,160,0.32)",
            }}
          >
            <FiCheck size={30} color="#fff" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        {/* ── TITLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 20 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textDark, margin: "0 0 10px", letterSpacing: "-0.03em" }}>
            Order Confirmed! 🌊
          </h1>
          <p style={{ fontSize: 13.5, color: T.textLite, lineHeight: 1.7, maxWidth: 300, margin: "0 auto" }}>
            Thank you for choosing SeaBite.<br />Your fresh catch is being prepared.
          </p>
        </motion.div>

        {/* ── DISCOUNT BADGE ── */}
        <AnimatePresence>
          {discount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.65, type: "spring", stiffness: 200 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 20, padding: "9px 18px", borderRadius: 12, background: "rgba(91,168,160,0.1)", border: "1px solid rgba(91,168,160,0.18)", color: T.primary }}
            >
              <FiTag size={13} />
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                You saved ₹{Number(discount).toLocaleString()} 🎉
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ORDER NUMBER CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginBottom: 24, background: T.bg, borderRadius: 16,
            padding: "20px", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden",
          }}
        >
          {/* Animated bottom accent */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${T.primary}, ${T.sky}, ${T.primary})`,
              opacity: 0.4, transformOrigin: "left",
            }}
          />
          <p style={{ fontSize: 9, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>
            Order Number
          </p>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0" }}>
                <SeaBiteLoader />
              </motion.div>
            ) : (
              <motion.div key="orderId" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <p style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "0.04em" }}>
                  {orderDetails ? `#${orderDetails.orderId}` : "#N/A"}
                </p>
                {orderDetails?.orderId && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={copyOrderId}
                    style={{ width: 28, height: 28, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: copiedId ? T.primary : T.textLite, cursor: "pointer" }}>
                    {copiedId ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery estimate row */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.textLite, display: "flex", alignItems: "center", gap: 5 }}>
              <FiTruck size={11} /> Est. Delivery
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: T.primary }}>2–3 Days</span>
          </div>
        </motion.div>

        {/* ── ACTIONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}
        >
          <Link to={`/orders/${dbId}`} style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 10px 28px rgba(91,168,160,0.28)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%", padding: "15px 20px", borderRadius: 14,
                background: T.primary, color: "#fff", border: "none",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontFamily: font, boxShadow: "0 4px 20px rgba(91,168,160,0.24)",
                letterSpacing: "-0.01em",
              }}
            >
              <FiPackage size={15} />
              Track Your Delivery
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
                <FiArrowRight size={15} />
              </motion.span>
            </motion.button>
          </Link>

          <Link to="/products" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ y: -1, background: T.bg }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 14,
                background: "transparent", color: T.textMid, border: `1px solid ${T.border}`,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: font, transition: "all 0.2s",
              }}
            >
              <FiShoppingBag size={14} /> Continue Shopping
            </motion.button>
          </Link>

          {/* Invoice Button (New) */}
          <motion.button
            onClick={() => orderDetails && generateInvoicePDF(orderDetails)}
            disabled={!orderDetails}
            whileHover={orderDetails ? { y: -1, background: T.bg } : {}}
            whileTap={orderDetails ? { scale: 0.97 } : {}}
            style={{
              width: "100%", padding: "13px 20px", borderRadius: 14,
              background: "transparent", color: orderDetails ? T.textMid : T.textLite,
              border: `1px solid ${T.border}`,
              fontSize: 13, fontWeight: 600, cursor: orderDetails ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: font, transition: "all 0.2s",
              opacity: orderDetails ? 1 : 0.6
            }}
          >
            <FiDownload size={14} /> Download Invoice
          </motion.button>
        </motion.div>

        {/* ── MINI TIMELINE ── */}
        <div style={{ paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            {/* Track line */}
            <div style={{ position: "absolute", top: 17, left: "10%", right: "10%", height: 2, background: T.border, borderRadius: 2 }} />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "10%" }}
              transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "absolute", top: 17, left: "10%", height: 2, background: T.primary, borderRadius: 2 }}
            />
            {[
              { icon: <FiCheck size={12} />, label: "Confirmed", active: true },
              { icon: <FiPackage size={12} />, label: "Packing", active: false },
              { icon: <FiTruck size={12} />, label: "Shipped", active: false },
              { icon: <FiClock size={12} />, label: "Delivery", active: false },
            ].map((step, i) => (
              <TimelineStep key={i} icon={step.icon} label={step.label} active={step.active} index={i} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}