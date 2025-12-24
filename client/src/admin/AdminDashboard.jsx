import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { FiShoppingBag, FiUsers, FiTrendingUp, FiActivity, FiDollarSign, FiCalendar, FiMail, FiTrash2, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";

// 🟢 SAFE PLACEHOLDER: Gray Box
const PLACEHOLDER_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export default function AdminDashboard() {
  const navigate = useNavigate(); 
  const [timeFilter, setTimeFilter] = useState("6months"); 
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [graph, setGraph] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  
  // ✅ NEW: Reviews State
  const [allReviews, setAllReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  const API_URL = "https://seabite-server.vercel.app";

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]); 

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
        // ✅ Parallel Fetch: Dashboard + Messages + All Reviews
        const [dashboardRes, messagesRes, reviewsRes] = await Promise.all([
            axios.get(`${API_URL}/api/admin`, { ...config, params: { range: timeFilter } }),
            axios.get(`${API_URL}/api/contact`),
            axios.get(`${API_URL}/api/admin/reviews/all`, config)
        ]);

        setStats(dashboardRes.data.stats);
        setGraph(dashboardRes.data.graph);
        setRecentOrders(dashboardRes.data.recentOrders);
        setPopularProducts(dashboardRes.data.popularProducts);
        setRecentMessages(messagesRes.data.slice(0, 4));
        
        // Set Reviews (Take top 6 for the dashboard view)
        setAllReviews(reviewsRes.data.slice(0, 6));

        setLoading(false);
        setError(null);
    } catch (err) {
        console.error(err);
        setLoading(false);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
    }
  };

  const deleteReviewHandler = async (productId, reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData(); // Refresh all data
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMG; 
    const filename = imagePath.split(/[/\\]/).pop();
    return `${API_URL}/uploads/${filename}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium text-sm tracking-wide">Loading Analytics...</p>
      </div>
    );
  }
  
  if (error) {
    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen flex items-center justify-center">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} className="text-center p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-red-100 max-w-sm w-full">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <FiActivity size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Error</h3>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">Retry</button>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen space-y-6 md:space-y-8 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">Welcome back, Admin. Data updated live.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <FiCalendar className="text-slate-400" />
          <span className="text-xs md:text-sm font-medium text-slate-600">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${(stats.orders * 450).toLocaleString()}`} 
          icon={<FiDollarSign size={20} />} 
          trend="+12.5%" 
          lightColor="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.orders} 
          icon={<FiShoppingBag size={20} />} 
          trend="+5.2%" 
          lightColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Active Users" 
          value={stats.users} 
          icon={<FiUsers size={20} />} 
          trend="+2.4%" 
          lightColor="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* MAIN CONTENT: CHART & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-row justify-between items-center mb-6">
                <h3 className="text-base md:text-lg font-bold text-slate-900">Revenue Analytics</h3>
                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2 py-1 outline-none">
                    <option value="6months">6 Months</option>
                    <option value="1year">12 Months</option>
                </select>
            </div>
            <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graph}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.1} fill="#3b82f6" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">Top Selling Items</h3>
            <div className="space-y-5">
                {popularProducts?.slice(0, 5).map((p) => (
                    <div key={p._id} className="flex items-center gap-4">
                        <img src={getImageUrl(p.image)} className="w-10 h-10 rounded-lg object-contain bg-slate-50 border" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-xs truncate">{p.name}</h4>
                            <div className="h-1 w-full bg-slate-100 rounded-full mt-1">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.totalSold / (popularProducts[0]?.totalSold || 1)) * 100}%` }} />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{p.totalSold} sold</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* ROW 3: ORDERS, MESSAGES & REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ORDERS */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
                <button onClick={() => navigate('/admin/orders')} className="text-xs text-blue-600">View All</button>
            </div>
            <div className="p-4 space-y-3">
                {recentOrders?.map(o => (
                    <div key={o._id} className="flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-400">#{o.orderId}</span>
                        <span className="font-bold text-slate-900">₹{o.totalAmount}</span>
                        <StatusPill status={o.status} />
                    </div>
                ))}
            </div>
        </div>

        {/* MESSAGES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Inquiries</h3>
            <div className="space-y-4">
                {recentMessages?.map(msg => (
                    <div key={msg._id} className="flex gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <FiMail size={12} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{msg.email}</p>
                            <p className="text-slate-400 truncate">{msg.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 🟢 FEEDBACK MODERATION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Feedback Moderation</h3>
            <div className="space-y-4">
                {allReviews?.length > 0 ? allReviews.map(rev => (
                    <div key={rev._id} className="p-3 bg-slate-50 rounded-xl relative group">
                        <button 
                            onClick={() => deleteReviewHandler(rev.productId, rev._id)}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FiTrash2 size={12} />
                        </button>
                        <div className="flex gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                                <FiStar key={i} size={8} className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-600 italic line-clamp-2 mb-1">"{rev.comment}"</p>
                        <p className="text-[10px] font-bold text-slate-900">— {rev.userName}</p>
                    </div>
                )) : (
                    <p className="text-xs text-slate-400 text-center py-4">No reviews yet.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// === SUB COMPONENTS ===

function StatCard({ title, value, icon, trend, lightColor }) { 
  return (
    <motion.div whileHover={{ y: -1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lightColor}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
        </span>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      </div>
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
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${styles[status] || styles.Pending}`}>{status}</span>;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-[10px]">
        <p className="font-semibold">{label}</p>
        <p className="font-bold">{payload[0].value} Orders</p>
      </div>
    );
  }
  return null;
}