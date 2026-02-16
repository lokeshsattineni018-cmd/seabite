import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
    FiMail, FiSend, FiInfo, FiCheckCircle,
    FiAlertTriangle, FiLoader, FiType, FiMessageSquare
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
        <div className="p-4 md:p-8 lg:p-10 font-sans min-h-screen bg-slate-50/50">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                        <FiMail size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Marketing Engine</h1>
                        <p className="text-xs text-slate-500 font-medium">Reach all your customers instantly via premium email blasts</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Editor */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
                >
                    <div className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                                <FiType size={12} /> Email Subject
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Flash Sale Alert! 50% Off Giant Prawns 🦐"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                                <FiMessageSquare size={12} /> Email Content (Aesthetic Wrapper)
                            </label>
                            <textarea
                                rows={10}
                                placeholder="Write your promotional message here... (Simple HTML supported)"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-slate-700 leading-relaxed resize-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5 italic font-medium">
                                <FiInfo size={10} /> Your message will be automatically wrapped in our premium "Elite Glass" email template.
                            </p>
                        </div>

                        <button
                            onClick={handleSendBlast}
                            disabled={sending}
                            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-100 ${sending
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.98]"
                                }`}
                        >
                            {sending ? (
                                <>
                                    <FiLoader className="animate-spin" size={18} /> Processing Blast...
                                </>
                            ) : (
                                <>
                                    <FiSend size={18} /> Fire Marketing Blast
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
                        className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                            <FiCheckCircle size={14} /> Intelligence
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            Emails are delivered via our Resend enterprise node. Each user receives a personalized greeting and a direct link to the storefront.
                        </p>
                        {lastSent && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Last Successful Blast</p>
                                <p className="text-xs font-bold text-white mt-1">{lastSent.toLocaleString()}</p>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={3}
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
                    >
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                            <FiAlertTriangle size={14} /> Anti-Spam Policy
                        </h3>
                        <ul className="space-y-3">
                            {["No redundant blasts", "Authentic content only", "Strictly promotional"].map((rule, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> {rule}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
