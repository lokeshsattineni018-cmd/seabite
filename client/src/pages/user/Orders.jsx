import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  FiClock, FiCheck, FiX, FiRefreshCcw, FiChevronRight,
  FiShoppingBag, FiStar, FiTag, FiSearch, FiTruck, FiChevronDown,
  FiMapPin, FiDownload, FiFilter, FiPackage,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ReviewModal from "../../components/common/ReviewModal";
import PopupModal from "../../components/common/PopupModal";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// ── Desdign tokens ─────────────────────────────────────────────────────────
const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A", gold: "#D4A843",
};

const TABS = ["All", "Active", "Delivered", "Cancelled"];
const SORTS = [{ v: "newest", l: "Newest" }, { v: "oldest", l: "Oldest" }, { v: "highest", l: "High→Low" }, { v: "lowest", l: "Low→High" }];
const FISH = ["🐟", "🦐", "🦞", "🦀", "🐙", "🦑", "🐠"];

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n || 0);

function getStatus(status) {
  switch (status) {
    case "Delivered": return { color: T.primary, bg: "rgba(91,168,160,0.10)", icon: <FiCheck size={12} />, grad: `linear-gradient(90deg,${T.primary},${T.sky})` };
    case "Cancelled":
    case "Cancelled by User": return { color: T.coral, bg: "rgba(232,129,106,0.10)", icon: <FiX size={12} />, grad: `linear-gradient(90deg,${T.coral},transparent)` };
    case "Shipped": return { color: T.sky, bg: "rgba(137,194,217,0.12)", icon: <FiTruck size={12} />, grad: `linear-gradient(90deg,${T.sky},transparent)` };
    default: return { color: T.gold, bg: "rgba(212,168,67,0.10)", icon: <FiRefreshCcw size={12} />, grad: `linear-gradient(90deg,${T.gold},transparent)` };
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(91,168,160,0.12)" }}
      style={{
        flex: "1 1 0", minWidth: 100, background: T.surface, borderRadius: 16,
        border: `1px solid ${T.border}`, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 6,
        boxShadow: "0 1px 8px rgba(91,168,160,0.04)", transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.14em" }}>{label}</span>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
      </div>
      <span style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</span>
    </motion.div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────
function OrderCard({ order, expanded, onToggle, onReview, getUserReview }) {
  const s = getStatus(order.status);
  const isDelivered = order.status === "Delivered";
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: "0 1px 10px rgba(91,168,160,0.04)", overflow: "hidden" }}
      whileHover={{ boxShadow: "0 6px 28px rgba(91,168,160,0.10)" }}
    >
      <div style={{ height: 3, background: s.grad }} />

      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={onToggle}>
        {/* Status icon */}
        <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(s.icon, { size: 16 })}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: T.textDark }}>#{order.orderId || order._id.slice(-6).toUpperCase()}</span>
            <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 5, background: s.bg, color: s.color }}>{order.status}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textLite, flexWrap: "wrap" }}>
            <FiClock size={9} /> {dateStr}
            <span style={{ opacity: 0.4 }}>·</span>
            {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
            {order.shippingAddress?.city && (<><span style={{ opacity: 0.4 }}>·</span><FiMapPin size={9} /> {order.shippingAddress.city}</>)}
            {order.shippingPrice === 0 && (<><span style={{ opacity: 0.4 }}>·</span><span style={{ color: T.primary, fontWeight: 600 }}>Free Ship</span></>)}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 4 }}>
          <p style={{ fontSize: 7, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 2px" }}>Total</p>
          <p style={{ fontSize: 15, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "-0.03em" }}>{fmt(order.totalAmount)}</p>
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ color: T.textLite }}>
          <FiChevronDown size={16} />
        </motion.div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 18px" }}>
              {/* Items list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {order.items?.map((item, idx) => {
                  const realId = item.productId ? (typeof item.productId === "object" ? item.productId._id : item.productId) : item.product ? (typeof item.product === "object" ? item.product._id : item.product) : item._id;
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", borderRadius: 10, background: "#F7FAFA", border: "1px solid #EEF5F4" }}>
                      <Link to={`/products/${realId}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "rgba(91,168,160,0.08)", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          {item.image ? (
                            <img src={`${API_URL}/uploads/${item.image.replace("uploads/", "")}`} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style="font-size:15px">${FISH[idx % FISH.length]}</span>`; }} />
                          ) : (
                            <span style={{ fontSize: 15 }}>{FISH[idx % FISH.length]}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 12, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                          <p style={{ fontSize: 10, color: T.textLite, margin: "2px 0 0" }}>{fmt(item.price)} × {item.qty}</p>
                        </div>
                      </Link>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.textDark, flexShrink: 0 }}>{fmt(item.price * item.qty)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bill strip */}
              <div style={{ display: "flex", gap: 14, padding: "8px 12px", borderRadius: 10, background: "#F7FAFA", border: "1px solid #EEF5F4", fontSize: 10, color: T.textLite, marginBottom: 12, flexWrap: "wrap" }}>
                <span>Subtotal: <strong style={{ color: T.textDark }}>{fmt(order.itemsPrice)}</strong></span>
                <span>Tax: <strong style={{ color: T.textDark }}>{fmt(order.taxPrice)}</strong></span>
                <span>Ship: <strong style={{ color: order.shippingPrice === 0 ? T.primary : T.textDark }}>{order.shippingPrice === 0 ? "FREE" : fmt(order.shippingPrice)}</strong></span>
                {order.discount > 0 && <span style={{ color: T.primary }}>Saved: <strong>{fmt(order.discount)}</strong></span>}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button onClick={(e) => { e.stopPropagation(); generateInvoicePDF(order); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: `1px solid ${T.border}`, background: T.surface, color: T.textMid, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <FiDownload size={10} /> Invoice
                </button>
                {isDelivered && (
                  <button onClick={(e) => { e.stopPropagation(); onReview(order.items[0], getUserReview(order.items[0], order.user)); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: "none", background: "rgba(212,168,67,0.1)", color: T.gold, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    <FiStar size={10} /> Review
                  </button>
                )}
                <Link to={`/orders/${order._id}`} style={{ textDecoration: "none" }}>
                  <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.96 }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 700, border: "none", background: T.primary, color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 4px 14px rgba(91,168,160,0.22)" }}>
                    Details <FiChevronRight size={10} />
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────
export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalConfig, setModalConfig] = useState({ show: false, message: "", type: "info" });
  const [sortOpen, setSortOpen] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401) setTimeout(() => navigate("/login"), 1000);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchOrders(); }, [navigate]);

  const filteredOrders = useMemo(() => {
    let r = [...orders];
    if (activeTab === "Active") r = r.filter(o => ["Pending", "Processing", "Shipped"].includes(o.status));
    else if (activeTab === "Delivered") r = r.filter(o => o.status === "Delivered");
    else if (activeTab === "Cancelled") r = r.filter(o => o.status?.includes("Cancelled"));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(o => String(o.orderId || o._id || "").toLowerCase().includes(q) || (o.items || []).some(i => String(i.name || "").toLowerCase().includes(q)));
    }
    if (sortBy === "newest") r.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === "oldest") r.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === "highest") r.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    else if (sortBy === "lowest") r.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    return r;
  }, [orders, activeTab, searchQuery, sortBy]);

  const tabCounts = useMemo(() => ({
    All: orders.length,
    Active: orders.filter(o => ["Pending", "Processing", "Shipped"].includes(o.status)).length,
    Delivered: orders.filter(o => o.status === "Delivered").length,
    Cancelled: orders.filter(o => o.status?.includes("Cancelled")).length,
  }), [orders]);

  const totalSpent = useMemo(() => orders.filter(o => !o.status?.includes("Cancelled")).reduce((s, o) => s + (o.totalAmount || 0), 0), [orders]);
  const totalSaved = useMemo(() => orders.reduce((s, o) => s + (o.discount || 0), 0), [orders]);

  const getUserReview = (item, orderUserId) => {
    const pd = item.productId || item.product;
    if (!pd?.reviews) return null;
    return pd.reviews.find(r => { const rid = typeof r.user === "object" ? r.user._id : r.user; const uid = typeof orderUserId === "object" ? orderUserId._id : orderUserId; return rid?.toString() === uid?.toString(); });
  };

  const openReviewModal = (item, existingReview) => {
    const realId = item.productId ? (typeof item.productId === "object" ? item.productId._id : item.productId) : item.product ? (typeof item.product === "object" ? item.product._id : item.product) : item._id;
    setSelectedProduct({ _id: realId, name: item.name });
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  };

  if (loading) return <SeaBiteLoader fullScreen />;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "clip" }}>
      <PopupModal show={modalConfig.show} message={modalConfig.message} type={modalConfig.type} onClose={() => setModalConfig({ ...modalConfig, show: false })} />
      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} product={selectedProduct} existingReview={selectedReview} token={null} API_URL={API_URL} onSuccess={() => { setModalConfig({ show: true, message: "Review saved!", type: "success" }); fetchOrders(); }} />

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400, background: "linear-gradient(180deg, rgba(91,168,160,0.06) 0%, transparent 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "100px 20px 60px" }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${T.primary}, ${T.sky})` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.16em" }}>My Account</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>Orders</h1>
            {orders.length > 0 && <span style={{ fontSize: 12, color: T.textLite, fontWeight: 500 }}><strong style={{ color: T.textDark }}>{orders.length}</strong> total orders</span>}
          </div>
        </motion.div>

        {orders.length === 0 ? (
          /* ── EMPTY STATE ── */
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ background: T.surface, borderRadius: 22, border: `1px solid ${T.border}`, boxShadow: "0 2px 20px rgba(91,168,160,0.07)", padding: "64px 32px", textAlign: "center" }}>
            <motion.div animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(91,168,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: T.primary, boxShadow: "0 10px 24px rgba(91,168,160,0.15)" }}>
              <FiShoppingBag size={26} />
            </motion.div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: T.textDark, marginBottom: 8 }}>No orders yet</h3>
            <p style={{ fontSize: 13, color: T.textLite, marginBottom: 28, maxWidth: 300, margin: "0 auto 28px", lineHeight: 1.7 }}>Your order history will appear here once you make your first purchase.</p>
            <motion.button whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(91,168,160,0.25)" }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              style={{ padding: "12px 26px", borderRadius: 14, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ── STAT CARDS ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}
              style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <StatCard label="Total Orders" value={tabCounts.All} color={T.textDark} icon={<FiPackage size={12} />} />
              <StatCard label="Delivered" value={tabCounts.Delivered} color={T.primary} icon={<FiCheck size={12} />} />
              <StatCard label="Active" value={tabCounts.Active} color={T.gold} icon={<FiTruck size={12} />} />
              <StatCard label="Total Spent" value={fmt(totalSpent)} color={T.textDark} icon={<FiTag size={12} />} />
              {totalSaved > 0 && <StatCard label="Saved" value={fmt(totalSaved)} color={T.primary} icon={<FiTag size={12} />} />}
            </motion.div>

            {/* ── FILTERS BAR ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }}
              style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: "10px 14px", marginBottom: 16, boxShadow: "0 1px 8px rgba(91,168,160,0.04)" }}>

              {/* Tabs row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {TABS.map(tab => {
                  const active = activeTab === tab;
                  const c = tab === "Delivered" ? T.primary : tab === "Active" ? T.gold : tab === "Cancelled" ? T.coral : T.sky;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      padding: "6px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: active ? `${c}16` : "transparent",
                      color: active ? c : T.textLite,
                      fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif",
                      transition: "all 0.18s", display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {tab}
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 5, background: active ? `${c}22` : "rgba(0,0,0,0.04)", color: active ? c : T.textLite }}>{tabCounts[tab]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search + Sort row */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <FiSearch size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.textLite }} />
                  <input
                    type="text" placeholder="Search orders…"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%", paddingLeft: 32, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                      borderRadius: 10, border: `1px solid ${T.border}`, background: "#F7FAFA",
                      fontSize: 12, fontWeight: 500, color: T.textDark, outline: "none",
                      fontFamily: "'Plus Jakarta Sans',sans-serif", boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Sort dropdown */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => setSortOpen(!sortOpen)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
                    background: "#F7FAFA", fontSize: 11, fontWeight: 600, color: T.textMid,
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}>
                    <FiFilter size={11} /> {SORTS.find(s => s.v === sortBy)?.l}
                    <FiChevronDown size={11} />
                  </button>
                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: "absolute", right: 0, top: "110%", zIndex: 50, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden", minWidth: 140 }}>
                        {SORTS.map(s => (
                          <button key={s.v} onClick={() => { setSortBy(s.v); setSortOpen(false); }} style={{
                            display: "block", width: "100%", padding: "9px 14px", border: "none",
                            background: sortBy === s.v ? "rgba(91,168,160,0.06)" : "transparent",
                            color: sortBy === s.v ? T.primary : T.textMid,
                            fontSize: 11, fontWeight: sortBy === s.v ? 700 : 500, cursor: "pointer",
                            textAlign: "left", fontFamily: "'Plus Jakarta Sans',sans-serif",
                            transition: "background 0.12s",
                          }}>
                            {s.l}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clear */}
                {(activeTab !== "All" || searchQuery || sortBy !== "newest") && (
                  <button onClick={() => { setActiveTab("All"); setSearchQuery(""); setSortBy("newest"); }}
                    style={{ fontSize: 10, fontWeight: 700, color: T.coral, background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: "nowrap" }}>
                    Clear ✕
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── RESULTS STATUS ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
              <span style={{ fontSize: 11, color: T.textLite, fontWeight: 500 }}>
                Showing <strong style={{ color: T.textDark }}>{filteredOrders.length}</strong> order{filteredOrders.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── ORDER LIST ── */}
            {filteredOrders.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: "center", padding: "50px 20px", background: T.surface, borderRadius: 18, border: `1px solid ${T.border}` }}>
                <FiSearch size={24} style={{ color: T.border, marginBottom: 10 }} />
                <p style={{ color: T.textLite, fontSize: 13, fontWeight: 500 }}>No orders match your criteria</p>
              </motion.div>
            ) : (
              <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    expanded={expandedOrder === order._id}
                    onToggle={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    onReview={openReviewModal}
                    getUserReview={getUserReview}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 600px) {
          .orders-stat-row { flex-wrap: wrap !important; }
        }
      `}</style>
    </div>
  );
}