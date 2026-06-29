import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
  Server,
  Zap,
  HardDrive
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminDevOps() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/devops/metrics`, { withCredentials: true });
      setMetrics(data);
    } catch (err) {
      toast.error("Failed to load DevOps server metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
            <Terminal className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DevOps & Server Telemetry</h1>
            <p className="text-xs text-slate-400">Monitor Node.js process uptimes, CPU consumption loads, and memory footprints</p>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Hardware
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Cpu size={48} className="text-emerald-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading server telemetry stats...</p>
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <Activity className="text-emerald-400" size={24} />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Node.js Process Uptime</span>
              <span className="text-base font-bold text-white mt-1 block">{(metrics.uptime / 60).toFixed(2)} minutes</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <HardDrive className="text-emerald-400" size={24} />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">RSS Resident Memory</span>
              <span className="text-base font-bold text-white mt-1 block">{(metrics.memoryUsage?.rss / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <Zap className="text-emerald-400" size={24} />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Relative CPU Load</span>
              <span className="text-base font-bold text-white mt-1 block">{(metrics.cpuUsage * 100).toFixed(1)}% Usage</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
