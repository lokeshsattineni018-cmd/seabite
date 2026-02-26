import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCreditCard,
  FiShoppingBag, FiTruck, FiCheckCircle, FiXCircle,
  FiDownload, FiAlertCircle, FiExternalLink, FiRotateCcw,
  FiStar, FiShoppingCart, FiCalendar,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import ReviewModal from "../../components/common/ReviewModal";
import toast from "react-hot-toast";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

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

// Typical delivery window in days — adjust as needed
const DELIVERY_DAYS = 3;

// ─────────────────────────────────────────────────────────────
// COMPLAINT ISSUES
// ─────────────────────────────────────────────────────────────
const COMPLAINT_ISSUES = [
  { v: "wrong_item",    l: "Wrong item delivered"     },
  { v: "poor_quality",  l: "Poor freshness / quality" },
  { v: "missing_items", l: "Missing items from order" },
  { v: "damaged",       l: "Item damaged in transit"  },
  { v: "other",         l: "Other issue"              },
];

// ─────────────────────────────────────────────────────────────
// PAYMENT METHOD ICON
// ─────────────────────────────────────────────────────────────
function PaymentIcon({ method }) {
  const m = (method || "").toLowerCase();
  if (m.includes("upi") || m.includes("gpay") || m.includes("phonepe"))
    return <span style={{ fontSize: 15 }}>📱</span>;
  if (m.includes("cod") || m.includes("cash"))
    return <span style={{ fontSize: 15 }}>💵</span>;
  if (m.includes("card") || m.includes("credit") || m.includes("debit"))
    return <span style={{ fontSize: 15 }}>💳</span>;
  if (m.includes("net") || m.includes("bank"))
    return <span style={{ fontSize: 15 }}>🏦</span>;
  if (m.includes("wallet") || m.includes("paytm"))
    return <span style={{ fontSize: 15 }}>👛</span>;
  return <span style={{ fontSize: 15 }}>💳</span>;
}

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const DETAIL_STYLE = `
  .sb-focus:focus-visible { outline: none; box-shadow: ${T.focusRing}; }
  @keyframes sb-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .sb-img-shimmer {
    background: linear-gradient(90deg, #EEF5F4 25%, #D8EDEB 50%, #EEF5F4 75%);
    background-size: 600px 100%;
    animation: sb-shimmer 1.4s infinite;
  }
  /* Vertical tracker on mobile */
  @media (max-width: 520px) {
    .sb-tracker-h { display: none !important; }
    .sb-tracker-v { display: flex !important; }
  }
  /* Sticky header scroll behaviour */
  .sb-sticky-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
`;

if (typeof document !== "undefined" && !document.getElementById("sb-detail-styles")) {
  const tag = document.createElement("style");
  tag.id = "sb-detail-styles";
  tag.textContent = DETAIL_STYLE;
  document.head.appendChild(tag);
}

// ─────────────────────────────────────────────────────────────
// SHIMMER IMAGE
// ─────────────────────────────────────────────────────────────
function ShimmerImage({ src, alt, style }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: "relative", ...style }}>
      {!loaded && (
        <div className="sb-img-shimmer" style={{ position: "absolute", inset: 0, borderRadius: style?.borderRadius || 12 }} />
      )}
      <img
        src={src} alt={alt}
        loading="lazy" decoding="async"
        onLoad={() => setLoaded(true)}
        onError={e => { e.target.onerror = null; e.target.src = "/placeholder-fish.svg"; setLoaded(true); }}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: "opacity 0.25s" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HORIZONTAL TRACKER
