import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiCopy, FiTruck,
  FiDownload, FiChevronRight, FiMapPin, FiTag,
} from "react-icons/fi";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F9F8",
  surface: "#ffffff",
  border: "#E2EEEC",
  textDark: "#1A2B35",
  textMid: "#4A6572",
  textLite: "#8BA5B3",
  primary: "#5BA8A0",
  sky: "#89C2D9",
  coral: "#E8816A",
};

// ── Currency Formatter ────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n || 0);

// ── Confetti ──────────────────────────────────────────────────────────────────
const EMOJIS = ["🐟", "🦐", "🦞", "🦀", "🐙", "⭐", "🌊", "✨"];

function ConfettiPiece({ x, delay, emoji, size }) {
  return (
    <motion.div
      initial={{ y: -10, x, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ y: 420, opacity: 0, rotate: [0, 200, 400], scale: [1, 0.8, 0.2] }}
      transition={{ duration: 2.6 + Math.random() * 1.2, delay, ease: "easeIn" }}
      style={{
        position: "absolute",
        top: 0,
        fontSize: size,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
      }}
    >
      {emoji}
    </motion.div>
  );
}

function ConfettiCanvas() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 360 - 20,
    delay: Math.random() * 1.4,
    emoji: EMOJIS[i % EMOJIS.length],
    size: 12 + Math.random() * 14,
  }));
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 400,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </div>
  );
}

// ── Ripple Ring ───────────────────────────────────────────────────────────────
function RippleRing({ delay, size }) {
  return (
    <motion.div
      initial={{ scale: 0.55, opacity: 0.55 }}
      animate={{ scale: 2.3, opacity: 0 }}
      transition={{ duration: 2.6, delay, repeat: Infinity, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${T.primary}`,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    />
  );
}

// ── Success Icon ──────────────────────────────────────────────────────────────
function SuccessIcon({ visible }) {
  return (
    <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 28px" }}>
      <RippleRing delay={0} size={120} />
      <RippleRing delay={0.85} size={100} />
      <RippleRing delay={1.7} size={80} />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={visible ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.15 }}
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.primary} 0%, ${T.sky} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 20px 60px rgba(91,168,160,0.38), 0 4px 16px rgba(91,168,160,0.2)`,
          position: "relative",
          zIndex: 1,
        }}
      >
        <FiCheck size={52} color="#fff" strokeWidth={2.8} />
      </motion.div>
    </div>
  );
}

// ── Delivery Timeline ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "Order Confirmed", sub: "Just now", done: true },
  { label: "Out for Delivery", sub: "2–3 days", done: false },
  { label: "Delivered", sub: "At your door", done: false },
];

