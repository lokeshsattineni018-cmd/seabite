/**
 * Order.jsx — Premium Redesign
 *
 * Design System: "Liquid Luxury"
 * ─────────────────────────────────────────────────────────────
 * Aesthetic: Apple-grade refinement meets editorial depth.
 *   • Typography: Sora (display) + DM Sans (body) — unexpected,
 *     characterful pairing that reads as confident and modern.
 *   • Color: Near-black base (#0D1117) with a signature glacier
 *     teal (#4ECDC4) — dominant neutrals, sharp single accent.
 *   • Motion: Framer spring physics throughout. Cards enter on a
 *     single stagger arc. Interactive states use inertia curves.
 *   • Space: 8px grid. Generous padding. Cards breathe.
 *
 * Data Contracts: Unchanged from original. All props/API calls
 * preserved exactly — only visual layer is replaced.
 *
 * Trade-offs:
 *   • Heavier DOM per card for richer layering — offset by
 *     React.memo on ItemRow and useMemo on derived lists.
 *   • Framer layout animations on the list need layoutId keys
 *     to be stable (order._id — guaranteed unique).
 *   • Font loaded via @import — swap for your build pipeline's
 *     preferred method (next/font, vite-plugin-fonts, etc.).
 */

import React, {
  useEffect, useState, useMemo, useCallback, useRef,
} from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  FiClock, FiCheck, FiX, FiRefreshCcw, FiChevronRight,
  FiShoppingBag, FiStar, FiTag, FiTruck, FiChevronDown,
  FiMapPin, FiDownload, FiSearch, FiAlertCircle,
  FiShoppingCart, FiSliders, FiCopy, FiRotateCcw,
  FiPackage, FiFilter,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ReviewModal from "../../components/common/ReviewModal";
import PopupModal from "../../components/common/PopupModal";
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — single source of truth
// ─────────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:            "#F7F8FA",
  surface:       "#FFFFFF",
  surfaceRaised: "#FDFDFD",
  glass:         "rgba(255,255,255,0.78)",

  // Borders
  border:        "#EAECF0",
  borderFocus:   "#4ECDC4",

  // Text
  ink:           "#0D1117",
  inkMid:        "#44505C",
  inkSoft:       "#8A96A3",
  inkGhost:      "#B8C0C8",

  // Brand / Accent
  teal:          "#4ECDC4",
  tealDeep:      "#38B2AC",
  tealGlow:      "rgba(78,205,196,0.18)",

  // Status
  amber:         "#F59E0B",
  amberBg:       "rgba(245,158,11,0.10)",
  coral:         "#EF4444",
  coralBg:       "rgba(239,68,68,0.09)",
  jade:          "#10B981",
  jadeBg:        "rgba(16,185,129,0.09)",
  sky:           "#38BDF8",
  skyBg:         "rgba(56,189,248,0.09)",

  // Easing
  spring:        { type: "spring", stiffness: 380, damping: 36 },
  ease:          [0.16, 1, 0.3, 1],
  easeOut:       [0, 0, 0.4, 1],

  // Radii
  r:             14,
  rLg:           20,
  rXl:           28,
  rFull:         9999,

  // Shadows
  shadow:        "0 1px 4px rgba(13,17,23,0.06), 0 4px 16px rgba(13,17,23,0.04)",
  shadowMd:      "0 4px 24px rgba(13,17,23,0.08), 0 1px 6px rgba(13,17,23,0.05)",
  shadowLg:      "0 12px 48px rgba(13,17,23,0.12), 0 4px 16px rgba(13,17,23,0.06)",
  shadowTeal:    "0 8px 32px rgba(78,205,196,0.22)",
};

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const TABS = ["All", "Active", "Delivered", "Cancelled"];

const SORTS = [
  { v: "newest",  l: "Newest First"    },
  { v: "oldest",  l: "Oldest First"    },
  { v: "highest", l: "Highest Amount"  },
  { v: "lowest",  l: "Lowest Amount"   },
];

const EMOJI_MAP = ["🐟","🦐","🦞","🦀","🐙","🦑","🐠"];

const COMPLAINT_ISSUES = [
  { v: "wrong_item",    l: "Wrong item delivered"      },
  { v: "poor_quality",  l: "Poor freshness / quality"  },
  { v: "missing_items", l: "Missing items from order"  },
  { v: "damaged",       l: "Item damaged in transit"   },
  { v: "other",         l: "Other issue"               },
];

const TAB_META = {
  All:       { emoji: "📦", color: T.teal,  bg: T.tealGlow  },
  Active:    { emoji: "🔄", color: T.amber, bg: T.amberBg   },
  Delivered: { emoji: "✅", color: T.jade,  bg: T.jadeBg    },
  Cancelled: { emoji: "🚫", color: T.coral, bg: T.coralBg   },
};

