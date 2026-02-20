// AdminProducts.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiPackage,
  FiRefreshCw, FiGrid, FiList, FiFilter, FiMoreHorizontal
} from "react-icons/fi";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

// --- Design Constants ---
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

const formatPrice = (price) => price ? `₹${Number(price).toFixed(2)}` : "₹0.00";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const backendBase = import.meta.env.VITE_API_URL || "";
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });

  const fetchProducts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get(`${backendBase}/api/admin/products`, {
        params: search ? { search } : {},
        withCredentials: true,
      });
      setProducts(Array.isArray(res.data.products) ? res.data.products : []);
    } catch (err) {
      if (!isSilent) setModal({ show: true, message: "Failed to load products", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchProducts(!!search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${backendBase}/api/admin/products/${id}`, { withCredentials: true });
      setModal({ show: true, message: "Product deleted", type: "success" });
      fetchProducts(true);
    } catch {
      setModal({ show: true, message: "Delete failed", type: "error" });
    }
  };

  const getImageSrc = (img) => {
    if (!img) return "https://placehold.co/400?text=No+Image";
    if (img.startsWith("http")) return img;
    return `${backendBase}/uploads/${img.split(/[/\\]/).pop()}`;
  };

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = categoryFilter === "All" ? products : products.filter(p => p.category === categoryFilter);
  const inStock = products.filter((p) => p.stock === "in").length;

  return (
    <motion.div
      initial="hidden" animate="visible" variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white p-6 md:p-10 font-sans"
    >
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">Inventory</h1>
            <div className="flex items-center gap-3 text-sm text-stone-500">
              <span>Catalog Management</span>
              <span className="w-1 h-1 bg-stone-300 rounded-full" />
              <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {inStock} Active
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* View Toggle */}
            <div className="flex bg-stone-100/50 p-1 rounded-xl border border-stone-200/50">
              <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"}`}>
                <FiList size={16} />
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-stone-900" : "text-stone-400 hover:text-stone-600"}`}>
                <FiGrid size={16} />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm w-full sm:w-80 focus-within:ring-2 focus-within:ring-stone-200/50 transition-all">
              <FiSearch className="text-stone-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400 text-stone-700"
              />
              <div className="h-4 w-px bg-stone-200 mx-2" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-500 outline-none cursor-pointer hover:text-stone-800"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <Link to="/admin/add-product">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 rounded-xl font-medium text-sm shadow-lg shadow-stone-900/10 transition-colors">
                <FiPlus size={16} /> Add Product
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex justify-center">
              <SeaBiteLoader />
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div key="empty" variants={fadeUp} className="py-20 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                <FiPackage size={24} />
              </div>
              <p className="text-stone-500 font-medium">No products found</p>
              <button onClick={() => { setSearch(""); setCategoryFilter("All"); }} className="mt-2 text-sm text-stone-400 hover:text-stone-600 underline">Clear filters</button>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div key="grid" variants={staggerContainer} initial="hidden" animate="visible" exit="hidden" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((p) => (
                <motion.div key={p._id} variants={fadeUp} className="group bg-white rounded-3xl border border-stone-200/60 overflow-hidden hover:shadow-lg hover:border-stone-300/60 transition-all duration-300">
                  <div className="aspect-square bg-stone-50/30 p-6 relative flex items-center justify-center">
                    <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <Link to={`/admin/edit-product/${p._id}`}>
                        <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-300 transition-all"><FiEdit2 size={12} /></button>
                      </Link>
                      <button onClick={() => deleteProduct(p._id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-stone-100 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:border-rose-200 transition-all"><FiTrash2 size={12} /></button>
                    </div>
                    <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ring-2 ring-white ${p.stock === "in" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1">{p.category}</p>
                    <h3 className="font-bold text-stone-900 text-sm truncate">{p.name}</h3>
                    <div className="mt-2 font-mono text-stone-600 font-medium">{formatPrice(p.basePrice)}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="table" variants={fadeUp} className="bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredProducts.map((p) => (
                      <tr key={p._id} className="group hover:bg-stone-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 p-1 shrink-0">
                              <img src={getImageSrc(p.image)} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                              <p className="text-xs text-stone-400 truncate max-w-[200px]">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 text-stone-600 uppercase tracking-wide">{p.category}</span></td>
                        <td className="px-6 py-4 font-mono text-sm text-stone-700">{formatPrice(p.basePrice)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${p.stock === "in" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            <span className={`text-xs font-medium ${p.stock === "in" ? "text-emerald-700" : "text-rose-700"}`}>{p.stock === "in" ? "In Stock" : "Out"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/admin/edit-product/${p._id}`}><button className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all"><FiEdit2 size={14} /></button></Link>
                            <button onClick={() => deleteProduct(p._id)} className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><FiTrash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}