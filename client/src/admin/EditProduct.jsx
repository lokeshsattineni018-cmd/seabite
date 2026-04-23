// EditProduct.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiType, FiDollarSign, FiTag, FiImage,
  FiTrendingUp, FiCheck, FiArrowLeft, FiSave, FiBox,
} from "react-icons/fi";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

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
    name: "", category: "", basePrice: "", buyingPrice: "", unit: "kg", desc: "", image: "", images: [], trending: false, stock: "in", countInStock: 0,
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
        setForm({ 
          ...data, 
          basePrice: data.basePrice || "", 
          buyingPrice: data.buyingPrice || "", 
          unit: data.unit || "kg", 
          stock: data.stock || "in", 
          countInStock: data.countInStock || 0,
          images: data.images || []
        });
        setLoading(false);
      })
      .catch((err) => {
        setModal({ show: true, message: "Product not found or access denied.", type: "error" });
        setTimeout(() => navigate("/admin/products"), 2000);
        setLoading(false);
      });
  }, [id, backendBase]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await axios.post(`${backendBase}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      setForm({ ...form, image: data.file || data.url });
      setModal({ show: true, message: "Main image uploaded!", type: "success" });
    } catch (err) {
      setModal({ show: true, message: "Image upload failed.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 5) {
      toast.error("Max 5 gallery images allowed");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Uploading gallery images...");

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        const { data } = await axios.post(`${backendBase}/api/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        });
        uploadedUrls.push(data.file || data.url);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      toast.success("Gallery updated", { id: toastId });
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const removeGalleryImage = (index) => {
    const newImages = [...form.images];
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`${backendBase}/api/admin/products/${id}`, {
        name: form.name, category: form.category, basePrice: Number(form.basePrice), buyingPrice: Number(form.buyingPrice),
        unit: form.unit, desc: form.desc, image: form.image, images: form.images, trending: form.trending, stock: form.stock, countInStock: Number(form.countInStock),
      }, { withCredentials: true });
      setModal({ show: true, message: "Product updated successfully!", type: "success" });
      setTimeout(() => navigate("/admin/products"), 1500);
    } catch (err) {
      setModal({ show: true, message: "Update failed.", type: "error" });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
      <SeaBiteLoader />
      <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mt-4">Loading product...</p>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4 border-b border-stone-200/50 pb-8">
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate("/admin/products")} className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-300 shadow-sm shrink-0 transition-colors">
            <FiArrowLeft size={20} />
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-3xl md:text-5xl font-light text-stone-900 tracking-tight">Edit Product</h1>
            <p className="text-stone-500 text-sm mt-1">Update details for <span className="font-bold text-stone-700">{form.name}</span></p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Visuals */}
          <motion.div variants={fadeUp} custom={1} className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60">
              <label className="block text-[10px] font-bold text-stone-400 mb-4 uppercase tracking-widest">Main Image</label>
              <div className="relative aspect-square rounded-2xl bg-stone-50 overflow-hidden border border-stone-100 mb-6 flex items-center justify-center p-6 group">
                {form.image ? (
                  <img src={getFullImageUrl(form.image)} alt="Preview" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="text-stone-300 flex flex-col items-center"><FiImage size={32} /><span className="text-xs mt-3 font-bold uppercase tracking-wider">No Image</span></div>
                )}
              </div>
              <div className="relative group cursor-pointer">
                <FiImage className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <input
                  value={form.image ? (form.image.length > 25 ? "..." + form.image.slice(-22) : form.image) : "Click to upload"}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-stone-500 outline-none group-hover:border-stone-300 transition-all"
                  readOnly
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60">
              <label className="block text-[10px] font-bold text-stone-400 mb-4 uppercase tracking-widest">Product Gallery (Max 5)</label>
              <div className="grid grid-cols-2 gap-3">
                {form.images?.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl border border-stone-100 overflow-hidden group">
                    <img src={getFullImageUrl(img)} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-white/80 backdrop-blur p-1.5 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                {form.images?.length < 5 && (
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-stone-300 hover:bg-stone-50 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <FiPlus size={20} className="text-stone-400" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <div onClick={() => setForm({ ...form, trending: !form.trending })} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${form.trending ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-400"}`}><FiTrendingUp size={20} /></div>
                <div><p className="font-bold text-stone-900">Trending Product</p><p className="text-xs text-stone-500 font-medium">Highlight on homepage</p></div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${form.trending ? "bg-amber-400" : "bg-stone-200"}`}>
                <div className={`absolute top-[2px] left-[2px] bg-white w-6 h-6 rounded-full shadow-sm transition-transform ${form.trending ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200/60 space-y-8">

              <div className="space-y-4">
                <h3 className="text-lg font-light text-stone-900 border-b border-stone-100 pb-2">Basic Info</h3>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Product Name</label>
                  <div className="relative">
                    <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input name="name" value={form.name} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all font-bold text-stone-900 text-base" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Category</label>
                    <div className="relative">
                      <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <select name="category" value={form.category} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none appearance-none cursor-pointer text-sm font-bold text-stone-700 focus:bg-white focus:border-stone-400 transition-all">
                        <option value="Fish">Fish</option>
                        <option value="Prawn">Prawn</option>
                        <option value="Crab">Crab</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Unit Type</label>
                    <div className="relative">
                      <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none appearance-none cursor-pointer text-sm font-bold text-stone-700 focus:bg-white focus:border-stone-400 transition-all">
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="pc">Piece (pc)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-light text-stone-900 border-b border-stone-100 pb-2 pt-2">Pricing & Profit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cost Price (Buying)</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input type="number" name="buyingPrice" value={form.buyingPrice} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none font-mono font-bold text-stone-900 focus:bg-white focus:border-stone-400 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Selling Price</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 outline-none font-mono font-bold text-stone-900 focus:bg-white focus:border-stone-400 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Product Description</label>
                <textarea name="desc" value={form.desc} onChange={handleChange} rows="4" className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 px-6 outline-none focus:bg-white focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all text-sm font-medium text-stone-600 resize-none leading-relaxed" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Inventory status & Count</label>
                  <div className="flex items-center gap-2">
                    <FiBox className="text-stone-400" size={14} />
                    <input
                      type="number"
                      name="countInStock"
                      value={form.countInStock}
                      onChange={handleChange}
                      className="w-20 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 focus:bg-white outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileTap={{ scale: 0.98 }} onClick={() => setForm({ ...form, stock: "in" })} className={`cursor-pointer rounded-2xl p-4 border-2 flex items-center justify-center gap-3 transition-all ${form.stock === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200"}`}>
                    <span className="text-sm font-bold">In Stock</span>{form.stock === "in" && <FiCheck size={18} />}
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.98 }} onClick={() => setForm({ ...form, stock: "out", countInStock: 0 })} className={`cursor-pointer rounded-2xl p-4 border-2 flex items-center justify-center gap-3 transition-all ${form.stock === "out" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-stone-100 bg-stone-50 text-stone-400 hover:border-stone-200"}`}>
                    <span className="text-sm font-bold">Out of Stock</span>{form.stock === "out" && <FiCheck size={18} />}
                  </motion.div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                <button type="button" onClick={() => navigate("/admin/products")} className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors order-2 md:order-1">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting} className="w-full md:flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-stone-200 hover:bg-stone-800 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-xs uppercase tracking-widest order-1 md:order-2">
                  {submitting ? <><SeaBiteLoader small /> Saving...</> : <><FiSave size={18} /> Save Changes</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}