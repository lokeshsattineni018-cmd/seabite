import { useState, useEffect } from "react";
import axios from "axios";
import { FiTrendingUp, FiActivity, FiUsers, FiBox, FiAlertTriangle } from "react-icons/fi";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { motion } from "framer-motion";

export default function AdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await axios.get("/api/admin/analytics/advanced", { withCredentials: true });
                setData(data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load analytics", err);
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-400 animate-pulse font-bold">crunching numbers...</div>;
    if (!data) return <div className="p-10 text-center text-red-400 font-bold">Failed to load data.</div>;

    const { deadStock, retention, heatmap } = data;

    // Transform heatmap for Recharts
    const heatmapData = heatmap.map(h => ({
        x: h._id.hour,
        y: h._id.day, // 1=Sun, 7=Sat
        z: h.orders, // Bubble size based on orders
        sales: h.sales
    }));

    const retentionData = [
        { name: "One-time", value: retention.total - retention.repeat, fill: "#cbd5e1" },
        { name: "Returning", value: retention.repeat, fill: "#3b82f6" }
    ];

    const DAYS = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><FiActivity size={24} /></div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Advanced Analytics</h1>
                    <p className="text-slate-500 text-sm">Deep dive into retention, inventory health, and traffic.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Retention Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="font-bold text-slate-800">Customer Retention</h2>
                            <p className="text-xs text-slate-400">Returning vs One-time</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-blue-600">{retention.rate}%</span>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Retention Rate</p>
                        </div>
                    </div>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={retentionData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {retentionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-slate-800">{retention.total}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Customers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Heatmap (Busy Hours) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="mb-4">
                        <h2 className="font-bold text-slate-800">Traffic Heatmap</h2>
                        <p className="text-xs text-slate-400">Busiest hours (Bubble size = Order Volume)</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" name="Hour" unit=":00" domain={[0, 23]} tickCount={12} />
                                <YAxis type="number" dataKey="y" name="Day" tickFormatter={tick => DAYS[tick]} domain={[1, 7]} tickCount={7} />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Orders" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 text-white p-2 rounded-lg text-xs shadow-xl">
                                                <p className="font-bold">{DAYS[d.y]} @ {d.x}:00</p>
                                                <p>Orders: {d.z}</p>
                                                <p>Sales: ₹{d.sales}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Scatter name="Orders" data={heatmapData} fill="#8884d8">
                                    {heatmapData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.z > 5 ? "#ef4444" : entry.z > 2 ? "#3b82f6" : "#cbd5e1"} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Dead Stock Table */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-3">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FiAlertTriangle /></div>
                        <div>
                            <h2 className="font-bold text-slate-800">Dead Stock Alert</h2>
                            <p className="text-xs text-slate-400">Products with ZERO sales (Consider discounting or removing)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {deadStock.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-slate-400 text-sm font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No dead stock found! Everything is selling! 🎉
                            </div>
                        ) : (
                            deadStock.map(product => (
                                <div key={product._id} className="relative group bg-white border border-slate-100 p-3 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="h-24 bg-slate-50 rounded-lg mb-3 flex items-center justify-center p-2">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply opacity-70 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="text-xs font-bold text-slate-700 truncate mb-1">{product.name}</h3>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{product.category}</span>
                                        <span className="font-mono font-bold text-slate-900">₹{product.price}</span>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-100">
                                        0 Sold
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
