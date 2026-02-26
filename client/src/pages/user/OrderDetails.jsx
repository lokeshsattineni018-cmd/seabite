import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiShoppingBag, FiTruck, FiCheckCircle, FiXCircle,
  FiDownload, FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS  (keep in sync with Order.jsx, or extract to
// src/constants/designTokens.js and import both)
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
  focusRing: "0 0 0 3px rgba(91,168,160,0.35)",
  radius: 16,
};

// ─────────────────────────────────────────────────────────────
// TRACKER STEPS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { status: "Pending",    label: "Order Placed", icon: <FiCheckCircle /> },
  { status: "Processing", label: "Processing",   icon: <FiPackage />     },
  { status: "Shipped",    label: "Shipped",       icon: <FiTruck />       },
  { status: "Delivered",  label: "Delivered",     icon: <FiMapPin />      },
];

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once — shared with Order.jsx if both
// pages can be open, the id guard prevents duplication)
// ─────────────────────────────────────────────────────────────
const DETAIL_STYLE = `
  .sb-focus:focus-visible {
    outline: none;
    box-shadow: ${T.focusRing};
  }
  @keyframes sb-step-pop {
    0%   { transform: scale(0.7);  opacity: 0; }
    60%  { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  .sb-step-pop { animation: sb-step-pop 0.4s cubic-bezier(0.22,1,0.36,1) forwards; }
`;

if (typeof document !== "undefined" && !document.getElementById("sb-detail-styles")) {
  const tag = document.createElement("style");
  tag.id = "sb-detail-styles";
  tag.textContent = DETAIL_STYLE;
  document.head.appendChild(tag);
}

