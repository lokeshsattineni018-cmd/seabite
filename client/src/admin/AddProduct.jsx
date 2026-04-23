// AddProduct.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  FiUploadCloud, FiX, FiCheck, FiDollarSign,
  FiType, FiLayers, FiTrendingUp, FiBox,
  FiPlus, FiImage, FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.6, ease },
  }),
};

export default function AddProduct() {
  const [form, setForm] = useState({
    name: "", category: "", basePrice: "", buyingPrice: "", unit: "kg", desc: "", trending: false, stock: "in", countInStock: 10,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const backendBase = import.meta.env.VITE_API_URL || "";

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
      setModal({ show: true, message: "Upload a valid image", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setModal({ show: true, message: "Image too large (Max 5MB)", type: "error" });
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

  const handleGalleryImages = (e) => {
    const files = Array.from(e.target.files);
    if (galleryImages.length + files.length > 5) {
      setModal({ show: true, message: "Max 5 gallery images allowed", type: "error" });
      return;
    }
    
    const newFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        setModal({ show: true, message: `${file.name} is not a valid image`, type: "error" });
        return false;
      }
      return true;
    });

    setGalleryImages([...galleryImages, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setGalleryPreviews([...galleryPreviews, ...newPreviews]);
  };

  const removeGalleryImage = (index) => {
    const newImages = [...galleryImages];
    const newPreviews = [...galleryPreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setGalleryImages(newImages);
    setGalleryPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!image) {
      setModal({ show: true, message: "Product image is required", type: "error" });
      setLoading(false);
      return;
    }
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => data.append(key, form[key]));
      if (image) data.append("image", image);
      galleryImages.forEach(img => data.append("images", img));
      await axios.post(`${backendBase}/api/admin/products`, data, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setModal({ show: true, message: "Product added successfully", type: "success" });
      setForm({ name: "", category: "", basePrice: "", buyingPrice: "", unit: "kg", desc: "", trending: false, stock: "in", countInStock: 10 });
      removeImage();
      setGalleryImages([]);
      setGalleryPreviews([]);
    } catch (err) {
      setModal({ show: true, message: "Failed to add product", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div variants={fadeUp} className="border-b border-stone-200/50 pb-6">
          <h1 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight mb-2">Add Product</h1>
          <p className="text-sm text-stone-500">Create a new inventory listing</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image & Toggles */}
          <motion.div variants={fadeUp} custom={1} className="lg:col-span-1 space-y-6">
            {/* Image Upload */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Product Image</label>
              <div
                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImage({ target: { files: e.dataTransfer.files } }); }}
                onClick={() => !preview && fileInputRef.current.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                <AnimatePresence>
                  {preview ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 group">
                      <img src={preview} alt="Preview" className="w-full h-full object-contain p-4" />
                      <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }} className="bg-white p-3 rounded-full text-rose-500 hover:bg-rose-50 shadow-lg transition-transform hover:scale-110">
                          <FiX size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-stone-400">
                        <FiImage size={24} />
                      </div>
                      <p className="text-sm font-semibold text-stone-700">Click to upload</p>
                      <p className="text-xs text-stone-400 mt-1">or drag and drop</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Gallery Images */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Product Gallery (Max 5)</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {galleryPreviews.map((prev, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl border border-stone-100 overflow-hidden group">
                    <img src={prev} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-white/80 backdrop-blur p-1.5 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                {galleryPreviews.length < 5 && (
                  <div 
                    onClick={() => galleryInputRef.current.click()}
                    className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isGalleryDragging ? "border-blue-500 bg-blue-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"}`}
                    onDragOver={(e) => { e.preventDefault(); setIsGalleryDragging(true); }}
                    onDragLeave={() => setIsGalleryDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsGalleryDragging(false); handleGalleryImages({ target: { files: e.dataTransfer.files } }); }}
                  >
                    <FiPlus size={20} className="text-stone-400" />
                    <span className="text-[10px] font-bold text-stone-400 mt-1">Add Image</span>
                    <input ref={galleryInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryImages} />
                  </div>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${form.trending ? "bg-amber-100 text-amber-600" : "bg-stone-100 text-stone-400"}`}>
                  <FiTrendingUp size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-stone-900">Trending</p>
                  <p className="text-[10px] text-stone-400">Feature on home</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} />
                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-stone-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
              </label>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-3xl">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertCircle className="text-blue-500" size={16} />
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Tips</span>
              </div>
              <ul className="text-xs text-blue-600/80 space-y-1 ml-1">
                <li>• Use high-res images (w/ transparent bg)</li>
                <li>• Keep descriptions concise</li>
                <li>• Ensure pricing matches unit (kg/g)</li>
              </ul>
            </div>
          </motion.div>

          {/* Right Column - Inputs */}
          <motion.div variants={fadeUp} custom={2} className="lg:col-span-2">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Product Name</label>
                <div className="relative">
                  <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Atlantic Salmon"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-stone-400 focus:bg-white transition-all font-medium text-stone-900"
                  />
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative">
                    <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <select name="category" value={form.category} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-stone-400 focus:bg-white transition-all font-medium text-stone-600 appearance-none cursor-pointer">
                      <option value="">Select Category...</option>
                      <option value="Fish">Fish</option>
                      <option value="Prawn">Prawn</option>
                      <option value="Crab">Crab</option>
                      <option value="Squid">Squid</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Unit Type</label>
                  <div className="relative">
                    <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-stone-400 focus:bg-white transition-all font-medium text-stone-600 appearance-none cursor-pointer">
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="pc">Piece (pc)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Selling Price</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} placeholder="0.00" className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-stone-400 focus:bg-white transition-all font-mono font-medium text-stone-900" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Cost Price</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input type="number" name="buyingPrice" value={form.buyingPrice} onChange={handleChange} placeholder="0.00" className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-stone-400 focus:bg-white transition-all font-mono font-medium text-stone-900" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Description</label>
                <textarea name="desc" value={form.desc} onChange={handleChange} rows="4" placeholder="Detail the cut breakdown, freshness, and origin..." className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 outline-none focus:border-stone-400 focus:bg-white transition-all text-sm leading-relaxed text-stone-700 resize-none" />
              </div>

              {/* Inventory Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Availability</label>
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
                  <button type="button" onClick={() => setForm({ ...form, stock: "in" })} className={`py-3 rounded-xl border-2 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${form.stock === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-stone-100 text-stone-400 hover:border-stone-200"}`}>
                    In Stock {form.stock === "in" && <FiCheck />}
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, stock: "out", countInStock: 0 })} className={`py-3 rounded-xl border-2 font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all ${form.stock === "out" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-stone-100 text-stone-400 hover:border-stone-200"}`}>
                    Out of Stock {form.stock === "out" && <FiCheck />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => window.history.back()} className="flex-1 py-3.5 rounded-xl border border-stone-200 text-stone-500 font-bold text-xs uppercase hover:bg-stone-50 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-3.5 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:bg-stone-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <SeaBiteLoader small /> : <><FiPlus size={16} /> Create Product</>}
                </button>
              </div>

            </div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}