import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PopupModal from "../../components/common/PopupModal";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock, FiUser, FiPhone, FiCheck, FiArrowRight, FiGift } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Signup() {
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const { setUser, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const queryParams = new URLSearchParams(window.location.search);
  const initialRef = queryParams.get("ref") || "";
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", referralCode: initialRef });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, { token: tokenResponse.access_token }, { withCredentials: true });
        if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
        setUser(res.data.user);
        await refreshMe?.();
        navigate("/");
      } catch (err) {
        setModal({ show: true, message: err?.response?.data?.message || "Google login failed.", type: "error" });
      }
    },
    flow: "implicit",
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { email: formData.email, name: formData.name });
      setStep(2);
      toast.success("OTP sent to your email!");
    } catch (err) {
      setModal({ show: true, message: err.response?.data?.message || "Failed to send OTP", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) return setModal({ show: true, message: "Please enter a valid 6-digit OTP", type: "error" });
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp-signup`, { ...formData, otp: otpString }, { withCredentials: true });
      if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
      setUser(res.data.user);
      await refreshMe?.();
      navigate("/");
    } catch (err) {
      setModal({ show: true, message: err.response?.data?.message || "Invalid OTP", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: "#F4F9F8", fontFamily: "'Manrope', sans-serif" }}>
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: "100%", maxWidth: "440px", zIndex: 10 }}>
        <div style={{ background: "#fff", padding: "40px 32px", borderRadius: "24px", boxShadow: "0 24px 48px rgba(26,46,44,0.06)", border: "1px solid #E2EEEC", position: "relative", overflow: "hidden" }}>
          
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Link to="/">
              <img src="/logo.png" alt="SeaBite" style={{ height: "48px", margin: "0 auto 20px" }} />
            </Link>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1A2E2C", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
              {step === 1 ? "Create an Account" : "Verify Your Email"}
            </h2>
            <p style={{ fontSize: "14px", color: "#6B8F8A", margin: 0 }}>
              {step === 1 ? "Join SeaBite for fresh catch everyday." : `We've sent a 6-digit code to ${formData.email}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                <div style={{ position: "relative" }}>
                  <FiUser style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "#6B8F8A" }} />
                  <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#5BBFB5"} onBlur={(e) => e.target.style.borderColor = "#E2EEEC"} />
                </div>

                <div style={{ position: "relative" }}>
                  <FiMail style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "#6B8F8A" }} />
                  <input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#5BBFB5"} onBlur={(e) => e.target.style.borderColor = "#E2EEEC"} />
                </div>

                <div style={{ position: "relative" }}>
                  <FiPhone style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "#6B8F8A" }} />
                  <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#5BBFB5"} onBlur={(e) => e.target.style.borderColor = "#E2EEEC"} />
                </div>

                <div style={{ position: "relative" }}>
                  <FiLock style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "#6B8F8A" }} />
                  <input required type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#5BBFB5"} onBlur={(e) => e.target.style.borderColor = "#E2EEEC"} />
                </div>

                <div style={{ position: "relative" }}>
                  <FiGift style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "#6B8F8A" }} />
                  <input type="text" placeholder="Referral Code (Optional)" value={formData.referralCode} onChange={e => setFormData({...formData, referralCode: e.target.value.toUpperCase()})} style={{ width: "100%", padding: "14px 16px 14px 44px", borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", fontSize: "14px", color: "#1A2E2C", outline: "none", transition: "border-color 0.2s", textTransform: "uppercase" }} onFocus={(e) => e.target.style.borderColor = "#5BBFB5"} onBlur={(e) => e.target.style.borderColor = "#E2EEEC"} />
                </div>

                <motion.button whileTap={{ scale: 0.98 }} disabled={loading} style={{ width: "100%", padding: "14px", background: "#1A2E2C", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}>
                  {loading ? "Sending OTP..." : "Get OTP"}
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  {otp.map((digit, index) => (
                    <input key={index} id={`otp-${index}`} type="text" maxLength="1" value={digit} onChange={e => handleOtpChange(index, e.target.value)} style={{ width: "48px", height: "56px", textAlign: "center", fontSize: "20px", fontWeight: 700, borderRadius: "12px", border: "1.5px solid #E2EEEC", background: "#F4F9F8", color: "#1A2E2C", outline: "none" }} onFocus={(e) => e.target.style.borderColor = "#5BBFB5"} onBlur={(e) => e.target.style.borderColor = "#E2EEEC"} />
                  ))}
                </div>

                <motion.button whileTap={{ scale: 0.98 }} disabled={loading} style={{ width: "100%", padding: "14px", background: "#5BBFB5", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? "Verifying..." : <><FiCheck size={18} /> Verify & Create Account</>}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {step === 1 && (
            <>
              <div style={{ display: "flex", alignItems: "center", margin: "24px 0", color: "#A8C5C0", fontSize: "12px", fontWeight: 600 }}>
                <div style={{ flex: 1, height: "1px", background: "#E2EEEC" }} />
                <span style={{ padding: "0 12px" }}>OR</span>
                <div style={{ flex: 1, height: "1px", background: "#E2EEEC" }} />
              </div>

              <motion.button onClick={() => googleLogin()} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "12px", background: "#fff", color: "#1A2E2C", border: "1.5px solid #E2EEEC", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#F4F9F8"} onMouseOut={e => e.currentTarget.style.background = "#fff"}>
                <img src="/google-logo.svg" alt="Google" style={{ width: "18px", height: "18px" }} onError={(e) => e.target.style.display='none'} />
                Continue with Google
              </motion.button>
            </>
          )}

          <p style={{ textAlign: "center", fontSize: "13px", color: "#6B8F8A", marginTop: "24px", marginBottom: "8px" }}>
            Already have an account? <Link to="/login" style={{ color: "#5BBFB5", fontWeight: 700, textDecoration: "none" }}>Log in here</Link>
          </p>
          <div style={{ textAlign: "center" }}>
            <Link to="/" style={{ fontSize: "13px", color: "#A8C5C0", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              Continue as Guest <FiArrowRight size={12} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
