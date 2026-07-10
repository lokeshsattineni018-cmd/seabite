import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiMail, FiSend, FiUsers, FiCheck, FiX, FiSearch,
    FiTarget, FiZap, FiLayout, FiType, FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const PREDEFINED_TEMPLATES = [
    {
        name: "Welcome Promo",
        subject: "🌊 Welcome to SeaBite! Your 15% discount code inside",
        message: "Ahoy there!\n\nWelcome to SeaBite - your destination for the freshest coastal catch. To celebrate your arrival, we have generated a special 15% discount coupon for your first order!\n\nUse Code: WELCOME15 at checkout.\n\nBrowse our fresh selection of Pomfrets, Crabs, and Premium Tiger Prawns at https://seabite.co.in/products\n\nBest Catch,\nThe SeaBite Captain"
    },
    {
        name: "Abandoned Cart Offer",
        subject: "⚓ Your fresh catch is still waiting! Get 5% extra off now",
        message: "Ahoy!\n\nWe noticed you left some of the finest premium coastal seafood in your cart. Our docks are running busy, and these catches won't wait forever!\n\nComplete your checkout in the next 15 minutes and use Code: SEABITE5 to unlock an extra 5% discount.\n\nFinish your order at: https://seabite.co.in/checkout\n\nFair winds,\nSeaBite Crew"
    },
    {
        name: "Weekend Docks Special",
        subject: "🚢 Fresh Weekend Catch: Order by Friday night for Saturday Morning delivery!",
        message: "Ahoy SeaBite Member!\n\nOur boats have just returned to the docks with a premium catch of crabs, pomfret, and whole-cleaned prawns. \n\nPlace your order by Friday 10 PM IST to guarantee premium same-day delivery on Saturday morning.\n\nOrder fresh now at: https://seabite.co.in/products\n\nSeaBite Docks Team"
    },
    {
        name: "SeaBite Prime Nudge",
        subject: "💎 Unlock Unlimited Free Deliveries with SeaBite Prime!",
        message: "Ahoy!\n\nWant to skip the delivery fees entirely? Upgrade your account to SeaBite Prime today and enjoy unlimited free deliveries, priority slots on early morning catches, and exclusive member-only discounts!\n\nActivate SeaBite Prime under your Account Profile now.\n\nKeep it fresh,\nSeaBite Prime Team"
    }
];

