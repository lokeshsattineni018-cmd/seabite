import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Package, Users, Sparkles } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

export default function AIBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const { data } = await axios.get(`${API}/api/admin/dashboard/briefing`);
        setBriefing(data);
      } catch (err) {
        console.error("Failed to fetch briefing:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
    const interval = setInterval(fetchBriefing, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
        <div className="h-4 w-32 bg-slate-700 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-700 rounded" />
          <div className="h-3 w-3/4 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (!briefing || typeof briefing !== "object" || !briefing.todayStats) return null;

  const iconMap = {
    "⚠️": <AlertTriangle size={14} className="text-amber-400" />,
    "📦": <Package size={14} className="text-blue-400" />,
    "📉": <TrendingUp size={14} className="text-red-400 rotate-180" />,
    "📈": <TrendingUp size={14} className="text-emerald-400" />,
  };

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a0f2e 50%, #0f172a 100%)",
        border: "1px solid rgba(139, 92, 246, 0.25)",
        boxShadow: "0 0 30px rgba(139, 92, 246, 0.08)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* AI Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10"
        style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(139, 92, 246, 0.15)" }}>
            <Brain size={16} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1">
              AI Daily Briefing
              <Sparkles size={12} className="text-violet-400" />
            </h3>
            <p className="text-[10px] text-slate-500">
              {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Greeting & Summary */}
        <div className="mb-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-violet-400 font-semibold">{briefing.greeting}!</span>{" "}
            {briefing.summary}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Orders", value: briefing.todayStats.orders, icon: <Package size={12} /> },
            { label: "AOV", value: `₹${briefing.todayStats.avgOrderValue}`, icon: <TrendingUp size={12} /> },
            { label: "New Users", value: briefing.todayStats.newCustomers, icon: <Users size={12} /> },
            { label: "Pending", value: briefing.pendingOrders, icon: <AlertTriangle size={12} />, warn: briefing.pendingOrders > 10 },
          ].map((stat, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 ${stat.warn ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5"}`}>
              <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-1">
                {stat.icon} {stat.label}
              </div>
              <span className={`text-sm font-bold ${stat.warn ? "text-amber-400" : "text-white"}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Top Selling */}
        {briefing.topSelling?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">🔥 Top Sellers Today</p>
            <div className="space-y-1">
              {briefing.topSelling.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 truncate">{i + 1}. {p.name}</span>
                  <span className="text-violet-400 font-mono font-semibold">{p.qty} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {briefing.alerts?.length > 0 && (
          <div className="space-y-1.5">
            {briefing.alerts.map((alert, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                style={{ background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.15)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">{alert.replace(/^[^\s]+\s/, "")}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
