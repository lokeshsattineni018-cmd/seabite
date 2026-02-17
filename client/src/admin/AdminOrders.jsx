import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiRefreshCw, FiTruck, FiTrash2,
  FiPrinter, FiXCircle, FiEye,
  FiPackage, FiFilter, FiDownload, FiEyeOff,
} from "react-icons/fi";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  "All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Cancelled by User",
];

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.06, duration: 0.5, ease },
  }),
};

const statusColors = {
  Pending: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  Processing: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  Shipped: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  Delivered: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  Cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    axios
      .get("/api/orders", { withCredentials: true })
      .then((res) => {
        setOrders(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Failed to fetch orders");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/orders/${id}`, { status }, { withCredentials: true });
      fetchOrders(true);
      toast.success("Order updated!");
    } catch (err) {
      toast.error("Failed to update order");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await axios.delete(`/api/orders/${id}`, { withCredentials: true });
      fetchOrders(true);
      toast.success("Order deleted!");
    } catch (err) {
      toast.error("Failed to delete order");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "All" || order.status === filter;
    const matchesSearch = order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
          <motion.div whileHover={{ y: -2 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <FiPackage size={24} />
          </motion.div>
          Order Management
        </h1>
        <p className="text-slate-400 text-sm mt-2 ml-16">Track and manage all customer orders</p>
      </motion.div>

      {/* Controls */}
      <motion.div variants={fadeUp} custom={1} className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            placeholder="Search by Order ID or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-3 rounded-xl text-slate-300 text-sm outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/30 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <motion.select
            whileHover={{ scale: 1.02 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 text-sm font-medium hover:border-slate-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </motion.select>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => fetchOrders(true)}
            className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-cyan-400 transition-all"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div variants={fadeUp} custom={2} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FiPackage size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700/50 bg-slate-800/20">
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                <AnimatePresence>
                  {filteredOrders.map((order, index) => {
                    const statusColor = statusColors[order.status] || statusColors.Pending;
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-700/20 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-bold text-cyan-400">#{order._id?.slice(-6) || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-300 text-sm font-medium">{order.customerName || "Unknown"}</p>
                          <p className="text-slate-500 text-xs">{order.email || "—"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-white">₹{order.totalAmount || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                              className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-cyan-400 transition-all"
                            >
                              {expandedOrder === order._id ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => deleteOrder(order._id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                            >
                              <FiTrash2 size={16} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}