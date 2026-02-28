/**
 * Wishlist.jsx — Premium Redesign
 *
 * Design: "Curation Gallery"
 * ─────────────────────────────────────────────────────────────
 * The wishlist is a personal collection — it deserves a gallery
 * feeling, not just a list. Key choices:
 *
 *   • Header: Editorial, centered, with a live item-count pill
 *     that animates in after the heading settles.
 *   • Grid: Responsive 1→2→3→4→5 cols; cards enter on a stagger
 *     arc with spring physics so they feel tactile.
 *   • Empty state: Floating heart with concentric ping rings and
 *     a gradient CTA button — evokes desire without being dramatic.
 *   • Card wrapper: Subtle lift + shadow bloom on hover; exit uses
 *     popLayout so removing an item feels satisfying, not jarring.
 *
 * Data contracts: Unchanged. Same props passed to EnhancedProductCard.
 * Tailwind classes are intentionally kept minimal — only layout/motion
 * utilities; all design tokens are in the T object below.
 */

import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { ThemeContext } from "../../context/ThemeContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import { FiHeart, FiArrowRight, FiShoppingBag } from "react-icons/fi";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS  (matches Orders redesign system)
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
  tealGlow:  "rgba(78,205,196,0.14)",
  rose:      "#FB7185",
  roseGlow:  "rgba(251,113,133,0.12)",
  shadow:    "0 1px 4px rgba(13,17,23,0.06), 0 4px 16px rgba(13,17,23,0.04)",
  shadowMd:  "0 6px 28px rgba(13,17,23,0.09), 0 1px 6px rgba(13,17,23,0.05)",
  shadowRose:"0 8px 32px rgba(251,113,133,0.22)",
  shadowTeal:"0 8px 32px rgba(78,205,196,0.22)",
  ease:      [0.16, 1, 0.3, 1],
  spring:    { type: "spring", stiffness: 300, damping: 30 },
  r:         16,
  rLg:       22,
  rXl:       28,
  rFull:     9999,
};

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once)
// ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

  .wl-focus:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(78,205,196,0.18), 0 0 0 1.5px #4ECDC4;
  }

  @keyframes wl-ping {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(2.2); opacity: 0;   }
  }
  .wl-ping-1 { animation: wl-ping 2s ease-out infinite; }
  .wl-ping-2 { animation: wl-ping 2s ease-out infinite 0.7s; }
