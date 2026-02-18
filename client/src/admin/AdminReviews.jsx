// AdminReviews.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiTrash2, FiStar, FiMessageSquare, FiRefreshCw, FiFilter
} from "react-icons/fi";
import toast from "react-hot-toast";

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { delay: i * 0.05, duration: 0.6, ease },
    }),
};
const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
};

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/reviews/all", { withCredentials: true });
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (productId, reviewId) => {
        if (!window.confirm("Delete this review indefinitely?")) return;
        try {
            await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
            toast.success("Review deleted");
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch {
            toast.error("Delete failed");
        }
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = (r.userName?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (r.productName?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (r.comment?.toLowerCase() || "").includes(search.toLowerCase());
        const matchesRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
        return matchesSearch && matchesRating;
    });

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white p-6 md:p-10 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">Reviews</h1>
                        <p className="text-sm text-stone-500">Moderate feedback and ratings</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search content..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200/50 text-stone-800 font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-200/50 transition-all outline-none"
                            />
                        </div>

                        <div className="relative">
                            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                                className="pl-11 pr-8 py-3 rounded-2xl bg-white border border-stone-200 text-stone-600 font-bold text-xs uppercase tracking-wide cursor-pointer hover:border-stone-300 outline-none appearance-none"
                            >
                                <option value="all">All Stars</option>
                                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                            </select>
                        </div>

                        <button onClick={fetchReviews} className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-colors">
                            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
                        </button>
                    </div>
                </motion.div>

                {/* Review Grid */}
                <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <motion.div key={i} variants={fadeUp} className="h-48 bg-stone-50 rounded-3xl border border-stone-100 animate-pulse" />
                            ))
                        ) : filteredReviews.length === 0 ? (
                            <motion.div variants={fadeUp} className="col-span-full py-20 text-center">
                                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                    <FiMessageSquare size={24} />
                                </div>
                                <p className="text-stone-500 font-medium">No reviews found</p>
                            </motion.div>
                        ) : (
                            filteredReviews.map((review) => (
                                <motion.div
                                    key={review._id}
                                    variants={fadeUp}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                    className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <FiStar key={i} size={14} className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"} />
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold text-stone-900 ml-1">{review.rating}.0</span>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(review.productId, review._id)}
                                            className="text-stone-300 hover:text-rose-500 transition-colors p-1"
                                            title="Delete Review"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 truncate">{review.productName}</h4>
                                        <p className="text-stone-700 text-sm italic leading-relaxed">"{review.comment}"</p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
                                                {review.userName?.charAt(0) || "U"}
                                            </div>
                                            <span className="text-xs font-bold text-stone-900">{review.userName || "Anonymous"}</span>
                                        </div>
                                        <span className="text-[10px] text-stone-400 font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>

            </div>
        </motion.div>
    );
}