// ─────────────────────────────────────────────────────────────
function HorizontalTracker({ currentStepIndex, reduced }) {
  const progressPct = Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100);
  return (
    <div role="list" aria-label="Order progress"
      style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
      <div aria-hidden="true"
        style={{ position: "absolute", top: 18, left: 20, right: 20, height: 3, background: "#EEF5F4", borderRadius: 3, zIndex: 0 }}
      />
      <motion.div aria-hidden="true"
        initial={{ width: "0%" }}
        animate={{ width: `${progressPct}%` }}
        transition={reduced ? { duration: 0.01 } : { duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "absolute", top: 18, left: 20, height: 3, background: T.primary, borderRadius: 3, zIndex: 0 }}
      />
      {STEPS.map((step, idx) => {
        const isCompleted = idx <= currentStepIndex;
        const isCurrent   = idx === currentStepIndex;
        return (
          <div key={idx} role="listitem"
            aria-current={isCurrent ? "step" : undefined}
            style={{ position: "relative", zIndex: 1, textAlign: "center", width: 80 }}>
            <motion.div
              initial={reduced ? {} : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduced ? {} : { duration: 0.4, delay: 0.15 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 40, height: 40, borderRadius: "50%", background: isCompleted ? T.primary : T.surface, border: `3px solid ${isCompleted ? T.primary : "#EEF5F4"}`, color: isCompleted ? "#fff" : T.textLite, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", boxShadow: isCurrent ? `0 0 0 4px rgba(91,168,160,0.18)` : "none", transition: "background 0.35s, border-color 0.35s" }}>
              {step.icon}
            </motion.div>
            <p style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? T.textDark : T.textLite, margin: 0 }}>{step.label}</p>
            {isCurrent && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.3 }}
                style={{ fontSize: 10, color: T.primaryHover, margin: "2px 0 0", fontWeight: 600 }}>
                Current
              </motion.p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VERTICAL TRACKER (mobile)
// ─────────────────────────────────────────────────────────────
function VerticalTracker({ currentStepIndex, reduced }) {
  return (
    <div role="list" aria-label="Order progress" style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 4 }}>
      {STEPS.map((step, idx) => {
        const isCompleted = idx <= currentStepIndex;
        const isCurrent   = idx === currentStepIndex;
        const isLast      = idx === STEPS.length - 1;
        return (
          <div key={idx} role="listitem" aria-current={isCurrent ? "step" : undefined}
            style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* Left: circle + line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <motion.div
                initial={reduced ? {} : { scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={reduced ? {} : { duration: 0.4, delay: 0.15 + idx * 0.1 }}
                style={{ width: 34, height: 34, borderRadius: "50%", background: isCompleted ? T.primary : T.surface, border: `3px solid ${isCompleted ? T.primary : "#EEF5F4"}`, color: isCompleted ? "#fff" : T.textLite, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isCurrent ? `0 0 0 4px rgba(91,168,160,0.18)` : "none", transition: "all 0.35s", flexShrink: 0 }}>
                {step.icon}
              </motion.div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 28, background: isCompleted ? T.primary : "#EEF5F4", borderRadius: 2, marginTop: 3, transition: "background 0.35s" }} />
              )}
            </div>
            {/* Right: label */}
            <div style={{ paddingTop: 6, paddingBottom: isLast ? 0 : 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? T.textDark : isCompleted ? T.textMid : T.textLite, margin: 0 }}>
                {step.label}
              </p>
              {isCurrent && (
                <p style={{ fontSize: 11, color: T.primaryHover, margin: "2px 0 0", fontWeight: 600 }}>Current Step</p>
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
  const [issueType,    setIssueType]    = useState("");
  const [description,  setDescription]  = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      role="dialog" aria-modal="true" aria-labelledby="complaint-title">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,43,53,0.45)", backdropFilter: "blur(5px)" }} />
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", width: "100%", maxWidth: 440, background: "white", borderRadius: 22, padding: 28, boxShadow: "0 24px 48px rgba(26,43,53,0.14)" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,129,106,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: T.coralText, flexShrink: 0 }}>
            <FiAlertCircle size={22} />
          </div>
          <div>
            <h3 id="complaint-title" style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: T.textDark }}>Report an Issue</h3>
            <p style={{ margin: 0, color: T.textMid, fontSize: 13 }}>We'll respond within 24 hours</p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: T.textLite, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>What went wrong?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {COMPLAINT_ISSUES.map(issue => (
              <button key={issue.v} onClick={() => setIssueType(issue.v)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${issueType === issue.v ? T.coral : T.border}`, background: issueType === issue.v ? "rgba(232,129,106,0.07)" : "white", cursor: "pointer", fontSize: 13, fontWeight: issueType === issue.v ? 700 : 500, color: issueType === issue.v ? T.coralText : T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s", textAlign: "left" }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${issueType === issue.v ? T.coral : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {issueType === issue.v && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.coral, display: "block" }} />}
                </span>
                {issue.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: T.textLite, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Details (optional)</p>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="Describe the issue…"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.textDark, resize: "vertical", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = T.coral}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#F7FAFA", cursor: "pointer", fontWeight: 600, fontSize: 13, color: T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cancel
          </button>
          <motion.button whileTap={!isSubmitting && issueType ? { scale: 0.97 } : {}}
            onClick={handleSubmit} disabled={isSubmitting || !issueType}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", cursor: (!issueType || isSubmitting) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, color: "white", background: (!issueType || isSubmitting) ? "rgba(232,129,106,0.4)" : T.coral, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            {isSubmitting ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }} />Submitting…</>
            ) : "Submit Report"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const reduced     = useReducedMotion();

  const [order,            setOrder]            = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [cancelModalOpen,  setCancelModalOpen]  = useState(false);
  const [cancelReason,     setCancelReason]     = useState("");
  const [isCancelling,     setIsCancelling]     = useState(false);
  const [complaintOpen,    setComplaintOpen]    = useState(false);
  const [isReordering,     setIsReordering]     = useState(false);
  const [isReviewOpen,     setIsReviewOpen]     = useState(false);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [selectedReview,   setSelectedReview]   = useState(null);
  const [stickyVisible,    setStickyVisible]    = useState(false);

  const headerRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true });
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // ── Sticky header on scroll ────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [loading]);

  // ── Escape closes modals ───────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") {
        if (cancelModalOpen) setCancelModalOpen(false);
        if (complaintOpen)   setComplaintOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [cancelModalOpen, complaintOpen]);

  // ── Cancel handler ─────────────────────────────────────────
  const handleCancelOrder = useCallback(async () => {
    if (!cancelReason.trim()) { toast.error("Please select a reason"); return; }
    setOrder(prev => ({ ...prev, status: "Cancelled by User", cancelReason }));
    setCancelModalOpen(false);
    setIsCancelling(true);
    try {
      const { data } = await axios.put(`${API_URL}/api/orders/${order._id}/cancel`, { reason: cancelReason }, { withCredentials: true });
      setOrder(data);
      toast.success("Order cancelled successfully");
    } catch (err) {
      setOrder(prev => ({ ...prev, status: "Pending", cancelReason: undefined }));
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
      setCancelReason("");
    }
  }, [cancelReason, order?._id]);

  // ── Reorder ────────────────────────────────────────────────
  const handleReorder = useCallback(async () => {
    if (!order) return;
    setIsReordering(true);
    try {
      await Promise.all(
        order.items.map(item => {
          const productId = item.productId
            ? (typeof item.productId === "object" ? item.productId._id : item.productId)
            : item.product
              ? (typeof item.product === "object" ? item.product._id : item.product)
              : item._id;
          return axios.post(`${API_URL}/api/cart`, { productId, qty: item.qty }, { withCredentials: true });
        })
      );
      toast.success(`${order.items.length} item${order.items.length > 1 ? "s" : ""} added to cart!`, { icon: "🛒" });
      navigate("/cart");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add items to cart");
    } finally {
      setIsReordering(false);
    }
  }, [order, navigate]);

  // ── Open review modal ──────────────────────────────────────
  const openReviewModal = useCallback((item) => {
    const realId = item.productId
      ? (typeof item.productId === "object" ? item.productId._id : item.productId)
      : item.product
        ? (typeof item.product === "object" ? item.product._id : item.product)
        : item._id;
    setSelectedProduct({ _id: realId, name: item.name });
    setSelectedReview(null);
    setIsReviewOpen(true);
  }, []);

  // ── ETA ────────────────────────────────────────────────────
  const getETA = useCallback((createdAt) => {
    const eta = new Date(createdAt);
    eta.setDate(eta.getDate() + DELIVERY_DAYS);
    return eta.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }, []);

  // ── Guards ─────────────────────────────────────────────────
  if (loading) return <SeaBiteLoader fullScreen />;

  if (!order) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg, gap: 16 }}>
      <h2 style={{ color: T.textDark, fontSize: 24, fontWeight: 700 }}>Order Not Found</h2>
      <Link to="/orders" style={{ color: T.primaryHover, fontWeight: 600, textDecoration: "none" }}>← Back to Orders</Link>
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const isCancelled       = order.status.includes("Cancelled");
  const isDelivered       = order.status === "Delivered";
  const canCancel         = !isCancelled && ["Pending", "Processing", "Placed"].includes(order.status);
  const displayId         = order.orderId || order._id.slice(-6).toUpperCase();

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── STICKY CONTEXT BAR ─────────────────────────────── */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            className="sb-sticky-bar"
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: "rgba(255,255,255,0.85)", borderBottom: `1px solid ${T.border}`, padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link to="/orders" style={{ color: T.textLite, textDecoration: "none", display: "flex", alignItems: "center" }}>
                <FiArrowLeft size={16} />
              </Link>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: T.textDark }}>#{displayId}</span>
              <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: isCancelled ? "rgba(232,129,106,0.1)" : "rgba(91,168,160,0.1)", color: isCancelled ? T.coralText : T.primaryHover }}>
                {order.status}
              </span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.textDark }}>₹{order.totalAmount}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)}
        product={selectedProduct} existingReview={selectedReview}
        token={null} API_URL={API_URL}
        onSuccess={() => { toast.success("Review saved!"); }}
      />

      <AnimatePresence>
        {complaintOpen && <QualityComplaintModal order={order} onClose={() => setComplaintOpen(false)} />}
      </AnimatePresence>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 20px 60px" }}>

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <motion.div ref={headerRef}
          initial={{ opacity: 0, y: reduced ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 24 }}>
          <Link to="/orders" className="sb-focus"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.textLite, textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <FiArrowLeft aria-hidden="true" /> Back to Orders
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textDark, margin: 0 }}>
                Order #{displayId}
              </h1>
              <p style={{ fontSize: 13, color: T.textLite, marginTop: 4 }}>
                Placed on{" "}
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>

              {/* Reorder */}
              {(isDelivered || isCancelled) && (
                <motion.button onClick={handleReorder} disabled={isReordering}
                  whileHover={reduced ? {} : { y: -2 }} whileTap={{ scale: 0.95 }} className="sb-focus"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(91,168,160,0.10)", border: `1px solid rgba(91,168,160,0.2)`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.primaryHover, cursor: isReordering ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {isReordering ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(74,150,144,0.3)", borderTopColor: T.primary, borderRadius: "50%" }} />
                  ) : <FiRotateCcw size={14} aria-hidden="true" />}
                  Reorder
                </motion.button>
              )}

              {/* Quality complaint — delivered only */}
              {isDelivered && (
                <motion.button onClick={() => setComplaintOpen(true)}
                  whileHover={reduced ? {} : { y: -2 }} whileTap={{ scale: 0.95 }} className="sb-focus"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(232,129,106,0.08)", border: "1px solid rgba(232,129,106,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.coralText, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <FiAlertCircle size={14} aria-hidden="true" /> Report Issue
                </motion.button>
              )}

              {/* Invoice */}
              <motion.button onClick={() => generateInvoicePDF(order)}
                whileHover={reduced ? {} : { y: -2 }} whileTap={{ scale: 0.95 }} className="sb-focus"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "white", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.textMid, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <FiDownload size={14} aria-hidden="true" /> Invoice
              </motion.button>

              {/* Cancel */}
              {canCancel && (
                <motion.button onClick={() => setCancelModalOpen(true)}
                  whileHover={reduced ? {} : { y: -2 }} whileTap={{ scale: 0.95 }} className="sb-focus"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(232,129,106,0.1)", border: "1px solid rgba(232,129,106,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.coralText, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <FiXCircle size={14} aria-hidden="true" /> Cancel Order
                </motion.button>
              )}

              {/* Status pill */}
              <AnimatePresence mode="wait">
                <motion.span key={order.status} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.25 }}
                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: isCancelled ? "rgba(232,129,106,0.1)" : "rgba(91,168,160,0.1)", color: isCancelled ? T.coralText : T.primaryHover, display: "inline-flex", alignItems: "center" }}>
                  {order.status}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── TRACKER ────────────────────────────────────────── */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{ background: T.surface, padding: "24px 24px 20px", borderRadius: 20, border: `1px solid ${T.border}`, marginBottom: 24 }}>

            {/* ETA chip */}
            {!isDelivered && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(91,168,160,0.08)", border: `1px solid rgba(91,168,160,0.15)` }}>
                  <FiCalendar size={11} style={{ color: T.primaryHover }} aria-hidden="true" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.primaryHover }}>
                    Expected by {getETA(order.createdAt)}
                  </span>
                </div>
                {order.status === "Shipped" && order.trackingId && (
                  <a href={order.trackingUrl || `https://www.shiprocket.in/shipment-tracking/?id=${order.trackingId}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "rgba(137,194,217,0.10)", border: `1px solid rgba(137,194,217,0.2)`, textDecoration: "none", fontSize: 11, fontWeight: 700, color: T.sky }}>
                    <FiTruck size={11} aria-hidden="true" /> Track Shipment <FiExternalLink size={9} />
                  </a>
                )}
              </div>
            )}

            {/* Horizontal tracker (desktop) */}
            <div className="sb-tracker-h" style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 380 }}>
                <HorizontalTracker currentStepIndex={currentStepIndex} reduced={reduced} />
              </div>
            </div>

            {/* Vertical tracker (mobile) */}
            <div className="sb-tracker-v" style={{ display: "none" }}>
              <VerticalTracker currentStepIndex={currentStepIndex} reduced={reduced} />
            </div>
          </motion.div>
        )}

        {/* ── CONTENT GRID ────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

          {/* Items card */}
          <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 20, display: "flex", alignItems: "center", gap: 8, margin: "0 0 20px" }}>
              <FiShoppingBag aria-hidden="true" /> Items
            </h2>

            {order.items?.length === 0 ? (
              <p style={{ color: T.textLite, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No items found for this order.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {order.items.map((item, i) => {
                  const realId = item.productId
                    ? (typeof item.productId === "object" ? item.productId._id : item.productId)
                    : item.product
                      ? (typeof item.product === "object" ? item.product._id : item.product)
                      : item._id;

                  return (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ flex: 1, display: "flex", gap: 14, alignItems: "center" }}>
                        <Link to={`/products/${realId}`} style={{ display: "block", flexShrink: 0 }}>
                          <ShimmerImage
                            src={`${API_URL}/uploads/${item.image?.replace("uploads/", "")}`}
                            alt={item.name}
                            style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", background: "#F7FAFA", border: `1px solid ${T.border}`, display: "block" }}
                          />
                        </Link>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link to={`/products/${realId}`} style={{ textDecoration: "none" }}>
                            <p title={item.name} style={{ fontSize: 14, fontWeight: 700, color: T.textDark, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                          </Link>
                          <p style={{ fontSize: 12, color: T.textLite, margin: 0 }}>{item.qty} × ₹{item.price}</p>
                          {/* Per-item review button */}
                          {isDelivered && (
                            <motion.button whileTap={{ scale: 0.96 }}
                              onClick={() => openReviewModal(item)} className="sb-focus"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, background: "rgba(201,148,26,0.10)", color: T.amber, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              <FiStar size={9} /> Write Review
                            </motion.button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: T.textDark, flexShrink: 0, fontSize: 14 }}>
                        ₹{item.price * item.qty}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price breakdown */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Subtotal", value: `₹${order.itemsPrice}`,                                                                 color: T.textMid         },
                { label: "Shipping", value: order.shippingPrice === 0 ? "Free" : `₹${order.shippingPrice}`,                         color: T.textMid         },
                { label: "Tax",      value: `₹${order.taxPrice}`,                                                                   color: T.textMid         },
                ...(order.discount > 0 ? [{ label: "Discount", value: `-₹${order.discount}`, color: T.primaryHover }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: row.color }}>
                  <span>{row.label}</span><span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: T.textDark, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <span>Total</span>
                <motion.span key={order.totalAmount} initial={{ scale: reduced ? 1 : 1.08 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}>
                  ₹{order.totalAmount}
                </motion.span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Delivery address */}
            <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
                <FiMapPin aria-hidden="true" /> Delivery Address
              </h2>
              <address style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, fontStyle: "normal" }}>
                <strong style={{ color: T.textDark }}>{order.shippingAddress?.fullName}</strong><br />
                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.zip}<br />
                <span style={{ color: T.textLite }}>📞</span> {order.shippingAddress?.phone}
              </address>
              {/* Delivery instructions */}
              {order.shippingAddress?.instructions && (
                <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(91,168,160,0.06)", border: `1px solid rgba(91,168,160,0.12)`, fontSize: 12, color: T.textMid }}>
                  📝 <em>{order.shippingAddress.instructions}</em>
                </div>
              )}
            </div>

            {/* Payment info */}
            <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, display: "flex", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
                <FiCreditCard aria-hidden="true" /> Payment Info
              </h2>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: T.textLite }}>Method</span>
                <span style={{ fontWeight: 600, color: T.textDark, display: "flex", alignItems: "center", gap: 6 }}>
                  <PaymentIcon method={order.paymentMethod} />
                  {order.paymentMethod}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
                <span style={{ color: T.textLite }}>Status</span>
                <AnimatePresence mode="wait">
                  <motion.span key={String(order.isPaid)} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}
                    style={{ fontWeight: 700, color: order.isPaid ? T.primaryHover : T.amber, display: "flex", alignItems: "center", gap: 5 }}>
                    {order.isPaid && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>✓</motion.span>}
                    {order.isPaid ? "Paid" : "Pending"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Cancelled info */}
            <AnimatePresence>
              {isCancelled && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  role="alert"
                  style={{ background: "rgba(232,129,106,0.05)", padding: 24, borderRadius: 20, border: "1px solid rgba(232,129,106,0.2)" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.coralText, display: "flex", alignItems: "center", gap: 8, margin: "0 0 8px" }}>
                    <FiAlertCircle aria-hidden="true" /> Order Cancelled
                  </h3>
                  {order.cancelledAt && (
                    <p style={{ fontSize: 12, color: T.textLite, margin: "0 0 6px" }}>
                      <time dateTime={order.cancelledAt}>
                        Cancelled on {new Date(order.cancelledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </time>
                    </p>
                  )}
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

      {/* ── CANCELLATION MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setCancelModalOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(26,43,53,0.45)", backdropFilter: "blur(5px)" }} />
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", width: "100%", maxWidth: 420, background: "white", borderRadius: 22, padding: 28, boxShadow: "0 24px 48px rgba(26,43,53,0.14)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,129,106,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: T.coralText, flexShrink: 0 }}>
                  <FiAlertCircle size={22} />
                </div>
                <div>
                  <h3 id="cancel-modal-title" style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: T.textDark }}>Cancel Order?</h3>
                  <p style={{ margin: 0, color: T.textMid, fontSize: 13, lineHeight: 1.6 }}>This action cannot be undone. Please select a reason.</p>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label htmlFor="cancel-reason" style={{ display: "block", fontSize: 11, fontWeight: 800, color: T.textLite, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Reason for cancellation
                </label>
                <select id="cancel-reason" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="sb-focus"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${cancelReason ? T.primary : T.border}`, fontSize: 14, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.textDark, background: "white", transition: "border-color 0.2s", cursor: "pointer" }}>
                  <option value="">Select a reason…</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price">Found a better price</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Delivery time too long">Delivery time too long</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setCancelModalOpen(false); setCancelReason(""); }} className="sb-focus"
                  style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#F7FAFA", cursor: "pointer", fontWeight: 600, fontSize: 13, color: T.textMid, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Keep Order
                </motion.button>
                <motion.button whileTap={cancelReason && !isCancelling ? { scale: 0.97 } : {}}
                  onClick={handleCancelOrder} disabled={isCancelling || !cancelReason} className="sb-focus"
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", cursor: (!cancelReason || isCancelling) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, color: "white", background: (!cancelReason || isCancelling) ? "rgba(232,129,106,0.4)" : T.coral, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                  {isCancelling ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%" }} />
                    Cancelling…</>
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