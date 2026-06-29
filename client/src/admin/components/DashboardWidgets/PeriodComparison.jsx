import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GitCompare, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

export default function PeriodComparison() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/api/admin/dashboard/comparison?days=${days}`);
        setData(data);
      } catch (err) {
        console.error("Comparison fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [days]);

  const formatMoney = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
  };

  const ChangeIndicator = ({ value }) => {
    const isUp = value > 0;
    const isFlat = value === 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
        isFlat ? "text-slate-400" : isUp ? "text-emerald-400" : "text-red-400"
      }`}>
        {isFlat ? <Minus size={10} /> : isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {isFlat ? "0%" : `${isUp ? "+" : ""}${value}%`}
      </span>
    );
  };

  const metrics = data ? [
    { label: "Revenue", current: formatMoney(data.current.revenue), previous: formatMoney(data.previous.revenue), change: data.changes.revenue },
    { label: "Orders", current: data.current.orders, previous: data.previous.orders, change: data.changes.orders },
    { label: "AOV", current: formatMoney(data.current.avgOrderValue), previous: formatMoney(data.previous.avgOrderValue), change: data.changes.avgOrderValue },
    { label: "Customers", current: data.current.uniqueCustomers, previous: data.previous.uniqueCustomers, change: data.changes.uniqueCustomers },
  ] : [];

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(168, 85, 247, 0.2)",
        boxShadow: "0 0 30px rgba(168, 85, 247, 0.05)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(168, 85, 247, 0.15)" }}>
              <GitCompare size={16} className="text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Period Comparison</h3>
          </div>
          <div className="flex gap-1">
            {[{ label: "7D", value: 7 }, { label: "14D", value: 14 }, { label: "30D", value: 30 }].map(p => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  days === p.value
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                className="bg-white/5 rounded-xl p-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{metric.label}</span>
                  <ChangeIndicator value={metric.change} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{metric.previous}</span>
                  <ArrowRight size={10} className="text-slate-600" />
                  <span className="text-white text-sm font-bold">{metric.current}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