function DeliveryTimeline() {
  return (
    <div style={{ position: "relative", paddingTop: 4 }}>
      {/* Background track */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "calc(16.66% + 4px)",
          right: "calc(16.66% + 4px)",
          height: 3,
          borderRadius: 4,
          background: T.border,
          zIndex: 0,
        }}
      />
      {/* Active progress bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 0.12 }}
        transition={{ duration: 1.1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          top: 24,
          left: "calc(16.66% + 4px)",
          right: "calc(16.66% + 4px)",
          height: 3,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`,
          zIndex: 1,
          transformOrigin: "left",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          zIndex: 2,
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "33.33%",
              gap: 8,
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.55 + i * 0.18, type: "spring", stiffness: 260, damping: 20 }}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background:
                  i === 0
                    ? `linear-gradient(135deg, ${T.primary}, ${T.sky})`
                    : T.surface,
                border: i === 0 ? "none" : `2px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow:
                  i === 0
                    ? `0 8px 24px rgba(91,168,160,0.28)`
                    : "none",
              }}
            >
              {i === 0 ? (
                <FiCheck size={22} color="#fff" strokeWidth={2.5} />
              ) : (
                <span style={{ opacity: 0.45 }}>
                  {["📦", "🚚", "🏠"][i]}
                </span>
              )}
            </motion.div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: i === 0 ? T.primary : T.textLite,
                  margin: "0 0 2px",
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </p>
              <p style={{ fontSize: 10, color: T.textLite, margin: 0 }}>{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Item Row ──────────────────────────────────────────────────────────────────
const FISH_EMOJIS = ["🐟", "🦐", "🦞", "🦀", "🐙", "🦑", "🐠"];

function ItemRow({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.38, delay: 0.5 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", alignItems: "center", gap: 12 }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "rgba(91,168,160,0.07)",
          border: `1px solid ${T.border}`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {item.image ? (
          <img
            src={`${API_URL}/uploads/${item.image.replace("uploads/", "")}`}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = `<span style="font-size:22px">${FISH_EMOJIS[index % FISH_EMOJIS.length]}</span>`;
            }}
          />
        ) : (
          <span style={{ fontSize: 22 }}>{FISH_EMOJIS[index % FISH_EMOJIS.length]}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: T.textDark,
            margin: "0 0 3px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </p>
        <p style={{ fontSize: 11, color: T.textLite, margin: 0, fontWeight: 500 }}>
          Qty: {item.qty} × {fmt(item.price)}
        </p>
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark, flexShrink: 0 }}>
        {fmt(item.price * item.qty)}
      </span>
    </motion.div>
  );
}

// ── Animated Card Wrapper ─────────────────────────────────────────────────────
function Card({ delay = 0, children, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: T.surface,
        borderRadius: 22,
        border: `1px solid ${T.border}`,
        boxShadow: "0 2px 20px rgba(91,168,160,0.07)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ color1 = T.primary, color2 = T.sky, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${color1}, ${color2})`,
        }}
      />
      <p
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: T.textLite,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
  const [heroVisible, setHeroVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Guard: block direct URL access
    if (!location.state?.fromCheckout) {
      navigate("/orders", { replace: true });
      return;
    }
    if (!dbId) { setLoading(false); return; }

    axios
      .get(`${API_URL}/api/orders/${dbId}`, { withCredentials: true })
      .then(({ data }) => setOrder(data))
      .catch(() => { })
      .finally(() => {
        setLoading(false);
        setTimeout(() => setHeroVisible(true), 80);
        setTimeout(() => setShowConfetti(false), 3800);
      });
  }, [dbId]);

  // Fallback hero trigger if order was already set
  useEffect(() => {
    if (!loading) setTimeout(() => setHeroVisible(true), 80);
  }, [loading]);

  // Redirect countdown
  useEffect(() => {
    const t = setInterval(() => {
      setRedirectTime((p) => {
        if (p <= 1) {
          clearInterval(t);
          navigate("/orders", { replace: true });
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [navigate]);

  const copyId = () => {
    if (!order?.orderId) return;
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) return <SeaBiteLoader fullScreen />;

  const displayId = order?.orderId || (dbId ? dbId.slice(-8).toUpperCase() : "—");
  const subtotal = order?.itemsPrice ?? order?.items?.reduce((s, i) => s + i.price * i.qty, 0) ?? 0;
  const tax = order?.taxPrice ?? 0;
  const shipping = order?.shippingPrice ?? 0;
  const totalDisc = order?.discount ?? discount;
  const total = order?.totalAmount ?? order?.totalPrice ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Fonts + global overrides ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .os-btn-primary {
          background: linear-gradient(135deg, #5BA8A0 0%, #89C2D9 100%);
          color: #fff; border: none; border-radius: 56px;
          padding: 15px 24px; font-size: 14px; font-weight: 700; cursor: pointer;
          width: 100%; font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 8px 28px rgba(91,168,160,0.30);
          transition: transform 0.18s, box-shadow 0.18s;
          letter-spacing: -0.01em;
        }
        .os-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(91,168,160,0.38); }
        .os-btn-primary:active { transform: translateY(0); }
        .os-btn-secondary {
          background: #fff; color: #4A6572; border: 1.5px solid #E2EEEC;
          border-radius: 56px; padding: 14px 24px; font-size: 14px; font-weight: 700;
          cursor: pointer; width: 100%; font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.18s, border-color 0.18s;
          letter-spacing: -0.01em;
        }
        .os-btn-secondary:hover { background: #F0F8F7; border-color: #5BA8A0; color: #5BA8A0; }
      `}</style>

      {/* ── Ambient background layers ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 480,
            background: "linear-gradient(180deg, rgba(91,168,160,0.09) 0%, transparent 100%)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
            background: "linear-gradient(0deg, rgba(137,194,217,0.05) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Page content ── */}
      <div
        style={{
          position: "relative", zIndex: 1,
          maxWidth: 560, margin: "0 auto",
          padding: "96px 20px 80px",
        }}
      >

        {/* ────── HERO SECTION ────── */}
        <div style={{ textAlign: "center", marginBottom: 36, position: "relative" }}>
          <AnimatePresence>
            {showConfetti && <ConfettiCanvas key="confetti" />}
          </AnimatePresence>

          <SuccessIcon visible={heroVisible} />

          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(91,168,160,0.10)",
              border: "1px solid rgba(91,168,160,0.22)",
              borderRadius: 24, padding: "4px 14px 4px 8px",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14 }}>🎉</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.primary, letterSpacing: "0.06em" }}>
              ORDER CONFIRMED
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.54, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 34, fontWeight: 800, color: T.textDark,
              margin: "0 0 10px", letterSpacing: "-0.035em", lineHeight: 1.14,
            }}
          >
            Thank you!&nbsp;
            <span
              style={{
                background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your catch<br />is confirmed.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.64, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 14, color: T.textMid, margin: "0 auto",
              maxWidth: 320, lineHeight: 1.75, fontWeight: 500,
            }}
          >
            Your fresh catch is being packed with care and will arrive at your door soon.&nbsp;🌊
          </motion.p>
        </div>

        {/* ────── ORDER ID CARD ────── */}
        <Card delay={0.72} style={{ marginBottom: 14 }}>
          {/* Accent gradient strip */}
          <div
            style={{
              height: 4,
              background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`,
            }}
          />
          <div style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              {/* Left: Order ID */}
              <div>
                <p
                  style={{
                    fontSize: 9, fontWeight: 800, color: T.textLite,
                    textTransform: "uppercase", letterSpacing: "0.16em", margin: "0 0 5px",
                  }}
                >
                  Order Reference
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: "monospace", fontWeight: 800, fontSize: 16,
                      color: T.textDark, letterSpacing: "0.04em",
                    }}
                  >
                    #{displayId}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.86 }}
                    onClick={copyId}
                    style={{
                      background: copied ? "rgba(91,168,160,0.12)" : "#F4F9F8",
                      border: `1px solid ${copied ? T.primary : T.border}`,
                      borderRadius: 7, padding: "4px 8px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 10, fontWeight: 700,
                      color: copied ? T.primary : T.textLite,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {copied ? <FiCheck size={10} /> : <FiCopy size={10} />}
                    {copied ? "Copied!" : "Copy"}
                  </motion.button>
                </div>
              </div>

              {/* Right: Status + ETA */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(91,168,160,0.10)",
                    border: "1px solid rgba(91,168,160,0.2)",
                    borderRadius: 10, padding: "4px 10px", marginBottom: 6,
                  }}
                >
                  <FiCheck size={11} style={{ color: T.primary }} strokeWidth={2.5} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.primary }}>
                    Payment Successful
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 10, color: T.textLite, margin: 0, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end",
                  }}
                >
                  <FiTruck size={10} /> 2–3 Business Days
                </p>
              </div>
            </div>

            {/* Shipping address */}
            {order?.shippingAddress && (
              <div
                style={{
                  marginTop: 14, padding: "8px 12px", borderRadius: 10,
                  background: "#F7FAFA", border: `1px solid ${T.border}`,
                  display: "flex", gap: 6, alignItems: "flex-start",
                }}
              >
                <FiMapPin size={12} style={{ color: T.primary, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: T.textMid, fontWeight: 500 }}>
                  {[
                    order.shippingAddress.address,
                    order.shippingAddress.city,
                    order.shippingAddress.postalCode,
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* ────── DELIVERY TIMELINE ────── */}
        <Card delay={0.82} style={{ marginBottom: 14, padding: "20px 22px 26px" }}>
          <SectionLabel color1={T.sky} color2={T.primary}>
            Delivery Status
          </SectionLabel>
          <DeliveryTimeline />
        </Card>

        {/* ────── ORDER ITEMS + BILL ────── */}
        {order?.items?.length > 0 && (
          <Card delay={0.92} style={{ marginBottom: 14, padding: "20px 22px" }}>
            <SectionLabel>Your Order</SectionLabel>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {order.items.map((item, idx) => (
                <ItemRow key={idx} item={item} index={idx} />
              ))}
            </div>

            {/* Bill breakdown */}
            <div
              style={{
                marginTop: 20, paddingTop: 16,
                borderTop: `1px solid ${T.border}`,
              }}
            >
              {[
                { label: "Subtotal", value: fmt(subtotal), color: T.textMid },
                tax > 0 && { label: "Tax (GST)", value: `+ ${fmt(tax)}`, color: T.textMid },
                {
                  label: "Shipping",
                  value: shipping === 0 ? "FREE ✓" : `+ ${fmt(shipping)}`,
                  color: shipping === 0 ? T.primary : T.textMid,
                },
                totalDisc > 0 && {
                  label: "Discount",
                  value: `− ${fmt(totalDisc)}`,
                  color: T.primary,
                  icon: <FiTag size={10} />,
                },
              ]
                .filter(Boolean)
                .map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12, color: T.textLite, fontWeight: 500,
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      {row.icon}
                      {row.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}

              {/* Total row */}
              <div
                style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginTop: 10, paddingTop: 12,
                  borderTop: `1px solid ${T.border}`,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: T.textDark }}>
                  Total Paid
                </span>
                <span
                  style={{
                    fontSize: 22, fontWeight: 800, color: T.textDark,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {fmt(total)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* ────── CTA BUTTONS ────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.02, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="os-btn-primary"
            onClick={() => navigate(`/orders/${dbId}`)}
          >
            <FiTruck size={16} /> Track My Order
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className="os-btn-secondary"
            onClick={() => order && generateInvoicePDF(order)}
          >
            <FiDownload size={15} /> Download Invoice
          </motion.button>
        </motion.div>

        {/* ────── FOOTER ────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.12 }}
          style={{ textAlign: "center" }}
        >
          <motion.div whileHover={{ x: 4 }} style={{ display: "inline-block" }}>
            <Link
              to="/products"
              style={{
                fontSize: 13.5, fontWeight: 700, color: T.textMid,
                textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              <FiShoppingBag size={14} style={{ color: T.primary }} />
              Continue Shopping
              <FiChevronRight size={14} style={{ color: T.primary }} />
            </Link>
          </motion.div>

          {/* Animated countdown bar */}
          <div
            style={{
              marginTop: 18,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <div
              style={{
                width: 80, height: 4, borderRadius: 4, background: T.border,
                overflow: "hidden", flexShrink: 0,
              }}
            >
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 30, ease: "linear" }}
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`,
                  borderRadius: 4,
                  transformOrigin: "left",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 11, color: T.textLite, margin: 0, fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Redirecting to orders in{" "}
              <strong style={{ color: T.textDark }}>{redirectTime}s</strong>
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}