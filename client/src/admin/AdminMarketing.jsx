import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail, FiSend, FiRefreshCw, FiCheckCircle,
  FiAlertCircle, FiUsers, FiFileText, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5 }
  })
};

export default function AdminMarketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    targetSegment: "all"
  });
  const [sending, setSending] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/marketing/campaigns", { withCredentials: true });
      setCampaigns(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      return toast.error("Fill all fields");
    }

    setSending(true);
    try {
      await axios.post("/api/admin/marketing/send", formData, { withCredentials: true });
      toast.success("Campaign sent successfully!");
      setFormData({ subject: "", message: "", targetSegment: "all" });
      setShowForm(false);
      fetchCampaigns();
    } catch (err) {
      toast.error("Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                <FiMail size={24} />
              </motion.div>
              Email Marketing
            </h1>
            <p className="text-slate-400 text-sm mt-2 ml-16">Create and send promotional campaigns</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg shadow-indigo-500/20"
          >
            {showForm ? "Cancel" : "+ New Campaign"}
          </motion.button>
        </div>
      </motion.div>

      {/* New Campaign Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-6 mb-8 backdrop-blur-sm"
          >
            <form onSubmit={handleSendCampaign} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Campaign Subject</label>
                <input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  placeholder="e.g., Summer Sale 50% Off!"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all resize-none"
                  rows="5"
                  placeholder="Write your campaign message..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Segment</label>
                <select
                  value={formData.targetSegment}
                  onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                >
                  <option value="all">All Customers</option>
                  <option value="purchased">Purchased Before</option>
                  <option value="newsletter">Newsletter Subscribers</option>
                  <option value="inactive">Inactive Users</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-3 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? "Sending..." : <>
                  <FiSend size={16} /> Send Campaign
                </>}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaigns List */}
      <motion.div variants={fadeUp} custom={1}>
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <FiFileText className="text-indigo-400" size={20} />
          Recent Campaigns
        </h3>
        {loading ? (
          <div className="text-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-2xl border border-dashed border-slate-700/50">
            <FiMail size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No campaigns yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{campaign.subject}</h4>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        <FiCheckCircle className="inline mr-1" size={12} />
                        Sent
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">{campaign.message.substring(0, 100)}...</p>
                    <p className="text-slate-500 text-xs mt-3">
                      Recipients: <strong>{campaign.recipientCount || "—"}</strong> • 
                      Sent: <strong>{new Date(campaign.sentAt).toLocaleDateString()}</strong>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}