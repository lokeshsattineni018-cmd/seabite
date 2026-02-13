import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiShoppingBag,
  FiArrowLeft,
  FiCheck,
  FiTruck,
  FiFileText,
  FiDownload,
  FiAnchor,
  FiNavigation
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import PopupModal from "../components/PopupModal";
import Invoice from "../components/Invoice";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- THE HERO: PRAWN VOYAGE STEPPER ---
const PrawnVoyage = ({ progress, status }) => {
  const isDelivered = status === "Delivered";
  return (
    <div className="relative w-full py-12 px-6">
      <svg viewBox="0 0 400 100" className="w-full h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        {/* The Abyss Path */}
        <path d="M20,50 Q100,10 200,50 T380,50" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10" strokeDasharray="4 4" />
        
        {/* The Living Journey Path */}
        <motion.path
          d="M20,50 Q100,10 200,50 T380,50"
          fill="none"
          stroke={isDelivered ? "#f472b6" : "#3b82f6"}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(0.05, progress / 100) }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />

        {/* The Pulse (Current Position) */}
        <motion.circle
          r="5"
          fill={isDelivered ? "#f472b6" : "#60a5fa"}
          animate={{ 
            cx: progress === 100 ? 380 : (20 + (progress * 3.6)),
            cy: progress === 100 ? 50 : (50 - Math.sin(progress * 0.05) * 20),
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </svg>
      <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">
        <span>Docked</span>
        <span className={isDelivered ? "text-pink-400" : "text-blue-500 animate-pulse"}>
            {status === "Delivered" ? "Arrived at Shore" : "Navigating Waters"}
        </span>
      </div>
    </div>
  );
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [modalConfig, setModalConfig] = useState({ show: false, message: "", type: "info" });

  const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];
  const currentStepIndex = statusSteps.indexOf(order?.status || "Pending");
  const progressPercent = ((currentStepIndex + 1) / statusSteps.length) * 100;

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, { withCredentials: true });
      setOrder(response.data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-16 h-16 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white pt-28 pb-40 px-6 relative overflow-x-hidden">
      
      {/* DEEP SEA DEPTHS BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-cyan-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
            <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-blue-400 transition-all">
                <FiArrowLeft className="group-hover:-translate-x-2 transition-transform" /> Exit Voyage
            </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* LEFT: THE MANIFEST & JOURNEY */}
          <div className="lg:col-span-2 space-y-10">
            
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden">
                <div className="p-10 border-b border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-1">Manifest Reference</p>
                            <h2 className="text-3xl font-serif font-bold tracking-tighter italic">#{order._id.slice(-8).toUpperCase()}</h2>
                        </div>
                        <FiAnchor className="text-blue-500/20" size={40} />
                    </div>
                    
                    <PrawnVoyage progress={progressPercent} status={order.status} />
                </div>

                <div className="p-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-2"><FiShoppingBag /> Species Selection</h3>
                    <div className="space-y-8">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-8 group">
                                <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-700">
                                    <img src={`${API_URL}/uploads/${item.image.split("/").pop()}`} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-serif font-bold text-white">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Quantity: {item.qty} Unit(s)</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-serif font-bold text-blue-400">{formatCurrency(item.price * item.qty)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
          </div>

          {/* RIGHT: THE OYSTER BILLING & DESTINATION */}
          <div className="space-y-10 sticky top-32">
            
            {/* DESTINATION CARD */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10">
                <FiNavigation className="text-blue-400 mb-6" size={24} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Navigational Endpoint</h3>
                <p className="font-bold text-xl font-serif">{order.shippingAddress?.fullName}</p>
                <p className="text-xs text-slate-500 italic leading-relaxed mt-2">
                    {order.shippingAddress?.street},<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.zip}
                </p>
            </motion.div>

            {/* THE "OYSTER PEARL" FINANCIAL CARD */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-600 to-blue-900 p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(30,58,138,0.5)] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[50px] rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-8">Settlement Overview</h3>
                
                <div className="space-y-4 text-sm font-medium">
                    <div className="flex justify-between text-blue-200/60"><span>Market Price</span><span>{formatCurrency(order.itemsPrice)}</span></div>
                    <div className="flex justify-between text-blue-200/60"><span>Voyage Fee</span><span>{order.shippingPrice === 0 ? "Comped" : formatCurrency(order.shippingPrice)}</span></div>
                    <div className="flex justify-between text-blue-200/60"><span>GST Contribution</span><span>{formatCurrency(order.taxPrice)}</span></div>
                    <div className="h-px bg-white/10 w-full my-6" />
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-200">Total Harvest</p>
                            <p className="text-4xl font-serif font-bold mt-1">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <FiCheck size={28} className="text-blue-200/40" />
                    </div>
                </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* THE ACTION DOCK: REINVENTED FOR DEEP SEA */}
      <motion.div initial={{ y: 150 }} animate={{ y: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl z-[1000]">
        <button onClick={() => window.print()} className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all text-white" title="Download Document">
            <FiDownload size={20} />
        </button>
        <div className="w-px h-10 bg-white/10" />
        <button onClick={() => navigate("/products")} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all">
            Browse Shore
        </button>
      </motion.div>

      <div className="hidden"><Invoice order={order} type="invoice" /></div>
    </div>
  );
}