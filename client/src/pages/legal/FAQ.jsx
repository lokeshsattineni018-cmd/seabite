import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import {
  FiArrowRight, FiHome, FiZap, FiShield, FiTruck, FiCompass,
} from "react-icons/fi";
import { Waves } from "lucide-react";

// ─── Design tokens (matches full session system) ──────────
// bg:       #F8FAFB
// surface:  #FFFFFF
// border:   #E8EEF2
// text-dark:#1A2B35
// text-mid: #4A6572
// text-lite:#8BA5B3
// primary:  #5BA8A0 seafoam
// secondary:#89C2D9 sky
// accent:   #E8816A coral
// sand:     #F5EFE6
// ─────────────────────────────────────────────────────────

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

// Scroll-triggered fade + rise
const Reveal = ({ children, delay = 0, x = 0, y = 28 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Stagger wrapper
const Stagger = ({ children, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
const SI = ({ children }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    }}
  >
    {children}
  </motion.div>
);

// Chip label
const Chip = ({ children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "4px 14px", borderRadius: "999px",
    background: "#EAF6F5", border: "1px solid #C5E6E4",
    fontSize: "11px", fontWeight: "700", color: "#3D8C85",
    textTransform: "uppercase", letterSpacing: "0.12em",
  }}>
    {children}
  </span>
);

const WHY_CARDS = [
  { icon: <FiZap  size={18} />, title: "Morning Sourcing",   desc: "Harvested at 4 AM, reaching us while the coast is still quiet.",       bg: "#EAF6F5", color: "#3D8C85" },
  { icon: <FiShield size={18} />, title: "Zero Chemicals",   desc: "Strictly no Ammonia or Formalin. We use only ice and speed.",          bg: "#EDF5FB", color: "#3A7DA0" },
  { icon: <FiTruck size={18} />,  title: "Rapid Cold-Chain", desc: "Maintained at a precise 0–4°C from boat to doorstep.",                 bg: "#FAF4EC", color: "#8B6D45" },
  { icon: <FiCompass size={18} />,title: "Coastal Heritage",  desc: "100% sourced from Mogalthur's local artisan fishing community.",      bg: "#FEF0EC", color: "#C05A45" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <style>{FONTS}{`
        .about-root * { box-sizing: border-box; }
        .why-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(91,168,160,0.10); border-color: #C5E6E4; }
        .cta-primary:hover { background: #3D8C85; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(91,168,160,0.28); }
        .cta-outline:hover { border-color: #5BA8A0; color: #5BA8A0; transform: translateY(-2px); }
      `}</style>

      <div
        className="about-root"
        style={{
          minHeight: "100vh",
          background: "#F8FAFB",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "100px",
          overflowX: "hidden",
        }}
      >
        {/* ── HERO ──────────────────────────────────────── */}
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 96px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>

            {/* Left copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{ marginBottom: "24px" }}
              >
                <Chip><Waves size={11} /> Established 2025 · Mogalthur</Chip>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: "clamp(48px, 6vw, 80px)",
                  fontWeight: "800",
                  lineHeight: 1.0,
                  letterSpacing: "-0.04em",
                  marginBottom: "24px",
                  color: "#1A2B35",
                }}
              >
                About <br />
                <span style={{ color: "#5BA8A0" }}>SeaBite.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.38 }}
                style={{ fontSize: "17px", color: "#4A6572", lineHeight: "1.8", maxWidth: "460px", marginBottom: "36px" }}
              >
                A coastline collective dedicated to delivering the ocean's finest catch in its most honest, unprocessed form — from boat to your kitchen.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.52 }}
                style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
              >
                <button
                  onClick={() => navigate("/products")}
                  className="cta-primary"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 28px", background: "#5BA8A0", color: "#fff",
                    border: "none", borderRadius: "999px",
                    fontSize: "13px", fontWeight: "700", cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all 0.25s ease",
                  }}
                >
                  Shop Now <FiArrowRight size={13} />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="cta-outline"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px", background: "transparent", color: "#4A6572",
                    border: "1.5px solid #CBD8DF", borderRadius: "999px",
                    fontSize: "13px", fontWeight: "600", cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all 0.25s ease",
                  }}
                >
                  <FiHome size={13} /> Back Home
                </button>
              </motion.div>
            </div>

            {/* Right image */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative" }}
            >
              {/* decorative ring */}
              <div style={{
                position: "absolute", top: "-20px", right: "-20px",
                width: "200px", height: "200px",
                border: "32px solid rgba(91,168,160,0.08)",
                borderRadius: "50%", zIndex: 0,
              }} />
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                style={{
                  borderRadius: "20px", overflow: "hidden",
                  border: "1.5px solid #E8EEF2",
                  boxShadow: "0 12px 40px rgba(26,43,53,0.08)",
                  aspectRatio: "4/3", position: "relative", zIndex: 1,
                  background: "#E8EEF2",
                }}
              >
                <img
                  src="fisherman.jpg"
                  alt="Mogalthur Coast"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </motion.div>

              {/* Floating stat card */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                style={{
                  position: "absolute", bottom: "-20px", left: "-24px", zIndex: 2,
                  background: "#fff", border: "1.5px solid #E8EEF2",
                  borderRadius: "16px", padding: "14px 20px",
                  boxShadow: "0 8px 28px rgba(26,43,53,0.10)",
                  display: "flex", alignItems: "center", gap: "12px",
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EAF6F5", display: "flex", alignItems: "center", justifyContent: "center", color: "#5BA8A0", fontSize: "18px" }}>🐟</div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "800", color: "#1A2B35", margin: 0 }}>Fresh Daily</p>
                  <p style={{ fontSize: "11px", color: "#8BA5B3", margin: "2px 0 0" }}>Sourced at 4 AM</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── STATS STRIP ────────────────────────────────── */}
        <Reveal>
          <div style={{ background: "#fff", borderTop: "1px solid #E8EEF2", borderBottom: "1px solid #E8EEF2", padding: "32px 24px" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0" }}>
              {[
                { val: "4 AM", label: "Daily Sourcing" },
                { val: "0°C", label: "Chemical-Free" },
                { val: "100%", label: "Local Artisans" },
                { val: "4.8★", label: "Avg. Rating" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center", padding: "0 24px", borderRight: i < 3 ? "1px solid #E8EEF2" : "none" }}>
                  <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "32px", fontWeight: "800", color: "#5BA8A0", letterSpacing: "-0.03em", margin: "0 0 4px" }}>{s.val}</p>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── WHY CHOOSE US ──────────────────────────────── */}
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "96px 24px" }}>
          <Reveal style={{ marginBottom: "56px" }}>
            <div style={{ marginBottom: "56px" }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#5BA8A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>Why Choose Us</p>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: "800", color: "#1A2B35", letterSpacing: "-0.03em", margin: 0 }}>
                The SeaBite difference.
              </h2>
            </div>
          </Reveal>

          <Stagger className="why-grid">
            <style>{`.why-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; } @media(max-width:900px){.why-grid{grid-template-columns:repeat(2,1fr);}} @media(max-width:500px){.why-grid{grid-template-columns:1fr;}}`}</style>
            {WHY_CARDS.map((c, i) => (
              <SI key={i}>
                <div
                  className="why-card"
                  style={{
                    background: "#fff", border: "1.5px solid #E8EEF2", borderRadius: "18px",
                    padding: "28px 24px", height: "100%",
                    transition: "all 0.3s ease", cursor: "default",
                  }}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, marginBottom: "18px" }}>
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1A2B35", marginBottom: "8px" }}>{c.title}</h3>
                  <p style={{ fontSize: "13px", color: "#8BA5B3", lineHeight: "1.7", margin: 0 }}>{c.desc}</p>
                </div>
              </SI>
            ))}
          </Stagger>
        </section>

        {/* ── ORIGIN STORY ───────────────────────────────── */}
        <section style={{ background: "#fff", borderTop: "1px solid #E8EEF2", borderBottom: "1px solid #E8EEF2" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "96px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
              <Reveal x={-24} y={0}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "700", color: "#5BA8A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>Origin</p>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: "800", color: "#1A2B35", letterSpacing: "-0.03em", marginBottom: "24px" }}>
                    The Origin Story
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      "In the village of Mogalthur, we watched as the morning's freshest harvest was traded through six different hands before reaching a kitchen.",
                      "SeaBite was born to eliminate that system. We partner directly with local boat owners so what you receive has never seen a market floor.",
                      "Every order is our promise — traceable, chemical-free, and delivered the same morning it was caught.",
                    ].map((p, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
                        style={{ fontSize: "15px", color: "#4A6572", lineHeight: "1.8", margin: 0 }}
                      >
                        {p}
                      </motion.p>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal x={24} y={0} delay={0.1}>
                <div style={{ position: "relative" }}>
                  <div style={{ borderRadius: "20px", overflow: "hidden", border: "1.5px solid #E8EEF2", boxShadow: "0 8px 32px rgba(26,43,53,0.07)", aspectRatio: "4/3", background: "#E8EEF2" }}>
                    <img src="fisherman.jpg" alt="Origin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  {/* Quote card */}
                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
                    style={{
                      position: "absolute", top: "-20px", right: "-20px",
                      background: "#1A2B35", color: "#fff",
                      borderRadius: "16px", padding: "16px 20px",
                      maxWidth: "200px",
                      boxShadow: "0 12px 32px rgba(26,43,53,0.18)",
                    }}
                  >
                    <p style={{ fontSize: "12px", lineHeight: "1.6", margin: "0 0 6px", opacity: 0.8 }}>
                      "From the sea to your table — no middlemen."
                    </p>
                    <p style={{ fontSize: "10px", fontWeight: "700", color: "#5BA8A0", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>SeaBite Promise</p>
                  </motion.div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────── */}
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "96px 24px" }}>
          <Reveal>
            <div style={{
              background: "#1A2B35", borderRadius: "24px", padding: "72px 48px",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(91,168,160,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#5BA8A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "16px", position: "relative" }}>Ready?</p>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: "800", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px", position: "relative" }}>
                Ready to taste the coast?
              </h2>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", maxWidth: "400px", margin: "0 auto 36px", lineHeight: "1.7", position: "relative" }}>
                Premium seafood delivered fresh. No market floors. No chemicals. Just the ocean.
              </p>
              <motion.button
                whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(91,168,160,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/products")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "14px 36px", background: "#5Ba8A0", color: "#fff",
                  border: "none", borderRadius: "999px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.25s",
                  position: "relative",
                }}
              >
                Shop the Market <FiArrowRight size={14} />
              </motion.button>
            </div>
          </Reveal>
        </section>

        {/* footer label */}
        <div style={{ textAlign: "center", paddingBottom: "32px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "#C5D4DA", textTransform: "uppercase", letterSpacing: "0.3em" }}>SeaBite Integrity • 2025</p>
        </div>
      </div>
    </>
  );
}