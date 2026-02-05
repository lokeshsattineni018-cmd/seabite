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
      // 🚨 THE FIX: Use .credential (the 3-segment JWT)
      const idToken = credentialResponse.credential;

      // PROXY FIX: Relative path triggers the vercel.json rewrite
      const res = await axios.post("/api/auth/google", {
        token: idToken,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setModal({ show: true, message: "Login Successful!", type: "success" });
      
      // Forces the Navbar/App state to refresh instantly
      setTimeout(() => {
          window.location.href = res.data.user.role === "admin" ? "/admin/dashboard" : "/";
      }, 1000);

    } catch (err) {
      console.error("Login error:", err.response?.data?.message || err.message);
      setModal({ 
        show: true, 
        message: err.response?.data?.message || "Google Login Failed.", 
        type: "error" 
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <PopupModal 
        show={modal.show} 
        message={modal.message} 
        type={modal.type} 
        onClose={() => setModal({ ...modal, show: false })} 
      />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-10 text-center shadow-xl border border-white">
          <Link to="/" className="inline-block mb-6">
            <img src="/logo.png" className="h-14" alt="SeaBite" />
          </Link>
          <h2 className="text-2xl font-bold mb-8">Welcome Back</h2>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap
              shape="pill"
              size="large"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}