const EMPTY_COPY = {
  All:       { icon: "📦", h: "No orders yet",            p: "Your order history will appear once you place your first order." },
  Active:    { icon: "🌊", h: "No active orders",         p: "Browse our fresh catch and place an order to see it here." },
  Delivered: { icon: "✅", h: "No delivered orders",      p: "Delivered orders will appear here once they arrive." },
  Cancelled: { icon: "🎉", h: "No cancellations",         p: "Great record — none of your orders have been cancelled." },
};

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once)
// ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }

  /* Focus ring */
  .lx-focus:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${T.tealGlow}, 0 0 0 1.5px ${T.teal};
  }

  /* Shimmer skeleton */
  @keyframes lx-shimmer {
    0%   { background-position: -700px 0; }
    100% { background-position:  700px 0; }
  }
  .lx-shimmer {
    background: linear-gradient(
      90deg,
      ${T.border} 25%,
      #E5E9EE 50%,
      ${T.border} 75%
    );
    background-size: 700px 100%;
    animation: lx-shimmer 1.5s infinite linear;
    border-radius: 6px;
  }

  /* Pulse dot for active status */
  @keyframes lx-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
    60%     { box-shadow: 0 0 0 5px rgba(245,158,11,0);  }
  }
  .lx-pulse { animation: lx-pulse 2s ease infinite; }

  /* Live badge dot */
  @keyframes lx-live {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.4; transform: scale(1.5); }
  }
  .lx-live { animation: lx-live 1.6s ease infinite; }

  /* Responsive grid */
  @media (max-width: 820px) {
    .lx-sidebar  { display: none !important; }
    .lx-mob-bar  { display: flex !important; }
    .lx-main-col { grid-column: 1 / -1 !important; }
  }

  /* Custom number badges */
  .lx-badge {
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("lx-styles")) {
  const el = document.createElement("style");
  el.id = "lx-styles";
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────
function statusConfig(status) {
  switch (status) {
    case "Delivered":
      return { color: T.jade,  bg: T.jadeBg,  text: T.jade,  icon: <FiCheck  size={11} />, pulse: false, label: "Delivered"  };
    case "Cancelled":
    case "Cancelled by User":
      return { color: T.coral, bg: T.coralBg, text: T.coral, icon: <FiX      size={11} />, pulse: false, label: status       };
    case "Shipped":
      return { color: T.sky,   bg: T.skyBg,   text: T.sky,   icon: <FiTruck  size={11} />, pulse: true,  label: "Shipped"    };
    case "Processing":
      return { color: T.teal,  bg: T.tealGlow, text: T.teal, icon: <FiPackage size={11} />, pulse: true,  label: "Processing" };
    default: // Pending
      return { color: T.amber, bg: T.amberBg, text: T.amber, icon: <FiRefreshCcw size={11} />, pulse: true, label: "Pending" };
  }
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n || 0);

function useDebounce(value, ms = 300) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

// ─────────────────────────────────────────────────────────────
// SKELETON — matched to real card proportions
// ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: T.surface, borderRadius: T.rLg,
      border: `1px solid ${T.border}`, padding: 22,
      boxShadow: T.shadow,
    }}>
      {/* Top strip */}
      <div className="lx-shimmer" style={{ height: 3, borderRadius: 3, marginBottom: 18 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div className="lx-shimmer" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <div className="lx-shimmer" style={{ height: 13, width: "48%", borderRadius: 5 }} />
          <div className="lx-shimmer" style={{ height: 10, width: "30%", borderRadius: 5 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
          <div className="lx-shimmer" style={{ height: 8, width: 42, borderRadius: 4 }} />
          <div className="lx-shimmer" style={{ height: 18, width: 74, borderRadius: 6 }} />
        </div>
      </div>
      <div className="lx-shimmer" style={{ height: 38, borderRadius: 10, width: "100%" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ITEM ROW (memoised)
// ─────────────────────────────────────────────────────────────
const ItemRow = React.memo(function ItemRow({ item, index, isFrequent }) {
  const id =
    item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: T.ease }}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        padding: "10px 14px", borderRadius: 12,
        background: T.bg, border: `1px solid ${T.border}`,
      }}
    >
      <Link
        to={`/products/${id}`}
        style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", flex: 1, minWidth: 0 }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: T.tealGlow, border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {item.image ? (
            <img
              src={`${API_URL}/uploads/${item.image.replace("uploads/", "")}`}
              alt={item.name}
              width={36} height={36}
              loading="lazy" decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.onerror = null; e.target.src = "/placeholder-fish.svg"; }}
            />
          ) : (
            <span style={{ fontSize: 17 }} role="img" aria-label={item.name}>
              {EMOJI_MAP[index % EMOJI_MAP.length]}
            </span>
          )}
        </div>

        {/* Name + price */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p title={item.name} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, fontSize: 12.5, color: T.ink,
              margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.name}
            </p>
            {isFrequent && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: T.tealDeep,
                background: T.tealGlow, padding: "1px 6px",
                borderRadius: T.rFull, whiteSpace: "nowrap", flexShrink: 0,
              }}>
                🔁 Regular
              </span>
            )}
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10.5, color: T.inkSoft, margin: "2px 0 0",
          }}>
            {fmt(item.price)} × {item.qty}
          </p>
        </div>
      </Link>

      <span style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: 12.5, fontWeight: 700, color: T.ink, flexShrink: 0,
      }}>
        {fmt(item.price * item.qty)}
      </span>
    </motion.div>
  );
});

