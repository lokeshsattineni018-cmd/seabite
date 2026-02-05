import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PopupModal from "../components/PopupModal";
import { GoogleLogin } from "@react-oauth/google"; 

export default function Login() {
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // ✅ STRENGTHENED SELECTION: credentialResponse.credential is the 3-part JWT
      const idToken = credentialResponse.credential;

      if (!idToken) {
          throw new Error("No ID Token received from Google");
      }

      console.log("Frontend debug: Token starts with", idToken.substring(0, 10));

      const res = await axios.post("/api/auth/google", {
        token: idToken,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setModal({ show: true, message: "Login Successful!", type: "success" });
      
      setTimeout(() => {
          window.location.href = res.data.user.role === "admin" ? "/admin/dashboard" : "/";
      }, 1000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Google Login Failed. Please try again.";
      console.error("Login error:", errorMessage);
      setModal({ show: true, message: errorMessage, type: "error" });
    }
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
            <Link to="/" className="inline-block mb-6 hover:scale-105 transition-transform">
              <img src="/logo.png" className="h-14 mx-auto object-contain" alt="SeaBite" />
            </Link>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in with Google to continue.</p>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Google Auth Failed')}
              shape="pill"
              theme="filled_blue" 
              size="large"
              width="250"
              // Removed useOneTap to avoid token type conflicts
            />
          </div>
          <p className="text-xs text-slate-400 mt-4">By continuing, you agree to our Terms of Service.</p>
        </div>
      </motion.div>
    </div>
  );
}