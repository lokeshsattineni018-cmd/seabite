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
  FiArrowUpRight, FiClock, FiRefreshCw, FiPackage, FiSearch,
  FiAlertCircle, FiPower, FiCheckCircle, FiLock, FiUnlock, FiX, FiZap, FiDownload
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// --- Theme Constants ---
const COLORS = {
  primary: "#3b82f6", // Blue-500
  success: "#10b981", // Emerald-500
  warning: "#f59e0b", // Amber-500
  danger: "#ef4444", // Red-500
  purple: "#8b5cf6",  // Violet-500
  slate: "#64748b",   // Slate-500
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple];

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

// --- Components ---

const StatCard = ({ title, value, icon, trend, trendUp, color, index }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color] || "bg-slate-50 text-slate-600"}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
};

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
        <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const StatusPill = ({ status }) => {
  const styles = {
    "Pending": "bg-amber-50 text-amber-600 border-amber-100",
    "Processing": "bg-blue-50 text-blue-600 border-blue-100",
    "Shipped": "bg-purple-50 text-purple-600 border-purple-100",
    "Delivered": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Cancelled": "bg-rose-50 text-rose-600 border-rose-100",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${styles[status] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
      {status}
    </span>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [graph, setGraph] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [settings, setSettings] = useState({});

  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const [dashRes, settingsRes] = await Promise.all([
        axios.get("/api/admin?range=6months", { withCredentials: true }),
        axios.get("/api/admin/enterprise/settings", { withCredentials: true })
      ]);
      setStats(dashRes.data.stats);
      setGraph(dashRes.data.graph);
      setRecentOrders(dashRes.data.recentOrders);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard");
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handlers
  const toggleMaintenance = async () => {
    const nextState = !settings.isMaintenanceMode;
    setPendingMaintenanceState(nextState);
    try {
      await axios.post("/api/admin/maintenance/request-otp", {}, { withCredentials: true });
      toast.success("OTP Sent!");
      setShowOtpModal(true);
    } catch { toast.error("Failed to send OTP"); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setVerifyingOtp(true);
    try {
      const res = await axios.post("/api/admin/maintenance/verify", { otp, desiredState: pendingMaintenanceState }, { withCredentials: true });
      setSettings(res.data.settings);
      setShowOtpModal(false);
      toast.success("Maintenance Updated!");
    } catch { toast.error("Invalid OTP"); }
    setVerifyingOtp(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse">Loading Dashboard...</div>;

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8 pb-10">

      {/* 1. Header & Actions */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time store performance & controls</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95">
            <FiRefreshCw />
          </button>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 shadow-sm flex items-center gap-2">
            <FiCalendar className="text-slate-400" />
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </motion.div>

      {/* 2. Control Center (Maintenance & Happy Hour) */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Maintenance Toggle */}
        <div className={`p-4 rounded-2xl border-l-4 shadow-sm flex items-center justify-between transition-colors ${settings.isMaintenanceMode ? "bg-rose-50 border-rose-500" : "bg-white border-emerald-500"}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.isMaintenanceMode ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
              {settings.isMaintenanceMode ? <FiLock size={20} /> : <FiUnlock size={20} />}
            </div>
            <div>
              <h3 className={`font-bold ${settings.isMaintenanceMode ? "text-rose-700" : "text-emerald-700"}`}>
                {settings.isMaintenanceMode ? "Maintenance Active" : "Store is Live"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.isMaintenanceMode ? "Only admins can access." : "Customers are shopping."}
              </p>
            </div>
          </div>
          <button onClick={toggleMaintenance} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 shadow-sm">
            {settings.isMaintenanceMode ? "Disable" : "Enable"}
          </button>
        </div>

        {/* Happy Hour Toggle */}
        <div className={`p-4 rounded-2xl border-l-4 shadow-sm flex items-center justify-between transition-colors ${settings.globalDiscount > 0 ? "bg-purple-50 border-purple-500" : "bg-white border-slate-300"}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${settings.globalDiscount > 0 ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"}`}>
              <FiZap size={20} />
            </div>
            <div>
              <h3 className={`font-bold ${settings.globalDiscount > 0 ? "text-purple-700" : "text-slate-700"}`}>
                {settings.globalDiscount > 0 ? "Happy Hour ON" : "Happy Hour OFF"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings.globalDiscount > 0 ? `Global ${settings.globalDiscount}% discount applied.` : "Standard pricing active."}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const next = settings.globalDiscount > 0 ? 0 : 10;
              await axios.put("/api/admin/enterprise/settings", { globalDiscount: next }, { withCredentials: true });
              setSettings(p => ({ ...p, globalDiscount: next }));
              toast.success(next > 0 ? "Happy Hour Started! 🍹" : "Happy Hour Ended");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm ${settings.globalDiscount > 0 ? "bg-purple-600 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
          >
            {settings.globalDiscount > 0 ? "End Event" : "Start Event"}
          </button>
        </div>
      </motion.div>

      {/* 3. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue?.toLocaleString()}`} icon={<FiDollarSign size={22} />} trend="+12%" trendUp={true} color="blue" index={2} />
        <StatCard title="Net Profit" value={`₹${stats.netProfit?.toLocaleString()}`} icon={<FiTrendingUp size={22} />} trend="+8%" trendUp={true} color="emerald" index={3} />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={<FiShoppingBag size={22} />} color="purple" index={4} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<FiClock size={22} />} trend={stats.pendingOrders > 5 ? "High" : "Normal"} trendUp={stats.pendingOrders < 5} color="amber" index={5} />
      </div>

      {/* 4. Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={fadeUp} custom={6} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Revenue Analytics</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0" }} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} custom={7} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Recent Orders</h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:border-blue-200 transition-colors group cursor-pointer" onClick={() => navigate("/admin/orders")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg font-bold text-slate-300 border border-slate-100 shadow-sm group-hover:text-blue-500 group-hover:border-blue-100">
                    <FiShoppingBag size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">{order.user?.name || "Guest"}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">#{order._id.slice(-6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">₹{order.totalAmount}</p>
                  <StatusPill status={order.status} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/admin/orders")} className="w-full mt-4 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            View All Orders
          </button>
        </motion.div>
      </div>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowOtpModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiLock size={24} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Security Check</h3>
                <p className="text-xs text-slate-500 mt-1">Enter the OTP sent to admin@seabite.co.in</p>
              </div>
              <form onSubmit={verifyOtp} className="space-y-4">
                <input
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  className="w-full text-center text-2xl font-mono tracking-[0.3em] py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="000000"
                />
                <button disabled={verifyingOtp} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                  {verifyingOtp ? "Verifying..." : "Confirm Action"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}