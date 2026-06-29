import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Users, ShoppingCart, Plus, X } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

const GOAL_ICONS = {
  revenue: <TrendingUp size={16} />,
  orders: <ShoppingCart size={16} />,
  customers: <Users size={16} />,
};

const GOAL_COLORS = {
  revenue: { ring: "#10b981", bg: "rgba(16, 185, 129, 0.1)", text: "text-emerald-400" },
  orders: { ring: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", text: "text-blue-400" },
  customers: { ring: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", text: "text-amber-400" },
};

function CircularGauge({ percentage, color, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      {/* Progress ring */}
      <motion.circle
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function GoalGauge() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "revenue", target: "", period: "monthly" });
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const { data } = await axios.get(`${API}/api/admin/dashboard/goals`);
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const now = new Date();
      let startDate = new Date(now);
      let endDate = new Date(now);

      switch (form.period) {
        case "daily": endDate.setDate(endDate.getDate() + 1); break;
        case "weekly": startDate.setDate(startDate.getDate() - startDate.getDay()); endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 7); break;
        case "monthly": startDate.setDate(1); endDate.setMonth(endDate.getMonth() + 1); endDate.setDate(0); break;
        case "quarterly": { const q = Math.floor(now.getMonth() / 3); startDate.setMonth(q * 3, 1); endDate.setMonth(q * 3 + 3, 0); break; }
      }

      await axios.post(`${API}/api/admin/dashboard/goals`, {
        ...form,
        target: Number(form.target),
        startDate,
        endDate,
      });
      setShowForm(false);
      setForm({ name: "", type: "revenue", target: "", period: "monthly" });
      fetchGoals();
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  const formatValue = (val, type) => {
    if (type === "revenue") {
      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
      return `₹${val}`;
    }
    return val.toString();
  };

  return (
    <motion.div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        boxShadow: "0 0 30px rgba(16, 185, 129, 0.05)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(16, 185, 129, 0.15)" }}>
              <Target size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Goal Tracking</h3>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
          >
            {showForm ? <X size={14} className="text-slate-400" /> : <Plus size={14} className="text-slate-400" />}
          </button>
        </div>

        {/* Create Goal Form */}
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreate}
            className="mb-4 space-y-2 bg-white/5 rounded-xl p-3"
          >
            <input type="text" placeholder="Goal name..." value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none border border-white/10 focus:border-emerald-500/50" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none border border-white/10">
                <option value="revenue">Revenue</option>
                <option value="orders">Orders</option>
                <option value="customers">Customers</option>
              </select>
              <select value={form.period} onChange={e => setForm({...form, period: e.target.value})}
                className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none border border-white/10">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <input type="number" placeholder="Target value..." value={form.target} onChange={e => setForm({...form, target: e.target.value})}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none border border-white/10 focus:border-emerald-500/50" required />
            <button type="submit" className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg py-2 text-xs font-semibold transition-colors">
              Create Goal
            </button>
          </motion.form>
        )}

        {/* Goals List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No active goals. Click + to set a target.
          </div>
        ) : (
          <div className="space-y-3">
            {goals.slice(0, 4).map((goal, i) => {
              const colors = GOAL_COLORS[goal.type] || GOAL_COLORS.revenue;
              return (
                <motion.div
                  key={goal._id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: colors.bg }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="relative">
                    <CircularGauge percentage={goal.progressPct} color={colors.ring} size={52} strokeWidth={4} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-[10px] font-bold ${colors.text}`}>{goal.progressPct}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{goal.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatValue(goal.current, goal.type)} / {formatValue(goal.target, goal.type)}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{goal.period}</p>
                  </div>
                  {goal.isAchieved && (
                    <span className="text-base">🎯</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
