import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiSend, FiUsers, FiMail, FiSmartphone, FiCalendar, FiClock,
  FiTrendingUp, FiActivity, FiLayers, FiTrash2, FiPlus, FiArrowRight, FiCheckCircle
} from "react-icons/fi";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminNotificationOrchestrator() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Composer Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [audienceCount, setAudienceCount] = useState(0);

  // Load past campaigns
  const fetchCampaigns = async () => {
    try {
      const { data } = await axios.get(`${API}/api/admin/campaigns`, { withCredentials: true });
      setCampaigns(data.campaigns || []);
    } catch (err) {
      toast.error("Failed to load campaigns catalog");
    } finally {
      setLoading(false);
    }
  };

  // Preview audience count based on parameters
  const updateAudiencePreview = async () => {
    try {
      const { data } = await axios.post(`${API}/api/admin/campaigns/audience/count`, {
        audienceType,
        audienceFilters: []
      }, { withCredentials: true });
      setAudienceCount(data.count || 0);
    } catch (e) {
      setAudienceCount(0);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    updateAudiencePreview();
  }, [audienceType]);

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Campaign name is required");
    
    setSubmitting(true);
    try {
      const channels = [];
      if (selectedChannel === "email") {
        channels.push({
          channel: "email",
          subject: emailSubject,
          body: emailBody
        });
      } else {
        channels.push({
          channel: "push",
          title: pushTitle,
          body: pushBody
        });
      }

      // Create Campaign
      const { data: campaign } = await axios.post(`${API}/api/admin/campaigns`, {
        name,
        description,
        type: selectedChannel,
        audienceType,
        channels
      }, { withCredentials: true });

      // Trigger Dispatch
      await axios.post(`${API}/api/admin/campaigns/${campaign._id}/send`, {}, { withCredentials: true });

      toast.success("Campaign Orchestrated & Dispatched successfully! 🚀");
      
      // Reset Form
      setName("");
      setDescription("");
      setEmailSubject("");
      setEmailBody("");
      setPushTitle("");
      setPushBody("");
      
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to launch campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm("Permanently delete this campaign record?")) return;
    try {
      await axios.delete(`${API}/api/admin/campaigns/${id}`, { withCredentials: true });
      toast.success("Campaign record removed");
      fetchCampaigns();
    } catch (e) {
      toast.error("Failed to delete record");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#0a1625] text-slate-100 font-sans">
      
      {/* Upper Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Campaign Composer Form (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FiSend className="text-[#5BBFB5]" /> Launch Dynamic Campaign
            </h2>
            
            <form onSubmit={handleLaunchCampaign} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CAMPAIGN NAME</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekend Vanjaram Feast Alert"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">AUDIENCE TARGET SEGMENT</label>
                  <select
                    value={audienceType}
                    onChange={e => setAudienceType(e.target.value)}
                    className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                  >
                    <option value="all">All Registered Customers ({audienceCount} active)</option>
                    <option value="segment">At-Risk Segment (RFM Alert)</option>
                    <option value="vip">VIP High-LTV Cohort</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="Internal notes/goal for this message blast..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                />
              </div>

              {/* Channel Selector Tabbed Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">DISPATCH CHANNEL</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("email")}
                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                      selectedChannel === "email"
                        ? "border-[#5BBFB5] bg-[#5BBFB5]/10 text-[#5BBFB5]"
                        : "border-slate-800 bg-[#0a1625] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <FiMail size={16} /> Email Blast
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel("push")}
                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                      selectedChannel === "push"
                        ? "border-[#5BBFB5] bg-[#5BBFB5]/10 text-[#5BBFB5]"
                        : "border-slate-800 bg-[#0a1625] text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <FiSmartphone size={16} /> Web Push Notification
                  </button>
                </div>
              </div>

              {/* Channel Specific Template Inputs */}
              <AnimatePresence mode="wait">
                {selectedChannel === "email" ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">EMAIL SUBJECT</label>
                      <input
                        type="text"
                        placeholder="Subject Line... Use {{customer_name}} to personalize"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-400">EMAIL BODY HTML</label>
                        <span className="text-[10px] text-slate-500">Insert tag: <code>{"{{customer_name}}"}</code></span>
                      </div>
                      <textarea
                        rows={6}
                        placeholder="<h1>Hi {{customer_name}}</h1><p>Fresh catch is here! Shop now...</p>"
                        value={emailBody}
                        onChange={e => setEmailBody(e.target.value)}
                        className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#5BBFB5]"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="push"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 pt-2"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">PUSH TITLE</label>
                      <input
                        type="text"
                        placeholder="e.g. Fresh catch warning!"
                        value={pushTitle}
                        onChange={e => setPushTitle(e.target.value)}
                        className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">PUSH BODY MESSAGE</label>
                      <textarea
                        rows={3}
                        placeholder="Short click-worthy banner text alert..."
                        value={pushBody}
                        onChange={e => setPushBody(e.target.value)}
                        className="w-full bg-[#0a1625] border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#5BBFB5]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-[#5BBFB5] to-[#89C2D9] text-[#0a1625] font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:shadow-cyan-900/40"
              >
                {submitting ? "Dispatching Broadcast..." : "Launch Campaign Broadcast Now 🚀"}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Analytics Panel (Right 1 col) */}
        <div className="space-y-6">
          <div className="bg-[#0f2137] border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-[#5BBFB5]" /> Delivery Metrics
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-[#0a1625] border border-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOTAL BROADCASTS</p>
                  <p className="text-2xl font-black mt-1 text-[#5BBFB5]">{campaigns.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#5BBFB5]/10 flex items-center justify-center text-[#5BBFB5]">
                  <FiLayers size={18} />
                </div>
              </div>
              <div className="p-4 bg-[#0a1625] border border-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DELIVERED REACH</p>
                  <p className="text-2xl font-black mt-1 text-[#89C2D9]">
                    {campaigns.reduce((sum, c) => sum + (c.metrics?.totalSent || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#89C2D9]/10 flex items-center justify-center text-[#89C2D9]">
                  <FiCheckCircle size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns list table */}
      <div className="mt-8 bg-[#0f2137] border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4">Historical Campaigns</h3>
        
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading campaign archives...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No campaigns sent yet. Ready for your first dispatch!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-4">CAMPAIGN</th>
                  <th className="py-3 px-4">CHANNEL</th>
                  <th className="py-3 px-4">TARGET AUDIENCE</th>
                  <th className="py-3 px-4">SENT METRIC</th>
                  <th className="py-3 px-4">DATE SENT</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-200">{c.name}</p>
                      {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        c.type === "email" ? "bg-cyan-900/30 text-cyan-400" : "bg-purple-900/30 text-purple-400"
                      }`}>
                        {c.type === "email" ? <FiMail size={10} /> : <FiSmartphone size={10} />}
                        {c.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-300 font-medium">{c.audienceType}</td>
                    <td className="py-3 px-4 text-[#5BBFB5] font-extrabold">{c.metrics?.totalSent || 0}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => deleteCampaign(c._id)}
                        className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-slate-500 transition-all"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
