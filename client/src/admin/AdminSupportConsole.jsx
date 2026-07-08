import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiHeadphones, FiAlertTriangle, FiCheckCircle, FiClock,
  FiMessageSquare, FiStar, FiUser, FiRefreshCw, FiActivity,
  FiTrendingUp, FiPieChart, FiZap
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

export default function AdminSupportConsole() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); // overview, agents, escalations, chats

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/support/console-overview", { withCredentials: true });
      setData(res.data);
    } catch {
      toast.error("Failed to load support data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return <SeaBiteLoader />;

  const { queueStats, agents, escalations, csat, issueBreakdown, recentChats } = data;

  const maxIssueCount = Math.max(...issueBreakdown.map(i => i.count), 1);
  const barColors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-orange-500"];

  return (
    <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen font-sans">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200/50 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight">Support Console</h1>
          <p className="text-sm text-stone-500 font-medium mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Real-time support operations · Auto-refreshes every 20s
          </p>
        </div>
        <button onClick={() => { setLoading(true); fetchData(); }} className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </motion.div>

      {/* Queue KPI Strip */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Pending", value: queueStats.pending, icon: <FiClock size={14} />, color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "Processing", value: queueStats.processing, icon: <FiActivity size={14} />, color: "text-blue-600 bg-blue-50 border-blue-200" },
          { label: "Escalated", value: queueStats.escalated, icon: <FiAlertTriangle size={14} />, color: queueStats.escalated > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-stone-500 bg-stone-50 border-stone-200" },
          { label: "Resolved", value: queueStats.resolved, icon: <FiCheckCircle size={14} />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { label: "Cancelled", value: queueStats.cancelled, icon: <FiZap size={14} />, color: "text-stone-500 bg-stone-50 border-stone-200" },
          { label: "CSAT Score", value: `${csat.average}/5`, icon: <FiStar size={14} />, color: csat.average >= 4 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-rose-600 bg-rose-50 border-rose-200" },
        ].map((k, i) => (
          <div key={i} className={`p-3.5 rounded-2xl border ${k.color} flex flex-col gap-1`}>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest opacity-70">{k.icon} {k.label}</div>
            <p className="text-xl font-bold">{k.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Escalation Alert Banner */}
      {escalations.length > 0 && (
        <motion.div variants={fadeUp} custom={2} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle className="text-rose-600" size={18} />
            <span className="text-xs font-bold text-rose-700 uppercase tracking-widest">⚠️ Escalated Tickets ({escalations.length})</span>
          </div>
          <div className="space-y-2">
            {escalations.slice(0, 3).map((e, i) => (
              <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-100 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-rose-700">#{e.orderId}</span>
                  <span className="text-stone-700 font-medium">{e.customer}</span>
                  <span className="text-stone-400">{e.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  {e.ageMinutes != null && (
                    <span className={`font-bold ${e.ageMinutes > 60 ? "text-rose-600" : "text-amber-600"}`}>
                      {e.ageMinutes > 60 ? `${Math.floor(e.ageMinutes / 60)}h ${e.ageMinutes % 60}m ago` : `${e.ageMinutes}m ago`}
                    </span>
                  )}
                  <span className="font-bold text-rose-600">{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div variants={fadeUp} custom={3} className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 w-fit">
        {[
          { key: "overview", label: "Overview", icon: <FiPieChart size={13} /> },
          { key: "agents", label: "Agent Activity", icon: <FiHeadphones size={13} /> },
          { key: "escalations", label: "Escalations", icon: <FiAlertTriangle size={13} /> },
          { key: "chats", label: "Chat Stream", icon: <FiMessageSquare size={13} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${tab === t.key ? "bg-stone-900 text-white shadow-md" : "text-stone-500 hover:text-stone-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      {tab === "overview" && (
        <motion.div variants={fadeUp} custom={4} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSAT Distribution */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-5 flex items-center gap-2"><FiStar size={12} /> CSAT Distribution</h3>
            <div className="flex items-end gap-6 h-32">
              {csat.distribution.map((d, i) => {
                const maxCount = Math.max(...csat.distribution.map(x => x.count), 1);
                const height = d.count > 0 ? Math.max((d.count / maxCount) * 100, 8) : 4;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-500">{d.count}</span>
                    <div className={`w-full rounded-t-lg ${d.star >= 4 ? "bg-emerald-400" : d.star === 3 ? "bg-amber-400" : "bg-rose-400"}`} style={{ height: `${height}%` }} />
                    <span className="text-xs font-bold text-stone-600 flex items-center gap-0.5">
                      {d.star} <FiStar size={10} className="text-amber-400" />
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs text-stone-400">Average CSAT</span>
              <span className="text-2xl font-bold text-stone-900">{csat.average} <span className="text-xs text-stone-400 font-normal">/ 5</span></span>
            </div>
          </div>

          {/* Issue Breakdown */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-5 flex items-center gap-2"><FiTrendingUp size={12} /> Issue Breakdown</h3>
            <div className="space-y-3">
              {issueBreakdown.map((iss, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-stone-600 w-28 truncate">{iss.label}</span>
                  <div className="flex-1 h-6 bg-stone-50 rounded-lg overflow-hidden border border-stone-100">
                    <div className={`h-full ${barColors[i % barColors.length]} rounded-lg transition-all duration-700`} style={{ width: `${(iss.count / maxIssueCount) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-stone-700 w-8 text-right">{iss.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "agents" && (
        <motion.div variants={fadeUp} custom={4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(a => (
            <div key={a._id} className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${a.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"} flex items-center justify-center font-bold text-sm`}>
                    {a.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 text-sm">{a.name}</p>
                    <p className="text-[10px] text-stone-400">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${a.isOnline ? "bg-emerald-500 animate-pulse" : "bg-stone-300"}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${a.isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-50 text-stone-500 border-stone-200"}`}>
                    {a.isOnline ? "Active" : "Away"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Role</p>
                  <p className="text-sm font-bold text-stone-700 capitalize">{a.role}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Messages Today</p>
                  <p className="text-lg font-bold text-blue-700">{a.messagesToday}</p>
                </div>
              </div>

              {a.lastActive && (
                <div className="mt-3 text-[10px] text-stone-400 flex items-center gap-1">
                  <FiClock size={10} />
                  Last active: {new Date(a.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          ))}
          {agents.length === 0 && (
            <div className="col-span-3 text-center py-20 text-stone-400 text-sm">No support agents found.</div>
          )}
        </motion.div>
      )}

      {tab === "escalations" && (
        <motion.div variants={fadeUp} custom={4}>
          {escalations.length === 0 ? (
            <div className="text-center py-20 text-emerald-600 text-sm bg-emerald-50/50 rounded-2xl border border-emerald-200">
              <FiCheckCircle size={32} className="mx-auto mb-3 opacity-50" />
              No escalated tickets! All clear. ✨
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Order</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Customer</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Phone</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Category</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3.5 text-left text-[9px] font-bold text-stone-400 uppercase tracking-widest">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {escalations.map(e => (
                    <tr key={e._id} className="border-b border-stone-50 hover:bg-rose-50/30 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono font-bold text-rose-600">#{e.orderId}</td>
                      <td className="px-5 py-3 text-xs font-bold text-stone-900">{e.customer}</td>
                      <td className="px-5 py-3 text-xs text-stone-500">{e.phone || "—"}</td>
                      <td className="px-5 py-3"><span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600">{e.category}</span></td>
                      <td className="px-5 py-3"><span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">{e.status}</span></td>
                      <td className="px-5 py-3 text-xs font-bold text-rose-600">
                        {e.ageMinutes != null ? (e.ageMinutes > 60 ? `${Math.floor(e.ageMinutes / 60)}h ${e.ageMinutes % 60}m` : `${e.ageMinutes}m`) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {tab === "chats" && (
        <motion.div variants={fadeUp} custom={4} className="space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Recent Chat Messages (last 30)</p>
          {recentChats.length === 0 ? (
            <div className="text-center py-20 text-stone-400 text-sm bg-stone-50 rounded-2xl border border-stone-200">No chat messages yet.</div>
          ) : (
            <div className="space-y-2">
              {recentChats.map(c => (
                <div key={c._id} className="flex items-start gap-3 p-3 bg-white border border-stone-100 rounded-xl hover:bg-stone-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    c.senderRole === "user" ? "bg-blue-100 text-blue-700" :
                    c.senderRole === "support" ? "bg-emerald-100 text-emerald-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {c.senderRole === "user" ? <FiUser size={12} /> : c.senderRole === "support" ? <FiHeadphones size={12} /> : "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        c.senderRole === "user" ? "bg-blue-50 text-blue-600" :
                        c.senderRole === "support" ? "bg-emerald-50 text-emerald-600" :
                        "bg-purple-50 text-purple-600"
                      }`}>{c.senderRole}</span>
                      <span className="text-[9px] text-stone-300">→</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        c.recipientRole === "user" ? "bg-blue-50 text-blue-600" :
                        c.recipientRole === "support" ? "bg-emerald-50 text-emerald-600" :
                        "bg-purple-50 text-purple-600"
                      }`}>{c.recipientRole}</span>
                      <span className="text-[9px] text-stone-300 ml-auto font-mono">{new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                    <p className="text-xs text-stone-700 truncate">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
