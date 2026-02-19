import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import {
  FiBell, FiPackage, FiTruck, FiCheckCircle, FiInfo, FiArrowLeft,
  FiInbox, FiTrash2, FiX, FiClock, FiFilter,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
  textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
  primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};

const FILTERS = [
  { id: "all", label: "All", icon: <FiBell size={12} /> },
  { id: "Shipped", label: "Shipping", icon: <FiTruck size={12} /> },
  { id: "Delivered", label: "Delivered", icon: <FiCheckCircle size={12} /> },
  { id: "Processing", label: "Processing", icon: <FiPackage size={12} /> },
];

const getStatusConfig = (type) => {
  switch (type) {
    case "Shipped":    return { icon: <FiTruck />, color: T.sky, bg: "rgba(137,194,217,0.12)", label: "In Transit" };
    case "Delivered":  return { icon: <FiCheckCircle />, color: T.primary, bg: "rgba(91,168,160,0.1)", label: "Delivered" };
    case "Processing": return { icon: <FiPackage />, color: "#C9941A", bg: "rgba(245,158,11,0.1)", label: "Processing" };
    default:           return { icon: <FiInfo />, color: T.textMid, bg: "rgba(74,101,114,0.08)", label: "Update" };
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  const filteredNotifications = useMemo(() =>
    activeFilter === "all" ? notifications : notifications.filter(n => n.statusType === activeFilter),
    [notifications, activeFilter]
  );

  const groupedNotifications = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayItems = [], earlierItems = [];
    filteredNotifications.forEach(n => {
      new Date(n.createdAt) >= today ? todayItems.push(n) : earlierItems.push(n);
    });
    return { todayItems, earlierItems };
  }, [filteredNotifications]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
      setNotifications(res.data);
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, { withCredentials: true });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, { withCredentials: true });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  const clearAll = async () => {
    try {
      await axios.delete(`${API_URL}/api/notifications/clear/all`, { withCredentials: true });
      setNotifications([]);
    } catch {}
  };

  const font = "'Plus Jakarta Sans', sans-serif";

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 44, height: 44, border: `3px solid ${T.border}`, borderTopColor: T.primary, borderRadius: "50%", marginBottom: 16 }} />
      <p style={{ color: T.textLite, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Syncing updates...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: font, padding: "100px 20px 60px", overflowX: "hidden" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 360, background: "linear-gradient(180deg, rgba(91,168,160,0.06) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }}
          style={{ marginBottom: 32 }}>
          <motion.button whileHover={{ x: -3 }} onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 8, color: T.textLite, fontWeight: 700, fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: font, marginBottom: 20 }}>
            <FiArrowLeft size={14} /> Back
          </motion.button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${T.primary}, ${T.sky})` }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.16em" }}>Your Feed</span>
              </div>
              <h1 style={{ fontSize: 34, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>
                Activity <span style={{ color: T.primary }}>Log</span>
              </h1>
            </div>

            <AnimatePresence>
              {notifications.length > 0 && (
                <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={clearAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 12,
                    background: T.surface, border: `1px solid ${T.border}`, color: T.textLite,
                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: font,
                    boxShadow: "0 1px 4px rgba(26,43,53,0.06)",
                  }}>
                  <FiTrash2 size={13} /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── FILTER TABS ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24 }}>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter.id;
            const count = filter.id === "all" ? notifications.length : notifications.filter(n => n.statusType === filter.id).length;
            return (
              <motion.button key={filter.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveFilter(filter.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                  whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, fontFamily: font,
                  background: isActive ? T.primary : T.surface,
                  color: isActive ? "#fff" : T.textMid,
                  border: isActive ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
                  boxShadow: isActive ? "0 4px 16px rgba(91,168,160,0.22)" : "none",
                }}>
                {filter.icon}{filter.label}
                {count > 0 && (
                  <span style={{ padding: "1px 7px", borderRadius: 8, fontSize: 9, fontWeight: 800, background: isActive ? "rgba(255,255,255,0.22)" : "rgba(91,168,160,0.1)", color: isActive ? "#fff" : T.primary }}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── NOTIFICATION LIST ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, padding: "72px 40px", textAlign: "center" }}>
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(91,168,160,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: T.textLite }}>
                  <FiInbox size={28} />
                </motion.div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.textDark, marginBottom: 8 }}>All Caught Up</h3>
                <p style={{ fontSize: 13, color: T.textLite, maxWidth: 260, margin: "0 auto", lineHeight: 1.7 }}>You have no new notifications at the moment.</p>
              </motion.div>
            ) : (
              <>
                {/* Today group */}
                {groupedNotifications.todayItems.length > 0 && (
                  <motion.div key="today-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.primary, display: "inline-block", animation: "pulse 2s infinite" }} />
                    Today
                  </motion.div>
                )}
                {groupedNotifications.todayItems.map((n, index) => (
                  <NotificationCard key={n._id} n={n} index={index} onDelete={deleteNotification} T={T} font={font} />
                ))}

                {/* Earlier group */}
                {groupedNotifications.earlierItems.length > 0 && (
                  <motion.div key="earlier-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.16em", margin: "8px 0 2px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.border, display: "inline-block" }} />
                    Earlier
                  </motion.div>
                )}
                {groupedNotifications.earlierItems.map((n, index) => (
                  <NotificationCard key={n._id} n={n} index={index} onDelete={deleteNotification} T={T} font={font} />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ n, index, onDelete, T, font }) {
  const config = getStatusConfig(n.statusType);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -48, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22,1,0.36,1] }}
      whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(91,168,160,0.10)" }}
      style={{
        background: "#ffffff", borderRadius: 16, border: `1px solid #E2EEEC`,
        padding: "18px 20px", boxShadow: "0 1px 6px rgba(91,168,160,0.06)",
        transition: "box-shadow 0.25s, transform 0.25s",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Icon */}
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 220 }}
          style={{ width: 42, height: 42, borderRadius: 12, background: config.bg, color: config.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          {config.icon}
        </motion.div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 9px", borderRadius: 7, background: config.bg, color: config.color }}>
              {config.label}
            </span>
            <motion.button whileHover={{ scale: 1.2, color: T.coral }} whileTap={{ scale: 0.85 }} onClick={() => onDelete(n._id)}
              style={{ color: T.textLite, background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
              <FiX size={14} />
            </motion.button>
          </div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: T.textDark, margin: "0 0 6px", lineHeight: 1.5 }}>{n.message}</h4>
          <p style={{ fontSize: 11, color: T.textLite, display: "flex", alignItems: "center", gap: 5, margin: 0 }}>
            <FiClock size={10} />
            {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}