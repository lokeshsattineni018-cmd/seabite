import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Zap,
  Play,
  Mail,
  MessageSquare,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  RefreshCw,
  Plus,
  ToggleLeft,
  ToggleRight,
  UserCheck
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

const ACTION_ICONS = {
  send_email: <Mail size={14} className="text-blue-400" />,
  send_whatsapp: <MessageSquare size={14} className="text-emerald-400" />,
  send_push: <Zap size={14} className="text-amber-400" />,
  deduct_inventory: <Zap size={14} className="text-purple-400" />,
  notify_warehouse: <Shield size={14} className="text-rose-400" />,
  award_loyalty_points: <UserCheck size={14} className="text-yellow-400" />,
  request_review: <MessageSquare size={14} className="text-cyan-400" />,
  send_nps_survey: <Zap size={14} className="text-violet-400" />,
  update_delivery_status: <Zap size={14} className="text-sky-400" />,
  apply_coupon: <Zap size={14} className="text-orange-400" />,
  notify_admin: <AlertCircle size={14} className="text-red-400" />,
  create_reorder_suggestion: <Zap size={14} className="text-teal-400" />,
  create_ticket: <AlertCircle size={14} className="text-pink-400" />,
};

export default function AdminWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wfRes, logRes] = await Promise.all([
        axios.get(`${API}/api/admin/workflows`, { withCredentials: true }),
        axios.get(`${API}/api/admin/workflows/logs/recent`, { withCredentials: true }),
      ]);
      setWorkflows(wfRes.data.workflows || []);
      setLogs(logRes.data.logs || []);
    } catch (err) {
      toast.error("Failed to load workflow data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = (id) => {
    setWorkflows(prev =>
      prev.map(w => (w.id === id ? { ...w, isActive: !w.isActive } : w))
    );
    toast.success("Workflow settings updated locally (Simulation)");
  };

  const handleRunWorkflow = async (id) => {
    toast.success(`Workflow "${id}" manually queued for execution!`);
  };

  const filteredWorkflows = activeTab === "all"
    ? workflows
    : workflows.filter(w => w.category === activeTab);

  const categories = ["all", ...new Set(workflows.map(w => w.category))];

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
            <Zap className="text-amber-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Automated Workflows
            </h1>
            <p className="text-xs text-slate-400">Configure event-driven triggers, notifications, and operations</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Engine
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left/Middle Column: Workflows */}
        <div className="xl:col-span-2 space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === cat
                    ? "bg-amber-500 text-slate-900 font-bold"
                    : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/30 p-5 space-y-4 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {wf.name}
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-800 text-slate-400 font-semibold uppercase">
                          {wf.category}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Trigger: {wf.trigger.event} {wf.trigger.condition ? `(${JSON.stringify(wf.trigger.condition)})` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRunWorkflow(wf.id)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                        title="Manual Test Run"
                      >
                        <Play size={14} />
                      </button>
                      <button onClick={() => handleToggleActive(wf.id)}>
                        {wf.isActive ? (
                          <ToggleRight size={28} className="text-emerald-500 cursor-pointer" />
                        ) : (
                          <ToggleLeft size={28} className="text-slate-600 cursor-pointer" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Pipeline */}
                  <div className="flex items-center flex-wrap gap-2 pt-2">
                    {wf.actions.map((act, actIdx) => (
                      <React.Fragment key={actIdx}>
                        {actIdx > 0 && <ArrowRight size={12} className="text-slate-700" />}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-semibold">
                          {ACTION_ICONS[act.type] || <Zap size={10} />}
                          <span className="text-slate-300 capitalize">{act.type.replace(/_/g, " ")}</span>
                          {act.delay > 0 && (
                            <span className="text-slate-500 font-mono flex items-center gap-0.5">
                              <Clock size={8} /> {act.delay}h
                            </span>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Execution Logs */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Engine Execution Logs</h3>
          <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-4 h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs">
                  No execution logs recorded in the last 24h.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-bold text-amber-400 font-mono">Order #{log.orderId}</span>
                      <span>{new Date(log.executedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 font-semibold">{log.workflowName}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      {log.action}: {log.details}
                    </p>
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-white/5">
                      <span className="text-[9px] text-slate-500 capitalize">Status: {log.orderStatus}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${log.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {log.success ? "SUCCESS" : "FAILED"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
