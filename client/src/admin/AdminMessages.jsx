// AdminMessages.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import Customer360Sidebar from "./components/Customer360Sidebar";
import { FiMail, FiRefreshCw, FiSearch, FiInbox, FiSend, FiTrash2, FiX, FiCheck, FiTag, FiArchive, FiAlertCircle, FiChevronDown, FiMessageSquare, FiCreditCard } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const CANNED_RESPONSES = [
  "Hi! Our standard delivery window is 2-4 hours. You'll receive a live tracking link once dispatched.",
  "Yes, all our fish is fresh-catch from today morning. We don't store inventory overnight.",
  "Your refund has been initiated and will reflect in your SeaBite wallet instantly.",
  "We are currently out of stock for this item. Would you like a fresh recommendation?",
];

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.6, ease },
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
  const [customerContext, setCustomerContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const fetchMessages = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/contact", { withCredentials: true });
      setMessages(res.data || []);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (selectedMsg) {
      fetchCustomerContext(selectedMsg.email);
      markAsRead(selectedMsg._id);
    }
  }, [selectedMsg]);

  const fetchCustomerContext = async (email) => {
    setContextLoading(true);
    try {
      const res = await axios.get(`/api/contact/customer-360/${email}`, { withCredentials: true });
      setCustomerContext(res.data);
    } catch {
      setCustomerContext(null);
    } finally {
      setContextLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/contact/${id}`, { read: true }, { withCredentials: true });
      setMessages(prev => prev.map(m => m._id === id ? { ...m, read: true } : m));
    } catch (err) {}
  };

  const updateMessageStatus = async (id, status) => {
    const t = toast.loading(`Updating status to ${status}...`);
    try {
      await axios.put(`/api/contact/${id}`, { status }, { withCredentials: true });
      setMessages(prev => prev.map(m => m._id === id ? { ...m, status } : m));
      toast.success("Updated!", { id: t });
    } catch {
      toast.error("Failed to update", { id: t });
    }
  };

  const archiveMessage = async (id) => {
    try {
      await axios.put(`/api/contact/${id}`, { tags: ["Archived"] }, { withCredentials: true });
      setMessages(prev => prev.filter(m => m._id !== id));
      setSelectedMsg(null);
      toast.success("Archived");
    } catch {
      toast.error("Failed to archive");
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return toast.error("Message cannot be empty");
    setSending(true);
    const t = toast.loading("Sending reply...");
    try {
      await axios.post("/api/contact/reply", {
        to: selectedMsg.email,
        subject: `Re: Inquiry from ${new Date(selectedMsg.createdAt).toLocaleDateString()}`,
        message: replyText,
        originalMessageId: selectedMsg._id
      }, { withCredentials: true });
      toast.success("Sent!", { id: t });
      setReplyModal(false);
      setReplyText("");
    } catch {
      toast.error("Failed to send", { id: t });
    } finally {
      setSending(false);
    }
  };

  const filtered = messages.filter(msg => {
    const matchesSearch = msg.email?.toLowerCase().includes(search.toLowerCase()) ||
                         msg.message?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "All" || msg.status === filterStatus;
    const isNotArchived = !msg.tags?.includes("Archived");
    return matchesSearch && matchesFilter && isNotArchived;
  });

  const StatusBadge = ({ status }) => {
    const map = {
      "New": "bg-blue-500",
      "Pending Reply": "bg-amber-500",
      "Urgent": "bg-rose-500",
      "Closed": "bg-stone-400"
    };
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${map[status] || "bg-stone-300"}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{status}</span>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-6 md:p-8 flex flex-col font-sans bg-gradient-to-br from-white via-stone-50 to-white overflow-hidden rounded-3xl mx-4 my-4 border border-stone-200 shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-lg shadow-stone-200">
            <FiInbox size={20} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight">Inbox</h1>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">{messages.length} Messages</p>
          </div>
        </div>
        <button onClick={() => fetchMessages()} className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl transition-colors">
          {loading ? <SeaBiteLoader small /> : <FiRefreshCw size={18} />}
        </button>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">

        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-96 flex flex-col gap-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-medium text-stone-800 outline-none focus:bg-white focus:border-stone-300 transition-all placeholder:text-stone-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar shrink-0">
            {["All", "New", "Pending Reply", "Urgent", "Closed"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${filterStatus === s ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white text-stone-500 border-stone-100 hover:border-stone-200'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="py-10 flex justify-center">
                <SeaBiteLoader />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-sm font-medium">No conversation found</div>
            ) : (
              filtered.map(msg => (
                <motion.div
                  key={msg._id}
                  layoutId={msg._id}
                  onClick={() => setSelectedMsg(msg)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all border relative group ${selectedMsg?._id === msg._id ? "bg-stone-900 border-stone-900 shadow-lg shadow-stone-200" : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-sm"}`}
                >
                  {!msg.read && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-sm font-bold truncate ${selectedMsg?._id === msg._id ? "text-white" : "text-stone-900"}`}>{msg.email}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${selectedMsg?._id === msg._id ? "bg-white/10 text-white/60" : "bg-stone-100 text-stone-500"}`}>
                      {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-1 leading-relaxed mb-3 ${selectedMsg?._id === msg._id ? "text-stone-400" : "text-stone-500"}`}>{msg.message}</p>
                  
                  <div className="flex items-center justify-between">
                    <StatusBadge status={msg.status} />
                    {msg.tags?.map(tag => (
                      <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${tag === 'Complaint' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden relative flex flex-row">
          <div className="flex-1 flex flex-col min-w-0">
            {selectedMsg ? (
              <>
                <div className="p-8 border-b border-stone-100 flex justify-between items-start bg-stone-50/30 shrink-0">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-lg">
                      {selectedMsg.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-stone-900 mb-1">{selectedMsg.email}</h2>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-stone-500 font-medium">Customer • {new Date(selectedMsg.createdAt).toLocaleString()}</p>
                        <select 
                          value={selectedMsg.status}
                          onChange={(e) => updateMessageStatus(selectedMsg._id, e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-blue-600 uppercase tracking-widest outline-none cursor-pointer"
                        >
                          {["New", "Pending Reply", "Urgent", "Closed"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => archiveMessage(selectedMsg._id)} className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-xl transition-all" title="Archive">
                      <FiArchive size={18} />
                    </button>
                    <button
                      onClick={() => setReplyModal(true)}
                      className="px-6 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-stone-800 transition-all shadow-lg flex items-center gap-2"
                    >
                      <FiSend /> Reply
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto">
                  <div className="max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Inquiry Details</p>
                      {selectedMsg.tags?.length > 0 && (
                        <div className="flex gap-2">
                          {selectedMsg.tags.map(t => (
                            <span key={t} className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                              <FiTag size={10} /> {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-lg leading-relaxed text-stone-800 font-medium whitespace-pre-wrap">{selectedMsg.message}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-300">
                <FiInbox size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Select a message to view details</p>
              </div>
            )}
          </div>
          
          {selectedMsg && (
            <Customer360Sidebar context={customerContext} loading={contextLoading} />
          )}
        </div>

      </div>

      <AnimatePresence>
        {replyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-900">Reply to {selectedMsg?.email}</h3>
                <button onClick={() => setReplyModal(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"><FiX size={20} /></button>
              </div>
              <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:text-stone-900 transition-colors"
                    >
                      <FiMessageSquare size={12} /> Canned Responses <FiChevronDown size={10} />
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const item = prompt("Enter product name (e.g. Vanjaram Fish):", "Vanjaram Fish");
                          if (item) setReplyText(prev => prev + `\n\n📦 PRODUCT RECOMMENDATION:\nCheck out our fresh ${item} here: https://seabite.com/shop?search=${encodeURIComponent(item)}`);
                        }}
                        className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all uppercase tracking-widest"
                      >
                        <FiTag size={10} /> @product
                      </button>
                      <button 
                        onClick={() => {
                          const amount = prompt("Enter total amount for checkout link:", "1000");
                          if (amount) setReplyText(prev => prev + `\n\n🔗 FAST CHECKOUT LINK:\nComplete your payment of ₹${amount} here: https://seabite.com/checkout?direct=true&amount=${amount}\n(Link secure & valid for 24h)`);
                        }}
                        className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all uppercase tracking-widest"
                      >
                        <FiCreditCard size={10} /> Send Checkout Link
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {showQuickReplies && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 top-6 w-full bg-white border border-stone-200 rounded-2xl shadow-xl z-10 overflow-hidden"
                      >
                        {CANNED_RESPONSES.map((r, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setReplyText(r);
                              setShowQuickReplies(false);
                            }}
                            className="w-full p-4 text-left text-xs text-stone-600 hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
                          >
                            {r}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your response..."
                  className="w-full h-48 p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:bg-white focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all resize-none text-stone-800 placeholder:text-stone-400"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setReplyModal(false)} className="px-6 py-3 rounded-xl text-stone-500 font-bold text-xs uppercase hover:bg-stone-50 transition-colors">Cancel</button>
                  <button onClick={handleReply} disabled={sending} className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-stone-800 shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                    {sending ? <SeaBiteLoader small /> : <FiSend />} Send Reply
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}