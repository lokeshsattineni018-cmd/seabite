import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FiClock, FiCheck, FiX, FiRefreshCcw, FiChevronRight,
  FiShoppingBag, FiStar, FiTag, FiTruck, FiChevronDown,
  FiMapPin, FiDownload, FiSearch, FiZap,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ReviewModal from "../../components/common/ReviewModal";
import PopupModal from "../../components/common/PopupModal";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS  (single source of truth — import from
// src/constants/designTokens.js once you extract it)
// ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F9F8",
  surface: "#ffffff",
  border: "#E2EEEC",
  textDark: "#1A2B35",
  textMid: "#4A6572",
  textLite: "#8BA5B3",
  primary: "#5BA8A0",
  primaryHover: "#4A9690",       // ← NEW: darker teal for text-on-white contrast
  sky: "#89C2D9",
  coral: "#E8816A",
  coralText: "#C5573A",          // ← NEW: darker coral for text-on-white contrast
  amber: "#C9941A",
  liveGreen: "#4CAF84",          // ← NEW: WebSocket live indicator
  focusRing: "0 0 0 3px rgba(91,168,160,0.35)", // ← NEW: A11y focus outline
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

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────
const getStatusConfig = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "rgba(91,168,160,0.10)", text: T.primary, icon: <FiCheck size={12} />,
        dot: T.primary, gradient: `linear-gradient(90deg, ${T.primary}, ${T.sky})`,
        pulse: false,
      };
    case "Cancelled":
    case "Cancelled by User":
      return {
        bg: "rgba(232,129,106,0.10)", text: T.coral, icon: <FiX size={12} />,
        dot: T.coral, gradient: `linear-gradient(90deg, ${T.coral}, transparent)`,
        pulse: false,
      };
    case "Shipped":
      return {
        bg: "rgba(137,194,217,0.12)", text: T.sky, icon: <FiTruck size={12} />,
        dot: T.sky, gradient: `linear-gradient(90deg, #F59E0B, transparent)`,
        pulse: true,   // ← live pulse for in-transit
      };
    default:
      return {
        bg: "rgba(251,191,36,0.10)", text: T.amber, icon: <FiRefreshCcw size={12} />,
        dot: "#F59E0B", gradient: `linear-gradient(90deg, #F59E0B, transparent)`,
        pulse: true,   // ← live pulse for pending/processing
      };
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

// Debounce hook — prevents useMemo firing on every keystroke
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────────────────────
// ANIMATION VARIANTS  (respects prefers-reduced-motion)
// ─────────────────────────────────────────────────────────────
const makeVariants = (reduced) => ({
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: reduced ? 0 : 0.06 } },
  },
  item: {
    hidden: { opacity: 0, y: reduced ? 0 : 18 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: reduced ? 0.01 : 0.42, ease: [0.22, 1, 0.36, 1] },
    },
  },
});

// ─────────────────────────────────────────────────────────────
// GLOBAL PULSE KEYFRAME  (injected once, CSS-only = no JS cost)
// ─────────────────────────────────────────────────────────────
const PULSE_STYLE = `
  @keyframes sb-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
    50%       { box-shadow: 0 0 0 6px rgba(245,158,11,0);  }
  }
  @keyframes sb-live-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.55; transform: scale(1.35); }
  }
  .sb-dot-pulse { animation: sb-pulse 2s ease infinite; }
  .sb-live-dot  { animation: sb-live-pulse 1.8s ease infinite; }

  /* Focus ring for keyboard nav */
  .sb-focus:focus-visible {
    outline: none;
    box-shadow: ${T.focusRing};
  }

  /* Responsive grid */
  @media (max-width: 767px) {
    .orders-grid     { grid-template-columns: 1fr !important; }
    .orders-sidebar  { display: none !important; }
    .orders-mob-tabs { display: flex !important; }
  }
`;

// Inject once
if (typeof document !== "undefined" && !document.getElementById("sb-styles")) {
  const tag = document.createElement("style");
  tag.id = "sb-styles";
  tag.textContent = PULSE_STYLE;
  document.head.appendChild(tag);
}

