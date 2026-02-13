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
  FiCheck,
  FiX,
  FiSearch,
  FiArrowUp,
  FiArrowDown,
  FiClock,
  FiRefreshCcw,
} from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "\u20B90.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Delivered":
      return <FiCheck size={14} />;
    case "Cancelled":
    case "Cancelled by User":
      return <FiX size={14} />;
    case "Shipped":
      return <FiTruck size={14} />;
    case "Processing":
      return <FiRefreshCcw size={14} />;
    default:
      return <FiClock size={14} />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
        ring: "ring-emerald-500/20",
      };
    case "Cancelled":
    case "Cancelled by User":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/20",
        ring: "ring-red-500/20",
      };
    case "Shipped":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
        ring: "ring-blue-500/20",
      };
    default:
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
        ring: "ring-amber-500/20",
      };
  }
};

// --- VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
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
        console.error("Failed to fetch orders:", err);
        if (err.response && err.response.status === 401) {
          // not authenticated
        } else {
          setError("Unable to load order history. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          (o.orderId || o._id).toLowerCase().includes(q) ||
          o.status?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
    return result;
  }, [orders, searchQuery, sortAsc]);

  // --- STATS ---
  const stats = useMemo(() => {
    const total = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const active = orders.filter(
      (o) =>
        o.status === "Pending" ||
        o.status === "Processing" ||
        o.status === "Shipped"
    ).length;
    return { total, delivered, active };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] flex flex-col items-center justify-center transition-colors duration-500">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FiClock className="text-blue-600" size={16} />
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-slate-400 font-medium tracking-wider text-xs uppercase"
        >
          Loading History...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/80 via-transparent to-transparent dark:from-blue-950/20 dark:via-transparent" />
        <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-blue-100/30 dark:bg-blue-900/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-16">
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-2"
          >
            <span className="w-6 h-px bg-blue-600 dark:bg-blue-400" />
            Account Activity
          </motion.span>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Past <span className="text-blue-600">Orders</span>
            </h1>
          </div>
        </motion.div>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 text-center bg-red-500/5 border border-red-500/10 rounded-3xl text-red-500 font-medium flex flex-col items-center justify-center gap-3"
          >
            <FiAlertCircle size={32} />
            <p className="text-sm">{error}</p>
          </motion.div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-slate-800/60 backdrop-blur-xl p-12 md:p-20 rounded-3xl border border-slate-200/60 dark:border-white/5 text-center shadow-xl shadow-slate-200/40 dark:shadow-none"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-100/50 dark:shadow-none"
            >
              <FiShoppingBag
                className="text-blue-500 dark:text-blue-400"
                size={32}
              />
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              No Order History
            </h3>
            <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
              It looks like you haven't made any purchases yet. Start exploring
              our fresh catch collection.
            </p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20"
            >
              Start Shopping
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ============ STATS CARDS ============ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
            >
              {[
                {
                  label: "Total Orders",
                  value: orders.length,
                  icon: <FiPackage size={18} />,
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Active",
                  value: stats.active,
                  icon: <FiTruck size={18} />,
                  color: "text-amber-600 dark:text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Delivered",
                  value: stats.delivered,
                  icon: <FiCheck size={18} />,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Total Spent",
                  value: formatCurrency(stats.total),
                  icon: (
                    <span className="text-lg font-bold">{"\u20B9"}</span>
                  ),
                  color: "text-slate-900 dark:text-white",
                  bg: "bg-slate-500/10",
                  isLarge: true,
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-4 md:p-5"
                >
                  <div
                    className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-3`}
                  >
                    {stat.icon}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p
                    className={`${
                      stat.isLarge ? "text-base" : "text-2xl"
                    } font-bold ${stat.color} tabular-nums`}
                  >
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* ============ SEARCH & SORT ============ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <div className="relative flex-1">
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search order ID or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-all shrink-0"
              >
                {sortAsc ? (
                  <FiArrowUp size={14} />
                ) : (
                  <FiArrowDown size={14} />
                )}
                {sortAsc ? "Oldest First" : "Newest First"}
              </motion.button>
            </motion.div>

            {/* ============ ORDER LIST ============ */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-3"
            >
              {filteredOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200/60 dark:border-white/5"
                >
                  <FiSearch
                    className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
                    size={32}
                  />
                  <p className="text-slate-500 font-medium text-sm">
                    No orders match "{searchQuery}"
                  </p>
                </motion.div>
              ) : (
                filteredOrders.map((order) => {
                  const statusColor = getStatusColor(order.status);
                  return (
                    <motion.div
                      key={order._id}
                      variants={cardVariants}
                      whileHover={{
                        y: -2,
                        transition: { duration: 0.2 },
                      }}
                      className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-500 border border-slate-200/60 dark:border-white/5 group cursor-pointer overflow-hidden"
                      onClick={() =>
                        navigate(`/orders/${order.orderId || order._id}`)
                      }
                    >
                      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center">
                        {/* Status Icon */}
                        <div
                          className={`hidden md:flex shrink-0 w-12 h-12 rounded-2xl ${statusColor.bg} items-center justify-center ${statusColor.text}`}
                        >
                          {getStatusIcon(order.status)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono font-bold text-sm md:text-base text-slate-900 dark:text-white">
                              #
                              {order.orderId ||
                                order._id.slice(-6).toUpperCase()}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <FiCalendar size={11} />{" "}
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        {/* Total */}
                        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end min-w-0 md:min-w-[130px] w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/30">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider md:mb-0.5">
                            Total
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>

                        {/* Arrow */}
                        <motion.div className="hidden md:flex w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-all duration-300">
                          <FiChevronRight size={16} />
                        </motion.div>
                      </div>

                      {/* Mobile footer */}
                      <div className="md:hidden px-4 py-3 border-t border-slate-100 dark:border-slate-700/30 flex justify-between items-center text-blue-600 dark:text-blue-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-900/20">
                        View Order Details{" "}
                        <FiChevronRight size={14} />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
