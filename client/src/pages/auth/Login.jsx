import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../../components/common/PopupModal";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../utils/firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const { setUser, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 📱 Mobile OTP States
  const [loginStep, setLoginStep] = useState("default"); // 'default' | 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const setupRecaptcha = () => {
    if (!auth) {
      console.error("❌ Firebase Auth not initialized. Check your API keys.");
      return false;
    }
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("✅ Recaptcha verified");
          },
        });
        return true;
      } catch (err) {
        console.error("Recaptcha Setup Error:", err);
        return false;
      }
    }
    return true;
  };

  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      return setModal({ show: true, message: "Please enter a valid 10-digit phone number.", type: "error" });
    }

    setLoading(true);
    try {
      const isReady = setupRecaptcha();
      if (!isReady || !auth) {
        throw new Error("Auth system not ready. Please try again or use Google login.");
      }
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setLoginStep("otp");
      setModal({ show: true, message: "OTP sent to your phone!", type: "success" });
    } catch (err) {
      console.error("OTP Request Error:", err);
      const isConfigError = err.message?.includes("Auth system not ready");
      setModal({
        show: true,
        message: isConfigError
          ? "Configuration missing (API Key). Please ensure Vercel environment variables are set and the site is RE-DEPLOYED."
          : "Failed to send OTP. Please try again.",
        type: "error"
      });
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      const idToken = await user.getIdToken();

      // 🌉 Bridge to SeaBite Backend
      const res = await axios.post(
        `${API_URL}/api/auth/firebase-login`,
        { idToken },
        { withCredentials: true }
      );

      setUser(res.data.user);
      setModal({ show: true, message: "Login Successful!", type: "success" });
      setTimeout(async () => {
        await refreshMe?.();
        const redirectPath = localStorage.getItem("postLoginRedirect");
        if (redirectPath) localStorage.removeItem("postLoginRedirect");
        const targetPath = redirectPath || (res.data.user.role === "admin" ? "/admin/dashboard" : "/");
        navigate(targetPath);
      }, 1500);
    } catch (err) {
      console.error("OTP Verification Error:", err);
      const isConfigError = err.message?.includes("Auth system not ready");
      setModal({
        show: true,
        message: isConfigError
          ? "Configuration missing (API Key). Please ensure Vercel environment variables are set and the site is re-deployed."
          : "Invalid OTP. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

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
          navigate(targetPath);
        }, 1500);
      } catch (err) {
        setModal({ show: true, message: err?.response?.data?.message || "Verification failed. Please try again.", type: "error" });
      }
    },
    onError: () => setModal({ show: true, message: "Google login was unsuccessful.", type: "error" }),
    flow: windowWidth < 768 ? "redirect" : "implicit",
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

          {/* Auth Flow */}
          <div id="recaptcha-container"></div>

          {loginStep === "default" && (
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
                  marginBottom: 16
                }}
              >
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                  style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", padding: 2 }}
                  alt="google"
                />
                Continue with Google
              </motion.button>

              <motion.button
                onClick={() => setLoginStep("phone")}
                whileHover={{ y: -2, background: "rgba(91,168,160,0.08)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  width: "100%", padding: "14px 24px", borderRadius: 14,
                  background: "transparent", color: "#1A2B35",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14, fontWeight: 600, border: "1px solid #E2EEEC", cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: 18 }}>📱</span>
                Login with Mobile
              </motion.button>
            </motion.div>
          )}

          {loginStep === "phone" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div style={{ textAlign: "left", marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                  Indian Mobile Number
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#6B8A97", fontSize: 14, fontWeight: 600 }}>+91</span>
                  <input
                    type="tel"
                    placeholder="99999 00000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      width: "100%", padding: "14px 14px 14px 52px", borderRadius: 14,
                      background: "#F8FBFA", border: "1px solid #E2EEEC",
                      fontSize: 15, color: "#1A2B35", fontWeight: 600,
                      outline: "none", transition: "all 0.2s"
                    }}
                  />
                </div>
              </div>

              <motion.button
                onClick={handleRequestOTP}
                disabled={loading || phoneNumber.length < 10}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  background: phoneNumber.length === 10 ? "#1A2B35" : "#E2EEEC",
                  color: "#ffffff", fontWeight: 600, border: "none", cursor: "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Sending..." : "Send OTP"}
              </motion.button>

              <button
                onClick={() => setLoginStep("default")}
                style={{ background: "none", border: "none", color: "#5BA8A0", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16 }}
              >
                ← Back to options
              </button>
            </motion.div>
          )}

          {loginStep === "otp" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div style={{ textAlign: "left", marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 14,
                    background: "#F8FBFA", border: "1px solid #E2EEEC",
                    fontSize: 20, textAlign: "center", color: "#1A2B35", fontWeight: 700,
                    letterSpacing: "0.2em", outline: "none"
                  }}
                />
              </div>

              <motion.button
                onClick={handleVerifyOTP}
                disabled={loading || verificationCode.length < 6}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  background: verificationCode.length === 6 ? "#5BA8A0" : "#E2EEEC",
                  color: "#ffffff", fontWeight: 600, border: "none", cursor: "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </motion.button>

              <button
                onClick={() => setLoginStep("phone")}
                style={{ background: "none", border: "none", color: "#6B8A97", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 16 }}
              >
                Wrong number? Edit phone
              </button>
            </motion.div>
          )}

          {/* Secondary option hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* 🔴 CONFIG WARNING (Only shows if Auth is broken) */}
            {!auth && (
              <div
                style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "#FEF2F2", border: "1px solid #FEE2E2",
                  marginBottom: 20, textAlign: "left"
                }}
              >
                <p style={{ fontSize: 11.5, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>
                  ⚠️ SYSTEM NOT CONFIGURED
                </p>
                <p style={{ fontSize: 10.5, color: "#991B1B", fontWeight: 500, lineHeight: 1.4 }}>
                  Keys missing in this build: <b>{[
                    !import.meta.env.VITE_FIREBASE_API_KEY && "API_KEY",
                    !import.meta.env.VITE_FIREBASE_PROJECT_ID && "PROJECT_ID",
                    !import.meta.env.VITE_FIREBASE_AUTH_DOMAIN && "AUTH_DOMAIN"
                  ].filter(Boolean).join(", ")}</b>.
                  Please <b>Redeploy</b> with "Clear Build Cache".
                </p>
              </div>
            )}

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