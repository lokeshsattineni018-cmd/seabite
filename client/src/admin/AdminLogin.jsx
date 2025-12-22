import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiLock, FiUser, FiArrowRight, FiShield, FiLoader, FiEye, FiEyeOff, FiCpu, FiActivity } from "react-icons/fi";
import PopupModal from "../components/PopupModal";

// Constants
const API_URL = "http://localhost:5001";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setModal({ show: true, message: "Credential injection required.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      // Clinical sync delay
      await new Promise((resolve) => setTimeout(resolve, 1200)); 

      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (res.data.user.role !== "admin") {
        setModal({ show: true, message: "Unauthorized Entity. Access Terminated.", type: "error" });
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/admin/dashboard");
      window.location.reload();
      
    } catch (err) {
      setModal({ 
        show: true, 
        message: "Authentication mismatch. Verify credentials.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7fa] relative overflow-hidden font-sans">
      
      {/* 🧬 TECH-CLINICAL BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 blur-[120px] rounded-full" />
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <PopupModal 
        show={modal.show} 
        message={modal.message} 
        type={modal.type} 
        onClose={() => setModal({ ...modal, show: false })} 
      />

      {/* LOGIN MODULE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-white p-10 md:p-12 relative overflow-hidden">
          
          {/* Luminous Top Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_2px_10px_rgba(59,130,246,0.3)]" />

          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full scale-150"
                />
                <div className="w-20 h-20 bg-[#f8fafc] rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner relative z-10">
                   <FiCpu size={40} className="text-blue-600" />
                </div>
            </div>
            <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight uppercase">Terminal <span className="text-blue-600 italic">v2.0</span></h1>
            <p className="text-slate-400 text-[10px] font-black tracking-[0.4em] uppercase mt-2">Administrative Node Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Asset Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Identifier</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <FiUser size={18} />
                </div>
                <input
                  type="email"
                  placeholder="admin@seabite.net"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Verification Key */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Secure Key</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                  <FiLock size={18} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-2xl py-5 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-blue-600 hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Deck</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          {/* Footer Logistics */}
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-slate-50 pt-8">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Host Connection: Secure</span>
             </div>
             <p className="text-[9px] text-slate-300 font-mono tracking-tighter">
               Terminal ID: 0x9AF2 • Last Sync: {new Date().toLocaleTimeString()}
             </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}