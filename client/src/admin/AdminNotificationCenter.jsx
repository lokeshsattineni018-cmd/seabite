import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Bell,
  Send,
  Mail,
  MessageSquare,
  Zap,
  Plus,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminNotificationCenter() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlastForm, setShowBlastForm] = useState(false);
  const [blastForm, setBlastForm] = useState({
    channel: "push",
    templateId: "order_confirmation",
    customText: ""
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/admin/notification-center/templates`, { withCredentials: true });
      setTemplates(data || []);
    } catch (err) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleBlast = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/admin/notification-center/blast`, blastForm, { withCredentials: true });
      toast.success("Notification blast sent successfully!");
      setShowBlastForm(false);
    } catch (err) {
      toast.error("Blast execution failed");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500/15 border border-sky-500/30">
            <Bell className="text-sky-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Notification Command Center</h1>
            <p className="text-xs text-slate-400">Trigger multi-channel push, email, SMS and WhatsApp alerts to user segments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBlastForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Trigger Blast
          </button>
        </div>
      </div>

      {showBlastForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trigger Notification Blast</h3>
            <form onSubmit={handleBlast} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Channel</label>
                <select
                  value={blastForm.channel}
                  onChange={e => setBlastForm({ ...blastForm, channel: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="push">Push Notification</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp Alert</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Template</label>
                <select
                  value={blastForm.templateId}
                  onChange={e => setBlastForm({ ...blastForm, templateId: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Custom Alert Content (Optional)</label>
                <textarea
                  value={blastForm.customText}
                  onChange={e => setBlastForm({ ...blastForm, customText: e.target.value })}
                  placeholder="Type message content overlay..."
                  rows={3}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-sky-500/50 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowBlastForm(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Blast Message
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Bell size={48} className="text-sky-500 animate-pulse" />
          <p className="text-xs text-slate-400">Loading templates...</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Notification templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map(t => (
              <div key={t.id} className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <Mail size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                </div>
                <p className="text-[10px] text-slate-500">Template Key: {t.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
