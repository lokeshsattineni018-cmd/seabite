import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiShoppingBag, FiTruck, FiCheck, FiClock, FiXCircle,
  FiDownload, FiAlertCircle, FiCopy, FiTag, FiPhone,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A", gold: "#D4A843",
};

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n || 0);
const FISH = ["🐟", "🦐", "🦞", "🦀", "🐙", "🦑", "🐠"];

const STEPS = [
  { status: "Pending", label: "Placed", icon: <FiCheck size={16} /> },
  { status: "Processing", label: "Processing", icon: <FiPackage size={16} /> },
  { status: "Shipped", label: "Shipped", icon: <FiTruck size={16} /> },
  { status: "Delivered", label: "Delivered", icon: <FiMapPin size={16} /> },
];

// ── Section Label ─────────────────────────────────────────────────────────
function SectionLabel({ children, color1 = T.primary, color2 = T.sky }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: `linear-gradient(135deg,${color1},${color2})` }} />
      <p style={{ fontSize: 9, fontWeight: 800, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.16em", margin: 0 }}>{children}</p>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────
function Card({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, boxShadow: "0 2px 16px rgba(91,168,160,0.06)", overflow: "hidden", ...style }}
    >
      {children}
    </motion.div>
  );
}

// ── Timeline step ─────────────────────────────────────────────────────────
function TimelineStep({ step, idx, currentIdx, total }) {
  const done = idx <= currentIdx;
  const isCurrent = idx === currentIdx;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", zIndex: 2 }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 + idx * 0.12, type: "spring", stiffness: 260, damping: 20 }}
        style={{
          width: 44, height: 44, borderRadius: "50%",
          background: done ? `linear-gradient(135deg,${T.primary},${T.sky})` : T.surface,
          border: done ? "none" : `2px solid ${T.border}`,
          color: done ? "#fff" : T.textLite,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isCurrent ? `0 6px 20px rgba(91,168,160,0.30)` : "none",
          marginBottom: 8,
        }}
      >
        {step.icon}
      </motion.div>
      <p style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? T.primary : done ? T.textMid : T.textLite, margin: "0 0 2px", textAlign: "center", lineHeight: 1.3 }}>{step.label}</p>
      {isCurrent && <span style={{ fontSize: 9, color: T.primary, fontWeight: 600 }}>Current</span>}
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────
function InfoRow({ label, value, color = T.textDark, icon }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: 12, color: T.textLite, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>{icon}{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

export default function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true })
      .then(({ data }) => setOrder(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { toast.error("Please provide a reason"); return; }
    setIsCancelling(true);
    try {
      const { data } = await axios.put(`${API_URL}/api/orders/${order._id}/cancel`, { reason: cancelReason }, { withCredentials: true });
      setOrder(data);
      setCancelModalOpen(false);
      toast.success("Order cancelled successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally { setIsCancelling(false); }
  };

  const copyId = () => {
    navigator.clipboard.writeText(order?.orderId || order?._id || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <SeaBiteLoader fullScreen />;

  if (!order) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg, gap: 14 }}>
      <FiPackage size={40} style={{ color: T.border }} />
      <h2 style={{ color: T.textDark, fontSize: 22, fontWeight: 700, margin: 0 }}>Order Not Found</h2>
      <Link to="/orders" style={{ color: T.primary, fontWeight: 600, textDecoration: "none", fontSize: 13 }}>← Back to Orders</Link>
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const isCancelled = order.status?.includes("Cancelled");
  const canCancel = !isCancelled && ["Pending", "Processing", "Placed"].includes(order.status);
  const displayId = order.orderId || order._id.slice(-6).toUpperCase();
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420, background: "linear-gradient(180deg, rgba(91,168,160,0.07) 0%, transparent 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "100px 20px 60px" }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 22 }}>
          <Link to="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.textLite, textDecoration: "none", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
            <FiArrowLeft size={13} /> Back to Orders
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            {/* Left: title + meta */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>Order #{displayId}</h1>
                <motion.button whileTap={{ scale: 0.86 }} onClick={copyId} style={{
                  background: copied ? "rgba(91,168,160,0.1)" : "#F4F9F8",
                  border: `1px solid ${copied ? T.primary : T.border}`,
                  borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 3,
                  fontSize: 10, fontWeight: 700, color: copied ? T.primary : T.textLite,
                  fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.2s",
                }}>
                  {copied ? <FiCheck size={9} /> : <FiCopy size={9} />}
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
                <span style={{
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                  padding: "4px 10px", borderRadius: 8,
                  background: isCancelled ? "rgba(232,129,106,0.1)" : "rgba(91,168,160,0.1)",
                  color: isCancelled ? T.coral : T.primary,
                }}>
                  {order.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.textLite }}>
                <FiClock size={10} /> {dateStr}
                <span style={{ opacity: 0.4 }}>·</span>
                {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Right: actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} onClick={() => generateInvoicePDF(order)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, fontWeight: 700, color: T.textMid, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                <FiDownload size={12} /> Invoice
              </motion.button>
              {canCancel && (
                <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} onClick={() => setCancelModalOpen(true)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", background: "rgba(232,129,106,0.08)", border: "1px solid rgba(232,129,106,0.2)", borderRadius: 10, fontSize: 11, fontWeight: 700, color: T.coral, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <FiXCircle size={12} /> Cancel
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── TRACKING TIMELINE ── */}
        {!isCancelled && (
          <Card delay={0.08} style={{ marginBottom: 16, padding: "24px 20px 28px" }}>
            <SectionLabel color1={T.sky} color2={T.primary}>Delivery Tracking</SectionLabel>
            <div style={{ position: "relative" }}>
              {/* Track line background */}
              <div style={{ position: "absolute", top: 22, left: "calc(12.5% + 8px)", right: "calc(12.5% + 8px)", height: 3, borderRadius: 3, background: T.border, zIndex: 0 }} />
              {/* Active progress */}
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: currentStepIndex >= 0 ? currentStepIndex / (STEPS.length - 1) : 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "absolute", top: 22, left: "calc(12.5% + 8px)", right: "calc(12.5% + 8px)", height: 3, borderRadius: 3, background: `linear-gradient(90deg,${T.primary},${T.sky})`, zIndex: 1, transformOrigin: "left" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {STEPS.map((step, idx) => (
                  <TimelineStep key={idx} step={step} idx={idx} currentIdx={currentStepIndex} total={STEPS.length} />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Cancelled info */}
        {isCancelled && (
          <Card delay={0.08} style={{ marginBottom: 16 }}>
            <div style={{ height: 3, background: `linear-gradient(90deg,${T.coral},transparent)` }} />
            <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(232,129,106,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: T.coral }}>
                <FiAlertCircle size={18} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.coral, margin: "0 0 4px" }}>Order Cancelled</p>
                <p style={{ fontSize: 12, color: T.textMid, margin: 0, lineHeight: 1.6 }}>Reason: {order.cancelReason || "No reason provided."}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── TWO COLUMN GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

          {/* ── LEFT: Items + Bill ── */}
          <Card delay={0.14} style={{ padding: "20px 22px" }}>
            <SectionLabel>Order Items</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {order.items?.map((item, idx) => {
                const realId = item.productId ? (typeof item.productId === "object" ? item.productId._id : item.productId) : item.product ? (typeof item.product === "object" ? item.product._id : item.product) : item._id;
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.06 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "#F7FAFA", border: "1px solid #EEF5F4" }}>
                    <Link to={`/products/${realId}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 12, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}`, background: "rgba(91,168,160,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {item.image ? (
                          <img src={`${API_URL}/uploads/${item.image.replace("uploads/", "")}`} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<span style="font-size:22px">${FISH[idx % FISH.length]}</span>`; }} />
                        ) : (
                          <span style={{ fontSize: 22 }}>{FISH[idx % FISH.length]}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: T.textDark, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: T.textLite, margin: 0 }}>Qty: {item.qty} × {fmt(item.price)}</p>
                      </div>
                    </Link>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark, flexShrink: 0 }}>{fmt(item.price * item.qty)}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Bill breakdown */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <InfoRow label="Subtotal" value={fmt(order.itemsPrice)} />
              <InfoRow label="Shipping" value={order.shippingPrice === 0 ? "FREE ✓" : fmt(order.shippingPrice)} color={order.shippingPrice === 0 ? T.primary : T.textDark} />
              <InfoRow label="Tax (GST)" value={fmt(order.taxPrice)} />
              {order.discount > 0 && <InfoRow label="Discount" value={`−${fmt(order.discount)}`} color={T.primary} icon={<FiTag size={9} />} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.textDark }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em" }}>{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* ── RIGHT: Info cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Delivery Address */}
            <Card delay={0.2} style={{ padding: "18px 20px" }}>
              <SectionLabel color1={T.coral} color2="#F4A58A">Delivery Address</SectionLabel>
              <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>
                <strong style={{ color: T.textDark, fontSize: 14 }}>{order.shippingAddress?.fullName}</strong><br />
                {order.shippingAddress?.houseNo && <>{order.shippingAddress.houseNo}, </>}
                {order.shippingAddress?.street && <>{order.shippingAddress.street}<br /></>}
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}
              </div>
              {order.shippingAddress?.phone && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, background: "#F7FAFA", border: `1px solid ${T.border}`, fontSize: 11, color: T.textMid }}>
                  <FiPhone size={10} style={{ color: T.primary }} /> {order.shippingAddress.phone}
                </div>
              )}
            </Card>

            {/* Payment */}
            <Card delay={0.26} style={{ padding: "18px 20px" }}>
              <SectionLabel color1={T.sky} color2={T.primary}>Payment</SectionLabel>
              <InfoRow label="Method" value={order.paymentMethod || "—"} />
              <InfoRow
                label="Status"
                value={order.isPaid ? "✓ Paid" : "Pending"}
                color={order.isPaid ? T.primary : T.gold}
              />
              {order.paidAt && (
                <InfoRow label="Paid On" value={new Date(order.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
              )}
            </Card>

            {/* Order Meta */}
            <Card delay={0.32} style={{ padding: "18px 20px" }}>
              <SectionLabel>Order Info</SectionLabel>
              <InfoRow label="Order Date" value={dateStr} icon={<FiClock size={9} />} />
              <InfoRow label="Items" value={order.items?.length || 0} icon={<FiShoppingBag size={9} />} />
              {order.deliveredAt && (
                <InfoRow label="Delivered" value={new Date(order.deliveredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} icon={<FiCheck size={9} />} />
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ── CANCEL MODAL ── */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCancelModalOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(26,43,53,0.45)", backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ position: "relative", width: "100%", maxWidth: 400, background: T.surface, borderRadius: 22, padding: "24px 24px 20px", boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(232,129,106,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: T.coral }}>
                  <FiXCircle size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.textDark }}>Cancel Order?</h3>
                  <p style={{ margin: 0, fontSize: 11, color: T.textLite }}>This action cannot be undone.</p>
                </div>
              </div>

              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: T.textLite, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.12em" }}>Reason</label>
              <select
                value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                style={{
                  width: "100%", padding: 11, borderRadius: 10, border: `1px solid ${T.border}`,
                  fontSize: 13, outline: "none", fontFamily: "'Plus Jakarta Sans',sans-serif",
                  color: cancelReason ? T.textDark : T.textLite, background: "#F7FAFA",
                  marginBottom: 18, boxSizing: "border-box",
                }}
              >
                <option value="">Select a reason…</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found a better price">Found a better price</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time too long">Delivery time too long</option>
                <option value="Other">Other</option>
              </select>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setCancelModalOpen(false)} style={{
                  padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`,
                  background: T.surface, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans',sans-serif", color: T.textMid,
                }}>
                  Close
                </button>
                <button onClick={handleCancelOrder} disabled={isCancelling || !cancelReason} style={{
                  padding: "10px 18px", borderRadius: 10, border: "none",
                  background: (!cancelReason || isCancelling) ? "rgba(232,129,106,0.3)" : T.coral,
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: (!cancelReason || isCancelling) ? "not-allowed" : "pointer",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  boxShadow: cancelReason ? "0 4px 14px rgba(232,129,106,0.25)" : "none",
                }}>
                  {isCancelling ? "Cancelling…" : "Confirm Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Responsive */}
      <style>{`
        @media (max-width: 760px) {
          div[style*="grid-template-columns: 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}