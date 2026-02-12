// EditProduct.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiType, FiDollarSign, FiTag, FiImage,
  FiTrendingUp, FiCheck, FiArrowLeft, FiSave, FiBox,
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.06, duration: 0.5, ease },
  }),
};

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const backendBase = import.meta.env.VITE_API_URL || "";

  const [form, setForm] = useState({
    name: "", category: "", basePrice: "", unit: "kg", desc: "", image: "", trending: false, stock: "in",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    const filename = imagePath.split(/[/\\]/).pop();
    return `${backendBase}/uploads/${filename}`;
  };

  useEffect(() => {
    axios
      .get(`${backendBase}/api/admin/products/${id}`, { withCredentials: true })
      .then((res) => {
        const data = res.data || {};
        setForm({ ...data, basePrice: data.basePrice || "", unit: data.unit || "kg", stock: data.stock || "in" });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Edit product load error:", err);
        setModal({ show: true, message: "Failed to load product data.", type: "error" });
        setLoading(false);
      });
  }, [id, backendBase]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${backendBase}/api/admin/products/${id}`, {
        name: form.name, category: form.category, basePrice: Number(form.basePrice),
        unit: form.unit, desc: form.desc, image: form.image, trending: form.trending, stock: form.stock,
      }, { withCredentials: true });
      setModal({ show: true, message: "Product updated successfully!", type: "success" });
      setTimeout(() => navigate("/admin/products"), 1500);
    } catch (err) {
      console.error("Edit product update error:", err);
      setModal({ show: true, message: "Update failed.", type: "error" });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
      <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-medium text-sm">Loading product...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-10 min-h-screen relative font-sans">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <motion.div variants={fadeUp} custom={0} className="mb-6 md:mb-8 flex items-center gap-4 max-w-5xl mx-auto">
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate("/admin/products")} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm shrink-0 transition-colors">
          <FiArrowLeft size={16} />
        </motion.button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight truncate">Edit Product</h1>
          <p className="text-slate-500 text-xs md:text-sm truncate">Update <span className="font-semibold text-slate-700">{form.name}</span></p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 max-w-5xl mx-auto">
        {/* Left Column */}
        <motion.div variants={fadeUp} custom={1} className="lg:col-span-1 space-y-4 md:space-y-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Product Visual</label>
            <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100 mb-4 flex items-center justify-center p-4">
              {form.image ? (
                <img src={getFullImageUrl(form.image)} alt="Preview" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center"><FiImage size={28} /><span className="text-xs mt-2 font-medium">No Image</span></div>
              )}
            </div>
            <div className="relative">
              <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
              <input value={form.image} className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-9 pr-4 text-[10px] font-medium text-slate-400" disabled />
            </div>
          </div>

          <div onClick={() => setForm({ ...form, trending: !form.trending })} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${form.trending ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}><FiTrendingUp size={16} /></div>
              <div><p className="font-semibold text-sm text-slate-900">Trending</p><p className="text-[10px] text-slate-400">Homepage highlight</p></div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.trending ? "bg-blue-600" : "bg-slate-200"}`}>
              <div className={`absolute top-[2px] left-[2px] bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.trending ? "translate-x-5" : "translate-x-0"}`} />
            </div>
          </div>
        </motion.div>

        {/* Right Column - Form */}
        <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-5 md:space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
              <div className="relative"><FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input name="name" value={form.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold text-slate-900 text-sm" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="relative"><FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><select name="category" value={form.category} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none appearance-none cursor-pointer text-sm font-semibold focus:border-blue-400 transition-all"><option value="Fish">Fish</option><option value="Prawn">Prawn</option><option value="Crab">Crab</option></select></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Price</label>
                <div className="relative"><FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none font-mono font-semibold text-sm focus:border-blue-400 transition-all" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <div className="relative"><FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none appearance-none text-sm font-semibold focus:border-blue-400 transition-all"><option value="kg">kg</option><option value="g">g</option><option value="pc">pc</option></select></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea name="desc" value={form.desc} onChange={handleChange} rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm resize-none leading-relaxed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Availability</label>
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setForm({ ...form, stock: "in" })} className={`cursor-pointer rounded-xl p-3.5 border-2 flex items-center justify-center gap-2 transition-all ${form.stock === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
                  <span className="text-sm font-bold">In Stock</span>{form.stock === "in" && <FiCheck size={16} />}
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setForm({ ...form, stock: "out" })} className={`cursor-pointer rounded-xl p-3.5 border-2 flex items-center justify-center gap-2 transition-all ${form.stock === "out" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
                  <span className="text-sm font-bold">Out of Stock</span>{form.stock === "out" && <FiCheck size={16} />}
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 pt-5 border-t border-slate-100">
              <button type="button" onClick={() => navigate("/admin/products")} className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors order-2 md:order-1">Cancel</button>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="w-full md:flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-xs uppercase order-1 md:order-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><FiSave size={15} /> Save Changes</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}