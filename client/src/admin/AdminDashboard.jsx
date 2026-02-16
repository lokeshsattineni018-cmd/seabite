// AdminDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import {
  FiShoppingBag, FiUsers, FiTrendingUp, FiActivity,
  FiDollarSign, FiCalendar, FiMail, FiTrash2, FiStar,
  FiArrowUpRight, FiArrowDownRight, FiClock, FiEye,
  FiRefreshCw, FiMoreHorizontal, FiPackage, FiSettings, FiSearch,
  FiAlertCircle, FiPower, FiCheckCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client"; // Unused
import toast from "react-hot-toast";

const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// --- Animation Presets ---
const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// --- Skeleton ---
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200/60 rounded-lg" />
        <div className="h-4 w-40 bg-slate-100 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 bg-white/80 border border-slate-100 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[420px] bg-white/80 border border-slate-100 rounded-2xl" />
      <div className="h-[420px] bg-white/80 border border-slate-100 rounded-2xl" />
    </div>
  </div>
);

// --- Color Palette ---
const COLORS = {
  primary: "#0f172a",
  accent: "#2563eb",
  accentLight: "#3b82f6",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  muted: "#64748b",
};

const PIE_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#6366f1"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("6months");
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, totalRevenue: 0 });
  const [graph, setGraph] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [topSpenders, setTopSpenders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [searchInsights, setSearchInsights] = useState([]);
  const [settings, setSettings] = useState({ isMaintenanceMode: false, maintenanceMessage: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashboardRes, messagesRes, reviewsRes, lowStockRes, settingsRes, insightsRes] = await Promise.all([
        axios.get("/api/admin", { params: { range: timeFilter }, withCredentials: true }),
        axios.get("/api/contact", { withCredentials: true }),
        axios.get("/api/admin/reviews/all", { withCredentials: true }),
        axios.get("/api/admin/inventory/low-stock", { withCredentials: true }),
        axios.get("/api/admin/enterprise/settings", { withCredentials: true }),
        axios.get("/api/admin/insights/search", { withCredentials: true }),
      ]);

      setStats(dashboardRes.data.stats);
      setGraph(dashboardRes.data.graph);
      setRecentOrders(dashboardRes.data.recentOrders);
      setPopularProducts(dashboardRes.data.popularProducts);
      setHeatmapData(dashboardRes.data.heatmapData || []);
      setTopSpenders(dashboardRes.data.topSpenders || []);
      setLowStock(lowStockRes.data || []);
      setSettings(settingsRes.data);
      setSearchInsights(insightsRes.data || []);
      setRecentMessages(messagesRes.data.slice(0, 5));
      setAllReviews(reviewsRes.data?.slice(0, 6) || []);
      setLoading(false);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      // console.error("Dashboard Fetch Error:", err);
      setLoading(false);
      if (err.response?.status === 401) navigate("/login");
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    }
  }, [timeFilter, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // 🟢 REAL-TIME: Socket.io Listener
  // 🟢 REAL-TIME DISABLED
  // We use the 30s interval above for updates instead of Socket.io
  useEffect(() => {
    // No-op
  }, []);

  const deleteReviewHandler = async (productId, reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
      fetchDashboardData();
    } catch {
      alert("Failed to delete review.");
    }
  };

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // 🟢 Modified Toggle Handler
  const toggleMaintenanceClick = async () => {
    // 1. Determine next state
    const nextState = !settings.isMaintenanceMode;
    setPendingMaintenanceState(nextState);

    // 2. Request OTP
    const toastId = toast.loading("Requesting Security OTP...");
    try {
      await axios.post("/api/admin/maintenance/request-otp", {}, { withCredentials: true });
      toast.success("OTP sent to your email!", { id: toastId });
      setShowOtpModal(true);
      setOtp(""); // Reset input
    } catch (err) {
      toast.error("Failed to send OTP", { id: toastId });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");

    setVerifyingOtp(true);
    const toastId = toast.loading("Verifying Security Code...");

    try {
      const res = await axios.post("/api/admin/maintenance/verify", {
        otp,
        desiredState: pendingMaintenanceState
      }, { withCredentials: true });

      setSettings(res.data.settings);
      setShowOtpModal(false);
      toast.success(res.data.message, { id: toastId, icon: pendingMaintenanceState ? "🔒" : "🔓" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP", { id: toastId });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 🟢 Helper: Get Image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMG;
    const filename = imagePath.split(/[/\\]/).pop();
    return `/uploads/${filename}`;
  };

  // Compute order status distribution for pie chart
  const orderStatusData = recentOrders.reduce((acc, o) => {
    const status = o.status || "Pending";
    const existing = acc.find((d) => d.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, []);

  // ... (Render Logic)

  <motion.div
    initial="hidden" animate="visible" variants={staggerContainer}
    className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen font-sans text-slate-800"
  >
    {/* HEADER */}

    {/* ✅ OTP MODAL */}
    <AnimatePresence>
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowOtpModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 lg:p-8 overflow-hidden"
          >
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors"
            >
              <FiX size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                <FiLock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Security Check</h3>
              <p className="text-sm text-slate-500 mt-2">
                To {pendingMaintenanceState ? "activate" : "deactivate"} Maintenance Mode, please enter the 6-digit code sent to your email.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                }}
                placeholder="0 0 0 0 0 0"
                className="w-full text-center text-3xl font-mono tracking-[0.5em] font-bold text-slate-800 border-2 border-slate-200 rounded-xl py-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-200"
                autoFocus
              />

              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {verifyingOtp ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                Verify & {pendingMaintenanceState ? "Lock" : "Unlock"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* ✅ ENTERPRISE: MAINTENANCE BAR */}
    <motion.div
      variants={fadeUp}
      custom={0.5}
      className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${settings.isMaintenanceMode
        ? "bg-red-50 border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        : "bg-emerald-50 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${settings.isMaintenanceMode ? "bg-red-100 text-red-600 border-red-200" : "bg-emerald-100 text-emerald-600 border-emerald-200"
          }`}>
          {settings.isMaintenanceMode ? <FiSettings size={22} className="animate-spin-slow" /> : <FiCheckCircle size={22} />}
        </div>
        <div>
          <h3 className={`text-sm font-black uppercase tracking-tight ${settings.isMaintenanceMode ? "text-red-700" : "text-emerald-700"}`}>
            Store Status: {settings.isMaintenanceMode ? "Maintenance Active" : "Fully Operational"}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">
            {settings.isMaintenanceMode ? "Customers see the maintenance page. Admin bypass is active." : "Store is public and accepting orders."}
          </p>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="p-4 md:p-8 lg:p-10 min-h-screen space-y-6 md:space-y-8 font-sans"
      >
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-slate-500 text-xs md:text-sm">Welcome back, Admin</p>
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <FiClock size={10} />
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => fetchDashboardData()}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <FiRefreshCw size={16} />
            </button>
            <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex-1 md:flex-none">
              <FiCalendar className="text-slate-400" size={14} />
              <span className="text-xs font-semibold text-slate-600">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short", year: "numeric", month: "short", day: "numeric",
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ✅ ENTERPRISE: MAINTENANCE BAR */}
        <motion.div
          variants={fadeUp}
          custom={0.5}
          className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${settings.isMaintenanceMode
            ? "bg-red-50 border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
            : "bg-emerald-50 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${settings.isMaintenanceMode ? "bg-red-100 text-red-600 border-red-200" : "bg-emerald-100 text-emerald-600 border-emerald-200"
              }`}>
              {settings.isMaintenanceMode ? <FiSettings size={22} className="animate-spin-slow" /> : <FiCheckCircle size={22} />}
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-tight ${settings.isMaintenanceMode ? "text-red-700" : "text-emerald-700"}`}>
                Store Status: {settings.isMaintenanceMode ? "Maintenance Active" : "Fully Operational"}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {settings.isMaintenanceMode ? "Customers see the maintenance page. Admin bypass is active." : "Store is public and accepting orders."}
              </p>
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={isUpdatingSettings}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${settings.isMaintenanceMode
              ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
              }`}
          >
            {isUpdatingSettings ? <FiRefreshCw className="animate-spin" /> : <FiPower />}
            {settings.isMaintenanceMode ? "Deactivate Maintenance" : "Activate Maintenance"}
          </button>
        </motion.div>

        {/* Stat Cards - 4 columns */}
        <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatCard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
            icon={<FiDollarSign size={18} />}
            trend="+12.5%"
            trendUp
            color="blue"
            sparkData={revenueSparkline}
            index={0}
          />
          <StatCard
            title="Total Orders"
            value={stats.orders}
            icon={<FiShoppingBag size={18} />}
            trend="+5.2%"
            trendUp
            color="emerald"
            sparkData={ordersSparkline}
            index={1}
          />
          <StatCard
            title="Active Users"
            value={stats.users}
            icon={<FiUsers size={18} />}
            trend="+2.4%"
            trendUp
            color="indigo"
            index={2}
          />
          <StatCard
            title="Products"
            value={stats.products}
            icon={<FiPackage size={18} />}
            trend="+8"
            trendUp
            color="amber"
            index={3}
          />
        </motion.div>

        {/* Main Charts Row */}
        <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          {/* Revenue Analytics - dual axis */}
          <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-row justify-between items-center mb-6">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Revenue Analytics</h3>
                <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">Revenue trend over time</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-4 mr-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Orders
                  </span>
                </div>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <option value="6months">6 Months</option>
                  <option value="1year">12 Months</option>
                </select>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graph} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={false} />
                  <Area type="monotone" dataKey="orders" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" dot={false} strokeDasharray="6 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Donut + Top Products */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1">Order Breakdown</h3>
            <p className="text-[10px] text-slate-400 mb-4">Status distribution</p>

            {orderStatusData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {orderStatusData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
                  {orderStatusData.map((d, i) => (
                    <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No order data</div>
            )}

            {/* Top Products Mini List */}
            <div className="border-t border-slate-100 pt-4 mt-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Top Sellers</h4>
              <div className="space-y-3">
                {popularProducts?.slice(0, 3).map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-300 w-4">#{i + 1}</span>
                    <div className="w-8 h-8 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                      <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain p-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{p.totalSold} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inventory Health: Smart Alerts */}
        <motion.div variants={fadeUp} custom={2.5} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                <FiAlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Inventory Health</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Critical stock level monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Critical</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] font-bold text-slate-500 uppercase">Warning</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStock.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FiPackage className="text-slate-300 mb-2" size={32} />
                <p className="text-sm font-bold text-slate-400">All stock levels healthy</p>
              </div>
            ) : (
              lowStock.map((p) => (
                <div key={p._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-100 shrink-0 shadow-sm">
                      <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{p.name}</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${p.countInStock < 5 ? "text-red-500" : "text-amber-600"
                        }`}>
                        {p.countInStock} Left in Stock
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      toast.loading("Sending restock request...", { id: "restock" });
                      try {
                        await axios.post("/api/admin/inventory/restock", {
                          productId: p._id,
                          productName: p.name
                        }, { withCredentials: true });
                        toast.success(`Restock request sent to ${p.category} supplier`, { id: "restock", icon: '📦' });
                      } catch {
                        toast.error("Failed to send request", { id: "restock" });
                      }
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                    title="Quick Restock Request"
                  >
                    <FiRefreshCw size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Advanced Insights: Heatmap & VIPs */}
        <motion.div variants={fadeUp} custom={3.5} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Heatmap */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Sales Heatmap</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Busiest times by Day & Hour</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-50" />
                <div className="w-3 h-3 rounded bg-blue-200" />
                <div className="w-3 h-3 rounded bg-blue-400" />
                <div className="w-3 h-3 rounded bg-blue-600" />
                <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase underline tracking-tighter">Density</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px]">
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}>
                  {/* Empty corner */}
                  <div className="h-4 w-10 flex items-center justify-center">
                    <FiClock size={10} className="text-slate-300" />
                  </div>
                  {/* Hours Header */}
                  {[...Array(24)].map((_, h) => (
                    <div key={h} className="text-[8px] font-black text-slate-300 text-center uppercase tracking-tighter">
                      {h}
                    </div>
                  ))}

                  {/* Days Rows */}
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, dIdx) => (
                    <div key={day} className="contents">
                      <div className="text-[9px] font-bold text-slate-400 self-center pr-2 uppercase">
                        {day}
                      </div>
                      {[...Array(24)].map((_, hour) => {
                        const mongoDay = dIdx === 6 ? 1 : dIdx + 2;
                        const cell = heatmapData.find(h => h._id.day === mongoDay && h._id.hour === hour);
                        const count = cell ? cell.count : 0;

                        let bg = "bg-slate-50";
                        if (count > 0) bg = "bg-blue-100";
                        if (count > 3) bg = "bg-blue-300";
                        if (count > 7) bg = "bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.3)]";

                        return (
                          <div
                            key={hour}
                            title={`${day} @ ${hour}:00 - ${count} orders`}
                            className={`${bg} h-4 w-full rounded-sm transition-all hover:scale-125 cursor-help`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-4 italic font-medium">Darker cells indicate higher order volume during that hour.</p>
          </div>

          {/* VIP Customer Tracker */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-white">VIP Customers</h3>
                  <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-blue-500/30">Top Spenders</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Identify your whale customers</p>
              </div>
              <FiStar className="text-yellow-400" size={18} />
            </div>

            <div className="space-y-4 relative z-10">
              {topSpenders.map((user, i) => (
                <div key={user.email} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors uppercase tracking-tight">{user.name}</h4>
                      <p className="text-[10px] text-slate-500 lowercase">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">₹{user.totalSpent.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{user.orderCount} Orders</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/admin/marketing")}
              className="w-full mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold transition-all shadow-lg shadow-blue-900/40 uppercase tracking-widest relative z-10"
            >
              Send VIP Reward Blast
            </button>
          </div>

          {/* Search Analytics Insight */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <FiSearch size={20} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900">Demand Analytics</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Top customer search queries</p>
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Last 24h</span>
            </div>

            <div className="space-y-3">
              {searchInsights.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No search data yet</div>
              ) : (
                searchInsights.slice(0, 5).map((insight, idx) => (
                  <div key={insight.query} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-300 w-4">#{idx + 1}</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{insight.query}</h4>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${insight.found ? "text-emerald-500" : "text-amber-500"}`}>
                          {insight.found ? "Items Found" : "Not in Stock / Not Found"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{insight.count}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Searches</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {searchInsights.some(i => !i.found) && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <p className="text-[10px] text-amber-900 font-medium">
                  Users are searching for items you don't carry. Consider expanding your catalog!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom Row: Recent Orders, Inquiries, Reviews */}
        <motion.div variants={fadeUp} custom={3} className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Recent Orders</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Latest transactions</p>
              </div>
              <button
                onClick={() => navigate("/admin/orders")}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                View All <FiArrowUpRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentOrders?.slice(0, 5).map((o) => (
                <div key={o._id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate("/admin/orders")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <FiShoppingBag size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{o.user?.name || "Guest"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">#{o.orderId || o._id.substring(0, 8)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs font-bold text-slate-900">₹{o.totalAmount}</p>
                    <StatusPill status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inquiries */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Inquiries</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Customer messages</p>
              </div>
              <button
                onClick={() => navigate("/admin/messages")}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                View All <FiArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {recentMessages?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No messages.</p>
              ) : (
                recentMessages?.map((msg) => (
                  <div
                    key={msg._id}
                    className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                    onClick={() => navigate("/admin/messages")}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-100 transition-colors">
                      <FiMail size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-[11px] font-bold text-slate-900 truncate">{msg.email}</h4>
                        <span className="text-[9px] text-slate-400 shrink-0 ml-2">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feedback Moderation */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">Feedback</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Recent reviews</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                {allReviews.length} total
              </span>
            </div>
            <div className="space-y-3">
              {allReviews?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No reviews.</p>
              ) : (
                allReviews?.map((rev) => (
                  <div key={rev._id} className="p-3 bg-slate-50/80 rounded-xl relative group border border-slate-100/80 hover:border-slate-200 transition-colors">
                    <button
                      onClick={() => deleteReviewHandler(rev.productId, rev._id)}
                      className="absolute top-2.5 right-2.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 size={12} />
                    </button>
                    <div className="flex gap-0.5 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          size={10}
                          className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 italic line-clamp-2 mb-2 leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-slate-900">{rev.userName}</h4>
                      <span className="text-[9px] text-blue-500 font-bold uppercase">{rev.productName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div >
      );
}



      // --- Sub Components ---

      function StatCard({title, value, icon, trend, trendUp, color, sparkData, index}) {
  const colorMap = {
        blue: {bg: "bg-blue-50", text: "text-blue-600", spark: "#2563eb" },
      emerald: {bg: "bg-emerald-50", text: "text-emerald-600", spark: "#059669" },
      indigo: {bg: "bg-indigo-50", text: "text-indigo-600", spark: "#6366f1" },
      amber: {bg: "bg-amber-50", text: "text-amber-600", spark: "#d97706" },
  };
      const c = colorMap[color] || colorMap.blue;

      // Animation for StatCard uses same fadeUp variant from parent scope or needs re-definition if outside
      // Since variants are objects, we can just reference the imported one or the one defined at top level
      // ensuring fadeUp is defined at module level (which it is, line 26).

      return (
      <motion.div
        variants={fadeUp}
        custom={index}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-3">
          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
            {icon}
          </div>
          <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${trendUp ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
            {trendUp ? <FiArrowUpRight size={10} /> : <FiArrowDownRight size={10} />}
            {trend}
          </span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{title}</p>
        <h4 className="text-xl md:text-2xl font-bold text-slate-900">{value}</h4>

        {/* Mini sparkline */}
        {sparkData && sparkData.length > 0 && (
          <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={c.spark} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
      );
}

      function StatusPill({status}) {
  const styles = {
        Pending: "text-amber-700 bg-amber-50",
      Processing: "text-blue-700 bg-blue-50",
      Shipped: "text-indigo-700 bg-indigo-50",
      Delivered: "text-emerald-700 bg-emerald-50",
      Cancelled: "text-red-700 bg-red-50",
  };
      return (
      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${styles[status] || styles.Pending}`}>
        {status || "Pending"}
      </span>
      );
}

      function ChartTooltip({active, payload, label}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs border border-slate-700">
        <p className="font-semibold mb-1.5 opacity-60 text-[10px] uppercase tracking-wider">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold">
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }} />
            {p.dataKey === "revenue" ? `₹${p.value?.toLocaleString()}` : `${p.value} Orders`}
          </p>
        ))}
      </div>
      );
  }
      return null;
}

      function PieTooltip({active, payload}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-[10px]">
        <p className="font-bold">{payload[0].name}: {payload[0].value}</p>
      </div>
      );
  }
      return null;
}