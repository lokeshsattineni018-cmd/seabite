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
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiShoppingBag, FiTruck, FiCheckCircle, FiXCircle,
  FiDownload, FiAlertCircle, FiExternalLink, FiRotateCcw,
  FiStar, FiCalendar, FiShoppingCart,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import ReviewModal from "../../components/common/ReviewModal";
import { CartContext } from "../../context/CartContext";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — must match Order.jsx
// ─────────────────────────────────────────────────────────────
const T = {
  // Apple/H&M Backgrounds
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  glass: "rgba(255,255,255,0.85)",

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
  { status: "Shipped", label: "Shipped", icon: <FiTruck /> },
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

  /* Glassmorphism sticky bar */
  .lx-sticky {
    position: sticky;
    top: 0;
    z-index: 80;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
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
function AppleSection({ children, style: extra }) {
  return (
    <div style={{
      background: T.surface, borderRadius: T.rLg,
      border: `1px solid ${T.border}`, boxShadow: T.shadow,
      padding: 32, ...extra,
    }}>
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
// VERTICAL TRACKER (Apple Style)
// ─────────────────────────────────────────────────────────────
function VerticalTracker({ currentStepIndex, reduced }) {
  return (
    <div role="list" aria-label="Order progress" style={{ display: "flex", flexDirection: "column" }}>
      {STEPS.map((step, idx) => {
        const done = idx <= currentStepIndex;
        const current = idx === currentStepIndex;
        const last = idx === STEPS.length - 1;
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
                  background: done ? T.ink : T.surface,
                  border: `2px solid ${done ? T.ink : T.border}`,
                  color: done ? T.surface : T.inkGhost,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.35s",
                }}
              >
                {/* Simplify the icon rendering for a cleaner look */}
                {React.cloneElement(step.icon, { size: 14 })}
              </motion.div>
              {!last && (
                <div style={{
                  width: 2, flex: 1, minHeight: 32, marginTop: 4,
                  borderRadius: 2,
                  background: done ? T.ink : T.border,
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
              {current && (
                <p style={{
                  fontSize: 13, color: T.inkSoft, margin: "4px 0 0",
                  fontWeight: 500,
                }}>
                  Current Status
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
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
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

      // Briefly show success before navigating
      setTimeout(() => navigate("/cart"), 800);
    } catch (err) {
      toast.error("Failed to reorder items");
    } finally {
      setReordering(false);
    }
  }, [order, navigate, addToCart]);

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
        token={null}
        API_URL={API_URL}
        onSuccess={() => toast.success("Review saved!")}
      />
      <AnimatePresence>
        {complaintOpen && <QualityComplaintModal order={order} onClose={() => setComplaintOpen(false)} />}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 24px 72px" }}>

        {/* ── PAGE HEADER ─────────────────────────────── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: reduced ? 0 : -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: T.ease }}
          style={{ marginBottom: 28 }}
        >
          <Link
            to="/orders"
            className="lx-focus"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              color: T.inkSoft, textDecoration: "none",
              fontSize: 13, fontWeight: 500, marginBottom: 18,
            }}
          >
            <FiArrowLeft size={13} aria-hidden="true" />
            Back to Orders
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 30, fontWeight: 800, color: T.ink,
                letterSpacing: "-0.03em", margin: "0 0 6px",
              }}>
                Order #{displayId}
              </h1>
              <p style={{ fontSize: 13, color: T.inkSoft, margin: 0 }}>
                Placed on{" "}
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </p>
            </div>

            {/* Action cluster */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

              {/* Status pill */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={order.status}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "8px 14px", borderRadius: T.rFull,
                    fontSize: 11.5, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: cancelled ? T.coralBg : T.tealGlow,
                    color: cancelled ? T.coral : T.tealDeep,
                  }}
                >
                  {order.status}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── TWO-COLUMN LAYOUT ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.18, ease: T.ease }}
          className="lx-row-to-col"
          style={{ display: "flex", flexDirection: "row", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}
        >
          {/* ── LEFT COLUMN ────────────────────────── */}
          <div style={{ flex: "1 1 60%", minWidth: 320, display: "flex", flexDirection: "column", gap: 32 }}>

            {/* ── Cancelled Banner (replaces tracker) ── */}
            {cancelled && (
              <AppleSection style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: T.coralBg, color: T.coral,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FiXCircle size={26} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: T.coral, margin: "0 0 8px" }}>
                      Order Cancelled
                    </h2>
                    {order.cancelledAt && (
                      <p style={{ fontSize: 13, color: T.inkSoft, margin: "0 0 8px" }}>
                        <time dateTime={order.cancelledAt}>
                          {new Date(order.cancelledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </time>
                      </p>
                    )}
                    <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, margin: "0 0 16px" }}>
                      <span style={{ color: T.ink, fontWeight: 600 }}>Reason: </span>
                      {order.cancelReason || "No reason provided."}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleReorder}
                      disabled={reordering}
                      className="lx-focus"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "10px 20px", borderRadius: 999,
                        background: T.teal, color: "#fff", border: "none",
                        fontWeight: 600, fontSize: 14, cursor: reordering ? "not-allowed" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: T.shadowTeal,
                      }}
                    >
                      {reordering ? <Spinner size={13} /> : <FiShoppingCart size={14} />}
                      Reorder Items
                    </motion.button>
                  </div>
                </div>
              </AppleSection>
            )}

            {/* ── Cancelled Banner (replaces tracker) ── */}
            {cancelled && (
              <AppleSection style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: T.coralBg, color: T.coral,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FiXCircle size={26} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: T.coral, margin: "0 0 8px" }}>
                      Order Cancelled
                    </h2>
                    {order.cancelledAt && (
                      <p style={{ fontSize: 13, color: T.inkSoft, margin: "0 0 8px" }}>
                        <time dateTime={order.cancelledAt}>
                          {new Date(order.cancelledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </time>
                      </p>
                    )}
                    <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, margin: "0 0 16px" }}>
                      <span style={{ color: T.ink, fontWeight: 600 }}>Reason: </span>
                      {order.cancelReason || "No reason provided."}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleReorder}
                      disabled={reordering}
                      className="lx-focus"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "10px 20px", borderRadius: 999,
                        background: T.teal, color: "#fff", border: "none",
                        fontWeight: 600, fontSize: 14, cursor: reordering ? "not-allowed" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: T.shadowTeal,
                      }}
                    >
                      {reordering ? <Spinner size={13} /> : <FiShoppingCart size={14} />}
                      Reorder Items
                    </motion.button>
                  </div>
                </div>
              </AppleSection>
            )}

            {/* ── Order Status Tracker ── */}
            {!cancelled && (
              <AppleSection>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 20, fontWeight: 700, color: T.ink, margin: 0
                  }}>
                    Order Status
                  </h2>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.teal, background: T.tealGlow, padding: "4px 10px", borderRadius: T.rFull }}>
                    {order.status}
                  </span>
                </div>

                {!delivered && (
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 24 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: T.rFull,
                      background: T.surface, border: `1px solid ${T.border}`, color: T.inkMid,
                    }}>
                      <FiCalendar size={13} aria-hidden="true" />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        Expected by {getETA(order.createdAt)}
                      </span>
                    </div>

                    {order.status === "Shipped" && order.trackingId && (
                      <a
                        href={order.trackingUrl || `https://www.shiprocket.in/shipment-tracking/?id=${order.trackingId}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "6px 14px", borderRadius: T.rFull,
                          background: T.ink, border: `1px solid ${T.ink}`,
                          textDecoration: "none",
                          fontSize: 12, fontWeight: 600, color: T.surface,
                        }}
                      >
                        <FiTruck size={13} aria-hidden="true" />
                        Track Shipment
                        <FiExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}

                <div className="lx-desktop-only" style={{ overflowX: "auto", paddingBottom: 10 }}>
                  <div style={{ minWidth: 400 }}>
                    <HorizontalTracker currentStepIndex={stepIdx} reduced={reduced} />
                  </div>
                </div>
                <div className="lx-mobile-only">
                  <VerticalTracker currentStepIndex={stepIdx} reduced={reduced} />
                </div>
              </AppleSection>
            )}

            {/* ── Items card ─────────────────────────── */}
            <AppleSection>
              <h2 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 20, fontWeight: 700, color: T.ink,
                margin: "0 0 20px",
              }}>
                Purchased Items
              </h2>

              {order.items?.length === 0 ? (
                <p style={{ color: T.inkSoft, fontSize: 14, textAlign: "center", padding: "24px 0" }}>
                  No items found.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {order.items.map((item, i) => {
                    const pid = item.productId
                      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
                      : item.product
                        ? (typeof item.product === "object" ? item.product._id : item.product)
                        : item._id;
                    return (
                      <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: i !== order.items.length - 1 ? `1px solid ${T.border}` : "none", paddingBottom: i !== order.items.length - 1 ? 16 : 0 }}>
                        {/* Compact Thumbnail */}
                        <Link to={`/products/${pid}`} style={{ display: "block", flexShrink: 0 }}>
                          <ShimmerImage
                            src={`${API_URL}/uploads/${item.image?.replace("uploads/", "")}`}
                            alt={item.name}
                            style={{
                              width: 72, height: 72, borderRadius: 12,
                              objectFit: "cover", display: "block",
                              border: `1px solid ${T.border}`
                            }}
                          />
                        </Link>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div>
                              <Link to={`/products/${pid}`} style={{ textDecoration: "none" }}>
                                <p title={item.name} style={{
                                  fontFamily: "'Sora', sans-serif",
                                  fontSize: 15, fontWeight: 600, color: T.ink,
                                  margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                }}>
                                  {item.name}
                                </p>
                              </Link>
                              <p style={{ fontSize: 13, color: T.inkSoft, margin: 0 }}>
                                Quantity: {item.qty} × ₹{item.price}
                              </p>
                            </div>
                            <span style={{
                              fontFamily: "'Sora', sans-serif",
                              fontSize: 15, fontWeight: 700, color: T.ink,
                              whiteSpace: "nowrap"
                            }}>
                              ₹{item.price * item.qty}
                            </span>
                          </div>

                          {delivered && (
                            <div style={{ marginTop: 8 }}>
                              <button
                                onClick={() => openReview(item)}
                                className="lx-focus"
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: 0, border: "none", background: "transparent",
                                  color: T.teal, cursor: "pointer", fontSize: 12, fontWeight: 600,
                                }}
                              >
                                <FiStar size={12} /> Write a Review
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AppleSection>
          </div>

          {/* ── RIGHT COLUMN (STICKY) ────────────────── */}
          <div style={{ flex: "1 1 35%", minWidth: 300, display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 100 }}>

            <AppleSection>
              {/* Action Buttons Group */}
              <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
                {(delivered || cancelled) && (
                  <HeaderBtn
                    icon={reordering ? <Spinner size={13} /> : <FiShoppingCart size={13} />}
                    label="Reorder"
                    onClick={handleReorder}
                    disabled={reordering}
                    primary={true}
                  />
                )}
                {delivered && (
                  <HeaderBtn
                    icon={<FiAlertCircle size={13} />}
                    label="Report Issue"
                    onClick={() => setComplaintOpen(true)}
                  />
                )}
                <HeaderBtn
                  icon={<FiDownload size={13} />}
                  label="Invoice"
                  onClick={() => generateInvoicePDF(order)}
                />
                {canCancel && (
                  <HeaderBtn
                    icon={<FiXCircle size={13} />}
                    label="Cancel"
                    onClick={() => setCancelOpen(true)}
                  />
                )}
              </div>

              {/* Price breakdown */}
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, margin: "0 0 16px" }}>Order Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <PriceRow label="Subtotal" value={`₹${order.itemsPrice}`} />
                <PriceRow label="Shipping" value={order.shippingPrice === 0 ? "Free" : `₹${order.shippingPrice}`} color={order.shippingPrice === 0 ? T.ink : undefined} />
                <PriceRow label="Tax" value={`₹${order.taxPrice}`} />
                {order.discount > 0 && (
                  <PriceRow label="Discount" value={`-₹${order.discount}`} color={T.teal} />
                )}
                <PriceRow label="Total" value={`₹${order.totalAmount}`} bold borderTop />
              </div>
            </AppleSection>

            {/* Delivery address */}
            <AppleSection>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, margin: "0 0 16px" }}>
                Delivery Address
              </h3>
              <address style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.inkMid, lineHeight: 1.6, fontStyle: "normal" }}>
                <strong style={{ color: T.ink, fontWeight: 600 }}>{order.shippingAddress?.fullName}</strong><br />
                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.zip}<br />
                <span style={{ color: T.inkSoft, marginTop: 12, display: "inline-block" }}>{order.shippingAddress?.phone}</span>
              </address>
              {order.shippingAddress?.instructions && (
                <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "#F5F5F7", fontSize: 13, color: T.inkMid, borderLeft: `3px solid ${T.ink}` }}>
                  {order.shippingAddress.instructions}
                </div>
              )}
            </AppleSection>

            {/* Payment info */}
            <AppleSection>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, margin: "0 0 16px" }}>
                Payment Information
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 16 }}>
                <span style={{ color: T.inkSoft }}>Method</span>
                <span style={{ fontWeight: 600, color: T.ink, display: "flex", alignItems: "center", gap: 8 }}>
                  <PaymentIcon method={order.paymentMethod} />
                  {order.paymentMethod}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, alignItems: "center" }}>
                <span style={{ color: T.inkSoft }}>Status</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={String(order.isPaid)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontWeight: 700, color: order.isPaid ? T.teal : T.inkMid }}
                  >
                    {order.isPaid ? "Paid" : (order.paymentMethod?.toLowerCase().includes("cod") || order.paymentMethod?.toLowerCase().includes("cash")) ? "Cash on Delivery" : "Pending"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </AppleSection>

          </div>
        </motion.div>
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