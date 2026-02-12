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
      console.error("Admin products fetch error:", err);
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

  const inStock = products.filter((p) => p.stock === "in").length;
  const outOfStock = products.filter((p) => p.stock !== "in").length;

  return (
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-10 min-h-screen relative font-sans">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-slate-500 text-xs md:text-sm">Manage catalog and stock</p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{inStock} in stock</span>
            {outOfStock > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{outOfStock} out</span>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchProducts()} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
            </motion.button>
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalog..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 text-sm transition-all shadow-sm" />
            </div>
            <div className="hidden md:flex border border-slate-200 rounded-xl overflow-hidden">
              <button onClick={() => setViewMode("table")} className={`p-2.5 ${viewMode === "table" ? "bg-slate-900 text-white" : "bg-white text-slate-400 hover:text-slate-600"} transition-colors`}><FiList size={15} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-2.5 ${viewMode === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-400 hover:text-slate-600"} transition-colors`}><FiGrid size={15} /></button>
            </div>
          </div>
          <Link to="/admin/add-product" className="w-full sm:w-auto">
            <motion.button whileTap={{ scale: 0.97 }} className="w-full h-full px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
              <FiPlus size={16} /> Add Product
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Grid View */}
      {viewMode === "grid" && !loading ? (
        <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {products.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, ease }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-slate-50 p-4 relative">
                <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/admin/edit-product/${p._id}`}><button className="p-1.5 bg-white rounded-lg shadow-sm text-slate-500 hover:text-blue-600 transition-colors"><FiEdit2 size={13} /></button></Link>
                  <button onClick={() => deleteProduct(p._id)} className="p-1.5 bg-white rounded-lg shadow-sm text-slate-500 hover:text-red-600 transition-colors"><FiTrash2 size={13} /></button>
                </div>
                <span className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase ${p.stock === "in" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {p.stock === "in" ? "In Stock" : "Out"}
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="font-semibold text-sm text-slate-900 truncate">{p.name}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{p.category}</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{formatPrice(p.basePrice)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Table View */
        <motion.div variants={fadeUp} custom={1} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Product</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Price</th>
                  <th className="py-3.5 px-5">Stock</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  products.map((p) => (
                    <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 shrink-0 p-1">
                            <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">{p.category}</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                        {formatPrice(p.basePrice)} <span className="text-slate-400 text-[10px] font-sans">/ {p.unit || "kg"}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${p.stock === "in" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {p.stock === "in" ? "In Stock" : "Out"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Link to={`/admin/edit-product/${p._id}`}><button className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><FiEdit2 size={15} /></button></Link>
                          <button onClick={() => deleteProduct(p._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><FiTrash2 size={15} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-50">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              products.map((p) => (
                <div key={p._id} className="p-4 flex items-center gap-4 active:bg-slate-50 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 p-1">
                    <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{p.category}</span>
                      <span className={`text-[10px] font-bold ${p.stock === "in" ? "text-emerald-600" : "text-red-600"}`}>
                        {p.stock === "in" ? "In Stock" : "Out"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono font-bold text-xs text-slate-900">{formatPrice(p.basePrice)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/admin/edit-product/${p._id}`} className="p-2 bg-slate-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"><FiEdit2 size={14} /></Link>
                    <button onClick={() => deleteProduct(p._id)} className="p-2 bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"><FiTrash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && products.length === 0 && (
            <div className="py-20 text-center px-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><FiPackage size={28} /></div>
              <h3 className="text-slate-900 font-bold text-lg">Empty Inventory</h3>
              <p className="text-slate-400 text-sm mt-1">No products match your search criteria.</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}