import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import RevenueTicker from "./components/DashboardWidgets/RevenueTicker";
import AIBriefing from "./components/DashboardWidgets/AIBriefing";
import GoalGauge from "./components/DashboardWidgets/GoalGauge";
import PLDrilldown from "./components/DashboardWidgets/PLDrilldown";
import CohortChart from "./components/DashboardWidgets/CohortChart";
import PeriodComparison from "./components/DashboardWidgets/PeriodComparison";
import CommandPalette from "./components/DashboardWidgets/CommandPalette";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const CommandCenterSkeleton = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="flex justify-between items-center">
      <div className="h-7 w-48 bg-stone-200 rounded-xl" />
      <div className="h-10 w-28 bg-stone-200 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-48 bg-stone-100 rounded-3xl border border-stone-200/40" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-64 bg-stone-100 rounded-3xl border border-stone-200/40" />
      ))}
    </div>
  </div>
);

export default function AdminCommandCenter() {
  const [stats, setStats] = useState({ todayRevenue: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
      toast.loading("Refreshing telemetry...", { id: "telemetry-refresh" });
    }
    try {
      const { data } = await axios.get("/api/admin", { params: { range: "6months" }, withCredentials: true });
      if (!isMounted.current) return;
      setStats(data?.stats || {});
      setLoading(false);
      if (isManual) toast.success("Telemetry updated", { id: "telemetry-refresh" });
    } catch (err) {
      if (!isMounted.current) return;
      setLoading(false);
      if (isManual) toast.error("Failed to update telemetry", { id: "telemetry-refresh" });
    } finally {
      if (isMounted.current && isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <CommandCenterSkeleton />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:px-6 md:py-2 font-sans"
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Top Bar with Command Palette */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-stone-850 tracking-tight">Command Center</h2>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-2xl transition-all disabled:opacity-50 shadow-sm cursor-pointer flex items-center justify-center"
            >
              <FiRefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <RevenueTicker
            revenue={stats.todayRevenue || 0}
            previousRevenue={stats.totalRevenue ? Math.round(stats.totalRevenue / 30) : 0}
            label="Today's Revenue"
          />
          <AIBriefing />
          <GoalGauge />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          <PLDrilldown />
          <CohortChart />
          <PeriodComparison />
        </div>
      </div>
    </motion.div>
  );
}
