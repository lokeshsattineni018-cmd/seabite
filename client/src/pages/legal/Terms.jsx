import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { FiHome, FiArrowRight, FiShield } from "react-icons/fi";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const SECTIONS = [
  {
    title: "Ordering & Cancellation",
    body: "Orders can be cancelled at any time before they are shipped. Once the order status is marked as 'Shipped' or 'Out for Delivery', cancellations are not permitted due to the perishable nature of seafood.",
  },
  {
    title: "Shipping & Delivery",
    body: "We aim to deliver all orders within 2–3 days of sourcing. Delivery timelines provided at checkout are estimates. SeaBite is not liable for delays caused by extreme weather or incorrect address details provided by the user.",
  },
  {
    title: "Perishable Goods Policy",
    body: "Fresh seafood is highly sensitive to temperature. Customers must ensure someone is available to receive the package. We are not responsible for quality degradation if the package is left unattended after delivery.",
  },
  {
    title: "Pricing & Payments",
    body: "Prices of seafood fluctuate daily based on market availability. The price at the time of order placement is final. All payments are processed through secure, encrypted payment gateways.",
  },
  {
    title: "User Responsibility",
    body: "Users must provide accurate contact and location information. Account credentials should be kept confidential. SeaBite reserves the right to block users for fraudulent activity or repeated fake orders.",
  },
];

// Accent colours cycling per section
const ACCENTS = ["#5BA8A0","#89C2D9","#E8816A","#5BA8A0","#89C2D9"];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <>
      <style>{FONTS}{`
        .terms-root * { box-sizing: border-box; }
        .terms-item { border-left: 3px solid transparent; transition: all 0.25s ease; }
        .terms-item:hover { border-left-color: var(--item-accent); background: #fff !important; }
        .cta-primary:hover { background:#3D8C85; transform:translateY(-2px); box-shadow:0 8px 24px rgba(91,168,160,0.25); }
        .cta-ghost:hover { border-color:rgba(255,255,255,0.55); color:#fff; transform:translateY(-2px); }
      `}</style>

      <div
        className="terms-root"
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
              background: "#FAF4EC", border: "1px solid #EAD9C0",
              fontSize: "11px", fontWeight: "700", color: "#8B6D45",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "24px",
            }}
          >
            <FiShield size={11} /> Legal Center
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
            Terms of <br />
            <span style={{ color: "#5BA8A0" }}>Service.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36 }}
            style={{ fontSize: "16px", color: "#4A6572", lineHeight: "1.8", maxWidth: "520px" }}
          >
            Simple, transparent, and fair. Please review our standard terms for a smooth shopping experience at SeaBite.
          </motion.p>
        </header>

        {/* ── TERMS ITEMS ────────────────────────────────── */}
        <section style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 96px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {SECTIONS.map((s, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div
                  className="terms-item"
                  style={{
                    "--item-accent": ACCENTS[i],
                    background: i % 2 === 0 ? "#fff" : "#F8FAFB",
                    borderRadius: "16px",
                    padding: "32px 36px",
                    border: "1.5px solid #E8EEF2",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "12px" }}>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.08 }}
                      style={{
                        fontFamily: "'Bricolage Grotesque', monospace",
                        fontSize: "11px", fontWeight: "800",
                        color: ACCENTS[i],
                        letterSpacing: "0.05em", flexShrink: 0,
                      }}
                    >
                      0{i + 1}
                    </motion.span>
                    <h2 style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: "19px", fontWeight: "700",
                      letterSpacing: "-0.02em", margin: 0, color: "#1A2B35",
                    }}>
                      {s.title}
                    </h2>
                  </div>
                  <p style={{
                    fontSize: "14px", color: "#4A6572",
                    lineHeight: "1.85", margin: 0, paddingLeft: "27px",
                  }}>
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────── */}
        <section style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 96px" }}>
          <Reveal>
            <div style={{
              background: "#fff", borderRadius: "24px", padding: "56px 48px",
              textAlign: "center",
              border: "1.5px solid #E8EEF2",
              boxShadow: "0 8px 32px rgba(26,43,53,0.05)",
            }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#5BA8A0", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Questions?</p>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: "800", color: "#1A2B35", letterSpacing: "-0.025em", marginBottom: "10px" }}>
                Have a specific question?
              </h3>
              <p style={{ fontSize: "14px", color: "#8BA5B3", maxWidth: "340px", margin: "0 auto 28px", lineHeight: "1.7" }}>
                If you need more details about our policies, feel free to contact our support team.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "12px 24px", background: "#F8FAFB",
                    color: "#4A6572", border: "1.5px solid #E8EEF2",
                    borderRadius: "999px", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
                    transition: "all 0.25s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor="#5BA8A0"; e.currentTarget.style.color="#5BA8A0"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor="#E8EEF2"; e.currentTarget.style.color="#4A6572"; }}
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
                  Go to Market <FiArrowRight size={13} />
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <div style={{ textAlign: "center", paddingBottom: "32px" }}>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "#C5D4DA", textTransform: "uppercase", letterSpacing: "0.3em" }}>SeaBite Standard Agreement • 2025</p>
        </div>
      </div>
    </>
  );
}