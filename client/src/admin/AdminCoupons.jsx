// AdminCoupons.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiTrash2, FiTag, FiPlus, FiRefreshCw, FiPercent, FiDollarSign, FiCopy, FiCheck, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

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

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [formData, setFormData] = useState({
    code: "", value: "", minOrderAmount: "", discountType: "percent", firstTimeOnly: false, expiresAt: "", userEmail: "", maxUses: ""
  });

  const dropdownRef = useRef(null);

  const fetchCoupons = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/coupons`, { withCredentials: true });
      setCoupons(data || []);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchUsers();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        firstTimeOnly: formData.firstTimeOnly,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        userEmail: formData.userEmail && formData.userEmail.trim() !== "" ? formData.userEmail.toLowerCase().trim() : null,
        maxUses: formData.maxUses ? Number(formData.maxUses) : 0,
      };

      await axios.post(`${API_URL}/api/coupons`, couponData, { withCredentials: true });
      setFormData({ code: "", value: "", minOrderAmount: "", discountType: "percent", firstTimeOnly: false, expiresAt: "", userEmail: "", maxUses: "" });
      setUserSearch("");
      fetchCoupons(true);
      toast.success("Coupon created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`${API_URL}/api/coupons/${id}`, { withCredentials: true });
      fetchCoupons(true);
      toast.success("Coupon deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Code copied");
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">Coupons</h1>
            <p className="text-sm text-stone-500">Manage discounts & offers</p>
          </div>
          <button onClick={() => fetchCoupons()} className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-colors">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <motion.div variants={fadeUp} custom={1} className="lg:col-span-1 h-fit bg-white p-10 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-stone-200/60 sticky top-4">
            <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center gap-2">
              Create New Offer
            </h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Coupon Code</label>
                <div className="relative">
                  <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    placeholder="e.g. WELCOME50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 uppercase font-bold text-stone-800 outline-none focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Discount %</label>
                  <div className="relative">
                    <FiPercent className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 font-bold text-stone-800 outline-none focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-300"
                      required
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Min Order</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 font-bold text-stone-800 outline-none focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-300"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Restrict to Account (Email)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email (optional)..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setShowUserDropdown(true);
                      setFormData({ ...formData, userEmail: e.target.value });
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 px-4 pr-10 font-medium text-stone-800 outline-none focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-300 text-sm"
                  />
                  {formData.userEmail && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, userEmail: "" });
                        setUserSearch("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-rose-500"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                {showUserDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl no-scrollbar">
                    {users.filter(u => 
                      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                      u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="p-4 text-xs text-stone-400 text-center font-medium">No users found</div>
                    ) : (
                      users.filter(u => 
                        u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      ).map((u) => (
                        <div
                          key={u._id}
                          onClick={() => {
                            setFormData({ ...formData, userEmail: u.email });
                            setUserSearch(`${u.name} (${u.email})`);
                            setShowUserDropdown(false);
                          }}
                          className="px-4 py-2.5 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0 transition-colors text-left"
                        >
                          <div className="text-xs font-bold text-stone-800">{u.name}</div>
                          <div className="text-[10px] text-stone-400 font-medium">{u.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Expiration Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-[#FAFAFA] border border-stone-200 rounded-xl py-3.5 px-4 font-medium text-stone-700 outline-none focus:bg-white focus:border-stone-400 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Total Usage Limit (0 = Unlimited)</label>
                <input
                  type="number"
                  placeholder="e.g. 50 (optional)"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 px-4 font-bold text-stone-800 outline-none focus:bg-white focus:border-stone-400 transition-all placeholder:text-stone-300 text-sm"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-3 py-2 border-t border-stone-100 mt-2">
                <input
                  type="checkbox"
                  id="firstTimeOnly"
                  checked={formData.firstTimeOnly}
                  onChange={(e) => setFormData({ ...formData, firstTimeOnly: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                />
                <label htmlFor="firstTimeOnly" className="text-xs font-bold text-stone-600 cursor-pointer">Valid for First-Time Users Only</label>
              </div>

              <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-stone-800 transition-all shadow-lg flex items-center justify-center gap-2 mt-4">
                <FiPlus size={16} /> Create Coupon
              </button>
            </form>
          </motion.div>

          {/* Coupon List */}
          <motion.div variants={fadeUp} custom={2} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Coupons</h3>
              <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">{coupons.length} total</span>
            </div>

            <AnimatePresence>
              {loading ? (
                <div className="py-20 flex justify-center">
                  <SeaBiteLoader />
                </div>
              ) : coupons.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300"><FiTag size={24} /></div>
                  <p className="text-stone-500 font-medium">No active coupons</p>
                </motion.div>
              ) : (
                coupons.map((coupon) => (
                  <motion.div
                    key={coupon._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-all group flex items-center gap-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-stone-900">{coupon.value}%</span>
                      <span className="text-[8px] font-bold text-stone-400 uppercase">OFF</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-stone-900 tracking-tight">{coupon.code}</h3>
                        <button
                          onClick={() => copyCode(coupon.code, coupon._id)}
                          className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          {copiedId === coupon._id ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-stone-500 truncate">
                          {coupon.minOrderAmount ? `Orders over ₹${coupon.minOrderAmount}` : "No minimum order amount"}
                        </p>
                        {coupon.firstTimeOnly && (
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">New Users</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-bold text-stone-400">
                        {coupon.userEmail && (
                          <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">📧 {coupon.userEmail}</span>
                        )}
                        {coupon.expiresAt && (
                          <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">🕒 Exp: {new Date(coupon.expiresAt).toLocaleString("en-IN")}</span>
                        )}
                        {coupon.maxUses > 0 ? (
                          <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">📊 Uses: {coupon.usedCount} / {coupon.maxUses}</span>
                        ) : (
                          <span className="bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">📊 Uses: {coupon.usedCount} / ∞</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className="p-3 rounded-xl text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}