import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiPackage, FiTag, FiDollarSign, FiImage,
  FiPlus, FiTrash2, FiSave, FiAlertCircle
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5 }
  })
};

export default function AddProduct() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "seafood",
    stock: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.basePrice || imagePreview.length === 0) {
      return toast.error("Fill all required fields");
    }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("basePrice", formData.basePrice);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("stock", formData.stock || 0);
    
    formData.images.forEach(file => {
      formDataToSend.append("images", file);
    });

    try {
      await axios.post("/api/admin/products", formDataToSend, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Product added successfully!");
      setFormData({ name: "", description: "", basePrice: "", category: "seafood", stock: "", images: [] });
      setImagePreview([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
            <FiPackage size={24} />
          </motion.div>
          Add New Product
        </h1>
        <p className="text-slate-400 text-sm mt-2 ml-16">Create a new product for your catalog</p>
      </motion.div>

      <motion.div variants={fadeUp} custom={1} className="max-w-4xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400" />
              Basic Information
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                  placeholder="e.g., Fresh Atlantic Salmon"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-green-500/40 transition-all resize-none"
                  placeholder="Describe your product..."
                  rows="4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                  >
                    <option value="seafood">Seafood</option>
                    <option value="fish">Fish</option>
                    <option value="shrimp">Shrimp</option>
                    <option value="crab">Crab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (₹) *</label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleChange}
                      className="w-full bg-slate-900/50 border border-slate-700/50 p-3 pl-9 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                      placeholder="0.00"
                      required
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700/50 p-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-green-500/40 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400" />
              Product Images
            </h3>

            <div className="mb-5">
              <label className="block w-full border-2 border-dashed border-slate-700/50 rounded-xl p-6 text-center cursor-pointer hover:border-green-500/30 transition-all">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                    <FiImage size={20} />
                  </div>
                  <div>
                    <p className="text-white font-bold">Click to upload or drag and drop</p>
                    <p className="text-slate-400 text-xs">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {imagePreview.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Uploaded Images ({imagePreview.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {imagePreview.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img src={img} alt={`Preview ${i}`} className="w-full h-24 object-cover rounded-lg border border-slate-700/50" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <FiTrash2 className="text-red-400" size={20} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-6 border-t border-slate-700/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Creating..." : <>
                <FiSave size={16} /> Create Product
              </>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}