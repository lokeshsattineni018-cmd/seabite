// AdminProducts.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiPackage,
  FiRefreshCw, FiGrid, FiList, FiFilter,
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.5, ease },
  }),
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" /><div className="h-4 w-32 bg-slate-100 rounded" /></div></td>
    <td className="py-4 px-5"><div className="h-4 w-16 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-5"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
    <td className="py-4 px-5"><div className="h-4 w-12 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-5 text-right"><div className="h-8 w-16 bg-slate-100 rounded-lg ml-auto" /></td>
  </tr>
);

const SkeletonCard = () => (
  <div className="p-4 flex items-center gap-4 animate-pulse">
    <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-2"><div className="h-4 w-3/4 bg-slate-100 rounded" /><div className="h-3 w-1/2 bg-slate-100 rounded" /></div>
  </div>
);

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
      const data = res.data;
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      setProducts([]);
      setModal({ show: true, message: err.response?.data?.message || "Failed to load products.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(delay);
  }, [search]);

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${backendBase}/api/admin/products/${id}`, { withCredentials: true });
      setModal({ show: true, message: "Product deleted successfully.", type: "success" });
      fetchProducts(true);
    } catch {
      setModal({ show: true, message: "Failed to delete product.", type: "error" });
    }
  };

  const getImageSrc = (img) => {
    if (!img) return "https://placehold.co/400?text=No+Image";
    if (img.startsWith("http")) return img;
    const file = img.split(/[/\\]/).pop();
    return `${backendBase}/uploads/${file}`;
  };

  // Derived State
  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = categoryFilter === "All"
    ? products
    : products.filter(p => p.category === categoryFilter);

  const inStock = products.filter((p) => p.stock === "in").length;
  const outOfStock = products.filter((p) => p.stock !== "in").length;

  return (
    <motion.div initial="hidden" animate="visible" className="p-6 max-w-[1600px] mx-auto font-sans text-slate-900">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      {/* 🟢 Header Section */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm font-medium text-slate-500">Manage your product catalog</p>
            <div className="h-1 w-1 rounded-full bg-slate-300"></div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {inStock} Active
            </span>
            {outOfStock > 0 && (
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {outOfStock} Out
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          {/* Controls Group */}
          <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <FiList size={16} />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <FiGrid size={16} />
            </button>
          </div>

          {/* Filter & Search */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 pl-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all w-full sm:w-80">
            <FiSearch className="text-slate-400 shrink-0" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
            <div className="h-5 w-[1px] bg-slate-100 mx-1"></div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer hover:text-blue-600 transition-colors py-1 pr-2"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Link to="/admin/add-product">
            <motion.button whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 transition-all">
              <FiPlus size={16} />
              <span>Add Product</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* 🟢 Content View */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" && !loading ? (
          <motion.div
            key="grid"
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {filteredProducts.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, ease }}
                className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-square bg-slate-50/50 p-6 relative flex items-center justify-center">
                  <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-500 ease-out" />

                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                    <Link to={`/admin/edit-product/${p._id}`}>
                      <button className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-100 transition-colors">
                        <FiEdit2 size={12} />
                      </button>
                    </Link>
                    <button onClick={() => deleteProduct(p._id)} className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-100 transition-colors">
                      <FiTrash2 size={12} />
                    </button>
                  </div>

                  <div className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${p.stock === "in" ? "bg-emerald-500" : "bg-red-500"}`} title={p.stock === "in" ? "In Stock" : "Out of Stock"} />
                </div>

                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{p.category}</p>
                  <h3 className="font-bold text-slate-900 text-sm truncate leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <div className="flex items-baseline justify-between mt-3">
                    <span className="font-mono font-bold text-slate-900">{formatPrice(p.basePrice)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* 🟢 Table View */
          <motion.div
            key="table"
            variants={fadeUp}
            custom={1}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 text-slate-300">
                          <FiPackage size={24} />
                        </div>
                        <p className="text-slate-500 font-medium">No products found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p._id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 p-1 shrink-0">
                              <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                              {p.description && <p className="text-[10px] text-slate-400 max-w-[150px] truncate hidden md:block">{p.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide group-hover:bg-white group-hover:shadow-sm transition-all">{p.category}</span>
                        </td>
                        <td className="py-3 px-6">
                          <div className="font-mono font-bold text-sm text-slate-700">{formatPrice(p.basePrice)}</div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${p.stock === "in" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500"}`}></span>
                            <span className={`text-xs font-bold ${p.stock === "in" ? "text-emerald-700" : "text-slate-400"}`}>
                              {p.stock === "in" ? "In Stock" : "Out"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/admin/edit-product/${p._id}`}><button className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><FiEdit2 size={14} /></button></Link>
                            <button onClick={() => deleteProduct(p._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><FiTrash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (Visible only on very small screens if needed, otherwise Table scrolls) */}
            <div className="md:hidden divide-y divide-slate-50 block sm:hidden">
              {filteredProducts.map((p) => (
                <div key={p._id} className="p-4 flex gap-4 active:bg-slate-50">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 p-2 shrink-0">
                    <img src={getImageSrc(p.image)} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800">{p.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${p.stock === "in" ? "bg-emerald-500" : "bg-red-500"}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{p.category}</p>
                    <p className="font-mono font-bold text-sm mt-1">{formatPrice(p.basePrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}