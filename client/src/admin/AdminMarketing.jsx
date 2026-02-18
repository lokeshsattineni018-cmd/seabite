import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiMail, FiSend, FiUsers, FiCheck, FiX, FiSearch,
    FiTarget, FiZap, FiLayout, FiType
} from "react-icons/fi";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// Animation Constants
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function AdminMarketing() {
    // Campaign State
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    // Audience State
    const [targetMode, setTargetMode] = useState("all"); // "all" | "select"
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showUserModal, setShowUserModal] = useState(false);

    // Fetch Users (Lazy Load)
    useEffect(() => {
        if (targetMode === "select" && users.length === 0) {
            fetchUsers();
        }
    }, [targetMode]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/users`);
            // 🟢 FIX: API returns raw array, not { users: [] }
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error("Failed to load audience list");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Selection Logic
    const toggleUser = (id) => {
        const newSet = new Set(selectedUsers);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedUsers(newSet);
    };

    const toggleAll = () => {
        if (selectedUsers.size === filteredUsers.length) setSelectedUsers(new Set());
        else setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sending Logic
    const handleSend = async () => {
        if (!subject.trim() || !message.trim()) {
            return toast.error("Subject and Message are required");
        }

        const recipients = targetMode === "select" ? Array.from(selectedUsers) : [];
        if (targetMode === "select" && recipients.length === 0) {
            return toast.error("Please select at least one user");
        }

        const confirmMsg = targetMode === "all"
            ? "📣 Ready to blast this email to ALL users?"
            : `📣 Send this email to ${recipients.length} selected users?`;

        if (!window.confirm(confirmMsg)) return;

        setSending(true);
        const toastId = toast.loading("Launching Campaign...");

        try {
            const { data } = await axios.post(`${API_URL}/api/admin/marketing/email-blast`, {
                subject,
                message,
                recipients: targetMode === "select" ? recipients : []
            }, { withCredentials: true });

            toast.success(data.message, { id: toastId });
            setSubject("");
            setMessage("");
            setSelectedUsers(new Set());
            setTargetMode("all");
        } catch (err) {
            toast.error(err.response?.data?.message || "Campaign failed", { id: toastId });
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial="hidden" animate="visible" variants={fadeInUp}
            className="min-h-screen bg-gray-50/50 p-6 lg:p-12 font-sans"
        >
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Marketing Studio</h1>
                        <p className="text-gray-500 mt-2 font-medium">Design & meaningful connections.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        System Ready
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Left: Composer */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100">

                            {/* Audience Toggle */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Audience</label>
                                <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
                                    <button
                                        onClick={() => setTargetMode("all")}
                                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${targetMode === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        All Users
                                    </button>
                                    <button
                                        onClick={() => { setTargetMode("select"); setShowUserModal(true); }}
                                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${targetMode === "select" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                                    >
                                        Select Users
                                        {selectedUsers.size > 0 && (
                                            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{selectedUsers.size}</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subject Line</label>
                                    <div className="relative">
                                        <FiType className="absolute left-4 top-4 text-gray-400" />
                                        <input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Write something catchy..."
                                            className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-none rounded-xl text-gray-900 font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Content</label>
                                    <div className="relative">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={8}
                                            placeholder="Craft your message here. HTML is supported for advanced formatting."
                                            className="w-full p-5 bg-gray-50 border-none rounded-xl text-gray-700 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none leading-relaxed"
                                        />
                                        <div className="absolute right-4 bottom-4 text-[10px] text-gray-400 font-bold">
                                            {message.length} CHARS
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSend}
                                    disabled={sending}
                                    className={`
                                        px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-3 transition-all
                                        ${sending ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 hover:scale-[1.02] shadow-lg shadow-gray-200"}
                                    `}
                                >
                                    {sending ? "Sending..." : "Launch Campaign"} <FiSend />
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Right: Preview / Tips */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200">
                            <FiZap className="w-8 h-8 mb-4 text-indigo-300" />
                            <h3 className="text-xl font-bold mb-2">Pro Tips</h3>
                            <ul className="space-y-3 text-sm text-indigo-100 font-medium opacity-80">
                                <li className="flex gap-2"><span className="text-white">•</span> Keep subject lines under 60 chars.</li>
                                <li className="flex gap-2"><span className="text-white">•</span> Use emojis to boost open rates 🚀.</li>
                                <li className="flex gap-2"><span className="text-white">•</span> Personalize content for segments.</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Live Preview</h4>
                            <div className="aspect-[4/5] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                Email Preview Unavailable
                            </div>
                        </div>
                    </div>

                </div>

                {/* User Selection Modal */}
                <AnimatePresence>
                    {showUserModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Select Users</h3>
                                        <p className="text-xs text-gray-500 font-medium">Target specific customers for this campaign.</p>
                                    </div>
                                    <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                        <FiX size={20} />
                                    </button>
                                </div>

                                <div className="p-4 border-b border-gray-100">
                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            placeholder="Search by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1 p-2">
                                    {isLoadingUsers ? (
                                        <div className="p-10 text-center text-gray-400 text-sm font-medium">Loading users...</div>
                                    ) : (
                                        <div className="space-y-1">
                                            {/* Select All Row */}
                                            <div
                                                onClick={toggleAll}
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                                                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 && <FiCheck size={12} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">Select All ({filteredUsers.length})</span>
                                            </div>

                                            {filteredUsers.map(user => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => toggleUser(user._id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedUsers.has(user._id) ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedUsers.has(user._id) ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                                                        {selectedUsers.has(user._id) && <FiCheck size={12} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${selectedUsers.has(user._id) ? "text-indigo-900" : "text-gray-700"}`}>{user.name}</p>
                                                        <p className="text-xs text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {filteredUsers.length === 0 && (
                                                <div className="p-8 text-center text-gray-400 text-sm">No users match your search.</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                                    <div className="text-xs font-bold text-gray-500">
                                        {selectedUsers.size} users selected
                                    </div>
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
}
