// AdminAnalytics.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { FiTrendingUp, FiActivity, FiUsers, FiBox, FiAlertTriangle } from "react-icons/fi";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { motion } from "framer-motion";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { delay: i * 0.05, duration: 0.6, ease },
    }),
};

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

    if (loading) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-stone-400 font-bold space-y-4">
            <SeaBiteLoader />
            <p className="text-xs uppercase tracking-widest mt-2">Crunching Numbers...</p>
        </div>
    );

    if (!data) return (
        <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-rose-400 font-bold space-y-3">
            <FiAlertTriangle size={32} />
            <p className="text-sm">Failed to load data.</p>
        </div>
    );

    const { deadStock, retention, heatmap, referral, delivery } = data;

    // Transform heatmap for Recharts
    const heatmapData = heatmap.map(h => ({
        x: h._id.hour,
        y: h._id.day, // 1=Sun, 7=Sat
        z: h.orders, // Bubble size based on orders
        sales: h.sales
    }));

    const retentionData = [
        { name: "One-time", value: retention.total - retention.repeat, fill: "#e7e5e4" }, // stone-200
        { name: "Returning", value: retention.repeat, fill: "#1c1917" } // stone-900
    ];

    const DAYS = ["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-lg shadow-stone-200">
                        <FiActivity size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight mb-1">Advanced Analytics</h1>
                        <p className="text-stone-500 text-sm">Deep dive into retention, inventory health & traffic.</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 1. Retention Card */}
                    <motion.div variants={fadeUp} custom={1} className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Retention</h2>
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Returning vs One-time</p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-light text-stone-900">{retention.rate}%</span>
                                <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Rate</p>
                            </div>
                        </div>
                        <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={retentionData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {retentionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', padding: '10px', border: '1px solid #e7e5e4', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#44403c' }}
                                    />
                                    <Legend iconType="circle" verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#78716c' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="block text-3xl font-bold text-stone-800">{retention.total}</span>
                                    <span className="text-[10px] uppercase font-bold text-stone-400">Total Users</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Heatmap (Busy Hours) */}
                    <motion.div variants={fadeUp} custom={2} className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-stone-900">Traffic Heatmap</h2>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Busiest hours (Bubble size = Order Volume)</p>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                                    <XAxis type="number" dataKey="x" name="Hour" unit=":00" domain={[0, 23]} tickCount={12} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e' }} />
                                    <YAxis type="number" dataKey="y" name="Day" tickFormatter={tick => DAYS[tick]} domain={[1, 7]} tickCount={7} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 'bold' }} width={40} />
                                    <ZAxis type="number" dataKey="z" range={[60, 500]} name="Orders" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-stone-900 text-white p-3 rounded-xl text-xs shadow-xl">
                                                    <p className="font-bold mb-1">{DAYS[d.y]} @ {d.x}:00</p>
                                                    <div className="flex gap-4">
                                                        <span>Orders: <span className="font-bold">{d.z}</span></span>
                                                        <span>Sales: <span className="font-bold text-emerald-400">₹{d.sales}</span></span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Scatter name="Orders" data={heatmapData} fill="#8884d8">
                                        {heatmapData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.z > 5 ? "#ef4444" : entry.z > 2 ? "#3b82f6" : "#d6d3d1"} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* 4. Referral & Loyalty Card */}
                    <motion.div variants={fadeUp} custom={3} className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FiUsers size={20} /></div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Referral Program</h2>
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Loyalty & Growth</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-stone-50 pb-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Referrals</p>
                                    <p className="text-2xl font-bold text-stone-900">{referral?.totalReferrals || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Active Growth</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-b border-stone-50 pb-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">SeaBite Cash Issued</p>
                                    <p className="text-2xl font-bold text-stone-900">₹{referral?.totalCashIssued || 0}</p>
                                </div>
                                <div className="text-right text-stone-400">
                                    <FiTrendingUp size={16} />
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Unique Referrers</p>
                                    <p className="text-2xl font-bold text-stone-900">{referral?.uniqueReferrers || 0}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-1 rounded-md uppercase">Core Users</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 5. Logistics Performance */}
                    <motion.div variants={fadeUp} custom={3.5} className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiTrendingUp size={20} /></div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Logistics</h2>
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Delivery Efficiency</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl">
                                <div>
                                    <p className="text-2xl font-bold text-stone-900">{delivery?.rate}%</p>
                                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Delivery Rate</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-stone-900">{delivery?.delivered} / {delivery?.total}</p>
                                    <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Completed</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-3">Partner Performance</p>
                                <div className="space-y-2">
                                    {delivery?.partners.length === 0 ? (
                                        <p className="text-[11px] text-stone-400 italic">No partners assigned yet</p>
                                    ) : (
                                        delivery?.partners.slice(0, 3).map(p => (
                                            <div key={p.name} className="flex justify-between items-center text-sm">
                                                <span className="text-stone-600 font-medium">{p.name}</span>
                                                <span className="font-bold text-stone-900">{p.count} orders</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. Dead Stock Table */}
                    <motion.div variants={fadeUp} custom={4} className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow lg:col-span-3">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl"><FiAlertTriangle size={20} /></div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Dead Stock Alert</h2>
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Products with ZERO sales (Consider discounting)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {deadStock.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-stone-400 text-sm font-bold bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                                    No dead stock found! Everything is selling! 🎉
                                </div>
                            ) : (
                                deadStock.map(product => (
                                    <div key={product._id} className="relative group bg-stone-50/50 border border-stone-100 p-4 rounded-2xl hover:shadow-md transition-all hover:-translate-y-1 hover:bg-white">
                                        <div className="h-32 bg-stone-100 rounded-xl mb-4 flex items-center justify-center p-2 relative overflow-hidden">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-500" />
                                            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                0 Sold
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-bold text-stone-800 truncate mb-1">{product.name}</h3>
                                        <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium">
                                            <span className="bg-stone-200/50 px-2 py-0.5 rounded-lg uppercase tracking-wider">{product.category}</span>
                                            <span className="font-mono font-bold text-stone-900">₹{product.price}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </motion.div>
    );
}
