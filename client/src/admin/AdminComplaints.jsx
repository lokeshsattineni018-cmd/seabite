import { useState, useEffect } from "react";
import axios from "axios";
import {
    FiMessageSquare, FiClock, FiCheckCircle, FiUser,
    FiPackage, FiCornerUpLeft, FiAlertCircle, FiSearch, FiFilter
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/complaints`, { withCredentials: true });
            setComplaints(data);
        } catch (err) {
            toast.error("Failed to load complaints");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return toast.error("Please enter a reply");

        setIsSubmitting(true);
        try {
            await axios.put(`${API_URL}/api/admin/complaints/${selectedComplaint._id}/reply`, {
                adminReply: replyText,
                status: "Resolved"
            }, { withCredentials: true });

            toast.success("Reply sent & marked as Resolved");
            setReplyText("");
            setSelectedComplaint(null);
            fetchComplaints();
        } catch (err) {
            toast.error("Failed to send reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = complaints.filter(c => {
        const matchesFilter = filter === "All" || c.status === filter;
        const matchesSearch = c.order?.orderId?.toString().includes(search) ||
            c.user?.name?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/50 pb-8">
                <div>
                    <h1 className="text-4xl font-light text-stone-900 tracking-tight mb-2">Customer Feedback</h1>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                        {complaints.filter(c => c.status === "Pending").length} Unresolved Issues
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-stone-100 transition-all">
                        <FiSearch className="text-stone-400" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by Order ID..."
                            className="bg-transparent text-sm outline-none placeholder:text-stone-300 w-full sm:w-48"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm font-medium text-stone-600 outline-none cursor-pointer hover:border-stone-300 transition-all"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((c) => (
                            <motion.div
                                layout
                                key={c._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setSelectedComplaint(c)}
                                className={`group p-5 bg-white border rounded-3xl cursor-pointer transition-all ${selectedComplaint?._id === c._id
                                        ? "border-stone-900 ring-4 ring-stone-50 shadow-lg"
                                        : "border-stone-100 hover:border-stone-300 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${c.status === "Pending" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                            {c.status === "Pending" ? <FiAlertCircle size={18} /> : <FiCheckCircle size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-stone-900">Order #{c.order?.orderId || "N/A"}</h3>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{c.issueType}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-stone-400 font-medium">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <p className="text-sm text-stone-600 line-clamp-2 italic mb-4">"{c.description}"</p>

                                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500 uppercase">
                                            {c.user?.name?.[0]}
                                        </div>
                                        <span className="text-xs font-semibold text-stone-600">{c.user?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                        <span className="flex items-center gap-1.5"><FiPackage size={12} /> ₹{c.order?.totalAmount}</span>
                                        <span className={`px-2 py-0.5 rounded-full ${c.status === "Pending" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filtered.length === 0 && (
                        <div className="py-20 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                            <FiMessageSquare className="mx-auto text-stone-300 mb-4" size={32} />
                            <p className="text-stone-400 font-medium italic">No complaints found matching your criteria.</p>
                        </div>
                    )}
                </div>

                {/* Detail / Reply Panel */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <AnimatePresence mode="wait">
                            {selectedComplaint ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white border border-stone-100 rounded-[32px] p-8 shadow-2xl shadow-stone-200/50 space-y-8"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">Case Investigation</span>
                                            <button onClick={() => setSelectedComplaint(null)} className="p-2 hover:bg-stone-50 rounded-full transition-colors"><FiCornerUpLeft size={16} className="text-stone-400" /></button>
                                        </div>
                                        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Support Ticket</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                            <FiUser className="mt-1 text-stone-400" size={18} />
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">Customer Info</p>
                                                <p className="font-bold text-stone-800">{selectedComplaint.user?.name}</p>
                                                <p className="text-sm text-stone-500">{selectedComplaint.user?.email}</p>
                                                <p className="text-sm text-stone-500">{selectedComplaint.user?.phone}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-stone-400">User Report</p>
                                            <div className="p-5 bg-stone-900 text-stone-100 rounded-2xl rounded-tl-none font-medium text-sm leading-relaxed relative">
                                                <div className="absolute top-0 -left-2 w-0 h-0 border-t-[12px] border-t-stone-900 border-l-[12px] border-l-transparent" />
                                                {selectedComplaint.description}
                                            </div>
                                        </div>

                                        {selectedComplaint.adminReply ? (
                                            <div className="space-y-3">
                                                <p className="text-xs font-black uppercase tracking-widest text-stone-400">Admin Response</p>
                                                <div className="p-5 bg-emerald-50 text-emerald-800 rounded-2xl rounded-tr-none font-medium text-sm leading-relaxed border border-emerald-100 relative">
                                                    <div className="absolute top-0 -right-2 w-0 h-0 border-t-[12px] border-t-emerald-50 border-r-[12px] border-r-transparent" />
                                                    {selectedComplaint.adminReply}
                                                </div>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest text-right">Resolved</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleReply} className="space-y-4 pt-4 border-t border-stone-100">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Draft Response</label>
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-sm outline-none focus:ring-4 focus:ring-stone-50 focus:border-stone-400 transition-all min-h-[120px] placeholder:text-stone-300"
                                                        placeholder="Type your reply to the customer..."
                                                    />
                                                </div>
                                                <button
                                                    disabled={isSubmitting}
                                                    className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-stone-200 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {isSubmitting ? "Sending..." : "Send Response & Resolve"}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-stone-200 rounded-[32px]">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-200">
                                        <FiMessageSquare size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest leading-loose">
                                        Select a complaint<br />to view details
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
