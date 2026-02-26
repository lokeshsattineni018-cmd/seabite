import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  FiClock, FiCheck, FiX, FiRefreshCcw, FiChevronRight,
  FiShoppingBag, FiStar, FiTag, FiTruck, FiChevronDown,
  FiMapPin, FiDownload, FiSearch, FiAlertCircle,
  FiShoppingCart, FiSliders, FiCopy, FiRotateCcw,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ReviewModal from "../../components/common/ReviewModal";
import PopupModal from "../../components/common/PopupModal";
import { generateInvoicePDF } from "../../utils/pdfGenerator";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F9F8",
  surface: "#ffffff",
  border: "#E2EEEC",
  textDark: "#1A2B35",
  textMid: "#4A6572",
  textLite: "#8BA5B3",
  primary: "#5BA8A0",
  primaryHover: "#4A9690",
  sky: "#89C2D9",
  coral: "#E8816A",
  coralText: "#C5573A",
  amber: "#C9941A",
  liveGreen: "#4CAF84",
  focusRing: "0 0 0 3px rgba(91,168,160,0.35)",
  radius: 16,
  radiusSm: 10,
};

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const TABS = ["All", "Active", "Delivered", "Cancelled"];

const SORTS = [
  { v: "newest",  l: "Newest First"   },
  { v: "oldest",  l: "Oldest First"   },
  { v: "highest", l: "Highest Amount" },
  { v: "lowest",  l: "Lowest Amount"  },
];

const EMOJIS = ["🐟", "🦐", "🦞", "🦀", "🐙", "🦑", "🐠"];

const COMPLAINT_ISSUES = [
  { v: "wrong_item",     l: "Wrong item delivered"     },
  { v: "poor_quality",   l: "Poor freshness / quality" },
  { v: "missing_items",  l: "Missing items from order" },
  { v: "damaged",        l: "Item damaged in transit"  },
  { v: "other",          l: "Other issue"              },
];

