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
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.5, ease },
  }),
};

const formatPrice = (price) => price ? `₹${Number(price).toFixed(2)}` : "₹0.00";

// ── Skeletons ─────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-50">
    <td className="py-4 px-6">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 shrink-0" />
        <div className="h-3.5 w-36 bg-slate-100 rounded-lg" />
      </div>
    </td>
    <td className="py-4 px-6"><div className="h-3 w-16 bg-slate-100 rounded-lg" /></td>
    <td className="py-4 px-6"><div className="h-3 w-20 bg-slate-100 rounded-lg" /></td>
    <td className="py-4 px-6"><div className="h-5 w-14 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-6 text-right"><div className="h-7 w-16 bg-slate-100 rounded-xl ml-auto" /></td>
  </tr>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-slate-100" />
    <div className="p-4 space-y-2.5">
      <div className="h-3.5 w-3/4 bg-slate-100 rounded-lg" />
      <div className="h-3 w-1/2 bg-slate-100 rounded-lg" />
    </div>
  </div>
);

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
      setProducts(Array.isArray(res.data.products) ? res.data.products : []);
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
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${backendBase}/api/admin/products/${id}`, { withCredentials: true });
      setModal({ show: true, message: "Product deleted.", type: "success" });
      fetchProducts(true);
    } catch {
      setModal({ show: true, message: "Failed to delete product.", type: "error" });
    }
  };

  const getImageSrc = (img) => {
    if (!img) return "https://placehold.co/400?text=No+Image";
    if (img.startsWith("http")) return img;
    return `${backendBase}/uploads/${img.split(/[/\\]/).pop()}`;
  };

  const inStock = products.filter((p) => p.stock === "in").length;
  const outOfStock = products.filter((p) => p.stock !== "in").length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#f8f6f2] p-5 md:p-8 lg:p-10 font-sans"
    >
      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8"
      >
        {/* Title block */}
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-sky-500 mb-1">
            ✦ SeaBite Admin
          </p>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">
            Inventory
          </h1>

          {/* Stat pills */}
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              {products.length} products
            </span>
            {inStock > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {inStock} in stock
              </span>
            )}
            {outOfStock > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {outOfStock} out
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1">

            {/* Refresh */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => fetchProducts()}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-200 hover:shadow-md transition-all shadow-sm"
            >
              <FiRefreshCw size={15} className={loading ? "animate-spin text-sky-500" : ""} />
            </motion.button>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-sky-400/15 focus:border-sky-300 transition-all shadow-sm"
              />
            </div>

            {/* View toggle */}
            <div className="hidden md:flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 transition-all ${viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
              >
                <FiList size={14} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-all ${viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
              >
                <FiGrid size={14} />
              </button>
            </div>
          </div>

          {/* Add Product CTA */}
          <Link to="/admin/add-product">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FiPlus size={15} />
              Add Product
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* ── GRID VIEW ────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {loading
              ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
              : products.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, ease }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                >
                  {/* Image area */}
                  <div className="relative aspect-[4/3] bg-slate-50 p-4 overflow-hidden">
                    <img
                      src={getImageSrc(p.image)}
                      alt={p.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                      <Link to={`/admin/edit-product/${p._id}`}>
                        <button className="p-2 bg-white rounded-xl shadow-md text-slate-500 hover:text-sky-500 hover:shadow-lg transition-all">
                          <FiEdit2 size={14} />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className="p-2 bg-white rounded-xl shadow-md text-slate-500 hover:text-red-500 hover:shadow-lg transition-all"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    {/* Stock badge */}
                    <span className={`absolute top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                      ${p.stock === "in" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                      {p.stock === "in" ? "In Stock" : "Out"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="px-3.5 py-3 border-t border-slate-50">
                    <h3 className="font-semibold text-[13px] text-slate-800 truncate mb-1">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{p.category}</span>
                      <span className="font-mono font-bold text-[13px] text-slate-800">{formatPrice(p.basePrice)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}

        {/* ── TABLE VIEW ─────────────────────────────────────────────────────── */}
        {viewMode === "table" && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* ── Desktop Table ──────────────────────────────────────────────── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["Product", "Category", "Price", "Stock", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3.5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                    : products.map((p, i) => (
                      <motion.tr
                        key={p._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Product name + image */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 p-1.5">
                              <img
                                src={getImageSrc(p.image)}
                                alt={p.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="font-semibold text-[13px] text-slate-800 truncate max-w-[180px]">
                              {p.name}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-6">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                            {p.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-6">
                          <span className="font-mono font-bold text-[13px] text-slate-800">
                            {formatPrice(p.basePrice)}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-1">/ {p.unit || "kg"}</span>
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                            ${p.stock === "in"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-red-50 text-red-500 border border-red-100"}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.stock === "in" ? "bg-emerald-400" : "bg-red-400"}`} />
                            {p.stock === "in" ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/admin/edit-product/${p._id}`}>
                              <button className="p-2 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all">
                                <FiEdit2 size={14} />
                              </button>
                            </Link>
                            <button
                              onClick={() => deleteProduct(p._id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ───────────────────────────────────────────────── */}
            <div className="md:hidden divide-y divide-slate-50">
              {loading
                ? [...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 bg-slate-100 rounded-lg" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))
                : products.map((p) => (
                  <div key={p._id} className="p-4 flex items-center gap-4 active:bg-slate-50 transition-colors">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 p-1.5">
                      <img src={getImageSrc(p.image)} alt={p.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[13px] text-slate-800 truncate">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">{p.category}</span>
                        <span className={`text-[10px] font-bold ${p.stock === "in" ? "text-emerald-500" : "text-red-500"}`}>
                          {p.stock === "in" ? "● In Stock" : "● Out"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono font-bold text-xs text-slate-700">{formatPrice(p.basePrice)}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Link to={`/admin/edit-product/${p._id}`}>
                        <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-sky-500 transition-colors">
                          <FiEdit2 size={13} />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className="p-2 bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* ── Empty State ─────────────────────────────────────────────────── */}
            {!loading && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-24 flex flex-col items-center text-center px-6"
              >
                {/* Icon with ripple */}
                <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-slate-100 animate-ping opacity-30" />
                  <div className="relative w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <FiPackage size={26} className="text-slate-300" />
                  </div>
                </div>
                <h3 className="text-slate-700 font-bold text-base mb-1">No products found</h3>
                <p className="text-slate-400 text-sm mb-6">
                  {search ? `No results for "${search}"` : "Your inventory is empty."}
                </p>
                <Link to="/admin/add-product">
                  <button className="px-5 py-2.5 bg-slate-800 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-sm">
                    <FiPlus size={14} /> Add First Product
                  </button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}