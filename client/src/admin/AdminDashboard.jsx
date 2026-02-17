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
  FiAlertCircle, FiPower, FiCheckCircle, FiLock, FiUnlock, FiX, FiZap, FiDownload // 🟢 Added
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
      className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen font-sans text-slate-800"
    >
      {/* HEADER */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Store
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
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
            className={`p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FiRefreshCw size={18} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
          </button>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex-1 md:flex-none hover:shadow-md transition-shadow">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <FiCalendar size={14} />
            </div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short", month: "short", day: "numeric",
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowOtpModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-white/20"
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors z-10"
              >
                <FiX size={20} />
              </button>

              <div className="text-center mb-8 relative z-10">
                <div className="w-20 h-20 bg-white text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-blue-100 shadow-xl shadow-blue-500/10 rotate-3 hover:rotate-6 transition-transform duration-500">
                  <FiLock size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Security Check</h3>
                <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  Enter the 6-digit code sent to your admin email to confirm this action.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6 relative z-10">
                <div className="relative group">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-3xl text-center tracking-[0.5em] focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-200 placeholder:tracking-widest"
                    placeholder="••••••"
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length !== 6}
                  className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 group"
                >
                  {verifyingOtp ? (
                    <>
                      <FiRefreshCw className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify Identity <FiArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ BENTO CONTROL CENTER */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Maintenance Toggle */}
        <div className={`relative overflow-hidden rounded-[2rem] p-6 border transition-all duration-300 md:col-span-1 group ${settings.isMaintenanceMode ? "bg-red-50 border-red-100 shadow-xl shadow-red-500/10" : "bg-white border-slate-100 shadow-sm hover:border-slate-200"}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl ${settings.isMaintenanceMode ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"} transition-colors`}>
              {settings.isMaintenanceMode ? <FiLock size={20} /> : <FiUnlock size={20} />}
            </div>
            {settings.isMaintenanceMode && (
              <span className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-mono font-bold text-red-600 border border-red-100">
                OTP: {settings.maintenanceOtp || "----"}
              </span>
            )}
          </div>
          <div className="relative z-10">
            <h3 className={`text-lg font-bold mb-1 ${settings.isMaintenanceMode ? "text-red-700" : "text-slate-800"}`}>
              {settings.isMaintenanceMode ? "Maintenance Active" : "Store is Live"}
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed h-[36px]">
              {settings.isMaintenanceMode
                ? "Public access blocked. Admin bypass active."
                : "Standard operation. Customers can browse."}
            </p>
            <button
              onClick={toggleMaintenanceClick}
              className={`w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${settings.isMaintenanceMode
                ? "bg-white text-red-600 hover:bg-red-50"
                : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
            >
              {settings.isMaintenanceMode ? "Disable Mode" : "Turn On Maintenance"}
            </button>
          </div>
          {settings.isMaintenanceMode && <div className="absolute inset-0 bg-red-500/5 mix-blend-multiply pointer-events-none" />}
        </div>

        {/* Happy Hour Toggle */}
        <div className={`relative overflow-hidden rounded-[2rem] p-6 border transition-all duration-300 md:col-span-1 group ${settings.globalDiscount > 0 ? "bg-purple-50 border-purple-100 shadow-xl shadow-purple-500/10" : "bg-white border-slate-100 shadow-sm hover:border-slate-200"}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl ${settings.globalDiscount > 0 ? "bg-purple-100 text-purple-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"} transition-colors`}>
              {settings.globalDiscount > 0 ? <FiZap size={20} /> : <FiClock size={20} />}
            </div>
            {settings.globalDiscount > 0 && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold animate-pulse">
                -{settings.globalDiscount}% OFF
              </span>
            )}
          </div>
          <div className="relative z-10">
            <h3 className={`text-lg font-bold mb-1 ${settings.globalDiscount > 0 ? "text-purple-700" : "text-slate-800"}`}>
              {settings.globalDiscount > 0 ? "Happy Hour Live" : "Happy Hour"}
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed h-[36px]">
              {settings.globalDiscount > 0
                ? "All products are discounted by 10%."
                : "Standard pricing. Enable sales boost."}
            </p>
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
              className={`w-full py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${settings.globalDiscount > 0
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              {settings.globalDiscount > 0 ? "End Event" : "Start Happy Hour"}
            </button>
          </div>
        </div>

        {/* Banner Manager */}
        <div className={`relative overflow-hidden rounded-[2rem] p-6 border transition-all duration-300 md:col-span-1 group ${settings.banner?.active ? "bg-blue-50 border-blue-100 shadow-xl shadow-blue-500/10" : "bg-white border-slate-100 shadow-sm hover:border-slate-200"}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3.5 rounded-2xl ${settings.banner?.active ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"} transition-colors`}>
              {settings.banner?.active ? <FiStar size={20} /> : <FiSearch size={20} />}
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const newActiveState = !settings.banner?.active;
                    const newBanner = { ...settings.banner, active: newActiveState };
                    await axios.put("/api/admin/enterprise/settings", { banner: newBanner }, { withCredentials: true });
                    setSettings(prev => ({ ...prev, banner: newBanner }));
                    toast.success(newActiveState ? "Banner On 🚀" : "Banner Off");
                  } catch (err) { toast.error("Failed"); }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${settings.banner?.active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
              >
                {settings.banner?.active ? "ON" : "OFF"}
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.put("/api/admin/enterprise/settings", { banner: settings.banner }, { withCredentials: true });
                    toast.success("Saved");
                  } catch (e) { toast.error("Error"); }
                }}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
              >
                <FiCheckCircle size={14} />
              </button>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className={`text-lg font-bold mb-1 ${settings.banner?.active ? "text-blue-800" : "text-slate-800"}`}>
              Promo Banner
            </h3>
            <div className="space-y-2 mb-1">
              <input
                placeholder="Image Path..."
                value={settings.banner?.imageUrl || ""}
                onChange={(e) => setSettings(prev => ({ ...prev, banner: { ...prev.banner, imageUrl: e.target.value } }))}
                className="w-full bg-white/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/10 outline-none"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ✅ ENTERPRISE: DATA EXPORTS */}
      <motion.div
        variants={fadeUp}
        custom={1.7}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><FiDollarSign size={20} /></div>
            <div>
              <h3 className="font-bold text-slate-900">Sales Report</h3>
              <p className="text-xs text-slate-500">Export all orders to CSV</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const toastId = toast.loading("Exporting Sales...");
              try {
                const { data } = await axios.get("/api/orders", { withCredentials: true });
                const csvContent = [
                  ["Order ID", "Date", "Customer", "Email", "Items", "Total", "Status", "Payment"],
                  ...data.map(o => [
                    o.orderId || o._id,
                    new Date(o.createdAt).toLocaleDateString(),
                    o.user?.name || "Guest",
                    o.user?.email || "N/A",
                    o.items.map(i => `${i.name} (x${i.qty})`).join("; "),
                    o.totalAmount,
                    o.status,
                    o.paymentMethod
                  ])
                ].map(e => e.join(",")).join("\n");

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Sales Report Downloaded!", { id: toastId });
              } catch (e) {
                toast.error("Export Failed", { id: toastId });
              }
            }}
            className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <FiDownload size={20} />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><FiUsers size={20} /></div>
            <div>
              <h3 className="font-bold text-slate-900">Customer Data</h3>
              <p className="text-xs text-slate-500">Export user list & CLV</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const toastId = toast.loading("Exporting Customers...");
              try {
                const { data } = await axios.get("/api/admin/users/intelligence", { withCredentials: true });
                const csvContent = [
                  ["User ID", "Name", "Email", "Role", "Joined", "Total Spent", "Orders"],
                  ...data.map(u => [
                    u._id,
                    u.name,
                    u.email,
                    u.role,
                    new Date(u.createdAt).toLocaleDateString(),
                    u.intelligence?.totalSpent || 0,
                    u.intelligence?.orderCount || 0
                  ])
                ].map(e => e.join(",")).join("\n");

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Customer Data Downloaded!", { id: toastId });
              } catch (e) {
                toast.error("Export Failed", { id: toastId });
              }
            }}
            className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FiDownload size={20} />
          </button>
        </div>
      </motion.div>


      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
          icon={<FiDollarSign size={22} />}
          trend="+12.5%"
          trendUp={true}
          color="emerald"
          sparkData={revenueSparkline}
          index={0}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={<FiShoppingBag size={22} />}
          trend="+8.2%"
          trendUp={true}
          color="blue"
          sparkData={ordersSparkline}
          index={1}
        />
        <StatCard
          title="Active Customers"
          value={stats.activeUsers || 0}
          icon={<FiUsers size={22} />}
          trend={stats.activeUsers > 10 ? "Growth High" : "+2.4%"}
          trendUp={true}
          color="indigo"
          sparkData={[5, 12, 10, 20, 18, 25, 30]}
          index={2}
        />
        <StatCard
          title="Pending"
          value={stats.pendingOrders || 0}
          icon={<FiClock size={22} />}
          trend={stats.pendingOrders > 5 ? "Critical" : "Stable"}
          trendUp={stats.pendingOrders < 5}
          color="amber"
          sparkData={[]}
          index={3}
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Chart */}
        <motion.div
          variants={fadeUp}
          custom={4}
          className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Analytics</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium italic">Smooth progression over {timeFilter}</p>
            </div>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {["6months", "1year"].map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === f ? "bg-white text-blue-600 shadow-md ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {f === "6months" ? "6 Months" : "1 Year"}
                </button>
              ))}
            </div>
          </div>

          <div className="aspect-[2/1] md:aspect-auto h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graph} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mainRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }} />
                <Area
                  type="natural"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#mainRev)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div
          variants={fadeUp}
          custom={5}
          className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col group relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50/50 blur-[80px] -ml-24 -mb-24 rounded-full pointer-events-none" />

          <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight relative z-10">Order Status</h3>
          <p className="text-sm text-slate-400 mb-8 font-medium relative z-10">Live distribution</p>

          <div className="flex-1 min-h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={500}
                  animationDuration={1500}
                  stroke="none"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer outline-none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalOrders || 0}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 relative z-10">
            {orderStatusData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current transition-all" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length], color: PIE_COLORS[index % PIE_COLORS.length] }} />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-900 uppercase leading-none">{entry.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{entry.value} orders</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders - Bento List */}
        <div className="lg:col-span-8">
          <motion.div
            variants={fadeUp}
            custom={6}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full"
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Orders</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Latest store activity</p>
              </div>
              <button
                onClick={() => navigate("/admin/orders")}
                className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 shadow-sm"
              >
                Explore <FiArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[600px] p-4">
                {recentOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FiShoppingBag size={32} />
                    </div>
                    <p className="text-sm text-slate-400 font-bold italic">No recent transactions.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <motion.div
                        key={order._id}
                        whileHover={{ x: 5 }}
                        onClick={() => navigate(`/admin/orders`)}
                        className="flex items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl hover:bg-blue-50/30 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-xs ring-1 ring-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            #{order._id.slice(-4)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                              {order.user?.name || "Guest Customer"}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">
                              {new Date(order.createdAt).toLocaleDateString(undefined, { Month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="font-black text-slate-900 text-sm">₹{order.totalPrice?.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Auto-paid</p>
                          </div>
                          <div className="w-24 text-center">
                            <StatusPill status={order.status} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Messages & Feedback */}
        <motion.div variants={fadeUp} custom={7} className="lg:col-span-4 space-y-6">
          {/* Recent Inquiries */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 group">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Inquiries</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Customer Support</p>
              </div>
              <button
                onClick={() => navigate("/admin/messages")}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 group-hover:border-blue-100 group-hover:shadow-md"
              >
                <FiMail size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {recentMessages?.length === 0 ? (
                <p className="text-center py-12 text-xs text-slate-300 font-bold italic">Inbox empty.</p>
              ) : (
                recentMessages?.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => navigate("/admin/messages")}
                    className="p-4 bg-slate-50/50 hover:bg-blue-50/50 rounded-2xl border border-transparent hover:border-blue-100 transition-all cursor-pointer relative group/msg"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-[11px] font-black text-slate-800 group-hover/msg:text-blue-700 transition-colors truncate w-32">
                        {msg.email}
                      </h4>
                      <span className="text-[9px] font-black text-slate-300 uppercase letter-spacing-wide">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feedback Moderation */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 blur-[60px] -mr-16 -mt-16 rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Feedback</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Reputation</p>
              </div>
              <div className="px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 text-amber-600 text-[10px] font-black">
                {allReviews.length} TOTAL
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {allReviews?.length === 0 ? (
                <p className="text-center py-12 text-xs text-slate-300 font-bold italic">No reviews yet.</p>
              ) : (
                allReviews?.map((rev) => (
                  <div key={rev._id} className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-all">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteReviewHandler(rev.productId, rev._id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:border-red-100 hover:shadow-md shadow-sm"
                    >
                      <FiTrash2 size={12} />
                    </button>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          size={10}
                          className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed mb-3">
                      "{rev.comment}"
                    </p>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{rev.userName}</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full ring-1 ring-blue-200">
                        {rev.productName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div >
  );
}

// --- Sub Components ---

function StatCard({ title, value, icon, trend, trendUp, color, sparkData, index }) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", spark: "#3b82f6", shadow: "shadow-blue-500/10" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", spark: "#10b981", shadow: "shadow-emerald-500/10" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", spark: "#6366f1", shadow: "shadow-indigo-500/10" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", spark: "#f59e0b", shadow: "shadow-amber-500/10" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -5 }}
      initial="hidden"
      animate="visible"
      className={`relative overflow-hidden bg-white rounded-[2rem] p-6 border ${c.border} shadow-xl ${c.shadow} hover:shadow-2xl transition-all duration-300 group`}
    >
      {/* Background Blob */}
      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full ${c.bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${c.bg} ${c.text} shadow-sm ring-1 ring-black/5`}>
            {icon}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
          <h4 className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{value}</h4>
        </div>
        <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${trendUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
          {trendUp ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
          {trend}
        </span>
      </div>

      {/* Sparkline Overlay */}
      {sparkData && sparkData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-20 opacity-30 mask-linear-gradient">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.spark} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={c.spark} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="natural"
                dataKey="v"
                stroke={c.spark}
                strokeWidth={3}
                fill={`url(#grad-${index})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Pending: "text-amber-600 bg-amber-50 border-amber-100",
    Processing: "text-blue-600 bg-blue-50 border-blue-100",
    Shipped: "text-indigo-600 bg-indigo-50 border-indigo-100",
    Delivered: "text-emerald-600 bg-emerald-50 border-emerald-100",
    Cancelled: "text-red-600 bg-red-50 border-red-100",
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${styles[status] || styles.Pending}`}>
      {status || "Pending"}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl text-xs border border-white/10">
        <p className="font-bold mb-2 opacity-50 text-[10px] uppercase tracking-widest">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full shadow-lg shadow-white/20" style={{ backgroundColor: p.color }} />
            <p className="font-bold text-sm">
              {p.dataKey === "revenue" ? `₹${Number(p.value).toLocaleString()}` : `${p.value} Orders`}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function PieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          <p className="font-bold text-sm">{payload[0].name}</p>
        </div>
        <p className="text-xl font-black mt-1 ml-5">{payload[0].value}</p>
      </div>
    );
  }
  return null;
}