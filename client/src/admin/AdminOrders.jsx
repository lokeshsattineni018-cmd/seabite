import { useEffect, useState, memo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiRefreshCw,
  FiTruck,
  FiTrash2,
  FiPrinter,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";
import Invoice from "../components/Invoice";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Cancelled by User",
];

// ✅ NEW: Skeleton Row for Orders
const OrderSkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-50">
    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
    <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
    <td className="py-4 px-6"><div className="h-5 w-24 bg-slate-100 rounded-full" /></td>
    <td className="py-4 px-6 text-right"><div className="h-8 w-24 bg-slate-50 rounded ml-auto" /></td>
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
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  };

  const fetchAllReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await axios.get("/api/admin/reviews/all");
      setAllReviews(res.data || []);
    } catch (err) {
      console.error("Reviews Fetch Error:", err);
    } finally {
      setReviewsLoading(false);
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
      fetchOrders(true); // Silent refresh
    } catch (err) {
      setModal({ show: true, message: "Failed to update status.", type: "error" });
    }
  };

  const handleRazorpayRefund = async (orderId) => {
    if (!window.confirm("⚠️ Refund full amount via Razorpay and cancel the order?")) return;
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
    } catch (err) {
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

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen font-sans text-slate-900">
      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage orders, refunds, and feedback.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => fetchOrders()} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          </button>
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none text-sm transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* ✅ PERSISTENT FILTER BAR */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap ${
              filter === status ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="py-4 px-6">Order ID</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6">Total</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                // ✅ Show Skeletons during navigation
                [...Array(6)].map((_, i) => <OrderSkeletonRow key={i} />)
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o._id}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-mono font-medium text-slate-600 group-hover:text-blue-600">#{o.orderId}</td>
                    <td className="py-4 px-6 font-medium text-slate-900">{o.user?.name || "Guest"}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase ${o.paymentMethod === "Prepaid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{o.totalAmount.toLocaleString()}</td>
                    <td className="py-4 px-6"><StatusPill status={o.status} /></td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        disabled={o.status.includes("Cancelled")}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                        className="border rounded-lg p-1 text-[10px] font-bold outline-none cursor-pointer hover:border-blue-500"
                      >
                        {STATUS_OPTIONS.filter((s) => s !== "All").map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Feedback Section (UI as provided) */}
      <hr className="border-slate-200 my-10" />
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <div><h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900">User Feedback</h2><p className="text-slate-500 text-xs mt-1">Moderate customer testimonials.</p></div>
          <button onClick={fetchAllReviews} className="p-2 bg-white rounded-lg border text-slate-500"><FiRefreshCw className={reviewsLoading ? "animate-spin" : ""} /></button>
        </div>
        {reviewsLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allReviews.map((rev) => (
              <motion.div key={rev._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                <button onClick={(e) => {e.stopPropagation(); deleteReview(rev.productId, rev._id)}} className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><FiTrash2 size={18} /></button>
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => (<span key={i} className={`text-xs ${i < rev.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>))}</div>
                <p className="text-slate-600 text-sm italic mb-4">"{rev.comment}"</p>
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] uppercase">{rev.userName?.charAt(0)}</div><div><h4 className="text-xs font-bold text-slate-900">{rev.userName}</h4><p className="text-[10px] text-blue-500 font-bold uppercase">{rev.productName}</p></div></div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components as provided (StatusPill, OrderDetailsModal, etc.)
function StatusPill({ status }) {
  const styles = {
    Pending: "bg-amber-50 text-amber-700",
    Processing: "bg-blue-50 text-blue-700",
    Shipped: "bg-indigo-50 text-indigo-700",
    Delivered: "bg-emerald-50 text-emerald-700",
    Cancelled: "bg-red-50 text-red-700",
    "Cancelled by User": "bg-red-100 text-red-800",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.Pending}`}>{status}</span>;
}

// OrderDetailsModal kept as original logic
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
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
        <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b sticky top-0 bg-white z-10">
          <div><h2 className="text-lg md:text-xl font-bold text-slate-900">Order #{order.orderId}</h2><span className="text-[10px] text-slate-400 font-mono uppercase">ID: {order._id}</span></div>
          <div className="flex items-center gap-2"><button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-xl text-slate-700"><FiPrinter size={18} /></button><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><FiXCircle size={24} /></button></div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border p-4 rounded-2xl"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transaction Details</h4><p className="text-xs font-bold text-slate-900">Gateway: <span className="text-blue-600 font-mono">{order.paymentId || "COD"}</span></p></div>
            {canAutoRefund && (
              <div className={`p-4 rounded-2xl border-2 ${order.refundStatus === "Success" ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"}`}>
                <h4 className="text-[10px] font-black uppercase mb-3">Refund Console</h4>
                {order.refundStatus === "Processing" ? (
                  <button onClick={() => updateRefundStatus(order._id, "Success")} className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">CONFIRM SUCCESS</button>
                ) : (
                  order.refundStatus !== "Success" && (
                    <button onClick={() => onProcessRefund(order._id)} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">PROCESS RAZORPAY REFUND</button>
                  )
                )}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Line Items</h3>
            {order.items.map((item, index) => (
              <div key={index} className="flex flex-col bg-white p-3 rounded-xl border border-slate-100 gap-3">
                <div className="flex items-center gap-4">
                  <img src={getFullImageUrl(item.image)} alt={item.name} className="w-10 h-10 object-contain bg-slate-50 rounded-lg" />
                  <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-900">{item.name}</p><p className="text-[10px] text-slate-500">₹{item.price} x {item.qty}</p></div>
                  <p className="text-xs font-black text-blue-600">₹{(item.price * item.qty).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 md:px-8 py-5 bg-slate-50 border-t">
          <div className="max-w-xs ml-auto space-y-1.5 mb-4">
            <div className="flex justify-between text-xs text-slate-500"><span>Subtotal:</span><span className="font-bold text-slate-900">₹{(order.itemsPrice || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs text-slate-500"><span>GST (5%):</span><span className="font-bold text-slate-900">+₹{(order.taxPrice || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs text-slate-500"><span>Shipping:</span><span className="font-bold text-slate-900">+₹{(order.shippingPrice || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-xl text-blue-600"><span>Total:</span><span>₹{order.totalAmount.toLocaleString()}</span></div>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase transition-all active:scale-[0.98]">Exit Console</button>
        </div>
        <div><Invoice order={order} type="invoice" /></div>
      </motion.div>
    </div>
  );
}