// src/pages/Home.jsx
import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion, useScroll, useTransform, useInView,
  useSpring, AnimatePresence,
} from "framer-motion";
import axios from "axios";
import {
  ArrowRight, Star, ShieldCheck, Truck,
  Thermometer, Utensils, Fish, Anchor, ChevronDown, Zap,
} from "lucide-react";
import { FiChevronRight, FiShoppingCart } from "react-icons/fi";
import toast from "react-hot-toast";
import { CartContext } from "../context/CartContext";
import EnhancedProductCard from "../components/EnhancedProductCard";
import TrendingProducts from "../components/TrendingProducts";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── Palette ────────────────────────────────────────────
// #5BBFB5  Seafoam
// #7EB8D4  Sky
// #F07468  Coral accent
// #1A2E2C  Deep tide
// #6B8F8A  Drift
// #B8CFCC  Foam
// #E2EEEC  Mist
// #F4F9F8  Off-white
// ────────────────────────────────────────────────────────

// ─── Global styles ───────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap');
    .home-root * { box-sizing: border-box; }
    .home-root { font-family: 'Manrope', sans-serif; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .category-panel { transition: flex 0.7s cubic-bezier(0.25, 1, 0.5, 1); }
    .feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(91,191,181,0.12); }
    .review-card:hover { transform: translateY(-3px); border-color: #B8DDD9; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(91,191,181,0.10); }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes drift { 0%{transform:translateX(-100px) rotate(0deg)} 100%{transform:translateX(calc(100vw + 100px)) rotate(5deg)} }
    @keyframes counter-count { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

// ─── Section reveal wrapper ──────────────────────────────
const Reveal = ({ children, delay = 0, direction = "up", style = {} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const from = {
    up:    { y: 32, x: 0 },
    left:  { y: 0,  x: -32 },
    right: { y: 0,  x: 32 },
    scale: { y: 0,  x: 0, scale: 0.96 },
  }[direction] ?? { y: 32, x: 0 };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...from }}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// ─── Stagger grid ────────────────────────────────────────
const StaggerGrid = ({ children, cols = "repeat(auto-fill, minmax(240px,1fr))", gap = "20px" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      style={{ display: "grid", gridTemplateColumns: cols, gap }}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
    }}
    style={{ height: "100%" }}
  >
    {children}
  </motion.div>
);

// ─── Animated counter ────────────────────────────────────
const Counter = ({ to, suffix = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 55, damping: 22 });
  const [val, setVal] = useState(0);
  useEffect(() => { if (inView) spring.set(to); }, [inView, to, spring]);
  useEffect(() => spring.on("change", v => setVal(Math.round(v))), [spring]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ─── Section header ──────────────────────────────────────
const SectionHeader = ({ eyebrow, title, subtitle, center = true }) => (
  <div style={{ textAlign: center ? "center" : "left", marginBottom: "48px" }}>
    {eyebrow && (
      <p style={{ fontSize: "11px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
        {eyebrow}
      </p>
    )}
    <h2 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "600", color: "#1A2E2C", letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: subtitle ? "12px" : 0 }}>
      {title}
    </h2>
    {subtitle && (
      <p style={{ fontSize: "15px", color: "#6B8F8A", maxWidth: "480px", margin: center ? "0 auto" : 0, lineHeight: "1.7" }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════
//  HERO SECTION
// ═══════════════════════════════════════════════════════════
const Hero = () => {
  const { scrollY } = useScroll();
  const y     = useTransform(scrollY, [0, 600], [0, 80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section style={{
      minHeight: "100vh",
      background: "#F4F9F8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "120px 24px 80px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background: soft radial ocean wash */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,191,181,0.10) 0%, transparent 70%)",
      }} />

      {/* Floating sand-beige ring decorations */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "15%", right: "8%",
          width: "200px", height: "200px",
          border: "40px solid rgba(91,191,181,0.07)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ y: [8, -8, 8] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute", bottom: "20%", left: "6%",
          width: "140px", height: "140px",
          border: "28px solid rgba(126,184,212,0.08)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />

      {/* Gentle drifting fish */}
      {[0.8, 0.5, 0.65].map((opacity, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${20 + i * 28}%`,
            left: "-80px",
            animation: `drift ${18 + i * 6}s linear infinite`,
            animationDelay: `${i * 5}s`,
            opacity,
            color: "rgba(91,191,181,0.18)",
            pointerEvents: "none",
          }}
        >
          <Fish size={32 + i * 12} strokeWidth={1} />
        </div>
      ))}

      {/* Hero content */}
      <motion.div
        style={{ y, opacity, textAlign: "center", position: "relative", zIndex: 1, maxWidth: "760px" }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: "11px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "20px" }}
        >
          The Ocean's Finest · Fresh Daily
        </motion.p>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "clamp(48px, 9vw, 96px)",
            fontWeight: "700",
            color: "#1A2E2C",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: "24px",
          }}
        >
          Fresh from<br />
          <em style={{ color: "#5BBFB5", fontStyle: "italic" }}>the sea</em>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ fontSize: "17px", color: "#6B8F8A", lineHeight: "1.8", marginBottom: "40px", maxWidth: "520px", margin: "0 auto 40px" }}
        >
          Premium seafood sourced sustainably from the Andhra Pradesh coastline,<br />
          delivered fresh to your kitchen.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link to="/products" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 12px 32px rgba(91,191,181,0.20)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "14px 32px",
                background: "#1A2E2C", color: "#fff",
                border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: "700",
                cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                transition: "background 0.2s",
              }}
            >
              Shop Fresh Catch
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
                <ArrowRight size={14} />
              </motion.span>
            </motion.button>
          </Link>
          <Link to="/products?category=Fish" style={{ textDecoration: "none" }}>
            <motion.button
              whileHover={{ scale: 1.04, borderColor: "#5BBFB5" }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "14px 28px",
                background: "transparent", color: "#1A2E2C",
                border: "1.5px solid #E2EEEC", borderRadius: "12px",
                fontSize: "14px", fontWeight: "600",
                cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                transition: "all 0.2s",
              }}
            >
              View Categories
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginTop: "48px", flexWrap: "wrap" }}
        >
          {[
            { icon: "⭐", label: "4.8/5 Rating" },
            { icon: "🚚", label: "Same-day dispatch" },
            { icon: "🧊", label: "Cold-chain delivery" },
            { icon: "✅", label: "Quality guaranteed" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#6B8F8A" }}>{item.label}</span>
              {i < 3 && <span style={{ width: "1px", height: "12px", background: "#E2EEEC", marginLeft: "12px" }} />}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
      >
        <span style={{ fontSize: "10px", fontWeight: "600", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.12em" }}>Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <ChevronDown size={16} style={{ color: "#B8CFCC" }} />
        </motion.div>
      </motion.div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
//  MARQUEE STRIP
// ═══════════════════════════════════════════════════════════
const MarqueeStrip = () => {
  const items = [
    "Fresh Catch Daily", "🌊", "Sustainable Seafood",
    "Ocean to Table", "🐟", "Cold-Chain Delivery",
    "Premium Quality", "🦐", "Chef Approved",
  ];

  return (
    <div style={{
      background: "#1A2E2C", overflow: "hidden", padding: "14px 0",
      position: "relative",
    }}>
      <motion.div
        animate={{ x: "-50%" }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        style={{ display: "flex", gap: "48px", whiteSpace: "nowrap", width: "max-content" }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ fontSize: "11px", fontWeight: "700", color: "rgba(91,191,181,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  CATEGORY PANEL
// ═══════════════════════════════════════════════════════════
const CATEGORIES = [
  { label: "Premium Fish",  img: "/fish.png",  path: "/products?category=Fish",  emoji: "🐟", color: "#7EB8D4", tagline: "Wild-caught daily" },
  { label: "Jumbo Prawns",  img: "/prawn.png", path: "/products?category=Prawn", emoji: "🦐", color: "#5BBFB5", tagline: "Perfect for grilling" },
  { label: "Live Crabs",    img: "/crab.png",  path: "/products?category=Crab",  emoji: "🦀", color: "#F07468", tagline: "Soft-shell delicacies" },
];

const CategoryPanel = () => {
  const [hovered, setHovered] = useState(1);

  return (
    <section style={{ padding: "80px 24px", background: "#F4F9F8" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Reveal>
          <SectionHeader eyebrow="Browse" title="Shop by Category" subtitle="Select your favourite fresh catch from our daily sourced collection." />
        </Reveal>

        <div style={{ display: "flex", gap: "12px", height: "440px" }}>
          {CATEGORIES.map((cat, i) => (
            <Link
              key={i}
              to={cat.path}
              className="category-panel"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(1)}
              style={{
                flex: hovered === i ? "4" : "1",
                textDecoration: "none",
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                background: "#fff",
                border: `1.5px solid ${hovered === i ? cat.color + "40" : "#E2EEEC"}`,
                boxShadow: hovered === i ? `0 16px 48px ${cat.color}20` : "0 2px 8px rgba(26,46,44,0.04)",
                transition: "flex 0.7s cubic-bezier(0.25,1,0.5,1), box-shadow 0.3s, border-color 0.3s",
                cursor: "pointer",
              }}
            >
              {/* Color bar at top */}
              <div style={{ height: "4px", background: cat.color, opacity: hovered === i ? 1 : 0.3, transition: "opacity 0.3s" }} />

              {/* Image area */}
              <div style={{
                height: "55%",
                background: "#F4F9F8",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "24px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle, ${cat.color}10 0%, transparent 70%)`, transition: "opacity 0.4s", opacity: hovered === i ? 1 : 0 }} />
                <motion.img
                  src={cat.img}
                  alt={cat.label}
                  animate={{ scale: hovered === i ? 1.08 : 0.85, filter: hovered === i ? "grayscale(0)" : "grayscale(0.5) opacity(0.7)" }}
                  transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                  style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "160px" }}
                />
              </div>

              {/* Content */}
              <div style={{ padding: "20px 24px" }}>
                <span style={{ fontSize: "20px", display: "block", marginBottom: "6px" }}>{cat.emoji}</span>
                <h3 style={{
                  fontFamily: "'Lora', serif", fontSize: hovered === i ? "22px" : "16px",
                  fontWeight: "600", color: "#1A2E2C", marginBottom: "4px",
                  transition: "font-size 0.5s ease",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {cat.label}
                </h3>
                <motion.div
                  animate={{ opacity: hovered === i ? 1 : 0, y: hovered === i ? 0 : 8 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", color: cat.color, fontSize: "12px", fontWeight: "700" }}
                >
                  {cat.tagline} <ArrowRight size={12} />
                </motion.div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
//  HAPPY HOUR / PROMO BANNER
// ═══════════════════════════════════════════════════════════
const PromoBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      if (diff > 0) {
        setTimeLeft({
          h: Math.floor(diff / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = v => String(v).padStart(2, "0");

  return (
    <section style={{ padding: "0 24px 80px", background: "#F4F9F8" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Reveal>
          <div style={{
            background: "#fff",
            border: "1.5px solid #E2EEEC",
            borderRadius: "20px",
            padding: "48px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Soft seafoam glow */}
            <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,191,181,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* Left: copy */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FEE2E2", borderRadius: "20px", padding: "4px 12px", marginBottom: "16px" }}>
                <Zap size={11} style={{ color: "#DC2626" }} />
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.08em" }}>Today's Deal</span>
              </div>
              <h2 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: "700", color: "#1A2E2C", letterSpacing: "-0.025em", marginBottom: "12px", lineHeight: 1.2 }}>
                Order above <span style={{ color: "#5BBFB5" }}>₹1,699</span> &<br />save 10% today
              </h2>
              <p style={{ fontSize: "14px", color: "#6B8F8A", marginBottom: "20px", lineHeight: 1.6 }}>
                Use coupon code at checkout. Limited time offer.
              </p>
              {/* Coupon */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "#F4F9F8", border: "1.5px dashed #5BBFB5", borderRadius: "10px", padding: "10px 20px" }}>
                <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "800", color: "#5BBFB5", letterSpacing: "0.06em" }}>SEABITE10</span>
                <button
                  onClick={() => { navigator.clipboard.writeText("SEABITE10"); toast.success("Copied!", { style: { borderRadius: "10px", fontSize: "13px" } }); }}
                  style={{ fontSize: "11px", fontWeight: "700", color: "#6B8F8A", background: "none", border: "none", cursor: "pointer", fontFamily: "'Manrope', sans-serif", textDecoration: "underline" }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Right: countdown + CTA */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", position: "relative", zIndex: 1 }}>
              {/* Countdown */}
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "10px", fontWeight: "700", color: "#B8CFCC", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Offer ends in</p>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {[{ val: timeLeft.h, label: "HR" }, { val: timeLeft.m, label: "MIN" }, { val: timeLeft.s, label: "SEC" }].map((unit, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {i > 0 && <span style={{ fontSize: "24px", fontWeight: "800", color: "#E2EEEC" }}>:</span>}
                      <div style={{ textAlign: "center" }}>
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={unit.val}
                            initial={{ y: -16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 16, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{
                              background: "#F4F9F8", border: "1.5px solid #E2EEEC",
                              borderRadius: "10px", padding: "10px 14px",
                              fontSize: "28px", fontWeight: "800", color: "#1A2E2C",
                              minWidth: "56px", textAlign: "center",
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            {pad(unit.val)}
                          </motion.div>
                        </AnimatePresence>
                        <p style={{ fontSize: "9px", fontWeight: "700", color: "#B8CFCC", marginTop: "5px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{unit.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/products" style={{ textDecoration: "none" }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "12px 28px", background: "#1A2E2C", color: "#fff",
                    border: "none", borderRadius: "10px",
                    fontSize: "14px", fontWeight: "700", cursor: "pointer",
                    fontFamily: "'Manrope', sans-serif", transition: "background 0.2s",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}
                >
                  Grab the Deal <ArrowRight size={14} />
                </motion.button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
//  PRODUCT ROW
// ═══════════════════════════════════════════════════════════
const ProductRow = ({ title, filterType, eyebrow }) => {
  const [products, setProducts] = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then(res => {
      const all = res.data.products || [];
      setGlobalDiscount(res.data.globalDiscount || 0);
      const filtered = filterType === "Fish"
        ? all.filter(p => p.category === "Fish").slice(0, 4)
        : all.filter(p => p.category === "Prawn" || p.category === "Crab").slice(0, 4);
      setProducts(filtered);
    }).catch(() => {});
  }, [filterType]);

  if (!products.length) return null;

  return (
    <section style={{ padding: "0 24px 80px", background: "#fff" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              center={false}
            />
            <Link
              to="/products"
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "13px", fontWeight: "700", color: "#5BBFB5",
                textDecoration: "none", marginBottom: "48px", flexShrink: 0,
              }}
            >
              See all <FiChevronRight size={14} />
            </Link>
          </div>
        </Reveal>

        <StaggerGrid>
          {products.map(p => (
            <StaggerItem key={p._id}>
              <EnhancedProductCard product={p} globalDiscount={globalDiscount} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
//  WHY SEABITE
// ═══════════════════════════════════════════════════════════
const WhySeaBite = () => {
  const features = [
    { icon: <ShieldCheck size={20} />, title: "Quality Guaranteed",     desc: "Every batch is lab-tested and certified for freshness and safety.", color: "#5BBFB5", bg: "#F0FBF9" },
    { icon: <Thermometer  size={20} />, title: "Cold Chain Delivery",    desc: "Temperature-controlled packaging from ocean to your doorstep.",    color: "#7EB8D4", bg: "#EBF6FC" },
    { icon: <Truck        size={20} />, title: "Same Day Dispatch",      desc: "Orders before 2 PM ship same day for maximum freshness.",           color: "#F59E0B", bg: "#FEF3C7" },
    { icon: <Utensils     size={20} />, title: "Chef Approved",          desc: "Trusted by 500+ restaurants and home cooks across the coast.",     color: "#F07468", bg: "#FFF5F4" },
  ];

  const stats = [
    { val: 100, suffix: "+", label: "Happy Customers" },
    { val: 20,  suffix: "+", label: "Varieties" },
    { val: 98,  suffix: "%", label: "Freshness Score" },
    { val: 4,   suffix: ".8★", label: "Average Rating" },
  ];

  return (
    <section style={{ padding: "80px 24px", background: "#F4F9F8" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Reveal>
          <SectionHeader
            eyebrow="Our Promise"
            title="Why SeaBite?"
            subtitle="We set the standard so you can taste the difference with every bite."
          />
        </Reveal>

        {/* Stats row */}
        <Reveal direction="scale" style={{ marginBottom: "48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
            {stats.map((s, i) => (
              <div
                key={i}
                className="stat-card"
                style={{
                  background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px",
                  padding: "28px 20px", textAlign: "center",
                  transition: "all 0.25s ease",
                  boxShadow: "0 2px 8px rgba(91,191,181,0.05)",
                }}
              >
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "36px", fontWeight: "800", color: "#1A2E2C", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "8px" }}>
                  <Counter to={s.val} suffix={s.suffix} />
                </p>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Feature cards */}
        <StaggerGrid cols="repeat(4,1fr)" gap="16px">
          {features.map((f, i) => (
            <StaggerItem key={i}>
              <div
                className="feature-card"
                style={{
                  background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px",
                  padding: "28px 24px", height: "100%",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ width: "44px", height: "44px", background: f.bg, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: "18px" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1A2E2C", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "13px", color: "#6B8F8A", lineHeight: "1.7" }}>{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
//  REVIEWS
// ═══════════════════════════════════════════════════════════
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`)
      .then(res => { setReviews(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section style={{ padding: "80px 24px", background: "#fff" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <Reveal>
          <SectionHeader
            eyebrow="Customer Reviews"
            title="Loved by seafood lovers"
            subtitle="Real words from real customers across the coast."
          />
        </Reveal>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: "200px", borderRadius: "16px", background: "linear-gradient(90deg, #E2EEEC 25%, #EDF5F3 50%, #E2EEEC 75%)", backgroundSize: "200% 100%", animation: `shimmer 1.6s infinite ${i * 0.15}s` }} />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <StaggerGrid cols="repeat(3,1fr)" gap="20px">
            {reviews.map((r, i) => (
              <StaggerItem key={i}>
                <div
                  className="review-card"
                  style={{
                    background: "#F4F9F8", border: "1.5px solid #E2EEEC", borderRadius: "16px",
                    padding: "28px", height: "100%",
                    transition: "all 0.25s ease",
                  }}
                >
                  {/* Stars */}
                  <div style={{ display: "flex", gap: "3px", marginBottom: "16px" }}>
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={14} style={{ color: s < r.rating ? "#F59E0B" : "#E2EEEC" }} fill={s < r.rating ? "#F59E0B" : "none"} />
                    ))}
                  </div>
                  <p style={{ fontSize: "14px", color: "#6B8F8A", lineHeight: "1.8", fontStyle: "italic", marginBottom: "20px" }}>
                    "{r.comment}"
                  </p>
                  {/* Reviewer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #5BBFB5, #7EB8D4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: "800", fontSize: "13px", flexShrink: 0,
                    }}>
                      {r.userName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{r.userName}</p>
                      <p style={{ fontSize: "11px", color: "#5BBFB5", fontWeight: "600", margin: 0, marginTop: "2px" }}>{r.productName}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <div style={{ textAlign: "center", padding: "48px", border: "1.5px dashed #E2EEEC", borderRadius: "16px" }}>
            <p style={{ color: "#B8CFCC", fontSize: "14px" }}>🎣 Reviews coming soon!</p>
          </div>
        )}
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════
//  FINAL CTA
// ═══════════════════════════════════════════════════════════
const FinalCTA = () => (
  <section style={{ padding: "80px 24px", background: "#F4F9F8" }}>
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <Reveal>
        <div style={{
          background: "#1A2E2C",
          borderRadius: "24px",
          padding: "80px 48px",
          textAlign: "center",
          position: "relative", overflow: "hidden",
        }}>
          {/* Ambient rings */}
          <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "240px", height: "240px", border: "40px solid rgba(91,191,181,0.08)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "320px", height: "320px", border: "60px solid rgba(126,184,212,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

          <p style={{ fontSize: "11px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px", position: "relative", zIndex: 1 }}>
            Fresh Every Morning
          </p>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "700", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "20px", position: "relative", zIndex: 1 }}>
            Experience the true taste<br />
            <em style={{ color: "#5BBFB5" }}>of the ocean.</em>
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", maxWidth: "480px", margin: "0 auto 36px", lineHeight: "1.8", position: "relative", zIndex: 1 }}>
            From the Andhra coastline to your kitchen — premium quality, responsibly sourced, delivered fresh.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", position: "relative", zIndex: 1 }}
          >
            <Link to="/products" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 16px 48px rgba(91,191,181,0.25)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "14px 36px", background: "#5BBFB5", color: "#fff",
                  border: "none", borderRadius: "12px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  fontFamily: "'Manrope', sans-serif", transition: "background 0.2s",
                  display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                Start Your Order <ArrowRight size={14} />
              </motion.button>
            </Link>
            <Link to="/about" style={{ textDecoration: "none" }}>
              <motion.button
                whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.4)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "14px 28px",
                  background: "transparent", color: "rgba(255,255,255,0.7)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px", fontSize: "14px", fontWeight: "600",
                  cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                Our Story
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </Reveal>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════
//  SCROLL TO TOP
// ═══════════════════════════════════════════════════════════
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed", bottom: "28px", right: "28px", zIndex: 50,
            width: "44px", height: "44px",
            background: "#1A2E2C", color: "#fff",
            border: "none", borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 8px 24px rgba(26,46,44,0.20)",
          }}
        >
          <ChevronDown size={18} style={{ transform: "rotate(180deg)" }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════
export default function Home() {
  return (
    <>
      <GlobalStyles />
      <div
        className="home-root"
        style={{ background: "#F4F9F8", minHeight: "100vh", color: "#1A2E2C" }}
      >
        <Hero />
        <MarqueeStrip />
        <CategoryPanel />
        <PromoBanner />

        {/* White section wrapper for product rows */}
        <div style={{ background: "#fff", paddingTop: "80px" }}>
          <ProductRow
            title="Fresh From The Nets"
            filterType="Fish"
            eyebrow="Daily Catch"
          />
          <ProductRow
            title="Shellfish Specials"
            filterType="Shellfish"
            eyebrow="Hand-Picked"
          />
        </div>

        <TrendingProducts />
        <Reviews />
        <WhySeaBite />
        <FinalCTA />
        <ScrollToTop />
      </div>
    </>
  );
}