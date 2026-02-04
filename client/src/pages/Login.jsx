import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../components/PopupModal";
import { GoogleLogin } from "@react-oauth/google"; 

export default function Login() {
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  // navigate is technically not needed if we force reload, but keeping it is fine
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("https://www.seabite.co.in/api/auth/google", {
        token: credentialResponse.credential,
      });

      // 1. Save Token & User immediately
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setModal({ show: true, message: "Login Successful!", type: "success" });
      
      // 2. INSTANT RELOAD (Removes the delay)
      // We check the role and immediately force the browser to go there.
      // This forces the Navbar to re-read localStorage instantly.
      if (res.data.user.role === "admin") {
          window.location.href = "/admin/dashboard";
      } else {
          window.location.href = "/";
      }

    } catch (err) {
      setModal({ 
        show: true, 
        message: "Google Login Failed. Please try again.", 
        type: "error" 
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      
      {/* ================= BACKGROUND ATMOSPHERE ================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-100/50 rounded-full blur-[120px]" />
      </div>

      {/* WAVE DECORATION */}
      <div className="absolute bottom-0 left-0 w-full opacity-20 pointer-events-none">
         <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0ea5e9" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
         </svg>
      </div>

      <PopupModal 
        show={modal.show} 
        message={modal.message} 
        type={modal.type} 
        onClose={() => setModal({ ...modal, show: false })} 
      />

      {/* ================= GLASS LOGIN CARD ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white p-10 relative overflow-hidden text-center">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-300 to-transparent opacity-50" />

          {/* Logo & Header */}
          <div className="mb-8">
            <Link to="/" className="inline-block mb-6 hover:scale-105 transition-transform">
              <img src="/logo.png" alt="SeaBite" className="h-14 mx-auto object-contain" />
            </Link>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in to continue your order.</p>
          </div>

          {/* Google Button (CENTERED & LARGE) */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              shape="pill"
              theme="filled_blue" 
              size="large"
              width="250"
              text="continue_with"
            />
          </div>

          <p className="text-xs text-slate-400 mt-4">
             By continuing, you agree to our Terms of Service.
          </p>

        </div>
      </motion.div>
    </div>
  );
}