// AdminDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
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
import toast from "react-hot-toast";

const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// --- Animation Presets ---
const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.7, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// --- Skeleton ---
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-6">
    <div className="h-10 w-80 bg-gradient-to-r from-slate-200 to-slate-100 rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-3xl shadow-sm" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 h-[480px] bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-3xl shadow-sm" />
      <div className="lg:col-span-4 h-[480px] bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-3xl shadow-sm" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("6months");
  const { settings, setSettings } = useOutletContext();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
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
      setSearchInsights(insightsRes.data || []);
      setRecentMessages(messagesRes.data.slice(0, 5));
      setAllReviews(reviewsRes.data?.slice(0, 6) || []);

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

  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const deleteReviewHandler = async (productId, reviewId) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
      fetchDashboardData();
      toast.success("Review removed");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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
    if (!otp || otp.length !== 6) return toast.error("Enter valid 6-digit OTP");

    setVerifyingOtp(true);
    const toastId = toast.loading("Verifying...");

    try {
      const res = await axios.post("/api/admin/maintenance/verify", {
        otp,
        desiredState: pendingMaintenanceState
      }, { withCredentials: true });

      setSettings(res.data.settings);
      setShowOtpModal(false);
      toast.success(res.data.message, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP", { id: toastId });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMG;
    const filename = imagePath.split(/[/\\]/).pop();
    return `/uploads/${filename}`;
  };

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

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/30 p-4 md:p-8 font-sans"
    >
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* OTP Modal */}
        <AnimatePresence>
          {showOtpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl"
                onClick={() => setShowOtpModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 border border-slate-100"
              >
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  <FiX size={20} />
                </button>

                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-900/20 rotate-3 hover:rotate-6 transition-transform duration-500">
                    <FiLock size={36} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Security Verification</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Enter the 6-digit code sent to your admin email
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-6 py-6 bg-slate-50 border-2 border-slate-200 rounded-3xl font-mono text-4xl text-center tracking-[0.6em] focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all outline-none font-bold text-slate-900 placeholder:text-slate-300"
                      placeholder="000000"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyingOtp || otp.length !== 6}
                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-3xl transition-all shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98] text-lg"
                  >
                    {verifyingOtp ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <FiArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <FiActivity size={16} className="text-emerald-500" />
              Live metrics · Updated {lastUpdated?.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold flex items-center gap-3 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl disabled:opacity-50 active:scale-95"
          >
            <FiRefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
            icon={<FiDollarSign size={24} />}
            trend="+12.5%"
            trendUp={true}
            gradient="from-emerald-500 to-teal-600"
            index={0}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            icon={<FiShoppingBag size={24} />}
            trend="+8.2%"
            trendUp={true}
            gradient="from-blue-500 to-cyan-600"
            index={1}
          />
          <StatCard
            title="Active Customers"
            value={stats.activeUsers || 0}
            icon={<FiUsers size={24} />}
            trend="+5.7%"
            trendUp={true}
            gradient="from-violet-500 to-purple-600"
            index={2}
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders || 0}
            icon={<FiClock size={24} />}
            trend={stats.pendingOrders > 5 ? "Critical" : "Stable"}
            trendUp={stats.pendingOrders < 5}
            gradient="from-orange-500 to-amber-600"
            index={3}
          />
        </motion.div>

        {/* Main Analytics & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Chart */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-900/5 p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl opacity-50 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Revenue Analytics</h3>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Performance Overview</p>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                {["6months", "1year"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${timeFilter === f ? "bg-white text-slate-900 shadow-lg shadow-slate-900/10" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {f === "6months" ? "6 Months" : "1 Year"}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[380px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            variants={fadeUp}
            custom={5}
            className="lg:col-span-4 space-y-4"
          >
            {/* Maintenance Toggle */}
            <div
              onClick={toggleMaintenanceClick}
              className={`relative overflow-hidden rounded-[28px] p-6 border transition-all cursor-pointer group ${settings.isMaintenanceMode ? "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 shadow-xl shadow-red-900/10" : "bg-white border-slate-200/60 shadow-lg shadow-slate-900/5 hover:shadow-xl"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl transition-all ${settings.isMaintenanceMode ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-slate-100 text-slate-400"}`}>
                    {settings.isMaintenanceMode ? <FiLock size={22} /> : <FiUnlock size={22} />}
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${settings.isMaintenanceMode ? "text-red-900" : "text-slate-900"}`}>
                      Maintenance Mode
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {settings.isMaintenanceMode ? "Store locked" : "Store active"}
                    </p>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full p-1 transition-all ${settings.isMaintenanceMode ? "bg-red-500" : "bg-slate-200"}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.isMaintenanceMode ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            {/* Happy Hour Toggle */}
            <div
              onClick={async () => {
                try {
                  const newDiscount = settings.globalDiscount > 0 ? 0 : 10;
                  await axios.put("/api/admin/enterprise/settings", { globalDiscount: newDiscount }, { withCredentials: true });
                  setSettings(prev => ({ ...prev, globalDiscount: newDiscount }));
                  toast.success(newDiscount > 0 ? "Happy Hour Active!" : "Happy Hour Ended");
                } catch (err) { toast.error("Update failed"); }
              }}
              className={`relative overflow-hidden rounded-[28px] p-6 border transition-all cursor-pointer group ${settings.globalDiscount > 0 ? "bg-gradient-to-br from-amber-50 to-orange-100/50 border-amber-200 shadow-xl shadow-amber-900/10" : "bg-white border-slate-200/60 shadow-lg shadow-slate-900/5 hover:shadow-xl"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl transition-all ${settings.globalDiscount > 0 ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30" : "bg-slate-100 text-slate-400"}`}>
                    {settings.globalDiscount > 0 ? <FiZap size={22} /> : <FiClock size={22} />}
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${settings.globalDiscount > 0 ? "text-amber-900" : "text-slate-900"}`}>
                      Happy Hour
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {settings.globalDiscount > 0 ? "10% off sitewide" : "Standard pricing"}
                    </p>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full p-1 transition-all ${settings.globalDiscount > 0 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-slate-200"}`}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.globalDiscount > 0 ? "translate-x-6" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            {/* Banner Control */}
            <BannerControl settings={settings} setSettings={setSettings} />
          </motion.div>
        </div>

        {/* Export Tools */}
        <motion.div
          variants={fadeUp}
          custom={6}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <ExportCard
            title="Sales Report"
            description="Export all orders to CSV"
            icon={<FiDollarSign size={20} />}
            gradient="from-emerald-500 to-teal-600"
            onClick={async () => {
              const toastId = toast.loading("Generating report...");
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

                const blob = new Blob([csvContent], { type: "text/csv" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Report downloaded!", { id: toastId });
              } catch (e) {
                toast.error("Export failed", { id: toastId });
              }
            }}
          />

          <ExportCard
            title="Customer Data"
            description="Export user list & analytics"
            icon={<FiUsers size={20} />}
            gradient="from-blue-500 to-cyan-600"
            onClick={async () => {
              const toastId = toast.loading("Generating report...");
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

                const blob = new Blob([csvContent], { type: "text/csv" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Report downloaded!", { id: toastId });
              } catch (e) {
                toast.error("Export failed", { id: toastId });
              }
            }}
          />
        </motion.div>

        {/* Recent Orders & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orders List */}
          <motion.div
            variants={fadeUp}
            custom={7}
            className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-900/5 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Recent Orders</h3>
                  <p className="text-xs text-slate-500 mt-1">Live transaction feed</p>
                </div>
                <button
                  onClick={() => navigate("/admin/orders")}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto">
              {recentOrders.length === 0 ? (
                <div className="py-20 text-center">
                  <FiShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="text-slate-400 font-medium">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => navigate(`/admin/orders`)}
                      className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-900/20">
                          #{order._id.slice(-4)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {order.user?.name || "Guest Customer"}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <p className="font-bold text-slate-900 text-base">
                          ₹{(order.totalAmount || order.totalPrice || 0).toLocaleString()}
                        </p>
                        <StatusPill status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={fadeUp} custom={8} className="lg:col-span-4 space-y-6">
            {/* Messages */}
            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-900/5 p-6 h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-slate-900">Messages</h3>
                <button 
                  onClick={() => navigate("/admin/messages")}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <FiMail size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {recentMessages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiMail className="text-slate-200 mb-2" size={32} />
                    <p className="text-xs text-slate-400">No messages</p>
                  </div>
                ) : (
                  recentMessages?.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() => navigate("/admin/messages")}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-slate-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                          {msg.email}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-900/5 p-6 h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-bold text-slate-900">Reviews</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {allReviews.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {allReviews?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiStar className="text-slate-200 mb-2" size={32} />
                    <p className="text-xs text-slate-400">No reviews yet</p>
                  </div>
                ) : (
                  allReviews?.map((rev) => (
                    <div key={rev._id} className="p-3 bg-slate-50 rounded-2xl group relative border border-transparent hover:border-slate-200 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteReviewHandler(rev.productId, rev._id); }}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:scale-110"
                      >
                        <FiTrash2 size={12} />
                      </button>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} size={10} className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-700 mb-2 line-clamp-2">
                        "{rev.comment}"
                      </p>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-medium">{rev.userName}</span>
                        <span className="text-blue-600 font-semibold">{rev.productName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Components ---

function StatCard({ title, value, icon, trend, trendUp, gradient, index }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="relative overflow-hidden bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />
      
      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{title}</p>
        <h4 className="text-3xl font-bold text-slate-900 mb-3">{value}</h4>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {trendUp ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
          {trend}
        </span>
      </div>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const map = {
    "Pending": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
    "Cooking": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
    "Ready": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
    "Completed": { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
    "Cancelled": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" }
  };
  const s = map[status] || { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
      {status}
    </span>
  );
}

function ExportCard({ title, description, icon, gradient, onClick }) {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-200/60 shadow-xl shadow-slate-900/5 hover:shadow-2xl transition-all group cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </div>
        <button className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl transition-all group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white">
          <FiDownload size={20} />
        </button>
      </div>
    </div>
  );
}

function BannerControl({ settings, setSettings }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (Max 5MB)");

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    const toastId = toast.loading("Uploading banner...");

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      const imageUrl = res.data.file || res.data.url;

      await axios.put("/api/admin/enterprise/settings", {
        banner: { ...settings.banner, imageUrl }
      }, { withCredentials: true });

      setSettings(prev => ({ ...prev, banner: { ...prev.banner, imageUrl } }));
      toast.success("Banner uploaded!", { id: toastId });
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-[28px] p-6 border transition-all ${settings.banner?.active ? "bg-gradient-to-br from-violet-50 to-purple-100/50 border-violet-200 shadow-xl shadow-violet-900/10" : "bg-white border-slate-200/60 shadow-lg shadow-slate-900/5"}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl transition-all ${settings.banner?.active ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30" : "bg-slate-100 text-slate-400"}`}>
            <FiStar size={22} />
          </div>
          <div>
            <h3 className={`text-base font-bold ${settings.banner?.active ? "text-violet-900" : "text-slate-900"}`}>
              Promo Banner
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {settings.banner?.active ? "Currently visible" : "Hidden from site"}
            </p>
          </div>
        </div>

        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const next = !settings.banner?.active;
              await axios.put("/api/admin/enterprise/settings", { banner: { ...settings.banner, active: next } }, { withCredentials: true });
              setSettings(prev => ({ ...prev, banner: { ...prev.banner, active: next } }));
              toast.success(next ? "Banner published!" : "Banner hidden");
            } catch (err) { toast.error("Update failed"); }
          }}
          className={`w-14 h-8 rounded-full p-1 transition-all ${settings.banner?.active ? "bg-gradient-to-r from-violet-500 to-purple-500" : "bg-slate-200"}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${settings.banner?.active ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300 bg-slate-50/50"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />

        {uploading ? (
          <div className="py-4">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold text-violet-700">Uploading...</span>
          </div>
        ) : settings.banner?.imageUrl ? (
          <div className="w-full group">
            <img src={settings.banner.imageUrl} alt="Banner" className="h-24 w-full object-cover rounded-xl" />
            <div className="mt-2 text-xs text-slate-500 font-medium group-hover:text-violet-600 transition-colors">
              Click to change image
            </div>
          </div>
        ) : (
          <div className="py-6">
            <FiCheckCircle className="mx-auto text-slate-300 mb-2" size={28} />
            <p className="text-xs font-semibold text-slate-600">Drop banner image here</p>
            <p className="text-[10px] text-slate-400 mt-1">or click to browse</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl text-white px-5 py-4 rounded-3xl shadow-2xl border border-white/10">
        <p className="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-3 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <p className="font-bold text-base">
              ₹{Number(p.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
