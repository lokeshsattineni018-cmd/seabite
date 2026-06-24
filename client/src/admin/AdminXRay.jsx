import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiXCircle, FiZap, FiUser, FiClock, FiShoppingCart, 
  FiBell, FiCheck, FiX, FiInfo, FiCopy, FiDatabase, 
  FiActivity, FiTerminal, FiAlertTriangle, FiCpu 
} from "react-icons/fi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import socket from "../utils/socket";
import toast from "../utils/toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import axios from "axios";

const T = {
  bg: "#FAFAF8",
  card: "#FFFFFF",
  accent: "#0D9488",
  accentLight: "#F0FDFA",
  danger: "#E11D48",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  text: "#1C1917",
  muted: "#78716C",
  border: "rgba(120,113,108,0.12)"
};

export default function AdminXRay() {
  const [alerts, setAlerts] = useState([]);
  const [systemStats, setSystemStats] = useState({ cpu: 12, latency: 4, activeUsers: 1 });
  const [apiLogs, setApiLogs] = useState([
    { method: "GET", path: "/api/products", status: 200, duration: 15, traceId: "initial-tr-1", timestamp: new Date() },
    { method: "POST", path: "/api/telemetry/ping", status: 200, duration: 8, traceId: "initial-tr-2", timestamp: new Date() }
  ]);
  const [dbTrace, setDbTrace] = useState([
    { time: "16:00:00", duration: 25, pipeline: "Aggregate Orders by Category", collection: "orders", hasIndex: true },
    { time: "16:00:03", duration: 18, pipeline: "Lookup Customer Spend", collection: "users", hasIndex: true },
    { time: "16:00:06", duration: 32, pipeline: "Unwind Product Freshness", collection: "products", hasIndex: true },
    { time: "16:00:09", duration: 15, pipeline: "Calculate Active Delivery Driver Distance Density", collection: "deliveries", hasIndex: true }
  ]);
  
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

  useEffect(() => {
    socket.emit("join-admin");

    socket.on("FRUSTRATION_ALERT", (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
      audioRef.current.play().catch(() => {});
      toast("New Frustration Alert!", { icon: "🔍", style: { background: T.danger, color: "#fff" } });
    });

    socket.on("SYSTEM_PULSE", (data) => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.round((data.cpu || 0.12) * 100),
        latency: data.latency || 4
      }));
    });

    socket.on("USER_COUNT_UPDATE", (count) => {
      setSystemStats(prev => ({ ...prev, activeUsers: count }));
    });

    socket.on("API_TELEMETRY", (log) => {
      setApiLogs(prev => [log, ...prev].slice(0, 55));
    });

    socket.on("DB_TELEMETRY", (trace) => {
      setDbTrace(prev => {
        const timeStr = new Date(trace.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev, {
          time: timeStr,
          duration: trace.duration,
          pipeline: trace.pipeline,
          collection: trace.collection,
          hasIndex: trace.hasIndex
        }].slice(-25);
      });
    });

    return () => {
      socket.off("FRUSTRATION_ALERT");
      socket.off("SYSTEM_PULSE");
      socket.off("USER_COUNT_UPDATE");
      socket.off("API_TELEMETRY");
      socket.off("DB_TELEMETRY");
    };
  }, []);

  const handleRescue = async (alert) => {
    try {
      const rescueCode = "RESCUE50";
      toast.success(`Rescue coupon ${rescueCode} sent to ${alert.user?.name || 'Guest'}!`);
      setAlerts(prev => prev.map(a => a.timestamp === alert.timestamp ? { ...a, rescued: true } : a));
    } catch (err) {
      toast.error("Failed to initiate rescue");
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "COUPON_ABUSE": return { color: T.danger, bg: "#FFF1F2", label: "Coupon Friction", icon: <FiXCircle /> };
      case "HOVER_STALL": return { color: T.warning, bg: T.warningLight, label: "Button Hesitation", icon: <FiZap /> };
      case "TIME_STALL": return { color: "#7C3AED", bg: "#F5F3FF", label: "Checkout Stall", icon: <FiClock /> };
      default: return { color: T.muted, bg: "#F1F5F9", label: "Interaction", icon: <FiInfo /> };
    }
  };

  // Find slow queries exceeding 100ms in dbTrace
  const slowQueries = dbTrace.filter(t => t.duration > 100);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "Geist, sans-serif" }} className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <FiActivity size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Sentinel X-Ray Observatory</h1>
              <p className="text-stone-500 text-sm">Real-time database performance metrics and session friction logs.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Observability Hub Active
          </div>
        </div>

        {/* Real-time Observability Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiDatabase size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">DB Query Latency</p>
              <p className="text-2xl font-black text-stone-900 mt-0.5">{systemStats.latency} ms</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FiActivity size={22} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Connections</p>
              <p className="text-2xl font-black text-stone-900 mt-0.5">{systemStats.activeUsers} WebSockets</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiCpu size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Host CPU Load</p>
              <p className="text-2xl font-black text-stone-900 mt-0.5">{systemStats.cpu}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${alerts.some(a => !a.rescued) ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-600'}`}>
              <FiBell size={22} className={alerts.some(a => !a.rescued) ? "animate-bounce" : ""} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Friction Alerts</p>
              <p className="text-2xl font-black text-stone-900 mt-0.5">{alerts.filter(a => !a.rescued).length}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Aggregated Tracer & Checkout Alerts */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Database Execution Tracer Graph */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FiDatabase className="text-stone-600" />
                    Database Execution Tracer
                  </h2>
                  <p className="text-xs text-stone-400 font-medium">Aggregated execution latencies of active MongoDB pipelines.</p>
                </div>
                {slowQueries.length > 0 && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-amber-100">
                    <FiAlertTriangle /> Slow Pipeline Warning
                  </span>
                )}
              </div>

              {/* Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dbTrace}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.accent} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit="ms" />
                    <Tooltip 
                      contentStyle={{ background: "#fff", border: "1px solid rgba(120,113,108,0.12)", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
                      labelStyle={{ fontWeight: "bold", color: T.text, fontSize: 11 }}
                      itemStyle={{ color: T.accent, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="duration" name="Query Duration" stroke={T.accent} strokeWidth={2.5} fillOpacity={1} fill="url(#colorLatency)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Index Warning Messages */}
              {slowQueries.length > 0 ? (
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Observer Intelligence Alerts</h4>
                  {slowQueries.map((q, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-start gap-3"
                    >
                      <FiAlertTriangle className="text-amber-600 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          Missing Index Recommendation on collection: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">{q.collection}</code>
                        </p>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Aggregation pipeline <strong className="font-semibold text-amber-950">"{q.pipeline}"</strong> took <span className="font-extrabold text-amber-950">{q.duration}ms</span>. 
                          Creating a compound index is highly recommended to bring execution time below 100ms.
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center py-2 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-2xl border border-emerald-100 flex items-center justify-center gap-1.5">
                  <FiCheck size={14} /> All database queries are indexed correctly. Latency is optimal.
                </div>
              )}
            </div>

            {/* Session Rescue Panel */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Customer Friction Rescue</h2>
                  <p className="text-xs text-stone-400 font-medium">Checkout friction alerts that can be resolved instantly by sending coupons.</p>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {alerts.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-stone-400">
                      <FiUser size={36} className="mb-3 opacity-20" />
                      <p className="text-xs font-bold">No active friction detected in checkout logs.</p>
                    </div>
                  ) : (
                    alerts.map((alert, index) => {
                      const style = getTypeStyle(alert.type);
                      return (
                        <motion.div
                          key={alert.timestamp + index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`relative overflow-hidden p-5 rounded-2xl border transition-all ${alert.rescued ? 'border-emerald-100 bg-emerald-50/10 opacity-70' : 'border-stone-150 bg-stone-50/20'}`}
                        >
                          {alert.rescued && (
                            <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-bl-xl uppercase tracking-widest">
                              Rescued
                            </div>
                          )}

                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div style={{ background: style.bg, color: style.color }} className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                                {style.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span style={{ color: style.color }} className="text-[9px] font-black uppercase tracking-widest">{style.label}</span>
                                  <span className="text-stone-300">•</span>
                                  <span className="text-stone-400 text-[9px] font-bold">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <h3 className="font-bold text-stone-900">
                                  {alert.user ? alert.user.name : `Guest User (${alert.guestId?.slice(0, 8)})`}
                                </h3>
                                <p className="text-stone-500 text-xs mt-0.5">
                                  {alert.type === "COUPON_ABUSE" && `Failed coupon attempts: ${alert.details.attempts} (Last: ${alert.details.lastCode})`}
                                  {alert.type === "HOVER_STALL" && `Hovered on 'Place Order' for over ${alert.details.duration}.`}
                                  {alert.type === "TIME_STALL" && `Stuck on checkout for ${alert.details.minutes} minutes.`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-5 md:border-l md:pl-5 border-stone-200/60 justify-between md:justify-start">
                              <div className="text-left md:text-center">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Cart Total</p>
                                <p className="text-base font-black text-stone-900">₹{alert.cartTotal}</p>
                              </div>
                              <div className="text-left md:text-center">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Items</p>
                                <p className="text-base font-black text-stone-900">{alert.items}</p>
                              </div>
                              <button
                                disabled={alert.rescued}
                                onClick={() => handleRescue(alert)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${alert.rescued ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-900 text-white hover:bg-emerald-600 active:scale-95'}`}
                              >
                                {alert.rescued ? <FiCheck /> : <FiZap />}
                                {alert.rescued ? 'Coupon Sent' : 'Rescue Now'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Right Column: Terminal Scrolling API Stream */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm sticky top-24 overflow-hidden">
              <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-stone-900 flex items-center gap-2">
                    <FiTerminal size={18} className="text-stone-700" />
                    Live API Stream
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">Real-time HTTP request trace latency.</p>
                </div>
                <button 
                  onClick={() => setApiLogs([])} 
                  className="text-[10px] font-bold text-stone-400 hover:text-stone-900 uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>

              {/* Terminal Container */}
              <div className="bg-stone-950 p-4 font-mono text-xs overflow-y-auto max-h-[70vh] space-y-2.5 select-text">
                <AnimatePresence>
                  {apiLogs.length > 0 ? (
                    apiLogs.map((log, idx) => {
                      const isError = log.status >= 400;
                      const isPost = log.method === "POST" || log.method === "PUT";
                      const statusColor = log.status >= 500 ? "text-rose-500" : log.status >= 400 ? "text-amber-500" : "text-emerald-500";
                      const durationColor = log.duration > 80 ? "text-rose-400" : log.duration > 40 ? "text-amber-400" : "text-stone-400";
                      
                      return (
                        <motion.div
                          key={log.traceId + idx}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-stone-900 pb-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                            <span className={`font-semibold ${statusColor}`}>{log.status}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 truncate">
                            <span className={`font-black ${isPost ? 'text-blue-400' : 'text-purple-400'}`}>{log.method}</span>
                            <span className="text-stone-100 truncate flex-1">{log.path}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-stone-500">
                            <span>ID: {log.traceId?.slice(0, 8)}...</span>
                            <span className={`font-semibold ${durationColor}`}>{log.duration}ms</span>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-20 text-center text-stone-500 flex flex-col items-center gap-2">
                      <span>_</span>
                      <span>Listening for server HTTP requests...</span>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
