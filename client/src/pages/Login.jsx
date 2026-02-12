import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../components/PopupModal";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const { setUser, refreshMe } = useAuth();

  const handleGoogleLogin = () => {
    // Let backend + Passport handle the Google OAuth flow
    window.location.href = "/api/auth/google";
  };

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
              Sign in with Google to access your account and continue enjoying our fresh seafood delights!
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={handleGoogleLogin}
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
            Your identity is secure with us. We only use your Google account to verify your identity and never store or share your personal information.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
