// AdminOrders.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiRefreshCw, FiTruck, FiTrash2,
  FiPrinter, FiXCircle, FiAlertCircle,
  FiPackage, FiArrowUpRight, FiFilter, FiEye,
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";
import Invoice from "../components/Invoice";

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

const OrderSkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-50">
    <td className="py-4 px-5"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
    <td className="py-4 px-5"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
    <td className="py-4 px-5"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-5"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
    <td className="py-4 px-5"><div className="h-5 w-20 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-5 text-right"><div className="h-8 w-24 bg-slate-50 rounded-lg ml-auto" /></td>
  </tr>
);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    axios
      .get("/api/orders")
      .then((res) => {
        const list = res.data || [];
        setOrders(list);
        if (selectedOrder) {
          const updated = list.find((o) => o._id === selectedOrder._id);
          if (updated) setSelectedOrder(updated);
        }
        setLoading(false);
      })
      .catch((err) => {
        //console.error("Fetch Error:", err);
        setLoading(false);
      });
  };

  const fetchAllReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await axios.get("/api/admin/reviews/all");
      setAllReviews(res.data || []);
    } catch (err) {
    //  console.error("Reviews Fetch Error:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const deleteReview = async (productId, reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
      fetchAllReviews();
    } catch {
      alert("Failed to delete review.");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAllReviews();
  }, []);

  const updateStatus = async (id, status) => {
    const orderToUpdate = orders.find((o) => o._id === id);
    if (orderToUpdate?.status.includes("Cancelled")) {
      setModal({ show: true, message: "Action Restricted: Status cannot be modified.", type: "error" });
      return;
    }
    try {
      await axios.put(`/api/orders/${id}/status`, { status });
      setModal({ show: true, message: `Order status updated to ${status}`, type: "success" });
      fetchOrders(true);
    } catch {
      setModal({ show: true, message: "Failed to update status.", type: "error" });
    }
  };

  const handleRazorpayRefund = async (orderId) => {
    if (!window.confirm("Refund full amount via Razorpay and cancel the order?")) return;
    try {
      await axios.put("/api/payment/refund", { orderId, reason: "Admin Request" });
      setModal({ show: true, message: "Refund Initiated.", type: "success" });
      fetchOrders(true);
    } catch (err) {
      setModal({ show: true, message: err.response?.data?.message || "Refund Failed", type: "error" });
    }
  };

  const updateRefundStatus = async (id, refundStatus) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { refundStatus });
      setModal({ show: true, message: `Refund state: ${refundStatus}`, type: "success" });
      fetchOrders(true);
    } catch {
      setModal({ show: true, message: "Failed to update refund status", type: "error" });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filter === "All" || o.status === filter;
    return (
      matchesStatus &&
      (o.orderId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Stats
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  return (
    <motion.div initial="hidden" animate="visible" className="p-4 md:p-8 lg:p-10 min-h-screen font-sans text-slate-900">
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            updateRefundStatus={updateRefundStatus}
            onProcessRefund={handleRazorpayRefund}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Track, update, and manage all orders</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => fetchOrders()} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} />
          </motion.button>
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 text-sm transition-all shadow-sm" />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><FiPackage size={15} /></div>
          <div><p className="text-[10px] font-semibold text-amber-600 uppercase">Pending</p><p className="text-lg font-bold text-amber-900">{pendingCount}</p></div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><FiTruck size={15} /></div>
          <div><p className="text-[10px] font-semibold text-blue-600 uppercase">Processing</p><p className="text-lg font-bold text-blue-900">{processingCount}</p></div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><FiArrowUpRight size={15} /></div>
          <div><p className="text-[10px] font-semibold text-emerald-600 uppercase">Delivered</p><p className="text-lg font-bold text-emerald-900">{deliveredCount}</p></div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div variants={fadeUp} custom={2} className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {STATUS_OPTIONS.map((status) => {
          const count = status === "All" ? orders.length : orders.filter((o) => o.status === status).length;
          return (
            <motion.button
              key={status}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                filter === status
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {status}
              {count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  filter === status ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{count}</span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Orders Table */}
      <motion.div variants={fadeUp} custom={3} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Order ID</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Payment</th>
                <th className="py-3.5 px-5">Total</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                [...Array(6)].map((_, i) => <OrderSkeletonRow key={i} />)
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400 text-sm">No orders match your criteria</td></tr>
              ) : (
                filteredOrders.map((o) => (
                  <motion.tr
                    key={o._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-500 text-xs group-hover:text-blue-600 transition-colors">#{o.orderId}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                          {o.user?.name?.charAt(0) || "G"}
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{o.user?.name || "Guest"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                        o.paymentMethod === "Prepaid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>{o.paymentMethod}</span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900 text-sm">₹{o.totalAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-5"><StatusPill status={o.status} /></td>
                    <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        disabled={o.status.includes("Cancelled")}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                        className="border border-slate-200 rounded-lg p-1.5 text-[10px] font-bold outline-none cursor-pointer hover:border-blue-400 bg-white transition-colors disabled:opacity-40"
                      >
                        {STATUS_OPTIONS.filter((s) => s !== "All").map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Reviews Section */}
      <motion.div variants={fadeUp} custom={4}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">User Feedback</h2>
            <p className="text-slate-500 text-xs mt-1">Moderate customer reviews</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={fetchAllReviews} className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
            <FiRefreshCw className={reviewsLoading ? "animate-spin" : ""} size={16} />
          </motion.button>
        </div>
        {reviewsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white border border-slate-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : allReviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><p className="text-slate-400 text-sm">No reviews yet</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allReviews.map((rev, i) => (
              <motion.div
                key={rev._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease }}
                whileHover={{ y: -2 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group hover:shadow-md transition-all"
              >
                <button
                  onClick={() => deleteReview(rev.productId, rev._id)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-50 rounded-lg"
                >
                  <FiTrash2 size={14} />
                </button>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className={`text-xs ${j < rev.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                  ))}
                </div>
                <p className="text-slate-600 text-sm italic mb-4 line-clamp-3 leading-relaxed">"{rev.comment}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] uppercase">
                    {rev.userName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rev.userName}</h4>
                    <p className="text-[10px] text-blue-500 font-semibold uppercase">{rev.productName}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Sub components ---
function StatusPill({ status }) {
  const styles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Processing: "bg-blue-50 text-blue-700 border-blue-100",
    Shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100",
    "Cancelled by User": "bg-red-100 text-red-800 border-red-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.Pending}`}>{status}</span>;
}

function OrderDetailsModal({ order, onClose, updateRefundStatus, onProcessRefund }) {
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const filename = imagePath.split(/[/\\]/).pop();
    return `/uploads/${filename}`;
  };

  const canAutoRefund = order.paymentMethod === "Prepaid" && order.isPaid && order.paymentId;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Order #{order.orderId}</h2>
            <span className="text-[10px] text-slate-400 font-mono">ID: {order._id}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={order.status} />
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.print()} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <FiPrinter size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <FiXCircle size={20} />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transaction</h4>
              <p className="text-xs font-semibold text-slate-900">Gateway: <span className="text-blue-600 font-mono">{order.paymentId || "COD"}</span></p>
              <p className="text-xs text-slate-500 mt-1">Method: <span className="font-semibold">{order.paymentMethod}</span></p>
            </div>
            {canAutoRefund && (
              <div className={`p-4 rounded-xl border-2 ${order.refundStatus === "Success" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"}`}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-slate-600">Refund Console</h4>
                {order.refundStatus === "Processing" ? (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => updateRefundStatus(order._id, "Success")} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">CONFIRM SUCCESS</motion.button>
                ) : (
                  order.refundStatus !== "Success" && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => onProcessRefund(order._id)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">PROCESS RAZORPAY REFUND</motion.button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Line Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <img src={getFullImageUrl(item.image)} alt={item.name} className="w-10 h-10 object-contain bg-white rounded-lg border border-slate-100 p-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">₹{item.price} x {item.qty}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">₹{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-5 bg-slate-50 border-t border-slate-100">
          <div className="max-w-xs ml-auto space-y-1.5 mb-4">
            <div className="flex justify-between text-xs text-slate-500"><span>Subtotal:</span><span className="font-bold text-slate-900">₹{(order.itemsPrice || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs text-slate-500"><span>GST (5%):</span><span className="font-bold text-slate-900">+₹{(order.taxPrice || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs text-slate-500"><span>Shipping:</span><span className="font-bold text-slate-900">+₹{(order.shippingPrice || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-lg text-blue-600"><span>Total:</span><span>₹{order.totalAmount.toLocaleString()}</span></div>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase transition-all hover:bg-slate-800">
            Close
          </motion.button>
        </div>
        <div><Invoice order={order} type="invoice" /></div>
      </motion.div>
    </div>
  );
}