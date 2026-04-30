import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Contact() {
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
    <div style={{ minHeight: "100vh", background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>Contact Us | SeaBite</title>
        <meta name="description" content="Get in touch with SeaBite for any queries, order tracking, or support." />
      </Helmet>

      {/* Hero */}
      <div style={{ position: "relative", width: "100%", height: "240px", background: "#1A2E2C", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: "radial-gradient(#5BBFB5 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 24px" }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(32px, 5vw, 42px)", fontWeight: 700, color: "#fff", margin: 0 }}
          >
            We're Here to Help
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", marginTop: "12px", maxWidth: "500px" }}
          >
            Have a question about your order or want to know more about our sourcing? Reach out to us.
          </motion.p>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "-40px auto 64px", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          
          {/* Contact Info Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1.5px solid #E2EEEC", display: "flex", alignItems: "flex-start", gap: "16px", boxShadow: "0 4px 12px rgba(26,46,44,0.03)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#F0FBF9", color: "#5BBFB5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FiPhone size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1A2E2C", margin: "0 0 4px" }}>Phone Support</h3>
                <p style={{ fontSize: "14px", color: "#6B8F8A", margin: "0 0 12px", lineHeight: 1.5 }}>Mon-Sat from 8am to 8pm.</p>
                <a href="tel:+919876543210" style={{ fontSize: "15px", fontWeight: 800, color: "#5BBFB5", textDecoration: "none" }}>+91 98765 43210</a>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1.5px solid #E2EEEC", display: "flex", alignItems: "flex-start", gap: "16px", boxShadow: "0 4px 12px rgba(26,46,44,0.03)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#FFF5F4", color: "#E8816A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FiMail size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1A2E2C", margin: "0 0 4px" }}>Email Us</h3>
                <p style={{ fontSize: "14px", color: "#6B8F8A", margin: "0 0 12px", lineHeight: 1.5 }}>We aim to reply within 2 hours.</p>
                <a href="mailto:support@seabite.co.in" style={{ fontSize: "15px", fontWeight: 800, color: "#E8816A", textDecoration: "none" }}>support@seabite.co.in</a>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", border: "1.5px solid #E2EEEC", display: "flex", alignItems: "flex-start", gap: "16px", boxShadow: "0 4px 12px rgba(26,46,44,0.03)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#F4F0FF", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FiMapPin size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1A2E2C", margin: "0 0 4px" }}>Visit Us</h3>
                <p style={{ fontSize: "14px", color: "#6B8F8A", margin: 0, lineHeight: 1.6 }}>SeaBite HQ, Vizag Harbor,<br />Andhra Pradesh, India 530001</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", border: "1.5px solid #E2EEEC", boxShadow: "0 12px 32px rgba(26,46,44,0.05)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1A2E2C", margin: "0 0 24px" }}>Send a Message</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B8F8A", marginBottom: "6px" }}>Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B8F8A", marginBottom: "6px" }}>Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B8F8A", marginBottom: "6px" }}>Subject</label>
                <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6B8F8A", marginBottom: "6px" }}>Message</label>
                <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
              </div>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                style={{ width: "100%", padding: "14px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {isSubmitting ? "Sending..." : <><FiSend size={16} /> Send Message</>}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