// ─────────────────────────────────────────────────────────────
// QUALITY COMPLAINT MODAL
// ─────────────────────────────────────────────────────────────
function QualityComplaintModal({ order, onClose, onSuccess }) {
  const [issueType,    setIssueType]    = useState("");
  const [description,  setDescription]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  // Trap Escape key
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
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayId = order.orderId || order._id.slice(-6).toUpperCase();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      role="dialog" aria-modal="true" aria-labelledby="lx-complaint-title"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(13,17,23,0.55)", backdropFilter: "blur(8px)" }}
      />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ ...T.spring }}
        style={{
          position: "relative", width: "100%", maxWidth: 460,
          background: T.surface, borderRadius: T.rXl,
          padding: 32, boxShadow: T.shadowLg,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", gap: 14, marginBottom: 26 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: T.coralBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.coral, flexShrink: 0,
          }}>
            <FiAlertCircle size={22} />
          </div>
          <div>
            <h3 id="lx-complaint-title" style={{ margin: "0 0 4px", fontFamily: "'Sora', sans-serif", fontSize: 19, fontWeight: 700, color: T.ink }}>
              Report an Issue
            </h3>
            <p style={{ margin: 0, color: T.inkSoft, fontSize: 13 }}>
              Order #{displayId} · We'll respond within 24 hours
            </p>
          </div>
        </div>

        {/* Issue selector */}
        <p style={{ fontSize: 11, fontWeight: 600, color: T.inkGhost, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          What went wrong?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
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
                  cursor: "pointer", fontSize: 13.5, fontWeight: sel ? 600 : 400,
                  color: sel ? T.coral : T.inkMid,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.16s", textAlign: "left",
                }}
              >
                {/* Radio circle */}
                <span style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${sel ? T.coral : T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: sel ? T.coral : "transparent",
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
        <p style={{ fontSize: 11, fontWeight: 600, color: T.inkGhost, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
          Additional details (optional)
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
            transition: "border-color 0.18s", background: T.bg,
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
            whileTap={!submitting && issueType ? { scale: 0.97 } : {}}
            onClick={submit}
            disabled={submitting || !issueType}
            className="lx-focus"
            style={{
              padding: "11px 24px", borderRadius: 12, border: "none",
              cursor: (!issueType || submitting) ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: 13.5, color: "#fff",
              background: (!issueType || submitting)
                ? "rgba(239,68,68,0.35)"
                : T.coral,
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
// MOBILE SORT SHEET
// ─────────────────────────────────────────────────────────────
function MobileSortSheet({ sortBy, setSortBy, onClose }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      role="dialog" aria-modal="true" aria-label="Sort orders"
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(13,17,23,0.45)", backdropFilter: "blur(6px)" }}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ ...T.spring }}
        style={{
          position: "relative", width: "100%", maxWidth: 520,
          background: T.surface, borderRadius: "22px 22px 0 0",
          padding: "20px 20px 44px", boxShadow: T.shadowLg,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 22px" }} />
        <h3 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 15, fontWeight: 700, color: T.ink, margin: "0 0 16px",
        }}>
          Sort Orders
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SORTS.map(s => {
            const active = sortBy === s.v;
            return (
              <button
                key={s.v}
                onClick={() => { setSortBy(s.v); onClose(); }}
                className="lx-focus"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 18px", borderRadius: 14,
                  border: `1.5px solid ${active ? T.teal : T.border}`,
                  background: active ? T.tealGlow : T.bg,
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? T.tealDeep : T.inkMid,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {s.l}
                {active && <FiCheck size={15} style={{ color: T.teal }} />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OVERVIEW STAT ROW
// ─────────────────────────────────────────────────────────────
function StatRow({ label, value, color, border }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0",
      borderBottom: border ? `1px solid ${T.border}` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 400 }}>{label}</span>
      </div>
      <span className="lx-badge" style={{ fontSize: 12, fontWeight: 700, color: color || T.ink }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR CARD WRAPPER
// ─────────────────────────────────────────────────────────────
function SideCard({ accent, title, children }) {
  return (
    <div style={{
      background: T.surface, borderRadius: T.rLg,
      border: `1px solid ${T.border}`, boxShadow: T.shadow,
      overflow: "hidden",
    }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: accent }} />
      <div style={{ padding: "16px 16px 14px" }}>
        <p style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 10, fontWeight: 700, color: T.inkGhost,
          textTransform: "uppercase", letterSpacing: "0.14em",
          margin: "0 0 12px",
        }}>
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Order() {
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [expandedOrder,   setExpandedOrder]   = useState(null);
  const [isReviewOpen,    setIsReviewOpen]    = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview,  setSelectedReview]  = useState(null);
  const [modalConfig,     setModalConfig]     = useState({ show: false, message: "", type: "info" });
  const [complaintOrder,  setComplaintOrder]  = useState(null);
  const [reorderingId,    setReorderingId]    = useState(null);
  const [showSortSheet,   setShowSortSheet]   = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");

  const navigate  = useNavigate();
  const searchRef = useRef(null);
  const reduced   = useReducedMotion();

  // ── URL-synced state ──────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab")  || "All";
  const sortBy    = searchParams.get("sort") || "newest";

  const setActiveTab = useCallback(tab => {
    setSearchParams(p => { const n = new URLSearchParams(p); n.set("tab", tab); return n; });
  }, [setSearchParams]);

  const setSortBy = useCallback(sort => {
    setSearchParams(p => { const n = new URLSearchParams(p); n.set("sort", sort); return n; });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSearchParams({});
  }, [setSearchParams]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // ── Data fetching ─────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
      setOrders(data);
    } catch (err) {
      if (err.response?.status === 401) setTimeout(() => navigate("/login"), 1000);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── ⌘K shortcut ──────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Frequently-bought product IDs ────────────────────────
  const frequentIds = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const id = item.productId
          ? (typeof item.productId === "object" ? item.productId._id : item.productId)
          : item.product
            ? (typeof item.product === "object" ? item.product._id : item.product)
            : item._id;
        if (id) counts[id] = (counts[id] || 0) + 1;
      });
    });
    return new Set(Object.keys(counts).filter(id => counts[id] >= 3));
  }, [orders]);

  // ── Derived data ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...orders];
    if (activeTab === "Active")
      r = r.filter(o => ["Pending","Processing","Shipped"].includes(o.status));
    else if (activeTab === "Delivered")
      r = r.filter(o => o.status === "Delivered");
    else if (activeTab === "Cancelled")
      r = r.filter(o => o.status?.includes("Cancelled"));

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter(o =>
        String(o.orderId || o._id || "").toLowerCase().includes(q) ||
        (o.items || []).some(i => String(i.name || "").toLowerCase().includes(q))
      );
    }
    if (sortBy === "newest")  r.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest")  r.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "highest") r.sort((a,b) => (b.totalAmount||0) - (a.totalAmount||0));
    if (sortBy === "lowest")  r.sort((a,b) => (a.totalAmount||0) - (b.totalAmount||0));
    return r;
  }, [orders, activeTab, debouncedSearch, sortBy]);

  const counts = useMemo(() => ({
    All:       orders.length,
    Active:    orders.filter(o => ["Pending","Processing","Shipped"].includes(o.status)).length,
    Delivered: orders.filter(o => o.status === "Delivered").length,
    Cancelled: orders.filter(o => o.status?.includes("Cancelled")).length,
  }), [orders]);

  const totalSpent = useMemo(() =>
    orders.filter(o => !o.status?.includes("Cancelled")).reduce((s,o) => s + (o.totalAmount||0), 0), [orders]);
  const totalSaved = useMemo(() =>
    orders.reduce((s,o) => s + (o.discount||0), 0), [orders]);

  // ── Review helpers ────────────────────────────────────────
  const getUserReview = useCallback((item, orderUserId) => {
    const pd = item.productId || item.product;
    if (!pd?.reviews) return null;
    return pd.reviews.find(r => {
      const rid = typeof r.user === "object" ? r.user._id : r.user;
      const uid = typeof orderUserId === "object" ? orderUserId._id : orderUserId;
      return rid?.toString() === uid?.toString();
    });
  }, []);

  const openReviewModal = useCallback((item, existing) => {
    const id = item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;
    setSelectedProduct({ _id: id, name: item.name });
    setSelectedReview(existing);
    setIsReviewOpen(true);
  }, []);

  // ── Copy order ID ─────────────────────────────────────────
  const copyId = useCallback((displayId) => {
    navigator.clipboard.writeText(displayId).then(() =>
      toast.success("Order ID copied!", { icon: "📋", duration: 1600 })
    );
  }, []);

  // ── Reorder ───────────────────────────────────────────────
  const handleReorder = useCallback(async (order, e) => {
    e?.stopPropagation();
    setReorderingId(order._id);
    try {
      await Promise.all(
        order.items.map(item => {
          const pid = item.productId
            ? (typeof item.productId === "object" ? item.productId._id : item.productId)
            : item.product
              ? (typeof item.product === "object" ? item.product._id : item.product)
              : item._id;
          return axios.post(`${API_URL}/api/cart`, { productId: pid, qty: item.qty }, { withCredentials: true });
        })
      );
      toast.success(
        `${order.items.length} item${order.items.length > 1 ? "s" : ""} added to cart!`,
        { icon: "🛒", style: { fontFamily: "'DM Sans', sans-serif" } }
      );
      navigate("/cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setReorderingId(null);
    }
  }, [navigate]);

  const isFiltered = activeTab !== "All" || searchQuery.trim() !== "" || sortBy !== "newest";

  // ─────────────────────────────────────────────────────────
  // Spinner for reorder
  // ─────────────────────────────────────────────────────────
  const Spinner = () => (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      style={{
        display: "inline-block", width: 11, height: 11,
        border: "1.5px solid rgba(78,205,196,0.3)",
        borderTopColor: T.teal, borderRadius: "50%",
      }}
    />
  );

  // ── Animation variants ────────────────────────────────────
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reduced ? 0 : 0.05 },
    },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: reduced ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: T.ease } },
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "clip",
    }}>
      {/* Accessibility live region */}
      <div
        id="lx-live"
        role="status" aria-live="polite" aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
      />

      {/* Modals */}
      <PopupModal
        show={modalConfig.show}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig(c => ({ ...c, show: false }))}
      />
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={selectedProduct}
        existingReview={selectedReview}
        token={null}
        API_URL={API_URL}
        onSuccess={() => {
          setModalConfig({ show: true, message: "Review saved!", type: "success" });
          fetchOrders();
        }}
      />
      <AnimatePresence>
        {complaintOrder && (
          <QualityComplaintModal
            order={complaintOrder}
            onClose={() => setComplaintOrder(null)}
            onSuccess={fetchOrders}
          />
        )}
        {showSortSheet && (
          <MobileSortSheet
            sortBy={sortBy}
            setSortBy={setSortBy}
            onClose={() => setShowSortSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Ambient background mesh ──────────────────────── */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -200, right: -200, width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -100, width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto", padding: "104px 24px 72px" }}>

        {/* ── PAGE HEADER ──────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: reduced ? 0 : -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: T.ease }}
          style={{ marginBottom: 32 }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: T.teal }} />
            <span style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 10, fontWeight: 700, color: T.teal,
              textTransform: "uppercase", letterSpacing: "0.18em",
            }}>
              My Account
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 40, fontWeight: 800, color: T.ink,
              letterSpacing: "-0.035em", margin: 0, lineHeight: 1.1,
            }}>
              Orders
            </h1>

            {!loading && orders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.35 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: T.rFull,
                  background: T.tealGlow, border: `1px solid ${T.teal}22`,
                }}
              >
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700, color: T.tealDeep }}>
                  {orders.length}
                </span>
                <span style={{ fontSize: 12, color: T.inkSoft }}>total orders</span>
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* ── LOADING SKELETON ────────────────────────── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 22, alignItems: "start" }}>
            {/* Sidebar skeleton */}
            <div className="lx-sidebar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[90, 130, 100].map((h, i) => (
                <div key={i} style={{
                  background: T.surface, borderRadius: T.rLg,
                  border: `1px solid ${T.border}`, padding: 18,
                }}>
                  <div className="lx-shimmer" style={{ height: 9, width: "45%", marginBottom: 14 }} />
                  {Array.from({ length: i === 0 ? 4 : 3 }).map((_, j) => (
                    <div key={j} className="lx-shimmer" style={{ height: 11, width: `${65 + j * 7}%`, marginBottom: 9 }} />
                  ))}
                </div>
              ))}
            </div>
            {/* Cards skeleton */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="lx-shimmer" style={{ height: 44, borderRadius: 14 }} />
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : orders.length === 0 ? (
          // ── GLOBAL EMPTY STATE ──────────────────────────
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: T.ease }}
            style={{
              background: T.surface, borderRadius: T.rXl,
              border: `1px solid ${T.border}`, boxShadow: T.shadowMd,
              padding: "80px 40px", textAlign: "center",
            }}
          >
            <motion.div
              animate={reduced ? {} : { y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 80, height: 80, borderRadius: 22,
                background: T.tealGlow, border: `1px solid ${T.teal}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 28px", color: T.teal,
              }}
            >
              <FiShoppingBag size={34} />
            </motion.div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: T.ink, marginBottom: 12 }}>
              No orders yet
            </h3>
            <p style={{ fontSize: 14.5, color: T.inkSoft, maxWidth: 340, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Your order history will appear here once you make your first purchase from our fresh catch.
            </p>
            <motion.button
              whileHover={reduced ? {} : { y: -2, boxShadow: T.shadowTeal }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="lx-focus"
              style={{
                padding: "14px 32px", borderRadius: T.rLg,
                background: T.teal, color: T.surface,
                fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14.5,
                border: "none", cursor: "pointer",
                boxShadow: T.shadowTeal,
                transition: "box-shadow 0.2s",
              }}
            >
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          // ── TWO-COLUMN LAYOUT ──────────────────────────
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 22, alignItems: "start" }}>

            {/* ── MOBILE TOP BAR ──────────────────────── */}
            <div
              className="lx-mob-bar"
              style={{ display: "none", gridColumn: "1/-1", gap: 8, alignItems: "center" }}
            >
              <div role="tablist" style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1, scrollbarWidth: "none", paddingBottom: 2 }}>
                {TABS.map(tab => {
                  const meta = TAB_META[tab];
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab} role="tab" aria-selected={active}
                      onClick={() => setActiveTab(tab)}
                      className="lx-focus"
                      style={{
                        flexShrink: 0, padding: "8px 14px", borderRadius: T.rFull,
                        border: `1.5px solid ${active ? meta.color : T.border}`,
                        background: active ? meta.bg : T.surface,
                        cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400,
                        color: active ? meta.color : T.inkMid,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      {tab} <span style={{ fontWeight: 700, opacity: 0.7 }}>{counts[tab]}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowSortSheet(true)}
                className="lx-focus"
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 12,
                  border: `1px solid ${T.border}`, background: T.surface,
                  fontSize: 12, fontWeight: 500, color: T.inkMid,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <FiFilter size={11} /> Sort
              </button>
            </div>

            {/* ── LEFT SIDEBAR ───────────────────────── */}
            <div
              className="lx-sidebar"
              style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Overview */}
              <SideCard title="Overview" accent={`linear-gradient(90deg, ${T.teal}, ${T.sky})`}>
                <StatRow label="Total Orders" value={counts.All}              color={T.teal}    border />
                <StatRow label="Delivered"    value={counts.Delivered}        color={T.jade}    border />
                <StatRow label="Active"       value={counts.Active}           color={T.amber}   border />
                <StatRow label="Cancelled"    value={counts.Cancelled}        color={T.coral}   border />
                <StatRow label="Total Spent"  value={fmt(totalSpent)}         color={T.ink}     border />
                <StatRow label="Total Saved"  value={fmt(totalSaved)}         color={T.tealDeep} />
              </SideCard>

              {/* Filter */}
              <SideCard title="Filter" accent={`linear-gradient(90deg, ${T.amber}, ${T.coral})`}>
                <div role="tablist" aria-label="Filter orders" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {TABS.map(tab => {
                    const meta   = TAB_META[tab];
                    const active = activeTab === tab;
                    return (
                      <div key={tab} style={{ position: "relative" }}>
                        {active && (
                          <motion.div
                            layoutId="lx-tab-bg"
                            style={{ position: "absolute", inset: 0, borderRadius: 10, background: meta.bg }}
                            transition={T.spring}
                          />
                        )}
                        <button
                          role="tab" aria-selected={active}
                          onClick={() => setActiveTab(tab)}
                          className="lx-focus"
                          style={{
                            position: "relative", zIndex: 1,
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            width: "100%", padding: "8px 10px",
                            border: "none", borderLeft: `3px solid ${active ? meta.color : "transparent"}`,
                            borderRadius: 10, background: "transparent",
                            color: active ? meta.color : T.inkSoft,
                            fontSize: 12.5, fontWeight: active ? 600 : 400,
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            transition: "color 0.16s, border-color 0.16s",
                          }}
                        >
                          {tab}
                          <span className="lx-badge" style={{
                            fontSize: 10, fontWeight: 700,
                            padding: "1px 7px", borderRadius: T.rFull,
                            background: active ? `${meta.color}22` : "rgba(0,0,0,0.04)",
                            color: active ? meta.color : T.inkGhost,
                          }}>
                            {counts[tab]}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </SideCard>

              {/* Sort */}
              <SideCard title="Sort" accent={`linear-gradient(90deg, ${T.sky}, #7DD3FC)`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {SORTS.map(s => {
                    const sel = sortBy === s.v;
                    return (
                      <button
                        key={s.v}
                        onClick={() => setSortBy(s.v)}
                        className="lx-focus"
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          width: "100%", padding: "7px 10px",
                          border: "none", borderRadius: 10,
                          background: sel ? T.skyBg : "transparent",
                          color: sel ? T.sky : T.inkSoft,
                          fontSize: 12, fontWeight: sel ? 600 : 400,
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.16s", textAlign: "left",
                        }}
                      >
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                          background: sel ? T.sky : "transparent",
                          border: sel ? "none" : `1.5px solid ${T.border}`,
                          transition: "all 0.14s",
                        }} />
                        {s.l}
                      </button>
                    );
                  })}
                </div>
              </SideCard>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────── */}
            <div>
              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: 12 }}>
                <FiSearch style={{
                  position: "absolute", left: 15, top: "50%",
                  transform: "translateY(-50%)", color: T.inkGhost, pointerEvents: "none",
                }} size={14} />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Search orders by ID or product name"
                  placeholder="Search by order ID or product name…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="lx-focus"
                  style={{
                    width: "100%", paddingLeft: 44, paddingRight: 72,
                    paddingTop: 12, paddingBottom: 12,
                    borderRadius: T.r, border: `1.5px solid ${T.border}`,
                    background: T.surface, fontSize: 13.5, fontWeight: 400,
                    color: T.ink, outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    boxSizing: "border-box", boxShadow: T.shadow,
                    transition: "border-color 0.18s, box-shadow 0.18s",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = T.teal;
                    e.target.style.boxShadow = `${T.shadow}, 0 0 0 3px ${T.tealGlow}`;
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = T.border;
                    e.target.style.boxShadow = T.shadow;
                  }}
                />
                {!searchQuery && (
                  <span style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 9, fontWeight: 600, color: T.inkGhost,
                    background: T.bg, border: `1px solid ${T.border}`,
                    padding: "2px 7px", borderRadius: 6, letterSpacing: "0.04em",
                    pointerEvents: "none",
                  }}>
                    ⌘K
                  </span>
                )}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="lx-focus"
                      style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        width: 22, height: 22, borderRadius: "50%",
                        border: "none", cursor: "pointer",
                        background: T.border, color: T.inkMid,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12,
                      }}
                    >
                      ×
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Results bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: T.inkGhost, fontWeight: 400 }}>
                  Showing{" "}
                  <strong style={{ color: T.ink, fontWeight: 600 }}>{filtered.length}</strong>{" "}
                  order{filtered.length !== 1 ? "s" : ""}
                </span>
                {isFiltered && (
                  <button
                    onClick={clearFilters}
                    className="lx-focus"
                    style={{
                      fontSize: 11.5, fontWeight: 600, color: T.coral,
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Clear filters ✕
                  </button>
                )}
              </div>

              {/* Per-tab empty state */}
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: "center", padding: "64px 24px",
                    background: T.surface, borderRadius: T.rLg,
                    border: `1px solid ${T.border}`, boxShadow: T.shadow,
                  }}
                  role="status" aria-live="polite"
                >
                  <div style={{ fontSize: 44, marginBottom: 14 }}>
                    {debouncedSearch ? "🔍" : EMPTY_COPY[activeTab]?.icon}
                  </div>
                  <p style={{
                    fontFamily: "'Sora', sans-serif",
                    color: T.ink, fontSize: 16, fontWeight: 700, margin: "0 0 8px",
                  }}>
                    {debouncedSearch ? "No matching orders" : EMPTY_COPY[activeTab]?.h}
                  </p>
                  <p style={{ color: T.inkSoft, fontSize: 13, maxWidth: 300, margin: "0 auto" }}>
                    {debouncedSearch
                      ? `No orders match "${debouncedSearch}"`
                      : EMPTY_COPY[activeTab]?.p}
                  </p>
                </motion.div>
              ) : (
                // ── ORDER CARDS ──────────────────────────────
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {filtered.map(order => {
                    const sc         = statusConfig(order.status);
                    const delivered  = order.status === "Delivered";
                    const expanded   = expandedOrder === order._id;
                    const panelId    = `lx-panel-${order._id}`;
                    const display    = order.orderId || order._id.slice(-6).toUpperCase();
                    const reordering = reorderingId === order._id;
                    const canReorder = delivered || order.status?.includes("Cancelled");

                    return (
                      <motion.article
                        key={order._id}
                        variants={itemVariants}
                        layout="position"
                        style={{
                          background: T.surface,
                          borderRadius: T.rLg,
                          border: `1px solid ${T.border}`,
                          boxShadow: T.shadow,
                          overflow: "hidden",
                        }}
                        whileHover={reduced ? {} : {
                          boxShadow: T.shadowMd,
                          y: -2,
                          transition: { duration: 0.2, ease: T.easeOut },
                        }}
                      >
                        {/* ── Status strip ── */}
                        <div
                          aria-hidden="true"
                          style={{
                            height: 3,
                            background: sc.color,
                            opacity: 0.85,
                          }}
                        />

                        {/* ── Card body ── */}
                        <div style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                            
                            {/* Left: icon + meta */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{
                                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                                background: sc.bg, color: sc.color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {sc.icon}
                              </div>
                              <div>
                                {/* Order ID + copy */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <button
                                    onClick={() => copyId(display)}
                                    title="Click to copy order ID"
                                    className="lx-focus"
                                    style={{
                                      fontFamily: "monospace", fontWeight: 700,
                                      fontSize: 13.5, color: T.ink,
                                      background: "none", border: "none",
                                      cursor: "pointer", padding: 0,
                                      display: "flex", alignItems: "center", gap: 5,
                                    }}
                                  >
                                    #{display}
                                    <FiCopy size={9} style={{ color: T.inkGhost }} />
                                  </button>

                                  {/* Status badge */}
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "2px 8px", borderRadius: T.rFull,
                                    fontSize: 9, fontWeight: 700,
                                    textTransform: "uppercase", letterSpacing: "0.07em",
                                    background: sc.bg, color: sc.color,
                                  }}>
                                    {sc.pulse
                                      ? <span className="lx-pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sc.color }} />
                                      : <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sc.color }} />
                                    }
                                    {order.status}
                                  </span>
                                </div>

                                {/* Date + item count */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.inkGhost }}>
                                  <FiClock size={9} aria-hidden="true" />
                                  <time dateTime={order.createdAt}>
                                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                  </time>
                                  <span aria-hidden>·</span>
                                  <span>{order.items?.length || 0} items</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: total + quick reorder */}
                            <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                              <div>
                                <p style={{
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 9, fontWeight: 600, color: T.inkGhost,
                                  textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 3px",
                                }}>
                                  Total
                                </p>
                                <p className="lx-badge" style={{
                                  fontFamily: "'Sora', sans-serif",
                                  fontSize: 17, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: "-0.02em",
                                }}>
                                  {fmt(order.totalAmount)}
                                </p>
                              </div>

                              {canReorder && (
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  onClick={e => handleReorder(order, e)}
                                  disabled={reordering}
                                  className="lx-focus"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "5px 11px", borderRadius: 8,
                                    border: `1.5px solid ${T.teal}33`,
                                    background: T.tealGlow, color: T.tealDeep,
                                    cursor: reordering ? "not-allowed" : "pointer",
                                    fontSize: 10.5, fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {reordering ? <Spinner /> : <FiShoppingCart size={10} />}
                                  Reorder
                                </motion.button>
                              )}
                            </div>
                          </div>

                          {/* Info strip */}
                          <div style={{
                            display: "flex", flexWrap: "wrap", gap: "4px 14px",
                            padding: "8px 12px", borderRadius: 10,
                            background: T.bg, border: `1px solid ${T.border}`,
                            fontSize: 10.5, color: T.inkSoft,
                          }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <FiMapPin size={8} aria-hidden="true" />
                              {order.shippingAddress?.city}, {order.shippingAddress?.zip}
                            </span>
                            <span aria-hidden>·</span>
                            <span style={{ color: order.shippingPrice === 0 ? T.tealDeep : T.inkSoft }}>
                              {order.shippingPrice === 0 ? "✓ Free Shipping" : `Shipping ₹${order.shippingPrice?.toFixed(0)}`}
                            </span>
                            {order.discount > 0 && (
                              <>
                                <span aria-hidden>·</span>
                                <span style={{ color: T.tealDeep, display: "flex", alignItems: "center", gap: 3 }}>
                                  <FiTag size={8} aria-hidden="true" /> Saved ₹{order.discount.toFixed(0)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ── Expand toggle ── */}
                        <div style={{ borderTop: `1px solid ${T.border}` }}>
                          <button
                            onClick={() => setExpandedOrder(expanded ? null : order._id)}
                            aria-expanded={expanded}
                            aria-controls={panelId}
                            className="lx-focus"
                            style={{
                              width: "100%", padding: "10px 20px",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              background: "transparent", border: "none", cursor: "pointer",
                              fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
                              textTransform: "uppercase", color: T.inkGhost,
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <FiShoppingBag size={10} aria-hidden="true" />
                              {order.items?.length} Item{order.items?.length !== 1 ? "s" : ""}
                            </span>
                            <motion.div
                              animate={{ rotate: expanded ? 180 : 0 }}
                              transition={{ duration: 0.24 }}
                              aria-hidden="true"
                            >
                              <FiChevronDown size={14} style={{ color: T.inkGhost }} />
                            </motion.div>
                          </button>

                          {/* ── Expandable panel ── */}
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                id={panelId}
                                role="region"
                                aria-label={`Items for order #${display}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ height: { duration: 0.35, ease: T.ease }, opacity: { duration: 0.22 } }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{ padding: "6px 14px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                                  {/* Item rows */}
                                  {order.items?.map((item, idx) => {
                                    const pid = item.productId
                                      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
                                      : item.product
                                        ? (typeof item.product === "object" ? item.product._id : item.product)
                                        : item._id;
                                    return (
                                      <ItemRow
                                        key={idx}
                                        item={item}
                                        index={idx}
                                        isFrequent={frequentIds.has(pid)}
                                      />
                                    );
                                  })}

                                  {/* Bill summary */}
                                  <div style={{
                                    display: "flex", flexWrap: "wrap", gap: "4px 16px",
                                    padding: "8px 14px", borderRadius: 10,
                                    background: T.bg, border: `1px solid ${T.border}`,
                                    fontSize: 10.5, color: T.inkSoft, marginTop: 2,
                                  }}>
                                    <span>Subtotal: <strong style={{ color: T.ink }}>₹{(order.itemsPrice||0).toFixed(2)}</strong></span>
                                    <span>Tax: <strong style={{ color: T.ink }}>₹{(order.taxPrice||0).toFixed(2)}</strong></span>
                                    <span>Ship: <strong style={{ color: order.shippingPrice === 0 ? T.tealDeep : T.ink }}>
                                      {order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice?.toFixed(0)}`}
                                    </strong></span>
                                    {order.discount > 0 && (
                                      <span style={{ color: T.tealDeep }}>
                                        Saved: <strong>₹{order.discount.toFixed(2)}</strong>
                                      </span>
                                    )}
                                  </div>

                                  {/* Action buttons */}
                                  <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 7, paddingBottom: 8, paddingTop: 2 }}>
                                    {/* Invoice */}
                                    <ActionBtn
                                      icon={<FiDownload size={10} />}
                                      label="Invoice"
                                      onClick={e => { e.stopPropagation(); generateInvoicePDF(order); }}
                                      variant="ghost"
                                    />

                                    {/* Report issue — delivered only */}
                                    {delivered && (
                                      <ActionBtn
                                        icon={<FiAlertCircle size={10} />}
                                        label="Report Issue"
                                        onClick={e => { e.stopPropagation(); setComplaintOrder(order); }}
                                        variant="danger"
                                      />
                                    )}

                                    {/* Per-item reviews */}
                                    {delivered && order.items?.map((item, idx) => {
                                      const existing = getUserReview(item, order.user);
                                      return (
                                        <ActionBtn
                                          key={idx}
                                          icon={<FiStar size={10} />}
                                          label={`${existing ? "Edit" : "Review"} ${item.name.split(" ")[0]}`}
                                          onClick={e => { e.stopPropagation(); openReviewModal(item, existing); }}
                                          variant={existing ? "primary" : "amber"}
                                        />
                                      );
                                    })}

                                    {/* Reorder all */}
                                    {canReorder && (
                                      <ActionBtn
                                        icon={reordering ? <Spinner /> : <FiRotateCcw size={10} />}
                                        label="Reorder All"
                                        onClick={e => handleReorder(order, e)}
                                        disabled={reordering}
                                        variant="primary"
                                      />
                                    )}

                                    {/* Details */}
                                    <motion.button
                                      whileHover={reduced ? {} : { x: 2 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => navigate(`/orders/${order._id}`)}
                                      className="lx-focus"
                                      style={{
                                        display: "flex", alignItems: "center", gap: 5,
                                        fontSize: 10.5, fontWeight: 600,
                                        padding: "7px 13px", borderRadius: 9,
                                        cursor: "pointer", color: T.surface,
                                        background: T.teal,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        boxShadow: T.shadowTeal,
                                      }}
                                    >
                                      Details & Tracking <FiChevronRight size={11} aria-hidden="true" />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.article>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ACTION BUTTON — small button variants used inside expanded cards
// ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, disabled = false, variant = "ghost" }) {
  const styles = {
    ghost:   { bg: T.surface,   color: T.inkMid,  border: T.border   },
    primary: { bg: T.tealGlow,  color: T.tealDeep, border: `${T.teal}33` },
    amber:   { bg: T.amberBg,   color: T.amber,   border: `${T.amber}33` },
    danger:  { bg: T.coralBg,   color: T.coral,   border: `${T.coral}33` },
  }[variant] || {};

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className="lx-focus"
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "7px 12px", borderRadius: 9,
        border: `1.5px solid ${styles.border}`,
        background: styles.bg, color: styles.color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 10.5, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {icon}
      {label}
    </motion.button>
  );
}