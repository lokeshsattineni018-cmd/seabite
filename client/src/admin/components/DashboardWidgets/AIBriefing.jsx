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
      <div className="rounded-2xl p-6 animate-pulse bg-stone-50 border border-stone-200 shadow-sm">
        <div className="h-4 w-32 bg-stone-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-stone-200 rounded" />
          <div className="h-3 w-3/4 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!briefing || typeof briefing !== "object" || !briefing.todayStats) return null;

  const iconMap = {
    "⚠️": <AlertTriangle size={14} className="text-amber-600" />,
    "📦": <Package size={14} className="text-blue-600" />,
    "📉": <TrendingUp size={14} className="text-red-650 rotate-180" />,
    "📈": <TrendingUp size={14} className="text-emerald-650" />,
  };

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-[#fbfbfa] to-white border border-stone-200 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* AI Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 border border-violet-100">
            <Brain size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1">
              AI Daily Briefing
              <Sparkles size={12} className="text-violet-500" />
            </h3>
            <p className="text-[10px] text-stone-400">
              {new Date(briefing.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Greeting & Summary */}
        <div className="mb-4">
          <p className="text-sm text-stone-700 leading-relaxed">
            <span className="text-violet-750 font-bold">{briefing.greeting}!</span>{" "}
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
            <div key={i} className={`rounded-xl px-3 py-2 border ${stat.warn ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-100"}`}>
              <div className="flex items-center gap-1 text-stone-500 text-[10px] mb-1">
                {stat.icon} {stat.label}
              </div>
              <span className={`text-sm font-bold ${stat.warn ? "text-amber-700" : "text-stone-850"}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Top Selling */}
        {briefing.topSelling?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">🔥 Top Sellers Today</p>
            <div className="space-y-1">
              {briefing.topSelling.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 truncate">{i + 1}. {p.name}</span>
                  <span className="text-violet-700 font-mono font-bold">{p.qty} sold</span>
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
                className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs border"
                style={{ background: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.2)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <AlertTriangle size={12} className="text-amber-600 mt-0.5 shrink-0" />
                <span className="text-stone-700">{alert.replace(/^[^\s]+\s/, "")}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