// ─────────────────────────────────────────────────────────────
// ITEM ROW  (memoized — avoids re-render when parent updates)
// ─────────────────────────────────────────────────────────────
const ItemRow = React.memo(function ItemRow({ item, index }) {
  const realId =
    item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
      borderRadius: 10, background: "#F7FAFA", border: "1px solid #EEF5F4",
    }}>
      <Link
        to={`/products/${realId}`}
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1, minWidth: 0 }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "rgba(91,168,160,0.10)", display: "flex", alignItems: "center",
          justifyContent: "center", overflow: "hidden", border: `1px solid ${T.border}`,
        }}>
          {item.image ? (
            <img
              src={`${API_URL}/uploads/${item.image.replace("uploads/", "")}`}
              alt={item.name}
              width={32} height={32}                        // ← explicit dims = no CLS
              loading="lazy"                                // ← lazy load
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.onerror = null; e.target.src = "/placeholder-fish.svg"; }}
            />
          ) : (
            <span style={{ fontSize: 16 }} role="img" aria-label={item.name}>
              {EMOJIS[index % EMOJIS.length]}
            </span>
          )}
        </div>

        {/* Name + price */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 12, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.name}
          </p>
          <p style={{ fontSize: 10, color: T.textLite, margin: "1px 0 0" }}>
            {formatCurrency(item.price)} × {item.qty}
          </p>
        </div>
      </Link>
      <span style={{ fontSize: 12, fontWeight: 800, color: T.textDark, flexShrink: 0 }}>
        {formatCurrency(item.price * item.qty)}
      </span>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// STATUS DOT  (pulses only for live statuses)
