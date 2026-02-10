import { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";

// ✅ Skeleton Row for Desktop to stop the "white flash" and lag
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" /><div className="h-4 w-32 bg-slate-100 rounded" /></div></td>
    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-6 text-right"><div className="h-8 w-16 bg-slate-100 rounded-lg ml-auto" /></td>
  </tr>
);

// ✅ Skeleton Card for Mobile
const SkeletonCard = () => (
  <div className="p-4 flex items-center gap-4 animate-pulse">
    <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-2"><div className="h-4 w-3/4 bg-slate-100 rounded" /><div className="h-3 w-1/2 bg-slate-100 rounded" /></div>
  </div>
);

const formatPrice = (price) => {
  return price ? `₹${Number(price).toFixed(2)}` : "₹0.00";
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const backendBase = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";
  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const fetchProducts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // ✅ FIX: Use absolute URL + withCredentials
      const res = await axios.get(`${backendBase}/api/admin/products`, {
        params: search ? { search } : {},
        withCredentials: true,
      });

      const data = res.data;
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error("Admin products fetch error:", err);
      setProducts([]);
      setModal({
        show: true,
        message: err.response?.data?.message || "Failed to load products.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      // ✅ FIX: Use absolute URL + withCredentials
      await axios.delete(`${backendBase}/api/admin/products/${id}`, { withCredentials: true });
      setModal({ show: true, message: "Product deleted successfully.", type: "success" });
      fetchProducts(true); // Silent refresh after delete
    } catch (err) {
      setModal({ show: true, message: "Failed to delete product.", type: "error" });
    }
  };

  const getImageSrc = (img) => {
    if (!img) return "https://placehold.co/400?text=No+Image";
    if (img.startsWith("http")) return img;
    const file = img.split(/[/\\]/).pop();
    // ✅ FIX: Point to backend uploads folder
    return `${backendBase}/uploads/${file}`;
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
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage catalog and stock levels.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2 w-full">
            <button
              onClick={() => fetchProducts()}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </button>
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all shadow-sm"
              />
            </div>
          </div>
          <Link to="/admin/add-product" className="w-full sm:w-auto">
            <button className="w-full h-full px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap">
              <FiPlus size={18} /> Add Product
            </button>
          </Link>
        </div>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Stock</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                // ✅ Show Skeletons instead of a single Spinner
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden border border-slate-200 shrink-0 p-1">
                          <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {formatPrice(p.basePrice)} <span className="text-slate-400 text-[10px] font-sans">/ {p.unit || "kg"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${p.stock === "in" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                        {p.stock === "in" ? "In Stock" : "Out"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/edit-product/${p._id}`}><button className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><FiEdit2 size={16} /></button></Link>
                        <button onClick={() => deleteProduct(p._id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
             [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            products.map((p) => (
              <div key={p._id} className="p-4 flex items-center gap-4 active:bg-slate-50 transition-colors">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 p-1"><img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" /></div>
                <div className="flex-1 min-w-0"><h3 className="font-bold text-sm text-slate-900 truncate">{p.name}</h3><div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 rounded uppercase tracking-tighter">{p.category}</span><span className={`text-[10px] font-bold ${p.stock === "in" ? "text-emerald-600" : "text-red-600"}`}>• {p.stock === "in" ? "Available" : "Sold Out"}</span></div><p className="mt-1 font-mono font-bold text-xs text-slate-700">{formatPrice(p.basePrice)} <span className="text-[9px] font-sans opacity-50">/ {p.unit || "kg"}</span></p></div>
                <div className="flex flex-col gap-2"><Link to={`/admin/edit-product/${p._id}`} className="p-2 bg-slate-100 rounded-lg text-slate-600"><FiEdit2 size={14} /></Link><button onClick={() => deleteProduct(p._id)} className="p-2 bg-red-50 rounded-lg text-red-600"><FiTrash2 size={14} /></button></div>
              </div>
            ))
          )}
        </div>

        {!loading && products.length === 0 && (
          <div className="py-20 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FiPackage size={32} /></div>
            <h3 className="text-slate-900 font-bold text-lg">Empty Inventory</h3>
            <p className="text-slate-500 text-sm mt-1">No products match your current search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}