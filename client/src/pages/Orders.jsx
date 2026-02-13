import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiPackage,
  FiMapPin,
  FiCheck,
  FiX,
  FiRefreshCcw,
  FiChevronRight,
  FiShoppingBag,
  FiStar,
  FiEdit2,
  FiTag,
  FiSearch,
  FiFilter,
  FiTruck,
  FiChevronDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import ReviewModal from "../components/ReviewModal";
import PopupModal from "../components/PopupModal";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- STATUS HELPERS ---
const getStatusConfig = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
        icon: <FiCheck size={12} />,
        dot: "bg-emerald-500",
      };
    case "Cancelled":
    case "Cancelled by User":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/20",
        icon: <FiX size={12} />,
        dot: "bg-red-500",
      };
    case "Shipped":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
        icon: <FiTruck size={12} />,
        dot: "bg-blue-500",
      };
    default:
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
        icon: <FiRefreshCcw size={12} />,
        dot: "bg-amber-500",
      };
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "\u20B90.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// --- TABS ---
const TABS = [
  { id: "all", label: "All Orders", icon: <FiPackage size={14} /> },
  { id: "active", label: "Active", icon: <FiTruck size={14} /> },
  { id: "delivered", label: "Delivered", icon: <FiCheck size={14} /> },
  { id: "cancelled", label: "Cancelled", icon: <FiX size={14} /> },
];

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const FETCH_URL = `${API_URL}/api/orders/myorders`;

  const fetchOrders = async () => {
    try {
      const response = await axios.get(FETCH_URL, { withCredentials: true });
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setTimeout(() => navigate("/login"), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  // --- FILTERING & SORTING ---
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Tab filter
    if (activeTab === "active") {
      result = result.filter(
        (o) =>
          o.status === "Pending" ||
          o.status === "Processing" ||
          o.status === "Shipped"
      );
    } else if (activeTab === "delivered") {
      result = result.filter((o) => o.status === "Delivered");
    } else if (activeTab === "cancelled") {
      result = result.filter(
        (o) => o.status === "Cancelled" || o.status === "Cancelled by User"
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          (o.orderId || o._id).toLowerCase().includes(q) ||
          o.items?.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "highest") {
      result.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === "lowest") {
      result.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    }

    return result;
  }, [orders, activeTab, searchQuery, sortBy]);

  // --- TAB COUNTS ---
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(
        (o) =>
          o.status === "Pending" ||
          o.status === "Processing" ||
          o.status === "Shipped"
      ).length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      cancelled: orders.filter(
        (o) => o.status === "Cancelled" || o.status === "Cancelled by User"
      ).length,
    };
  }, [orders]);

  const getUserReview = (item, orderUserId) => {
    const productData = item.productId || item.product;
    if (!productData || !productData.reviews) return null;
    return productData.reviews.find((r) => {
      const reviewUserId = typeof r.user === "object" ? r.user._id : r.user;
      const currentUserId =
        typeof orderUserId === "object" ? orderUserId._id : orderUserId;
      return reviewUserId?.toString() === currentUserId?.toString();
    });
  };

  const openReviewModal = (item, existingReview) => {
    let realProductId;
    if (item.productId) {
      realProductId =
        typeof item.productId === "object"
          ? item.productId._id
          : item.productId;
    } else if (item.product) {
      realProductId =
        typeof item.product === "object" ? item.product._id : item.product;
    } else {
      realProductId = item._id;
    }
    const productData = { _id: realProductId, name: item.name };
    setSelectedProduct(productData);
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  };

  const handleReviewSuccess = () => {
    setModalConfig({
      show: true,
      message: "Review Saved Successfully!",
      type: "success",
    });
    fetchOrders();
  };

  // --- LOADING SKELETON ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FiPackage className="text-blue-600" size={18} />
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-slate-400 font-medium tracking-wider text-xs uppercase"
        >
          Loading your orders...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-500 overflow-x-hidden">
      <PopupModal
        show={modalConfig.show}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, show: false })}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={selectedProduct}
        existingReview={selectedReview}
        token={null}
        API_URL={API_URL}
        onSuccess={handleReviewSuccess}
      />

      {/* Ambient background layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/80 via-transparent to-transparent dark:from-blue-950/20 dark:via-transparent" />
        <div className="absolute top-20 -right-40 w-[600px] h-[600px] bg-blue-100/30 dark:bg-blue-900/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-emerald-100/20 dark:bg-emerald-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-16">
        {/* ============ HEADER ============ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-2"
              >
                <span className="w-6 h-px bg-blue-600 dark:bg-blue-400" />
                My Account
              </motion.span>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Orders
              </h1>
            </div>
            {orders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {orders.length}
                  </span>{" "}
                  total orders
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {orders.length === 0 ? (
          /* ============ EMPTY STATE ============ */
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-slate-800/60 backdrop-blur-xl p-10 md:p-20 rounded-3xl border border-slate-200/60 dark:border-white/5 text-center shadow-xl shadow-slate-200/40 dark:shadow-none"
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
              No orders yet
            </h3>
            <p className="text-sm text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
              Your order history will appear here once you make your first
              purchase from our fresh catch collection.
            </p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20"
            >
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* ============ SEARCH & FILTER BAR ============ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <FiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by order ID or product name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Sort */}
                <div className="relative">
                  <FiFilter
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-9 pr-10 py-3 bg-white dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                  </select>
                  <FiChevronDown
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
            </motion.div>

            {/* ============ TABS ============ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const count = tabCounts[tab.id];
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-slate-900 dark:bg-blue-600 text-white shadow-lg shadow-slate-900/15 dark:shadow-blue-600/20"
                          : "bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/40"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      {count > 0 && (
                        <span
                          className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ============ RESULTS COUNT ============ */}
            {searchQuery && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-500 mb-4"
              >
                Showing{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredOrders.length}
                </span>{" "}
                result{filteredOrders.length !== 1 ? "s" : ""} for "
                {searchQuery}"
              </motion.p>
            )}

            {/* ============ ORDER CARDS ============ */}
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200/60 dark:border-white/5"
              >
                <FiSearch className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={32} />
                <p className="text-slate-500 font-medium text-sm">
                  No orders match your criteria
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4"
              >
                {filteredOrders.map((order, index) => {
                  const statusInfo = getStatusConfig(order.status);
                  const isDelivered = order.status === "Delivered";
                  const isExpanded = expandedOrder === order._id;

                  return (
                    <motion.div
                      key={order._id}
                      variants={itemVariants}
                      layout
                      className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-500 group"
                    >
                      {/* --- ORDER HEADER --- */}
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            {/* Status dot + Order ID */}
                            <div
                              className={`w-10 h-10 rounded-xl ${statusInfo.bg} flex items-center justify-center ${statusInfo.text} shrink-0`}
                            >
                              {statusInfo.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-mono font-bold text-sm md:text-base text-slate-900 dark:text-white">
                                  #
                                  {order.orderId ||
                                    order._id.slice(-6).toUpperCase()}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <FiClock size={11} />
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                <span>{order.items?.length || 0} items</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4">
                            {/* Payment badge */}
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                order.paymentMethod === "Prepaid"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {order.paymentMethod || "COD"}
                            </span>
                            {/* Total */}
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Total
                              </p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(order.totalAmount)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* --- BILL SUMMARY (compact) --- */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-[10px] text-slate-500 font-medium border border-slate-100 dark:border-slate-700/30">
                          <span>
                            Subtotal:{" "}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {"\u20B9"}
                              {(order.itemsPrice || 0).toFixed(2)}
                            </span>
                          </span>
                          {order.discount > 0 && (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <FiTag size={9} /> Saved {"\u20B9"}
                              {(order.discount || 0).toFixed(2)}
                            </span>
                          )}
                          <span>
                            Shipping:{" "}
                            <span
                              className={
                                order.shippingPrice === 0
                                  ? "font-bold text-emerald-500"
                                  : "font-bold text-slate-700 dark:text-slate-300"
                              }
                            >
                              {order.shippingPrice === 0
                                ? "FREE"
                                : `\u20B9${order.shippingPrice.toFixed(2)}`}
                            </span>
                          </span>
                          <span>
                            Tax:{" "}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {"\u20B9"}
                              {(order.taxPrice || 0).toFixed(2)}
                            </span>
                          </span>
                          <span className="text-slate-400 dark:text-slate-600">
                            |
                          </span>
                          <span className="flex items-center gap-1">
                            <FiMapPin size={9} />
                            {order.shippingAddress?.city},{" "}
                            {order.shippingAddress?.zip}
                          </span>
                        </div>
                      </div>

                      {/* --- EXPANDABLE ITEMS --- */}
                      <div className="border-t border-slate-100 dark:border-slate-700/30">
                        <button
                          onClick={() =>
                            setExpandedOrder(isExpanded ? null : order._id)
                          }
                          className="w-full px-4 md:px-6 py-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <FiShoppingBag size={12} />
                            {order.items.length} Item
                            {order.items.length !== 1 ? "s" : ""} in this order
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <FiChevronDown size={16} />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                                opacity: { duration: 0.3 },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 md:px-6 pb-4 space-y-2">
                                {order.items.map((item, idx) => {
                                  const myReview = getUserReview(
                                    item,
                                    order.user
                                  );
                                  return (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/30 hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors"
                                    >
                                      <div className="relative shrink-0">
                                        <img
                                          src={`${API_URL}/uploads/${item.image
                                            ?.replace(/^\/|\\/g, "")
                                            .replace("uploads/", "")}`}
                                          alt={item.name}
                                          className="w-12 h-12 object-contain rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1"
                                          onError={(e) => {
                                            e.target.src =
                                              "https://via.placeholder.com/100?text=SeaBite";
                                          }}
                                        />
                                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                                          {item.qty}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                          {item.name}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                          {formatCurrency(item.price)} x{" "}
                                          {item.qty}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {isDelivered && myReview && (
                                          <div className="hidden sm:flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                              <FiStar
                                                key={i}
                                                size={10}
                                                fill={
                                                  i < myReview.rating
                                                    ? "currentColor"
                                                    : "none"
                                                }
                                              />
                                            ))}
                                          </div>
                                        )}
                                        {isDelivered && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openReviewModal(
                                                item,
                                                myReview || null
                                              );
                                            }}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold rounded-lg transition-colors ${
                                              myReview
                                                ? "text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
                                                : "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                                            }`}
                                          >
                                            {myReview ? (
                                              <>
                                                <FiEdit2 size={10} /> Edit
                                              </>
                                            ) : (
                                              <>
                                                <FiStar size={10} /> Review
                                              </>
                                            )}
                                          </button>
                                        )}
                                        <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                          {formatCurrency(
                                            item.price * item.qty
                                          )}
                                        </span>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* --- FOOTER --- */}
                      <div className="px-4 md:px-6 py-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/20">
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <FiMapPin size={10} />
                          {order.shippingAddress?.fullName} -{" "}
                          {order.shippingAddress?.city}
                        </span>
                        <motion.button
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-all flex items-center gap-1.5"
                        >
                          Details & Tracking{" "}
                          <FiChevronRight size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
