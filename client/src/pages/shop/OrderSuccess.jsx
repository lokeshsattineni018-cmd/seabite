import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiArrowRight,
  FiPackage, FiCopy, FiTruck, FiDownload, FiChevronRight
} from "react-icons/fi";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};

// ── shared spring / fade-up helpers ──────────
const FU = (delay = 0, y = 18) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.52, delay, ease: [0.22, 1, 0.36, 1] },
});

const CHIP_VAR = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  visible: (i) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 260, damping: 18, delay: 0.72 + i * 0.10 },
  }),
};

// ── Pulse rings behind check icon ────────────
const PulseRing = ({ delay }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0.45 }}
    animate={{ scale: 2.8, opacity: 0 }}
    transition={{ duration: 2.8, delay, repeat: Infinity, ease: "easeOut" }}
    className="absolute inset-0 rounded-full bg-[rgba(34,197,94,0.10)]"
  />
);

const Particle = ({ i }) => (
  <motion.div
    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      scale: [0, 1.2, 0],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      delay: Math.random() * 2,
    }}
    className="absolute w-1.5 h-1.5 rounded-full bg-[#5BA8A0]/20 z-0"
    style={{ left: "50%", top: "50%" }}
  />
);

// ── SVG check that draws itself ───────────────
const AnimatedCheck = () => (
  <motion.svg
    width="28" height="28" viewBox="0 0 24 24"
    fill="none" stroke="white" strokeWidth="2.8"
    strokeLinecap="round" strokeLinejoin="round"
    initial="hidden" animate="visible"
  >
    <motion.polyline
      points="20 6 9 17 4 12"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
          pathLength: 1, opacity: 1,
          transition: { pathLength: { delay: 0.52, duration: 0.4, ease: "easeOut" }, opacity: { delay: 0.52 } }
        },
      }}
    />
  </motion.svg>
);

