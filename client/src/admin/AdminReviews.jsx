import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiTrash2, FiStar, FiMessageSquare, FiFilter, FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.05, duration: 0.5, ease },
    }),
};

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/admin/reviews/all", { withCredentials: true });
            setReviews(res.data);
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
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        try {
            await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
            toast.success("Review deleted");
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch (err) {
            toast.error("Failed to delete review");
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
        <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 min-h-screen font-sans">
            <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reviews</h1>
                    <p className="text-slate-500 text-sm mt-1">Moderate customer feedback</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none text-sm shadow-sm"
                        />
                    </div>

                    <select
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm cursor-pointer"
                    >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>

                    <button onClick={fetchReviews} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                        <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
                        ))
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FiMessageSquare size={32} />
                            </div>
                            <h3 className="text-slate-900 font-bold">No Reviews Found</h3>
                            <p className="text-slate-400 text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredReviews.map((review, i) => (
                            <motion.div
                                key={review._id}
                                variants={fadeUp}
                                custom={i * 0.05}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, starI) => (
                                                <FiStar key={starI} size={14} className={starI < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 ml-1">{review.rating}.0</span>
                                        <span className="text-xs text-slate-300">•</span>
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{review.productName}</span>
                                    </div>
                                    <p className="text-slate-700 text-sm italic leading-relaxed mb-3">"{review.comment}"</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="font-bold text-slate-900">{review.userName}</span>
                                        <span>•</span>
                                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center md:border-l md:border-slate-100 md:pl-6">
                                    <button
                                        onClick={() => handleDelete(review.productId, review._id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100/80 rounded-lg text-xs font-bold transition-colors w-full md:w-auto justify-center"
                                    >
                                        <FiTrash2 size={14} /> Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
