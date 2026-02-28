/**
 * Profile.jsx — Premium Redesign
 *
 * Design: "Identity Card"
 * ─────────────────────────────────────────────────────────────
 * The profile page is the most personal page in the app — it
 * should feel like a premium membership card, not a form page.
 *
 * Key choices:
 *   • Hero banner: Ken Burns zoom-in on load; gradient overlay
 *     fades from transparent → page background colour so the
 *     page blends seamlessly below the fold.
 *   • Avatar card: Overlaps the hero by -32px, creating depth.
 *     Avatar has a subtle glow ring. Online dot pulses gently.
 *   • FadeUp HOC: Scroll-triggered section reveals via useInView
 *     — identical to original, tokens updated.
 *   • Actions: Side-by-side, pill-style with matching hover
 *     shadows that echo each button's color.
 *
 * Data contracts: Unchanged. Props to UserInfo and AddressManager
 * are preserved exactly.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft, FiUser } from "react-icons/fi";
import { motion, useInView, useReducedMotion } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
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
  tealGlow:  "rgba(78,205,196,0.15)",
  coral:     "#EF4444",
  coralBg:   "rgba(239,68,68,0.08)",
  sky:       "#38BDF8",
  shadow:    "0 1px 4px rgba(13,17,23,0.06), 0 4px 20px rgba(13,17,23,0.05)",
  shadowMd:  "0 6px 32px rgba(13,17,23,0.10), 0 1px 6px rgba(13,17,23,0.05)",
  ease:      [0.16, 1, 0.3, 1],
  spring:    { type: "spring", stiffness: 340, damping: 32 },
  r:         14,
  rLg:       20,
  rXl:       28,
  rFull:     9999,
};

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  .pf-focus:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(78,205,196,0.18), 0 0 0 1.5px #4ECDC4;
  }

  @keyframes pf-online {
    0%,100% { box-shadow: 0 0 0 0 rgba(78,205,196,0.55); }
    50%     { box-shadow: 0 0 0 5px rgba(78,205,196,0);  }
  }
  .pf-online-dot { animation: pf-online 2.4s ease infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("pf-styles")) {
  const el = document.createElement("style"); el.id = "pf-styles"; el.textContent = CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
// SCROLL-REVEAL WRAPPER
// ─────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, reduced }) {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduced ? 0 : 22 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 22 }}
      transition={{ duration: 0.56, delay, ease: T.ease }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CHIP
// ─────────────────────────────────────────────────────────────
function StatChip({ label, value }) {
  return (
    <div style={{ textAlign: "center", minWidth: 64 }}>
      <p style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: 19, fontWeight: 800, color: T.ink, margin: 0,
        letterSpacing: "-0.02em",
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 9.5, fontWeight: 600, color: T.inkGhost,
        textTransform: "uppercase", letterSpacing: "0.1em", margin: 0,
      }}>
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Profile() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate  = useNavigate();
  const reduced   = useReducedMotion();

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      navigate("/login");
      window.location.reload();
    }
  };

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) return <SeaBiteLoader fullScreen />;
  if (!user)   return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl    = user.picture || user.avatar || null;

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
    }}>

      {/* ── HERO BANNER ─────────────────────────────── */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
        {/* Ocean image with Ken Burns zoom */}
        <motion.img
          initial={{ scale: reduced ? 1 : 1.07 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: T.ease }}
          src="https://images.unsplash.com/photo-1468581264429-2548ef9eb732?q=80&w=2000&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
        />

        {/* Gradient fade to page bg */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom,
            rgba(247,248,250,0.08) 0%,
            rgba(247,248,250,0.92) 100%)`,
        }} />

        {/* Texture grain overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }} />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: reduced ? 0 : -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.28, duration: 0.42, ease: T.ease }}
          whileHover={reduced ? {} : { y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/")}
          className="pf-focus"
          style={{
            position: "absolute", top: 80, left: 24,
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", borderRadius: T.r,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(14px)",
            border: `1px solid rgba(234,236,240,0.8)`,
            color: T.ink, fontFamily: "'DM Sans', sans-serif",
            fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 2px 12px rgba(13,17,23,0.09)",
          }}
        >
          <FiArrowLeft size={13} aria-hidden="true" />
          Back to Home
        </motion.button>
      </div>

      {/* ── CONTENT ──────────────────────────────────── */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 20px" }}>

        {/* ── AVATAR IDENTITY CARD (overlaps hero) ─── */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.58, ease: T.ease }}
          style={{
            background: T.surface,
            borderRadius: T.rLg,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadowMd,
            padding: "24px 28px",
            marginTop: -40, marginBottom: 22,
            display: "flex", alignItems: "center",
            gap: 22, flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user.name}'s avatar`}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: `3px solid ${T.surface}`,
                  outline: `2px solid ${T.border}`,
                  objectFit: "cover",
                  boxShadow: "0 4px 22px rgba(78,205,196,0.18)",
                }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.teal}, ${T.sky})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, color: T.surface,
                border: `3px solid ${T.surface}`,
                outline: `2px solid ${T.border}`,
                boxShadow: "0 4px 22px rgba(78,205,196,0.22)",
                fontFamily: "'Sora', sans-serif",
              }}>
                {avatarLetter}
              </div>
            )}

            {/* Online indicator */}
            <div
              className="pf-online-dot"
              style={{
                position: "absolute", bottom: 3, right: 3,
                width: 14, height: 14, borderRadius: "50%",
                background: T.teal,
                border: `2.5px solid ${T.surface}`,
              }}
            />
          </div>

          {/* Name & email */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 22, fontWeight: 800, color: T.ink,
              margin: "0 0 4px", letterSpacing: "-0.022em",
            }}>
              {user.name}
            </h1>
            <p style={{ fontSize: 13, color: T.inkSoft, margin: 0 }}>{user.email}</p>
            {user.role === "admin" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, ...T.spring }}
                style={{
                  display: "inline-block", marginTop: 8,
                  padding: "3px 10px", borderRadius: T.rFull,
                  background: "rgba(239,68,68,0.09)",
                  border: `1px solid rgba(239,68,68,0.2)`,
                  color: T.coral,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 9.5, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}
              >
                Administrator
              </motion.span>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 48, background: T.border, flexShrink: 0, alignSelf: "center" }} />

          {/* Stats */}
          <div style={{ display: "flex", gap: 28, flexShrink: 0, flexWrap: "wrap" }}>
            <StatChip
              label="Member Since"
              value={user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
            />
            <StatChip
              label="Account"
              value={user.role === "admin" ? "Admin" : "Member"}
            />
          </div>
        </motion.div>

        {/* ── USER INFO ─────────────────────────────── */}
        <FadeUp delay={0.08} reduced={reduced}>
          <UserInfo user={user} />
        </FadeUp>

        {/* ── ADDRESS MANAGER ───────────────────────── */}
        <FadeUp delay={0.14} reduced={reduced}>
          <AddressManager />
        </FadeUp>

        {/* ── ACTION BUTTONS ────────────────────────── */}
        <FadeUp delay={0.2} reduced={reduced}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 12,
            justifyContent: "center",
            marginTop: 28, marginBottom: 56,
          }}>

            {/* Home */}
            <motion.button
              whileHover={reduced ? {} : { y: -2, boxShadow: T.shadowMd }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className="pf-focus"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 26px", borderRadius: T.rLg,
                background: T.surface, border: `1.5px solid ${T.border}`,
                color: T.ink, fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                boxShadow: T.shadow, transition: "box-shadow 0.2s",
              }}
            >
              <FiHome size={15} aria-hidden="true" /> Back to Home
            </motion.button>

            {/* Sign Out */}
            <motion.button
              whileHover={reduced ? {} : { y: -2, boxShadow: "0 8px 28px rgba(239,68,68,0.15)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="pf-focus"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 26px", borderRadius: T.rLg,
                background: T.coralBg,
                border: `1.5px solid rgba(239,68,68,0.2)`,
                color: T.coral, fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
            >
              <FiLogOut size={15} aria-hidden="true" /> Sign Out
            </motion.button>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}