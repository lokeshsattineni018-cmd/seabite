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

    const handleSendBlast = async () => {
        if (!subject || !message) {
            return toast.error("Please fill both subject and message");
        }

        if (!window.confirm("Send this email to ALL registered users? This action cannot be undone.")) return;

        setSending(true);
        const toastId = toast.loading("Sending bulk emails...");

        try {
            const { data } = await axios.post("/api/admin/marketing/email-blast", {
                subject,
                message
            }, { withCredentials: true });

            toast.success(data.message, { id: toastId });
            setLastSent(new Date());
            setSubject("");
            setMessage("");
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
                                    <FiSend size={18} /> Launch Campaign
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
                                { title: "Target Audience", desc: "All emails sent to registered active users." },
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
