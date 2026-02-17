import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart, FiSearch, FiTrash2, FiRefreshCw,
  FiDollarSign, FiMail, FiEye, FiClock
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.5 }
  })
};

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCart, setSelectedCart] = useState(null);

  const fetchAbandonedCarts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get("/api/admin/abandoned-carts", { withCredentials: true });
      setCarts(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch carts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  const handleRemoveCart = async (id) => {
    if (!window.confirm("Remove this cart?")) return;
    try {
      await axios.delete(`/api/admin/abandoned-carts/${id}`, { withCredentials: true });
      fetchAbandonedCarts(true);
      setSelectedCart(null);
      toast.success("Cart removed!");
    } catch (err) {
      toast.error("Failed to remove cart");
    }
  };

  const sendReminder = async (cartId, email) => {
    try {
      await axios.post(`/api/admin/abandoned-carts/${cartId}/remind`, { email }, { withCredentials: true });
      toast.success("Reminder sent!");
    } catch (err) {
      toast.error("Failed to send reminder");
    }
  };

  const filteredCarts = carts.filter(cart =>
    cart.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAbandonedValue = carts.reduce((sum, cart) => sum + (cart.totalValue || 0), 0);
  const recoveryRate = ((carts.filter(c => c.recovered).length / carts.length) * 100 || 0).toFixed(1);

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
              <FiShoppingCart size={24} />
            </motion.div>
            Abandoned Carts
          </h1>
          <p className="text-slate-400 text-sm mt-2 ml-16">Recover lost sales by re-engaging customers</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-xs font-bold uppercase">Abandoned Carts</p>
          <p className="text-3xl font-bold text-white mt-2">{carts.length}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-xl p-5">
          <p className="text-pink-400 text-xs font-bold uppercase">Total Value</p>
          <p className="text-3xl font-bold text-white mt-2">₹{totalAbandonedValue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-xl p-5">
          <p className="text-rose-400 text-xs font-bold uppercase">Recovery Rate</p>
          <p className="text-3xl font-bold text-white mt-2">{recoveryRate}%</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={2} className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            placeholder="Search by customer or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carts List */}
        <motion.div variants={fadeUp} custom={3} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Abandoned Carts</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => fetchAbandonedCarts(true)}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
            >
              <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </motion.button>
          </div>

          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <motion.div key={i} animate={{ opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-slate-800/30 rounded-xl h-20" />
              ))
            ) : filteredCarts.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-2xl border border-dashed border-slate-700/50">
                <FiShoppingCart size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No abandoned carts found</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredCarts.map((cart, i) => (
                  <motion.div
                    key={cart._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedCart(cart)}
                    className={`bg-gradient-to-br ${selectedCart?._id === cart._id ? "from-red-500/10 to-pink-500/10 border-red-500/40" : "from-slate-800/40 to-slate-900/40 border-slate-700/50"} border rounded-xl p-4 cursor-pointer hover:border-red-500/30 transition-all group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-white">{cart.customerName || "Unknown"}</p>
                        <p className="text-slate-400 text-sm">{cart.customerEmail}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-red-400 font-bold">₹{cart.totalValue || 0}</span>
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <FiClock size={12} />
                            {new Date(cart.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-slate-600 group-hover:text-red-400 transition-colors">
                        <FiEye size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Cart Details */}
        <motion.div variants={fadeUp} custom={4}>
          {selectedCart ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-6 sticky top-8 backdrop-blur-sm"
            >
              <h3 className="font-bold text-white text-lg mb-6">Cart Details</h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-slate-700/50">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Customer</p>
                  <p className="text-white font-medium">{selectedCart.customerName}</p>
                  <a href={`mailto:${selectedCart.customerEmail}`} className="text-red-400 text-sm hover:text-red-300">
                    {selectedCart.customerEmail}
                  </a>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedCart.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="text-slate-400">x{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/30">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400 text-sm">Cart Total:</p>
                    <p className="text-red-400 font-bold text-lg">₹{selectedCart.totalValue || 0}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendReminder(selectedCart._id, selectedCart.customerEmail)}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2.5 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <FiMail size={14} /> Send Reminder
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRemoveCart(selectedCart._id)}
                  className="w-full bg-slate-700/30 text-slate-300 border border-slate-700/50 font-bold py-2.5 rounded-xl hover:bg-slate-700/50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <FiTrash2 size={14} /> Remove Cart
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-6 text-center">
              <FiShoppingCart size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Select a cart to view details</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}