/**
 * Notifications.jsx — Premium Redesign
 *
 * Design: "Activity Stream"
 * ─────────────────────────────────────────────────────────────
 * Notifications are ephemeral — the UI should feel light, fast,
 * and easy to action. Key choices:
 *
 *   • Filter pills: Scrollable horizontal row with a sliding
 *     `layoutId` background pill for buttery-smooth transitions.
 *   • Timeline groups: "Today" and "Earlier" sections with a
 *     left accent line creating a timeline metaphor.
 *   • Card exit: Slides left + fades — feels like swiping away.
 *   • Delete hover: FiX icon scales and turns coral, giving
 *     clear affordance before the irreversible action.
 *   • Clear All: Animated in/out with AnimatePresence.
 *
 * All data contracts preserved. API calls unchanged.
 */

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiBell, FiPackage, FiTruck, FiCheckCircle, FiInfo,
  FiArrowLeft, FiInbox, FiTrash2, FiX, FiClock,
} from "react-icons/fi";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#F7F8FA",
  surface:   "#FFFFFF",
  border:    "#EAECF0",
  ink:       "#0D1117",
  inkMid:    "#44505C",
  inkSoft:   "#8A96A3",
  inkGhost:  "#B8C0C8",
  teal:      "#4ECDC4",
  tealDeep:  "#38B2AC",
  tealGlow:  "rgba(78,205,196,0.13)",
  amber:     "#F59E0B",
  amberBg:   "rgba(245,158,11,0.09)",
  coral:     "#EF4444",
  coralBg:   "rgba(239,68,68,0.08)",
  jade:      "#10B981",
  jadeBg:    "rgba(16,185,129,0.09)",
  sky:       "#38BDF8",
  skyBg:     "rgba(56,189,248,0.09)",
  shadow:    "0 1px 4px rgba(13,17,23,0.05), 0 3px 12px rgba(13,17,23,0.04)",
  shadowMd:  "0 4px 24px rgba(13,17,23,0.08), 0 1px 5px rgba(13,17,23,0.04)",
  ease:      [0.16, 1, 0.3, 1],
  spring:    { type: "spring", stiffness: 360, damping: 34 },
  r:         14,
  rLg:       20,
  rXl:       26,
  rFull:     9999,
};

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .nt-focus:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(78,205,196,0.18), 0 0 0 1.5px #4ECDC4;
  }
  .nt-del-btn { transition: color 0.15s, transform 0.15s; }
  .nt-del-btn:hover { color: #EF4444 !important; transform: scale(1.18); }
`;
if (typeof document !== "undefined" && !document.getElementById("nt-styles")) {
  const el = document.createElement("style"); el.id = "nt-styles"; el.textContent = CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const FILTERS = [
  { id: "all",        label: "All",        icon: <FiBell size={11} />       },
  { id: "Shipped",    label: "Shipping",   icon: <FiTruck size={11} />      },
  { id: "Delivered",  label: "Delivered",  icon: <FiCheckCircle size={11} /> },
  { id: "Processing", label: "Processing", icon: <FiPackage size={11} />    },
];

function statusCfg(type) {
  switch (type) {
    case "Shipped":    return { icon: <FiTruck />,       color: T.sky,   bg: T.skyBg,   label: "In Transit"  };
    case "Delivered":  return { icon: <FiCheckCircle />, color: T.jade,  bg: T.jadeBg,  label: "Delivered"   };
    case "Processing": return { icon: <FiPackage />,     color: T.amber, bg: T.amberBg, label: "Processing"  };
    default:           return { icon: <FiInfo />,        color: T.teal,  bg: T.tealGlow,label: "Update"      };
  }
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION CARD
// ─────────────────────────────────────────────────────────────
function NotificationCard({ n, index, onDelete, reduced }) {
  const cfg = statusCfg(n.statusType);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduced ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: reduced ? 0 : -56,
        scale: 0.95,
        transition: { duration: 0.24, ease: "easeIn" },
      }}
      transition={{ delay: reduced ? 0 : index * 0.045, duration: 0.42, ease: T.ease }}
      style={{
        background: T.surface,
        borderRadius: T.r,
        border: `1px solid ${T.border}`,
        padding: "18px 20px",
        boxShadow: T.shadow,
        display: "flex", gap: 14, alignItems: "flex-start",
      }}
      whileHover={reduced ? {} : {
        y: -2,
        boxShadow: T.shadowMd,
        transition: { duration: 0.18, ease: T.ease },
      }}
    >
      {/* Status icon */}
      <motion.div
        initial={reduced ? {} : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reduced ? 0 : index * 0.045 + 0.14, ...T.spring }}
        style={{
          width: 44, height: 44, borderRadius: 13, flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}
      >
        {cfg.icon}
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
          {/* Label badge */}
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", padding: "3px 9px", borderRadius: T.rFull,
            background: cfg.bg, color: cfg.color,
          }}>
            {cfg.label}
          </span>

          {/* Delete */}
          <button
            onClick={() => onDelete(n._id)}
            aria-label={`Delete notification: ${n.message}`}
            className="nt-del-btn nt-focus"
            style={{
              color: T.inkGhost, background: "none", border: "none",
              cursor: "pointer", padding: 4, flexShrink: 0,
              display: "flex", alignItems: "center",
            }}
          >
            <FiX size={14} />
          </button>
        </div>

        <h4 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13.5, fontWeight: 600, color: T.ink,
          margin: "0 0 7px", lineHeight: 1.5,
        }}>
          {n.message}
        </h4>

        <p style={{
          fontSize: 11, color: T.inkSoft, margin: 0,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <FiClock size={9} aria-hidden="true" />
          <time dateTime={n.createdAt}>
            {new Date(n.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit",
            })}
          </time>
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// TIMELINE GROUP LABEL
// ─────────────────────────────────────────────────────────────
function GroupLabel({ label, live = false, reduced }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "'Sora', sans-serif",
        fontSize: 9.5, fontWeight: 700, color: live ? T.teal : T.inkGhost,
        textTransform: "uppercase", letterSpacing: "0.15em",
        paddingLeft: 2,
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: live ? T.teal : T.border,
        boxShadow: live ? `0 0 0 3px ${T.tealGlow}` : "none",
      }} />
      {label}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState("all");
  const navigate = useNavigate();
  const reduced  = useReducedMotion();

  // ── Derived lists ─────────────────────────────────────────
  const filtered = useMemo(() =>
    activeFilter === "all"
      ? notifications
      : notifications.filter(n => n.statusType === activeFilter),
    [notifications, activeFilter]
  );

  const { todayItems, earlierItems } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const t = [], e = [];
    filtered.forEach(n =>
      new Date(n.createdAt) >= today ? t.push(n) : e.push(n)
    );
    return { todayItems: t, earlierItems: e };
  }, [filtered]);

  // ── Data fetching ─────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
      setNotifications(res.data);
      // Mark all as read silently
      axios.put(`${API_URL}/api/notifications/read-all`, {}, { withCredentials: true }).catch(() => {});
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const deleteOne = async (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id)); // optimistic
    try {
      await axios.delete(`${API_URL}/api/notifications/${id}`, { withCredentials: true });
    } catch {}
  };

  const clearAll = async () => {
    setNotifications([]); // optimistic
    try {
      await axios.delete(`${API_URL}/api/notifications/clear/all`, { withCredentials: true });
    } catch {}
  };

  if (loading) return <SeaBiteLoader fullScreen />;

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'DM Sans', sans-serif",
      padding: "100px 20px 72px",
      overflowX: "hidden",
    }}>
      {/* Ambient gradient */}
      <div aria-hidden="true" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 400,
        background: "linear-gradient(180deg, rgba(78,205,196,0.05) 0%, transparent 100%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: 740, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ──────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: reduced ? 0 : -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: T.ease }}
          style={{ marginBottom: 32 }}
        >
          {/* Back */}
          <motion.button
            whileHover={reduced ? {} : { x: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(-1)}
            className="nt-focus"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              color: T.inkSoft, fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, fontSize: 13, background: "none", border: "none",
              cursor: "pointer", marginBottom: 22,
            }}
          >
            <FiArrowLeft size={14} /> Back
          </motion.button>

          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              {/* Eyebrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, background: T.teal }} />
                <span style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 9.5, fontWeight: 700, color: T.teal,
                  textTransform: "uppercase", letterSpacing: "0.17em",
                }}>
                  Your Feed
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 34, fontWeight: 800, color: T.ink,
                letterSpacing: "-0.032em", margin: 0,
              }}>
                Activity{" "}
                <span style={{
                  background: `linear-gradient(135deg, ${T.teal}, ${T.sky})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Log
                </span>
              </h1>
            </div>

            {/* Clear all button */}
            <AnimatePresence>
              {notifications.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  whileHover={reduced ? {} : { y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={clearAll}
                  className="nt-focus"
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "10px 18px", borderRadius: T.r,
                    background: T.surface, border: `1.5px solid ${T.border}`,
                    color: T.inkSoft, fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    boxShadow: T.shadow,
                  }}
                >
                  <FiTrash2 size={12} /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.header>

        {/* ── FILTER PILLS ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: T.ease }}
          role="tablist"
          aria-label="Filter notifications"
          style={{
            display: "flex", gap: 7, overflowX: "auto",
            paddingBottom: 2, marginBottom: 28,
            scrollbarWidth: "none",
          }}
        >
          {FILTERS.map(f => {
            const active = activeFilter === f.id;
            const count  = f.id === "all"
              ? notifications.length
              : notifications.filter(n => n.statusType === f.id).length;

            return (
              <div key={f.id} style={{ position: "relative" }}>
                {/* Sliding background indicator */}
                {active && (
                  <motion.div
                    layoutId="nt-filter-pill"
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: T.r,
                      background: T.teal,
                      boxShadow: "0 4px 18px rgba(78,205,196,0.28)",
                    }}
                    transition={T.spring}
                  />
                )}
                <button
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveFilter(f.id)}
                  className="nt-focus"
                  style={{
                    position: "relative", zIndex: 1,
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: T.r,
                    cursor: "pointer", whiteSpace: "nowrap",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    color: active ? T.surface : T.inkMid,
                    background: active ? "transparent" : T.surface,
                    border: `1.5px solid ${active ? "transparent" : T.border}`,
                    transition: "color 0.18s, border-color 0.18s",
                  }}
                >
                  {f.icon}
                  {f.label}
                  {count > 0 && (
                    <span style={{
                      padding: "1px 7px", borderRadius: T.rFull,
                      fontSize: 9.5, fontWeight: 700,
                      background: active ? "rgba(255,255,255,0.22)" : T.tealGlow,
                      color: active ? T.surface : T.tealDeep,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </motion.div>

        {/* ── NOTIFICATION LIST ─────────────────────────── */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            /* Empty state */
            <motion.div
              key="nt-empty"
              initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: T.surface, borderRadius: T.rLg,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
                padding: "72px 40px", textAlign: "center",
              }}
            >
              <motion.div
                animate={reduced ? {} : { y: [0, -7, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 68, height: 68, borderRadius: "50%",
                  background: T.tealGlow, border: `1px solid rgba(78,205,196,0.2)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 22px", color: T.teal,
                }}
              >
                <FiInbox size={28} />
              </motion.div>
              <h3 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 8,
              }}>
                All Caught Up
              </h3>
              <p style={{
                fontSize: 13.5, color: T.inkSoft,
                maxWidth: 270, margin: "0 auto", lineHeight: 1.7,
              }}>
                You have no{activeFilter !== "all" ? ` ${activeFilter.toLowerCase()}` : " new"} notifications.
              </p>
            </motion.div>

          ) : (
            <div key="nt-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Today group */}
              {todayItems.length > 0 && (
                <motion.div
                  key="today-group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <GroupLabel label="Today" live reduced={reduced} />
                  <AnimatePresence mode="popLayout">
                    {todayItems.map((n, i) => (
                      <NotificationCard
                        key={n._id} n={n} index={i}
                        onDelete={deleteOne} reduced={reduced}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Earlier group */}
              {earlierItems.length > 0 && (
                <motion.div
                  key="earlier-group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: todayItems.length ? 8 : 0 }}
                >
                  <GroupLabel label="Earlier" reduced={reduced} />
                  <AnimatePresence mode="popLayout">
                    {earlierItems.map((n, i) => (
                      <NotificationCard
                        key={n._id} n={n} index={i}
                        onDelete={deleteOne} reduced={reduced}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}