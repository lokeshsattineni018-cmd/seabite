import { useState, useRef } from "react";
import axios from "axios";
import {
  FiUploadCloud,
  FiX,
  FiCheck,
  FiDollarSign,
  FiType,
  FiLayers,
  FiTrendingUp,
  FiBox,
  FiPlus,
  FiAlertCircle,
  FiImage,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import PopupModal from "../components/PopupModal";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function AddProduct() {
  const [form, setForm] = useState({
    name: "",
    category: "",
    basePrice: "",
    unit: "kg",
    desc: "",
    trending: false,
    stock: "in",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    if (!file.type.startsWith("image/")) {
      setModal({
        show: true,
        message: "Please upload a valid image file.",
        type: "error",
      });
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setModal({
        show: true,
        message: "Image is too large. Please upload an image under 4.5MB.",
        type: "error",
      });
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
      setModal({
        show: true,
        message: "Please upload a product image.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    if (!form.category || !form.basePrice || !form.unit) {
      setModal({
        show: true,
        message: "Please fill in all required fields.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("category", form.category);
      data.append("basePrice", form.basePrice);
      data.append("unit", form.unit);
      data.append("desc", form.desc);
      data.append("trending", form.trending);
      data.append("stock", form.stock);
      data.append("image", image);

      const response = await axios.post(`${API_URL}/api/admin/products`, data, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        setModal({
          show: true,
          message: "Product added successfully!",
          type: "success",
        });
        setForm({
          name: "",
          category: "",
          basePrice: "",
          unit: "kg",
          desc: "",
          trending: false,
          stock: "in",
        });
        removeImage();
      }
    } catch (err) {
      const errorMsg =
        err.response?.status === 500
          ? "Server Error: Check if Cloudinary keys are set in Vercel."
          : err.response?.data?.message || "Failed to add product.";

      setModal({ show: true, message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen relative font-sans">
      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8 max-w-5xl mx-auto"
      >
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Add New Product
        </h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1">
          Create a new listing for your inventory.
        </p>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
      >
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-xs md:text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
              Product Image
            </label>

            <div
              className={`relative h-56 md:h-64 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !preview && fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />

              <AnimatePresence>
                {preview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative group"
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                      <FiImage size={24} />
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-slate-900">
                      Tap to upload
                    </p>
                    <p className="hidden md:block text-[10px] text-slate-500 mt-1">
                      or drag and drop here
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                  form.trending
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <FiTrendingUp size={18} />
              </div>
              <div>
                <p className="font-bold text-xs md:text-sm text-slate-900">
                  Trending Item
                </p>
                <p className="text-[10px] text-slate-500">
                  Highlight on homepage
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.trending}
                onChange={() =>
                  setForm({ ...form, trending: !form.trending })
                }
              />
              <div className="w-10 h-5 md:w-11 md:h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 md:space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                Product Name
              </label>
              <div className="relative">
                <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Atlantic Salmon"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Category
                </label>
                <div className="relative">
                  <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all font-semibold text-slate-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select...</option>
                    <option value="Fish">Fish</option>
                    <option value="Prawn">Prawn</option>
                    <option value="Crab">Crab</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Price (₹)
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    name="basePrice"
                    value={form.basePrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all font-mono font-semibold text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                  Unit
                </label>
                <div className="relative">
                  <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all font-semibold text-slate-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="pc">Piece (pc)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                Description
              </label>
              <textarea
                name="desc"
                value={form.desc}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the product details..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all font-medium text-slate-900 text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">
                Availability
              </label>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div
                  onClick={() => setForm({ ...form, stock: "in" })}
                  className={`cursor-pointer rounded-xl p-3 md:p-4 border flex items-center justify-center gap-2 transition-all ${
                    form.stock === "in"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold">
                    In Stock
                  </span>
                  {form.stock === "in" && <FiCheck size={16} />}
                </div>

                <div
                  onClick={() => setForm({ ...form, stock: "out" })}
                  className={`cursor-pointer rounded-xl p-3 md:p-4 border flex items-center justify-center gap-2 transition-all ${
                    form.stock === "out"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold">
                    Out Stock
                  </span>
                  {form.stock === "out" && <FiCheck size={16} />}
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row justify-end gap-3 md:gap-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="order-2 md:order-1 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wide text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="order-1 md:order-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiPlus size={16} /> Add Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
