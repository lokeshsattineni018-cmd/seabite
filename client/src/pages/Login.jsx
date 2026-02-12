import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../components/PopupModal";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "info",
  });

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
        setModal({
          show: true,
          message: err?.response?.data?.message || "Verification failed. Please try again.",
          type: "error",
        });
      }
    },
    onError: (error) => {
      setModal({ show: true, message: "Google login was unsuccessful.", type: "error" });
    },
    flow: window.innerWidth < 768 ? "redirect" : "implicit",
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0a1625] relative overflow-hidden transition-colors duration-500">
      {/* Animated ambient background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/60 dark:bg-blue-900/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-100/50 dark:bg-cyan-900/15 rounded-full blur-[120px]"
        />
      </div>

      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <motion.div
          whileHover={{ y: -4, boxShadow: "0 30px 60px rgba(0,0,0,0.12)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] p-10 text-center shadow-2xl border border-white/80 dark:border-white/10 transition-colors duration-500"
        >
          <div className="mb-8">
            <Link to="/" className="inline-block mb-6 hover:scale-105 transition-transform">
              <motion.img
                src="/logo.png"
                className="h-14 mx-auto object-contain"
                alt="SeaBite"
                initial={{ opacity: 0, rotate: -10 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
              />
            </Link>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight"
            >
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-slate-500 dark:text-slate-400 text-sm"
            >
              Sign in with Google to access your account.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <motion.button
              onClick={() => login()}
              whileHover={{ scale: 1.03, boxShadow: "0 12px 30px rgba(66,133,244,0.35)" }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-3 bg-[#4285F4] text-white font-semibold py-3.5 px-6 rounded-full shadow-lg hover:bg-[#357ae8] transition-all w-full"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                className="w-6 h-6 bg-white rounded-full p-1"
                alt="google"
              />
              Sign in with Google
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-[10px] text-slate-400 dark:text-slate-500 mt-4 leading-relaxed uppercase tracking-wider"
          >
            Your identity is secured by Google OAuth 2.0. We do not store your
            password.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}