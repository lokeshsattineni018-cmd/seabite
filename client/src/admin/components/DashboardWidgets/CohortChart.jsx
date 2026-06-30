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
        setCohorts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Cohort fetch error:", err);
        setCohorts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCohorts();
  }, []);

  const getColor = (pct) => {
    if (pct >= 70) return "bg-emerald-600";
    if (pct >= 50) return "bg-emerald-500";
    if (pct >= 30) return "bg-teal-550";
    if (pct >= 15) return "bg-cyan-500";
    if (pct >= 5) return "bg-stone-200";
    return "bg-stone-100";
  };

  const getTextColor = (pct) => {
    if (pct >= 15) return "text-white";
    return "text-stone-600";
  };

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-[#fbfbfa] to-white border border-stone-200 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-50 border border-cyan-100">
            <Users size={16} className="text-cyan-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Cohort Retention</h3>
            <p className="text-[10px] text-stone-500 font-medium">Customer retention by signup month</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-stone-50 border border-stone-100 rounded animate-pulse" />)}
          </div>
        ) : cohorts.length === 0 ? (
          <p className="text-stone-400 text-xs text-center py-4">No cohort data available yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-stone-500 font-bold pb-2 pr-2 whitespace-nowrap">Month</th>
                  <th className="text-center text-stone-500 font-bold pb-2 px-1 whitespace-nowrap">Users</th>
                  {Array.from({ length: 6 }, (_, i) => (
                    <th key={i} className="text-center text-stone-500 font-bold pb-2 px-1 whitespace-nowrap">
                      M{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort, ci) => (
                  <tr key={ci}>
                    <td className="text-stone-855 font-mono pr-2 py-1 whitespace-nowrap">{cohort.month}</td>
                    <td className="text-center text-stone-500 px-1 py-1">{cohort.signups}</td>
                    {Array.from({ length: 6 }, (_, ri) => {
                      const ret = cohort.retention?.[ri];
                      if (!ret) {
                        return <td key={ri} className="px-1 py-1"><div className="w-10 h-7 rounded bg-stone-50 border border-stone-100/60 mx-auto" /></td>;
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
            <div className="flex items-center gap-2 mt-3 text-[10px] text-stone-400 font-medium">
              <span>Low</span>
              <div className="flex gap-0.5">
                {["bg-stone-100", "bg-stone-200", "bg-cyan-500", "bg-teal-500", "bg-emerald-500", "bg-emerald-600"].map((c, i) => (
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
