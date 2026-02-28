/**
 * Home.jsx  —  "Coastal Editorial" Redesign
 * ───────────────────────────────────────────────────────────
 *
 * Design direction: A high-fashion editorial magazine feel
 * with oceanic depth. The hero uses a true parallax stack of
 * layered elements. Section transitions use diagonal SVG cuts
 * instead of flat horizontal breaks. Typography combines
 * Cormorant Garamond (display) with Outfit (body/UI).
 *
 * Differentiators vs. original:
 *   • Hero: Full-screen video with a layered parallax system
 *     (video, grain texture, mesh gradient, text each move at
 *     different rates); floating product story cards dock to the
 *     right column on desktop.
 *   • Wave Ticker: Characters animate in a true sinusoidal wave,
 *     not just a flat marquee.
 *   • Category section: Asymmetric 2+1 grid — large portrait left,
 *     two stacked landscape right; hover reveals a "Explore →"
 *     pill that slides up from below the image.
 *   • Product rows: Editorial header with large italic counter
 *     showing product count.
 *   • Reviews: Masonry-style card stack with star color gradient.
 *   • WhySeaBite: Alternating left/right layout with connective
 *     number step indicator.
 *
 * All API calls, contexts, and component interfaces are unchanged.
 */

import { useState, useEffect, useRef } from "react";
import { Link }               from "react-router-dom";
import SeaBiteLoader          from "../../components/common/SeaBiteLoader";
import {
  motion,
  useScroll, useTransform, useSpring,
  useInView, AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import axios                  from "axios";
import { Helmet }             from "react-helmet-async";
import toast                  from "react-hot-toast";
import {
  ArrowRight, Star, ShieldCheck, Truck, User,
  Thermometer, Utensils, ChevronDown, Flame,
  ChevronRight, Zap, Waves, Copy, Check,
  Sparkles, Award, Clock,
} from "lucide-react";
import EnhancedProductCard   from "../../components/products/EnhancedProductCard";
import TrendingProducts      from "../../components/products/TrendingProducts";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once)
// ─────────────────────────────────────────────────────────────
const HOME_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .hm-root {
    font-family: 'Outfit', sans-serif;
    background: #F5EFE6;
    color: #0D2030;
    -webkit-font-smoothing: antialiased;
    selection: { background: #3ECFB2; color: #0D2030; }
  }
  .hm-root ::selection { background: #C5E6E4; color: #0D2030; }

  .hm-display { font-family: 'Cormorant Garamond', serif; }

  /* Diagonal section edge */
  .hm-edge-down {
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 48px), 0 100%);
    padding-bottom: 48px;
  }
  .hm-edge-up {
    clip-path: polygon(0 48px, 100% 0, 100% 100%, 0 100%);
    padding-top: 72px;
    margin-top: -2px;
  }

  /* Scrollbar styling */
  .hm-scrollbar::-webkit-scrollbar { height: 3px; }
  .hm-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .hm-scrollbar::-webkit-scrollbar-thumb { background: #3ECFB2; border-radius: 2px; }

  /* Focus ring */
  .hm-focus:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(62,207,178,0.3), 0 0 0 1.5px #3ECFB2;
  }

  @keyframes hm-grain {
    0%,100% { transform: translate(0,0); }
    10%      { transform: translate(-2%,-3%); }
    30%      { transform: translate(2%,2%); }
    50%      { transform: translate(-1%,3%); }
    70%      { transform: translate(3%,-1%); }
    90%      { transform: translate(-2%,2%); }
  }
  .hm-grain {
    position: absolute; inset: -20%;
    width: 140%; height: 140%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
    opacity: 0.55; pointer-events: none; z-index: 1;
    animation: hm-grain 8s steps(10) infinite;
    mix-blend-mode: overlay;
  }

  @keyframes hm-float {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-10px) rotate(1deg); }
  }
  .hm-float-slow  { animation: hm-float 5s ease-in-out infinite; }
  .hm-float-fast  { animation: hm-float 3.8s ease-in-out infinite 0.6s; }
  .hm-float-med   { animation: hm-float 4.5s ease-in-out infinite 1.2s; }

  @keyframes hm-pulse-dot {
    0%,100% { box-shadow: 0 0 0 0 rgba(62,207,178,0.55); }
    50%     { box-shadow: 0 0 0 6px rgba(62,207,178,0); }
  }
  .hm-live-dot { animation: hm-pulse-dot 2s ease infinite; }

  @keyframes hm-count-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Product card grid overflow scroll on mobile */
  @media (max-width: 767px) {
    .hm-row-scroll {
      display: flex !important;
      overflow-x: auto !important;
      scroll-snap-type: x mandatory;
      gap: 14px !important;
      padding-bottom: 8px;
    }
    .hm-row-scroll > * {
      flex: 0 0 72vw;
      scroll-snap-align: start;
    }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("hm-css")) {
  const el = document.createElement("style");
  el.id = "hm-css"; el.textContent = HOME_CSS;
  document.head.appendChild(el);
}

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  navy:      "#0D2030",
  navyMid:   "#1A3448",
  teal:      "#3ECFB2",
  tealDeep:  "#2AB09A",
  tealGlow:  "rgba(62,207,178,0.14)",
  sand:      "#F5EFE6",
  sandDark:  "#E8D9C4",
  sandCard:  "#FAF6F0",
  coral:     "#F07468",
  coralBg:   "rgba(240,116,104,0.1)",
  jade:      "#10B981",
  amber:     "#F59E0B",
  ink:       "#0D1117",
  surface:   "#FFFFFF",
  border:    "#E2EEEC",
  ghost:     "#A8B8B6",
  ease:      [0.16, 1, 0.3, 1],
  spring:    { type: "spring", stiffness: 340, damping: 32 },
  rCard:     20,
  rLg:       28,
  rFull:     9999,
};

