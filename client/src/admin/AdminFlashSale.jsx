import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap, FiClock, FiDollarSign, FiSave,
  FiX, FiCheckCircle, FiSearch, FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 }
  })
};

export default function AdminFlashSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saleConfig, setSaleConfig] = useState({
    discountPrice: 0,
    saleEndDate: "",
    isFlashSale: false
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/products", { withCredentials: true });
      setProducts(Array.isArray(data.products) ? data.products : data);
    } catch (err) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (p) => {
    setEditingId(p._id);
    setSaleConfig({
      discountPrice: p.flashSale?.discountPrice || 0,
      saleEndDate: p.flashSale?.saleEndDate ? new Date(p.flashSale.saleEndDate).toISOString().slice(0, 16) : "",
      isFlashSale: p.flashSale?.isFlashSale || false
    });
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`/api/admin/products/${id}/flash-sale`, saleConfig, { withCredentials: true });
      toast.success("Flash Sale configured!");
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const deactivateAll = async () => {
    if (!window.confirm("End ALL flash sales immediately?")) return;
    try {
      const flashProducts = products.filter(p => p.flashSale?.isFlashSale);
      await Promise.all(flashProducts.map(p =>
        axios.put(`/api/admin/products/${p._id}/flash-sale`, { isFlashSale: false }, { withCredentials: true })
      ));
      toast.success("All sales deactivated");
      fetchProducts();
    } catch (err) {
      toast.error("Mass deactivate failed");
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSales = products.filter(p => p.flashSale?.isFlashSale).length;

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div whileHover={{ rotate: -10, y: -2 }} transition={{ type: "spring" }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 animate-pulse">
                <FiZap size={24} />
              </motion.div>
              Flash Sales
            </h1>
            <p className="text-slate-400 text-sm mt-2 ml-16">Create limited-time promotional offers</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={deactivateAll}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all text-sm"
          >
            End All Sales
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-xl p-4">
          <p className="text-purple-400 text-xs font-bold uppercase">Active Sales</p>
          <p className="text-3xl font-bold text-white mt-1">{activeSales}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-400 text-xs font-bold uppercase">Total Products</p>
          <p className="text-3xl font-bold text-white mt-1">{products.length}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={2} className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
          />
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div variants={fadeUp} custom={3} className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((product, index) => {
              const isActive = product.flashSale?.isFlashSale;
              const isEditing = editingId === product._id;

              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gradient-to-r ${isActive ? "from-purple-500/10 to-violet-500/10 border-purple-500/30" : "from-slate-800/40 to-slate-900/40 border-slate-700/50"} border rounded-xl p-5 transition-all`}
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 font-bold">Discount Price</label>
                        <input
                          type="number"
                          value={saleConfig.discountPrice}
                          onChange={(e) => setSaleConfig({ ...saleConfig, discountPrice: Number(e.target.value) })}
                          className="w-full bg-slate-900/50 border border-slate-700/50 p-2 rounded-lg mt-1 text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold">End Date & Time</label>
                        <input
                          type="datetime-local"
                          value={saleConfig.saleEndDate}
                          onChange={(e) => setSaleConfig({ ...saleConfig, saleEndDate: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-700/50 p-2 rounded-lg mt-1 text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/40"
                        />
                      </div>
                      <label className="flex items-end gap-2">
                        <input
                          type="checkbox"
                          checked={saleConfig.isFlashSale}
                          onChange={(e) => setSaleConfig({ ...saleConfig, isFlashSale: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300">Active</span>
                      </label>
                      <div className="flex gap-2 items-end">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSave(product._id)}
                          className="flex-1 bg-purple-500 text-white font-bold py-2 rounded-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-1"
                        >
                          <FiSave size={14} /> Save
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 bg-slate-700/30 text-slate-400 rounded-lg hover:bg-slate-700/50 transition-all"
                        >
                          <FiX size={16} />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{product.name}</h3>
                          {isActive && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">ACTIVE</span>}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          <span className="line-through">₹{product.basePrice}</span>
                          {isActive && <span className="ml-2 font-bold text-purple-400">→ ₹{product.flashSale?.discountPrice}</span>}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(product)}
                        className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-bold"
                      >
                        Configure
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}