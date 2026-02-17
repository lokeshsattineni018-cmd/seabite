import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageSquare, FiSearch, FiTrash2, FiRefreshCw,
  FiArrowRight, FiClock, FiUser, FiMail, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5 }
  })
};

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/contact", { withCredentials: true });
      setMessages(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`/api/contact/${id}`, { withCredentials: true });
      fetchMessages(true);
      setSelectedMessage(null);
      toast.success("Message deleted!");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const filteredMessages = messages.filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                <FiMessageSquare size={24} />
              </motion.div>
              Customer Messages
            </h1>
            <p className="text-slate-400 text-sm mt-2 ml-16">Manage inquiries and customer communication</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchMessages(true)}
            className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </motion.button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={1} className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Messages</h3>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              {messages.length} total
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <motion.div key={i} animate={{ opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-slate-800/30 rounded-xl h-20" />
              ))
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-2xl border border-dashed border-slate-700/50">
                <FiMessageSquare size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No messages found</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredMessages.map((msg, i) => (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMessage(msg)}
                    className={`bg-gradient-to-br ${selectedMessage?._id === msg._id ? "from-cyan-500/10 to-blue-500/10 border-cyan-500/40" : "from-slate-800/40 to-slate-900/40 border-slate-700/50"} border rounded-xl p-4 cursor-pointer hover:border-cyan-500/30 transition-all group`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-white">{msg.name}</p>
                          <span className="text-xs text-slate-500">{msg.email}</span>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2">{msg.message}</p>
                        <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                          <FiClock size={12} />
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <FiArrowRight className="text-slate-600 group-hover:text-cyan-400 transition-colors ml-2 shrink-0" size={16} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Message Details */}
        <motion.div variants={fadeUp} custom={3}>
          {selectedMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-6 sticky top-8 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-6">
                <h3 className="font-bold text-white text-lg">Message Details</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-slate-500 hover:text-slate-300 p-1"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Name</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {selectedMessage.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white font-medium">{selectedMessage.name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Email</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-sm">
                    <FiMail size={14} /> {selectedMessage.email}
                  </a>
                </div>

                {selectedMessage.phone && (
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-2">Phone</p>
                    <p className="text-white font-medium">{selectedMessage.phone}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Message</p>
                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-700/20 p-3 rounded-lg">
                    {selectedMessage.message}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Received</p>
                  <p className="text-slate-400 text-sm">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="w-full bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg py-2 font-bold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <FiTrash2 size={14} /> Delete Message
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-6 text-center">
              <FiMessageSquare size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Select a message to view details</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}