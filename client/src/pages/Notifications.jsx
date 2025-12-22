import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { FiBell, FiPackage, FiTruck, FiCheckCircle, FiInfo, FiArrowLeft, FiInbox, FiTrash2, FiX, FiClock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { 
        console.error("Fetch failed", err); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) { console.error("Delete failed"); }
  };

  const clearAll = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/notifications/clear/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (err) { console.error("Clear failed"); }
  };

  const getStatusConfig = (type) => {
    switch (type) {
      case 'Shipped': return { icon: <FiTruck />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'In Transit' };
      case 'Delivered': return { icon: <FiCheckCircle />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Delivered' };
      case 'Processing': return { icon: <FiPackage />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Processing' };
      default: return { icon: <FiInfo />, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Update' };
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center transition-colors duration-500">
            <div className="w-12 md:w-16 h-12 md:h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6" />
            <p className="text-slate-500 font-medium tracking-widest text-[10px] md:text-sm uppercase">Syncing Updates...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 transition-colors duration-500 relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 overflow-x-hidden">
      
      {/* SOFT AMBIENT BACKGROUND */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/40 to-transparent dark:from-blue-900/10 pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto relative z-10">
          
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12"
          >
            <div>
              <button 
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white font-bold text-xs md:text-sm mb-4 md:mb-6 transition-colors"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
              </button>
              <span className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 md:mb-2 block">Your Feed</span>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Activity <span className="text-blue-600">Log</span>
              </h1>
            </div>

            <AnimatePresence>
                {notifications.length > 0 && (
                <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={clearAll}
                    className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-600 font-bold text-[10px] md:text-xs uppercase tracking-wide bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 md:px-5 py-2 md:py-2.5 rounded-full shadow-sm hover:shadow-md transition-all w-full md:w-auto"
                >
                    <FiTrash2 /> Clear All Log
                </motion.button>
                )}
            </AnimatePresence>
          </motion.div>

          {/* Notifications List */}
          <div className="space-y-3 md:space-y-4">
            <AnimatePresence mode='popLayout'>
              {notifications.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] p-10 md:p-16 text-center border border-slate-100 dark:border-white/5 shadow-sm"
                >
                  <div className="w-16 md:w-20 h-16 md:h-20 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-blue-300 dark:text-slate-500">
                    <FiInbox size={32} />
                  </div>
                  <h3 className="text-lg md:text-xl font-serif font-bold text-slate-900 dark:text-white mb-2">All Caught Up</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-xs md:text-sm px-4">You have no new notifications at the moment.</p>
                </motion.div>
              ) : (
                notifications.map((n) => {
                  const config = getStatusConfig(n.statusType);
                  return (
                    <motion.div
                      key={n._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-white/5"
                    >
                      <div className="flex gap-3 md:gap-5 items-start">
                        {/* Icon */}
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center text-lg md:text-xl ${config.bg} ${config.color}`}>
                          {config.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex justify-between items-start gap-4 mb-1.5 md:mb-2">
                            <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                            <button 
                              onClick={() => deleteNotification(n._id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <FiX size={14} md:size={16} />
                            </button>
                          </div>
                          
                          <h4 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white leading-snug mb-1 md:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {n.message}
                          </h4>
                          
                          <p className="text-[10px] md:text-xs text-slate-400 font-medium flex items-center gap-1.5">
                              <FiClock size={10} md:size={12} /> {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
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