const TAB_EMPTY_STATES = {
  All:       { icon: "📦", title: "No orders yet",              sub: "Your order history will appear once you place your first order." },
  Active:    { icon: "🌊", title: "No active orders",           sub: "All quiet for now — browse our fresh catch and place an order!" },
  Delivered: { icon: "✅", title: "No delivered orders yet",    sub: "Delivered orders will show up here once they arrive." },
  Cancelled: { icon: "🎉", title: "No cancelled orders",        sub: "Great track record! None of your orders have been cancelled." },
};

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────
const getStatusConfig = (status) => {
  switch (status) {
    case "Delivered":
      return { bg: "rgba(91,168,160,0.10)", text: T.primary, icon: <FiCheck size={12} />, dot: T.primary, gradient: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, pulse: false };
    case "Cancelled":
    case "Cancelled by User":
      return { bg: "rgba(232,129,106,0.10)", text: T.coral, icon: <FiX size={12} />, dot: T.coral, gradient: `linear-gradient(90deg, ${T.coral}, transparent)`, pulse: false };
    case "Shipped":
      return { bg: "rgba(137,194,217,0.12)", text: T.sky, icon: <FiTruck size={12} />, dot: T.sky, gradient: `linear-gradient(90deg, #F59E0B, transparent)`, pulse: true };
    default:
      return { bg: "rgba(251,191,36,0.10)", text: T.amber, icon: <FiRefreshCcw size={12} />, dot: "#F59E0B", gradient: `linear-gradient(90deg, #F59E0B, transparent)`, pulse: true };
  }
};

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount || 0);

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const makeVariants = (reduced) => ({
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: reduced ? 0 : 0.06 } },
  },
  item: {
    hidden: { opacity: 0, y: reduced ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0.01 : 0.42, ease: [0.22, 1, 0.36, 1] } },
  },
});

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  @keyframes sb-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
    50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0);  }
  }
  @keyframes sb-live-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.55; transform: scale(1.35); }
  }
  @keyframes sb-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .sb-dot-pulse   { animation: sb-pulse 2s ease infinite; }
  .sb-live-dot    { animation: sb-live-pulse 1.8s ease infinite; }
  .sb-shimmer {
    background: linear-gradient(90deg, #EEF5F4 25%, #D8EDEB 50%, #EEF5F4 75%);
    background-size: 600px 100%;
    animation: sb-shimmer 1.4s infinite;
    border-radius: 8px;
  }
  .sb-focus:focus-visible { outline: none; box-shadow: ${T.focusRing}; }
  @media (max-width: 767px) {
    .orders-grid     { grid-template-columns: 1fr !important; }
    .orders-sidebar  { display: none !important; }
    .orders-mob-top  { display: flex !important; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("sb-order-styles")) {
  const tag = document.createElement("style");
  tag.id = "sb-order-styles";
  tag.textContent = GLOBAL_STYLE;
  document.head.appendChild(tag);
}

// ─────────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`, overflow: "hidden", padding: "18px" }}>
      <div style={{ height: 3, background: "#EEF5F4", marginBottom: 18, borderRadius: 2 }} />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div className="sb-shimmer" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="sb-shimmer" style={{ height: 13, width: "55%", borderRadius: 6 }} />
          <div className="sb-shimmer" style={{ height: 10, width: "35%", borderRadius: 6 }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="sb-shimmer" style={{ height: 8, width: 40, borderRadius: 4, marginBottom: 5, marginLeft: "auto" }} />
          <div className="sb-shimmer" style={{ height: 16, width: 72, borderRadius: 6 }} />
        </div>
      </div>
      <div className="sb-shimmer" style={{ height: 32, borderRadius: 9, width: "100%" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS DOT
// ─────────────────────────────────────────────────────────────
function StatusDot({ color, pulse }) {
  return (
    <span className={pulse ? "sb-dot-pulse" : ""}
      style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// ITEM ROW  (memoized)
// ─────────────────────────────────────────────────────────────
const ItemRow = React.memo(function ItemRow({ item, index, isFrequent }) {
  const realId =
    item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, background: "#F7FAFA", border: "1px solid #EEF5F4" }}>
      <Link to={`/products/${realId}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "rgba(91,168,160,0.10)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${T.border}` }}>
          {item.image ? (
            <img
              src={`${API_URL}/uploads/${item.image.replace("uploads/", "")}`}
              alt={item.name}
              width={32} height={32}
              loading="lazy" decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.onerror = null; e.target.src = "/placeholder-fish.svg"; }}
            />
          ) : (
            <span style={{ fontSize: 16 }} role="img" aria-label={item.name}>{EMOJIS[index % EMOJIS.length]}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <p title={item.name} style={{ fontWeight: 700, fontSize: 12, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.name}
            </p>
            {isFrequent && (
              <span style={{ fontSize: 9, fontWeight: 800, color: T.primaryHover, background: "rgba(91,168,160,0.12)", padding: "1px 5px", borderRadius: 5, whiteSpace: "nowrap", flexShrink: 0 }}>
                🔁 Regular
              </span>
            )}
          </div>
          <p style={{ fontSize: 10, color: T.textLite, margin: "1px 0 0" }}>{formatCurrency(item.price)} × {item.qty}</p>
        </div>
      </Link>
      <span style={{ fontSize: 12, fontWeight: 800, color: T.textDark, flexShrink: 0 }}>
        {formatCurrency(item.price * item.qty)}
      </span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// QUALITY COMPLAINT MODAL
// ─────────────────────────────────────────────────────────────
function QualityComplaintModal({ order, onClose, onSuccess }) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueType) { toast.error("Please select an issue type"); return; }
    setIsSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/orders/${order._id}/complaint`,
        { issueType, description },
        { withCredentials: true }
      );
      toast.success("Issue reported! We'll get back to you within 24 hours.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      role="dialog" aria-modal="true" aria-labelledby="complaint-modal-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(26,43,53,0.45)", backdropFilter: "blur(5px)" }}
      />
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", width: "100%", maxWidth: 440, background: "white", borderRadius: 22, padding: 28, boxShadow: "0 24px 48px rgba(26,43,53,0.14)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,129,106,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: T.coralText, flexShrink: 0 }}>
            <FiAlertCircle size={22} />
          </div>
          <div>
            <h3 id="complaint-modal-title" style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: T.textDark }}>
              Report an Issue
            </h3>
            <p style={{ margin: 0, color: T.textMid, fontSize: 13, lineHeight: 1.6 }}>
              Order #{order.orderId || order._id.slice(-6).toUpperCase()} · We'll respond within 24 hours
            </p>
          </div>
        </div>

        {/* Issue type */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.textLite, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            What went wrong?
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {COMPLAINT_ISSUES.map(issue => (
              <button key={issue.v} onClick={() => setIssueType(issue.v)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${issueType === issue.v ? T.coral : T.border}`,
                  background: issueType === issue.v ? "rgba(232,129,106,0.07)" : "white",
                  cursor: "pointer", fontSize: 13, fontWeight: issueType === issue.v ? 700 : 500,
                  color: issueType === issue.v ? T.coralText : T.textMid,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s", textAlign: "left",
                }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${issueType === issue.v ? T.coral : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {issueType === issue.v && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.coral, display: "block" }} />}
                </span>
                {issue.l}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.textLite, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Additional details (optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the issue in detail…"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`,
              fontSize: 13, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: T.textDark, resize: "vertical", boxSizing: "border-box",
              transition: "border-color 0.18s",
            }}
            onFocus={e => e.target.style.borderColor = T.coral}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#F7FAFA", cursor: "pointer", fontWeight: 600, fontSize: 13, color: T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cancel
          </button>
          <motion.button whileTap={!isSubmitting && issueType ? { scale: 0.97 } : {}}
            onClick={handleSubmit}
            disabled={isSubmitting || !issueType}
            style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              cursor: (!issueType || isSubmitting) ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: 13, color: "white",
              background: (!issueType || isSubmitting) ? "rgba(232,129,106,0.4)" : T.coral,
              fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.18s",
              display: "flex", alignItems: "center", gap: 8,
            }}>
            {isSubmitting ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }}
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
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      role="dialog" aria-modal="true">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(26,43,53,0.4)", backdropFilter: "blur(4px)" }}
      />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 40 }}
        style={{ position: "relative", width: "100%", maxWidth: 500, background: "white", borderRadius: "22px 22px 0 0", padding: "20px 20px 36px", boxShadow: "0 -8px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.border, margin: "0 auto 20px" }} />
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.textDark, margin: "0 0 14px" }}>Sort Orders</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SORTS.map(s => {
            const isSel = sortBy === s.v;
            return (
              <button key={s.v} onClick={() => { setSortBy(s.v); onClose(); }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${isSel ? T.primary : T.border}`,
                  background: isSel ? "rgba(91,168,160,0.07)" : "white",
                  fontSize: 14, fontWeight: isSel ? 700 : 500, color: isSel ? T.primaryHover : T.textMid,
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                {s.l}
                {isSel && <FiCheck size={14} style={{ color: T.primary }} />}
              </button>
            );
          })}
        </div>
      </motion.div>
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
  const [wsConnected,     setWsConnected]     = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");

  const navigate     = useNavigate();
  const searchRef    = useRef(null);
  const shouldReduce = useReducedMotion();
  const variants     = useMemo(() => makeVariants(shouldReduce), [shouldReduce]);

  // ── URL param sync ──────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "All";
  const sortBy    = searchParams.get("sort") || "newest";

  const setActiveTab = useCallback((tab) => {
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set("tab", tab); return p; });
  }, [setSearchParams]);

  const setSortBy = useCallback((sort) => {
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set("sort", sort); return p; });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSearchParams({});
  }, [setSearchParams]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // ── Fetch ───────────────────────────────────────────────────
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

  // ── ⌘K → focus search ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Frequently ordered product IDs ─────────────────────────
  const frequentProductIds = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
      (order.items || []).forEach(item => {
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

  // ── Filtered + sorted orders ────────────────────────────────
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (activeTab === "Active")
      result = result.filter(o => ["Pending", "Processing", "Shipped"].includes(o.status));
    else if (activeTab === "Delivered")
      result = result.filter(o => o.status === "Delivered");
    else if (activeTab === "Cancelled")
      result = result.filter(o => o.status?.includes("Cancelled"));

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(o =>
        String(o.orderId || o._id || "").toLowerCase().includes(q) ||
        (o.items || []).some(i => String(i.name || "").toLowerCase().includes(q))
      );
    }

    if (sortBy === "newest")  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest")  result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "highest") result.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    if (sortBy === "lowest")  result.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    return result;
  }, [orders, activeTab, debouncedSearch, sortBy]);

  const tabCounts = useMemo(() => ({
    All:       orders.length,
    Active:    orders.filter(o => ["Pending", "Processing", "Shipped"].includes(o.status)).length,
    Delivered: orders.filter(o => o.status === "Delivered").length,
    Cancelled: orders.filter(o => o.status?.includes("Cancelled")).length,
  }), [orders]);

  const totalSpent = useMemo(() =>
    orders.filter(o => !o.status?.includes("Cancelled")).reduce((s, o) => s + (o.totalAmount || 0), 0), [orders]);

  const totalSaved = useMemo(() =>
    orders.reduce((s, o) => s + (o.discount || 0), 0), [orders]);

  // ── Review helpers ──────────────────────────────────────────
  const getUserReview = useCallback((item, orderUserId) => {
    const productData = item.productId || item.product;
    if (!productData?.reviews) return null;
    return productData.reviews.find(r => {
      const rid = typeof r.user === "object" ? r.user._id : r.user;
      const uid = typeof orderUserId === "object" ? orderUserId._id : orderUserId;
      return rid?.toString() === uid?.toString();
    });
  }, []);

  const openReviewModal = useCallback((item, existingReview) => {
    const realId = item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;
    setSelectedProduct({ _id: realId, name: item.name });
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  }, []);

  // ── Copy order ID ───────────────────────────────────────────
  const copyOrderId = useCallback((orderId, displayId) => {
    navigator.clipboard.writeText(displayId).then(() => {
      toast.success(`Order ID copied!`, { icon: "📋", duration: 1800 });
    });
  }, []);

  // ── Reorder ─────────────────────────────────────────────────
  const handleReorder = useCallback(async (order, e) => {
    e?.stopPropagation();
    setReorderingId(order._id);
    try {
      // Add each item to cart; adjust endpoint to match your backend
      await Promise.all(
        order.items.map(item => {
          const productId = item.productId
            ? (typeof item.productId === "object" ? item.productId._id : item.productId)
            : item.product
              ? (typeof item.product === "object" ? item.product._id : item.product)
              : item._id;
          return axios.post(
            `${API_URL}/api/cart`,
            { productId, qty: item.qty },
            { withCredentials: true }
          );
        })
      );
      toast.success(`${order.items.length} item${order.items.length > 1 ? "s" : ""} added to cart!`, {
        icon: "🛒",
        style: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
      });
      navigate("/cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add items to cart");
    } finally {
      setReorderingId(null);
    }
  }, [navigate]);

  const isFiltered = activeTab !== "All" || searchQuery.trim() !== "" || sortBy !== "newest";

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "clip" }}>
      <div id="sr-live-region" role="status" aria-live="polite" aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
      />

      <PopupModal show={modalConfig.show} message={modalConfig.message} type={modalConfig.type}
        onClose={() => setModalConfig(c => ({ ...c, show: false }))} />

      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)}
        product={selectedProduct} existingReview={selectedReview}
        token={null} API_URL={API_URL}
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
          <MobileSortSheet sortBy={sortBy} setSortBy={setSortBy} onClose={() => setShowSortSheet(false)} />
        )}
      </AnimatePresence>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400, background: "linear-gradient(180deg, rgba(91,168,160,0.06) 0%, transparent 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "112px 20px 60px" }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: shouldReduce ? 0 : -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${T.primary}, ${T.sky})` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primaryHover, textTransform: "uppercase", letterSpacing: "0.16em" }}>My Account</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>Orders</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {wsConnected && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(76,207,132,0.10)", border: "1px solid rgba(76,207,132,0.2)" }}>
                  <span className="sb-live-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: T.liveGreen }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.liveGreen, letterSpacing: "0.06em" }}>LIVE</span>
                </div>
              )}
              {!loading && orders.length > 0 && (
                <span style={{ fontSize: 13, color: T.textLite, fontWeight: 500 }}>
                  <strong style={{ color: T.textDark }}>{orders.length}</strong> total orders
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── SKELETON LOADING STATE ──────────────────────────── */}
        {loading ? (
          <div className="orders-grid" style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 20, alignItems: "start" }}>
            {/* Sidebar skeleton */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[88, 120, 100].map((h, i) => (
                <div key={i} style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 16, height: h }}>
                  <div className="sb-shimmer" style={{ height: 8, width: "50%", borderRadius: 4, marginBottom: 12 }} />
                  {Array.from({ length: i === 0 ? 4 : 3 }).map((_, j) => (
                    <div key={j} className="sb-shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 8, width: `${70 + j * 5}%` }} />
                  ))}
                </div>
              ))}
            </div>
            {/* Cards skeleton */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="sb-shimmer" style={{ height: 42, borderRadius: 12 }} />
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : orders.length === 0 ? (
          // ── GLOBAL EMPTY STATE ────────────────────────────────
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: "0 2px 24px rgba(91,168,160,0.08)", padding: "72px 40px", textAlign: "center" }}>
            <motion.div animate={shouldReduce ? {} : { y: [0, -12, 0], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(91,168,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: T.primary }}>
              <FiShoppingBag size={30} />
            </motion.div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: T.textDark, marginBottom: 10 }}>No orders yet</h3>
            <p style={{ fontSize: 13.5, color: T.textLite, marginBottom: 32, maxWidth: 320, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Your order history will appear here once you make your first purchase from our fresh catch collection.
            </p>
            <motion.button whileHover={shouldReduce ? {} : { y: -2, boxShadow: "0 8px 28px rgba(91,168,160,0.25)" }}
              whileTap={{ scale: 0.97 }} onClick={() => navigate("/products")} className="sb-focus"
              style={{ padding: "13px 28px", borderRadius: 14, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          // ── TWO-COLUMN LAYOUT ─────────────────────────────────
          <div className="orders-grid" style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 20, alignItems: "start" }}>

            {/* ── MOBILE TOP BAR (hidden on desktop) ── */}
            <div className="orders-mob-top" style={{
              display: "none", gridColumn: "1 / -1", gap: 8, alignItems: "center", marginBottom: 4,
            }}>
              {/* Scrollable tab pills */}
              <div role="tablist" style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1, scrollbarWidth: "none", paddingBottom: 2 }}>
                {TABS.map(tab => {
                  const isActive = activeTab === tab;
                  const tabColor = tab === "Delivered" ? T.primary : tab === "Active" ? T.amber : tab === "Cancelled" ? T.coral : T.sky;
                  return (
                    <button key={tab} role="tab" aria-selected={isActive}
                      onClick={() => setActiveTab(tab)} className="sb-focus"
                      style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", background: isActive ? `${tabColor}18` : T.surface, color: isActive ? tabColor : T.textMid }}>
                      {tab} <span style={{ fontWeight: 800, opacity: 0.7 }}>{tabCounts[tab]}</span>
                    </button>
                  );
                })}
              </div>
              {/* Sort button */}
              <button onClick={() => setShowSortSheet(true)} className="sb-focus"
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, fontSize: 12, fontWeight: 600, color: T.textMid, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <FiSliders size={12} /> Sort
              </button>
            </div>

            {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
            <div className="orders-sidebar" style={{ position: "sticky", top: 100, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Overview card */}
              <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "16px 14px", boxShadow: "0 2px 12px rgba(91,168,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${T.primary}, ${T.sky})` }} />
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>Overview</p>
                </div>
                {[
                  { label: "Total Orders", value: tabCounts.All,              color: T.sky      },
                  { label: "Delivered",    value: tabCounts.Delivered,         color: T.primary  },
                  { label: "Active",       value: tabCounts.Active,            color: T.amber    },
                  { label: "Cancelled",    value: tabCounts.Cancelled,         color: T.coral    },
                  { label: "Total Spent",  value: formatCurrency(totalSpent),  color: T.textDark },
                  { label: "Total Saved",  value: formatCurrency(totalSaved),  color: T.primary  },
                ].map((row, i) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 7, marginBottom: 7, borderBottom: i < 5 ? "1px solid #F0F5F4" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: T.textLite, fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Filter card */}
              <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "16px 14px", boxShadow: "0 2px 12px rgba(91,168,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${T.coral}, #F4A58A)` }} />
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>Filter</p>
                </div>
                <div role="tablist" aria-label="Filter orders" style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                  {TABS.map(tab => {
                    const isActive = activeTab === tab;
                    const tabColor = tab === "Delivered" ? T.primary : tab === "Active" ? T.amber : tab === "Cancelled" ? T.coral : T.sky;
                    return (
                      <div key={tab} style={{ position: "relative" }}>
                        {isActive && (
                          <motion.div layoutId="filter-tab-bg"
                            style={{ position: "absolute", inset: 0, borderRadius: 8, background: `${tabColor}18` }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        <button role="tab" aria-selected={isActive} onClick={() => setActiveTab(tab)} className="sb-focus"
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 10px", border: "none", borderRadius: 8, background: "transparent", color: isActive ? tabColor : T.textMid, borderLeft: isActive ? `3px solid ${tabColor}` : "3px solid transparent", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "color 0.18s, border-color 0.18s", position: "relative", zIndex: 1 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {tab}
                            {tab === "Active" && wsConnected && tabCounts.Active > 0 && (
                              <span className="sb-live-dot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: T.liveGreen }} />
                            )}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 6, background: isActive ? `${tabColor}22` : "rgba(91,168,160,0.08)", color: isActive ? tabColor : T.textLite }}>
                            {tabCounts[tab]}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sort card */}
              <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "16px 14px", boxShadow: "0 2px 12px rgba(91,168,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${T.sky}, #AED8EC)` }} />
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>Sort</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {SORTS.map(s => {
                    const isSel = sortBy === s.v;
                    return (
                      <button key={s.v} onClick={() => setSortBy(s.v)} className="sb-focus"
                        style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "7px 10px", border: "none", borderRadius: 8, background: isSel ? "rgba(137,194,217,0.12)" : "transparent", color: isSel ? T.sky : T.textMid, fontSize: 11, fontWeight: isSel ? 700 : 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.18s", textAlign: "left" }}>
                        <motion.span animate={{ scale: isSel ? 1.2 : 1 }} transition={{ duration: 0.18 }}
                          style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, display: "inline-block", background: isSel ? T.sky : "transparent", border: isSel ? "none" : `1.5px solid ${T.border}` }}
                        />
                        {s.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────────────── */}
            <div>
              {/* Search */}
              <div style={{ position: "relative", marginBottom: 10 }}>
                <FiSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textLite, pointerEvents: "none" }} size={14} />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Search orders by ID or product name"
                  placeholder="Search by order ID or product name…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="sb-focus"
                  style={{ width: "100%", paddingLeft: 40, paddingRight: 60, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, fontSize: 13, fontWeight: 500, color: T.textDark, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box", boxShadow: "0 1px 6px rgba(91,168,160,0.05)", transition: "border-color 0.18s" }}
                  onFocus={e => e.target.style.borderColor = T.primary}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {!searchQuery && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: T.textLite, background: "#F7FAFA", border: `1px solid ${T.border}`, padding: "2px 6px", borderRadius: 5, letterSpacing: "0.04em", pointerEvents: "none" }}>⌘K</span>
                )}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                      onClick={() => setSearchQuery("")} aria-label="Clear search" className="sb-focus"
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer", background: T.border, color: T.textMid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      ×
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Status row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: T.textLite, fontWeight: 500 }}>
                  Showing <strong style={{ color: T.textDark }}>{filteredOrders.length}</strong> order{filteredOrders.length !== 1 ? "s" : ""}
                </span>
                {isFiltered && (
                  <button onClick={clearFilters} className="sb-focus"
                    style={{ fontSize: 11, fontWeight: 700, color: T.coralText, background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Clear filters ✕
                  </button>
                )}
              </div>

              {/* ── PER-TAB EMPTY STATE ── */}
              {filteredOrders.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: "center", padding: "60px 20px", background: T.surface, borderRadius: 18, border: `1px solid ${T.border}` }}
                  role="status" aria-live="polite">
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    {debouncedSearch ? "🔍" : TAB_EMPTY_STATES[activeTab]?.icon}
                  </div>
                  <p style={{ color: T.textDark, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
                    {debouncedSearch ? "No matching orders" : TAB_EMPTY_STATES[activeTab]?.title}
                  </p>
                  <p style={{ color: T.textLite, fontSize: 12, fontWeight: 500, maxWidth: 280, margin: "0 auto" }}>
                    {debouncedSearch ? `No orders match "${debouncedSearch}"` : TAB_EMPTY_STATES[activeTab]?.sub}
                  </p>
                </motion.div>
              ) : (
                // ── ORDER CARDS ───────────────────────────────────
                <motion.div variants={variants.container} initial="hidden" animate="visible"
                  style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                  {filteredOrders.map(order => {
                    const statusInfo  = getStatusConfig(order.status);
                    const isDelivered = order.status === "Delivered";
                    const isExpanded  = expandedOrder === order._id;
                    const cardId      = `order-items-${order._id}`;
                    const displayId   = order.orderId || order._id.slice(-6).toUpperCase();
                    const isReordering = reorderingId === order._id;

                    return (
                      <motion.div key={order._id} variants={variants.item} layout="position"
                        style={{ background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: "0 1px 8px rgba(91,168,160,0.06)", overflow: "hidden" }}
                        whileHover={shouldReduce ? {} : { boxShadow: "0 6px 28px rgba(91,168,160,0.12)", y: -1 }}
                        transition={{ y: { duration: 0.2 } }}>

                        {/* Status strip */}
                        <div style={{ height: 3, background: statusInfo.gradient }} aria-hidden="true" />

                        {/* Order Header */}
                        <div style={{ padding: "16px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: statusInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", color: statusInfo.text, flexShrink: 0 }}>
                                {statusInfo.icon}
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                  {/* Clickable order ID → copy */}
                                  <button
                                    onClick={() => copyOrderId(order._id, displayId)}
                                    title="Click to copy order ID"
                                    style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: T.textDark, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, borderRadius: 4 }}
                                    className="sb-focus">
                                    #{displayId}
                                    <FiCopy size={9} style={{ color: T.textLite }} />
                                  </button>
                                  <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 6, fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: statusInfo.bg, color: statusInfo.text }}>
                                    <StatusDot color={statusInfo.dot} pulse={statusInfo.pulse} />
                                    {order.status}
                                  </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.textLite }}>
                                  <FiClock size={9} aria-hidden="true" />
                                  <time dateTime={order.createdAt}>
                                    {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                  </time>
                                  <span aria-hidden="true">·</span>
                                  <span>{order.items?.length || 0} items</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: total + reorder quick action */}
                            <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                              <div>
                                <p style={{ fontSize: 8, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Total</p>
                                <p style={{ fontSize: 16, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "-0.02em" }}>{formatCurrency(order.totalAmount)}</p>
                              </div>
                              {/* Quick Reorder button visible on collapsed card */}
                              {(isDelivered || order.status?.includes("Cancelled")) && (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={e => handleReorder(order, e)}
                                  disabled={isReordering}
                                  className="sb-focus"
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", cursor: isReordering ? "not-allowed" : "pointer", fontSize: 10, fontWeight: 700, background: "rgba(91,168,160,0.12)", color: T.primaryHover, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {isReordering ? (
                                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                                      style={{ display: "inline-block", width: 10, height: 10, border: `1.5px solid rgba(74,150,144,0.3)`, borderTopColor: T.primary, borderRadius: "50%" }}
                                    />
                                  ) : <FiShoppingCart size={10} />}
                                  Reorder
                                </motion.button>
                              )}
                            </div>
                          </div>

                          {/* Info strip */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", padding: "8px 12px", borderRadius: 9, background: "#F7FAFA", border: "1px solid #EEF5F4", fontSize: 10, color: T.textLite, fontWeight: 500 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <FiMapPin size={8} aria-hidden="true" />{order.shippingAddress?.city}, {order.shippingAddress?.zip}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span style={{ color: order.shippingPrice === 0 ? T.primaryHover : T.textLite }}>
                              {order.shippingPrice === 0 ? "✓ Free Shipping" : `Shipping ₹${order.shippingPrice?.toFixed(0)}`}
                            </span>
                            {order.discount > 0 && (
                              <><span aria-hidden="true">·</span>
                              <span style={{ color: T.primaryHover, display: "flex", alignItems: "center", gap: 3 }}>
                                <FiTag size={8} aria-hidden="true" /> Saved ₹{order.discount.toFixed(0)}
                              </span></>
                            )}
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <div style={{ borderTop: `1px solid ${T.border}` }}>
                          <button onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                            aria-expanded={isExpanded} aria-controls={cardId} className="sb-focus"
                            style={{ width: "100%", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.textLite, background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <FiShoppingBag size={10} aria-hidden="true" />
                              {order.items?.length} Item{order.items?.length !== 1 ? "s" : ""}
                            </span>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }} aria-hidden="true">
                              <FiChevronDown size={14} style={{ color: T.textLite }} />
                            </motion.div>
                          </button>

                          {/* Expandable panel */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={cardId}
                                role="region"
                                aria-label={`Items for order #${displayId}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.25 } }}
                                style={{ overflow: "hidden" }}>
                                <div style={{ padding: "4px 14px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
                                  {order.items?.map((item, idx) => {
                                    const productId = item.productId
                                      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
                                      : item.product
                                        ? (typeof item.product === "object" ? item.product._id : item.product)
                                        : item._id;
                                    return (
                                      <ItemRow
                                        key={idx}
                                        item={item}
                                        index={idx}
                                        isFrequent={frequentProductIds.has(productId)}
                                      />
                                    );
                                  })}

                                  {/* Bill summary */}
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", padding: "8px 12px", borderRadius: 9, background: "#F7FAFA", border: "1px solid #EEF5F4", fontSize: 10, color: T.textLite, marginTop: 2 }}>
                                    <span>Subtotal: <strong style={{ color: T.textDark }}>₹{(order.itemsPrice || 0).toFixed(2)}</strong></span>
                                    <span>Tax: <strong style={{ color: T.textDark }}>₹{(order.taxPrice || 0).toFixed(2)}</strong></span>
                                    <span>Ship: <strong style={{ color: order.shippingPrice === 0 ? T.primaryHover : T.textDark }}>{order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice?.toFixed(0)}`}</strong></span>
                                    {order.discount > 0 && (
                                      <span style={{ color: T.primaryHover }}>Saved: <strong>₹{order.discount.toFixed(2)}</strong></span>
                                    )}
                                  </div>

                                  {/* Action buttons */}
                                  <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 6, paddingBottom: 6 }}>
                                    {/* Invoice */}
                                    <motion.button whileTap={{ scale: 0.96 }}
                                      onClick={e => { e.stopPropagation(); generateInvoicePDF(order); }}
                                      className="sb-focus"
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: `1px solid ${T.border}`, background: "white", color: T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                      <FiDownload size={10} aria-hidden="true" /> Invoice
                                    </motion.button>

                                    {/* Quality complaint — only for delivered */}
                                    {isDelivered && (
                                      <motion.button whileTap={{ scale: 0.96 }}
                                        onClick={e => { e.stopPropagation(); setComplaintOrder(order); }}
                                        className="sb-focus"
                                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: "none", background: "rgba(232,129,106,0.1)", color: T.coralText, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        <FiAlertCircle size={10} aria-hidden="true" /> Report Issue
                                      </motion.button>
                                    )}

                                    {/* Per-item reviews — only for delivered */}
                                    {isDelivered && order.items?.map((item, idx) => {
                                      const existingReview = getUserReview(item, order.user);
                                      return (
                                        <motion.button key={idx} whileTap={{ scale: 0.96 }}
                                          onClick={e => { e.stopPropagation(); openReviewModal(item, existingReview); }}
                                          className="sb-focus"
                                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: "none", background: existingReview ? "rgba(91,168,160,0.10)" : "rgba(201,148,26,0.10)", color: existingReview ? T.primaryHover : T.amber, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                          <FiStar size={10} aria-hidden="true" />
                                          {existingReview ? "Edit" : "Review"} {item.name.split(" ")[0]}
                                        </motion.button>
                                      );
                                    })}

                                    {/* Reorder */}
                                    {(isDelivered || order.status?.includes("Cancelled")) && (
                                      <motion.button whileTap={{ scale: 0.96 }}
                                        onClick={e => handleReorder(order, e)}
                                        disabled={isReordering}
                                        className="sb-focus"
                                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, cursor: isReordering ? "not-allowed" : "pointer", fontSize: 10, fontWeight: 700, border: "none", background: "rgba(91,168,160,0.12)", color: T.primaryHover, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                        {isReordering ? (
                                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                                            style={{ display: "inline-block", width: 10, height: 10, border: `1.5px solid rgba(74,150,144,0.3)`, borderTopColor: T.primary, borderRadius: "50%" }}
                                          />
                                        ) : <FiRotateCcw size={10} />}
                                        Reorder All
                                      </motion.button>
                                    )}

                                    {/* Details & Tracking */}
                                    <motion.button whileHover={shouldReduce ? {} : { x: 2 }} whileTap={{ scale: 0.97 }}
                                      onClick={() => navigate(`/orders/${order._id}`)} className="sb-focus"
                                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer", color: "#fff", background: T.primary, border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                      Details & Tracking <FiChevronRight size={11} aria-hidden="true" />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
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