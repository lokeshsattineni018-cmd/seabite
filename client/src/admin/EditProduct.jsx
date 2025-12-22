import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { FiType, FiDollarSign, FiTag, FiImage, FiTrendingUp, FiCheck, FiArrowLeft, FiSave, FiBox } from "react-icons/fi"; 
import PopupModal from "../components/PopupModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    category: "",
    basePrice: "", 
    unit: "kg",    
    desc: "",
    image: "",
    trending: false,
    stock: "in",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const filename = imagePath.split(/[/\\]/).pop();
    return `${API_URL}/uploads/${filename}`;
  };

  useEffect(() => {
    axios
      .get(`${API_URL}/api/admin/products/${id}`, { 
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setForm({
            ...res.data,
            basePrice: res.data.basePrice || "", 
            unit: res.data.unit || "kg",
            stock: res.data.stock || "in",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setModal({ show: true, message: "Failed to load product data.", type: "error" });
        setLoading(false);
      });
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put( 
        `${API_URL}/api/admin/products/${id}`,
        {
          name: form.name,
          category: form.category,
          basePrice: Number(form.basePrice), 
          unit: form.unit,
          desc: form.desc,
          image: form.image,
          trending: form.trending,
          stock: form.stock,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModal({ show: true, message: "Product updated successfully!", type: "success" });
      setTimeout(() => navigate("/admin/products"), 1500);
    } catch (err) {
      setModal({ show: true, message: "Update failed.", type: "error" });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Loading Product Data...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen relative font-sans">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      {/* HEADER - Mobile Responsive */}
      <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="mb-6 md:mb-8 flex items-center gap-4 max-w-5xl mx-auto">
        <button 
            onClick={() => navigate("/admin/products")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow-sm shrink-0"
        >
            <FiArrowLeft size={18} />
        </button>
        <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight truncate">Edit Product</h1>
            <p className="text-slate-500 text-xs md:text-sm truncate">Update <span className="font-semibold text-slate-900">{form.name}</span></p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
        
        {/* === LEFT COL: VISUALS === */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-3 md:mb-4 uppercase tracking-wider">Product Visual</label>
                <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-200 mb-4 flex items-center justify-center p-4">
                    {form.image ? (
                        <img src={getFullImageUrl(form.image)} alt="Preview" className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center"><FiImage size={32} /><span className="text-xs mt-2 font-medium">No Image</span></div>
                    )}
                </div>
                <div className="relative">
                    <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.image} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-[10px] font-medium text-slate-400" disabled />
                </div>
            </div>

            <div onClick={() => setForm({...form, trending: !form.trending})} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${form.trending ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}><FiTrendingUp size={18} /></div>
                    <div>
                        <p className="font-bold text-slate-900 text-xs md:text-sm">Trending</p>
                        <p className="text-[10px] text-slate-500">Homepage highlight</p>
                    </div>
                </div>
                <div className={`w-10 h-5 md:w-11 md:h-6 bg-slate-200 rounded-full relative transition-colors ${form.trending ? 'bg-blue-600' : ''}`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white w-4 h-4 md:w-5 md:h-5 rounded-full shadow-sm transition-transform ${form.trending ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>
        </div>

        {/* === RIGHT COL: DETAILS === */}
        <div className="lg:col-span-2">
            <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 md:space-y-6">
                
                <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Product Name</label>
                    <div className="relative">
                        <FiType className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="name" value={form.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-900 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Category</label>
                        <div className="relative">
                            <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select name="category" value={form.category} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none appearance-none cursor-pointer text-sm font-semibold">
                                <option value="Fish">Fish</option><option value="Prawn">Prawn</option><option value="Crab">Crab</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Price (₹)</label>
                        <div className="relative">
                            <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="number" name="basePrice" value={form.basePrice} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none font-mono font-semibold text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Unit</label>
                        <div className="relative">
                            <FiBox className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none appearance-none text-sm font-semibold">
                                <option value="kg">kg</option><option value="g">g</option><option value="pc">pc</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Description</label>
                    <textarea name="desc" value={form.desc} onChange={handleChange} rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition-all font-medium text-sm resize-none" />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Availability</label>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div onClick={() => setForm({...form, stock: "in"})} className={`cursor-pointer rounded-xl p-3 md:p-4 border flex items-center justify-center gap-2 transition-all ${form.stock === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
                            <span className="text-xs md:text-sm font-bold">In Stock</span>
                            {form.stock === "in" && <FiCheck size={16} />}
                        </div>
                        <div onClick={() => setForm({...form, stock: "out"})} className={`cursor-pointer rounded-xl p-3 md:p-4 border flex items-center justify-center gap-2 transition-all ${form.stock === "out" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500"}`}>
                            <span className="text-xs md:text-sm font-bold">Out Stock</span>
                            {form.stock === "out" && <FiCheck size={16} />}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 pt-4 border-t">
                     <button type="button" onClick={() => navigate("/admin/products")} className="w-full md:w-auto px-8 py-3 rounded-lg font-bold text-xs uppercase text-slate-500 hover:bg-slate-100 transition-colors order-2 md:order-1">Cancel</button>
                     <button type="submit" disabled={submitting} className="w-full md:flex-1 bg-slate-900 text-white py-3.5 rounded-lg font-bold shadow-lg hover:bg-blue-600 transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-xs uppercase order-1 md:order-2">
                        {submitting ? "Saving..." : <><FiSave size={16} /> Save Changes</>}
                     </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
}