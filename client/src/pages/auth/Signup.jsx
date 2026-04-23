import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PopupModal from "../../components/common/PopupModal";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Phone, Lock, Gift, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Signup() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const { setUser, refreshMe } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, {
        email: formData.email,
        name: formData.name,
      });
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify & Register
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp-signup`, formData);
      
      if (res.data.sessionId) {
        localStorage.setItem("seabite_session_id", res.data.sessionId);
      }
      
      setUser(res.data.user);
      toast.success("Welcome to SeaBite!");
      
      setTimeout(async () => {
        await refreshMe?.();
        navigate("/");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, {
          token: tokenResponse.access_token,
        });
        if (res.data.sessionId) localStorage.setItem("seabite_session_id", res.data.sessionId);
        setUser(res.data.user);
        toast.success("Signed up with Google!");
        setTimeout(async () => {
          await refreshMe?.();
          navigate("/");
        }, 1500);
      } catch (err) {
        toast.error("Google signup failed.");
      }
    },
    flow: "implicit",
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#F4F9F8] py-12 px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-radial-gradient from-[#5BA8A0]/20 to-transparent"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[15%] -right-[5%] w-[600px] h-[600px] rounded-full bg-radial-gradient from-[#89C2D9]/20 to-transparent"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[32px] border border-[#E2EEEC] shadow-[0_20px_60px_-15px_rgba(91,168,160,0.12)] p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <img src="/logo.png" alt="SeaBite" className="h-12 mx-auto" />
          </Link>
          <h1 className="text-2xl font-extrabold text-[#1A2B35] tracking-tight mb-2">Create your account</h1>
          <p className="text-sm text-[#6B8A97]">Join SeaBite for the freshest coastal catch.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A8C5C0] uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8C5C0]" size={18} />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E2EEEC] bg-[#F4F9F8] text-sm outline-none focus:border-[#5BA8A0] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A8C5C0] uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8C5C0]" size={18} />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E2EEEC] bg-[#F4F9F8] text-sm outline-none focus:border-[#5BA8A0] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A8C5C0] uppercase tracking-wider ml-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8C5C0]" size={18} />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E2EEEC] bg-[#F4F9F8] text-sm outline-none focus:border-[#5BA8A0] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A8C5C0] uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8C5C0]" size={18} />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E2EEEC] bg-[#F4F9F8] text-sm outline-none focus:border-[#5BA8A0] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A8C5C0] uppercase tracking-wider ml-1">Referral Code (Optional)</label>
                <div className="relative">
                  <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8C5C0]" size={18} />
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="Enter code to get ₹100"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E2EEEC] bg-[#F4F9F8] text-sm outline-none focus:border-[#5BA8A0] transition-all"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#1A2B35] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-[#5BA8A0] transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? "Sending OTP..." : (
                  <>
                    Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSignup}
              className="space-y-6"
            >
              <div className="bg-[#EAF6F5] p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="text-[#5BA8A0] mt-0.5" size={20} />
                <p className="text-xs text-[#3D8C85] leading-relaxed">
                  We've sent a 6-digit verification code to <span className="font-bold">{formData.email}</span>. Please enter it below.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#A8C5C0] uppercase tracking-wider ml-1">Verification Code</label>
                <input
                  type="text"
                  name="otp"
                  required
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-4 rounded-2xl border border-[#E2EEEC] bg-[#F4F9F8] outline-none focus:border-[#5BA8A0] transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#1A2B35] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-[#5BA8A0] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying..." : "Complete Registration"}
                </motion.button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-[#6B8A97] hover:text-[#1A2B35] transition-colors"
                >
                  Edit Information
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#E8EEF2]" />
          <span className="text-[10px] font-bold text-[#B8CFCC] uppercase">OR</span>
          <div className="flex-1 h-px bg-[#E8EEF2]" />
        </div>

        <motion.button
          onClick={() => loginWithGoogle()}
          whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)" }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-[#E2EEEC] bg-white text-sm font-bold text-[#1A2B35] hover:border-[#5BA8A0] transition-all mb-8"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="h-5" />
          Continue with Google
        </motion.button>

        <p className="text-center text-sm text-[#6B8A97]">
          Already have an account? <Link to="/login" className="text-[#5BA8A0] font-bold hover:underline">Sign In</Link>
        </p>

        <div className="mt-8 pt-8 border-t border-[#F5F7F9] flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#B8CFCC]">
            <ShieldCheck size={14} /> Secure Encryption
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#B8CFCC]">
            <CheckCircle2 size={14} /> 100% Privacy
          </div>
        </div>
      </motion.div>
    </div>
  );
}
