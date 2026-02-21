import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft, FiEdit2, FiMapPin } from "react-icons/fi";
import { motion, useInView } from "framer-motion";
import UserInfo from "./UserInfo";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch { }
    finally {
      navigate("/login");
      window.location.reload();
    }
  };

  useEffect(() => { fetchUser(); }, []);

  if (loading) {
    return <SeaBiteLoader fullScreen />;
  }

  if (!user) return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl = user.picture || user.avatar || null;

  return (
    <div style={{
      minHeight: "100vh", background: "#F4F9F8",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: "hidden",
    }}>
      {/* ── HERO BANNER ── */}
      <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
        {/* Ocean photo */}
        <motion.img
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="https://images.unsplash.com/photo-1468581264429-2548ef9eb732?q=80&w=2000&auto=format&fit=crop"
          alt="Ocean"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
        />
        {/* Light overlay — not dark! */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(244,249,248,0.1) 0%, rgba(244,249,248,0.85) 100%)",
        }} />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/")}
          style={{
            position: "absolute", top: 80, left: 24,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(226,238,236,0.8)",
            color: "#1A2B35", fontSize: 12, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 2px 12px rgba(91,168,160,0.12)",
          }}
        >
          <FiArrowLeft size={14} />
          Back to Home
        </motion.button>
      </div>

      {/* ── AVATAR CARD (overlapping banner) ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "#ffffff",
            borderRadius: 20, border: "1px solid #E2EEEC",
            boxShadow: "0 4px 32px rgba(91,168,160,0.10), 0 1px 4px rgba(26,43,53,0.04)",
            padding: "24px 28px",
            marginTop: -48, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: "3px solid #E2EEEC", objectFit: "cover",
                  boxShadow: "0 4px 20px rgba(91,168,160,0.18)",
                }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #5BA8A0, #89C2D9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, color: "#ffffff",
                border: "3px solid #E2EEEC",
                boxShadow: "0 4px 20px rgba(91,168,160,0.20)",
              }}>
                {avatarLetter}
              </div>
            )}
            {/* Online dot */}
            <div style={{
              position: "absolute", bottom: 2, right: 2,
              width: 14, height: 14, borderRadius: "50%",
              background: "#5BA8A0", border: "2px solid #ffffff",
            }} />
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A2B35", margin: 0, marginBottom: 4, letterSpacing: "-0.02em" }}>
              {user.name}
            </h1>
            <p style={{ fontSize: 13, color: "#8BA5B3", margin: 0 }}>{user.email}</p>
            {user.role === "admin" && (
              <span style={{
                display: "inline-block", marginTop: 6, padding: "3px 10px",
                borderRadius: 6, background: "rgba(232,129,106,0.1)",
                color: "#E8816A", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Administrator
              </span>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
            {[
              { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).getFullYear() : "—" },
              { label: "Account", value: user.role === "admin" ? "Admin" : "Customer" },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 60 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#1A2B35", margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: 10, color: "#8BA5B3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── USER INFO ── */}
        <FadeUp delay={0.1}>
          <UserInfo user={user} />
        </FadeUp>

        {/* ── ACTION BUTTONS ── */}
        <FadeUp delay={0.25}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center",
            marginTop: 24, marginBottom: 48, paddingBottom: 8,
          }}>
            {/* Manage Addresses */}
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(91,168,160,0.15)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/checkout")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 14,
                background: "rgba(91,168,160,0.08)", border: "1px solid rgba(91,168,160,0.2)",
                color: "#5BA8A0", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <FiMapPin size={15} /> Manage Addresses
            </motion.button>

            {/* Home */}
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(26,43,53,0.10)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 14,
                background: "#ffffff", border: "1px solid #E2EEEC",
                color: "#1A2B35", fontSize: 13, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 1px 4px rgba(26,43,53,0.06)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <FiHome size={15} /> Back to Home
            </motion.button>

            {/* Sign Out */}
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(232,129,106,0.15)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 14,
                background: "rgba(232,129,106,0.07)", border: "1px solid rgba(232,129,106,0.2)",
                color: "#E8816A", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <FiLogOut size={15} /> Sign Out
            </motion.button>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}