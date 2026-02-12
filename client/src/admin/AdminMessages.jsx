// AdminMessages.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiMail, FiCalendar, FiUser, FiRefreshCw,
  FiSearch, FiInbox, FiClock, FiChevronDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.5, ease },
  }),
};

const MessageSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-slate-100" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="h-3 w-24 bg-slate-50 rounded" />
      </div>
      <div className="h-3 w-16 bg-slate-50 rounded" />
    </div>
    <div className="h-16 bg-slate-50 rounded-xl" />
  </div>
);

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/contact");
      setMessages(res.data || []);
    } catch (err) {
      console.error("AdminMessages fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const filtered = messages.filter(
    (msg) =>
      msg.email?.toLowerCase().includes(search.toLowerCase()) ||
      msg.message?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : "?";
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="p-4 md:p-8 lg:p-10 min-h-screen font-sans"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Inbox
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer inquiries and contact messages
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchMessages()}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
          </motion.button>
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 text-sm transition-all shadow-sm"
            />
          </div>
          <div className="bg-white px-3.5 py-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <span className="text-xs font-bold text-blue-600">
              {filtered.length}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Messages List */}
      {loading ? (
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => <MessageSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={fadeUp}
          custom={1}
          className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiInbox className="text-slate-300" size={28} />
          </div>
          <h3 className="text-slate-900 font-bold text-lg">No messages found</h3>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Try a different search term" : "Your inbox is empty"}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((msg, index) => {
              const isExpanded = expandedId === msg._id;
              return (
                <motion.div
                  key={msg._id}
                  variants={fadeUp}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  layout
                  whileHover={{ y: -1 }}
                  onClick={() => setExpandedId(isExpanded ? null : msg._id)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                      {getInitials(msg.email)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">
                            {msg.email}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <FiClock size={10} />
                            {getTimeAgo(msg.createdAt)}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-slate-300"
                          >
                            <FiChevronDown size={14} />
                          </motion.div>
                        </div>
                      </div>

                      {/* Preview / Full message */}
                      <AnimatePresence mode="wait">
                        {isExpanded ? (
                          <motion.div
                            key="full"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease }}
                          >
                            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed mt-2 border border-slate-100">
                              {msg.message}
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
                              <FiCalendar size={10} />
                              {new Date(msg.createdAt).toLocaleDateString()} at{" "}
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.p
                            key="preview"
                            className="text-xs text-slate-500 line-clamp-1 mt-0.5"
                          >
                            {msg.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}