// AdminMessages.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiMail, FiCalendar, FiUser, FiRefreshCw,
  FiSearch, FiInbox, FiClock, FiChevronRight,
  FiSend, FiTrash2, FiStar, FiX
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease },
  }),
};

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyModal, setReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchMessages = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/contact");
      setMessages(res.data || []);
    } catch (err) {
      toast.error("Failed to load messages");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async () => {
    if (!replyText.trim()) return toast.error("Message cannot be empty");

    setSending(true);
    const toastId = toast.loading("Sending reply...");

    try {
      await axios.post("/api/contact/reply", {
        to: selectedMsg.email,
        subject: `Re: Inquiry from ${new Date(selectedMsg.createdAt).toLocaleDateString()}`,
        message: replyText,
        originalMessageId: selectedMsg._id
      });

      toast.success("Reply sent successfully!", { id: toastId });
      setReplyModal(false);
      setReplyText("");
    } catch (err) {
      toast.error("Failed to send reply", { id: toastId });
    } finally {
      setSending(false);
    }
  };

  const filtered = messages.filter(
    (msg) =>
      msg.email?.toLowerCase().includes(search.toLowerCase()) ||
      msg.message?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (email) => email ? email.charAt(0).toUpperCase() : "?";

  return (
    <div className="p-4 md:p-8 h-screen max-h-screen flex flex-col font-sans bg-slate-50/50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <FiInbox size={20} />
            </div>
            Inbox
            <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMessages()}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Message List */}
        <div className="w-full md:w-1/3 lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all upstream-text-slate-900"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse mx-2" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">No messages found</div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => setSelectedMsg(msg)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedMsg?._id === msg._id ? "bg-blue-50 border-blue-100 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold truncate ${selectedMsg?._id === msg._id ? "text-blue-700" : "text-slate-900"}`}>
                      {msg.email}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-2 ${selectedMsg?._id === msg._id ? "text-blue-600/80" : "text-slate-500"}`}>
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Reading Pane */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {selectedMsg ? (
            <>
              {/* Message Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {getInitials(selectedMsg.email)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedMsg.email}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono text-slate-600">Customer</span>
                      &bull;
                      <span>{new Date(selectedMsg.createdAt).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReplyModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2"
                  >
                    <FiSend /> Reply
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
                <div className="max-w-3xl">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Original Message</h3>
                  <div className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap font-medium">
                    {selectedMsg.message}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <FiInbox size={64} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation to start reading</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Reply to {selectedMsg?.email}</h3>
                <button onClick={() => setReplyModal(false)}><FiX className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              <div className="p-6">
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your response here..."
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 resize-none text-slate-700"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setReplyModal(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                    Send Reply
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}