export default function AdminMarketing() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [targetMode, setTargetMode] = useState("all");
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        if (targetMode === "select" && users.length === 0) {
            fetchUsers();
        }
    }, [targetMode]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error("Failed to load users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

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

    const handleSend = async () => {
        if (!subject.trim() || !message.trim()) {
            return toast.error("Subject and message required");
        }

        const recipients = targetMode === "select" ? Array.from(selectedUsers) : [];
        if (targetMode === "select" && recipients.length === 0) {
            return toast.error("Select at least one user");
        }

        const confirmMsg = targetMode === "all"
            ? "Send campaign to all users?"
            : `Send to ${recipients.length} users?`;

        if (!window.confirm(confirmMsg)) return;

        setSending(true);
        const toastId = toast.loading("Sending...");

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
            toast.error(err.response?.data?.message || "Failed", { id: toastId });
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial="hidden" animate="visible" variants={fadeInUp}
            className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white p-6 md:p-10 font-sans"
        >
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <div className="border-b border-stone-200/50 pb-8">
                    <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">
                        Marketing
                    </h1>
                    <p className="text-sm text-stone-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-stone-300" />
                        Design meaningful connections
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Composer */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-stone-200/50 shadow-sm hover:shadow-md transition-shadow">

                            {/* Audience Toggle */}
                            <div className="mb-8">
                                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Target Audience</label>
                                <div className="flex bg-stone-100/60 p-1 rounded-2xl w-fit gap-1">
                                    <button
                                        onClick={() => setTargetMode("all")}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${targetMode === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                                    >
                                        All Users
                                    </button>
                                    <button
                                        onClick={() => { setTargetMode("select"); setShowUserModal(true); }}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${targetMode === "select" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                                    >
                                        Select
                                        {selectedUsers.size > 0 && (
                                            <span className="bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded-full">{selectedUsers.size}</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Subject Line</label>
                                    <input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Write something catchy..."
                                        className="w-full px-5 py-4 bg-stone-50 border border-stone-200/50 rounded-2xl text-stone-900 font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-300/50 transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Message Content</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={10}
                                        placeholder="Craft your message here..."
                                        className="w-full p-5 bg-stone-50 border border-stone-200/50 rounded-2xl text-stone-900 font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-300/50 transition-all outline-none resize-none leading-relaxed"
                                    />
                                    <div className="text-right text-xs text-stone-400 font-medium mt-2">
                                        {message.length} characters
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleSend}
                                    disabled={sending}
                                    className="px-8 py-4 rounded-2xl font-medium text-sm uppercase tracking-wide flex items-center gap-3 transition-all bg-stone-900 hover:bg-stone-800 text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                >
                                    {sending ? (
                                        <>
                                            <SeaBiteLoader small />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Campaign <FiSend size={16} />
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Tips & Autopilot */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Predefined Templates */}
                        <div className="bg-white rounded-3xl p-8 border border-stone-200/50 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-stone-100 rounded-xl">
                                    <FiLayout className="text-stone-700" size={20} />
                                </div>
                                <h3 className="text-lg font-semibold tracking-tight text-stone-900">Quick Templates</h3>
                            </div>
                            <p className="text-stone-500 text-xs leading-relaxed mb-6">
                                Select one of our pre-designed SeaBite templates to auto-populate the email composer.
                            </p>
                            <div className="flex flex-col gap-3">
                                {PREDEFINED_TEMPLATES.map((tmpl) => (
                                    <button
                                        key={tmpl.name}
                                        onClick={() => {
                                            setSubject(tmpl.subject);
                                            setMessage(tmpl.message);
                                            toast.success(`Applied ${tmpl.name} template!`);
                                        }}
                                        className="w-full text-left px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold border border-stone-200/40 transition-colors flex items-center justify-between group"
                                    >
                                        <span>{tmpl.name}</span>
                                        <span className="text-[10px] text-stone-400 group-hover:text-stone-600 transition-colors uppercase tracking-wider font-bold">Apply &rarr;</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Win-Back Autopilot */}
                        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 border border-stone-800 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FiTarget size={80} />
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <FiRefreshCw className="text-emerald-400" size={20} />
                                </div>
                                <h3 className="text-lg font-bold tracking-tight">Win-Back Autopilot</h3>
                            </div>

                            <p className="text-stone-400 text-xs leading-relaxed mb-6">
                                Automatically detect users inactive for 30+ days and send a personalized <span className="text-white font-bold">15% OFF</span> coupon to bring them back.
                            </p>

                            <button
                                onClick={async () => {
                                    if (!window.confirm("Run Win-Back Campaign? This will email all eligible inactive users.")) return;
                                    const toastId = toast.loading("Running Autopilot...");
                                    try {
                                        const { data } = await axios.post(`${API_URL}/api/admin/marketing/win-back`, {}, { withCredentials: true });
                                        toast.success(`Sent ${data.stats.sent} emails`, { id: toastId });
                                    } catch (err) {
                                        toast.error("Failed to run campaign", { id: toastId });
                                    }
                                }}
                                className="w-full py-3 bg-white text-stone-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-colors shadow-lg"
                            >
                                Run Autopilot Now
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-stone-100 to-stone-50 rounded-3xl p-8 border border-stone-200/50">
                            <FiZap className="w-6 h-6 text-stone-600 mb-4" />
                            <h3 className="text-lg font-light text-stone-900 mb-4">Pro Tips</h3>
                            <ul className="space-y-4 text-sm text-stone-600 leading-relaxed">
                                <li className="flex gap-3">
                                    <span className="text-stone-400 mt-1">•</span>
                                    <span>Keep subject under 60 characters for better mobile display</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-stone-400 mt-1">•</span>
                                    <span>Personalize content for higher engagement rates</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-stone-400 mt-1">•</span>
                                    <span>Test send to sample audience first</span>
                                </li>
                            </ul>
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
                                className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col border border-stone-200/50"
                            >
                                <div className="p-6 border-b border-stone-100/50 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-light text-stone-900 mb-1">Select Recipients</h3>
                                        <p className="text-xs text-stone-500">Target specific customers</p>
                                    </div>
                                    <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
                                        <FiX size={20} />
                                    </button>
                                </div>

                                <div className="p-4 border-b border-stone-100/50">
                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                        <input
                                            placeholder="Search by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200/50 rounded-2xl text-sm font-medium focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-300/50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1 p-3">
                                    {isLoadingUsers ? (
                                        <div className="p-10 flex justify-center">
                                            <SeaBiteLoader />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {/* Select All */}
                                            <div
                                                onClick={toggleAll}
                                                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-50 cursor-pointer transition-colors"
                                            >
                                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? "bg-stone-900 border-stone-900" : "border-stone-300 hover:border-stone-400"}`}>
                                                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 && <FiCheck size={12} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-medium text-stone-900">Select All ({filteredUsers.length})</span>
                                            </div>

                                            {filteredUsers.map(user => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => toggleUser(user._id)}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedUsers.has(user._id) ? "bg-stone-100/50" : "hover:bg-stone-50"}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedUsers.has(user._id) ? "bg-stone-900 border-stone-900" : "border-stone-300 hover:border-stone-400"}`}>
                                                        {selectedUsers.has(user._id) && <FiCheck size={12} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-900">{user.name}</p>
                                                        <p className="text-xs text-stone-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {filteredUsers.length === 0 && (
                                                <div className="p-8 text-center text-stone-400 text-sm">No users found</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-stone-100/50 bg-stone-50/30 flex justify-between items-center">
                                    <div className="text-xs font-medium text-stone-500">
                                        {selectedUsers.size} selected
                                    </div>
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        className="bg-stone-900 text-white px-6 py-2.5 rounded-2xl text-xs font-medium uppercase tracking-wide hover:bg-stone-800 transition-all"
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
