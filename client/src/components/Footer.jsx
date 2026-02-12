import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiMapPin, FiPhone, FiMail, FiSend, FiLoader, FiCheck } from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Footer() {
  const { isDarkMode } = useContext(ThemeContext);
  
  // Form State
  const [formData, setFormData] = useState({ email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      setStatus("success");
      setFormData({ email: "", message: "" });
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <footer className="bg-slate-50 dark:bg-[#0b1120] border-t border-slate-200 dark:border-white/5 pt-16 md:pt-20 pb-12 font-sans relative overflow-hidden transition-colors duration-500">
      
      {/* SOFT AMBIENT GLOW */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-16 mb-16">
          
          {/* BRAND COLUMN */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                SeaBite
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Delivering the freshest catch from coast to kitchen. Premium quality seafood sourced responsibly and delivered with care to your kitchen.
            </p>
          </div>

          {/* INFORMATION COLUMN */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Information</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</Link></li>
              <li><Link to="/products" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Shop Seafood</Link></li>
            </ul>
          </div>

          {/* LEGAL COLUMN */}
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Legal & Policy</h4>
            <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cancellation" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cancellation & Refund</Link></li>
            </ul>
          </div>

          {/* CONTACT FORM COLUMN */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Contact Us</h4>
            
            {/* The Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="email" 
                placeholder="Your Email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <textarea 
                placeholder="Message..." 
                required
                rows="2"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-slate-900 dark:text-white resize-none placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                disabled={status === "loading" || status === "success"}
                className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg
                  ${status === "success" 
                    ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                    : status === "error"
                    ? "bg-red-500 text-white"
                    : "bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 shadow-blue-500/20"
                  }
                `}
              >
                {status === "loading" ? <FiLoader className="animate-spin" /> : 
                 status === "success" ? <>Sent <FiCheck /></> : 
                 status === "error" ? "Retry" :
                 <>Send <FiSend /></>}
              </button>
            </form>

            {/* Small Contact Details below form */}
            <div className="space-y-2 pt-2">
               <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <FiPhone className="text-blue-600 dark:text-blue-400 shrink-0" size={14} />
                  <span>+91 9866635566</span>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <FiMail className="text-blue-600 dark:text-blue-400 shrink-0" size={14} />
                  <span>support@seabite.co.in</span>
               </div>
            </div>

          </div>

        </div>

        {/* COPYRIGHT BAR */}
        <div className="border-t border-slate-200 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-slate-400 text-xs font-medium tracking-wide">
             © {new Date().getFullYear()} SeaBite Seafoods. All rights reserved.
          </p>
          <p className="text-slate-400 text-xs flex items-center gap-1 font-medium">
             Freshly sourced from the coastline of Andhra Pradesh
          </p>
        </div>
      </div>
    </footer>
  );
}