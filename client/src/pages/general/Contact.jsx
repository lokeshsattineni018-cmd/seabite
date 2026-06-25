import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiSend, FiHome, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

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

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      toast.success("Message sent successfully! We will get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | SeaBite</title>
        <meta name="description" content="Get in touch with SeaBite for any queries, order tracking, or support." />
        <link rel="canonical" href="https://seabite.co.in/contact" />
      </Helmet>
      <style>{FONTS}{`
        .contact-root * { box-sizing: border-box; }
        .contact-card { transition: all 0.28s ease; }
        .contact-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(91,168,160,0.09); border-color: #C5E6E4; }
        .cta-primary:hover { background:#3D8C85; transform:translateY(-2px); box-shadow:0 8px 24px rgba(91,168,160,0.25); }
        .cta-ghost:hover { border-color:rgba(255,255,255,0.55); color:#fff; transform:translateY(-2px); }
      `}</style>

      <div
        className="contact-root"
        style={{
          minHeight: "100vh",
          background: "#F8FAFB",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "0px",
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
            <FiMail size={11} /> Support Center
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
            Get in <br />
            <span style={{ color: "#5BA8A0" }}>Touch.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36 }}
            style={{ fontSize: "16px", color: "#4A6572", lineHeight: "1.8", maxWidth: "520px" }}
          >
            Have a question about your order or want to know more about our sourcing? Reach out to us.
          </motion.p>
        </header>

        {/* ── CONTENT SECTION ────────────────────────────── */}
        <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 96px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "start" }}>
            
            {/* Left Column: Contact Info Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Phone Support */}
              <Reveal delay={0.05}>
                <div
                  className="contact-card"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E8EEF2",
                    borderRadius: "20px",
                    padding: "32px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "24px",
                    transition: "all 0.28s ease",
                  }}
                >
                  <div
                    style={{
                      width: "44px", height: "44px", borderRadius: "13px",
                      background: "#EAF6F5", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "#3D8C85", flexShrink: 0,
                    }}
                  >
                    <FiPhone size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "18px", fontWeight: "700", color: "#1A2B35", marginBottom: "8px" }}>
                      Phone Support
                    </h3>
                    <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.6", margin: "0 0 16px" }}>
                      Mon-Sat from 8 AM to 8 PM.
                    </p>
                    <a href="tel:+919866635566" style={{ fontSize: "16px", fontWeight: "800", color: "#1A2B35", textDecoration: "none" }}>
                      +91 9866635566
                    </a>
                    <div style={{ marginTop: "12px" }}>
                      <a
                        href="https://wa.me/919866635566"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "13px", fontWeight: "700", color: "#25D366",
                          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px"
                        }}
                      >
                        💬 WhatsApp Us
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Email Support */}
              <Reveal delay={0.1}>
                <div
                  className="contact-card"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E8EEF2",
                    borderRadius: "20px",
                    padding: "32px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "24px",
                    transition: "all 0.28s ease",
                  }}
                >
                  <div
                    style={{
                      width: "44px", height: "44px", borderRadius: "13px",
                      background: "#FEF0EC", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "#C05A45", flexShrink: 0,
                    }}
                  >
                    <FiMail size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "18px", fontWeight: "700", color: "#1A2B35", marginBottom: "8px" }}>
                      Email Us
                    </h3>
                    <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.6", margin: "0 0 16px" }}>
                      We aim to reply within 2 hours.
                    </p>
                    <a href="mailto:support@seabite.co.in" style={{ fontSize: "16px", fontWeight: "800", color: "#1A2B35", textDecoration: "none" }}>
                      support@seabite.co.in
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* Visit Us */}
              <Reveal delay={0.15}>
                <div
                  className="contact-card"
                  style={{
                    background: "#fff",
                    border: "1.5px solid #E8EEF2",
                    borderRadius: "20px",
                    padding: "32px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "24px",
                    transition: "all 0.28s ease",
                  }}
                >
                  <div
                    style={{
                      width: "44px", height: "44px", borderRadius: "13px",
                      background: "#EDF5FB", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "#3A7DA0", flexShrink: 0,
                    }}
                  >
                    <FiMapPin size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "18px", fontWeight: "700", color: "#1A2B35", marginBottom: "8px" }}>
                      Visit Us
                    </h3>
                    <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.7", margin: 0 }}>
                      SeaBite, Mogalthur, AP 534281,<br />
                      West Godavari District,<br />
                      Andhra Pradesh, India
                    </p>
                  </div>
                </div>
              </Reveal>

            </div>

            {/* Right Column: Send Message Form */}
            <Reveal delay={0.2}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "40px",
                  border: "1.5px solid #E8EEF2",
                  boxShadow: "0 8px 32px rgba(26,43,53,0.03)",
                }}
              >
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "24px", fontWeight: "800", color: "#1A2B35", marginBottom: "24px" }}>
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4A6572", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</label>
                      <input
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: "100%", padding: "14px 16px", borderRadius: "12px",
                          border: "1.5px solid #E8EEF2", background: "#F8FAFB",
                          fontSize: "14px", color: "#1A2B35", outline: "none",
                          fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s"
                        }}
                        onFocus={e => e.target.style.borderColor = "#5BA8A0"}
                        onBlur={e => e.target.style.borderColor = "#E8EEF2"}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4A6572", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: "100%", padding: "14px 16px", borderRadius: "12px",
                          border: "1.5px solid #E8EEF2", background: "#F8FAFB",
                          fontSize: "14px", color: "#1A2B35", outline: "none",
                          fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s"
                        }}
                        onFocus={e => e.target.style.borderColor = "#5BA8A0"}
                        onBlur={e => e.target.style.borderColor = "#E8EEF2"}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4A6572", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject</label>
                    <input
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: "12px",
                        border: "1.5px solid #E8EEF2", background: "#F8FAFB",
                        fontSize: "14px", color: "#1A2B35", outline: "none",
                        fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s"
                      }}
                      onFocus={e => e.target.style.borderColor = "#5BA8A0"}
                      onBlur={e => e.target.style.borderColor = "#E8EEF2"}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#4A6572", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Message</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: "12px",
                        border: "1.5px solid #E8EEF2", background: "#F8FAFB",
                        fontSize: "14px", color: "#1A2B35", outline: "none",
                        resize: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s"
                      }}
                      onFocus={e => e.target.style.borderColor = "#5BA8A0"}
                      onBlur={e => e.target.style.borderColor = "#E8EEF2"}
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    whileHover={!isSubmitting ? { y: -1, boxShadow: "0 6px 20px rgba(91,168,160,0.2)" } : {}}
                    disabled={isSubmitting}
                    style={{
                      width: "100%", padding: "14px", background: "#5BA8A0", color: "#fff",
                      border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
                      cursor: isSubmitting ? "not-allowed" : "pointer", marginTop: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.25s"
                    }}
                  >
                    {isSubmitting ? "Sending..." : <><FiSend size={16} /> Send Message</>}
                  </motion.button>
                </form>
              </div>
            </Reveal>

          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────── */}
        <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 96px" }}>
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
                Need immediate answers?
              </h3>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", maxWidth: "340px", margin: "0 auto 28px", position: "relative", lineHeight: "1.7" }}>
                Browse our frequently asked questions to find quick answers about our products and services.
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
                  onClick={() => navigate("/faq")}
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
                  View FAQ <FiArrowRight size={13} />
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
