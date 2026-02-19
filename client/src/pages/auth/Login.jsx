import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../../components/common/PopupModal";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const { setUser, refreshMe } = useAuth();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(
          `${API_URL}/api/auth/google`,
          { token: tokenResponse.access_token },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
        setUser(res.data.user);
        setModal({ show: true, message: "Login Successful! Redirecting...", type: "success" });
        setTimeout(async () => {
          await refreshMe?.();
          const redirectPath = localStorage.getItem("postLoginRedirect");
          if (redirectPath) localStorage.removeItem("postLoginRedirect");
          const targetPath = redirectPath || (res.data.user.role === "admin" ? "/admin/dashboard" : "/");
          window.location.href = targetPath;
        }, 1500);
      } catch (err) {
        setModal({ show: true, message: err?.response?.data?.message || "Verification failed. Please try again.", type: "error" });
      }
    },
    onError: () => setModal({ show: true, message: "Google login was unsuccessful.", type: "error" }),
    flow: window.innerWidth < 768 ? "redirect" : "implicit",
  });

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Ambient ocean rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "-15%", left: "-15%",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(91,168,160,0.12) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{
            position: "absolute", bottom: "-20%", right: "-10%",
            width: 700, height: 700, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(137,194,217,0.15) 0%, transparent 70%)",
          }}
        />
        {/* Decorative wave lines */}
        <svg className="absolute bottom-0 left-0 w-full opacity-30" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="rgba(91,168,160,0.08)" />
          <path d="M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z" fill="rgba(91,168,160,0.06)" />
        </svg>
      </div>

      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[400px] px-5"
      >
        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #E2EEEC",
            boxShadow: "0 4px 40px rgba(91,168,160,0.10), 0 1px 4px rgba(26,43,53,0.04)",
            padding: "48px 40px",
            textAlign: "center",
          }}
        >
          {/* Logo + Brand */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ marginBottom: 32 }}
          >
            <Link to="/" style={{ display: "inline-block", marginBottom: 20 }}>
              <motion.img
                src="/logo.png"
                style={{ height: 52, margin: "0 auto", objectFit: "contain" }}
                alt="SeaBite"
                whileHover={{ scale: 1.04 }}
              />
            </Link>

            {/* Subtle divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "#E8EEF2" }} />
              <span style={{ fontSize: 11, color: "#8BA5B3", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Welcome Back
              </span>
              <div style={{ flex: 1, height: 1, background: "#E8EEF2" }} />
            </div>

            <h2
              style={{ fontSize: 26, fontWeight: 700, color: "#1A2B35", letterSpacing: "-0.02em", marginBottom: 8 }}
            >
              Sign in to SeaBite
            </h2>
            <p style={{ fontSize: 13.5, color: "#6B8A97", lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>
              Fresh seafood, delivered to your door. Sign in to continue.
            </p>
          </motion.div>

          {/* Google Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <motion.button
              onClick={() => login()}
              whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(91,168,160,0.22)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                width: "100%", padding: "14px 24px", borderRadius: 14,
                background: "#1A2B35", color: "#ffffff",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                boxShadow: "0 2px 16px rgba(26,43,53,0.18)",
                transition: "all 0.2s ease",
              }}
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", padding: 2 }}
                alt="google"
              />
              Continue with Google
            </motion.button>
          </motion.div>

          {/* Secondary option hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Seafoam accent bar */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 16px", borderRadius: 12,
                background: "rgba(91,168,160,0.06)", border: "1px solid rgba(91,168,160,0.15)",
                marginBottom: 20,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5BA8A0", flexShrink: 0 }} />
              <p style={{ fontSize: 11.5, color: "#5BA8A0", fontWeight: 600, textAlign: "left", lineHeight: 1.5 }}>
                Secured by Google OAuth 2.0 — we never store your password.
              </p>
            </div>

            <p style={{ fontSize: 11, color: "#9BB5BF", lineHeight: 1.7 }}>
              By continuing, you agree to SeaBite's{" "}
              <Link to="/terms" style={{ color: "#5BA8A0", fontWeight: 600, textDecoration: "none" }}>Terms</Link>
              {" "}and{" "}
              <Link to="/privacy" style={{ color: "#5BA8A0", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>
            </p>
          </motion.div>
        </div>

        {/* Bottom brand note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#9BB5BF", fontWeight: 500 }}
        >
          🌊 SeaBite · Fresh from the sea
        </motion.p>
      </motion.div>
    </div>
  );
}