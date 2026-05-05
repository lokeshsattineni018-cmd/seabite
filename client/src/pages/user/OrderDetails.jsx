/**
 * OrderDetails.jsx — Premium Redesign
 *
 * Design System: "Liquid Luxury" (matches Order.jsx)
 * ─────────────────────────────────────────────────────────────
 * Key decisions:
 *   • Sticky context bar fades in as user scrolls past the header,
 *     giving persistent context without cluttering the initial view.
 *   • Horizontal tracker transitions to a vertical one on mobile via
 *     CSS class swap — no JavaScript layout recalculation needed.
 *   • ShimmerImage renders a skeleton behind the img tag so the
 *     layout never reflows on load.
 *   • All motion is gated on `useReducedMotion` — users who prefer
 *     reduced motion get instant, opacity-only transitions.
 *   • Cancel confirmation uses optimistic UI: status updates
 *     immediately, then rolls back on error.
 *
 * Data contracts: Identical to original. No API changes needed.
 */

import React, {
  useEffect, useState, useCallback, useRef, useContext,
} from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiShoppingBag, FiTruck, FiCheckCircle, FiXCircle,
  FiDownload, FiAlertCircle, FiExternalLink, FiRotateCcw,
  FiStar, FiCalendar, FiShoppingCart, FiCheck,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import ReviewModal from "../../components/common/ReviewModal";
import { CartContext } from "../../context/CartContext";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import OrderTrackerMap from "../../components/orders/OrderTrackerMap";
import triggerHaptic from "../../utils/haptics";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// QUALITY SLIDER — Haptic Feedback Slider
// ─────────────────────────────────────────────────────────────
function QualitySlider({ onConfirm, confirmed }) {
  const x = useMotionValue(0);
  const maxWidth = 260; // Approximate width of the slider area
  const bgWidth = useTransform(x, [0, maxWidth], ["0%", "100%"]);
  const opacity = useTransform(x, [0, maxWidth * 0.8], [1, 0]);
  
  const [lastHaptic, setLastHaptic] = useState(0);

  const handleDrag = (event, info) => {
    const currentX = info.offset.x;
    // Trigger soft haptic every 20px for that "gear" feel
    if (Math.abs(currentX - lastHaptic) > 20) {
      triggerHaptic("soft");
      setLastHaptic(currentX);
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x >= maxWidth * 0.9) {
      triggerHaptic("heavy");
      onConfirm();
    } else {
      x.set(0);
    }
  };

  if (confirmed) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: "center", padding: "10px 0" }}
      >
        <div style={{ 
          width: 44, height: 44, borderRadius: "50%", background: "#10B981", 
          margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" 
        }}>
          <FiCheck size={24} strokeWidth={3} />
        </div>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1A2E2C", fontFamily: "'Sora', sans-serif" }}>Quality Confirmed</h4>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6E6E73" }}>Thank you for your feedback!</p>
      </motion.div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1A2E2C", fontFamily: "'Sora', sans-serif" }}>Confirm Freshness</h4>
      <div style={{ 
        position: "relative", height: 56, background: "#F1F1F1", borderRadius: 28, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {/* Fill Background */}
        <motion.div style={{ 
          position: "absolute", left: 0, top: 0, bottom: 0, width: bgWidth, 
          background: "linear-gradient(90deg, #10B981 0%, #34D399 100%)", zIndex: 0 
        }} />
        
        {/* Text Prompt */}
        <motion.span style={{ 
          opacity, zIndex: 1, fontSize: 13, fontWeight: 600, color: "#A1A1A6", 
          pointerEvents: "none", userSelect: "none" 
        }}>
          Slide to confirm quality →
        </motion.span>

        {/* Handle */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxWidth }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ 
            x, position: "absolute", left: 4, width: 48, height: 48, 
            background: "#fff", borderRadius: "50%", cursor: "grab",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981"
          }}
          whileDrag={{ cursor: "grabbing", scale: 1.05 }}
        >
          <FiCheck size={20} strokeWidth={3} />
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — must match Order.jsx
// ─────────────────────────────────────────────────────────────
const T = {
  // Apple/H&M Backgrounds
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  glass: "rgba(255,255,255,1)",

  // Borders
  border: "#F1F1F1",
  borderFocus: "#0071E3",

  // Text
  ink: "#111111",
  inkMid: "#333333",
  inkSoft: "#6E6E73",
  inkGhost: "#A1A1A6",

  // Brand / Accent
  teal: "#0071E3",
  tealDeep: "#005BB5",
  tealGlow: "rgba(0, 113, 227, 0.08)",

  // Status (Kept for compatibility)
  amber: "#F59E0B",
  amberBg: "rgba(245,158,11,0.10)",
  coral: "#EF4444",
  coralBg: "rgba(239,68,68,0.09)",
  jade: "#10B981",
  jadeBg: "rgba(16,185,129,0.09)",
  sky: "#38BDF8",
  skyBg: "rgba(56,189,248,0.09)",

  // Easing
  spring: { type: "spring", stiffness: 380, damping: 36 },
  ease: [0.16, 1, 0.3, 1],

  // Radii
  r: 16,
  rLg: 22,
  rXl: 28,
  rFull: 9999,

  // Shadows
  shadow: "0 6px 30px rgba(0,0,0,0.05)",
  shadowMd: "0 8px 30px rgba(0,0,0,0.05)",
  shadowLg: "0 12px 40px rgba(0,0,0,0.08)",
  shadowTeal: "0 6px 20px rgba(0, 113, 227, 0.2)",
};