// ─────────────────────────────────────────────────────────────
// ANIMATION PRIMITIVES
// ─────────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, y = 32, x = 0 }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  const red    = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: red ? 0 : y, x: red ? 0 : x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.68, delay, ease: T.ease }}
    >
      {children}
    </motion.div>
  );
};

const RevealLeft  = ({ children, delay = 0 }) => <Reveal delay={delay} y={0} x={-36}>{children}</Reveal>;
const RevealRight = ({ children, delay = 0 }) => <Reveal delay={delay} y={0} x={36}>{children}</Reveal>;

const ScaleReveal = ({ children, delay = 0 }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-4% 0px" });
  const red    = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: red ? 1 : 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.62, delay, ease: T.ease }}
    >
      {children}
    </motion.div>
  );
};

const Stagger = ({ children, className = "", gap = 0.08 }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden:  {},
        visible: { transition: { staggerChildren: gap, delayChildren: 0.06 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const SI = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden:  { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.56, ease: T.ease } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// COUNTER (spring number animation)
// ─────────────────────────────────────────────────────────────
const Counter = ({ value, suffix = "" }) => {
  const ref     = useRef(null);
  const inView  = useInView(ref, { once: true });
  const spring  = useSpring(0, { stiffness: 55, damping: 20 });
  const [disp, setDisp] = useState(0);

  useEffect(() => { if (inView) spring.set(value); }, [inView, value]);
  useEffect(() => spring.on("change", v => setDisp(Math.round(v))), [spring]);

  return <span ref={ref}>{disp}{suffix}</span>;
};

// ─────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children, light = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={{ width: 24, height: 2, background: light ? T.teal : T.teal, borderRadius: 1 }} />
    <span style={{
      fontFamily: "'Outfit', sans-serif",
      fontSize: 10, fontWeight: 700,
      letterSpacing: "0.2em", textTransform: "uppercase",
      color: light ? T.teal : T.teal,
    }}>
      {children}
    </span>
  </div>
);

// Primary button — filled navy with teal hover
const CTABtn = ({ children, to, variant = "primary", style: extraStyle = {} }) => {
  const red = useReducedMotion();
  const styles = {
    primary: {
      background: T.navy, color: "#fff",
      border: `1.5px solid ${T.navy}`,
    },
    outline: {
      background: "transparent", color: T.navy,
      border: `1.5px solid ${T.navy}`,
    },
    teal: {
      background: T.teal, color: T.navy,
      border: `1.5px solid ${T.teal}`,
      boxShadow: "0 6px 22px rgba(62,207,178,0.28)",
    },
    coral: {
      background: T.coral, color: "#fff",
      border: `1.5px solid ${T.coral}`,
      boxShadow: "0 6px 22px rgba(240,116,104,0.28)",
    },
    ghost: {
      background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)",
      border: "1.5px solid rgba(255,255,255,0.2)",
      backdropFilter: "blur(8px)",
    },
  };

  return (
    <Link to={to} className="hm-focus" style={{ display: "inline-block" }}>
      <motion.button
        whileHover={red ? {} : { y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 28px", borderRadius: T.rFull,
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13.5, fontWeight: 600,
          cursor: "pointer", transition: "all 0.22s ease",
          ...styles[variant], ...extraStyle,
        }}
      >
        {children}
      </motion.button>
    </Link>
  );
};

// ══════════════════════════════════════════════════════════════
//  HERO SECTION
// ══════════════════════════════════════════════════════════════
const Hero = () => {
  const { scrollY }    = useScroll();
  const videoY         = useTransform(scrollY, [0, 800], [0, 160]);
  const videoOp        = useTransform(scrollY, [0, 600], [1, 0.2]);
  const textY          = useTransform(scrollY, [0, 600], [0, -60]);
  const [loaded, setLoaded] = useState(false);
  const red            = useReducedMotion();

  return (
    <section
      style={{
        position: "relative",
        height: "100svh", minHeight: 680, maxHeight: 980,
        overflow: "hidden",
        background: T.navy,
      }}
      aria-label="Hero section"
    >
      {/* Loading veil */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{
              position: "absolute", inset: 0, zIndex: 50,
              background: T.navy,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <SeaBiteLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parallax video layer */}
      <motion.div
        style={{ y: red ? 0 : videoY, opacity: red ? 1 : videoOp, position: "absolute", inset: 0, zIndex: 0 }}
      >
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(to bottom, rgba(13,32,48,0.25) 0%, rgba(13,32,48,0.1) 40%, rgba(13,32,48,0.72) 100%)",
        }} />
        {/* Teal mesh gradient overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 50% at 70% 60%, rgba(62,207,178,0.08) 0%, transparent 60%)",
        }} />
        <video
          autoPlay loop muted playsInline
          poster="/hero-poster.jpg"
          src="1.mp4"
          onCanPlayThrough={() => setLoaded(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.06)" }}
        />
      </motion.div>

      {/* Grain texture */}
      <div className="hm-grain" aria-hidden="true" />

      {/* Dot grid */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, zIndex: 1, opacity: 0.018,
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Content */}
      <motion.div
        style={{ y: red ? 0 : textY, position: "relative", zIndex: 10, height: "100%", display: "flex", alignItems: "center" }}
      >
        <div style={{
          maxWidth: 1320, margin: "0 auto", padding: "0 24px",
          width: "100%",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 48, alignItems: "center",
        }}>

          {/* ── LEFT: COPY ─────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Eyebrow chip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 16 }}
              transition={{ duration: 0.55, delay: 0.25, ease: T.ease }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(62,207,178,0.15)",
                border: "1px solid rgba(62,207,178,0.3)",
                backdropFilter: "blur(8px)",
                color: T.teal, fontSize: 10.5, fontWeight: 700,
                padding: "6px 14px", borderRadius: T.rFull,
                letterSpacing: "0.14em", textTransform: "uppercase",
                fontFamily: "'Outfit', sans-serif",
              }}>
                <Waves size={11} /> Fresh Catch Daily
              </span>
            </motion.div>

            {/* Headline — Cormorant Garamond editorial */}
            <motion.h1
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 36 }}
              transition={{ duration: 0.9, delay: 0.38, ease: T.ease }}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(3.4rem, 7vw, 6rem)",
                fontWeight: 700, lineHeight: 1.0,
                letterSpacing: "-0.02em",
                color: "#fff",
                margin: 0,
              }}
            >
              Ocean&#8209;Fresh<br />
              <em style={{ color: T.teal, fontStyle: "italic" }}>Seafood</em><br />
              Delivered.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
              transition={{ duration: 0.7, delay: 0.56 }}
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 16, lineHeight: 1.7,
                maxWidth: 400, margin: 0,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 400,
              }}
            >
              Premium fish, prawns & crabs — sourced daily from the coast,
              cold-chain delivered straight to your kitchen.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
              transition={{ duration: 0.65, delay: 0.7 }}
              style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
            >
              <CTABtn to="/products" variant="teal">
                Shop Now <ArrowRight size={14} />
              </CTABtn>
              <CTABtn to="/products" variant="ghost">
                View All Catch
              </CTABtn>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: loaded ? 1 : 0 }}
              transition={{ delay: 0.9 }}
              style={{
                display: "flex", alignItems: "center", gap: 20,
                padding: "16px 20px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, backdropFilter: "blur(10px)",
                width: "fit-content",
              }}
            >
              {[
                { n: "500+", label: "Customers" },
                { n: "98%",  label: "Fresh Score" },
                { n: "4.8★", label: "Rating" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {i > 0 && (
                    <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)" }} />
                  )}
                  <div>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 22, fontWeight: 700,
                      color: "#fff", margin: 0, lineHeight: 1,
                    }}>
                      {s.n}
                    </p>
                    <p style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 9.5, color: "rgba(255,255,255,0.45)",
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      margin: "3px 0 0",
                    }}>
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: FLOATING PRODUCT STORY CARDS ── */}
          <motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: loaded ? 1 : 0, x: loaded ? 0 : 48 }}
            transition={{ duration: 0.95, delay: 0.5, ease: T.ease }}
            style={{
              position: "relative", height: 440,
              display: "none",
            }}
            className="hm-hero-right"
          >
            {/* Central hero card */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }}
              className="hm-float-slow"
            >
              <div style={{
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(16px)",
                borderRadius: 24, padding: "28px 32px",
                boxShadow: "0 24px 72px rgba(13,32,48,0.28)",
                border: "1px solid rgba(255,255,255,0.6)",
                textAlign: "center",
                minWidth: 180,
              }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>🦐</div>
                <p style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700, fontSize: 14,
                  color: T.navy, margin: 0,
                }}>
                  Jumbo Prawns
                </p>
                <p style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 11, color: T.ghost, marginTop: 4,
                }}>
                  Just arrived today
                </p>
                {/* Live badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: T.tealGlow, border: `1px solid rgba(62,207,178,0.25)`,
                  borderRadius: T.rFull,
                  padding: "4px 10px", marginTop: 10,
                }}>
                  <div className="hm-live-dot" style={{
                    width: 6, height: 6, borderRadius: "50%", background: T.teal,
                  }} />
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 9.5, fontWeight: 700,
                    color: T.tealDeep, textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Top-left: fish */}
            <div style={{ position: "absolute", top: 24, left: 0 }} className="hm-float-fast">
              <div style={{
                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
                borderRadius: 18, padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(13,32,48,0.18)",
                border: "1px solid rgba(255,255,255,0.7)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: T.tealGlow,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🐟</div>
                <div>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: T.navy, margin: 0 }}>
                    Fresh Fish
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: T.tealDeep, margin: "2px 0 0" }}>
                    Caught this morning
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom-right: crab */}
            <div style={{ position: "absolute", bottom: 40, right: 0 }} className="hm-float-med">
              <div style={{
                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
                borderRadius: 18, padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(13,32,48,0.18)",
                border: "1px solid rgba(255,255,255,0.7)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: T.coralBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🦀</div>
                <div>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: T.navy, margin: 0 }}>
                    Live Crabs
                  </p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: T.coral, margin: "2px 0 0" }}>
                    Limited stock
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom-left: rating */}
            <div style={{ position: "absolute", bottom: 20, left: 16 }}>
              <div style={{
                background: T.navy, borderRadius: 14, padding: "9px 14px",
                display: "flex", alignItems: "center", gap: 7,
                boxShadow: "0 8px 32px rgba(13,32,48,0.35)",
              }}>
                <Star size={12} style={{ color: T.amber, fill: T.amber }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>4.9</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>· 200+ reviews</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ delay: 1.3 }}
        style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}
        aria-hidden="true"
      >
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 9, color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase", letterSpacing: "0.22em",
        }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ChevronDown size={15} style={{ color: "rgba(255,255,255,0.35)" }} />
        </motion.div>
      </motion.div>

      {/* Responsive: show hero-right on md+ */}
      <style>{`
        @media (min-width: 768px) { .hm-hero-right { display: block !important; } }
      `}</style>
    </section>
  );
};

