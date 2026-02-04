import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function LegalPage({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f18] transition-colors duration-500 overflow-x-hidden relative">
      
      {/* 🌊 AMBIENT LAYER: Soft glowing orbs that change with theme */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 dark:bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 pt-32 md:pt-40 pb-24">
        
        {/* 🟢 BACK BUTTON: Clean, minimalist, and non-intrusive */}
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-12 group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return</span>
        </motion.button>

        {/* 🟢 HEADER: Massive typography with a modern edge */}
        <header className="mb-20">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-blue-600 dark:text-blue-500 font-black text-[10px] md:text-xs uppercase tracking-[0.5em] mb-4"
          >
            {subtitle}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-9xl font-serif font-bold text-slate-900 dark:text-white leading-none tracking-tighter"
          >
            {title}
          </motion.h1>
        </header>

        {/* 🟢 CONTENT: Clean split or staggered layout */}
        <main className="relative">
           {children}
        </main>
      </div>
    </div>
  );
}