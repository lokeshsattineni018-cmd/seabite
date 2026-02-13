import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiShoppingBag, FiChevronRight, FiFileText, FiTruck, FiRefreshCw } from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- HERO COMPONENT: THE PRAWN JOURNEY ---
const PrawnProgress = ({ progress, status }) => {
  const isDelivered = status === "Delivered";
  return (
    <div className="relative w-24 h-20 flex items-center justify-center">
      <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]">
        {/* Organic S-Curve Path */}
        <motion.path
          d="M10,45 Q30,5 50,30 T90,15"
          fill="none"
          stroke={isDelivered ? "#fb7185" : "#3b82f6"} // Coral pink if delivered, Bio-blue if processing
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.1, progress / 100) }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* The Head / Eye Pulse */}
        <motion.circle
          cx="90" cy="15" r="2.5"
          fill={isDelivered ? "#fda4af" : "#60a5fa"}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </svg>
    </div>
  );
};

// --- HERO COMPONENT: THE CRAB PINCER HUB ---
const CrabActions = ({ onTrack, onInvoice }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <motion.div 
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="w-14 h-10 bg-orange-600 dark:bg-orange-500 rounded-t-full relative cursor-pointer shadow-xl z-20"
      >
        <div className="absolute -left-1 top-2 w-3 h-5 bg-orange-700 rounded-full origin-bottom -rotate-12" />
        <div className="absolute -right-1 top-2 w-3 h-5 bg-orange-700 rounded-full origin-bottom rotate-12" />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex gap-3 z-10"
          >
            <button onClick={onTrack} className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-blue-600 transition-all text-white" title="Track">
              <FiTruck size={18} />
            </button>
            <button onClick={onInvoice} className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-emerald-600 transition-all text-white" title="Invoice">
              <FiFileText size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
        setOrders(res.data);
      } finally { setLoading(false); }
    };
    fetch();
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const filteredOrders = useMemo(() => orders.filter(o => 
    (o.orderId || o._id).toLowerCase().includes(searchTerm.toLowerCase())
  ), [orders, searchTerm]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 pt-32 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* 1. THE SCHOOL OF FISH (Interactive Background) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(18)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full blur-[1px]"
            animate={{
              x: [Math.random() * 1000, Math.random() * 1200],
              y: [Math.random() * 800, Math.random() * 1000],
            }}
            transition={{ duration: 25 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
            style={{
              left: (mousePos.x * 0.02) + (i * 40) + "px",
              top: (mousePos.y * 0.02) + (i * 40) + "px",
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-24">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.6em] mb-4 block">SeaBite Deep Storage</span>
            <h1 className="text-6xl md:text-9xl font-serif font-bold tracking-tighter leading-none">
              Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-100 to-blue-900 italic font-light">Archive</span>
            </h1>
          </motion.div>

          <div className="mt-12 relative max-w-md group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:scale-125 transition-transform" />
            <input 
              type="text" 
              placeholder="Target a Reference ID..." 
              className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full py-5 pl-14 pr-8 text-sm outline-none focus:border-blue-500/50 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="space-y-12 animate-pulse">
            {[1, 2].map(n => <div key={n} className="h-64 bg-white/5 rounded-[4rem]" />)}
          </div>
        ) : (
          <div className="space-y-32">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, filter: "blur(20px)" }}
                  whileInView={{ opacity: 1, filter: "blur(0px)" }}
                  className="relative group"
                >
                  {/* FLUID WATER POCKET CONTAINER */}
                  <div className="flex flex-col lg:flex-row items-center gap-12 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl p-10 md:p-16 rounded-[4rem] border border-white/5 hover:border-blue-500/40 transition-all duration-700">
                    
                    {/* Prawn Progress Section */}
                    <div className="shrink-0 scale-125 md:scale-150 group-hover:rotate-6 transition-transform duration-700">
                      <PrawnProgress 
                        status={order.status} 
                        progress={order.status === "Delivered" ? 100 : order.status === "Shipped" ? 70 : 35} 
                      />
                    </div>

                    {/* Meta Section */}
                    <div className="flex-1 text-center lg:text-left space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Biological Record</p>
                      <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(order.totalAmount)}
                      </h2>
                      <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">ID: #{order._id.slice(-6).toUpperCase()}</span>
                        <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">{order.items.length} Varieties</span>
                      </div>
                    </div>

                    {/* Crab Action Hub */}
                    <div className="shrink-0">
                      <CrabActions 
                        onTrack={() => navigate(`/orders/${order._id}`)}
                        onInvoice={() => window.print()}
                      />
                    </div>
                  </div>

                  {/* Bioluminescent Glow */}
                  <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <footer className="mt-60 py-20 text-center opacity-10 text-[10px] font-black uppercase tracking-[2em]">
        Bottom of the Abyss
      </footer>
    </div>
  );
}