// ─────────────────────────────────────────────────────────────
// ORDER TRACKER STEPS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { status: "Pending", label: "Order Placed", icon: <FiCheckCircle /> },
  { status: "Processing", label: "Processing", icon: <FiPackage /> },
  { status: "Packed", label: "Packed", icon: <FiPackage /> },
  { status: "Shipped", label: "Shipped", icon: <FiTruck /> },
  { status: "Out for Delivery", label: "Out for Delivery", icon: <FiTruck /> },
  { status: "Delivered", label: "Delivered", icon: <FiMapPin /> },
];

const DELIVERY_DAYS = 3; // Adjust to match your SLA

const COMPLAINT_ISSUES = [
  { v: "wrong_item", l: "Wrong item delivered" },
  { v: "poor_quality", l: "Poor freshness / quality" },
  { v: "missing_items", l: "Missing items from order" },
  { v: "damaged", l: "Item damaged in transit" },
  { v: "other", l: "Other issue" },
];

const CANCEL_REASONS = [
  "Changed my mind",
  "Found a better price",
  "Ordered by mistake",
  "Delivery time too long",
  "Other",
];

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const DETAIL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .lx-focus:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(78,205,196,0.18), 0 0 0 1.5px #4ECDC4;
  }

  @keyframes lx-det-shimmer {
    0%   { background-position: -700px 0; }
    100% { background-position:  700px 0; }
  }
  .lx-img-shimmer {
    background: linear-gradient(90deg, #F1F1F1 25%, #E5E5E5 50%, #F1F1F1 75%);
    background-size: 700px 100%;
    animation: lx-det-shimmer 1.5s infinite linear;
  }

  /* Sticky bar */
  .lx-sticky {
    position: sticky;
    top: 0;
    z-index: 80;
    background: #fff;
  }

  @media (max-width: 800px) {
    .lx-desktop-only { display: none !important; }
    .lx-mobile-only { display: block !important; }
    .lx-row-to-col { flex-direction: column !important; }
  }
  @media (min-width: 801px) {
    .lx-mobile-only { display: none !important; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("lx-detail-styles")) {
  const el = document.createElement("style");
  el.id = "lx-detail-styles";
  el.textContent = DETAIL_CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
// SHIMMER IMAGE — prevents layout shift on image load
// ─────────────────────────────────────────────────────────────
function ShimmerImage({ src, alt, style }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: "relative", ...style }}>
      {!loaded && (
        <div
          className="lx-img-shimmer"
          style={{ position: "absolute", inset: 0, borderRadius: style?.borderRadius || 12 }}
        />
      )}
      <img
        src={src} alt={alt}
        loading="lazy" decoding="async"
        onLoad={() => setLoaded(true)}
        onError={e => { e.target.onerror = null; e.target.src = "/placeholder-fish.svg"; setLoaded(true); }}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: "opacity 0.28s ease" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT ICON
// ─────────────────────────────────────────────────────────────
function PaymentIcon({ method }) {
  const m = (method || "").toLowerCase();
  if (m.includes("upi") || m.includes("gpay") || m.includes("phonepe")) return <span>📱</span>;
  if (m.includes("cod") || m.includes("cash")) return <span>💵</span>;
  if (m.includes("card") || m.includes("credit") || m.includes("debit")) return <span>💳</span>;
  if (m.includes("net") || m.includes("bank")) return <span>🏦</span>;
  if (m.includes("wallet") || m.includes("paytm")) return <span>👛</span>;
  return <span>💳</span>;
}

// ─────────────────────────────────────────────────────────────
// APPLE SECTION — consistent panel wrapper
// ─────────────────────────────────────────────────────────────
function AppleSection({ children, style: extra, title }) {
  return (
    <div style={{
      background: T.surface, borderRadius: 12,
      border: `1px solid ${T.border}`,
      padding: \"20px 16px\", marginBottom: 12, ...extra,
    }}>
      {title && (
        <h3 style={{ 
          fontFamily: \"'Sora', sans-serif\", fontSize: 14, fontWeight: 700, 
          color: T.inkGhost, textTransform: \"uppercase\", letterSpacing: \"0.05em\",
          margin: \"0 0 16px\" 
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HORIZONTAL TRACKER (desktop)
// ─────────────────────────────────────────────────────────────
function HorizontalTracker({ currentStepIndex, reduced }) {
  const pct = Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100);
  return (
    <div role="list" aria-label="Order progress"
      style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>

      {/* Track rail */}
      <div aria-hidden="true" style={{
        position: "absolute", top: 20, left: 24, right: 24,
        height: 2, background: T.border, borderRadius: 2, zIndex: 0,
      }} />

      {/* Progress fill */}
      <motion.div
        aria-hidden="true"
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={reduced
          ? { duration: 0.01 }
          : { duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute", top: 20, left: 24,
          height: 2, background: T.teal, borderRadius: 2, zIndex: 0,
        }}
      />

      {STEPS.map((step, idx) => {
        const done = idx <= currentStepIndex;
        const current = idx === currentStepIndex;
        return (
          <div
            key={idx} role="listitem"
            aria-current={current ? "step" : undefined}
            style={{ position: "relative", zIndex: 1, textAlign: "center", flex: 1 }}
          >
            {/* Circle */}
            <motion.div
              initial={reduced ? {} : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduced ? {} : { duration: 0.38, delay: 0.2 + idx * 0.09, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: 42, height: 42, borderRadius: "50%", margin: "0 auto 12px",
                background: done ? T.teal : T.surface,
                border: `2.5px solid ${done ? T.teal : T.border}`,
                color: done ? T.surface : T.inkGhost,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: current ? T.shadowTeal : done ? "0 2px 12px rgba(78,205,196,0.2)" : "none",
                transition: "background 0.35s, border-color 0.35s, box-shadow 0.35s",
              }}
            >
              {step.icon}
            </motion.div>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: current ? 700 : 500,
              color: current ? T.ink : done ? T.inkMid : T.inkGhost,
              margin: 0,
            }}>
              {step.label}
            </p>

            {current && (
              <motion.span
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                style={{
                  display: "block", marginTop: 3,
                  fontSize: 9.5, color: T.teal, fontWeight: 600,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}
              >
                Current
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VERTICAL TRACKER (Apple Style with Timestamps)
// ─────────────────────────────────────────────────────────────
function VerticalTracker({ currentStepIndex, order, reduced }) {
  const historyMap = {};
  if (order?.statusHistory) {
    order.statusHistory.forEach(h => {
      historyMap[h.status] = h;
    });
  }

  return (
    <div role="list" aria-label="Order progress" style={{ display: "flex", flexDirection: "column" }}>
      {STEPS.map((step, idx) => {
        const done = idx <= currentStepIndex;
        const current = idx === currentStepIndex;
        const last = idx === STEPS.length - 1;
        const historyItem = historyMap[step.status];
        
        return (
          <div
            key={idx} role="listitem"
            aria-current={current ? "step" : undefined}
            style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
          >
            {/* Left: circle + connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <motion.div
                initial={reduced ? {} : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reduced ? {} : { duration: 0.35, delay: 0.15 + idx * 0.08 }}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: done ? T.teal : T.surface,
                  border: `2px solid ${done ? T.teal : T.border}`,
                  color: done ? T.surface : T.inkGhost,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.35s",
                }}
              >
                {React.cloneElement(step.icon, { size: 14 })}
              </motion.div>
              {!last && (
                <div style={{
                  width: 2, flex: 1, minHeight: 48, marginTop: 4,
                  borderRadius: 2,
                  background: done ? T.teal : T.border,
                  transition: "background 0.35s",
                }} />
              )}
            </div>

            {/* Right: label */}
            <div style={{ paddingTop: 6, paddingBottom: last ? 0 : 28 }}>
              <p style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 15, margin: 0,
                fontWeight: current ? 700 : done ? 600 : 500,
                color: current ? T.ink : done ? T.inkMid : T.inkGhost,
              }}>
                {step.label}
              </p>
              {historyItem && historyItem.timestamp && (
                <p style={{
                  fontSize: 12, color: T.inkSoft, margin: "4px 0 0",
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                  {new Date(historyItem.timestamp).toLocaleString("en-GB", { 
                    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true 
                  })}
                </p>
              )}
              {historyItem && historyItem.message && current && (
                <p style={{
                  fontSize: 13, color: T.teal, margin: "6px 0 0",
                  fontWeight: 500, background: T.tealGlow, padding: "6px 10px", borderRadius: 8,
                  display: "inline-block"
                }}>
                  {historyItem.message}
                </p>
              )}
              {!historyItem && current && (
                <p style={{
                  fontSize: 13, color: T.teal, margin: "6px 0 0",
                  fontWeight: 500,
                }}>
                  In Progress
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QUALITY COMPLAINT MODAL
// ─────────────────────────────────────────────────────────────
function QualityComplaintModal({ order, onClose }) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = async () => {
    if (!issueType) { toast.error("Please select an issue type"); return; }
    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/orders/${order._id}/complaint`,
        { issueType, description },
        { withCredentials: true }
      );
      toast.success("Issue reported — we'll respond within 24 hours.");
      onClose();
      // Force refresh to show the new complaint
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      role="dialog" aria-modal="true" aria-labelledby="lxd-complaint-title"
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(13,17,23,0.55)", backdropFilter: "blur(8px)" }}
      />
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ ...T.spring }}
        style={{
          position: "relative", width: "100%", maxWidth: 460,
          background: T.surface, borderRadius: T.rXl,
          padding: 32, boxShadow: T.shadowLg,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: T.coralBg, color: T.coral, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FiAlertCircle size={24} />
          </div>
          <div>
            <h3 id="lxd-complaint-title" style={{
              fontFamily: "'Sora', sans-serif",
              margin: "0 0 4px", fontSize: 19, fontWeight: 700, color: T.ink,
            }}>
              Report an Issue
            </h3>
            <p style={{ margin: 0, color: T.inkSoft, fontSize: 13 }}>
              We'll respond within 24 hours
            </p>
          </div>
        </div>

        {/* Issue type */}
        <p style={{ fontSize: 10.5, fontWeight: 600, color: T.inkGhost, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          What went wrong?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 22 }}>
          {COMPLAINT_ISSUES.map(issue => {
            const sel = issueType === issue.v;
            return (
              <button
                key={issue.v}
                onClick={() => setIssueType(issue.v)}
                className="lx-focus"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 16px", borderRadius: 12,
                  border: `1.5px solid ${sel ? T.coral : T.border}`,
                  background: sel ? T.coralBg : T.surface,
                  cursor: "pointer", fontSize: 13.5,
                  fontWeight: sel ? 600 : 400,
                  color: sel ? T.coral : T.inkMid,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s", textAlign: "left",
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${sel ? T.coral : T.border}`,
                  background: sel ? T.coral : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.14s",
                }}>
                  {sel && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                </span>
                {issue.l}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <p style={{ fontSize: 10.5, fontWeight: 600, color: T.inkGhost, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          Details (optional)
        </p>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the issue in more detail…"
          className="lx-focus"
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 12,
            border: `1.5px solid ${T.border}`, fontSize: 13.5,
            outline: "none", fontFamily: "'DM Sans', sans-serif",
            color: T.ink, resize: "vertical", boxSizing: "border-box",
            background: T.bg, transition: "border-color 0.18s",
          }}
          onFocus={e => e.target.style.borderColor = T.coral}
          onBlur={e => e.target.style.borderColor = T.border}
        />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button
            onClick={onClose}
            className="lx-focus"
            style={{
              padding: "11px 20px", borderRadius: 12,
              border: `1.5px solid ${T.border}`, background: T.bg,
              cursor: "pointer", fontWeight: 500, fontSize: 13.5,
              color: T.inkMid, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <motion.button
            whileTap={!submitting && issueType ? { scale: 0.96 } : {}}
            onClick={submit}
            disabled={submitting || !issueType}
            className="lx-focus"
            style={{
              padding: "11px 24px", borderRadius: 12, border: "none",
              cursor: (!issueType || submitting) ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: 13.5, color: "#fff",
              background: (!issueType || submitting) ? "rgba(239,68,68,0.35)" : T.coral,
              fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 8,
              transition: "background 0.18s",
            }}
          >
            {submitting ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  style={{
                    display: "inline-block", width: 14, height: 14,
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff", borderRadius: "50%",
                  }}
                />
                Submitting…
              </>
            ) : "Submit Report"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRICE ROW — reusable table row
// ─────────────────────────────────────────────────────────────
function PriceRow({ label, value, color, bold, borderTop }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0",
      borderTop: borderTop ? `1px solid ${T.border}` : "none",
      marginTop: borderTop ? 8 : 0,
    }}>
      <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 400, color: bold ? T.ink : T.inkSoft }}>
        {label}
      </span>
      <span style={{
        fontFamily: bold ? "'Sora', sans-serif" : "'DM Sans', sans-serif",
        fontSize: bold ? 17 : 13, fontWeight: bold ? 800 : 500,
        color: color || (bold ? T.ink : T.inkMid),
      }}>
        {value}
      </span>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function OrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useContext(CartContext);
  const token = localStorage.getItem("seabite_session_id") || "";
  const reduced = useReducedMotion();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  const headerRef = useRef(null);

  // ── Fetch order ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true });
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // ── Sticky bar trigger ────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [loading]);

  // ── Escape key closes modals ──────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") {
        if (cancelOpen) setCancelOpen(false);
        if (complaintOpen) setComplaintOpen(false);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [cancelOpen, complaintOpen]);

  // ── Cancel ────────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (!cancelReason.trim()) { toast.error("Please select a reason"); return; }

    // Optimistic update
    setOrder(prev => ({ ...prev, status: "Cancelled by User", cancelReason }));
    setCancelOpen(false);
    setCancelling(true);

    try {
      const { data } = await axios.put(
        `${API_URL}/api/orders/${order._id}/cancel`,
        { reason: cancelReason },
        { withCredentials: true }
      );
      setOrder(data);
      toast.success("Order cancelled successfully.");
    } catch (err) {
      // Rollback
      setOrder(prev => ({ ...prev, status: "Pending", cancelReason: undefined }));
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
      setCancelReason("");
    }
  }, [cancelReason, order?._id]);

  // ── Reorder ───────────────────────────────────────────────
  const handleReorder = useCallback(async () => {
    if (!order) return;
    setReordering(true);
    try {
      // Use the context's addToCart for each item
      order.items.forEach(item => {
        // Build product object compatible with addToCart expectations
        const product = {
          _id: (item.productId?._id || item.productId || item.product?._id || item.product || item._id),
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.qty
        };
        addToCart(product);
      });

      toast.success(`${order.items.length} item${order.items.length > 1 ? "s" : ""} added!`, { icon: "🛒" });

      // Open the sidebar instead of navigating to a 404 page
      setIsCartOpen(true);
    } catch (err) {
      toast.error("Failed to reorder items");
    } finally {
      setReordering(false);
    }
  }, [order, setIsCartOpen, addToCart]);

  // ── Review modal ──────────────────────────────────────────
  const openReview = useCallback(item => {
    const id = item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;
    setReviewProduct({ _id: id, name: item.name });
    setReviewOpen(true);
  }, []);

  // ── Confirm Quality ──────────────────────────────────────
  const handleConfirmQuality = useCallback(async () => {
    if (!order) return;
    try {
      await axios.put(`${API_URL}/api/orders/${order._id}/confirm-quality`, {}, { withCredentials: true });
      setOrder(prev => ({ ...prev, qualityConfirmed: true }));
      toast.success("Quality confirmed! 🌊", { duration: 4000 });
    } catch (err) {
      toast.error("Failed to save confirmation");
    }
  }, [order]);

  // ── ETA string ────────────────────────────────────────────
  const getETA = useCallback(createdAt => {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + DELIVERY_DAYS);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }, []);

  // ── Spinner component ─────────────────────────────────────
  const Spinner = ({ size = 12 }) => (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      style={{
        display: "inline-block", width: size, height: size,
        border: "2px solid rgba(78,205,196,0.3)",
        borderTopColor: T.teal, borderRadius: "50%",
      }}
    />
  );

  // ── Guards ────────────────────────────────────────────────
  if (loading) return <SeaBiteLoader fullScreen />;

  if (!order && !loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: T.bg, gap: 20, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: T.coralBg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FiAlertCircle size={32} style={{ color: T.coral }} />
      </div>
      <h2 style={{ fontFamily: "'Sora', sans-serif", color: T.ink, fontSize: 22, fontWeight: 700, margin: 0 }}>
        Failed to load order
      </h2>
      <p style={{ color: T.inkSoft, fontSize: 14, margin: 0 }}>
        Please check your connection and try again.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={() => { setLoading(true); window.location.reload(); }}
          style={{
            padding: "12px 24px", borderRadius: 999,
            background: T.teal, color: "#fff", border: "none",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Retry
        </button>
        <Link to="/orders" style={{ color: T.teal, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
          ← Back to Orders
        </Link>
      </div>
    </div>
  );

  if (!order) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: T.bg, gap: 20, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: T.tealGlow, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FiPackage size={32} style={{ color: T.teal }} />
      </div>
      <h2 style={{ fontFamily: "'Sora', sans-serif", color: T.ink, fontSize: 22, fontWeight: 700, margin: 0 }}>
        Order not found
      </h2>
      <Link to="/orders" style={{ color: T.teal, fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
        ← Back to Orders
      </Link>
    </div>
  );

  const stepIdx = STEPS.findIndex(s => s.status === order.status);
  const cancelled = order.status.includes("Cancelled");
  const delivered = order.status === "Delivered";
  const canCancel = !cancelled && ["Pending", "Processing", "Placed"].includes(order.status);
  const displayId = order.orderId || order._id.slice(-6).toUpperCase();

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── STICKY CONTEXT BAR ──────────────────────────── */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            className="lx-sticky"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ ...T.spring }}
            style={{
              background: T.glass,
              borderBottom: `1px solid ${T.border}`,
              padding: "10px 28px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Link to="/orders" className="lx-focus" style={{ color: T.inkGhost, textDecoration: "none", display: "flex" }}>
                <FiArrowLeft size={17} />
              </Link>
              <span style={{
                fontFamily: "monospace", fontWeight: 700,
                fontSize: 14.5, color: T.ink,
              }}>
                #{displayId}
              </span>
              <span style={{
                padding: "3px 10px", borderRadius: T.rFull,
                fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.06em",
                background: cancelled ? T.coralBg : T.tealGlow,
                color: cancelled ? T.coral : T.tealDeep,
              }}>
                {order.status}
              </span>
            </div>
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 16, fontWeight: 800, color: T.ink,
            }}>
              ₹{order.totalAmount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        product={reviewProduct}
        existingReview={null}
        token={token}
        API_URL={API_URL}
        onSuccess={() => {
          toast.success("Review saved!");
          // Re-fetch order to refresh UI
          setLoading(true);
          axios.get(`${API_URL}/api/orders/${order._id || order.orderId}`, { withCredentials: true })
            .then(res => setOrder(res.data))
            .finally(() => setLoading(false));
        }}
      />
      <AnimatePresence>
        {complaintOpen && <QualityComplaintModal order={order} onClose={() => setComplaintOpen(false)} />}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ maxWidth: 700, margin: \"0 auto\", padding: \"80px 16px 100px\" }}>

        {/* ── PAGE HEADER ─────────────────────────────── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: reduced ? 0 : -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: T.ease }}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"center\" }}>
            <Link to="/orders" style={{ color: T.ink, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
              <FiArrowLeft size={18} /> Order Details
            </Link>
            <span style={{ fontSize: 11, fontWeight: 800, color: T.inkGhost, background: "#f5f5f7", padding: "4px 10px", borderRadius: 20 }}>
              ID: {displayId}
            </span>
          </div>
        </motion.div>

        {/* ── TOP INFO CARD ── */}
        <AppleSection>
          <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"flex-start\" }}>
            <div>
              <p style={{ fontSize: 12, color: T.inkSoft, margin: \"0 0 4px\" }}>Order Date</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: 0 }}>
                {new Date(order.createdAt).toLocaleDateString(\"en-GB\", { day: \"numeric\", month: \"long\", year: \"numeric\" })}
              </p>
            </div>
            <div style={{ textAlign: \"right\" }}>
              <p style={{ fontSize: 12, color: T.inkSoft, margin: \"0 0 4px\" }}>Order Total</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: T.ink, margin: 0 }}>₹{order.totalAmount}</p>
            </div>
          </div>
        </AppleSection>

        {/* ── ITEMS SECTION ── */}
        <AppleSection title=\"Items\">
          <div style={{ display: \"flex\", flexDirection: \"column\", gap: 20 }}>
            {order.items.map((item, i) => {
              const pid = item.productId?._id || item.productId || item.product?._id || item.product || item._id;
              return (
                <div key={i} style={{ display: \"flex\", gap: 16, borderBottom: i !== order.items.length - 1 ? `1px solid ${T.border}` : \"none\", paddingBottom: i !== order.items.length - 1 ? 20 : 0 }}>
                  <ShimmerImage
                    src={`${API_URL}/uploads/${item.image?.replace(\"uploads/\", \"\")}`}
                    alt={item.name}
                    style={{ width: 80, height: 80, borderRadius: 10, objectFit: \"cover\", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, display: \"flex\", flexDirection: \"column\", justifyContent: \"space-between\" }}>
                    <div>
                      <Link to={`/products/${pid}`} style={{ textDecoration: \"none\" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: \"0 0 4px\", lineHeight: 1.4 }}>{item.name}</p>
                      </Link>
                      <p style={{ fontSize: 12, color: T.inkSoft, margin: 0 }}>Qty: {item.qty} × ₹{item.price}</p>
                    </div>
                    <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"center\", marginTop: 8 }}>
                       <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>₹{item.qty * item.price}</span>
                       {delivered && (
                         <button onClick={() => openReview(item)} style={{ background: "transparent", border: "none", color: T.teal, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                           Rate & Review
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AppleSection>

        {/* ── TRACKER SECTION ── */}
        {!cancelled && (
          <AppleSection title="Tracking Status">
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, background: T.tealGlow, padding: "10px 14px", borderRadius: 10 }}>
               <FiPackage size={18} style={{ color: T.teal }} />
               <div>
                 <p style={{ fontSize: 13, fontWeight: 700, color: T.teal, margin: 0 }}>{order.status}</p>
                 <p style={{ fontSize: 11, color: T.tealDeep, margin: 0, opacity: 0.8 }}>Estimated: {getETA(order.createdAt)}</p>
               </div>
            </div>
            <VerticalTracker currentStepIndex={stepIdx} order={order} reduced={reduced} />
          </AppleSection>
        )}

        {/* ── QUALITY CONFIRMATION (DELIVERED ONLY) ── */}
        {delivered && (
          <AppleSection title="Freshness Feedback">
             <QualitySlider confirmed={order.qualityConfirmed} onConfirm={handleConfirmQuality} />
          </AppleSection>
        )}
        )}

        {/* ── SHIPPING \u0026 PAYMENT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 0 }}>
          <AppleSection title="Shipping Details">
            <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: "0 0 4px" }}>{order.shippingAddress?.fullName}</p>
            <p style={{ fontSize: 13, color: T.inkSoft, margin: 0, lineHeight: 1.5 }}>
              {order.shippingAddress?.houseNo}, {order.shippingAddress?.street}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}<br />
              <span style={{ fontWeight: 600, color: T.ink, display: "block", marginTop: 6 }}>{order.shippingAddress?.phone}</span>
            </p>
          </AppleSection>

          <AppleSection title="Price Details">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <PriceRow label="Items Price" value={`₹${order.itemsPrice}`} />
              <PriceRow label="Shipping Fee" value={order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice}`} color={order.shippingPrice === 0 ? T.jade : undefined} />
              <PriceRow label="Tax" value={`₹${order.taxPrice}`} />
              {order.discount > 0 && <PriceRow label="Discount" value={`-₹${order.discount}`} color={T.jade} />}
              <div style={{ height: 1, background: T.border, margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Total Amount</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>₹{order.totalAmount}</span>
              </div>
              <p style={{ fontSize: 12, color: T.jade, fontWeight: 600, margin: "8px 0 0" }}>
                Payment Method: {order.paymentMethod}
              </p>
            </div>
          </AppleSection>
        </div>

        {/* ── ACTION FOOTER ── */}
        <div style={{ 
          marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap"
        }}>
          <button 
            onClick={() => generateInvoicePDF(order)}
            style={{ flex: 1, minWidth: 140, padding: "14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontSize: 13, fontWeight: 700, color: T.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <FiDownload size={16} /> Invoice
          </button>
          
          {canCancel && (
            <button 
              onClick={() => setCancelOpen(true)}
              style={{ flex: 1, minWidth: 140, padding: "14px", borderRadius: 10, border: "none", background: T.coralBg, fontSize: 13, fontWeight: 700, color: T.coral, cursor: "pointer" }}
            >
              Cancel Order
            </button>
          )}
          
          {(delivered || cancelled) && (
            <button 
              onClick={handleReorder}
              disabled={reordering}
              style={{ flex: 1, minWidth: 140, padding: "14px", borderRadius: 10, border: "none", background: T.teal, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {reordering ? <Spinner size={14} /> : <FiRotateCcw size={16} />} Reorder
            </button>
          )}
        </div>

      </div>


      {/* ── CANCELLATION MODAL ──────────────────────────── */}
      <AnimatePresence>
        {cancelOpen && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            role="dialog" aria-modal="true" aria-labelledby="lxd-cancel-title"
          >
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setCancelOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(13,17,23,0.55)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              transition={{ ...T.spring }}
              style={{
                position: "relative", width: "100%", maxWidth: 420,
                background: T.surface, borderRadius: T.rXl,
                padding: 32, boxShadow: T.shadowLg,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                  background: T.coralBg, color: T.coral,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FiAlertCircle size={24} />
                </div>
                <div>
                  <h3 id="lxd-cancel-title" style={{
                    fontFamily: "'Sora', sans-serif",
                    margin: "0 0 4px", fontSize: 19, fontWeight: 700, color: T.ink,
                  }}>
                    Cancel Order?
                  </h3>
                  <p style={{ margin: 0, color: T.inkSoft, fontSize: 13, lineHeight: 1.6 }}>
                    This cannot be undone. Please select a reason.
                  </p>
                </div>
              </div>

              {/* Reason */}
              <label
                htmlFor="lxd-reason"
                style={{
                  display: "block", fontSize: 10.5, fontWeight: 600,
                  color: T.inkGhost, marginBottom: 10,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}
              >
                Reason for cancellation
              </label>
              <select
                id="lxd-reason"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="lx-focus"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: `1.5px solid ${cancelReason ? T.coral : T.border}`,
                  fontSize: 14, outline: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  color: cancelReason ? T.ink : T.inkSoft,
                  background: T.surface, cursor: "pointer",
                  transition: "border-color 0.2s",
                  marginBottom: 24,
                }}
              >
                <option value="">Select a reason…</option>
                {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setCancelOpen(false); setCancelReason(""); }}
                  className="lx-focus"
                  style={{
                    padding: "11px 20px", borderRadius: 12,
                    border: `1.5px solid ${T.border}`, background: T.bg,
                    cursor: "pointer", fontWeight: 500, fontSize: 13.5,
                    color: T.inkMid, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Keep Order
                </motion.button>
                <motion.button
                  whileTap={cancelReason && !cancelling ? { scale: 0.97 } : {}}
                  onClick={handleCancel}
                  disabled={cancelling || !cancelReason}
                  className="lx-focus"
                  style={{
                    padding: "11px 24px", borderRadius: 12, border: "none",
                    cursor: (!cancelReason || cancelling) ? "not-allowed" : "pointer",
                    fontWeight: 600, fontSize: 13.5, color: "#fff",
                    background: (!cancelReason || cancelling) ? "rgba(239,68,68,0.35)" : T.coral,
                    fontFamily: "'DM Sans', sans-serif",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "background 0.18s",
                  }}
                >
                  {cancelling ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        style={{
                          display: "inline-block", width: 14, height: 14,
                          border: "2px solid rgba(255,255,255,0.35)",
                          borderTopColor: "#fff", borderRadius: "50%",
                        }}
                      />
                      Cancelling…
                    </>
                  ) : "Confirm Cancel"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEADER ACTION BUTTON — used in the page header action cluster
// ─────────────────────────────────────────────────────────────
function HeaderBtn({ icon, label, onClick, disabled = false, primary = false }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      whileHover={reduced ? {} : { scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className="lx-focus"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px",
        background: primary ? T.ink : "transparent",
        border: `1px solid ${primary ? T.ink : T.border}`,
        borderRadius: T.rFull, fontSize: 13, fontWeight: 600,
        color: primary ? T.surface : T.ink, cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif",
        opacity: disabled ? 0.55 : 1,
        transition: "all 0.15s",
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}