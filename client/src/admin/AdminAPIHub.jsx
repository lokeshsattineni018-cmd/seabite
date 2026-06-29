import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Code,
  Key,
  Plus,
  RefreshCw,
  Copy,
  Eye,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminAPIHub() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/api-hub/keys`, { withCredentials: true });
      setKeys(data || []);
    } catch (err) {
      toast.error("Failed to load developer keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/15 border border-violet-500/30">
            <Code className="text-violet-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">API Hub & Integrations</h1>
            <p className="text-xs text-slate-400">Generate developer API web tokens, configure webhook endpoints, and sync data catalogs</p>
          </div>
        </div>
        <button
          onClick={fetchKeys}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Webhooks
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Code size={48} className="text-violet-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading credential keys...</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Active Integration Webhooks</h3>
          <div className="space-y-3">
            {keys.map(key => (
              <div key={key.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">{key.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{key.value}</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
