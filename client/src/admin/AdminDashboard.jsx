// AdminDashboard.jsx
import { useEffect, useState, useCallback, useRef } from "react";
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
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// --- Animation Presets ---
const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.6, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// --- Skeleton ---
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-8">
    <div className="h-9 w-72 bg-gradient-to-r from-stone-100 to-stone-50 rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-gradient-to-br from-stone-50 to-white border border-stone-100 rounded-3xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 h-[420px] bg-gradient-to-br from-stone-50 to-white border border-stone-100 rounded-3xl" />
      <div className="lg:col-span-4 h-[420px] bg-gradient-to-br from-stone-50 to-white border border-stone-100 rounded-3xl" />
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
  const [recentMessages, setRecentMessages] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [searchInsights, setSearchInsights] = useState([]); // 🟢 Added
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
      toast.loading("Refreshing...", { id: "refresh" });
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

      if (!isMounted.current) return;

      setStats(dashboardRes.data.stats);
      setGraph(dashboardRes.data.graph);
      setRecentOrders(dashboardRes.data.recentOrders);
      setRecentMessages(messagesRes.data.slice(0, 5));
      setAllReviews(reviewsRes.data?.slice(0, 6) || []);
      setSearchInsights(insightsRes.data || []);

      setLoading(false);
      setError(null);
      setLastUpdated(new Date());

      if (isManual) toast.success("Updated", { id: "refresh" });
    } catch (err) {
      if (!isMounted.current) return;
      setLoading(false);
      if (err.response?.status === 401) navigate("/login");
      setError(err.response?.data?.message || "Failed to load data");
      if (isManual) toast.error("Update failed", { id: "refresh" });
    } finally {
      if (isMounted.current && isManual) setIsRefreshing(false);
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
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
      fetchDashboardData();
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const toggleMaintenanceClick = async () => {
    const nextState = !settings.isMaintenanceMode;
    setPendingMaintenanceState(nextState);

    const toastId = toast.loading("Requesting OTP...");
    try {
      await axios.post("/api/admin/maintenance/request-otp", {}, { withCredentials: true });
      toast.success("OTP sent!", { id: toastId });
      setShowOtpModal(true);
      setOtp("");
    } catch (err) {
      toast.error("Failed to send OTP", { id: toastId });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return toast.error("Enter 6-digit OTP");

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

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white p-4 md:p-6 font-sans"
    >
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* OTP Modal */}
        <AnimatePresence>
          {showOtpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={() => setShowOtpModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-stone-200"
              >
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="absolute top-5 right-5 text-stone-300 hover:text-stone-600 p-2 rounded-full hover:bg-stone-50 transition-all"
                >
                  <FiX size={20} />
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-stone-100 to-stone-50 text-stone-400 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-stone-200">
                    <FiLock size={28} />
                  </div>
                  <h3 className="text-2xl font-light text-stone-900 mb-2 tracking-tight">Verify Identity</h3>
                  <p className="text-sm text-stone-500">Enter the code sent to your email</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-5 py-5 bg-stone-50 border border-stone-200 rounded-2xl font-mono text-3xl text-center tracking-[0.5em] focus:bg-white focus:border-stone-400 focus:ring-2 focus:ring-stone-300/50 transition-all outline-none text-stone-800 placeholder:text-stone-300"
                    placeholder="000000"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={verifyingOtp || otp.length !== 6}
                    className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                  >
                    {verifyingOtp ? (
                      <>
                        <SeaBiteLoader small />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/50 pb-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-stone-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-300" />
              Last updated {lastUpdated?.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <StatCard
            title="Today's Gross"
            value={`₹${stats.todayRevenue?.toLocaleString() || 0}`}
            icon={<FiDollarSign size={20} />}
            color="from-amber-50 to-orange-50"
            index={0}
            subtitle={`Total: ₹${stats.totalRevenue?.toLocaleString() || 0}`}
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders || 0}
            icon={<FiShoppingBag size={20} />}
            color="from-blue-50 to-cyan-50"
            index={1}
          />
          <StatCard
            title="Customers"
            value={stats.activeUsers || 0}
            icon={<FiUsers size={20} />}
            color="from-teal-50 to-emerald-50"
            index={2}
          />
          <StatCard
            title="Pending & Dispatch"
            value={stats.pendingOrders || 0}
            icon={<FiClock size={20} />}
            color="from-rose-50 to-pink-50"
            index={3}
            subtitle={`Pressure: Awaiting (${stats.awaitingPickup || 0}) vs Out (${stats.outForDelivery || 0})`}
          >
             <div className="mt-3">
                <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden flex">
                   <div style={{ width: `${(stats.awaitingPickup / ((stats.awaitingPickup + stats.outForDelivery) || 1)) * 100}%` }} className="bg-amber-400 h-full transition-all duration-500"></div>
                   <div style={{ width: `${(stats.outForDelivery / ((stats.awaitingPickup + stats.outForDelivery) || 1)) * 100}%` }} className="bg-emerald-400 h-full transition-all duration-500"></div>
                </div>
             </div>
          </StatCard>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Revenue Chart */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/50 shadow-sm p-8 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-light text-stone-900 mb-1">Revenue Trend</h3>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Last {timeFilter === "6months" ? "6 months" : "year"}</p>
              </div>
              <div className="flex bg-stone-100/60 p-1 rounded-2xl gap-1">
                {["6months", "1year"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${timeFilter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                  >
                    {f === "6months" ? "6M" : "1Y"}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graph} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a8a29e" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#a8a29e" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revenueGrad)" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            variants={fadeUp}
            custom={5}
            className="lg:col-span-4 space-y-4"
          >
            {/* Maintenance */}
            <div
              onClick={toggleMaintenanceClick}
              className={`rounded-3xl p-5 border cursor-pointer transition-all ${settings.isMaintenanceMode ? "bg-rose-50/40 border-rose-200/50 hover:border-rose-300" : "bg-stone-50/30 border-stone-200/40 hover:border-stone-300"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${settings.isMaintenanceMode ? "bg-rose-100 text-rose-600" : "bg-stone-200 text-stone-600"}`}>
                    {settings.isMaintenanceMode ? <FiLock size={18} /> : <FiUnlock size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-stone-900">Maintenance</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{settings.isMaintenanceMode ? "Store locked" : "Store live"}</p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${settings.isMaintenanceMode ? "bg-rose-400" : "bg-stone-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.isMaintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            {/* Happy Hour */}
            <div
              onClick={async () => {
                try {
                  const newDiscount = settings.globalDiscount > 0 ? 0 : 10;
                  await axios.put("/api/admin/enterprise/settings", { globalDiscount: newDiscount }, { withCredentials: true });
                  setSettings(prev => ({ ...prev, globalDiscount: newDiscount }));
                  toast.success(newDiscount > 0 ? "Happy Hour On!" : "Happy Hour Off");
                } catch (err) { toast.error("Update failed"); }
              }}
              className={`rounded-3xl p-5 border cursor-pointer transition-all ${settings.globalDiscount > 0 ? "bg-amber-50/40 border-amber-200/50 hover:border-amber-300" : "bg-stone-50/30 border-stone-200/40 hover:border-stone-300"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${settings.globalDiscount > 0 ? "bg-amber-100 text-amber-600" : "bg-stone-200 text-stone-600"}`}>
                    {settings.globalDiscount > 0 ? <FiZap size={18} /> : <FiClock size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-stone-900">Happy Hour</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{settings.globalDiscount > 0 ? "10% off" : "Normal pricing"}</p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-all ${settings.globalDiscount > 0 ? "bg-amber-400" : "bg-stone-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.globalDiscount > 0 ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            {/* Banner */}
            <BannerControl settings={settings} setSettings={setSettings} />
          </motion.div>
        </div>

        {/* Exports & Insights */}
        <motion.div
          variants={fadeUp}
          custom={6}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <ExportCard
            title="Sales Report"
            desc="Export all orders"
            icon={<FiDollarSign size={18} />}
            onClick={async () => {
              const toastId = toast.loading("Generating...");
              try {
                const { data } = await axios.get("/api/orders", { withCredentials: true });
                const csv = [
                  ["Order ID", "Date", "Customer", "Email", "Total", "Status"],
                  ...data.map(o => [o.orderId || o._id, new Date(o.createdAt).toLocaleDateString(), o.user?.name || "Guest", o.user?.email || "N/A", o.totalAmount, o.status])
                ].map(e => e.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Downloaded!", { id: toastId });
              } catch (e) {
                toast.error("Export failed", { id: toastId });
              }
            }}
          />

          <ExportCard
            title="Customer Data"
            desc="Export user list"
            icon={<FiUsers size={18} />}
            onClick={async () => {
              const toastId = toast.loading("Generating...");
              try {
                const { data } = await axios.get("/api/admin/users/intelligence", { withCredentials: true });
                const csv = [
                  ["User ID", "Name", "Email", "Joined", "Total Spent"],
                  ...data.map(u => [u._id, u.name, u.email, new Date(u.createdAt).toLocaleDateString(), u.intelligence?.totalSpent || 0])
                ].map(e => e.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toast.success("Downloaded!", { id: toastId });
              } catch (e) {
                toast.error("Export failed", { id: toastId });
              }
            }}
          />

          <SearchInsightsCard insights={searchInsights} />
        </motion.div>

        {/* Orders & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Orders */}
          <motion.div
            variants={fadeUp}
            custom={7}
            className="lg:col-span-8 bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6 border-b border-stone-100/50 flex justify-between items-center">
              <h3 className="text-lg font-light text-stone-900">Recent Orders</h3>
              <button
                onClick={() => navigate("/admin/orders")}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-medium transition-all"
              >
                View All
              </button>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
              {recentOrders.length === 0 ? (
                <div className="py-16 text-center">
                  <FiShoppingBag className="mx-auto text-stone-300 mb-3" size={40} />
                  <p className="text-stone-400 text-sm">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => navigate(`/admin/orders`)}
                      className="flex items-center justify-between p-4 bg-stone-50/30 hover:bg-stone-100/50 rounded-2xl border border-transparent hover:border-stone-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {order.items?.[0] ? (
                          <img
                            src={getImageUrl(order.items[0].image)}
                            className="w-12 h-12 object-cover rounded-xl bg-stone-50 border border-stone-100"
                            alt="product"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                            <FiPackage size={20} />
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">
                            {order.user?.name || "Customer"}
                          </h4>
                          <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                            #{order.orderId || order._id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-stone-900">₹{(order.totalAmount || 0).toLocaleString()}</p>
                        <StatusPill status={order.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity */}
          <motion.div variants={fadeUp} custom={8} className="lg:col-span-4 space-y-5">
            {/* Messages */}
            <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm p-6 h-[280px] flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-light text-stone-900">Messages</h3>
                <button onClick={() => navigate("/admin/messages")} className="text-stone-400 hover:text-stone-600 transition-colors">
                  <FiMail size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {recentMessages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiMail className="text-stone-300 mb-2" size={28} />
                    <p className="text-xs text-stone-400">No messages</p>
                  </div>
                ) : (
                  recentMessages?.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() => navigate("/admin/messages")}
                      className="p-3 bg-stone-50/40 hover:bg-stone-100/50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-stone-200 group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-medium text-stone-900 truncate max-w-[120px]">{msg.email}</h4>
                        <span className="text-[10px] text-stone-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-1">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm p-6 h-[280px] flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-light text-stone-900">Reviews</h3>
                <span className="text-xs font-medium text-stone-500 bg-stone-100/50 px-2.5 py-1 rounded-full">{allReviews.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {allReviews?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiStar className="text-stone-300 mb-2" size={28} />
                    <p className="text-xs text-stone-400">No reviews yet</p>
                  </div>
                ) : (
                  allReviews?.map((rev) => (
                    <div key={rev._id} className="p-3 bg-stone-50/40 rounded-2xl group relative border border-transparent hover:border-stone-200 transition-all hover:bg-stone-100/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteReviewHandler(rev.productId, rev._id); }}
                        className="absolute top-2 right-2 text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:scale-110"
                      >
                        <FiTrash2 size={12} />
                      </button>
                      <div className="flex gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} size={10} className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"} />
                        ))}
                      </div>
                      <p className="text-xs text-stone-700 line-clamp-1">"{rev.comment}"</p>
                      <div className="flex justify-between items-center text-[10px] mt-2 text-stone-500">
                        <span>{rev.userName}</span>
                        <span className="text-stone-400">{rev.productName}</span>
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

function StatCard({ title, value, icon, color, index, subtitle, children }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`bg-gradient-to-br ${color} rounded-3xl p-6 border border-stone-200/30 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="text-stone-600 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">{title}</p>
        <h4 className="text-2xl font-light text-stone-900">{value}</h4>
        {subtitle && <p className="text-[10px] font-semibold text-stone-500 uppercase mt-1">{subtitle}</p>}
        {children}
      </div>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const map = {
    "Pending": "bg-amber-100/60 text-amber-700 border-amber-200/50",
    "Cooking": "bg-blue-100/60 text-blue-700 border-blue-200/50",
    "Ready": "bg-teal-100/60 text-teal-700 border-teal-200/50",
    "Completed": "bg-emerald-100/60 text-emerald-700 border-emerald-200/50",
    "Cancelled": "bg-rose-100/60 text-rose-700 border-rose-200/50"
  };
  const s = map[status] || "bg-stone-100/60 text-stone-600 border-stone-200/50";

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${s}`}>
      {status}
    </span>
  );
}

function ExportCard({ title, desc, icon, onClick }) {
  return (
    <div onClick={onClick} className="bg-gradient-to-br from-stone-50 to-white rounded-3xl p-6 border border-stone-200/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-stone-600 opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>
          <div>
            <h3 className="font-medium text-stone-900 text-sm">{title}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
          </div>
        </div>
        <FiDownload className="text-stone-400 group-hover:text-stone-600 transition-colors" size={18} />
      </div>
    </div>
  );
}

function SearchInsightsCard({ insights }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200/50 shadow-sm p-6 max-h-[200px] flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-stone-900">Top Searches</h3>
        <FiSearch className="text-stone-400" size={16} />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {insights?.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-4">No searches yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {insights.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-stone-50 border border-stone-100 px-2.5 py-1 rounded-lg">
                <span className="text-xs font-medium text-stone-700">{item.query}</span>
                <span className={`text-[9px] font-bold px-1 rounded ${item.found ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerControl({ settings, setSettings }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Upload an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (Max 5MB)");

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    const toastId = toast.loading("Uploading...");

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
    <div className={`rounded-3xl p-5 border transition-all ${settings.banner?.active ? "bg-teal-50/40 border-teal-200/50 hover:border-teal-300" : "bg-stone-50/30 border-stone-200/40 hover:border-stone-300"}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${settings.banner?.active ? "bg-teal-100 text-teal-600" : "bg-stone-200 text-stone-600"}`}>
            <FiStar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-stone-900">Promo Banner</h3>
            <p className="text-xs text-stone-500 mt-0.5">{settings.banner?.active ? "Visible" : "Hidden"}</p>
          </div>
        </div>

        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const next = !settings.banner?.active;
              await axios.put("/api/admin/enterprise/settings", { banner: { ...settings.banner, active: next } }, { withCredentials: true });
              setSettings(prev => ({ ...prev, banner: { ...prev.banner, active: next } }));
              toast.success(next ? "Published!" : "Hidden");
            } catch (err) { toast.error("Update failed"); }
          }}
          className={`w-12 h-7 rounded-full p-1 transition-all ${settings.banner?.active ? "bg-teal-400" : "bg-stone-300"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.banner?.active ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragging ? "border-teal-400 bg-teal-50/50" : "border-stone-200 hover:border-stone-300 bg-stone-50/30"}`}
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
          <div className="py-2">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mx-auto mb-1" />
            <span className="text-xs text-stone-600">Uploading...</span>
          </div>
        ) : settings.banner?.imageUrl ? (
          <div className="w-full group">
            <img src={settings.banner.imageUrl} alt="Banner" className="h-16 w-full object-cover rounded-lg" />
            <p className="text-xs text-stone-500 mt-2 group-hover:text-stone-700 transition-colors">Click to change</p>
          </div>
        ) : (
          <div className="py-4">
            <FiCheckCircle className="mx-auto text-stone-300 mb-2" size={20} />
            <p className="text-xs font-medium text-stone-600">Drop image here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl shadow-lg text-xs">
        <p className="font-medium text-stone-600 mb-2 uppercase tracking-wide text-[10px]">{label}</p>
        <p className="font-semibold text-stone-900">₹{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
}
