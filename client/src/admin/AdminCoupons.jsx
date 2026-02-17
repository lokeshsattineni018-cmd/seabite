import { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2, FiTag, FiPlus, FiRefreshCw, FiPercent, FiDollarSign, FiCopy, FiCheck, FiAlert } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.06, duration: 0.5, ease },
  }),
};

const CouponSkeleton = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 p-5 rounded-2xl flex justify-between items-center border border-slate-700/50 animate-pulse">
    <div className="space-y-2.5"><div className="h-5 w-32 bg-slate-700/30 rounded-lg" /><div className="h-3 w-48 bg-slate-700/20 rounded-lg" /></div>
    <div className="h-8 w-8 bg-slate-700/30 rounded-lg" />
  </motion.div>
);

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    value: "",
    minOrderAmount: "",
    discountType: "percent"
  });

  const fetchCoupons = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/coupons`, { withCredentials: true });
      setCoupons(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        value: Number(formData.value),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        discountType: "percent",
        maxDiscount: 0,
        isActive: true,
        isSpinCoupon: false,
      };

      await axios.post(`${API_URL}/api/coupons`, couponData, { withCredentials: true });
      setFormData({ code: "", value: "", minOrderAmount: "", discountType: "percent" });
      fetchCoupons(true);
      toast.success("Coupon created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`${API_URL}/api/coupons/${id}`, { withCredentials: true });
      fetchCoupons(true);
      toast.success("Coupon deleted!");
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Code copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.5 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-pink-400 border border-pink-500/30">
                <FiTag size={24} />
              </motion.div>
              Discount Codes
            </h1>
            <p className="text-slate-400 text-sm mt-2 ml-16">Create and manage coupon codes for promotions</p>
          </div>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => fetchCoupons()} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all hover:bg-slate-800">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </motion.button>
        </div>
      </motion.div>

      {/* Create Form */}
      <motion.div variants={fadeUp} custom={1} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-6 md:p-7 rounded-2xl border border-slate-700/50 mb-8 backdrop-blur-sm">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
          <FiPlus className="text-pink-400" size={16} /> New Coupon
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div whileHover={{ scale: 1.01 }} className="relative">
            <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              placeholder="Code (e.g. FRESH20)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full bg-slate-900/50 border border-slate-700/50 p-3 pl-10 rounded-xl uppercase font-bold text-sm text-slate-200 outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/30 transition-all placeholder-slate-600 hover:border-slate-600/50"
              required
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} className="relative">
            <FiPercent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="number"
              placeholder="Discount %"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700/50 p-3 pl-10 rounded-xl text-sm font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/30 transition-all placeholder-slate-600 hover:border-slate-600/50"
              required min="1" max="100"
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} className="relative">
            <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="number"
              placeholder="Min Order (optional)"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700/50 p-3 pl-10 rounded-xl text-sm font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500/30 transition-all placeholder-slate-600 hover:border-slate-600/50"
              min="0"
            />
          </motion.div>
          <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} type="submit" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl py-3 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all text-sm flex items-center justify-center gap-2 hover:from-pink-600 hover:to-rose-600">
            <FiPlus size={15} /> Create
          </motion.button>
        </form>
      </motion.div>

      {/* Coupon List */}
      <motion.div variants={fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Offers</h3>
          <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">{coupons.length} total</span>
        </div>

        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <CouponSkeleton key={i} />)
          ) : coupons.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-2xl border border-dashed border-slate-700/50">
              <div className="w-14 h-14 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 border border-slate-700/30">
                <FiTag size={24} />
              </div>
              <h3 className="text-slate-300 font-bold">No Active Coupons</h3>
              <p className="text-slate-500 text-sm mt-1">Create your first coupon to get started</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {coupons.map((coupon, index) => (
                <motion.div
                  key={coupon._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, ease }}
                  whileHover={{ y: -2, scale: 1.01, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-5 rounded-2xl flex justify-between items-center border border-slate-700/50 border-l-4 border-l-pink-500 group hover:border-slate-600/50 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center text-pink-400 font-bold text-lg shrink-0 border border-pink-500/30">
                      {coupon.value}%
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white tracking-tight">{coupon.code}</h3>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => copyCode(coupon.code, coupon._id)}
                          className="p-1 text-slate-500 hover:text-pink-400 transition-colors"
                        >
                          {copiedId === coupon._id ? <FiCheck size={13} className="text-emerald-400" /> : <FiCopy size={13} />}
                        </motion.button>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {coupon.value}% discount {coupon.minOrderAmount ? `• Min ₹${coupon.minOrderAmount}` : "• All orders"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(coupon._id)}
                    className="text-slate-500 p-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all opacity-50 group-hover:opacity-100"
                  >
                    <FiTrash2 size={18} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}