// ── Timeline step ─────────────────────────────
const TLStep = ({ icon, label, active, delay }) => (
  <motion.div {...FU(delay)} className="flex flex-col items-center gap-1.5 z-10">
    <div className={[
      "w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[13px] transition-transform duration-200 hover:-translate-y-0.5",
      active ? "bg-[rgba(91,168,160,.12)] text-[#5BA8A0]" : "bg-[#F0F5F4] text-[#8BA5B3]",
    ].join(" ")}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-[#5BA8A0]" : "text-[#8BA5B3]"}`}>
      {label}
    </span>
  </motion.div>
);

// ── Bottom ticker ─────────────────────────────
const TICKER = [
  "🐟 Fresh Catch Daily", "🦐 Cold-Chain Delivered",
  "🦀 Chemical-Free Seafood", "🌊 Mogalthur Coast", "⭐ 4.8 Avg Rating",
];
const Ticker = () => (
  <div
    className="fixed bottom-0 left-0 right-0 z-20 overflow-hidden py-[7px]"
    style={{ background: "rgba(26,43,53,.90)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(91,168,160,.2)" }}
  >
    <motion.div
      animate={{ x: ["0%", "-50%"] }}
      transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      className="flex whitespace-nowrap"
    >
      {[...TICKER, ...TICKER].map((t, i) => (
        <span key={i} className="inline-flex items-center gap-2 px-7 text-[10px] font-bold uppercase tracking-[.18em] text-white/55">
          {t} <span className="text-[#5BA8A0] text-[13px]">〰</span>
        </span>
      ))}
    </motion.div>
  </div>
);

// ══════════════════════════════════════════════
//  PAGE
// ══════════════════════════════════════════════
export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const dbId = params.get("dbId");
  const discount = Number(params.get("discount") || 0);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redirectTime, setRedirectTime] = useState(12);

  useEffect(() => {
    // 🔐 Navigation Guard: Prevent direct URL access
    if (!location.state?.fromCheckout) {
      navigate("/orders", { replace: true });
      return;
    }

    if (!dbId) { setLoading(false); return; }
    axios.get(`${API_URL}/api/orders/${dbId}`, { withCredentials: true })
      .then(({ data }) => setOrder(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [dbId]);

  // Handle Redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/orders", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const copyId = () => {
    if (!order?.orderId) return;
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CHIPS = [
    { emoji: "🐟", label: "Sourced today" },
    { emoji: "🦐", label: "Lab verified" },
    { emoji: "🦀", label: "Cold-chain packed" },
  ];

  return (
    <div
      className="min-h-screen pb-14"
      style={{ background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { -webkit-font-smoothing: antialiased; }
        @keyframes barSlide { 0%{background-position:0%} 100%{background-position:300%} }
        .grad-bar {
          background: linear-gradient(90deg,#5BA8A0,#89C2D9,#E8816A,#89C2D9,#5BA8A0);
          background-size: 300% 100%;
          animation: barSlide 4s linear infinite;
        }
      `}</style>

      {/* ═══════════════════════════════════
          DARK HERO — same pattern as Home
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "#1A2B35", position: "relative" }}
      >
        {/* dot grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 0%,rgba(91,168,160,.13) 0%,transparent 65%)" }} />

        {/* animated gradient bar */}
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grad-bar h-[3px] w-full origin-left"
        />

        <div className="max-w-[480px] mx-auto px-8 pt-20 pb-0 text-center relative z-10 overflow-hidden">
          {/* Decorative particles */}
          {[...Array(12)].map((_, i) => (
            <Particle key={i} i={i} />
          ))}


          {/* Check icon */}
          <motion.div {...FU(0)} className="relative w-[88px] h-[88px] mx-auto mb-7 flex items-center justify-center">
            <PulseRing delay={0.5} />
            <PulseRing delay={1.4} />
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.28 }}
              className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center relative z-10"
              style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)", boxShadow: "0 8px 28px rgba(34,197,94,.35)" }}
            >
              <AnimatedCheck />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1 {...FU(0.38)}
            className="text-[32px] font-[800] text-white leading-none mb-1.5"
            style={{ fontFamily: "'Bricolage Grotesque',sans-serif", letterSpacing: "-0.04em" }}
          >
            Order Confirmed!
          </motion.h1>

          {/* Sub-text */}
          <motion.p {...FU(0.46)}
            className="text-[14px] leading-relaxed mb-4"
            style={{ color: "rgba(255,255,255,.55)", maxWidth: 300, margin: "0 auto 16px" }}
          >
            Your fresh catch is being packed with care.{" "}
            Estimated delivery in{" "}
            <strong style={{ color: "#5BA8A0" }}>2–3 days.</strong>
          </motion.p>

          {/* Seafood quality chips */}
          <div className="flex justify-center gap-2.5 flex-wrap pb-4">
            {CHIPS.map((c, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={CHIP_VAR}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold"
                style={{
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.12)",
                  color: "rgba(255,255,255,.75)",
                }}
              >
                <span>{c.emoji}</span> {c.label}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Wave — dark to light, matches WaveTicker */}
        <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", width: "100%", height: 32, background: "#F4F9F8" }}
          preserveAspectRatio="none">
          <path d="M0 0 C200 56, 440 0, 660 28 C880 56, 1060 0, 1260 24 C1360 36, 1410 12, 1440 20 L1440 0 Z" fill="#1A2B35" />
        </svg>
      </motion.div>

      {/* ═══════════════════════════════════
          LIGHT DETAILS PANEL
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[480px] mx-auto px-6 pt-2"
      >

        {/* ── Order ID card ── */}
        <motion.div {...FU(0.70)}
          className="bg-white rounded-[20px] mb-2 overflow-hidden relative"
          style={{ border: "1.5px solid #E2EEEC" }}
        >
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.95, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-35 origin-left"
            style={{ background: "linear-gradient(90deg,#5BA8A0,#89C2D9)" }}
          />
          <div className="px-5 pt-3 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-[#8BA5B3] uppercase tracking-[.18em]">Order Number</span>
              <span className="text-[11px] text-[#8BA5B3] flex items-center gap-1">
                <FiTruck size={11} /> <strong style={{ color: "#5BA8A0" }}>2–3 Days</strong>
              </span>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="py-2 flex justify-start">
                  <SeaBiteLoader />
                </motion.div>
              ) : (
                <motion.div key="v" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between">
                  <span className="font-mono text-[24px] font-[800] text-[#1A2B35] tracking-wider">
                    {order ? `#${order.orderId}` : "#N/A"}
                  </span>
                  {order?.orderId && (
                    <motion.button
                      whileHover={{ scale: 1.1, borderColor: "#5BA8A0", color: "#5BA8A0" }}
                      whileTap={{ scale: 0.92 }}
                      onClick={copyId}
                      className="w-[32px] h-[32px] rounded-[9px] bg-[#F4F9F8] flex items-center justify-center transition-colors"
                      style={{ border: "1.5px solid #E2EEEC", color: copied ? "#5BA8A0" : "#8BA5B3" }}
                    >
                      {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Savings badge ── */}
        {discount > 0 && (
          <motion.div {...FU(0.78)} className="flex justify-center mb-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "#3D8C85", background: "rgba(91,168,160,.10)", border: "1px solid rgba(91,168,160,.22)" }}>
              🎉 You saved ₹{discount.toLocaleString()} on this order
            </span>
          </motion.div>
        )}

        {/* ── ITEMS SUMMARY ── */}
        <AnimatePresence>
          {order?.items && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              style={{ marginBottom: 12, textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: T.primary }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: "#4A6572", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Items Ordered</p>
              </div>
              <div style={{
                display: "flex", flexDirection: "column", gap: 10,
                maxHeight: 180, overflowY: "auto", paddingRight: 4,
                scrollbarWidth: "none", msOverflowStyle: "none"
              }}>
                {order.items.map((item, idx) => {
                  const realId = item.productId ? (typeof item.productId === "object" ? item.productId._id : item.productId)
                    : item.product ? (typeof item.product === "object" ? item.product._id : item.product) : item._id;

                  return (
                    <Link key={idx} to={`/products/${realId}`} style={{ textDecoration: "none" }}>
                      <motion.div
                        whileHover={{ background: "rgba(91,168,160,0.05)", scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px",
                          borderRadius: 12, border: `1.5px solid ${T.border}`, background: "#fff"
                        }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#F4F9F8", border: `1px solid ${T.border}`, padding: 2, flexShrink: 0, overflow: "hidden" }}>
                          <img
                            src={`${API_URL}/uploads/${item.image?.replace("uploads/", "")}`}
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={e => e.target.src = "https://via.placeholder.com/44"}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 12, color: "#1A2B35", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                          <p style={{ fontSize: 10, color: "#4A6572", margin: "2px 0 0" }}>₹{item.price} × {item.qty}</p>
                        </div>
                        <FiChevronRight size={14} style={{ color: "#E2EEEC" }} />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Primary CTA ── */}
        <motion.div {...FU(0.84)} className="mb-2">
          <Link to={`/orders/${dbId}`} className="block no-underline">
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 10px 28px rgba(91,168,160,.30)" }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-[16px] rounded-[14px] text-[14px] font-bold text-white flex items-center justify-center gap-2.5 transition-all"
              style={{
                background: "#5BA8A0",
                boxShadow: "0 4px 20px rgba(91,168,160,.22)",
                border: "none",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              <FiPackage size={15} />
              Track Your Delivery
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                <FiArrowRight size={15} />
              </motion.span>
            </motion.button>
          </Link>
        </motion.div>

        {/* ── Secondary CTAs ── */}
        <motion.div {...FU(0.90)} className="grid grid-cols-2 gap-2.5 mb-2">
          <Link to="/products" className="block no-underline">
            <motion.button
              whileHover={{ y: -1, borderColor: "#C5E6E4" }} whileTap={{ scale: 0.97 }}
              className="w-full py-[13px] rounded-[14px] text-[13px] font-semibold text-[#4A6572] flex items-center justify-center gap-2 transition-all"
              style={{ border: "1.5px solid #E2EEEC", background: "transparent", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              <FiShoppingBag size={14} /> Shopping
            </motion.button>
          </Link>
          <motion.button
            onClick={() => order && generateInvoicePDF(order)}
            disabled={!order}
            whileHover={order ? { y: -1, borderColor: "#C5E6E4" } : {}}
            whileTap={order ? { scale: 0.97 } : {}}
            className="w-full py-[13px] rounded-[14px] text-[13px] font-semibold text-[#4A6572] flex items-center justify-center gap-2 transition-all"
            style={{
              border: "1.5px solid #E2EEEC", background: "transparent",
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              opacity: order ? 1 : 0.5, cursor: order ? "pointer" : "not-allowed",
            }}
          >
            <FiDownload size={14} /> Invoice
          </motion.button>
        </motion.div>

        {/* ── Timeline ── */}
        <motion.div {...FU(0.96)}
          className="bg-white rounded-[20px] p-4 mb-2"
          style={{ border: "1.5px solid #E2EEEC" }}
        >
          <p className="text-[9px] font-bold text-[#8BA5B3] uppercase tracking-[.18em] mb-4 text-center">
            Order Progress
          </p>
          <div className="relative flex justify-between items-start">
            {/* track bg */}
            <div className="absolute top-[17px] rounded-full h-[2px]"
              style={{ left: "10%", right: "10%", background: "#E2EEEC" }} />
            {/* animated fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "11%" }}
              transition={{ delay: 1.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-[17px] rounded-full h-[2px]"
              style={{ left: "10%", background: "#5BA8A0" }}
            />
            <TLStep icon={<FiCheck size={13} />} label="Confirmed" active delay={1.0} />
            <TLStep icon={<FiPackage size={13} />} label="Packing" active={false} delay={1.1} />
            <TLStep icon={<FiTruck size={13} />} label="Shipped" active={false} delay={1.2} />
            <TLStep icon="🏠" label="Delivered" active={false} delay={1.3} />
          </div>
        </motion.div>

        {/* Redirect Hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ textAlign: "center", marginBottom: 10, fontSize: 11, color: "#8BA5B3", fontWeight: 500 }}>
          Redirecting to your orders in <strong style={{ color: "#5BA8A0" }}>{redirectTime}s</strong>...
        </motion.div>

      </motion.div>

      <Ticker />

      {/* Decorative success bloom */}
      <div className="fixed top-0 left-0 w-full h-[4px] grad-bar z-[100] opacity-60" />
    </div>
  );
}