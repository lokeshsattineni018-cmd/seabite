import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { FiShoppingBag, FiUsers, FiTrendingUp, FiActivity, FiDollarSign, FiCalendar, FiMail, FiTrash2, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";

const PLACEHOLDER_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export default function AdminDashboard() {
  const navigate = useNavigate(); 
  const [timeFilter, setTimeFilter] = useState("6months"); 
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [graph, setGraph] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  const API_URL = "https://seabite-server.vercel.app";

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]); 

  const fetchDashboardData = async () => {
    try {
        // ✅ MONGO SESSION SYNC: Identity is verified via Cookie, no Bearer token needed
        const [dashboardRes, messagesRes, reviewsRes] = await Promise.all([
            axios.get(`${API_URL}/api/admin`, { 
              params: { range: timeFilter },
              withCredentials: true // ✅ Critical for Session authentication
            }),
            axios.get(`${API_URL}/api/contact`),
            axios.get(`${API_URL}/api/admin/reviews/all`, { withCredentials: true })
        ]);

        setStats(dashboardRes.data.stats);
        setGraph(dashboardRes.data.graph);
        setRecentOrders(dashboardRes.data.recentOrders);
        setPopularProducts(dashboardRes.data.popularProducts);
        setRecentMessages(messagesRes.data.slice(0, 4));
        setAllReviews(reviewsRes.data?.slice(0, 6) || []);

        setLoading(false);
        setError(null);
    } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
        // If 401, the MongoDB session is invalid or user isn't Admin
        if (err.response?.status === 401) {
          navigate("/login");
        }
        setError(err.response?.data?.message || "Failed to load dashboard data.");
    }
  };

  const deleteReviewHandler = async (productId, reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}/reviews/${reviewId}`, {
        withCredentials: true
      });
      fetchDashboardData(); 
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
        <p className="text-slate-500 font-medium text-sm tracking-wide">Verifying Admin Session...</p>
      </div>
    );
  }
  
  // ... Rest of the UI remains identical to your design ...
  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen space-y-6 md:space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">Authenticated via MongoDB Session Store</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-full md:w-auto justify-center md:justify-start">
          <FiCalendar className="text-slate-400" />
          <span className="text-xs md:text-sm font-medium text-slate-600">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} icon={<FiDollarSign size={20} />} trend="+12.5%" lightColor="bg-blue-50 text-blue-600" />
        <StatCard title="Total Orders" value={stats.orders} icon={<FiShoppingBag size={20} />} trend="+5.2%" lightColor="bg-emerald-50 text-emerald-600" />
        <StatCard title="Active Users" value={stats.users} icon={<FiUsers size={20} />} trend="+2.4%" lightColor="bg-indigo-50 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-row justify-between items-center mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-bold text-slate-900">Revenue Analytics</h3>
                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 rounded-lg px-2 py-1.5 md:px-3 md:py-2 outline-none cursor-pointer">
                    <option value="6months">6 Months</option>
                    <option value="1year">12 Months</option>
                </select>
            </div>
            <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5'}} />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">Top Selling Items</h3>
            <div className="space-y-4 md:space-y-5">
                {popularProducts?.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-10">No data available.</p> : 
                popularProducts?.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 md:gap-4 group">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                            <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-slate-900 text-xs md:text-sm truncate">{p.name}</h4>
                                <span className="text-[10px] md:text-xs font-bold text-slate-500">{p.totalSold} sold</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.totalSold / (popularProducts[0]?.totalSold || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold text-slate-900">Recent Orders</h3>
                <button onClick={() => navigate('/admin/orders')} className="text-xs md:text-sm font-medium text-blue-600">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[300px] md:min-w-0">
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                    {recentOrders?.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-medium text-slate-600 text-[10px]">#{o.orderId || o._id.substring(0,8)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{o.user?.name || "Guest"}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">₹{o.totalAmount}</td>
                        <td className="px-4 py-3 text-right"><StatusPill status={o.status} /></td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
            <div className="flex justify-between items-center mb-6"><h3 className="text-base md:text-lg font-bold text-slate-900">Inquiries</h3><button onClick={() => navigate('/admin/messages')} className="text-xs md:text-sm font-medium text-blue-600">View All</button></div>
            <div className="space-y-4">
                {recentMessages?.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No messages.</p> : 
                recentMessages?.map((msg) => (
                    <div key={msg._id} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 cursor-pointer" onClick={() => navigate('/admin/messages')}>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><FiMail size={14} /></div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline mb-0.5"><h4 className="text-[11px] font-bold text-slate-900 truncate">{msg.email}</h4><span className="text-[9px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span></div>
                            <p className="text-[10px] text-slate-500 truncate">{msg.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">Feedback Moderation</h3>
            <div className="space-y-4">
                {allReviews?.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No reviews.</p> : 
                allReviews?.map((rev) => (
                    <div key={rev._id} className="p-3 bg-slate-50 rounded-xl relative group border border-slate-100">
                        <button onClick={() => deleteReviewHandler(rev.productId, rev._id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><FiTrash2 size={14} /></button>
                        <div className="flex gap-0.5 mb-1.5">{[...Array(5)].map((_, i) => <FiStar key={i} size={10} className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />)}</div>
                        <p className="text-[10px] text-slate-600 italic line-clamp-2 mb-2">"{rev.comment}"</p>
                        <div className="flex justify-between items-center"><h4 className="text-[10px] font-bold text-slate-900">{rev.userName}</h4><span className="text-[9px] text-blue-500 font-bold uppercase">{rev.productName}</span></div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, lightColor }) { 
  return (
    <motion.div whileHover={{ y: -1 }} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${lightColor}`}>{icon}</div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><FiTrendingUp size={12} /> {trend}</span>
      </div>
      <div><p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide mb-1">{title}</p><h4 className="text-xl md:text-3xl font-bold text-slate-900">{value}</h4></div>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const styles = { Pending: "text-amber-700 bg-amber-50 border-amber-100", Processing: "text-blue-700 bg-blue-50 border-blue-100", Shipped: "text-indigo-700 bg-indigo-50 border-indigo-100", Delivered: "text-emerald-700 bg-emerald-50 border-emerald-100", Cancelled: "text-red-700 bg-red-50 border-red-100" };
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${styles[status] || styles.Pending}`}>{status || "Pending"}</span>;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-[10px]">
        <p className="font-semibold mb-1 opacity-70">{label}</p>
        <p className="font-bold">{payload[0].value} Orders</p>
      </div>
    );
  }
  return null;
}