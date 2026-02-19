import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus, FiMinus, FiHome, FiHelpCircle,
  FiTruck, FiShield, FiHeart, FiArrowRight,
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

const FAQ_DATA = [
  {
    category: "Freshness & Quality",
    icon: <FiShield size={14} />,
    color: "#3D8C85",
    bg: "#EAF6F5",
    questions: [
      {
        q: "How do you ensure the fish is fresh?",
        a: "Our seafood is sourced daily at 4 AM from local docks. It is immediately cleaned, vacuum-sealed, and packed in temperature-controlled boxes with gel ice packs to maintain 0–4°C from the water to your doorstep.",
      },
      {
        q: "Is your seafood chemical-free?",
        a: "Absolutely. We have a zero-tolerance policy for ammonia, formalin, or any other preservatives. We rely exclusively on advanced cold-chain logistics to keep the meat naturally fresh.",
      },
    ],
  },
  {
    category: "Delivery & Shipping",
    icon: <FiTruck size={14} />,
    color: "#3A7DA0",
    bg: "#EDF5FB",
    questions: [
      {
        q: "Where do you deliver?",
        a: "Currently we serve major zones across Andhra Pradesh and Telangana. We are rapidly expanding to more coastal cities — check the app for real-time pincode availability.",
      },
      {
        q: "How long does delivery take?",
        a: "Orders placed before 8 AM are eligible for same-day delivery. All other orders are delivered within 24 hours of sourcing to ensure maximum freshness.",
      },
    ],
  },
  {
    category: "Orders & Returns",
    icon: <FiHeart size={14} />,
    color: "#C05A45",
    bg: "#FEF0EC",
    questions: [
      {
        q: "What if I'm not happy with the quality?",
        a: "Your satisfaction is our priority. If you receive a product that doesn't meet our freshness standards, please contact us within 2 hours of delivery for an immediate replacement or full refund.",
      },
    ],
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  const toggle = (id) => setActive(active === id ? null : id);

  return (
    <>
      <style>{FONTS}{`
        .faq-root * { box-sizing: border-box; }
        .faq-cta-primary:hover { background:#3D8C85; transform:translateY(-2px); }
        .faq-cta-outline:hover { border-color:#5Ba8A0; color:#5Ba8A0; transform:translateY(-2px); }
        .faq-item { cursor:pointer; transition:border-color 0.2s, box-shadow 0.2s; }
        .faq-item:hover { border-color:#C5E6E4; }
      `}</style>

      <div
        className="faq-root"
        style={{
          minHeight: "100vh",
          background: "#F8FAFB",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "96px",
        }}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <section style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 80px", textAlign: "center" }}>
          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "60px", height: "60px", borderRadius: "18px",
              background: "#5BA8A0", color: "#fff", marginBottom: "24px",
              boxShadow: "0 8px 24px rgba(91,168,160,0.28)",
            }}
          >
            <FiHelpCircle size={26} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: "800",
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}
          >
            How can we help?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{ fontSize: "16px", color: "#4A6572", lineHeight: "1.7" }}
          >
            Everything you need to know about SeaBite freshness and service.
          </motion.p>
        </section>

        {/* ── ACCORDION ──────────────────────────────────── */}
        <section style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px 96px" }}>
          {FAQ_DATA.map((section, sIdx) => (
            <Reveal key={sIdx} delay={sIdx * 0.06}>
              <div style={{ marginBottom: "48px" }}>

                {/* Category label */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "4px 12px", borderRadius: "999px",
                  background: section.bg, border: `1px solid ${section.color}30`,
                  fontSize: "11px", fontWeight: "700", color: section.color,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  marginBottom: "20px",
                }}>
                  {section.icon} {section.category}
                </div>

                {/* Questions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {section.questions.map((item, qIdx) => {
                    const id = `${sIdx}-${qIdx}`;
                    const isOpen = active === id;
                    return (
                      <motion.div
                        key={qIdx}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: qIdx * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="faq-item"
                        onClick={() => toggle(id)}
                        style={{
                          background: "#fff",
                          border: `1.5px solid ${isOpen ? "#C5E6E4" : "#E8EEF2"}`,
                          borderRadius: "16px",
                          overflow: "hidden",
                          boxShadow: isOpen ? "0 4px 20px rgba(91,168,160,0.08)" : "none",
                          transition: "all 0.25s ease",
                        }}
                      >
                        {/* Question row */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "20px 24px", gap: "16px",
                        }}>
                          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1A2B35", lineHeight: "1.4" }}>
                            {item.q}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: 0.25 }}
                            style={{
                              flexShrink: 0, width: "28px", height: "28px",
                              borderRadius: "8px",
                              background: isOpen ? "#EAF6F5" : "#F8FAFB",
                              border: "1px solid #E8EEF2",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: isOpen ? "#5BA8A0" : "#8BA5B3",
                              transition: "background 0.2s, color 0.2s",
                            }}
                          >
                            <FiPlus size={14} />
                          </motion.div>
                        </div>

                        {/* Answer */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={{
                                padding: "0 24px 20px",
                                borderTop: "1px solid #F0F5F7",
                                marginTop: "0",
                              }}>
                                <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.8", margin: "16px 0 0" }}>
                                  {item.a}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ── BOTTOM CTA ─────────────────────────────────── */}
        <section style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px 96px" }}>
          <Reveal>
            <div style={{
              background: "#1A2B35", borderRadius: "24px", padding: "56px 40px",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% -20%, rgba(91,168,160,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />
              <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: "800", color: "#fff", letterSpacing: "-0.025em", marginBottom: "10px", position: "relative" }}>
                Still have questions?
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "28px", position: "relative" }}>
                Our support team is available 8 AM – 8 PM daily.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", position: "relative" }}>
                <button
                  onClick={() => navigate("/")}
                  className="faq-cta-outline"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "11px 24px", background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.75)", border: "1.5px solid rgba(255,255,255,0.15)",
                    borderRadius: "999px", fontSize: "13px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
                    transition: "all 0.25s",
                  }}
                >
                  <FiHome size={13} /> Back Home
                </button>
                <button
                  className="faq-cta-primary"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "11px 24px", background: "#5BA8A0",
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
          <p style={{ fontSize: "10px", fontWeight: "700", color: "#C5D4DA", textTransform: "uppercase", letterSpacing: "0.3em" }}>SeaBite Support • 2025</p>
        </div>
      </div>
    </>
  );
}