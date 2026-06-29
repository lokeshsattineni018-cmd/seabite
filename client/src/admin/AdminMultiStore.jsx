import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Globe,
  Plus,
  RefreshCw,
  Edit,
  Save,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminMultiStore() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/multi-store/stores`, { withCredentials: true });
      setStores(data || []);
    } catch (err) {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500/15 border border-sky-500/30">
            <Globe className="text-sky-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Store Administration</h1>
            <p className="text-xs text-slate-400">Deploy store instances, configure custom DNS routes, domains and isolate database schemas</p>
          </div>
        </div>
        <button
          onClick={fetchStores}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync DNS
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Globe size={48} className="text-sky-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading store instances...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map(store => (
            <div key={store.storeId} className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">{store.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{store.domain}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  store.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
                }`}>
                  {store.isActive ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
