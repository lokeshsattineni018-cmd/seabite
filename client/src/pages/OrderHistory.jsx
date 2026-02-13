import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingBag,
  FiCalendar,
  FiChevronRight,
  FiAlertCircle,
  FiPackage,
  FiTruck,
  FiSearch,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
};

// --- SUB-COMPONENT: SKELETON LOADING ---
const OrderSkeleton = () => (
  <div className="w-full h-44 bg-white/40 dark:bg-slate-800/40 animate-pulse rounded-[2rem] border border-slate-100 dark:border-slate-700 mb-6" />
);

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/orders/myorders`, {
          withCredentials: true,
        });
        setOrders(res.data);
      } catch (err) {
        setError("Unable to retrieve your order history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // --- LOGIC: FILTERING & SEARCHING ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderId = (order.orderId || order._id).toLowerCase();
      const matchesSearch = orderId.includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === "All" || order.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, activeTab]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-200 p-4 md:p-12 transition-colors duration-500 pt-24 md:pt-32 relative overflow-hidden">
      
      {/* AMBIENT BACKGROUND ELEMENTS */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-400/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <header className="mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
            <div>
              <p className="text-blue-600 dark:text-blue-400 font-bold tracking-[0.3em] text-[10px] uppercase mb-2">
                Order Management
              </p>
              <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">
                Your <span className="text-blue-600 italic font-light">Catches</span>
              </h1>
            </div>

            {/* SEARCH UTILITY */}
            <div className="relative group w-full md:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search by Order ID..."
                className="w-full bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-blue-400/20 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </motion.div>

          {/* STATUS TABS (Amazon/Flipkart Style) */}
          <div className="flex gap-2 mt-8 overflow-x-auto pb-2 no-scrollbar">
            {["All", "Processing", "Shipped", "Delivered"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === status 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl" 
                  : "bg-white dark:bg-slate-800/50 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-blue-400"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((n) => <OrderSkeleton key={n} />)}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/10 p-12 rounded-[3rem] border border-red-100 dark:border-red-900/20 text-center">
             <FiAlertCircle className="mx-auto mb-4 text-red-500" size={48} />
             <h2 className="font-serif text-2xl text-red-600 mb-2">Something went wrong</h2>
             <p className="text-red-500/80">{error}</p>
          </div>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 overflow-hidden">
                    
                    {/* ORDER HEADER BAR */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/40 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        <span>Placed: <b className="text-slate-800 dark:text-slate-200 ml-1">{formatDate(order.createdAt)}</b></span>
                        <span>Total: <b className="text-slate-800 dark:text-slate-200 ml-1">{formatCurrency(order.totalAmount)}</b></span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-500/70 group-hover:text-blue-500 transition-colors">
                        ID: #{order.orderId || order._id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    {/* MAIN CARD BODY */}
                    <div className="p-8 md:p-10 flex flex-col lg:flex-row items-center gap-10">
                      
                      {/* STATUS ICON WITH WATER PULSE */}
                      <div className="relative shrink-0">
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-colors shadow-inner ${
                          order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                          {order.status === 'Delivered' ? <FiPackage size={32} /> : <FiTruck className="animate-bounce" size={32} />}
                        </div>
                        {order.status !== 'Delivered' && (
                          <div className="absolute inset-0 rounded-[2rem] border-2 border-blue-400/20 animate-ping" />
                        )}
                      </div>

                      {/* PROGRESS HUB */}
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-1">{order.status}</h3>
                            <p className="text-sm text-slate-500 italic">Expected arrival curated for peak freshness.</p>
                          </div>
                          <button 
                            onClick={() => navigate(`/orders/${order._id}`)}
                            className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-3 transition-all"
                          >
                            Timeline <FiChevronRight />
                          </button>
                        </div>

                        {/* LIVE TRACKING BAR */}
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: order.status === 'Delivered' ? '100%' : '45%' }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className={`h-full rounded-full ${
                              order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}
                          />
                        </div>
                      </div>

                      {/* FUNCTIONAL BUTTON CLUSTER */}
                      <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-44">
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
                          <FiRefreshCw size={14} /> Reorder
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                          <FiDownload size={14} /> Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredOrders.length === 0 && !loading && (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiShoppingBag className="text-slate-300" size={32} />
                </div>
                <h3 className="font-serif text-2xl text-slate-400 italic">No matches in your catch history</h3>
                <button 
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-blue-500 font-bold text-sm underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}