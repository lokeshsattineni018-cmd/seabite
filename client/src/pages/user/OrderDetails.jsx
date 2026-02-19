import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft, FiPackage, FiMapPin, FiCalendar, FiCreditCard,
  FiShoppingBag, FiTruck, FiCheckCircle, FiClock, FiXCircle
} from "react-icons/fi";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};

const STEPS = [
  { status: "Pending", label: "Order Placed", icon: <FiCheckCircle /> },
  { status: "Processing", label: "Processing", icon: <FiPackage /> },
  { status: "Shipped", label: "Shipped", icon: <FiTruck /> },
  { status: "Delivered", label: "Delivered", icon: <FiMapPin /> },
];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/orders/${id}`, { withCredentials: true });
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg, gap: 16 }}>
      <h2 style={{ color: T.textDark, fontSize: 24, fontWeight: 700 }}>Order Not Found</h2>
      <Link to="/orders" style={{ color: T.primary, fontWeight: 600, textDecoration: "none" }}>&larr; Back to Orders</Link>
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const isCancelled = order.status.includes("Cancelled");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "100px 20px 60px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link to="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.textLite, textDecoration: "none", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <FiArrowLeft /> Back to Orders
          </Link>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textDark, margin: 0 }}>Order #{order.orderId || order._id.slice(-6).toUpperCase()}</h1>
              <p style={{ fontSize: 13, color: T.textLite, marginTop: 4 }}>
                Placed on {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                background: isCancelled ? "rgba(232,129,106,0.1)" : "rgba(91,168,160,0.1)",
                color: isCancelled ? T.coral : T.primary
              }}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tracker */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: T.surface, padding: "30px 24px", borderRadius: 20, border: `1px solid ${T.border}`, marginBottom: 24, overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative", minWidth: 400 }}>
              {/* Progress Line */}
              <div style={{ position: "absolute", top: 18, left: 20, right: 20, height: 3, background: "#EEF5F4", borderRadius: 3, zIndex: 0 }} />
              <div style={{
                position: "absolute", top: 18, left: 20, height: 3, background: T.primary, borderRadius: 3, zIndex: 0, transition: "width 0.5s",
                width: `${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}%`
              }} />

              {STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={idx} style={{ position: "relative", zIndex: 1, textAlign: "center", width: 80 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", background: isCompleted ? T.primary : T.surface,
                      border: `3px solid ${isCompleted ? T.primary : "#EEF5F4"}`,
                      color: isCompleted ? "#fff" : T.textLite,
                      display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px",
                      transition: "all 0.3s"
                    }}>
                      {step.icon}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? T.textDark : T.textLite, margin: 0 }}>{step.label}</p>
                    {isCurrent && <p style={{ fontSize: 10, color: T.primary, margin: "2px 0 0", fontWeight: 600 }}>Current Step</p>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>

          {/* Items */}
          <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <FiShoppingBag /> Items
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <img
                    src={`${API_URL}/uploads/${item.image?.replace("uploads/", "")}`}
                    alt={item.name}
                    style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", background: "#F7FAFA" }}
                    onError={e => e.target.src = "https://via.placeholder.com/60"}
                  />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.textDark, margin: "0 0 4px" }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: T.textLite, margin: 0 }}>{item.qty} x ₹{item.price}</p>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 700, color: T.textDark }}>
                    ₹{item.price * item.qty}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textMid }}>
                <span>Subtotal</span> <span>₹{order.itemsPrice}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textMid }}>
                <span>Shipping</span> <span>{order.shippingPrice === 0 ? "Free" : `₹${order.shippingPrice}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.textMid }}>
                <span>Tax</span> <span>₹{order.taxPrice}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.primary }}>
                  <span>Discount</span> <span>-₹{order.discount}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: T.textDark, marginTop: 8 }}>
                <span>Total</span> <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <FiMapPin /> Delivery Address
              </h3>
              <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: T.textDark }}>{order.shippingAddress?.fullName}</strong><br />
                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}<br />
                Phone: {order.shippingAddress?.phone}
              </p>
            </div>

            <div style={{ background: T.surface, padding: 24, borderRadius: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textDark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <FiCreditCard /> Payment Info
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: T.textLite }}>Method</span>
                <span style={{ fontWeight: 600, color: T.textDark }}>{order.paymentMethod}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: T.textLite }}>Status</span>
                <span style={{ fontWeight: 700, color: order.isPaid ? T.primary : "#C9941A" }}>{order.isPaid ? "Paid" : "Pending"}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}