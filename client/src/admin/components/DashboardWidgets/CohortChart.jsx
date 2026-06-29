import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

export default function CohortChart() {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const { data } = await axios.get(`${API}/api/admin/dashboard/cohorts?months=6`);
        setCohorts(data);
      } catch (err) {
        console.error("Cohort fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCohorts();
  }, []);

  const getColor = (pct) => {
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 50) return "bg-emerald-600";
    if (pct >= 30) return "bg-teal-700";
    if (pct >= 15) return "bg-cyan-800";
    if (pct >= 5) return "bg-slate-700";
    return "bg-slate-800";
  };

  const getTextColor = (pct) => {
    if (pct >= 30) return "text-white";
    return "text-slate-400";
  };

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(6, 182, 212, 0.2)",
        boxShadow: "0 0 30px rgba(6, 182, 212, 0.05)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(6, 182, 212, 0.15)" }}>
            <Users size={16} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Cohort Retention</h3>
            <p className="text-[10px] text-slate-500">Customer retention by signup month</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : cohorts.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4">No cohort data available yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-slate-500 font-medium pb-2 pr-2 whitespace-nowrap">Month</th>
                  <th className="text-center text-slate-500 font-medium pb-2 px-1 whitespace-nowrap">Users</th>
                  {Array.from({ length: 6 }, (_, i) => (
                    <th key={i} className="text-center text-slate-500 font-medium pb-2 px-1 whitespace-nowrap">
                      M{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort, ci) => (
                  <tr key={ci}>
                    <td className="text-slate-300 font-mono pr-2 py-1 whitespace-nowrap">{cohort.month}</td>
                    <td className="text-center text-slate-400 px-1 py-1">{cohort.signups}</td>
                    {Array.from({ length: 6 }, (_, ri) => {
                      const ret = cohort.retention?.[ri];
                      if (!ret) {
                        return <td key={ri} className="px-1 py-1"><div className="w-10 h-7 rounded bg-slate-800/50 mx-auto" /></td>;
                      }
                      return (
                        <td key={ri} className="px-1 py-1">
                          <motion.div
                            className={`w-10 h-7 rounded flex items-center justify-center text-[10px] font-bold mx-auto ${getColor(ret.retentionPct)} ${getTextColor(ret.retentionPct)}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: ci * 0.05 + ri * 0.03 }}
                            title={`${ret.activeUsers} of ${cohort.signups} users (${ret.retentionPct}%)`}
                          >
                            {ret.retentionPct}%
                          </motion.div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
              <span>Low</span>
              <div className="flex gap-0.5">
                {["bg-slate-800", "bg-slate-700", "bg-cyan-800", "bg-teal-700", "bg-emerald-600", "bg-emerald-500"].map((c, i) => (
                  <div key={i} className={`w-4 h-3 rounded-sm ${c}`} />
                ))}
              </div>
              <span>High</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
