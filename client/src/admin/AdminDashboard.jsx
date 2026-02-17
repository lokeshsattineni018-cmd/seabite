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
  FiAlertCircle, FiPower, FiCheckCircle, FiLock, FiUnlock, FiX, FiZap, FiDownload
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.07, duration: 0.55, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto animate-pulse">
    <div className="space-y-2">
      <div className="h-9 w-52 bg-slate-200/70 rounded-xl" />
      <div className="h-4 w-36 bg-slate-100 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 bg-white border border-slate-100 rounded-3xl shadow-sm" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-[380px] bg-white border border-slate-100 rounded-3xl shadow-sm" />
      <div className="h-[380px] bg-white border border-slate-100 rounded-3xl shadow-sm" />
    </div>
  </div>
);

const PIE_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

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
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
      setAllReviews(reviewsRes.data?.slice(0, 6) || []);
      setLoading(false);
      setError(null);
      setLastUpdated(new Date());
      if (isManual) toast.success("Dashboard updated!", { id: "refresh" });
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) navigate("/login");
      setError(err.response?.data?.message || "Failed to load dashboard data.");
      if (isManual) toast.error("Refresh failed", { id: "refresh" });
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [timeFilter, navigate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const deleteReviewHandler = async (productId, reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
      fetchDashboardData();
    } catch { alert("Failed to delete review."); }
  };

  const toggleMaintenanceClick = async () => {
    const nextState = !settings.isMaintenanceMode;
    setPendingMaintenanceState(nextState);
    const toastId = toast.loading("Requesting Security OTP...");
    try {
      await axios.post("/api/admin/maintenance/request-otp", {}, { withCredentials: true });
      toast.success("OTP sent to your email!", { id: toastId });
      setShowOtpModal(true);
      setOtp("");
    } catch (err) {
      toast.error("Failed to send OTP", { id: toastId });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Enter a valid 6-digit OTP");
    setVerifyingOtp(true);
    const toastId = toast.loading("Verifying...");
    try {
      const res = await axios.post("/api/admin/maintenance/verify", {
        otp, desiredState: pendingMaintenanceState
      }, { withCredentials: true });
      setSettings(res.data.settings);
      setShowOtpModal(false);
      toast.success(res.data.message, { id: toastId, icon: pendingMaintenanceState ? "🔒" : "🔓" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP", { id: toastId });
    } finally { setVerifyingOtp(false); }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMG;
    return `/uploads/${imagePath.split(/[/\\]/).pop()}`;
  };

  const orderStatusData = recentOrders.reduce((acc, o) => {
    const status = o.status || "Pending";
    const existing = acc.find((d) => d.name === status);
    if (existing) existing.value += 1;
    else acc.push({ name: status, value: 1 });
    return acc;
  }, []);

  const revenueSparkline = graph.slice(-7).map((g, i) => ({ v: g.orders * 150 + i * 20 }));
  const ordersSparkline = graph.slice(-7).map((g) => ({ v: g.orders }));

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="p-6 md:p-10 space-y-7 max-w-[1600px] mx-auto min-h-screen bg-[#f8f6f2] font-sans text-slate-800"
    >

      {/* ── OTP MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowOtpModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/80 p-8 border border-white"
            >
              {/* top gradient strip */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400" />

              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <FiX size={18} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-sky-50 border border-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FiLock size={26} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">Security Verification</h3>
                <p className="text-sm text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                  Enter the 6-digit code sent to your admin email.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-3xl text-center tracking-[0.5em] focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-200"
                  placeholder="••••••"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length !== 6}
                  className="w-full py-3.5 bg-slate-800 hover:bg-sky-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {verifyingOtp ? (
                    <><FiRefreshCw className="animate-spin" size={15} /> Verifying…</>
                  ) : (
                    <> Confirm Identity <FiArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          {/* eyebrow */}
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-sky-500 mb-1">✦ SeaBite Admin</p>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">Dashboard</h1>
          <div className="flex items-center gap-3 mt-2.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Store
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <FiClock size={9} /> Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className={`p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-200 hover:shadow-md transition-all active:scale-95 shadow-sm ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FiRefreshCw size={16} className={isRefreshing ? "animate-spin text-sky-500" : ""} />
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="p-1 bg-sky-50 text-sky-500 rounded-lg">
              <FiCalendar size={12} />
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── CONTROL BENTO ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Maintenance */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group
          ${settings.isMaintenanceMode
            ? "bg-red-50 border-red-200 shadow-md shadow-red-100"
            : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl transition-colors
              ${settings.isMaintenanceMode ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"}`}>
              {settings.isMaintenanceMode ? <FiLock size={17} /> : <FiUnlock size={17} />}
            </div>
            {settings.isMaintenanceMode && (
              <span className="text-[10px] font-mono font-bold text-red-500 bg-white border border-red-200 px-2 py-1 rounded-lg">
                OTP: {settings.maintenanceOtp || "----"}
              </span>
            )}
          </div>
          <h3 className={`text-sm font-bold mb-1 ${settings.isMaintenanceMode ? "text-red-700" : "text-slate-700"}`}>
            {settings.isMaintenanceMode ? "Maintenance Active" : "Store is Live"}
          </h3>
          <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">
            {settings.isMaintenanceMode ? "Public access blocked. Admin bypass active." : "Customers can browse normally."}
          </p>
          <button
            onClick={toggleMaintenanceClick}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95
              ${settings.isMaintenanceMode
                ? "bg-white text-red-500 border border-red-200 hover:bg-red-50"
                : "bg-slate-800 text-white hover:bg-slate-700 shadow-sm"}`}
          >
            {settings.isMaintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
          </button>
        </div>

        {/* Happy Hour */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group
          ${settings.globalDiscount > 0
            ? "bg-violet-50 border-violet-200 shadow-md shadow-violet-100"
            : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl transition-colors
              ${settings.globalDiscount > 0 ? "bg-violet-100 text-violet-500" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"}`}>
              {settings.globalDiscount > 0 ? <FiZap size={17} /> : <FiClock size={17} />}
            </div>
            {settings.globalDiscount > 0 && (
              <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-lg animate-pulse">
                -{settings.globalDiscount}% OFF
              </span>
            )}
          </div>
          <h3 className={`text-sm font-bold mb-1 ${settings.globalDiscount > 0 ? "text-violet-700" : "text-slate-700"}`}>
            {settings.globalDiscount > 0 ? "Happy Hour Live 🍹" : "Happy Hour"}
          </h3>
          <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">
            {settings.globalDiscount > 0 ? "All products discounted by 10%." : "Standard pricing active."}
          </p>
          <button
            onClick={async () => {
              try {
                const newDiscount = settings.globalDiscount > 0 ? 0 : 10;
                await axios.put("/api/admin/enterprise/settings", { globalDiscount: newDiscount }, { withCredentials: true });
                setSettings(prev => ({ ...prev, globalDiscount: newDiscount }));
                toast.success(newDiscount > 0 ? "Happy Hour Activated! 🍹" : "Happy Hour Ended");
              } catch { toast.error("Failed to toggle Happy Hour"); }
            }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95
              ${settings.globalDiscount > 0
                ? "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200"
                : "bg-slate-800 text-white hover:bg-slate-700 shadow-sm"}`}
          >
            {settings.globalDiscount > 0 ? "End Happy Hour" : "Start Happy Hour"}
          </button>
        </div>

        {/* Promo Banner */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group
          ${settings.banner?.active
            ? "bg-sky-50 border-sky-200 shadow-md shadow-sky-100"
            : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl transition-colors
              ${settings.banner?.active ? "bg-sky-100 text-sky-500" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"}`}>
              {settings.banner?.active ? <FiStar size={17} /> : <FiSearch size={17} />}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={async () => {
                  try {
                    const newBanner = { ...settings.banner, active: !settings.banner?.active };
                    await axios.put("/api/admin/enterprise/settings", { banner: newBanner }, { withCredentials: true });
                    setSettings(prev => ({ ...prev, banner: newBanner }));
                    toast.success(newBanner.active ? "Banner On 🚀" : "Banner Off");
                  } catch { toast.error("Failed"); }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all
                  ${settings.banner?.active ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
              >
                {settings.banner?.active ? "ON" : "OFF"}
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.put("/api/admin/enterprise/settings", { banner: settings.banner }, { withCredentials: true });
                    toast.success("Saved");
                  } catch { toast.error("Error"); }
                }}
                className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-sky-500 transition-colors"
              >
                <FiCheckCircle size={13} />
              </button>
            </div>
          </div>
          <h3 className={`text-sm font-bold mb-3 ${settings.banner?.active ? "text-sky-700" : "text-slate-700"}`}>
            Promo Banner
          </h3>
          <input
            placeholder="Image path or URL..."
            value={settings.banner?.imageUrl || ""}
            onChange={(e) => setSettings(prev => ({ ...prev, banner: { ...prev.banner, imageUrl: e.target.value } }))}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-400/20 focus:border-sky-300 outline-none transition-all placeholder:text-slate-300"
          />
        </div>
      </motion.div>

      {/* ── DATA EXPORTS ───────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} custom={1.5} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            icon: <FiDollarSign size={18} />,
            color: "emerald",
            title: "Sales Report",
            sub: "Export all orders to CSV",
            onClick: async () => {
              const toastId = toast.loading("Exporting...");
              try {
                const { data } = await axios.get("/api/orders", { withCredentials: true });
                const rows = [
                  ["Order ID", "Date", "Customer", "Email", "Items", "Total", "Status", "Payment"],
                  ...data.map(o => [o.orderId || o._id, new Date(o.createdAt).toLocaleDateString(), o.user?.name || "Guest", o.user?.email || "N/A", o.items.map(i => `${i.name} (x${i.qty})`).join("; "), o.totalAmount, o.status, o.paymentMethod])
                ].map(e => e.join(",")).join("\n");
                const link = document.createElement("a");
                link.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
                link.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Downloaded!", { id: toastId });
              } catch { toast.error("Export Failed", { id: toastId }); }
            }
          },
          {
            icon: <FiUsers size={18} />,
            color: "sky",
            title: "Customer Data",
            sub: "Export user list & CLV",
            onClick: async () => {
              const toastId = toast.loading("Exporting...");
              try {
                const { data } = await axios.get("/api/admin/users/intelligence", { withCredentials: true });
                const rows = [
                  ["User ID", "Name", "Email", "Role", "Joined", "Total Spent", "Orders"],
                  ...data.map(u => [u._id, u.name, u.email, u.role, new Date(u.createdAt).toLocaleDateString(), u.intelligence?.totalSpent || 0, u.intelligence?.orderCount || 0])
                ].map(e => e.join(",")).join("\n");
                const link = document.createElement("a");
                link.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
                link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Downloaded!", { id: toastId });
              } catch { toast.error("Export Failed", { id: toastId }); }
            }
          }
        ].map(({ icon, color, title, sub, onClick }) => (
          <div key={title} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-500`}>{icon}</div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-[11px] text-slate-400">{sub}</p>
              </div>
            </div>
            <button onClick={onClick} className={`p-2 bg-${color}-50 text-${color}-600 rounded-xl hover:bg-${color}-100 transition-colors`}>
              <FiDownload size={17} />
            </button>
          </div>
        ))}
      </motion.div>

      {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {[
          { title: "Total Revenue", value: `₹${stats.totalRevenue?.toLocaleString() || 0}`, icon: <FiDollarSign size={18} />, trend: "+12.5%", trendUp: true, color: "emerald", spark: revenueSparkline, index: 0 },
          { title: "Net Profit", value: `₹${stats.netProfit?.toLocaleString() || 0}`, icon: <FiTrendingUp size={18} />, trend: "+8.2%", trendUp: true, color: "sky", spark: [5,8,12,15,20,25,30].map(v => ({v})), index: 1 },
          { title: "Total Orders", value: stats.totalOrders || 0, icon: <FiShoppingBag size={18} />, trend: "+8.2%", trendUp: true, color: "blue", spark: ordersSparkline, index: 2 },
          { title: "Active Customers", value: stats.activeUsers || 0, icon: <FiUsers size={18} />, trend: "-2.4%", trendUp: false, color: "indigo", spark: [], index: 3 },
          { title: "Pending Orders", value: stats.pendingOrders || 0, icon: <FiClock size={18} />, trend: stats.pendingOrders > 5 ? "High Load" : "Normal", trendUp: stats.pendingOrders > 5, color: "amber", spark: [], index: 4 },
        ].map((props) => <StatCard key={props.title} {...props} />)}
      </motion.div>

      {/* ── CHARTS ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue Area Chart */}
        <motion.div variants={fadeUp} custom={4}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Revenue Analytics</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Income over the last 7 months</p>
            </div>
            <select className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-slate-500 cursor-pointer focus:ring-0 outline-none">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#skyGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={fadeUp} custom={5}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-0.5">Order Status</h3>
          <p className="text-[11px] text-slate-400 mb-5">Distribution of current orders</p>
          <div className="flex-1 min-h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {orderStatusData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">{stats.totalOrders || 0}</span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {orderStatusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="text-[10px] font-semibold text-slate-600">{entry.name}</span>
                <span className="text-[10px] text-slate-400">({entry.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RECENT ORDERS + SIDEBAR ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Orders Table */}
        <motion.div variants={fadeUp} custom={6}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Orders</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Latest transactions</p>
            </div>
            <button onClick={() => navigate("/admin/orders")}
              className="text-[10px] font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 transition-colors">
              View All <FiArrowUpRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/60">
                  {["Order ID", "Customer", "Date", "Amount", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-10 text-center text-xs text-slate-300 italic">No recent orders found.</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order._id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => navigate("/admin/orders")}
                  >
                    <td className="px-5 py-3 text-[11px] font-mono text-slate-400 group-hover:text-sky-500 transition-colors">#{order._id.slice(-6)}</td>
                    <td className="px-5 py-3 text-[11px] font-semibold text-slate-700">{order.user?.name || "Guest"}</td>
                    <td className="px-5 py-3 text-[11px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-[11px] font-bold text-slate-800">₹{order.totalPrice?.toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusPill status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Sidebar: Messages + Reviews */}
        <motion.div variants={fadeUp} custom={7} className="space-y-5">

          {/* Inquiries */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Inquiries</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Customer messages</p>
              </div>
              <button onClick={() => navigate("/admin/messages")}
                className="text-[10px] font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1">
                View All <FiArrowUpRight size={11} />
              </button>
            </div>
            <div className="space-y-2">
              {recentMessages?.length === 0
                ? <p className="text-xs text-slate-300 text-center py-6">No messages yet.</p>
                : recentMessages?.map((msg) => (
                  <div key={msg._id}
                    className="flex gap-3 items-start p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                    onClick={() => navigate("/admin/messages")}
                  >
                    <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-sky-400 shrink-0">
                      <FiMail size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-[11px] font-semibold text-slate-700 truncate">{msg.email}</h4>
                        <span className="text-[9px] text-slate-300 ml-2 shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{msg.message}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Feedback</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Recent reviews</p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                {allReviews.length} total
              </span>
            </div>
            <div className="space-y-2.5">
              {allReviews?.length === 0
                ? <p className="text-xs text-slate-300 text-center py-6">No reviews yet.</p>
                : allReviews?.map((rev) => (
                  <div key={rev._id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors relative group"
                  >
                    <button
                      onClick={() => deleteReviewHandler(rev.productId, rev._id)}
                      className="absolute top-2.5 right-2.5 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 size={11} />
                    </button>
                    <div className="flex gap-0.5 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={9}
                          className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic line-clamp-2 mb-2 leading-relaxed">"{rev.comment}"</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-slate-700">{rev.userName}</span>
                      <span className="text-[9px] font-semibold text-sky-400 uppercase">{rev.productName}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </motion.div>
      </div>

    </motion.div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon, trend, trendUp, color, spark, index }) {
  const colorMap = {
    sky:     { bg: "bg-sky-50",     text: "text-sky-500",     border: "border-sky-100",     hex: "#0ea5e9" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-500", border: "border-emerald-100", hex: "#10b981" },
    blue:    { bg: "bg-blue-50",    text: "text-blue-500",    border: "border-blue-100",    hex: "#3b82f6" },
    indigo:  { bg: "bg-indigo-50",  text: "text-indigo-500",  border: "border-indigo-100",  hex: "#6366f1" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-500",   border: "border-amber-100",   hex: "#f59e0b" },
  };
  const c = colorMap[color] || colorMap.sky;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden bg-white rounded-2xl p-5 border ${c.border} shadow-sm hover:shadow-lg transition-all duration-300 group`}
    >
      {/* bg blob */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full ${c.bg} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}>{icon}</div>
          <span className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-[9px] font-bold border
            ${trendUp ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"}`}>
            {trendUp ? <FiArrowUpRight size={10} /> : <FiArrowDownRight size={10} />}
            {trend}
          </span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h4>
      </div>

      {/* Sparkline */}
      {spark && spark.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-14 opacity-25">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <defs>
                <linearGradient id={`sg-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.hex} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={c.hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="natural" dataKey="v" stroke={c.hex} strokeWidth={2} fill={`url(#sg-${index})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// ── StatusPill ────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const styles = {
    Pending:    "text-amber-600 bg-amber-50 border-amber-100",
    Processing: "text-sky-600 bg-sky-50 border-sky-100",
    Shipped:    "text-indigo-600 bg-indigo-50 border-indigo-100",
    Delivered:  "text-emerald-600 bg-emerald-50 border-emerald-100",
    Cancelled:  "text-red-600 bg-red-50 border-red-100",
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${styles[status] || styles.Pending}`}>
      {status || "Pending"}
    </span>
  );
}

// ── ChartTooltip ──────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl px-4 py-3 text-xs">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="font-bold text-slate-800">
            {p.dataKey === "revenue" ? `₹${Number(p.value).toLocaleString()}` : `${p.value} Orders`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── PieTooltip ────────────────────────────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-xl px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <span className="font-semibold text-slate-700">{payload[0].name}</span>
      </div>
      <p className="text-xl font-bold text-slate-800 mt-1 ml-4">{payload[0].value}</p>
    </div>
  );
}