// ─────────────────────────────────────────────────────────────
// ANIMATED ORDER TRACKER
// ─────────────────────────────────────────────────────────────
function OrderTracker({ currentStepIndex, reduced }) {
  const progressPct = Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100);

  return (
    <div
      role="list"
      aria-label="Order progress"
      style={{ display: "flex", justifyContent: "space-between", position: "relative", minWidth: 400 }}
    >
      {/* Track rail */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", top: 18, left: 20, right: 20, height: 3, background: "#EEF5F4", borderRadius: 3, zIndex: 0 }}
      />
      {/* Animated fill — springs in on mount */}
      <motion.div
        aria-hidden="true"
        initial={{ width: "0%" }}
        animate={{ width: `${progressPct}%` }}
        transition={reduced ? { duration: 0.01 } : { duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "absolute", top: 18, left: 20, height: 3, background: T.primary, borderRadius: 3, zIndex: 0 }}
      />

      {STEPS.map((step, idx) => {
        const isCompleted = idx <= currentStepIndex;
        const isCurrent   = idx === currentStepIndex;

        return (
          <div
            key={idx}
            role="listitem"
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`${step.label}${isCurrent ? " — current step" : isCompleted ? " — completed" : ""}`}
            style={{ position: "relative", zIndex: 1, textAlign: "center", width: 80 }}
          >
            {/* Step circle */}
            <motion.div
              initial={reduced ? {} : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduced ? {} : { duration: 0.4, delay: 0.15 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: isCompleted ? T.primary : T.surface,
                border: `3px solid ${isCompleted ? T.primary : "#EEF5F4"}`,
                color: isCompleted ? "#fff" : T.textLite,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 10px",
                boxShadow: isCurrent ? `0 0 0 4px rgba(91,168,160,0.18)` : "none",
                transition: "background 0.35s, border-color 0.35s, box-shadow 0.35s",
              }}
            >
              {step.icon}
            </motion.div>

            <p style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? T.textDark : T.textLite, margin: 0 }}>
              {step.label}
            </p>
            {isCurrent && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                style={{ fontSize: 10, color: T.primaryHover, margin: "2px 0 0", fontWeight: 600 }}
              >
                Current Step
              </motion.p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function OrderDetails() {
  const { orderId }  = useParams();
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason,    setCancelReason]    = useState("");
  const [isCancelling,    setIsCancelling]    = useState(false);

  const reduced = useReducedMotion();

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true });
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // ── WebSocket (Phase 2 — uncomment when backend is ready) ──
  /*
  useEffect(() => {
    if (!order?._id) return;
    import("socket.io-client").then(({ io }) => {
      const socket = io(API_URL, { withCredentials: true, transports: ["websocket"] });
      socket.on("order:update", (updated) => {
        if (updated._id === order._id) setOrder(prev => ({ ...prev, ...updated }));
      });
      return () => socket.disconnect();
    });
  }, [order?._id]);
  */

  // ── Escape closes modal ────────────────────────────────────
  useEffect(() => {
    if (!cancelModalOpen) return;
    const handler = (e) => { if (e.key === "Escape") setCancelModalOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [cancelModalOpen]);

  // ── Cancel handler — optimistic update ────────────────────
  const handleCancelOrder = useCallback(async () => {
    if (!cancelReason.trim()) {
      toast.error("Please select a reason for cancellation");
      return;
    }
    // 1. Optimistic update — feel instant
    setOrder(prev => ({ ...prev, status: "Cancelled by User", cancelReason }));
    setCancelModalOpen(false);
    setIsCancelling(true);

    try {
      const { data } = await axios.put(
        `${API_URL}/api/orders/${order._id}/cancel`,
        { reason: cancelReason },
        { withCredentials: true },
      );
      setOrder(data);                          // confirm with server truth
      toast.success("Order cancelled successfully");
    } catch (err) {
      // 2. Revert on failure
      setOrder(prev => ({ ...prev, status: "Pending", cancelReason: undefined }));
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
      setCancelReason("");
    }
  }, [cancelReason, order?._id]);

  // ── Guards ────────────────────────────────────────────────
  if (loading) return <SeaBiteLoader fullScreen />;

  if (!order) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg, gap: 16 }}>
      <h2 style={{ color: T.textDark, fontSize: 24, fontWeight: 700 }}>Order Not Found</h2>
      <Link to="/orders" style={{ color: T.primaryHover, fontWeight: 600, textDecoration: "none" }}>
        ← Back to Orders
      </Link>
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const isCancelled       = order.status.includes("Cancelled");
  const canCancel         = !isCancelled && ["Pending", "Processing", "Placed"].includes(order.status);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "100px 20px 60px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* ── HEADER ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 24 }}
        >
          <Link
            to="/orders"
            className="sb-focus"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.textLite, textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 16 }}
          >
            <FiArrowLeft aria-hidden="true" /> Back to Orders
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textDark, margin: 0 }}>
                Order #{order.orderId || order._id.slice(-6).toUpperCase()}
              </h1>
              <p style={{ fontSize: 13, color: T.textLite, marginTop: 4 }}>
                Placed on{" "}
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </p>
            </div>

            {/* Header action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {/* Invoice */}
              <motion.button
                onClick={() => generateInvoicePDF(order)}
                whileHover={reduced ? {} : { y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="sb-focus"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "white", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.textMid, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <FiDownload size={14} aria-hidden="true" /> Invoice
              </motion.button>

              {/* Cancel */}
              {canCancel && (
                <motion.button
                  onClick={() => setCancelModalOpen(true)}
                  whileHover={reduced ? {} : { y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="sb-focus"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(232,129,106,0.1)", border: "1px solid rgba(232,129,106,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.coralText, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <FiXCircle size={14} aria-hidden="true" /> Cancel Order
                </motion.button>
              )}

              {/* Status pill */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={order.status}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                  aria-label={`Order status: ${order.status}`}
                  style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    background: isCancelled ? "rgba(232,129,106,0.1)" : "rgba(91,168,160,0.1)",
                    color: isCancelled ? T.coralText : T.primaryHover,
                    display: "inline-flex", alignItems: "center",
                  }}
                >
                  {order.status}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── ORDER TRACKER ──────────────────────────────── */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: T.surface, padding: "30px 24px", borderRadius: 20, border: `1px solid ${T.border}`, marginBottom: 24, overflowX: "auto" }}
          >
            <OrderTracker currentStepIndex={currentStepIndex} reduced={reduced} />
          </motion.div>
        )}

        {/* ── CONTENT GRID ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}
        >

          {/* Items card */}
          <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, margin: "0 0 20px" }}>
              <FiShoppingBag aria-hidden="true" /> Items
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {order.items.map((item, i) => {
                const realId =
                  item.productId
                    ? (typeof item.productId === "object" ? item.productId._id : item.productId)
                    : item.product
                      ? (typeof item.product === "object" ? item.product._id : item.product)
                      : item._id;

                return (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <Link to={`/products/${realId}`} style={{ display: "flex", gap: 14, textDecoration: "none", flex: 1 }}>
                      <motion.img
                        whileHover={reduced ? {} : { scale: 1.05 }}
                        src={`${API_URL}/uploads/${item.image?.replace("uploads/", "")}`}
                        alt={item.name}
                        width={60} height={60}
                        loading="lazy"
                        decoding="async"
                        style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", background: "#F7FAFA", border: `1px solid ${T.border}`, flexShrink: 0 }}
                        onError={e => { e.target.onerror = null; e.target.src = "/placeholder-fish.svg"; }}
                      />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: T.textDark, margin: "0 0 4px" }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: T.textLite, margin: 0 }}>{item.qty} × ₹{item.price}</p>
                      </div>
                    </Link>
                    <div style={{ fontWeight: 700, color: T.textDark, flexShrink: 0, fontSize: 14 }}>
                      ₹{item.price * item.qty}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price breakdown */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Subtotal", value: `₹${order.itemsPrice}`,                    color: T.textMid  },
                { label: "Shipping", value: order.shippingPrice === 0 ? "Free" : `₹${order.shippingPrice}`, color: T.textMid },
                { label: "Tax",      value: `₹${order.taxPrice}`,                       color: T.textMid  },
                ...(order.discount > 0 ? [{ label: "Discount", value: `-₹${order.discount}`, color: T.primaryHover }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: row.color }}>
                  <span>{row.label}</span><span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: T.textDark, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <span>Total</span>
                <motion.span
                  key={order.totalAmount}
                  initial={{ scale: reduced ? 1 : 1.08 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  ₹{order.totalAmount}
                </motion.span>
              </div>
            </div>
          </div>

          {/* Right column: address + payment + cancel info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Delivery address */}
            <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
                <FiMapPin aria-hidden="true" /> Delivery Address
              </h2>
              <address style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, fontStyle: "normal" }}>
                <strong style={{ color: T.textDark }}>{order.shippingAddress?.fullName}</strong><br />
                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.zip}<br />
                <span style={{ color: T.textLite }}>📞</span> {order.shippingAddress?.phone}
              </address>
            </div>

            {/* Payment info */}
            <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
                <FiCreditCard aria-hidden="true" /> Payment Info
              </h2>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: T.textLite }}>Method</span>
                <span style={{ fontWeight: 600, color: T.textDark }}>{order.paymentMethod}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
                <span style={{ color: T.textLite }}>Status</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={String(order.isPaid)}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontWeight: 700,
                      color: order.isPaid ? T.primaryHover : T.amber,
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {order.isPaid && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        ✓
                      </motion.span>
                    )}
                    {order.isPaid ? "Paid" : "Pending"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Cancellation reason */}
            <AnimatePresence>
              {isCancelled && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  role="alert"
                  style={{ background: "rgba(232,129,106,0.05)", padding: 24, borderRadius: 20, border: "1px solid rgba(232,129,106,0.2)" }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.coralText, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
                    <FiAlertCircle aria-hidden="true" /> Order Cancelled
                  </h3>
                  <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, margin: 0 }}>
                    <span style={{ color: T.textLite, fontWeight: 600 }}>Reason: </span>
                    {order.cancelReason || "No reason provided."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      {/* ── CANCELLATION MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCancelModalOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(26,43,53,0.45)", backdropFilter: "blur(5px)" }}
            />

            {/* Panel */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", width: "100%", maxWidth: 420, background: "white", borderRadius: 22, padding: 28, boxShadow: "0 24px 48px rgba(26,43,53,0.14)" }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,129,106,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: T.coralText, flexShrink: 0 }}>
                  <FiAlertCircle size={22} aria-hidden="true" />
                </div>
                <div>
                  <h3 id="cancel-modal-title" style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: T.textDark }}>
                    Cancel Order?
                  </h3>
                  <p style={{ margin: 0, color: T.textMid, fontSize: 13, lineHeight: 1.6 }}>
                    This action cannot be undone. Please select a reason below.
                  </p>
                </div>
              </div>

              {/* Reason select */}
              <div style={{ marginBottom: 22 }}>
                <label
                  htmlFor="cancel-reason"
                  style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.textLite, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}
                >
                  Reason for cancellation
                </label>
                <select
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="sb-focus"
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 10,
                    border: `1px solid ${cancelReason ? T.primary : T.border}`,
                    fontSize: 14, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: T.textDark, background: "white",
                    transition: "border-color 0.2s",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select a reason…</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price">Found a better price</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Delivery time too long">Delivery time too long</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setCancelModalOpen(false); setCancelReason(""); }}
                  className="sb-focus"
                  style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#F7FAFA", cursor: "pointer", fontWeight: 600, fontSize: 13, color: T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Keep Order
                </motion.button>
                <motion.button
                  whileTap={cancelReason && !isCancelling ? { scale: 0.97 } : {}}
                  onClick={handleCancelOrder}
                  disabled={isCancelling || !cancelReason}
                  className="sb-focus"
                  style={{
                    padding: "10px 18px", borderRadius: 10, border: "none", cursor: (!cancelReason || isCancelling) ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: 13, color: "white",
                    background: (!cancelReason || isCancelling) ? "rgba(232,129,106,0.4)" : T.coral,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "background 0.18s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {isCancelling ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }}
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