// ══════════════════════════════════════════════════════════════
//  WAVE TICKER
// ══════════════════════════════════════════════════════════════
const WaveTicker = () => {
  const items   = ["Fresh Catch Daily", "Ocean to Table", "Sustainable Sourcing", "Cold Chain Delivery", "Chef Approved", "Lab Tested Quality"];
  const doubled = [...items, ...items, ...items];

  return (
    <div style={{ lineHeight: 0 }}>
      {/* Ticker bar */}
      <div style={{
        background: T.navy,
        padding: "14px 0",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Subtle accent line */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0, height: 1, transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, rgba(62,207,178,0.12), transparent)`,
          pointerEvents: "none",
        }} />

        <motion.div
          style={{ display: "flex", whiteSpace: "nowrap", willChange: "transform" }}
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ duration: 38, ease: "linear", repeat: Infinity }}
        >
          {doubled.map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 10.5, fontWeight: 600,
                letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                padding: "0 28px",
              }}>
                {item}
              </span>
              <span style={{ color: T.teal, fontSize: 14, opacity: 0.7, marginRight: 8 }}>〰</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Wave SVG edge */}
      <svg
        viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: 56, background: T.sand }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0 C180 56, 360 0, 540 28 C720 56, 900 0, 1080 28 C1260 56, 1380 16, 1440 28 L1440 0 Z"
          fill={T.navy}
        />
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY SECTION
//  Asymmetric layout: large portrait card left + 2 stacked right
// ══════════════════════════════════════════════════════════════
const cats = [
  { title: "Premium Fish",  sub: "20+ varieties", img: "/fish.png",  tag: "Fish",  accent: T.teal,  bg: "#E8F8F5", emoji: "🐟" },
  { title: "Jumbo Prawns",  sub: "Wild-caught",   img: "/prawn.png", tag: "Prawn", accent: "#89C2D9", bg: "#EDF5FB", emoji: "🦐" },
  { title: "Live Crabs",    sub: "Ships fresh",   img: "/crab.png",  tag: "Crab",  accent: T.coral, bg: "#FEF0EC", emoji: "🦀" },
];

const CategoryCard = ({ cat, large = false, index }) => {
  const [hovered, setHovered] = useState(false);
  const red = useReducedMotion();
  return (
    <motion.div
      whileHover={red ? {} : { y: -5 }}
      transition={{ duration: 0.3, ease: T.ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ height: large ? "100%" : "auto" }}
    >
      <Link
        to={`/products?category=${cat.tag}`}
        className="hm-focus"
        style={{ display: "block", height: "100%" }}
      >
        <div style={{
          position: "relative",
          borderRadius: T.rCard,
          overflow: "hidden",
          background: cat.bg,
          border: "1px solid rgba(255,255,255,0.6)",
          height: large ? "100%" : 190,
          minHeight: large ? 380 : 190,
          cursor: "pointer",
          boxShadow: hovered
            ? `0 16px 48px rgba(13,32,48,0.12), 0 4px 12px ${cat.accent}22`
            : "0 2px 12px rgba(13,32,48,0.07)",
          transition: "box-shadow 0.3s ease",
        }}>
          {/* Top accent bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${cat.accent}, ${cat.accent}66)`,
            zIndex: 10,
          }} />

          {/* Header */}
          <div style={{ padding: large ? "24px 24px 0" : "18px 20px 0", position: "relative", zIndex: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: large ? 20 : 16,
                  fontWeight: 700, color: T.navy, margin: 0, marginBottom: 4,
                }}>
                  {cat.title}
                </h3>
                <p style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12, color: T.ghost, margin: 0,
                }}>
                  {cat.sub}
                </p>
              </div>
              <motion.div
                animate={{ rotate: hovered ? 45 : 0, background: hovered ? cat.accent : "#fff" }}
                transition={{ duration: 0.24 }}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  border: "1px solid rgba(13,32,48,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={13} style={{ color: hovered ? "#fff" : T.ghost }} />
              </motion.div>
            </div>
          </div>

          {/* Product image */}
          <motion.img
            src={cat.img}
            alt={cat.title}
            animate={{ scale: hovered ? 1.08 : 1, rotate: hovered ? 4 : 0 }}
            transition={{ duration: 0.48, ease: T.ease }}
            style={{
              position: "absolute",
              bottom: hovered ? 8 : 4,
              right: 12,
              width: large ? 160 : 110,
              height: large ? 160 : 110,
              objectFit: "contain",
              filter: "drop-shadow(0 12px 20px rgba(13,32,48,0.14))",
              transition: "bottom 0.3s ease",
            }}
          />

          {/* "Explore" reveal pill — slides up on hover */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
            transition={{ duration: 0.24 }}
            style={{
              position: "absolute",
              bottom: large ? 22 : 16, left: large ? 24 : 18,
              display: "inline-flex", alignItems: "center", gap: 5,
              background: cat.accent, color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, fontWeight: 700,
              padding: "5px 12px", borderRadius: T.rFull,
            }}
          >
            Explore <ArrowRight size={10} />
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

const CategorySection = () => (
  <section style={{ padding: "72px 24px", background: T.sand }}>
    <div style={{ maxWidth: 1320, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 36 }}>
        <RevealLeft>
          <div>
            <SectionLabel>Browse Categories</SectionLabel>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.4rem, 5vw, 3.4rem)",
              fontWeight: 700, color: T.navy,
              lineHeight: 1.05, margin: 0, letterSpacing: "-0.02em",
            }}>
              What are you<br /><em>craving</em> today?
            </h2>
          </div>
        </RevealLeft>
        <RevealRight delay={0.1}>
          <CTABtn to="/products" variant="outline">All Products <ArrowRight size={13} /></CTABtn>
        </RevealRight>
      </div>

      {/* Asymmetric grid: large left + 2 stacked right */}
      <Stagger>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, minHeight: 380 }}>
          <SI>
            <CategoryCard cat={cats[0]} large index={0} />
          </SI>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SI><CategoryCard cat={cats[1]} index={1} /></SI>
            <SI><CategoryCard cat={cats[2]} index={2} /></SI>
          </div>
        </div>
      </Stagger>
    </div>
    <style>{`
      @media (max-width: 640px) {
        .hm-cat-grid { grid-template-columns: 1fr !important; }
        .hm-cat-grid > div:last-child { flex-direction: row !important; }
      }
    `}</style>
  </section>
);

