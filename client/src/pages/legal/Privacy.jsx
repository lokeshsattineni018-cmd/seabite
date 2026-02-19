import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import {
  FiHome, FiArrowRight, FiShield, FiLock, FiUser, FiShare2,
} from "react-icons/fi";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

const Reveal = ({ children, delay = 0, y = 24 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const SECTIONS = [
  {
    icon: <FiUser size={16} />,
    iconColor: "#3D8C85", iconBg: "#EAF6F5",
    title: "Data Collection",
    body: "We collect essential information such as your name, email (via Google Login), phone number, and delivery address. This data is required to process your orders and provide a personalised shopping experience.",
  },
  {
    icon: <FiArrowRight size={16} />,
    iconColor: "#3A7DA0", iconBg: "#EDF5FB",
    title: "How We Use Your Information",
    body: "Your data is used strictly for order fulfilment, real-time delivery tracking, and important account notifications. We do not sell your personal information to marketing agencies.",
  },
  {
    icon: <FiLock size={16} />,
    iconColor: "#8B6D45", iconBg: "#FAF4EC",
    title: "Data Security",
    body: "We implement industry-standard 256-bit SSL encryption to protect your data. Your payment details are processed through secure third-party gateways — we never store credit card information on our servers.",
  },
  {
    icon: <FiShare2 size={16} />,
    iconColor: "#C05A45", iconBg: "#FEF0EC",
    title: "Third-Party Services",
    body: "To ensure your catch reaches you fresh, we share your delivery address and contact number with our trusted logistics partners. They are contractually bound to protect your data privacy.",
  },
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <>
      <style>{FONTS}{`
        .priv-root * { box-sizing: border-box; }
        .priv-card { transition: all 0.28s ease; }
        .priv-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(91,168,160,0.09); border-color: #C5E6E4; }
        .cta-primary:hover { background:#3D8C85; transform:translateY(-2px); box-shadow:0 8px 24px rgba(91,168,160,0.25); }
        .cta-ghost:hover { border-color:rgba(255,255,255,0.55); color:#fff; transform:translateY(-2px); }
      `}</style>

      <div
        className="priv-root"
        style={{
          minHeight: "100vh",
          background: "#F8FAFB",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "96px",
        }}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <header style={{ maxWidth: "820px", margin: "0 auto", padding: "48px 24px 80px" }}>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "4px 14px", borderRadius: "999px",
              background: "#EAF6F5", border: "1px solid #C5E6E4",
              fontSize: "11px", fontWeight: "700", color: "#3D8C85",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "24px",
            }}
          >
            <FiShield size={11} /> Privacy Center
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.78, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(38px, 5.5vw, 64px)",
              fontWeight: "800",
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
              marginBottom: "20px",
            }}
          >
            Privacy <br />
            <span style={{ color: "#5BA8A0" }}>Policy.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36 }}
            style={{ fontSize: "16px", color: "#4A6572", lineHeight: "1.8", maxWidth: "520px" }}
          >
            At SeaBite, your trust is as important as our freshness. Here is how we protect and handle your personal information.
          </motion.p>
        </header>

        {/* ── CONTENT SECTIONS ───────────────────────────── */}
        <section style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {SECTIONS.map((s, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div
                  className="priv-card"
                  style={{
                    display: "flex", gap: "24px", alignItems: "flex-start",
                    background: "#fff",
                    border: "1.5px solid #E8EEF2",
                    borderRadius: "20px",
                    padding: "32px 36px",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 + i * 0.05 }}
                    style={{
                      flexShrink: 0,
                      width: "44px", height: "44px", borderRadius: "13px",
                      background: s.iconBg, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: s.iconColor,
                    }}
                  >
                    {s.icon}
                  </motion.div>

                  <div>
                    <h2 style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: "19px", fontWeight: "700",
                      letterSpacing: "-0.02em", marginBottom: "10px", color: "#1A2B35",
                    }}>
                      {s.title}
                    </h2>
                    <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.85", margin: 0 }}>
                      {s.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── LAST UPDATED ───────────────────────────────── */}
        <Reveal>
          <div style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 64px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "16px 24px",
              background: "#F8FAFB",
              border: "1.5px solid #E8EEF2",
              borderRadius: "14px",
            }}>
              <FiShield size={14} style={{ color: "#5BA8A0", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", color: "#8BA5B3", margin: 0 }}>
                This policy was last updated in <strong style={{ color: "#4A6572" }}>January 2025</strong>. We will notify registered users of material changes via email.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── CTA ────────────────────────────────────────── */}
        <section style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 96px" }}>
          <Reveal>
            <div style={{
              background: "#1A2B35", borderRadius: "24px", padding: "60px 48px",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% -10%, rgba(91,168,160,0.14) 0%, transparent 60%)", pointerEvents: "none" }} />
              <h3 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: "clamp(22px, 3vw, 30px)", fontWeight: "800",
                color: "#fff", letterSpacing: "-0.025em",
                marginBottom: "10px", position: "relative",
              }}>
                Your Data, Your Control.
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", maxWidth: "340px", margin: "0 auto 28px", position: "relative", lineHeight: "1.7" }}>
                You can request deletion of your account data at any time by contacting our support team.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", position: "relative" }}>
                <button
                  onClick={() => navigate("/")}
                  className="cta-ghost"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "12px 24px", background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(255,255,255,0.16)",
                    borderRadius: "999px", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
                    transition: "all 0.25s",
                  }}
                >
                  <FiHome size={13} /> Home
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="cta-primary"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "12px 24px", background: "#5BA8A0",
                    color: "#fff", border: "none",
                    borderRadius: "999px", fontSize: "13px", fontWeight: "700",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
                    transition: "all 0.25s",
                  }}
                >
                  Marketplace <FiArrowRight size={13} />
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <div style={{ textAlign: "center", paddingBottom: "32px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "#C5D4DA", textTransform: "uppercase", letterSpacing: "0.3em" }}>SeaBite Privacy Standard • 2025</p>
        </div>
      </div>
    </>
  );
}