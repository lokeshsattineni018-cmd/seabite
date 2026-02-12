// AdminCoupons.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2, FiTag, FiPlus, FiRefreshCw, FiPercent, FiDollarSign, FiCopy } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.5, ease },
  }),
};

const CouponSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100 animate-pulse">
    <div className="space-y-2"><div className="h-5 w-32 bg-slate-100 rounded" /><div className="h-3 w-48 bg-slate-50 rounded" /></div>
    <div className="h-8 w-8 bg-slate-50 rounded-lg" />
  </div>
);

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({ code: "", value: "", minOrderAmount: "" });

  const fetchCoupons = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/coupons", { withCredentials: true });
      setCoupons(res.data || []);
    } catch (err) {
      console.error("Fetch coupons error:", err);
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
      await axios.post("/api/coupons", formData, { withCredentials: true });
      setFormData({ code: "", value: "", minOrderAmount: "" });
      fetchCoupons(true);
    } catch {
      alert("Error creating coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`/api/coupons/${id}`, { withCredentials: true });
      fetchCoupons(true);
    } catch (err) {
      console.error("Delete coupon error:", err);
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-10 min-h-screen font-sans">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><FiTag size={18} /></div>
            Coupons
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1.5 ml-[52px]">Manage discount codes and offers</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchCoupons()} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
        </motion.button>
      </motion.div>

      {/* Create Form */}
      <motion.div variants={fadeUp} custom={1} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2 text-sm">
          <FiPlus className="text-blue-500" size={16} /> Create New Coupon
        </h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="relative">
            <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              placeholder="Code (e.g. FRESH20)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl uppercase font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
              required
            />
          </div>
          <div className="relative">
            <FiPercent className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="number"
              placeholder="Discount %"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
              required
            />
          </div>
          <div className="relative">
            <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="number"
              placeholder="Min Order"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
            />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} type="submit" className="bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-blue-600 transition-all shadow-lg text-sm flex items-center justify-center gap-2">
            <FiPlus size={15} /> Create
          </motion.button>
        </form>
      </motion.div>

      {/* Coupon List */}
      <motion.div variants={fadeUp} custom={2}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Offers</h3>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{coupons.length} total</span>
        </div>
        
        <div className="space-y-3 max-w-4xl">
          {loading ? (
            [...Array(3)].map((_, i) => <CouponSkeleton key={i} />)
          ) : (
            <AnimatePresence>
              {coupons.map((coupon, index) => (
                <motion.div
                  key={coupon._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.04, ease }}
                  whileHover={{ y: -2 }}
                  className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100 border-l-4 border-l-blue-500 group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                      {coupon.value}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{coupon.code}</h3>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => copyCode(coupon.code, coupon._id)}
                          className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                          title="Copy code"
                        >
                          {copiedId === coupon._id ? <FiCheck size={13} className="text-emerald-500" /> : <FiCopy size={13} />}
                        </motion.button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {coupon.value}% discount {coupon.minOrderAmount ? `on orders above ₹${coupon.minOrderAmount}` : "on all orders"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(coupon._id)}
                    className="text-slate-300 p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all opacity-60 group-hover:opacity-100"
                  >
                    <FiTrash2 size={18} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {!loading && coupons.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><FiTag size={24} /></div>
              <h3 className="text-slate-900 font-bold">No Active Coupons</h3>
              <p className="text-slate-400 text-sm mt-1">Create your first coupon above</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}