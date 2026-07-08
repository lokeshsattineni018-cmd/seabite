import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiTruck, FiActivity, FiAlertTriangle, FiClock, FiCheckCircle,
  FiDollarSign, FiUser, FiPhone, FiMapPin, FiAward, FiZap,
  FiShield, FiThermometer, FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.6, ease },
  }),
};

export default function AdminFleetConsole() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("drivers"); // drivers, deliveries, leaderboard, sos

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/delivery/fleet-overview", { withCredentials: true });
      setData(res.data);
    } catch {
      toast.error("Failed to load fleet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return <SeaBiteLoader />;

  const { partners, activeDeliveries, fleetStats, sosAlerts } = data;

  const statusColor = (s) => s === "Active" ? "bg-emerald-500" : "bg-stone-300";
  const statusBg = (s) => s === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-50 text-stone-500 border-stone-200";

  return (
    <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen font-sans">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200/50 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight">Fleet Console</h1>
          <p className="text-sm text-stone-500 font-medium mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time fleet monitoring · Auto-refreshes every 15s
          </p>
        </div>
        <button onClick={() => { setLoading(true); fetchData(); }} className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* Fleet KPI Strip */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Online", value: fleetStats.online, icon: <FiActivity size={14} />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { label: "Offline", value: fleetStats.offline, icon: <FiUser size={14} />, color: "text-stone-500 bg-stone-50 border-stone-200" },
          { label: "Delivering", value: fleetStats.delivering, icon: <FiTruck size={14} />, color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "Today Delivered", value: fleetStats.totalDeliveriesToday, icon: <FiCheckCircle size={14} />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { label: "Fleet Earnings", value: `₹${fleetStats.totalEarningsToday?.toLocaleString()}`, icon: <FiDollarSign size={14} />, color: "text-purple-600 bg-purple-50 border-purple-200" },
          { label: "Avg/Driver", value: fleetStats.avgDeliveriesPerDriver, icon: <FiZap size={14} />, color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "Fatigue Warns", value: fleetStats.fatigueWarnings, icon: <FiThermometer size={14} />, color: fleetStats.fatigueWarnings > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-stone-500 bg-stone-50 border-stone-200" },
          { label: "Inspection %", value: `${fleetStats.inspectionPassRate}%`, icon: <FiShield size={14} />, color: "text-blue-600 bg-blue-50 border-blue-200" },
        ].map((k, i) => (
          <div key={i} className={`p-3.5 rounded-2xl border ${k.color} flex flex-col gap-1`}>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest opacity-70">{k.icon} {k.label}</div>
            <p className="text-xl font-bold">{k.value}</p>
          </div>
        ))}
      </motion.div>

      {/* SOS Alert Banner */}
      {sosAlerts.length > 0 && (
        <motion.div variants={fadeUp} custom={2} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle className="text-rose-600" size={18} />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-widest">🚨 Active SOS Alerts ({sosAlerts.length})</span>
          </div>
          <div className="space-y-2">
            {sosAlerts.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-rose-700">{s.driverName}</span>
                  <span className="text-stone-400">{new Date(s.triggeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <span className="text-rose-600 font-bold">{s.reason || "Emergency"}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div variants={fadeUp} custom={3} className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 w-fit">
        {[
          { key: "drivers", label: "All Drivers", icon: <FiUser size={13} /> },
          { key: "deliveries", label: "Active Deliveries", icon: <FiTruck size={13} /> },
          { key: "leaderboard", label: "Leaderboard", icon: <FiAward size={13} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${tab === t.key ? "bg-stone-900 text-white shadow-md" : "text-stone-500 hover:text-stone-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {tab === "drivers" && (
        <motion.div variants={fadeUp} custom={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map(p => (
            <div key={p._id} className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-lg transition-shadow">
              {/* Driver header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${p.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"} flex items-center justify-center font-bold text-sm`}>
                    {p.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                    <p className="text-[10px] text-stone-400 flex items-center gap-1"><FiPhone size={10} /> {p.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${statusColor(p.status)} ${p.status === "Active" ? "animate-pulse" : ""}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${statusBg(p.status)}`}>{p.status === "Active" ? "Online" : "Offline"}</span>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-2 mb-4 text-xs text-stone-500">
                <FiTruck size={12} />
                <span className="font-medium">{p.vehicleType} · {p.vehicleNumber}</span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-stone-50 rounded-xl p-2.5 text-center border border-stone-100">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Active</p>
                  <p className="text-lg font-bold text-stone-900">{p.activeOrders}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 text-center border border-stone-100">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Today</p>
                  <p className="text-lg font-bold text-stone-900">{p.todayDeliveries}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-2.5 text-center border border-stone-100">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Earned</p>
                  <p className="text-lg font-bold text-emerald-700">₹{p.todayEarnings}</p>
                </div>
              </div>

              {/* Bottom badges */}
              <div className="flex flex-wrap gap-1.5">
                {p.streak > 0 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">🔥 {p.streak}-day streak</span>
                )}
                {p.fatigueWarning && !p.fatigueLocked && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">⚠️ Fatigue</span>
                )}
                {p.fatigueLocked && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">🔒 Fatigue Lock</span>
                )}
                {p.inspectionPassed && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">✅ Inspected</span>
                )}
                {p.onlineMinutes > 0 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                    <FiClock size={9} className="inline mr-0.5" /> {Math.floor(p.onlineMinutes / 60)}h {p.onlineMinutes % 60}m
                  </span>
                )}
              </div>

              {/* Active order list */}
              {p.activeOrderDetails.length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Active Orders</p>
                  {p.activeOrderDetails.map(o => (
                    <div key={o._id} className="flex items-center justify-between bg-blue-50/50 p-2 rounded-lg text-[10px] border border-blue-100/50">
                      <span className="font-mono font-bold text-blue-700">#{o.orderId}</span>
                      <span className="text-stone-500 truncate max-w-[120px]">{o.customer}</span>
                      <span className="font-bold text-blue-600">{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {partners.length === 0 && (
            <div className="col-span-3 text-center py-20 text-stone-400 text-sm">No delivery partners registered yet.</div>
          )}
        </motion.div>
      )}

      {tab === "deliveries" && (
        <motion.div variants={fadeUp} custom={4}>
          {activeDeliveries.length === 0 ? (
            <div className="text-center py-20 text-stone-400 text-sm bg-stone-50 rounded-2xl border border-stone-200">No active deliveries right now.</div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Order</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Driver</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Customer</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Area</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDeliveries.map(d => (
                    <tr key={d._id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono font-bold text-blue-600">#{d.orderId}</td>
                      <td className="px-5 py-3 text-xs font-bold text-stone-900">{d.driver || "Unassigned"}</td>
                      <td className="px-5 py-3 text-xs text-stone-700">{d.customer}</td>
                      <td className="px-5 py-3 text-xs text-stone-500">{d.area || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                          d.status === "Out for Delivery" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          d.status === "Shipped" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-stone-50 text-stone-600 border-stone-200"
                        }`}>{d.status}</span>
                      </td>
                      <td className="px-5 py-3 text-[10px] text-stone-400 font-mono">{new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {tab === "leaderboard" && (
        <motion.div variants={fadeUp} custom={4} className="space-y-3">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ranked by today's deliveries</p>
          {[...partners].sort((a, b) => b.todayDeliveries - a.todayDeliveries).map((p, i) => (
            <div key={p._id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${i === 0 ? "bg-amber-50/50 border-amber-200" : i === 1 ? "bg-stone-50 border-stone-200" : i === 2 ? "bg-orange-50/30 border-orange-200/50" : "bg-white border-stone-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-amber-200 text-amber-800" : i === 1 ? "bg-stone-200 text-stone-700" : i === 2 ? "bg-orange-200 text-orange-800" : "bg-stone-100 text-stone-500"}`}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </div>
                <div>
                  <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                  <p className="text-[10px] text-stone-400">{p.vehicleType} · {p.vehicleNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Deliveries</p>
                  <p className="text-lg font-bold text-stone-900">{p.todayDeliveries}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Earnings</p>
                  <p className="text-lg font-bold text-emerald-700">₹{p.todayEarnings}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Online</p>
                  <p className="text-sm font-bold text-stone-600">{Math.floor(p.onlineMinutes / 60)}h {p.onlineMinutes % 60}m</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
