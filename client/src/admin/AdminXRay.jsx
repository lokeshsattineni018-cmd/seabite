import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiXCircle, FiZap, FiUser, FiClock, FiShoppingCart, FiBell, FiCheck, FiX, FiInfo, FiCopy } from "react-icons/fi";
import socket from "../utils/socket";
import toast from "../utils/toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import axios from "axios";

const T = {
  bg: "#F8FAFC",
  card: "#ffffff",
  accent: "#5BA8A0",
  danger: "#E11D48",
  warning: "#F59E0B",
  text: "#1E293B",
  muted: "#64748B"
};

export default function AdminXRay() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

  useEffect(() => {
    socket.emit("join-admin");

    socket.on("FRUSTRATION_ALERT", (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
      // Play subtle alert sound
      audioRef.current.play().catch(() => {});
      toast("New Frustration Alert!", { icon: "🔍", style: { background: T.danger, color: "#fff" } });
    });

    return () => {
      socket.off("FRUSTRATION_ALERT");
    };
  }, []);

  const handleRescue = async (alert) => {
    try {
      // 1. Create a dynamic 'RESCUE50' coupon if it doesn't exist or just use a standard one
      const rescueCode = "RESCUE50";
      
      // In a real app, we might send an SMS or Push here. 
      // For now, we'll simulate sending it to their session.
      toast.success(`Rescue coupon ${rescueCode} sent to ${alert.user?.name || 'Guest'}!`);
      
      // Mark as rescued locally
      setAlerts(prev => prev.map(a => a.timestamp === alert.timestamp ? { ...a, rescued: true } : a));
    } catch (err) {
      toast.error("Failed to initiate rescue");
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "COUPON_ABUSE": return { color: T.danger, bg: "#FFF1F2", label: "Coupon Friction", icon: <FiXCircle /> };
      case "HOVER_STALL": return { color: T.warning, bg: "#FFFBEB", label: "Button Hesitation", icon: <FiZap /> };
      case "TIME_STALL": return { color: "#7C3AED", bg: "#F5F3FF", label: "Checkout Stall", icon: <FiClock /> };
      default: return { color: T.muted, bg: "#F1F5F9", label: "Interaction", icon: <FiInfo /> };
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#F8FAFC] font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <FiBell size={24} className={alerts.some(a => !a.rescued) ? "animate-bounce" : ""} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">X-Ray Interaction Monitor</h1>
              <p className="text-slate-500 text-sm">Real-time friction alerts from checkout sessions.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE FEED ACTIVE
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence initial={false}>
            {alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center justify-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400"
              >
                <FiUser size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No friction detected yet.</p>
                <p className="text-xs">Watching checkout sessions in real-time...</p>
              </motion.div>
            ) : (
              alerts.map((alert, index) => {
                const style = getTypeStyle(alert.type);
                return (
                  <motion.div
                    key={alert.timestamp}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative overflow-hidden bg-white p-6 rounded-3xl border-2 transition-all ${alert.rescued ? 'border-emerald-100 opacity-60' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
                  >
                    {alert.rescued && (
                      <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-bl-xl uppercase tracking-widest">
                        Rescued
                      </div>
                    )}
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex items-center gap-4 flex-1">
                        <div style={{ background: style.bg, color: style.color }} className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                          {style.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ color: style.color }} className="text-[10px] font-black uppercase tracking-widest">{style.label}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 text-[10px] font-bold">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {alert.user ? alert.user.name : `Guest User (${alert.guestId?.slice(0, 8)})`}
                          </h3>
                          <p className="text-slate-500 text-sm font-medium">
                            {alert.type === "COUPON_ABUSE" && `Failed coupon attempts: ${alert.details.attempts} (Last: ${alert.details.lastCode})`}
                            {alert.type === "HOVER_STALL" && `Hovered on 'Place Order' for over ${alert.details.duration}.`}
                            {alert.type === "TIME_STALL" && `Stuck on checkout for ${alert.details.minutes} minutes.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 md:border-l md:pl-6 border-slate-100">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cart Value</p>
                          <p className="text-lg font-black text-slate-900">₹{alert.cartTotal}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items</p>
                          <p className="text-lg font-black text-slate-900">{alert.items}</p>
                        </div>
                        <button
                          disabled={alert.rescued}
                          onClick={() => handleRescue(alert)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${alert.rescued ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-lg active:scale-95'}`}
                        >
                          {alert.rescued ? <FiCheck /> : <FiZap />}
                          {alert.rescued ? 'Coupon Sent' : 'Instant Rescue'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
