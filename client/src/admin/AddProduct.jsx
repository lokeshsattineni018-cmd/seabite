// AddProduct.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  FiUploadCloud, FiX, FiCheck, FiDollarSign,
  FiType, FiLayers, FiTrendingUp, FiBox,
  FiPlus, FiImage, FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import PopupModal from "../components/PopupModal";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.06, duration: 0.5, ease },
  }),
};

const AddProductSkeleton = () => (
  <div className="p-4 md:p-10 min-h-screen max-w-5xl mx-auto animate-pulse">
    <div className="mb-8 space-y-2"><div className="h-8 w-64 bg-slate-200/60 rounded-lg" /><div className="h-4 w-48 bg-slate-100 rounded" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6"><div className="h-64 bg-white border border-slate-100 rounded-2xl" /><div className="h-20 bg-white border border-slate-100 rounded-2xl" /></div>
      <div className="lg:col-span-2"><div className="h-[600px] bg-white border border-slate-100 rounded-2xl" /></div>
    </div>
  </div>
);

export default function AddProduct() {
  const [form, setForm] = useState({
    name: "", category: "", basePrice: "", unit: "kg", desc: "", trending: false, stock: "in",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const fileInputRef = useRef(null);
  const backendBase = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    if (!file.type.startsWith("image/")) {
      setModal({ show: true, message: "Please upload a valid image file.", type: "error" });
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setModal({ show: true, message: "Image too large (Max 4.5MB).", type: "error" });
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!image) {
      setModal({ show: true, message: "Please upload a product image.", type: "error" });
      setLoading(false);
      return;
    }
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => data.append(key, form[key]));
      data.append("image", image);
      const response = await axios.post(`${backendBase}/api/admin/products`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 201) {
        setModal({ show: true, message: "Product added successfully!", type: "success" });
        setForm({ name: "", category: "", basePrice: "", unit: "kg", desc: "", trending: false, stock: "in" });
        removeImage();
      }
    } catch (err) {
      setModal({ show: true, message: err.response?.data?.message || "Failed to add product.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) return <AddProductSkeleton />;

  return (
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-10 min-h-screen relative font-sans">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <motion.div variants={fadeUp} custom={0} className="mb-6 md:mb-8 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Add New Product</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1">Create a new listing for your inventory</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 max-w-5xl mx-auto">
        {/* Left Column */}
        <motion.div variants={fadeUp} custom={1} className="lg:col-span-1 space-y-4 md:space-y-5">
          {/* Image Upload */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Product Image</label>
            <div
              className={`relative h-52 md:h-60 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/50"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
              onClick={() => !preview && fileInputRef.current.click()}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <AnimatePresence>
                {preview ? (
                  <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full relative group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="bg-white p-2.5 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg">
                        <FiX size={18} />
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-500"><FiImage size={22} /></div>
                    <p className="text-xs font-semibold text-slate-700">Tap to upload</p>
                    <p className="hidden md:block text-[10px] text-slate-400 mt-1">or drag and drop here</p>
                    <p className="text-[9px] text-slate-400 mt-2">Max 4.5MB</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Trending Toggle */}
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${form.trending ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}><FiTrendingUp size={16} /></div>
              <div><p className="font-semibold text-sm text-slate-900">Trending</p><p className="text-[10px] text-slate-400">Highlight on homepage</p></div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={form.trending} onChange={() => setForm({ ...form, trending: !form.trending })} />
              <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><FiAlertCircle size={13} className="text-blue-500" /><p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Tips</p></div>
            <ul className="text-[10px] text-blue-600 space-y-1 leading-relaxed">
              <li>Use high-quality product photos</li>
              <li>Set accurate pricing per unit</li>
              <li>Mark trending for homepage visibility</li>
            </ul>
          </div>
        </motion.div>

        {/* Right Column - Form Fields */}
        <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-5 md:space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
              <div className="relative"><FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Atlantic Salmon" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold text-slate-900 text-sm" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="relative"><FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><select name="category" value={form.category} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-400 transition-all font-semibold text-slate-900 text-sm appearance-none cursor-pointer"><option value="">Select...</option><option value="Fish">Fish</option><option value="Prawn">Prawn</option><option value="Crab">Crab</option></select></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Price</label>
                <div className="relative"><FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-400 transition-all font-mono font-semibold text-slate-900 text-sm" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <div className="relative"><FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} /><select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-400 transition-all font-semibold text-slate-900 text-sm appearance-none cursor-pointer"><option value="kg">kg</option><option value="g">g</option><option value="pc">pc</option></select></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea name="desc" value={form.desc} onChange={handleChange} rows="4" placeholder="Describe the product details, freshness, origin..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-900 text-sm resize-none leading-relaxed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Availability</label>
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setForm({ ...form, stock: "in" })} className={`cursor-pointer rounded-xl p-3.5 border-2 flex items-center justify-center gap-2 transition-all ${form.stock === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:bg-slate-50 text-slate-500"}`}>
                  <span className="text-sm font-bold">In Stock</span>{form.stock === "in" && <FiCheck size={16} />}
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setForm({ ...form, stock: "out" })} className={`cursor-pointer rounded-xl p-3.5 border-2 flex items-center justify-center gap-2 transition-all ${form.stock === "out" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 hover:bg-slate-50 text-slate-500"}`}>
                  <span className="text-sm font-bold">Out of Stock</span>{form.stock === "out" && <FiCheck size={16} />}
                </motion.div>
              </div>
            </div>

            <div className="pt-5 flex flex-col md:flex-row justify-end gap-3 border-t border-slate-100 mt-6">
              <button type="button" onClick={() => window.history.back()} className="order-2 md:order-1 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="order-1 md:order-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiPlus size={15} /> Add Product</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}