// ─────────────────────────────────────────────────────────────
function StatusDot({ color, pulse }) {
  return (
    <span
      className={pulse ? "sb-dot-pulse" : ""}
      style={{
        display: "inline-block",
        width: 7, height: 7, borderRadius: "50%",
        background: color, flexShrink: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Order() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [sortBy,        setSortBy]        = useState("newest");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isReviewOpen,  setIsReviewOpen]  = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview,  setSelectedReview]  = useState(null);
  const [modalConfig, setModalConfig] = useState({ show: false, message: "", type: "info" });
  const [wsConnected, setWsConnected] = useState(false); // ← live indicator state

  const navigate    = useNavigate();
  const searchRef   = useRef(null);
  const shouldReduce = useReducedMotion();          // ← A11y: reduced motion
  const variants    = useMemo(() => makeVariants(shouldReduce), [shouldReduce]);

  // Debounce search so useMemo doesn't fire every keystroke
  const debouncedSearch = useDebounce(searchQuery, 300);

  // ── Data fetch ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
      setOrders(response.data);
    } catch (err) {
      if (err.response?.status === 401) setTimeout(() => navigate("/login"), 1000);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── WebSocket (Phase 2 — uncomment when backend is ready) ───
  /*
  useEffect(() => {
    import("socket.io-client").then(({ io }) => {
      const socket = io(API_URL, { withCredentials: true, transports: ["websocket"] });
      socket.on("connect",       () => setWsConnected(true));
      socket.on("disconnect",    () => setWsConnected(false));
      socket.on("order:update",  (updated) => {
        setOrders(prev => prev.map(o => o._id === updated._id ? { ...o, ...updated } : o));
        // Announce to screen readers
        const liveEl = document.getElementById("sr-live-region");
        if (liveEl) liveEl.textContent = `Order #${updated.orderId} status changed to ${updated.status}`;
      });
      return () => socket.disconnect();
    });
  }, []);
  */

  // ── ⌘K / Ctrl+K → focus search ──────────────────────────────
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

  // ── Derived data (use debounced search for perf) ─────────────
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
    orders.filter(o => !o.status?.includes("Cancelled")).reduce((s, o) => s + (o.totalAmount || 0), 0),
  [orders]);

  const totalSaved = useMemo(() =>
    orders.reduce((s, o) => s + (o.discount || 0), 0),
  [orders]);

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
    const realId =
      item.productId
        ? (typeof item.productId === "object" ? item.productId._id : item.productId)
        : item.product
          ? (typeof item.product === "object" ? item.product._id : item.product)
          : item._id;
    setSelectedProduct({ _id: realId, name: item.name });
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  }, []);

  const isFiltered = activeTab !== "All" || searchQuery.trim() !== "" || sortBy !== "newest";

  const clearFilters = useCallback(() => {
    setActiveTab("All");
    setSearchQuery("");
    setSortBy("newest");
  }, []);

  if (loading) return <SeaBiteLoader fullScreen />;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "clip" }}>
      {/* ── A11y: Screen-reader live region for WS updates ── */}
      <div
        id="sr-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
      />

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

      {/* Ambient gradient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400, background: "linear-gradient(180deg, rgba(91,168,160,0.06) 0%, transparent 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "112px 20px 60px" }}>

        {/* ── HEADER ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduce ? 0 : -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 28 }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${T.primary}, ${T.sky})` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primaryHover, textTransform: "uppercase", letterSpacing: "0.16em" }}>
              My Account
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>
              Orders
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Live WebSocket indicator */}
              {wsConnected && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(76,207,132,0.10)", border: "1px solid rgba(76,207,132,0.2)" }}>
                  <span className="sb-live-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: T.liveGreen }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.liveGreen, letterSpacing: "0.06em" }}>LIVE</span>
                </div>
              )}
              {orders.length > 0 && (
                <span style={{ fontSize: 13, color: T.textLite, fontWeight: 500 }}>
                  <strong style={{ color: T.textDark }}>{orders.length}</strong> total orders
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {orders.length === 0 ? (
          // ── EMPTY STATE ────────────────────────────────────
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: "0 2px 24px rgba(91,168,160,0.08)", padding: "72px 40px", textAlign: "center" }}
          >
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -12, 0], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(91,168,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: T.primary, boxShadow: "0 10px 25px rgba(91,168,160,0.15)" }}
              aria-hidden="true"
            >
              <FiShoppingBag size={30} />
            </motion.div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: T.textDark, marginBottom: 10 }}>No orders yet</h3>
            <p style={{ fontSize: 13.5, color: T.textLite, marginBottom: 32, maxWidth: 320, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Your order history will appear here once you make your first purchase from our fresh catch collection.
            </p>
            <motion.button
              whileHover={shouldReduce ? {} : { y: -2, boxShadow: "0 8px 28px rgba(91,168,160,0.25)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="sb-focus"
              style={{ padding: "13px 28px", borderRadius: 14, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          // ── TWO-COLUMN LAYOUT ──────────────────────────────
          <div className="orders-grid" style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 20, alignItems: "start" }}>

            {/* ── MOBILE TAB BAR (hidden on desktop via CSS) ── */}
            <div
              className="orders-mob-tabs"
              role="tablist"
              aria-label="Filter orders"
              style={{
                display: "none",                   // shown at ≤767px via CSS
                gridColumn: "1 / -1",
                gap: 6, overflowX: "auto", paddingBottom: 4,
                scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
              }}
            >
              {TABS.map(tab => {
                const tabColor = tab === "Delivered" ? T.primary : tab === "Active" ? T.amber : tab === "Cancelled" ? T.coral : T.sky;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab)}
                    className="sb-focus"
                    style={{
                      flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
                      background: isActive ? `${tabColor}18` : T.surface,
                      color: isActive ? tabColor : T.textMid,
                      outline: "none",
                    }}
                  >
                    {tab} <span style={{ fontWeight: 800, opacity: 0.7 }}>{tabCounts[tab]}</span>
                  </button>
                );
              })}
            </div>

            {/* ── LEFT SIDEBAR ──────────────────────────────── */}
            <div
              className="orders-sidebar"
              style={{ position: "sticky", top: 100, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 14 }}
            >

              {/* Overview card */}
              <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "16px 14px", boxShadow: "0 2px 12px rgba(91,168,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${T.primary}, ${T.sky})` }} />
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>Overview</p>
                </div>
                {[
                  { label: "Total Orders", value: tabCounts.All,                  color: T.sky      },
                  { label: "Delivered",    value: tabCounts.Delivered,             color: T.primary  },
                  { label: "Active",       value: tabCounts.Active,                color: T.amber    },
                  { label: "Cancelled",    value: tabCounts.Cancelled,             color: T.coral    },
                  { label: "Total Spent",  value: formatCurrency(totalSpent),      color: T.textDark },
                  { label: "Total Saved",  value: formatCurrency(totalSaved),      color: T.primary  },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 7, marginBottom: 7, borderBottom: i < 5 ? "1px solid #F0F5F4" : "none" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: T.textLite, fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Filter card — roving tabIndex + sliding indicator */}
              <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "16px 14px", boxShadow: "0 2px 12px rgba(91,168,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg, ${T.coral}, #F4A58A)` }} />
                  <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.14em", margin: 0 }}>Filter</p>
                </div>

                <div role="tablist" aria-label="Filter orders" style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                  {TABS.map(tab => {
                    const isActive  = activeTab === tab;
                    const tabColor  = tab === "Delivered" ? T.primary : tab === "Active" ? T.amber : tab === "Cancelled" ? T.coral : T.sky;
                    return (
                      <div key={tab} style={{ position: "relative" }}>
                        {/* Sliding background — layoutId makes Framer animate between siblings */}
                        {isActive && (
                          <motion.div
                            layoutId="filter-tab-bg"
                            style={{ position: "absolute", inset: 0, borderRadius: 8, background: `${tabColor}18` }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        <button
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActiveTab(tab)}
                          className="sb-focus"
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            width: "100%", padding: "8px 10px", border: "none", borderRadius: 8,
                            background: "transparent",
                            color: isActive ? tabColor : T.textMid,
                            borderLeft: isActive ? `3px solid ${tabColor}` : "3px solid transparent",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            transition: "color 0.18s, border-color 0.18s",
                            position: "relative", zIndex: 1,
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {tab}
                            {/* Live dot on Active tab when connected */}
                            {tab === "Active" && wsConnected && tabCounts.Active > 0 && (
                              <span className="sb-live-dot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: T.liveGreen }} />
                            )}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 6,
                            background: isActive ? `${tabColor}22` : "rgba(91,168,160,0.08)",
                            color: isActive ? tabColor : T.textLite,
                          }}>
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
                      <button
                        key={s.v}
                        onClick={() => setSortBy(s.v)}
                        className="sb-focus"
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          width: "100%", padding: "7px 10px", border: "none", borderRadius: 8,
                          background: isSel ? "rgba(137,194,217,0.12)" : "transparent",
                          color: isSel ? T.sky : T.textMid,
                          fontSize: 11, fontWeight: isSel ? 700 : 500, cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          transition: "all 0.18s", textAlign: "left",
                        }}
                      >
                        <motion.span
                          animate={{ scale: isSel ? 1.2 : 1 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            width: 6, height: 6, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                            background: isSel ? T.sky : "transparent",
                            border: isSel ? "none" : `1.5px solid ${T.border}`,
                          }}
                        />
                        {s.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ──────────────────────────────── */}
            <div>

              {/* Search bar — ⌘K shortcut hint */}
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
                  style={{
                    width: "100%", paddingLeft: 40, paddingRight: 60, paddingTop: 11, paddingBottom: 11,
                    borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface,
                    fontSize: 13, fontWeight: 500, color: T.textDark, outline: "none",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
                    boxShadow: "0 1px 6px rgba(91,168,160,0.05)", transition: "border-color 0.18s",
                  }}
                  onFocus={e => e.target.style.borderColor = T.primary}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {/* ⌘K shortcut badge */}
                {!searchQuery && (
                  <span style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 9, fontWeight: 700, color: T.textLite,
                    background: "#F7FAFA", border: `1px solid ${T.border}`,
                    padding: "2px 6px", borderRadius: 5, letterSpacing: "0.04em",
                    pointerEvents: "none",
                  }}>
                    ⌘K
                  </span>
                )}
                {/* Clear button */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="sb-focus"
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: T.border, color: T.textMid, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 12,
                      }}
                    >
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
                  <button
                    onClick={clearFilters}
                    className="sb-focus"
                    style={{ fontSize: 11, fontWeight: 700, color: T.coralText, background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Clear filters ✕
                  </button>
                )}
              </div>

              {/* Empty search state */}
              {filteredOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: "center", padding: "60px 20px", background: T.surface, borderRadius: 18, border: `1px solid ${T.border}` }}
                  role="status"
                  aria-live="polite"
                >
                  <FiSearch size={28} style={{ color: T.border, marginBottom: 12 }} aria-hidden="true" />
                  <p style={{ color: T.textLite, fontSize: 13, fontWeight: 500 }}>No orders match your criteria</p>
                </motion.div>
              ) : (
                // ── ORDER CARDS LIST ─────────────────────────
                <motion.div
                  variants={variants.container}
                  initial="hidden"
                  animate="visible"
                  style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}
                >
                  {filteredOrders.map(order => {
                    const statusInfo = getStatusConfig(order.status);
                    const isDelivered = order.status === "Delivered";
                    const isExpanded  = expandedOrder === order._id;
                    const cardId      = `order-items-${order._id}`;

                    return (
                      <motion.div
                        key={order._id}
                        variants={variants.item}
                        layout="position"    // smooth reflow when filters change
                        style={{
                          background: T.surface, borderRadius: 18,
                          border: `1px solid ${T.border}`,
                          boxShadow: "0 1px 8px rgba(91,168,160,0.06)", overflow: "hidden",
                        }}
                        whileHover={shouldReduce ? {} : { boxShadow: "0 6px 28px rgba(91,168,160,0.12)", y: -1 }}
                        transition={{ y: { duration: 0.2 } }}
                      >
                        {/* Status gradient strip */}
                        <div style={{ height: 3, background: statusInfo.gradient }} aria-hidden="true" />

                        {/* Order Header */}
                        <div style={{ padding: "16px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{ width: 34, height: 34, borderRadius: 10, background: statusInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", color: statusInfo.text, flexShrink: 0 }}
                                aria-hidden="true"
                              >
                                {statusInfo.icon}
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                  <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: T.textDark }}>
                                    #{order.orderId || order._id.slice(-6).toUpperCase()}
                                  </span>
                                  <span
                                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 6, fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: statusInfo.bg, color: statusInfo.text }}
                                    aria-label={`Order status: ${order.status}`}
                                  >
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

                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <p style={{ fontSize: 8, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Total</p>
                              <p style={{ fontSize: 16, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "-0.02em" }}>
                                {formatCurrency(order.totalAmount)}
                              </p>
                            </div>
                          </div>

                          {/* Compact info strip */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", padding: "8px 12px", borderRadius: 9, background: "#F7FAFA", border: "1px solid #EEF5F4", fontSize: 10, color: T.textLite, fontWeight: 500 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <FiMapPin size={8} aria-hidden="true" />
                              {order.shippingAddress?.city}, {order.shippingAddress?.zip}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span style={{ color: order.shippingPrice === 0 ? T.primaryHover : T.textLite }}>
                              {order.shippingPrice === 0 ? "✓ Free Shipping" : `Shipping ₹${order.shippingPrice?.toFixed(0)}`}
                            </span>
                            {order.discount > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span style={{ color: T.primaryHover, display: "flex", alignItems: "center", gap: 3 }}>
                                  <FiTag size={8} aria-hidden="true" /> Saved ₹{order.discount.toFixed(0)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <div style={{ borderTop: `1px solid ${T.border}` }}>
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                            aria-expanded={isExpanded}
                            aria-controls={cardId}
                            className="sb-focus"
                            style={{
                              width: "100%", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                              color: T.textLite, background: "transparent", border: "none", cursor: "pointer",
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <FiShoppingBag size={10} aria-hidden="true" />
                              {order.items?.length} Item{order.items?.length !== 1 ? "s" : ""}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.25 }}
                              aria-hidden="true"
                            >
                              <FiChevronDown size={14} style={{ color: T.textLite }} />
                            </motion.div>
                          </button>

                          {/* Expandable panel */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={cardId}
                                role="region"
                                aria-label={`Items for order #${order.orderId || order._id.slice(-6).toUpperCase()}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  height:  { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                                  opacity: { duration: 0.25 },
                                }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{ padding: "4px 14px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
                                  {order.items?.map((item, idx) => (
                                    <ItemRow key={idx} item={item} index={idx} />
                                  ))}

                                  {/* Bill mini-summary */}
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", padding: "8px 12px", borderRadius: 9, background: "#F7FAFA", border: "1px solid #EEF5F4", fontSize: 10, color: T.textLite, marginTop: 2 }}>
                                    <span>Subtotal: <strong style={{ color: T.textDark }}>₹{(order.itemsPrice || 0).toFixed(2)}</strong></span>
                                    <span>Tax: <strong style={{ color: T.textDark }}>₹{(order.taxPrice || 0).toFixed(2)}</strong></span>
                                    <span>Ship: <strong style={{ color: order.shippingPrice === 0 ? T.primaryHover : T.textDark }}>
                                      {order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice?.toFixed(0)}`}
                                    </strong></span>
                                    {order.discount > 0 && (
                                      <span style={{ color: T.primaryHover }}>Saved: <strong>₹{order.discount.toFixed(2)}</strong></span>
                                    )}
                                  </div>

                                  {/* Action buttons */}
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingBottom: 6 }}>
                                    <motion.button
                                      whileTap={{ scale: 0.96 }}
                                      onClick={e => { e.stopPropagation(); generateInvoicePDF(order); }}
                                      className="sb-focus"
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: `1px solid ${T.border}`, background: "white", color: T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                    >
                                      <FiDownload size={10} aria-hidden="true" /> Invoice
                                    </motion.button>

                                    {isDelivered && (
                                      <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={e => { e.stopPropagation(); openReviewModal(order.items[0], getUserReview(order.items[0], order.user)); }}
                                        className="sb-focus"
                                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: "none", background: "rgba(201,148,26,0.10)", color: T.amber, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                      >
                                        <FiStar size={10} aria-hidden="true" /> Write Review
                                      </motion.button>
                                    )}

                                    <motion.button
                                      whileHover={shouldReduce ? {} : { x: 2 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => navigate(`/orders/${order._id}`)}
                                      className="sb-focus"
                                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer", color: "#fff", background: T.primary, border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                    >
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