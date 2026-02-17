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
  FiAlertCircle, FiPower, FiCheckCircle, FiLock, FiUnlock, FiX
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
      toast.dismiss();
      toast.loading("Refreshing data...", { id: "refresh" });
    }

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
      setAllReviews(reviewsRes.data?.slice(0, 6) || []); // Limit reviews

      setLoading(false);
      setError(null);
      setLastUpdated(new Date());

      if (isManual) toast.success("Dashboard Updated", { id: "refresh" });
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) navigate("/login");
      setError(err.response?.data?.message || "Failed to load dashboard data.");
      if (isManual) toast.error("Refresh Failed", { id: "refresh" });
    } finally {
      if (isManual) setIsRefreshing(false);
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

  // 🟢 REAL-TIME: Socket.io Listener (Disabled for polling)
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

  // Mini sparkline data for stat cards
  const revenueSparkline = graph.slice(-7).map((g, i) => ({ v: g.orders * 150 + i * 20 }));
  const ordersSparkline = graph.slice(-7).map((g) => ({ v: g.orders }));

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen font-sans text-slate-800"
    >
      {/* HEADER */}
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
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className={`p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm ${isRefreshing ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
          >
            <FiRefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
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
                <h3 className="text-xl font-bold text-slate-900 mb-2">Security Verification</h3>
                <p className="text-sm text-slate-500">
                  Please enter the 6-digit OTP sent to your registered admin email to
                  {pendingMaintenanceState ? " enable" : " disable"} Maintenance Mode.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 ml-1">One-Time Password</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-2xl text-center tracking-[0.2em] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length !== 6}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <FiRefreshCw className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify & Confirm"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ ENTERPRISE: MAINTENANCE BAR */}
      <motion.div
        variants={fadeUp}
        custom={1}
        className={`bg-white rounded-2xl p-4 border border-l-4 shadow-sm flex items-center justify-between ${settings.isMaintenanceMode
          ? "border-red-500 bg-red-50/50"
          : "border-emerald-500 bg-emerald-50/50"
          }`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${settings.isMaintenanceMode ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            }`}>
            {settings.isMaintenanceMode ? <FiLock size={20} /> : <FiUnlock size={20} />}
          </div>
          <div>
            <h3 className={`font-bold ${settings.isMaintenanceMode ? "text-red-700" : "text-emerald-700"}`}>
              {settings.isMaintenanceMode ? "Maintenance Mode Active" : "Store is Live"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.isMaintenanceMode
                ? "Store is hidden from customers. Admin bypass is active."
                : "Customers can browse and purchase normally."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {settings.isMaintenanceMode && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Passcode</span>
              <span className="font-mono text-lg font-bold text-slate-700 tracking-widest">{settings.maintenanceOtp || "----"}</span>
            </div>
          )}
          <button
            onClick={toggleMaintenanceClick}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${settings.isMaintenanceMode
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            {settings.isMaintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
          </button>
        </div>
      </motion.div>

      {/* ✅ ENTERPRISE: HAPPY HOUR TOGGLE */}
      <motion.div
        variants={fadeUp}
        custom={1.5}
        className={`bg-white rounded-2xl p-4 border border-l-4 shadow-sm flex items-center justify-between ${settings.globalDiscount > 0
          ? "border-purple-500 bg-purple-50/50"
          : "border-slate-300 bg-slate-50/50"
          }`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${settings.globalDiscount > 0 ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
            }`}>
            {settings.globalDiscount > 0 ? <FiZap size={20} /> : <FiClock size={20} />}
          </div>
          <div>
            <h3 className={`font-bold ${settings.globalDiscount > 0 ? "text-purple-700" : "text-slate-700"}`}>
              {settings.globalDiscount > 0 ? `Happy Hour Active (-${settings.globalDiscount}%)` : "Happy Hour is Off"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.globalDiscount > 0
                ? "Global discount applied to all products."
                : "Standard pricing is in effect."}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              const newDiscount = settings.globalDiscount > 0 ? 0 : 10;
              const res = await axios.put("/api/admin/enterprise/settings", { globalDiscount: newDiscount }, { withCredentials: true });
              setSettings(prev => ({ ...prev, globalDiscount: newDiscount }));
              toast.success(newDiscount > 0 ? "Happy Hour Activated! 🍹" : "Happy Hour Ended");
            } catch (err) {
              toast.error("Failed to toggle Happy Hour");
            }
          }}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${settings.globalDiscount > 0
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          {settings.globalDiscount > 0 ? "End Happy Hour" : "Start Happy Hour (10%)"}
        </button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
          icon={<FiDollarSign size={20} />}
          trend="+12.5%"
          trendUp={true}
          color="emerald"
          sparkData={revenueSparkline}
          index={0}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={<FiShoppingBag size={20} />}
          trend="+8.2%"
          trendUp={true}
          color="blue"
          sparkData={ordersSparkline}
          index={1}
        />
        <StatCard
          title="Active Customers"
          value={stats.activeUsers || 0}
          icon={<FiUsers size={20} />}
          trend="-2.4%"
          trendUp={false}
          color="indigo"
          sparkData={[]}
          index={2}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders || 0}
          icon={<FiClock size={20} />}
          trend={stats.pendingOrders > 5 ? "High Load" : "Normal"}
          trendUp={stats.pendingOrders > 5}
          color="amber"
          sparkData={[]}
          index={3}
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          variants={fadeUp}
          custom={4}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Analytics</h3>
              <p className="text-xs text-slate-400 mt-1">Income over the last 7 months</p>
            </div>
            <select className="text-xs font-semibold bg-slate-50 border-none rounded-lg py-2 px-3 text-slate-600 cursor-pointer focus:ring-0">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div
          variants={fadeUp}
          custom={5}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
        >
          <h3 className="text-base font-bold text-slate-900 mb-1">Order Status</h3>
          <p className="text-xs text-slate-400 mb-6">Distribution of current orders</p>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{stats.totalOrders || 0}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {orderStatusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-600">{entry.name}</span>
                <span className="text-[10px] font-medium text-slate-400">({entry.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <motion.div
            variants={fadeUp}
            custom={6}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-xs text-slate-400 italic">
                        No recent orders found.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group" onClick={() => navigate(`/admin/orders`)}>
                        <td className="px-5 py-3 text-xs font-mono text-slate-500 group-hover:text-blue-600 transition-colors">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-700">
                          {order.user?.name || "Guest"}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-900">
                          ₹{order.totalPrice?.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill status={order.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Messages & Feedback */}
        <motion.div variants={fadeUp} custom={7} className="space-y-6">
          {/* Recent Inquiries */}
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
      </div>

    </motion.div>
  );
}

// --- Sub Components ---

function StatCard({ title, value, icon, trend, trendUp, color, sparkData, index }) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", spark: "#2563eb" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", spark: "#059669" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", spark: "#6366f1" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", spark: "#d97706" },
  };
  const c = colorMap[color] || colorMap.blue;

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

function StatusPill({ status }) {
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

function ChartTooltip({ active, payload, label }) {
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

function PieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-[10px]">
        <p className="font-bold">{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
}