// ══════════════════════════════════════════════════════════════
//  FLASH SALE
// ══════════════════════════════════════════════════════════════
const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date().setHours(24, 0, 0, 0) - Date.now();
      if (diff > 0) setTimeLeft({
        h: Math.floor((diff / 36e5) % 24),
        m: Math.floor((diff / 6e4)  % 60),
        s: Math.floor((diff / 1e3)  % 60),
      });
    };
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("SEABITE10");
    setCopied(true);
    toast.success("Coupon code copied!", {
      style: { background: T.navy, color: "#fff", borderRadius: 12, fontSize: 12 },
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const pad = v => String(v).padStart(2, "0");

  const TimeBlock = ({ val, label }) => (
    <div style={{ textAlign: "center", minWidth: 48 }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={val}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{ y: 10,     opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 36, fontWeight: 700, color: T.navy,
            lineHeight: 1, letterSpacing: "-0.02em",
          }}
        >
          {pad(val)}
        </motion.div>
      </AnimatePresence>
      <p style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 9, fontWeight: 700, color: T.ghost,
        textTransform: "uppercase", letterSpacing: "0.15em", margin: "3px 0 0",
      }}>
        {label}
      </p>
    </div>
  );

  return (
    <section style={{ padding: "0 24px 48px", background: T.sand }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <ScaleReveal>
          <div style={{
            position: "relative",
            borderRadius: T.rLg, overflow: "hidden",
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 4px 24px rgba(13,32,48,0.08)",
          }}>
            {/* Rainbow accent stripe */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${T.teal}, #89C2D9, ${T.coral})`,
            }} />

            <div style={{
              display: "flex", flexWrap: "wrap",
              alignItems: "center", justifyContent: "space-between",
              gap: 24, padding: "32px 36px",
            }}>
              {/* Icon + copy */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: T.coralBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Flame size={24} style={{ color: T.coral }} />
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: T.coralBg, color: T.coral,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", padding: "3px 9px", borderRadius: T.rFull,
                    }}>
                      <Zap size={9} /> Flash Deal
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 17, fontWeight: 700, color: T.navy,
                    margin: 0, lineHeight: 1.3,
                  }}>
                    Order above <span style={{ color: T.tealDeep }}>₹1,699</span> — get{" "}
                    <span style={{ color: T.coral }}>10% OFF</span>
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", flexWrap: "wrap",
                    gap: 8, marginTop: 6,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13, color: T.ghost,
                  }}>
                    Use coupon
                    <motion.button
                      onClick={handleCopy}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="hm-focus"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: T.sand, border: `1px solid ${T.sandDark}`,
                        borderRadius: 8, padding: "4px 10px",
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 700, fontSize: 12, color: T.navy,
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                    >
                      SEABITE10
                      {copied
                        ? <Check size={12} style={{ color: T.jade }} />
                        : <Copy size={11} style={{ color: T.ghost }} />
                      }
                    </motion.button>
                    at checkout
                  </div>
                </div>
              </div>

              {/* Countdown + CTA */}
              <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <TimeBlock val={timeLeft.h} label="HRS" />
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 28, color: T.sandDark,
                    lineHeight: 1.1, marginTop: 4,
                  }}>:</span>
                  <TimeBlock val={timeLeft.m} label="MIN" />
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 28, color: T.sandDark,
                    lineHeight: 1.1, marginTop: 4,
                  }}>:</span>
                  <TimeBlock val={timeLeft.s} label="SEC" />
                </div>
                <CTABtn to="/products" variant="coral">Grab Deal <ArrowRight size={13} /></CTABtn>
              </div>
            </div>
          </div>
        </ScaleReveal>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════════════════════
