import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiClock, FiPackage, FiMapPin, FiCheck, FiX, FiRefreshCcw, FiChevronRight,
  FiShoppingBag, FiStar, FiEdit2, FiTag, FiSearch, FiFilter, FiTruck, FiChevronDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ReviewModal from "../../components/common/ReviewModal";
import PopupModal from "../../components/common/PopupModal";

const API_URL = import.meta.env.VITE_API_URL || "";

// ── Design tokens ──
const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
  radius: 16, radiusSm: 10,
};

const getStatusConfig = (status) => {
  switch (status) {
    case "Delivered": return { bg: "rgba(91,168,160,0.10)", text: T.primary, icon: <FiCheck size={12} />, dot: T.primary };
    case "Cancelled":
    case "Cancelled by User": return { bg: "rgba(232,129,106,0.10)", text: T.coral, icon: <FiX size={12} />, dot: T.coral };
    case "Shipped": return { bg: "rgba(137,194,217,0.12)", text: T.sky, icon: <FiTruck size={12} />, dot: T.sky };
    default: return { bg: "rgba(251,191,36,0.10)", text: "#C9941A", icon: <FiRefreshCcw size={12} />, dot: "#F59E0B" };
  }
};

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(amount || 0);

const TABS = [
  { id: "all", label: "All Orders", icon: <FiPackage size={13} /> },
  { id: "active", label: "Active", icon: <FiTruck size={13} /> },
  { id: "delivered", label: "Delivered", icon: <FiCheck size={13} /> },
  { id: "cancelled", label: "Cancelled", icon: <FiX size={13} /> },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalConfig, setModalConfig] = useState({ show: false, message: "", type: "info" });
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
      setOrders(response.data);
    } catch (err) {
      if (err.response?.status === 401) setTimeout(() => navigate("/login"), 1000);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [navigate]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (activeTab === "active") result = result.filter(o => ["Pending", "Processing", "Shipped"].includes(o.status));
    else if (activeTab === "delivered") result = result.filter(o => o.status === "Delivered");
    else if (activeTab === "cancelled") result = result.filter(o => o.status?.includes("Cancelled"));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => String(o.orderId || o._id || "").toLowerCase().includes(q) ||
        (o.items || []).some(i => String(i.name || "").toLowerCase().includes(q)));
    }
    if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === "oldest") result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === "highest") result.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    else if (sortBy === "lowest") result.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    return result;
  }, [orders, activeTab, searchQuery, sortBy]);

  const tabCounts = useMemo(() => ({
    all: orders.length,
    active: orders.filter(o => ["Pending", "Processing", "Shipped"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    cancelled: orders.filter(o => o.status?.includes("Cancelled")).length,
  }), [orders]);

  const getUserReview = (item, orderUserId) => {
    const productData = item.productId || item.product;
    if (!productData?.reviews) return null;
    return productData.reviews.find(r => {
      const rid = typeof r.user === "object" ? r.user._id : r.user;
      const uid = typeof orderUserId === "object" ? orderUserId._id : orderUserId;
      return rid?.toString() === uid?.toString();
    });
  };

  const openReviewModal = (item, existingReview) => {
    const realId = item.productId ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product ? (typeof item.product === "object" ? item.product._id : item.product) : item._id;
    setSelectedProduct({ _id: realId, name: item.name });
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 44, height: 44, border: `3px solid ${T.border}`, borderTopColor: T.primary, borderRadius: "50%", marginBottom: 16 }} />
      <p style={{ color: T.textLite, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Loading your orders...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "hidden" }}>
      <PopupModal show={modalConfig.show} message={modalConfig.message} type={modalConfig.type} onClose={() => setModalConfig({ ...modalConfig, show: false })} />
      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} product={selectedProduct} existingReview={selectedReview} token={null} API_URL={API_URL} onSuccess={() => { setModalConfig({ show: true, message: "Review saved!", type: "success" }); fetchOrders(); }} />

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400, background: "linear-gradient(180deg, rgba(91,168,160,0.06) 0%, transparent 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "112px 20px 60px" }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${T.primary}, ${T.sky})` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.16em" }}>My Account</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: 38, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>Orders</h1>
            {orders.length > 0 && (
              <span style={{ fontSize: 13, color: T.textLite, fontWeight: 500 }}>
                <strong style={{ color: T.textDark }}>{orders.length}</strong> total orders
              </span>
            )}
          </div>
        </motion.div>

        {orders.length === 0 ? (
          /* ── EMPTY STATE ── */
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: "0 2px 24px rgba(91,168,160,0.08)", padding: "72px 40px", textAlign: "center" }}>
            <motion.div animate={{ y: [0, -12, 0], rotate: [0, 4, -4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(91,168,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: T.primary, boxShadow: "0 10px 25px rgba(91,168,160,0.15)" }}>
              <FiShoppingBag size={30} />
            </motion.div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: T.textDark, marginBottom: 10 }}>No orders yet</h3>
            <p style={{ fontSize: 13.5, color: T.textLite, marginBottom: 32, maxWidth: 320, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Your order history will appear here once you make your first purchase from our fresh catch collection.
            </p>
            <motion.button whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(91,168,160,0.25)" }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              style={{ padding: "13px 28px", borderRadius: 14, background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ── SEARCH + SORT ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                  <FiSearch size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.textLite }} />
                  <input
                    type="text" placeholder="Search by order ID or product name..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%", paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                      borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface,
                      fontSize: 13, fontWeight: 500, color: T.textDark, outline: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <FiFilter size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textLite, pointerEvents: "none" }} />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    style={{
                      paddingLeft: 36, paddingRight: 36, paddingTop: 12, paddingBottom: 12,
                      borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface,
                      fontSize: 13, fontWeight: 600, color: T.textDark, outline: "none", cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", appearance: "none",
                    }}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                  </select>
                  <FiChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.textLite, pointerEvents: "none" }} />
                </div>
              </div>
            </motion.div>

            {/* ── TABS ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700,
                      background: isActive ? T.primary : T.surface,
                      color: isActive ? "#fff" : T.textMid,
                      border: isActive ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                      boxShadow: isActive ? "0 4px 16px rgba(91,168,160,0.22)" : "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                    {tab.icon}{tab.label}
                    {tabCounts[tab.id] > 0 && (
                      <span style={{
                        padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 800,
                        background: isActive ? "rgba(255,255,255,0.22)" : "rgba(91,168,160,0.1)",
                        color: isActive ? "#fff" : T.primary,
                      }}>{tabCounts[tab.id]}</span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {filteredOrders.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: "center", padding: "60px 20px", background: T.surface, borderRadius: 18, border: `1px solid ${T.border}` }}>
                <FiSearch size={28} style={{ color: T.border, marginBottom: 12 }} />
                <p style={{ color: T.textLite, fontSize: 13, fontWeight: 500 }}>No orders match your criteria</p>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredOrders.map(order => {
                  const statusInfo = getStatusConfig(order.status);
                  const isDelivered = order.status === "Delivered";
                  const isExpanded = expandedOrder === order._id;

                  return (
                    <motion.div key={order._id} variants={itemVariants} layout
                      style={{
                        background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`,
                        boxShadow: "0 1px 8px rgba(91,168,160,0.06)", overflow: "hidden",
                        transition: "box-shadow 0.3s",
                      }}
                      whileHover={{ boxShadow: "0 6px 28px rgba(91,168,160,0.12)" }}
                    >
                      {/* Order Header */}
                      <div style={{ padding: "20px 24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: statusInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", color: statusInfo.text, flexShrink: 0 }}>
                              {statusInfo.icon}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: T.textDark }}>
                                  #{order.orderId || order._id.slice(-6).toUpperCase()}
                                </span>
                                <span style={{
                                  padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                                  background: statusInfo.bg, color: statusInfo.text,
                                }}>
                                  {order.status}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: T.textLite }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <FiClock size={10} />
                                  {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                <span>·</span>
                                <span>{order.items?.length || 0} items</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                              padding: "4px 10px", borderRadius: 7,
                              background: order.paymentMethod === "Prepaid" ? "rgba(91,168,160,0.1)" : "rgba(201,148,26,0.1)",
                              color: order.paymentMethod === "Prepaid" ? T.primary : "#C9941A",
                            }}>{order.paymentMethod || "COD"}</span>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: 9, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Total</p>
                              <p style={{ fontSize: 18, fontWeight: 800, color: T.textDark, margin: 0, letterSpacing: "-0.02em" }}>{formatCurrency(order.totalAmount)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Bill summary strip */}
                        <div style={{
                          display: "flex", flexWrap: "wrap", gap: "6px 20px",
                          padding: "10px 14px", borderRadius: 10,
                          background: "#F7FAFA", border: "1px solid #EEF5F4",
                          fontSize: 11, color: T.textLite, fontWeight: 500,
                        }}>
                          <span>Subtotal: <strong style={{ color: T.textDark }}>₹{(order.itemsPrice || 0).toFixed(2)}</strong></span>
                          {order.discount > 0 && <span style={{ color: T.primary, display: "flex", alignItems: "center", gap: 3 }}><FiTag size={9} /> Saved ₹{(order.discount || 0).toFixed(2)}</span>}
                          <span>Shipping: <strong style={{ color: order.shippingPrice === 0 ? T.primary : T.textDark }}>{order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice?.toFixed(2)}`}</strong></span>
                          <span>Tax: <strong style={{ color: T.textDark }}>₹{(order.taxPrice || 0).toFixed(2)}</strong></span>
                          <span>·</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><FiMapPin size={9} />{order.shippingAddress?.city}, {order.shippingAddress?.zip}</span>
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <div style={{ borderTop: `1px solid ${T.border}` }}>
                        <button onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                          style={{
                            width: "100%", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                            color: T.textLite, background: "transparent", border: "none", cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FiShoppingBag size={11} />{order.items.length} Item{order.items.length !== 1 ? "s" : ""} in this order</span>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                            <FiChevronDown size={15} style={{ color: T.textLite }} />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              transition={{ height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.25 } }}
                              style={{ overflow: "hidden" }}>
                              <div style={{ padding: "4px 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                                {order.items.map((item, idx) => {
                                  const myReview = getUserReview(item, order.user);
                                  return (
                                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                      style={{
                                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                                        borderRadius: 12, background: "#F7FAFA", border: "1px solid #EEF5F4",
                                      }}>
                                      <div style={{ position: "relative", flexShrink: 0 }}>
                                        <img
                                          src={`${API_URL}/uploads/${item.image?.replace(/^\/|\\/g, "").replace("uploads/", "")}`}
                                          alt={item.name} onError={e => { e.target.src = "https://via.placeholder.com/100?text=SeaBite"; }}
                                          style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 10, background: "#fff", border: `1px solid ${T.border}`, padding: 4 }}
                                        />
                                        <span style={{
                                          position: "absolute", top: -4, right: -4,
                                          background: T.primary, color: "#fff", fontSize: 8, fontWeight: 800,
                                          width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                          border: "2px solid #fff",
                                        }}>{item.qty}</span>
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: 13, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                        <p style={{ fontSize: 10, color: T.textLite, margin: "2px 0 0" }}>{formatCurrency(item.price)} × {item.qty}</p>
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                        {isDelivered && myReview && (
                                          <div style={{ display: "flex", color: "#F59E0B" }}>
                                            {[...Array(5)].map((_, i) => <FiStar key={i} size={10} fill={i < myReview.rating ? "currentColor" : "none"} />)}
                                          </div>
                                        )}
                                        {isDelivered && (
                                          <button onClick={e => { e.stopPropagation(); openReviewModal(item, myReview || null); }}
                                            style={{
                                              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                                              fontSize: 10, fontWeight: 700, border: "none",
                                              background: myReview ? "rgba(137,194,217,0.12)" : "rgba(245,158,11,0.1)",
                                              color: myReview ? T.sky : "#C9941A",
                                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            }}>
                                            {myReview ? <><FiEdit2 size={10} /> Edit</> : <><FiStar size={10} /> Review</>}
                                          </button>
                                        )}
                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.textDark }}>{formatCurrency(item.price * item.qty)}</span>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Footer */}
                      <div style={{ padding: "12px 24px", borderTop: `1px solid ${T.border}`, background: "#FAFCFC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: T.textLite, display: "flex", alignItems: "center", gap: 5 }}>
                          <FiMapPin size={10} />{order.shippingAddress?.fullName} – {order.shippingAddress?.city}
                        </span>
                        <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => navigate(`/orders/${order._id}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                            color: T.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                          Details & Tracking <FiChevronRight size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}