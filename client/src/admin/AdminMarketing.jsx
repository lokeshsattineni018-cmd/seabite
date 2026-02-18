import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
    FiMail, FiSend, FiInfo, FiCheckCircle,
    FiAlertTriangle, FiLoader, FiType, FiMessageSquare,
    FiTarget, FiLayers
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.05, duration: 0.4 }
    })
};

export default function AdminMarketing() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [lastSent, setLastSent] = useState(null);

    // 🟢 Targeted Marketing State
    const [targetMode, setTargetMode] = useState("all"); // "all" | "select"
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch users for selection
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const { data } = await axios.get("/api/admin/users?limit=1000"); // Standard list
            setUsers(data.users || []); // Assuming paginated response structure
        } catch (err) {
            toast.error("Failed to load users for selection");
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUser = (id) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedUsers(newSelected);
    };

    const toggleAll = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendBlast = async () => {
        if (!subject || !message) {
            return toast.error("Please fill both subject and message");
        }

        const recipients = targetMode === "select" ? Array.from(selectedUsers) : [];
        if (targetMode === "select" && recipients.length === 0) {
            return toast.error("Please select at least one user or switch to 'All Users'");
        }

        const confirmMsg = targetMode === "all"
            ? "Send this email to ALL registered users? This action cannot be undone."
            : `Send this email to ${recipients.length} selected users?`;

        if (!window.confirm(confirmMsg)) return;

        setSending(true);
        const toastId = toast.loading("Sending emails...");

        try {
            const { data } = await axios.post("/api/admin/marketing/email-blast", {
                subject,
                message,
                recipients // 🟢 Send specific list if selected
            }, { withCredentials: true });

            toast.success(data.message, { id: toastId });
            setLastSent(new Date());
            setSubject("");
            setMessage("");
            // Optional: clear selection?
            if (targetMode === "select") setSelectedUsers(new Set());
        } catch (err) {
            toast.error(err.response?.data?.message || "Marketing blast failed", { id: toastId });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-4 md:p-8 lg:p-10 font-sans min-h-screen bg-slate-50">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-6xl mx-auto mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                        <FiTarget size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketing Center</h1>
                        <p className="text-sm text-slate-500 font-medium">Create and manage high-conversion email campaigns</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Editor */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Compose Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-8">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FiMail className="text-indigo-600" /> Compose Blast
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                HTML Enabled
                            </span>
                        </div>

                        <div className="space-y-6">
                            {/* Target Modes */}
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    <FiTarget size={12} /> Target Audience
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                    <button
                                        onClick={() => setTargetMode("all")}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${targetMode === "all" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        All Users
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTargetMode("select");
                                            if (users.length === 0) fetchUsers();
                                        }}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${targetMode === "select" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        Select Users
                                    </button>
                                </div>
                            </div>

                            {/* User Selection Table */}
                            {targetMode === "select" && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                    <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center">
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="text-xs bg-slate-100 border-none rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20 w-full max-w-xs"
                                        />
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                            {selectedUsers.size} Selected
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {loadingUsers ? (
                                            <div className="p-8 text-center text-slate-400 text-xs">Loading users...</div>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.size > 0 && selectedUsers.size === filteredUsers.length}
                                                                onChange={toggleAll}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                                                            />
                                                        </th>
                                                        <th className="p-3">Name</th>
                                                        <th className="p-3">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {filteredUsers.map(u => (
                                                        <tr key={u._id} className={selectedUsers.has(u._id) ? "bg-indigo-50/50" : "bg-white"}>
                                                            <td className="p-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUsers.has(u._id)}
                                                                    onChange={() => toggleUser(u._id)}
                                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                                                                />
                                                            </td>
                                                            <td className="p-3 font-medium text-slate-700">{u.name}</td>
                                                            <td className="p-3 text-slate-500">{u.email}</td>
                                                        </tr>
                                                    ))}
                                                    {filteredUsers.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="p-4 text-center text-slate-400 italic">No users found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    <FiType size={12} /> Campaign Subject
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Flash Sale Alert! 50% Off Giant Prawns 🦐"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 text-sm"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                                    <FiMessageSquare size={12} /> Message Body
                                </label>
                                <textarea
                                    rows={12}
                                    placeholder="Write your promotional message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 leading-relaxed resize-none placeholder:text-slate-400 text-sm"
                                />
                                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-medium">
                                    <span className="flex items-center gap-1.5 ">
                                        <FiLayers size={12} /> Auto-wrapped in "Elite Glass" Template
                                    </span>
                                    <span>{message.length} chars</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSendBlast}
                            disabled={sending}
                            className={`px-8 py-4 rounded-xl flex items-center gap-3 text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 ${sending
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
                                }`}
                        >
                            {sending ? (
                                <>
                                    <FiLoader className="animate-spin" size={18} /> Sending...
                                </>
                            ) : (
                                <>
                                    <FiSend size={18} /> {targetMode === "select" ? `Send to ${selectedUsers.size}` : "Launch Campaign"}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20"
                    >
                        {/* Background Decoration */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-6 flex items-center gap-2">
                                <FiCheckCircle size={14} /> Campaign Status
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Service Node</p>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Resend Enterprise
                                    </p>
                                </div>

                                {lastSent ? (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Last Blast</p>
                                        <p className="text-xs font-bold text-white mb-0.5">{lastSent.toLocaleDateString()}</p>
                                        <p className="text-[10px] text-slate-400">{lastSent.toLocaleTimeString()}</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                        <p className="text-xs text-slate-400 text-center italic">No campaigns sent this session</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={3}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm"
                    >
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-5 flex items-center gap-2">
                            <FiAlertTriangle className="text-amber-500" size={14} /> Guidelines
                        </h3>
                        <div className="space-y-4">
                            {[
                                { title: "Target Audience", desc: targetMode === "all" ? "All registered users selected." : `${selectedUsers.size} specific users selected.` },
                                { title: "Content Policy", desc: "Strictly promotional or update-related content only." },
                                { title: "Rate Limits", desc: "System handles batches of 100/min automatically." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
