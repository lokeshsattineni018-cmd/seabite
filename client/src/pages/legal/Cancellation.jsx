import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Helmet } from "react-helmet-async";
import {
  FiHome, FiRotateCcw, FiXCircle, FiClock,
  FiCheckCircle, FiAlertCircle, FiArrowRight,
} from "react-icons/fi";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const POLICIES = [
  {
    title: "Cancellation Policy",
    icon: <FiXCircle size={18} />,
    iconColor: "#C05A45", iconBg: "#FEF0EC",
    borderAccent: "#F5C4BB",
    points: [
      "Orders can be cancelled anytime before they are marked as 'Shipped'.",
      "Once the order is out for delivery or shipped, cancellations are not permitted due to the perishable nature of fresh seafood.",
      "To cancel, visit your Orders page or contact support immediately.",
    ],
  },
  {
    title: "Refunds & Returns",
    icon: <FiRotateCcw size={18} />,
    iconColor: "#3A7DA0", iconBg: "#EDF5FB",
    borderAccent: "#BDD9EE",
    points: [
      "For cancelled prepaid orders, the full amount will be credited to your original payment method within 6–7 business days.",
      "For quality issues, share a photo/video within 2 hours of delivery.",
      "Once verified, refunds for quality issues are processed within 5–7 business days.",
    ],
  },
];

export default function Cancellation() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Cancellation & Refund Policy | SeaBite</title>
        <meta name="description" content="SeaBite's cancellation and refund policy. Cancel before shipment for a full refund. Quality issues resolved within 5-7 business days." />
        <link rel="canonical" href="https://seabite.co.in/cancellation" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Cancellation & Refund Policy | SeaBite" />
      </Helmet>
      <style>{FONTS}{`
        .cancel-root * { box-sizing: border-box; }
        .policy-card:hover { box-shadow: 0 12px 36px rgba(26,43,53,0.07); transform: translateY(-2px); }
        .cta-primary:hover { background:#3D8C85; transform:translateY(-2px); box-shadow:0 8px 24px rgba(91,168,160,0.25); }
        .cta-ghost:hover { border-color:rgba(255,255,255,0.5); color:#fff; transform:translateY(-2px); }
      `}</style>

      <div
        className="cancel-root"
        style={{
          minHeight: "100vh",
          background: "#F8FAFB",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "96px",
        }}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <header style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px 80px" }}>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "4px 14px", borderRadius: "999px",
              background: "#EDF5FB", border: "1px solid #BDD9EE",
              fontSize: "11px", fontWeight: "700", color: "#3A7DA0",
              textTransform: "uppercase", letterSpacing: "0.12em",
              marginBottom: "24px",
            }}
          >
            <FiClock size={11} /> Timelines & Rules
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: "800",
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            Cancellation <br />
            <span style={{ color: "#5BA8A0" }}>& Refunds.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{ fontSize: "16px", color: "#4A6572", lineHeight: "1.8", maxWidth: "520px" }}
          >
            We understand plans change. Here is how we manage cancellations and ensure your money is always safe with us.
          </motion.p>
        </header>

        {/* ── POLICY CARDS ───────────────────────────────── */}
        <section style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px 48px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {POLICIES.map((policy, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div
                  className="policy-card"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E8EEF2",
                    borderRadius: "20px",
                    padding: "36px 40px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}
                      style={{
                        width: "48px", height: "48px", borderRadius: "14px",
                        background: policy.iconBg, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: policy.iconColor, flexShrink: 0,
                      }}
                    >
                      {policy.icon}
                    </motion.div>
                    <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "22px", fontWeight: "700", letterSpacing: "-0.02em", margin: 0 }}>{policy.title}</h2>
                  </div>

                  {/* Points */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {policy.points.map((point, pIdx) => (
                      <motion.div
                        key={pIdx}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.08 + pIdx * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
                      >
                        <div style={{ marginTop: "2px", flexShrink: 0 }}>
                          <FiCheckCircle size={15} style={{ color: "#5BA8A0" }} />
                        </div>
                        <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.8", margin: 0 }}>{point}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}

            {/* Alert box */}
            <Reveal delay={0.12}>
              <div style={{
                display: "flex", gap: "14px", alignItems: "flex-start",
                padding: "20px 24px",
                background: "#FFFBEB",
                border: "1.5px solid #FDE68A",
                borderRadius: "14px",
              }}>
                <FiAlertCircle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: "2px" }} />
                <p style={{ fontSize: "13px", color: "#92400E", lineHeight: "1.7", margin: 0 }}>
                  <strong>Important:</strong> Since seafood is highly perishable, we cannot accept returns after delivery. Refunds are only applicable for verified quality issues or pre-shipping cancellations.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── HOW-IT-WORKS STEPS ─────────────────────────── */}
        <section style={{ background: "#fff", borderTop: "1px solid #E8EEF2", borderBottom: "1px solid #E8EEF2" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 24px" }}>
            <Reveal>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#5BA8A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>Process</p>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.025em", marginBottom: "40px" }}>
                How cancellation works
              </h2>
            </Reveal>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px" }}>
              {[
                { step: "01", title: "Go to Orders", desc: "Navigate to your profile and open the Orders section." },
                { step: "02", title: "Select Order", desc: "Find the order you wish to cancel before it ships." },
                { step: "03", title: "Confirm", desc: "Tap Cancel Order. Refunds process within 6–7 days." },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "14px",
                      background: "#F8FAFB", border: "1.5px solid #E8EEF2",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "13px",
                      fontWeight: "800", color: "#5BA8A0",
                      margin: "0 auto 16px",
                    }}>{s.step}</div>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1A2B35", marginBottom: "8px" }}>{s.title}</h4>
                    <p style={{ fontSize: "13px", color: "#8BA5B3", lineHeight: "1.7", margin: 0 }}>{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── ACTION DOCK ────────────────────────────────── */}
        <section style={{ maxWidth: "800px", margin: "0 auto", padding: "80px 24px" }}>
          <Reveal>
            <div style={{
              background: "#1A2B35", borderRadius: "24px", padding: "56px 48px",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% -10%, rgba(91,168,160,0.14) 0%, transparent 60%)", pointerEvents: "none" }} />
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "26px", fontWeight: "800", color: "#fff", letterSpacing: "-0.025em", marginBottom: "10px", position: "relative" }}>
                Need to cancel an order?
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", maxWidth: "340px", margin: "0 auto 28px", position: "relative" }}>
                Check your order status in your profile or talk to our support team.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", position: "relative" }}>
                <button
                  onClick={() => navigate("/")}
                  className="cta-ghost"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "12px 24px", background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(255,255,255,0.15)",
                    borderRadius: "999px", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
                    transition: "all 0.25s",
                  }}
                >
                  <FiHome size={13} /> Home
                </button>
                <button
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
                  Contact Support <FiArrowRight size={13} />
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <div style={{ textAlign: "center", paddingBottom: "32px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "#C5D4DA", textTransform: "uppercase", letterSpacing: "0.3em" }}>SeaBite Fair-Refund Policy • 2025</p>
        </div>
      </div>
    </>
  );
}