// src/components/Footer.jsx
import { useContext, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiPhone, FiMail, FiSend, FiCheck, FiLoader, FiArrowRight } from "react-icons/fi";
import { motion, useInView } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── FadeUp wrapper ───────────────────────────────────────
const FadeUp = ({ children, delay = 0, style = {} }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
};

const FOOTER_LINKS = [
  {
    title: "Explore",
    links: [
      { to: "/products", label: "Shop Seafood" },
      { to: "/products?category=Fish", label: "Fresh Fish" },
      { to: "/products?category=Prawn", label: "Jumbo Prawns" },
      { to: "/products?category=Crab", label: "Live Crabs" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/faq", label: "FAQ" },
      { to: "/terms", label: "Terms & Conditions" },
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/cancellation", label: "Cancellation & Refund" },
    ],
  },
];

export default function Footer() {
  const [formData, setFormData] = useState({ email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      setStatus("success");
      setFormData({ email: "", message: "" });
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Lora:wght@500;600&display=swap');
        .footer-root * { box-sizing: border-box; }
        .footer-link { color: #6B8F8A; text-decoration: none; font-size: 13px; font-weight: 500; transition: color 0.2s; display: inline-block; }
        .footer-link:hover { color: #5BBFB5; }
        .footer-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E2EEEC; border-radius: 10px; font-size: 13px; font-family: 'Manrope', sans-serif; color: #1A2E2C; background: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .footer-input:focus { border-color: #5BBFB5; box-shadow: 0 0 0 3px rgba(91,191,181,0.12); }
        .footer-input::placeholder { color: #B8CFCC; }
      `}</style>

      <footer
        className="footer-root"
        style={{
          background: "#fff",
          borderTop: "1.5px solid #E2EEEC",
          fontFamily: "'Manrope', sans-serif",
          paddingTop: "64px",
          paddingBottom: "24px",
          overflow: "hidden",
        }}
      >
        {/* Subtle ambient background wash */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: "500px", height: "300px",
          background: "radial-gradient(ellipse at top right, rgba(91,191,181,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>

          {/* ── CTA Banner ──────────────────────────────────── */}
          <FadeUp>
            <div style={{
              background: "linear-gradient(135deg, #F4F9F8 0%, #EBF7F5 100%)",
              border: "1.5px solid #E2EEEC",
              borderRadius: "20px",
              padding: "40px 48px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              marginBottom: "56px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Wave decoration */}
              <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.06, fontSize: "180px", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>🌊</div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: "11px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
                  Fresh. Every day.
                </p>
                <h3 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(22px, 3vw, 32px)", fontWeight: "600", color: "#1A2E2C", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
                  Taste the ocean,<br />delivered to your door.
                </h3>
              </div>

              <Link to="/products" style={{ textDecoration: "none", position: "relative", zIndex: 1 }}>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(91,191,181,0.20)" }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 28px", background: "#1A2E2C", color: "#fff",
                    border: "none", borderRadius: "12px",
                    fontSize: "14px", fontWeight: "700",
                    cursor: "pointer", fontFamily: "'Manrope', sans-serif",
                    transition: "background 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  Shop Now <FiArrowRight size={14} />
                </motion.button>
              </Link>
            </div>
          </FadeUp>

          {/* ── Main Grid ───────────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 2fr",
            gap: "48px",
            marginBottom: "48px",
          }}
            className="footer-grid"
          >
            {/* Brand column */}
            <FadeUp delay={0}>
              <div>
                <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "16px" }}>
                  <span style={{ fontFamily: "'Lora', serif", fontSize: "22px", fontWeight: "600", color: "#1A2E2C", letterSpacing: "-0.02em" }}>
                    🐟 SeaBite
                  </span>
                </Link>
                <p style={{ fontSize: "13px", color: "#6B8F8A", lineHeight: "1.8", maxWidth: "260px", marginBottom: "24px" }}>
                  Premium seafood sourced responsibly from the coast of Andhra Pradesh, delivered fresh to your kitchen.
                </p>

                {/* Contact info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { icon: <FiPhone size={13} />, text: "+91 9866635566" },
                    { icon: <FiMail size={13} />, text: "support@seabite.co.in" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", background: "#F0FBF9", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5BBFB5", flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: "13px", color: "#6B8F8A" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Link columns */}
            {FOOTER_LINKS.map((col, ci) => (
              <FadeUp key={col.title} delay={0.08 + ci * 0.06}>
                <div>
                  <h4 style={{
                    fontSize: "10px", fontWeight: "800", color: "#1A2E2C",
                    textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "20px",
                  }}>
                    {col.title}
                  </h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                    {col.links.map(link => (
                      <li key={link.to}>
                        <Link to={link.to} className="footer-link">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}

            {/* Contact form */}
            <FadeUp delay={0.2}>
              <div>
                <h4 style={{ fontSize: "10px", fontWeight: "800", color: "#1A2E2C", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "20px" }}>
                  Send Us a Message
                </h4>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="email"
                    placeholder="Your email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="footer-input"
                  />
                  <textarea
                    placeholder="Your message…"
                    required
                    rows={3}
                    value={formData.message}
                    onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                    className="footer-input"
                    style={{ resize: "none" }}
                  />
                  <motion.button
                    type="submit"
                    disabled={status === "loading" || status === "success"}
                    whileHover={status === "idle" ? { scale: 1.02 } : {}}
                    whileTap={status === "idle" ? { scale: 0.97 } : {}}
                    style={{
                      padding: "10px 0",
                      borderRadius: "10px",
                      border: "none",
                      background: status === "success" ? "#5BBFB5" : status === "error" ? "#F07468" : "#1A2E2C",
                      color: "#fff",
                      fontSize: "13px", fontWeight: "700",
                      cursor: status === "loading" ? "default" : "pointer",
                      fontFamily: "'Manrope', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      transition: "background 0.25s",
                    }}
                  >
                    {status === "loading" ? (
                      <><FiLoader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Sending…</>
                    ) : status === "success" ? (
                      <><FiCheck size={13} /> Message Sent!</>
                    ) : status === "error" ? (
                      "Failed – Try Again"
                    ) : (
                      <><FiSend size={13} /> Send Message</>
                    )}
                  </motion.button>
                </form>
              </div>
            </FadeUp>
          </div>

          {/* ── Divider ─────────────────────────────────────── */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            style={{ height: "1px", background: "linear-gradient(90deg, transparent, #E2EEEC 30%, #E2EEEC 70%, transparent)", transformOrigin: "center", marginBottom: "0" }}
          />

          {/* ── Bottom bar ──────────────────────────────────── */}
          <FadeUp delay={0.1}>
            <div style={{
              display: "flex", flexWrap: "wrap",
              alignItems: "center", justifyContent: "space-between",
              gap: "12px", padding: "20px 0 24px",
            }}>
              <p style={{ fontSize: "12px", color: "#B8CFCC", fontWeight: "500" }}>
                © {new Date().getFullYear()} SeaBite Seafoods Pvt. Ltd. All rights reserved.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {["Terms", "Privacy", "Cancellation"].map((label, i) => (
                  <Link
                    key={i}
                    to={`/${label.toLowerCase()}`}
                    style={{ fontSize: "11px", color: "#B8CFCC", fontWeight: "600", textDecoration: "none", transition: "color 0.2s" }}
                    className="footer-link"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              <p style={{ fontSize: "12px", color: "#B8CFCC", fontWeight: "500" }}>
                Freshly sourced · Andhra Pradesh coastline 🌊
              </p>
            </div>
          </FadeUp>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 1024px) {
            .footer-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 600px) {
            .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </footer>
    </>
  );
}