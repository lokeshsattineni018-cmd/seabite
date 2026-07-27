import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const AuthInput = ({ label, type = "text", value, onChange, placeholder, required = true }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #D1D5DB", borderRadius: "8px", overflow: "hidden", background: "#fff", transition: "border-color 0.2s" }}>
        <input
          type={inputType} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label}
          style={{ width: "100%", padding: "14px 16px", border: "none", color: "#111827", fontSize: "16px", fontWeight: "500", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onFocus={e => {
            e.currentTarget.parentElement.style.borderColor = "#5BA8A0";
            e.currentTarget.parentElement.style.boxShadow = "0 0 0 3px rgba(91, 168, 160, 0.1)";
          }}
          onBlur={e => {
            e.currentTarget.parentElement.style.borderColor = "#D1D5DB";
            e.currentTarget.parentElement.style.boxShadow = "none";
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={{ background: "none", border: "none", padding: "0 12px", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function AuthModal({ isOpen, onClose }) {
  const { setUser, refreshMe } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [authMode, setAuthMode] = useState("LOGIN");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authReferral, setAuthReferral] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authImgIdx, setAuthImgIdx] = useState(0);
  const authImages = ["/auth-prawn.webp", "/auth-fish.webp", "/auth-crab.webp"];

  useEffect(() => {
    if (!isOpen) {
      setAuthMode("LOGIN");
      setAuthOtp("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthName("");
      setAuthPhone("");
      setAuthReferral("");
      setResendCooldown(0);
      setAuthImgIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setAuthImgIdx(prev => (prev + 1) % authImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const authType = searchParams.get("auth");
    if (authType === "login") {
      setAuthMode("LOGIN");
      onClose.__open?.();
      searchParams.delete("auth");
      setSearchParams(searchParams);
    } else if (authType === "signup") {
      setAuthMode("SIGNUP");
      onClose.__open?.();
      searchParams.delete("auth");
      setSearchParams(searchParams);
    } else if (authType === "forgot") {
      setAuthMode("FORGOT");
      onClose.__open?.();
      searchParams.delete("auth");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handleOpenAuth = () => {
      setAuthMode("LOGIN");
      onClose.__open?.();
    };
    window.addEventListener('open-auth-drawer', handleOpenAuth);
    return () => window.removeEventListener('open-auth-drawer', handleOpenAuth);
  }, []);

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email: authEmail, password: authPassword }, { withCredentials: true });
      setUser(res.data.user);
      toast.success("Welcome back!");
      onClose();
      await refreshMe?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setAuthLoading(false); }
  };

  const handleSignupOtpRequest = async (e) => {
    if (e) e.preventDefault();
    if (!authPhone || authPhone.length < 10) return toast.error("Phone number must be at least 10 digits");
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, { email: authEmail, name: authName });
      toast.success("OTP sent to your email!");
      setAuthMode("OTP_VERIFY_SIGNUP");
      setResendCooldown(res.data.cooldown || 60);
    } catch (err) {
      if (err.response?.data?.cooldown) setResendCooldown(err.response.data.cooldown);
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally { setAuthLoading(false); }
  };

  const handleSignupVerify = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp-signup`, {
        name: authName, email: authEmail, phone: authPhone, password: authPassword, otp: authOtp, referralCode: authReferral
      });
      setUser(res.data.user);
      toast.success("Account created successfully!");
      onClose();
      await refreshMe?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally { setAuthLoading(false); }
  };

  const handleForgotOtpRequest = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password-otp`, { email: authEmail });
      toast.success("Reset OTP sent to your email!");
      setAuthMode("RESET_PASSWORD");
      setResendCooldown(res.data.cooldown || 60);
    } catch (err) {
      if (err.response?.data?.cooldown) setResendCooldown(err.response.data.cooldown);
      toast.error(err.response?.data?.message || "Error sending reset OTP");
    } finally { setAuthLoading(false); }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setAuthOtp("");
    if (authMode === "OTP_VERIFY_SIGNUP") {
      handleSignupOtpRequest();
    } else if (authMode === "RESET_PASSWORD") {
      handleForgotOtpRequest();
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (authPassword !== authConfirmPassword) return toast.error("Passwords do not match");
    if (authPassword.length < 6) return toast.error("Password must be at least 6 characters");

    setAuthLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { email: authEmail, otp: authOtp, newPassword: authPassword });
      toast.success("Password reset successful!");
      setAuthMode("LOGIN");
      setAuthPassword("");
      setAuthConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally { setAuthLoading(false); }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAuthLoading(true);
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, { token: tokenResponse.access_token }, { withCredentials: true });
        setUser(res.data.user);
        toast.success("Success!");
        onClose();
        await refreshMe?.();
      } catch (err) {
        toast.error(err.response?.data?.message || "Google login failed");
      } finally {
        setAuthLoading(false);
      }
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.4)" }}>
          <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />

          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} style={{ position: "relative", background: "#fff", width: "100%", maxWidth: "760px", borderRadius: "16px", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", display: "flex", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
            {/* LEFT SIDE (FEATURES) */}
            <div className="hidden-mobile" style={{ flex: "0.8", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "32px" }}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={authImgIdx}
                  initial={{ x: "100%", opacity: 0.8 }}
                  animate={{ x: 0, opacity: 1, zIndex: 1 }}
                  exit={{ x: "-100%", opacity: 0.8, zIndex: 0 }}
                  transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    position: "absolute", inset: 0,
                    background: `url(${authImages[authImgIdx]}) center/cover no-repeat`
                  }}
                />
              </AnimatePresence>

              {/* Premium Gradient Overlay */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 1 }} />

              <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", alignItems: "center", width: "100%", paddingTop: "32px" }}>
                <img src="/logo.webp" width={92} height={64} style={{ height: "64px", width: "92px", filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.2))", objectFit: "contain" }} />
              </div>

              <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px", paddingBottom: "60px", textAlign: "left" }}>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={authImgIdx}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "8px", background: "rgba(234, 179, 8, 0.9)", color: "#000", fontSize: "11px", fontWeight: "900", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "20px", backdropFilter: "blur(4px)" }}>
                      {authImgIdx === 0 ? "FLASH DEAL" : authImgIdx === 1 ? "FREE SHIPPING" : "WELCOME OFFER"}
                    </div>

                    <h2 style={{ color: "#fff", fontSize: "52px", fontWeight: "900", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 12px", lineHeight: 0.85, letterSpacing: "-0.04em", textShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                      {authImgIdx === 0 ? <>10%<br/><span style={{fontSize: "26px", fontWeight: "700", letterSpacing: "0.01em"}}>DISCOUNT</span></> : authImgIdx === 1 ? <>FREE<br/><span style={{fontSize: "26px", fontWeight: "700", letterSpacing: "0.01em"}}>DELIVERY</span></> : <>FLAT ₹200<br/><span style={{fontSize: "26px", fontWeight: "700", letterSpacing: "0.01em"}}>DISCOUNT</span></>}
                    </h2>

                    <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "16px", fontWeight: "500", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, maxWidth: "260px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                      {authImgIdx === 0 ? "On all orders above ₹1699" : authImgIdx === 1 ? "On all orders above ₹999" : "On your very first order"}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT SIDE (WHITE BOX) */}
            <div className="auth-modal-right" style={{ flex: 1, padding: "8px 8px 8px 0", minHeight: "auto", position: "relative", zIndex: 1 }}>
              <div className="auth-modal-inner" style={{ background: "#fff", borderRadius: "12px", height: "100%", padding: "32px 32px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.05)" }}>
                <button aria-label="Close modal" onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: "32px", height: "32px", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background="rgba(0,0,0,0.1)"} onMouseOut={e => e.currentTarget.style.background="rgba(0,0,0,0.05)"}><FiX size={18}/></button>
                <AnimatePresence mode="wait">
                  <motion.div key={authMode} variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } }, exit: { opacity: 0 } }} initial="hidden" animate="show" exit="exit" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>

                    <div style={{ textAlign: "center", marginBottom: "24px" }}>
                      <div className="mobile-only" style={{ marginBottom: "20px" }}>
                        <img src="/logo.webp" width={58} height={40} style={{ height: "40px", width: "58px", margin: "0 auto", objectFit: "contain" }} />
                      </div>
                      <h2 style={{ fontSize: "24px", fontWeight: "800", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#111827", margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                        {authMode === "LOGIN" ? "Unlock Ocean's Finest"
                          : authMode === "SIGNUP" ? "Join Us For Exclusive Catch"
                          : authMode === "OTP_VERIFY_SIGNUP" ? "Verify Your Email"
                          : authMode === "RESET_PASSWORD" ? "Create New Password"
                          : "Reset Your Password"}
                      </h2>
                      <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, fontWeight: "500", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em" }}>
                        {authMode === "LOGIN" ? "Enter Email to Continue"
                          : authMode === "SIGNUP" ? "Enter your details below"
                          : authMode === "OTP_VERIFY_SIGNUP" ? "Enter the 6-digit code sent to your email"
                          : authMode === "RESET_PASSWORD" ? "Enter the reset code and your new password"
                          : "Enter email to receive reset code"}
                      </p>
                    </div>

                    {authMode === "LOGIN" && (
                      <form onSubmit={handleLoginSubmit}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="Enter Email Address" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="Enter Password" />
                        </motion.div>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                          <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#5CA8DA", cursor: "pointer" }} />
                          <span style={{ fontSize: "13px", color: "#4B5563", fontWeight: "500" }}>Notify me for fresh catch updates</span>
                        </motion.div>

                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="submit"
                          disabled={authLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", transition: "all 0.2s" }}
                        >
                          {authLoading ? <div className="loading-spinner" /> : "Continue"}
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ position: "relative", margin: "24px 0", textAlign: "center" }}>
                          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#E5E7EB" }} />
                          <span style={{ position: "relative", background: "#fff", padding: "0 12px", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>OR</span>
                        </motion.div>

                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="button"
                          onClick={() => googleLogin()}
                          disabled={authLoading}
                          whileHover={{ background: "#F9FAFB", scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: authLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", color: "#111827", transition: "all 0.2s" }}
                        >
                          {authLoading ? (
                            <div className="loading-spinner" style={{ width: "20px", height: "20px", border: "2.5px solid rgba(17, 24, 39, 0.15)", borderTopColor: "#111827" }} />
                          ) : (
                            <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Continue with Google</>
                          )}
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                          <button type="button" onClick={() => setAuthMode("FORGOT")} style={{ background: "none", border: "none", fontSize: "12px", color: "#6B7280", fontWeight: "600", cursor: "pointer" }}>Forgot Password?</button>
                          <button type="button" onClick={() => setAuthMode("SIGNUP")} style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", fontWeight: "600", cursor: "pointer" }}>New here? Create Account</button>
                        </motion.div>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "32px", textAlign: "center" }}>
                          <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                            I accept that I have read & understood SeaBite's<br/>
                            <Link to="/privacy" onClick={onClose} style={{ color: "#9CA3AF", textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/terms" onClick={onClose} style={{ color: "#9CA3AF", textDecoration: "underline" }}>T&Cs</Link>.
                          </p>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "SIGNUP" && (
                      <form onSubmit={handleSignupOtpRequest}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <AuthInput label="Full Name" value={authName} onChange={setAuthName} placeholder="Full Name" />
                          <AuthInput label="Phone" value={authPhone} onChange={setAuthPhone} placeholder="Phone" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="Email Address" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="Password" />
                        </motion.div>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                          <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "#5CA8DA", cursor: "pointer" }} />
                          <span style={{ fontSize: "13px", color: "#4B5563", fontWeight: "500" }}>Notify me for fresh catch updates</span>
                        </motion.div>

                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="submit"
                          disabled={authLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", transition: "all 0.2s" }}
                        >
                          {authLoading ? <div className="loading-spinner" /> : "Create Account"}
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ position: "relative", margin: "24px 0", textAlign: "center" }}>
                          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#E5E7EB" }} />
                          <span style={{ position: "relative", background: "#fff", padding: "0 12px", fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>OR</span>
                        </motion.div>

                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="button"
                          onClick={() => googleLogin()}
                          disabled={authLoading}
                          whileHover={{ background: "#F9FAFB", scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#fff", border: "1px solid #D1D5DB", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: authLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", color: "#111827", transition: "all 0.2s" }}
                        >
                          {authLoading ? (
                            <div className="loading-spinner" style={{ width: "20px", height: "20px", border: "2.5px solid rgba(17, 24, 39, 0.15)", borderTopColor: "#111827" }} />
                          ) : (
                            <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: "18px" }} /> Sign up with Google</>
                          )}
                        </motion.button>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", fontWeight: "600", cursor: "pointer" }}>Already have an account? Sign In</button>
                        </motion.div>

                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "24px", textAlign: "center" }}>
                          <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
                            I accept that I have read & understood SeaBite's<br/>
                            <Link to="/privacy" onClick={onClose} style={{ color: "#9CA3AF", textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/terms" onClick={onClose} style={{ color: "#9CA3AF", textDecoration: "underline" }}>T&Cs</Link>.
                          </p>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "OTP_VERIFY_SIGNUP" && (
                      <form onSubmit={handleSignupVerify}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Enter 6-Digit Code" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        </motion.div>
                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="submit"
                          disabled={authLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px", transition: "all 0.2s" }}
                        >
                          {authLoading ? <div className="loading-spinner" /> : "Verify & Join"}
                        </motion.button>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background: "none", border: "none", fontSize: "12px", color: resendCooldown > 0 ? "#9CA3AF" : "#3B82F6", fontWeight: "600", cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}>
                            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend"}
                          </button>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "FORGOT" && (
                      <form onSubmit={handleForgotOtpRequest}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Email Address" type="email" value={authEmail} onChange={setAuthEmail} placeholder="name@example.com" />
                        </motion.div>
                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="submit"
                          disabled={authLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px", transition: "all 0.2s" }}
                        >
                          {authLoading ? <div className="loading-spinner" /> : "Send Reset Code"}
                        </motion.button>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={() => setAuthMode("LOGIN")} style={{ background: "none", border: "none", fontSize: "12px", color: "#3B82F6", fontWeight: "600", cursor: "pointer" }}>Back to Sign In</button>
                        </motion.div>
                      </form>
                    )}

                    {authMode === "RESET_PASSWORD" && (
                      <form onSubmit={handleResetPassword}>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="6-Digit Code" value={authOtp} onChange={setAuthOtp} placeholder="000000" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="New Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="New Password" />
                        </motion.div>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                          <AuthInput label="Confirm Password" type="password" value={authConfirmPassword} onChange={setAuthConfirmPassword} placeholder="Confirm Password" />
                        </motion.div>
                        <motion.button
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          type="submit"
                          disabled={authLoading}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{ width: "100%", height: "48px", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px", transition: "all 0.2s" }}
                        >
                          {authLoading ? <div className="loading-spinner" /> : "Confirm New Password"}
                        </motion.button>
                        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} style={{ marginTop: "16px", textAlign: "center" }}>
                          <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ background: "none", border: "none", fontSize: "12px", color: resendCooldown > 0 ? "#9CA3AF" : "#3B82F6", fontWeight: "600", cursor: resendCooldown > 0 ? "not-allowed" : "pointer" }}>
                            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend"}
                          </button>
                        </motion.div>
                      </form>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
