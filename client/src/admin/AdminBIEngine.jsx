import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  PieChart as PieIcon
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminBIEngine() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/bi/custom-reports`, { withCredentials: true });
      setReport(data);
    } catch (err) {
      toast.error("Failed to load custom reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500/15 border border-sky-500/30">
            <BarChart3 className="text-sky-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Business Intelligence Engine</h1>
            <p className="text-xs text-slate-400">Model cohort metrics, custom order reports, product catalogs and export formats</p>
          </div>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Reports
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <BarChart3 size={48} className="text-sky-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading custom BI metrics...</p>
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Monthly Revenue</span>
            <span className="text-2xl font-bold text-white block">₹{report.totalRevenue.toLocaleString()}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Order Count</span>
            <span className="text-2xl font-bold text-white block">{report.orderCount} orders</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Order Value</span>
            <span className="text-2xl font-bold text-white block">₹{report.averageOrderValue}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