`;

if (typeof document !== "undefined" && !document.getElementById("wl-styles")) {
  const el = document.createElement("style");
  el.id = "wl-styles";
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
// CARD CONTAINER — wraps EnhancedProductCard with our motion layer
// ─────────────────────────────────────────────────────────────
function AnimatedCardWrapper({ children, index, reduced }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduced ? 0 : 24, scale: reduced ? 1 : 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.88,
        y: reduced ? 0 : -12,
        transition: { duration: 0.22, ease: "easeIn" },
      }}
      transition={{
        opacity: { duration: 0.4, delay: reduced ? 0 : index * 0.06, ease: T.ease },
        y:       { duration: 0.45, delay: reduced ? 0 : index * 0.06, ease: T.ease },
        scale:   { duration: 0.45, delay: reduced ? 0 : index * 0.06, ease: T.ease },
        layout:  { duration: 0.3, ease: T.ease },
      }}
      whileHover={reduced ? {} : {
        y: -5,
        transition: { duration: 0.22, ease: T.ease },
      }}
      style={{
        borderRadius: T.r,
        overflow: "hidden",
        boxShadow: T.shadow,
        transition: "box-shadow 0.25s",
        willChange: "transform",
      }}
      onHoverStart={e => { e.currentTarget.style.boxShadow = T.shadowMd; }}
      onHoverEnd={e => { e.currentTarget.style.boxShadow = T.shadow; }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Wishlist() {
  const { user }                  = useContext(AuthContext);
  const { isDarkMode }            = useContext(ThemeContext);
  const { globalDiscount }        = useContext(CartContext);
  const [wishlist, setWishlist]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const reduced                   = useReducedMotion();

  useEffect(() => { fetchWishlist(); }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/api/user/wishlist`, { withCredentials: true });
      setWishlist(res.data);
    } catch (err) {
      console.error("Failed to fetch wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic removal — no API call needed here, EnhancedProductCard handles it
  const handleRemoveFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item._id !== productId));
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
      overflowX: "clip",
      paddingTop: 108,
      paddingBottom: 80,
      paddingLeft: 20,
      paddingRight: 20,
      position: "relative",
    }}>
      {/* ── Ambient background spheres ─────────────────── */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -240, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,113,133,0.05) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", bottom: -160, right: -160,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(78,205,196,0.05) 0%, transparent 65%)",
        }} />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* ── PAGE HEADER ────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: reduced ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: T.ease }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, letterSpacing: "0.22em" }}
            transition={{ duration: 0.7, ease: T.ease }}
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 10, fontWeight: 700, color: T.rose,
              textTransform: "uppercase", letterSpacing: "0.22em",
              marginBottom: 14, display: "block",
            }}
          >
            ✦ Your Personal Collection
          </motion.p>

          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
            fontWeight: 800, color: T.ink,
            letterSpacing: "-0.035em", lineHeight: 1.05, margin: 0,
          }}>
            My Wishlist
          </h1>

          {/* Item count badge */}
          <AnimatePresence>
            {wishlist.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ delay: 0.3, ...T.spring }}
                style={{ display: "inline-block", marginTop: 18 }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: T.rose,
                  background: T.roseGlow,
                  border: `1px solid rgba(251,113,133,0.2)`,
                  padding: "6px 16px", borderRadius: T.rFull,
                }}>
                  <FiHeart size={11} />
                  {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative rule */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, marginTop: 20,
          }}>
            <div style={{ width: 48, height: 1, background: `linear-gradient(to right, transparent, ${T.border})` }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.rose, opacity: 0.5 }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.teal }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.rose, opacity: 0.5 }} />
            <div style={{ width: 48, height: 1, background: `linear-gradient(to left, transparent, ${T.border})` }} />
          </div>
        </motion.header>

        {/* ── EMPTY STATE ──────────────────────────────── */}
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: T.ease }}
            style={{
              maxWidth: 420, margin: "0 auto",
              background: T.surface,
              borderRadius: T.rXl,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowMd,
              padding: "64px 40px",
              textAlign: "center",
            }}
          >
            {/* Pulsing heart icon */}
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
              {/* Ping rings */}
              <div
                className="wl-ping-1"
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "1px solid rgba(251,113,133,0.3)",
                }}
              />
              <div
                className="wl-ping-2"
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "1px solid rgba(251,113,133,0.2)",
                }}
              />
              {/* Core */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: T.roseGlow,
                border: `1px solid rgba(251,113,133,0.18)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.rose,
              }}>
                <FiHeart size={30} />
              </div>
            </div>

            <h2 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 22, fontWeight: 700, color: T.ink,
              margin: "0 0 12px", letterSpacing: "-0.02em",
            }}>
              Nothing saved yet
            </h2>
            <p style={{
              fontSize: 14, color: T.inkSoft, lineHeight: 1.7,
              margin: "0 0 32px", maxWidth: 290, marginLeft: "auto", marginRight: "auto",
            }}>
              You haven't saved any fresh catches yet.
              Dive in and heart what you love!
            </p>

            <Link
              to="/products"
              className="wl-focus"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px",
                background: T.teal, color: T.surface,
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700, fontSize: 14,
                borderRadius: T.rLg, textDecoration: "none",
                boxShadow: T.shadowTeal,
                transition: "box-shadow 0.22s, transform 0.18s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(78,205,196,0.32)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = T.shadowTeal;
              }}
            >
              <FiShoppingBag size={15} />
              Start Exploring
              <FiArrowRight size={14} />
            </Link>
          </motion.div>

        ) : (
          /* ── PRODUCT GRID ─────────────────────────────── */
          <motion.div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 22,
            }}
          >
            <AnimatePresence mode="popLayout">
              {wishlist.map((product, index) => (
                <AnimatedCardWrapper
                  key={product._id}
                  index={index}
                  reduced={reduced}
                >
                  <EnhancedProductCard
                    product={product}
                    onWishlistChange={handleRemoveFromWishlist}
                    isWishlistMode={true}
                    globalDiscount={globalDiscount}
                  />
                </AnimatedCardWrapper>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}