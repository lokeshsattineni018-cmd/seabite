import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingBag,
  FiChevronRight,
  FiFileText,
  FiMapPin,
  FiPackage,
  FiStar,
  FiEdit2,
} from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";
import ReviewModal from "../components/ReviewModal";
import PopupModal from "../components/PopupModal";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- HERO 1: THE PRAWN JOURNEY (S-Curve Progress) ---
const PrawnProgress = ({ progress, status }) => {
  const isDelivered = status === "Delivered";
  const isCancelled = status === "Cancelled";

  return (
    <div className="relative w-32 h-20 flex flex-col items-center justify-center group">
      <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-2xl">
        {/* The organic path of the prawn */}
        <path
          d="M10,40 Q30,10 50,30 T90,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-white/10"
        />
        <motion.path
          d="M10,40 Q30,10 50,30 T90,10"
          fill="none"
          stroke={isCancelled ? "#ef4444" : isDelivered ? "#f472b6" : "#3b82f6"}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress / 100 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Pulsing Eye/Head */}
        <motion.circle
          cx="90"
          cy="10"
          r="2"
          fill={isDelivered ? "#f472b6" : "#3b82f6"}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </svg>
      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isDelivered ? 'text-pink-400' : 'text-blue-400'}`}>
        {status}
      </span>
    </div>
  );
};

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalConfig, setModalConfig] = useState({ show: false, message: "", type: "info" });

  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
        setOrders(response.data);
      } finally { setLoading(false); }
    };
    fetchOrders();
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 bg-blue-500/20 rounded-full blur-xl" 
      />
      <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-4 animate-pulse">Scanning Depths...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-12 pt-32 md:pt-44 relative overflow-hidden">
      
      {/* 2. THE SCHOOL OF FISH (Interactive Background) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full blur-[1px]"
            animate={{
              x: [Math.random() * 1000, Math.random() * 1200],
              y: [Math.random() * 800, Math.random() * 900],
            }}
            transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
            style={{
              left: (mousePos.x * 0.015) + (i * 50) + "px",
              top: (mousePos.y * 0.015) + (i * 30) + "px",
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* HEADER: Fluid Typography */}
        <header className="mb-24">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.6em] mb-4 block">SeaBite Vault</span>
            <h1 className="text-6xl md:text-9xl font-serif font-bold tracking-tighter leading-none mb-4">
              Your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-200 to-blue-900 italic font-light">Catches</span>
            </h1>
          </motion.div>
        </header>

        {orders.length === 0 ? (
            <div className="text-center py-20 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10">
                <FiShoppingBag className="mx-auto mb-6 text-blue-500/50" size={50} />
                <p className="font-serif italic text-xl">The waters are quiet. No catches found.</p>
                <button onClick={() => navigate("/products")} className="mt-8 px-10 py-4 bg-blue-600 rounded-full font-bold text-xs uppercase tracking-widest">Explore Market</button>
            </div>
        ) : (
          <div className="space-y-24">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, filter: "blur(20px)" }}
                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                viewport={{ once: true }}
                className="relative group"
              >
                {/* 3. FLUID CONTENT CONTAINER */}
                <div className="flex flex-col lg:flex-row items-center gap-12 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-2xl p-10 md:p-16 rounded-[4rem] border border-white/10 hover:border-blue-500/40 transition-all duration-700">
                  
                  {/* Prawn Visualization */}
                  <div className="shrink-0 scale-125 md:scale-150">
                    <PrawnProgress 
                      status={order.status} 
                      progress={order.status === "Delivered" ? 100 : order.status === "Shipped" ? 70 : 30} 
                    />
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 text-center lg:text-left space-y-4">
                    <div className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400">
                      ID: #{order.orderId || order._id.slice(-6).toUpperCase()}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(order.totalAmount)}
                    </h2>
                    <p className="text-slate-400 text-xs font-medium tracking-wide flex items-center justify-center lg:justify-start gap-2">
                       <FiMapPin className="text-blue-500" /> {order.shippingAddress?.city} — {order.items.length} Varieties
                    </p>
                  </div>

                  {/* Navigation Trigger */}
                  <button 
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500 shadow-2xl"
                  >
                    <FiChevronRight size={30} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Bioluminescent Glow */}
                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-40 py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-[1em]">
        End of Depth
      </footer>
    </div>
  );
}