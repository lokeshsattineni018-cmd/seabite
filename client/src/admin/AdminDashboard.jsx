import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { FiShoppingBag, FiUsers, FiTrendingUp, FiActivity, FiDollarSign, FiCalendar } from "react-icons/fi";
import { motion } from "framer-motion";

// 🟢 SAFE PLACEHOLDER: Gray Box (Works offline)
const PLACEHOLDER_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export default function AdminDashboard() {
  const navigate = useNavigate(); 
  const [timeFilter, setTimeFilter] = useState("6months"); 
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });
  const [graph, setGraph] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]); 

  const fetchDashboardData = () => {
    const token = localStorage.getItem("token");
    
    axios
      .get("http://localhost:5001/api/admin", { 
        headers: { Authorization: `Bearer ${token}` },
        params: { range: timeFilter } 
      })
      .then((res) => {
        setStats(res.data.stats);
        setGraph(res.data.graph);
        setRecentOrders(res.data.recentOrders);
        setPopularProducts(res.data.popularProducts);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMG; 
    const filename = imagePath.split(/[/\\]/).pop();
    return `http://localhost:5001/uploads/${filename}`;
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
      
      {/* HEADER - Stack on mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">Welcome back, Admin. Data updated live.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm w-full md:w-auto justify-center md:justify-start">
          <FiCalendar className="text-slate-400" />
          <span className="text-xs md:text-sm font-medium text-slate-600">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* STATS GRID - 1 col mobile, 3 col desktop */}
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

      {/* MAIN CONTENT - Stack vertically on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-row justify-between items-center mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-bold text-slate-900">Revenue Analytics</h3>
                <select 
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 rounded-lg px-2 py-1.5 md:px-3 md:py-2 outline-none cursor-pointer"
                >
                    <option value="6months">6 Months</option>
                    <option value="1year">12 Months</option>
                </select>
            </div>

            <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5'}} />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* POPULAR PRODUCTS */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-6">Top Selling Items</h3>
            <div className="space-y-4 md:space-y-5">
                {popularProducts.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-10">No data available yet.</p>
                ) : (
                    popularProducts.slice(0, 5).map((p) => (
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
                    ))
                )}
            </div>
            <button className="w-full mt-6 py-2 text-[10px] md:text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                View All Products
            </button>
        </div>
      </div>

      {/* RECENT ORDERS TABLE - Scrollable on mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base md:text-lg font-bold text-slate-900">Recent Orders</h3>
            <button onClick={() => navigate('/admin/orders')} className="text-xs md:text-sm font-medium text-blue-600">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] md:min-w-0">
              <thead className="bg-slate-50 text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4">ID</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Customer</th>
                  <th className="px-4 py-3 md:px-6 md:py-4">Status</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                {recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 md:px-6 md:py-4 font-mono font-medium text-slate-600 text-[10px] md:text-xs">#{o.orderId}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-slate-900">{o.user?.name || "Guest"}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4"><StatusPill status={o.status} /></td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right font-bold text-slate-900">₹{o.totalAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}

// === SUB COMPONENTS ===

function StatCard({ title, value, icon, trend, lightColor }) { 
  return (
    <motion.div whileHover={{ y: -1 }} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${lightColor}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <FiTrendingUp size={12} /> {trend}
        </span>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide mb-1">{title}</p>
        <h4 className="text-xl md:text-3xl font-bold text-slate-900">{value}</h4>
      </div>
    </motion.div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Pending: "text-amber-700 bg-amber-50 border-amber-100",
    Processing: "text-blue-700 bg-blue-50 border-blue-100",
    Shipped: "text-indigo-700 bg-indigo-50 border-indigo-100",
    Delivered: "text-emerald-700 bg-emerald-50 border-emerald-100",
    Cancelled: "text-red-700 bg-red-50 border-red-100",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.Pending}`}>{status || "Pending"}</span>;
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