import { useEffect, useState, memo } from "react";
import axios from "axios";
import { FiTrash2, FiTag, FiPlus, FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";

// ✅ NEW: Skeleton Loader for Coupons to stop white flashes
const CouponSkeleton = () => (
  <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-slate-200 animate-pulse">
    <div className="space-y-2">
      <div className="h-5 w-32 bg-slate-100 rounded" />
      <div className="h-3 w-48 bg-slate-50 rounded" />
    </div>
    <div className="h-8 w-8 bg-slate-50 rounded-lg" />
  </div>
);

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Added loading state
  const [formData, setFormData] = useState({
    code: "",
    value: "",
    minOrderAmount: "",
  });

  const fetchCoupons = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/coupons", {
        withCredentials: true,
      });
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
      await axios.post("/api/coupons", formData, {
        withCredentials: true,
      });
      setFormData({ code: "", value: "", minOrderAmount: "" });
      fetchCoupons(true); // Silent refresh
    } catch (err) {
      alert("Error creating coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`/api/coupons/${id}`, {
        withCredentials: true,
      });
      fetchCoupons(true); // Silent refresh
    } catch (err) {
      console.error("Delete coupon error:", err);
    }
  };

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <FiTag className="text-blue-600" />
          Manage Coupons
        </h1>
        <button
          onClick={() => fetchCoupons()}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
        </button>
      </div>

      {/* CREATE FORM */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-10"
      >
        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
          <FiPlus className="text-blue-600" /> Create New Coupon
        </h3>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            placeholder="Code (e.g. FRESH20)"
            value={formData.code}
            onChange={(e) =>
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase(),
              })
            }
            className="bg-slate-50 border border-slate-200 p-3 rounded-xl uppercase font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
            required
          />
          <input
            type="number"
            placeholder="Discount %"
            value={formData.value}
            onChange={(e) =>
              setFormData({ ...formData, value: e.target.value })
            }
            className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
            required
          />
          <input
            type="number"
            placeholder="Min Order ₹"
            value={formData.minOrderAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                minOrderAmount: e.target.value,
              })
            }
            className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white font-bold rounded-xl py-3 hover:bg-blue-600 transition-all shadow-lg active:scale-95"
          >
            Create Coupon
          </button>
        </form>
      </motion.div>

      {/* COUPON LIST */}
      <div className="space-y-4 max-w-4xl">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Existing Offers</h3>
        {loading ? (
          // ✅ Show Skeletons during navigation
          [...Array(3)].map((_, i) => <CouponSkeleton key={i} />)
        ) : (
          <>
            {coupons.map((coupon, index) => (
              <motion.div
                key={coupon._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-5 rounded-2xl shadow-sm flex justify-between items-center border border-slate-200 border-l-4 border-l-blue-600 group hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {coupon.code}
                  </h3>
                  <p className="text-xs font-bold text-blue-600 uppercase mt-1">
                    {coupon.value}% Off <span className="text-slate-300 mx-2">|</span> 
                    <span className="text-slate-500">Min Order: ₹{coupon.minOrderAmount || 0}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(coupon._id)}
                  className="text-slate-300 p-3 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                >
                  <FiTrash2 size={20} />
                </button>
              </motion.div>
            ))}
            {coupons.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <FiTag className="mx-auto text-slate-200 text-5xl mb-4" />
                <p className="text-slate-400 font-medium">No active coupons found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}