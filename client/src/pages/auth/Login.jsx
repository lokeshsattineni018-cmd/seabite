import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../../components/common/PopupModal";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const { setUser, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password }, { withCredentials: true });
      if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
      setUser(res.data.user);
      setModal({ show: true, message: "Login Successful! Redirecting...", type: "success" });
      setTimeout(async () => {
        await refreshMe?.();
        navigate(res.data.user.role === "admin" ? "/admin/dashboard" : "/");
      }, 1500);
    } catch (err) {
      setModal({ show: true, message: err.response?.data?.message || "Login failed. Please check your credentials.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("🔑 Google Token Response received:", !!tokenResponse.access_token);
      
      if (!tokenResponse.access_token) {
        setModal({ show: true, message: "No access token received from Google. Please try again.", type: "error" });
        return;
      }

      try {
        const res = await axios.post(
          `${API_URL}/api/auth/google`,
          { token: tokenResponse.access_token },
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );
        
        // ✅ Stability: Store sessionId for mobile header fallback
        if (res.data.sessionId) {
          localStorage.setItem("seabite_session_id", res.data.sessionId);
        }

        setUser(res.data.user);
        setModal({ show: true, message: "Login Successful! Redirecting...", type: "success" });
        setTimeout(async () => {
          await refreshMe?.();
          const redirectPath = localStorage.getItem("postLoginRedirect");
          if (redirectPath) localStorage.removeItem("postLoginRedirect");
          const targetPath = redirectPath || (res.data.user.role === "admin" ? "/admin/dashboard" : "/");
          navigate(targetPath);
        }, 1500);
      } catch (err) {
        setModal({ show: true, message: err?.response?.data?.message || "Verification failed. Please try again.", type: "error" });
      }
    },
    onError: () => setModal({ show: true, message: "Google login was unsuccessful.", type: "error" }),
    flow: "implicit", // ✅ Force implicit popup flow for consistency across devices
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

          <AnimatePresence mode="wait">
            <motion.form 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}
            >
              <div style={{ position: "relative", textAlign: "left" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#A8C5C0", textTransform: "uppercase", letterSpacing: "0.05em", marginLeft: "4px", marginBottom: "6px", display: "block" }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "all 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "#5BBFB5"}
                  onBlur={(e) => e.target.style.borderColor = "#E2EEEC"}
                />
              </div>

              <div style={{ position: "relative", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#A8C5C0", textTransform: "uppercase", letterSpacing: "0.05em", marginLeft: "4px" }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: "11px", fontWeight: "700", color: "#5BBFB5", textDecoration: "none" }}>Forgot?</Link>
                </div>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "all 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "#5BBFB5"}
                  onBlur={(e) => e.target.style.borderColor = "#E2EEEC"}
                />
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "14px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "14px", fontSize: "14px", fontWeight: "700", cursor: "pointer", marginTop: "8px", boxShadow: "0 4px 12px rgba(26,46,44,0.12)" }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E8EEF2" }} />
            <span style={{ fontSize: "11px", color: "#B8CFCC", fontWeight: "700" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#E8EEF2" }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ marginBottom: "32px" }}
          >
            <motion.button
              onClick={() => login()}
              whileHover={{ y: -2, boxShadow: "0 8px 28px rgba(91,168,160,0.22)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                width: "100%", padding: "14px 24px", borderRadius: 14,
                background: "#ffffff", color: "#1A2B35",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "14px", fontWeight: "700", border: "1.5px solid #E2EEEC", cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                style={{ width: 18, height: 18 }}
                alt="google"
              />
              Continue with Google
            </motion.button>
          </motion.div>

          <p style={{ fontSize: "13px", color: "#6B8F8A", marginBottom: "24px" }}>
            New to SeaBite? <Link to="/signup" style={{ color: "#5BBFB5", fontWeight: "700", textDecoration: "none" }}>Create an account</Link>
          </p>

          {/* Secondary option hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
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