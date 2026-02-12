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
        console.log("🔐 Login: Sending token to backend...");
        
        const res = await axios.post(
          `${API_URL}/api/auth/google`,
          {
            token: tokenResponse.access_token,
          },
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log("✅ Login: Backend responded", res.data);
        setUser(res.data.user);

        setModal({
          show: true,
          message: "Login Successful! Redirecting...",
          type: "success",
        });

        setTimeout(async () => {
          console.log("🔄 Login: Refreshing auth state...");
          await refreshMe?.();
          
          const redirectPath = localStorage.getItem("postLoginRedirect");
          if (redirectPath) localStorage.removeItem("postLoginRedirect");

          const targetPath = redirectPath || 
            (res.data.user.role === "admin" ? "/admin/dashboard" : "/");
          
          console.log("↗️ Login: Redirecting to", targetPath);
          window.location.href = targetPath;
        }, 1500);
      } catch (err) {
        console.error("❌ Login verification failed:", err);
        console.error("Response:", err?.response?.data);
        
        setModal({
          show: true,
          message: err?.response?.data?.message || "Verification failed. Please try again.",
          type: "error",
        });
      }
    },
    onError: (error) => {
      console.error("❌ Google Login Failed:", error);
      setModal({
        show: true,
        message: "Google login was unsuccessful.",
        type: "error",
      });
    },
    flow: window.innerWidth < 768 ? 'redirect' : 'implicit',
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-100/50 rounded-full blur-[120px]" />
      </div>

      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 text-center shadow-2xl border border-white">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-block mb-6 hover:scale-105 transition-transform"
            >
              <img
                src="/logo.png"
                className="h-14 mx-auto object-contain"
                alt="SeaBite"
              />
            </Link>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 text-sm">
              Sign in with Google to access your account.
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={() => login()}
              className="flex items-center justify-center gap-3 bg-[#4285F4] text-white font-semibold py-3.5 px-6 rounded-full shadow-lg hover:bg-[#357ae8] transition-all w-full active:scale-95"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                className="w-6 h-6 bg-white rounded-full p-1"
                alt="google"
              />
              Sign in with Google
            </button>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed uppercase tracking-wider">
            Your identity is secured by Google OAuth 2.0. We do not store your password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}