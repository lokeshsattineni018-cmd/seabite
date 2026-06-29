import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Shield,
  Lock,
  Eye,
  RefreshCw,
  Clock,
  Terminal,
  Activity
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminSecurity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/security/audit-logs`, { withCredentials: true });
      setLogs(data || []);
    } catch (err) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/15 border border-rose-500/30">
            <Shield className="text-rose-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit & compliance</h1>
            <p className="text-xs text-slate-400">Review server system access telemetry logs, login sessions, and IP whitelists</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Log Telemetry
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Shield size={48} className="text-rose-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading audit records...</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Admin Audit Trail Journal</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-bold uppercase">
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3 px-4">Operator</th>
                  <th className="pb-3 px-4">IP Address</th>
                  <th className="pb-3 pl-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                    <td className="py-3 pr-4 font-bold text-white">{log.action}</td>
                    <td className="py-3 px-4 text-slate-350">{log.user}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ip}</td>
                    <td className="py-3 pl-4 text-right text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