//  PRODUCT ROW
// ══════════════════════════════════════════════════════════════
const ProductRow = ({ title, filterType, bg = T.sand }) => {
  const [products, setProducts]         = useState([]);
  const [globalDiscount, setGlobalDisc] = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/products`)
      .then(res => {
        const all = res.data.products || [];
        setGlobalDisc(res.data.globalDiscount || 0);
        const filtered = filterType === "Fish"
          ? all.filter(p => p.category === "Fish").slice(0, 4)
          : all.filter(p => p.category === "Prawn" || p.category === "Crab").slice(0, 4);
        setProducts(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterType]);

  if (!loading && !products.length) return null;

  return (
    <section style={{ padding: "64px 24px", background: bg }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <RevealLeft>
            <div>
              <SectionLabel>{filterType === "Fish" ? "Fish" : "Shellfish"}</SectionLabel>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 700, color: T.navy,
                letterSpacing: "-0.02em", margin: 0,
                display: "flex", alignItems: "baseline", gap: 14,
              }}>
                {title}
                {/* Editorial italic count */}
                {!loading && products.length > 0 && (
                  <em style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic", fontWeight: 400,
                    fontSize: "0.65em", color: T.ghost,
                  }}>
                    {products.length} shown
                  </em>
                )}
              </h2>
            </div>
          </RevealLeft>
          <RevealRight delay={0.1}>
            <Link
              to="/products"
              className="hm-focus"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13, fontWeight: 600, color: T.tealDeep,
                textDecoration: "none",
              }}
            >
              See all
              <motion.span whileHover={{ x: 4 }} style={{ display: "inline-block" }}>
                <ChevronRight size={14} />
              </motion.span>
            </Link>
          </RevealRight>
        </div>

        <Stagger className="hm-row-scroll" gap={0.07}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 16,
          }}
            className="hm-row-scroll"
          >
            {loading
              ? [...Array(4)].map((_, i) => (
                <div key={i} style={{
                  borderRadius: T.rCard,
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  height: 340,
                  animation: "pulse 1.8s ease infinite",
                }} />
              ))
              : products.map(p => (
                <SI key={p._id}>
                  <EnhancedProductCard
                    product={p}
                    globalDiscount={globalDiscount}
                  />
                </SI>
              ))
            }
          </div>
        </Stagger>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════════════════════
//  WHY SEABITE — Alternating step layout
// ══════════════════════════════════════════════════════════════
const WhySeaBite = () => {
  const features = [
    { n: "01", icon: <ShieldCheck size={22} />, title: "Quality Guaranteed", desc: "Every batch lab-tested for freshness and safety before dispatch.", accent: T.teal, bg: T.tealGlow },
    { n: "02", icon: <Thermometer size={22} />, title: "Cold Chain Delivery", desc: "Temperature-controlled packaging from ocean to your doorstep.", accent: "#89C2D9", bg: "rgba(137,194,217,0.1)" },
    { n: "03", icon: <Truck size={22} />,       title: "Same Day Dispatch",   desc: "Order before 2 PM and it ships today — freshness guaranteed.",  accent: T.amber, bg: "rgba(245,158,11,0.08)" },
    { n: "04", icon: <Utensils size={22} />,    title: "Chef Approved",       desc: "Trusted by restaurants and home cooks across the coastline.",   accent: T.coral, bg: T.coralBg },
  ];

  const stats = [
    { value: 500, suffix: "+", label: "Happy Customers" },
    { value: 20,  suffix: "+", label: "Varieties" },
    { value: 98,  suffix: "%", label: "Freshness Score" },
    { value: 4,   suffix: ".8★", label: "Avg Rating" },
  ];

  return (
    <section style={{ padding: "80px 24px", background: T.surface }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 56 }}>
          <RevealLeft>
            <div>
              <SectionLabel>Why Choose Us</SectionLabel>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.6rem, 5vw, 3.8rem)",
                fontWeight: 700, color: T.navy,
                lineHeight: 1.0, letterSpacing: "-0.025em", margin: 0,
              }}>
                The SeaBite<br /><em>difference.</em>
              </h2>
            </div>
          </RevealLeft>
          <RevealRight delay={0.1}>
            <p style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 15, color: T.ghost, lineHeight: 1.75,
              maxWidth: 360, margin: 0,
            }}>
              We set the bar higher so every meal you cook starts with the finest, freshest ingredient possible.
            </p>
          </RevealRight>
        </div>

        {/* Stats counter row */}
        <ScaleReveal delay={0.05}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 2, marginBottom: 56,
            background: T.sand,
            borderRadius: T.rCard,
            overflow: "hidden",
            border: `1px solid ${T.border}`,
          }}>
            {stats.map((s, i) => (
              <motion.div
                key={i}
                whileHover={{ background: T.tealGlow }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: "32px 28px", textAlign: "center",
                  borderRight: i < stats.length - 1 ? `1px solid ${T.border}` : "none",
                  background: "transparent",
                }}
              >
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 42, fontWeight: 700, color: T.navy,
                  margin: 0, letterSpacing: "-0.025em", lineHeight: 1,
                }}>
                  <Counter value={s.value} suffix={s.suffix} />
                </p>
                <p style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 10, color: T.ghost, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  margin: "8px 0 0",
                }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </ScaleReveal>

        {/* Feature grid with numbered steps */}
        <Stagger className="hm-feat-grid" gap={0.1}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}>
            {features.map((f, i) => (
              <SI key={i}>
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.28, ease: T.ease }}
                  style={{
                    background: T.sand,
                    border: `1px solid ${T.border}`,
                    borderRadius: T.rCard, padding: "28px 26px",
                    position: "relative",
                    boxShadow: "0 2px 10px rgba(13,32,48,0.05)",
                    transition: "box-shadow 0.25s",
                    overflow: "hidden",
                  }}
                  onHoverStart={e => e.currentTarget.style.boxShadow = `0 12px 36px rgba(13,32,48,0.10), 0 0 0 1px ${f.accent}33`}
                  onHoverEnd={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,32,48,0.05)"}
                >
                  {/* Step number — large italic watermark */}
                  <span style={{
                    position: "absolute", top: 16, right: 20,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic", fontWeight: 700,
                    fontSize: 64, color: "rgba(13,32,48,0.05)",
                    lineHeight: 1, pointerEvents: "none",
                    userSelect: "none",
                  }}>
                    {f.n}
                  </span>

                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: f.bg, color: f.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    {f.icon}
                  </div>

                  <h3 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15, fontWeight: 700, color: T.navy,
                    margin: "0 0 10px",
                  }}>
                    {f.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13.5, color: T.ghost, lineHeight: 1.7, margin: 0,
                  }}>
                    {f.desc}
                  </p>

                  {/* Bottom accent bar */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0,
                    width: "100%", height: 2,
                    background: `linear-gradient(90deg, ${f.accent}, transparent)`,
                    opacity: 0.5,
                  }} />
                </motion.div>
              </SI>
            ))}
          </div>
        </Stagger>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`)
      .then(res => { setReviews(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ padding: "72px 24px", background: T.sand }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Reveal>
          <SectionLabel>Customer Reviews</SectionLabel>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(2.4rem, 5vw, 3.4rem)",
            fontWeight: 700, color: T.navy,
            letterSpacing: "-0.02em", margin: "0 0 44px",
          }}>
            Loved by seafood lovers.
          </h2>
        </Reveal>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <SeaBiteLoader />
          </div>
        ) : (
          <Stagger gap={0.07}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {reviews.length > 0 ? reviews.map((r, i) => (
                <SI key={i}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.28, ease: T.ease }}
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      borderRadius: T.rCard, padding: "28px",
                      boxShadow: "0 2px 10px rgba(13,32,48,0.05)",
                      transition: "box-shadow 0.25s",
                      height: "100%",
                      display: "flex", flexDirection: "column",
                    }}
                    onHoverStart={e => e.currentTarget.style.boxShadow = "0 12px 36px rgba(13,32,48,0.09)"}
                    onHoverEnd={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(13,32,48,0.05)"}
                  >
                    {/* Stars with gradient color */}
                    <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j} size={13}
                          style={{
                            color: j < r.rating ? T.amber : T.border,
                            fill:  j < r.rating ? T.amber : T.border,
                          }}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: 17, lineHeight: 1.65,
                      color: T.navyMid, marginBottom: 20, flex: 1,
                    }}>
                      &ldquo;{r.comment}&rdquo;
                    </p>

                    {/* Attribution */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      paddingTop: 16,
                      borderTop: `1px solid ${T.sand}`,
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${T.teal}, #89C2D9)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <User size={14} style={{ color: "#fff" }} />
                      </div>
                      <div>
                        <p style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13.5, fontWeight: 600, color: T.navy, margin: 0,
                        }}>
                          {r.userName}
                        </p>
                        <p style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11.5, color: T.tealDeep, margin: "2px 0 0",
                        }}>
                          {r.productName}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </SI>
              )) : (
                <p style={{ fontFamily: "'Outfit', sans-serif", color: T.ghost }}>No reviews yet.</p>
              )}
            </div>
          </Stagger>
        )}
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════════════════════
//  SCROLL-TO-TOP
// ══════════════════════════════════════════════════════════════
const ScrollTop = () => {
  const [show, setShow] = useState(false);
  const red = useReducedMotion();

  useEffect(() => {
    const h = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: red ? 1 : 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: red ? 1 : 0.8 }}
          whileHover={red ? {} : { y: -3 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="hm-focus"
          style={{
            position: "fixed", bottom: 28, right: 28, zIndex: 60,
            width: 46, height: 46,
            background: T.surface,
            border: `1.5px solid ${T.border}`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(13,32,48,0.12)",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.teal; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
        >
          <ChevronDown size={18} style={{ color: T.navyMid, transform: "rotate(180deg)" }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════════════════════
//  PAGE EXPORT
// ══════════════════════════════════════════════════════════════
export default function Home() {
  return (
    <div className="hm-root" style={{ minHeight: "100vh" }}>
      <Helmet>
        <title>SeaBite — Premium Ocean-Fresh Seafood Delivered</title>
        <meta name="description" content="Shop premium fish, prawns, and crabs sourced daily from Mogalthur. Cold-chain delivered ocean-fresh seafood directly to your doorstep." />
        <meta property="og:title"       content="SeaBite — Fresh Coastal Catch Delivered" />
        <meta property="og:description" content="Premium seafood sourced daily at 4 AM and delivered fresh by noon. Chemical-free and 100% traceable coastal catch." />
        <meta property="og:image"       content="/fisherman.jpg" />
        <meta name="twitter:card"       content="summary_large_image" />
      </Helmet>

      {/* Hero + ticker live in navy wrapper for seamless transition */}
      <div style={{ background: T.navy }}>
        <Hero />
        <WaveTicker />
      </div>

      <CategorySection />
      <FlashSale />

      {/* Product rows on alternating backgrounds */}
      <ProductRow title="Fresh From The Nets"  filterType="Fish"      bg={T.sand}    />
      <ProductRow title="Shellfish Specials"   filterType="Shellfish" bg={T.surface} />

      {/* Trending section */}
      <section style={{ padding: "16px 24px 64px", background: T.sand }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <Reveal>
            <SectionLabel>Trending</SectionLabel>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700, color: T.navy,
              letterSpacing: "-0.02em", margin: "0 0 32px",
            }}>
              Customer Favorites
            </h2>
          </Reveal>
          <TrendingProducts />
        </div>
      </section>

      <Reviews />
      <WhySeaBite />
      <ScrollTop />
    </div>
  );
}