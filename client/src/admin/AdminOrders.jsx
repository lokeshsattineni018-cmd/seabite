// AdminOrders.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiRefreshCw, FiTruck, FiPrinter,
  FiXCircle, FiPackage, FiArrowUpRight, FiFilter, FiTrash2
} from "react-icons/fi";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import Invoice from "../components/content/Invoice";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  "All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Cancelled by User",
];

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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fetchOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const { data } = await axios.get("/api/orders", { withCredentials: true });
      setOrders(Array.isArray(data) ? data : []);
      if (selectedOrder) {
        const updated = data.find((o) => o._id === selectedOrder._id);
        if (updated) setSelectedOrder(updated);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    if (orders.find((o) => o._id === id)?.status.includes("Cancelled")) {
      return toast.error("Cannot modify cancelled orders");
    }
    try {
      await axios.put(`/api/orders/${id}/status`, { status }, { withCredentials: true });
      toast.success(`Updated to ${status}`);
      fetchOrders(true);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDeleteOrder = async (id, orderNumber) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete Order #${orderNumber}? This action cannot be undone.`)) return;

    const t = toast.loading("Deleting order...");
    try {
      await axios.delete(`/api/orders/${id}`, { withCredentials: true });
      toast.success("Order deleted successfully", { id: t });
      fetchOrders(true);
      if (selectedOrder?._id === id) setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed", { id: t });
    }
  };

  const handleRazorpayRefund = async (orderId) => {
    if (!window.confirm("Refund full amount via Razorpay and cancel?")) return;
    try {
      await axios.put("/api/payment/refund", { orderId, reason: "Admin Request" }, { withCredentials: true });
      toast.success("Refund Initiated");
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund Failed");
    }
  };

  const updateRefundStatus = async (id, refundStatus) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { refundStatus }, { withCredentials: true });
      toast.success(`Refund: ${refundStatus}`);
      fetchOrders(true);
    } catch {
      toast.error("Failed to update refund status");
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkUpdating(true);
    const t = toast.loading(`Updating ${selectedOrderIds.length} orders to ${status}...`);
    try {
      await Promise.all(
        selectedOrderIds.map(id => axios.put(`/api/orders/${id}/status`, { status }, { withCredentials: true }))
      );
      toast.success(`Updated ${selectedOrderIds.length} orders successfully`, { id: t });
      setSelectedOrderIds([]);
      fetchOrders(true);
    } catch (err) {
      toast.error("Failed to update some orders", { id: t });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedOrderIds.length} orders?`)) return;

    setIsBulkUpdating(true);
    const t = toast.loading(`Deleting ${selectedOrderIds.length} orders...`);
    try {
      await Promise.all(
        selectedOrderIds.map(id => axios.delete(`/api/orders/${id}`, { withCredentials: true }))
      );
      toast.success(`${selectedOrderIds.length} orders removed`, { id: t });
      setSelectedOrderIds([]);
      fetchOrders(true);
    } catch (err) {
      toast.error("Failed to delete some orders", { id: t });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectOrder = (id, e) => {
    e.stopPropagation();
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o._id));
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

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="min-h-screen bg-gradient-to-br from-white via-stone-50 to-white p-6 md:p-10 font-sans">
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

      <div className="max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">Orders</h1>
            <p className="text-sm text-stone-500">Track and manage shipments</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID or Customer..."
                className="w-full pl-11 pr-5 py-3 rounded-2xl bg-stone-50 border border-stone-200/50 text-stone-800 font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-200/50 transition-all outline-none"
              />
            </div>
            <button onClick={() => fetchOrders()} className="p-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-colors">
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<FiPackage size={20} />}
            color="bg-amber-50/50 text-amber-700 border-amber-100/50"
          />
          <StatCard
            title="Processing"
            value={processingCount}
            icon={<FiTruck size={20} />}
            color="bg-blue-50/50 text-blue-700 border-blue-100/50"
          />
          <StatCard
            title="Delivered"
            value={deliveredCount}
            icon={<FiArrowUpRight size={20} />}
            color="bg-emerald-50/50 text-emerald-700 border-emerald-100/50"
          />
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {STATUS_OPTIONS.map((status) => {
            const count = status === "All" ? orders.length : orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 ${filter === status
                  ? "bg-stone-900 text-white border-stone-900 shadow-md"
                  : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-700"
                  }`}
              >
                {status}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === status ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>{count}</span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedOrderIds.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 border border-stone-800 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-50 min-w-[500px]"
            >
              <div className="flex items-center gap-2 pr-6 border-r border-stone-800">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  {selectedOrderIds.length}
                </div>
                <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Selected</span>
              </div>

              <div className="flex items-center gap-3 flex-1">
                <select
                  disabled={isBulkUpdating}
                  onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                  className="bg-stone-800 border-none text-white text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer hover:bg-stone-700 transition-colors"
                  value=""
                >
                  <option value="" disabled>Update Status to...</option>
                  {STATUS_OPTIONS.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button
                  disabled={isBulkUpdating}
                  onClick={handleBulkDelete}
                  className="p-2.5 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Bulk Delete"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>

              <button
                onClick={() => setSelectedOrderIds([])}
                className="text-stone-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                disabled={isBulkUpdating}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-stone-200/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50/50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                      checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20">
                      <SeaBiteLoader />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-stone-400 font-medium">No orders found</td></tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr
                      key={o._id}
                      onClick={() => setSelectedOrder(o)}
                      className={`group transition-colors cursor-pointer ${selectedOrderIds.includes(o._id) ? 'bg-stone-100/80 hover:bg-stone-100' : 'hover:bg-stone-50/50'}`}
                    >
                      <td className="px-6 py-4" onClick={(e) => toggleSelectOrder(o._id, e)}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                          checked={selectedOrderIds.includes(o._id)}
                          readOnly
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-stone-500 group-hover:text-blue-600 transition-colors">#{o.orderId}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-stone-900">{o.user?.name || "Guest"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide border ${o.paymentMethod === "Prepaid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-stone-900">₹{o.totalAmount.toLocaleString()}</td>
                      <td className="px-6 py-4"><StatusPill status={o.status} /></td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={o.status}
                            disabled={o.status.includes("Cancelled")}
                            onChange={(e) => updateStatus(o._id, e.target.value)}
                            className="bg-white border border-stone-200 rounded-lg py-1.5 px-2 text-xs font-bold text-stone-600 outline-none cursor-pointer hover:border-blue-400 transition-colors disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.filter((s) => s !== "All").map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(o._id, o.orderId)}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div >
    </motion.div >
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-6 rounded-3xl border flex items-center gap-5 transition-transform hover:scale-[1.02] ${color}`}>
      <div className="p-3 bg-white/60 rounded-2xl backdrop-blur-sm shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{title}</p>
        <p className="text-2xl font-light">{value}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Processing: "bg-blue-50 text-blue-700 border-blue-200",
    Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    "Cancelled by User": "bg-rose-100 text-rose-800 border-rose-300",
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[status] || styles.Pending}`}>{status}</span>;
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
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-stone-100 bg-stone-50/50">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Order #{order.orderId}</h2>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">ID: {order._id}</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={order.status} />
            <button
              onClick={async () => {
                const t = toast.loading("Generating Invoice...");
                try { await generateInvoicePDF(order); toast.success("Downloaded!", { id: t }); }
                catch { toast.error("Failed", { id: t }); }
              }}
              className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
            >
              <FiPrinter size={18} />
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-stone-200/50 rounded-xl text-stone-400 hover:text-stone-600 transition-colors">
              <FiXCircle size={24} />
            </button>
          </div>
        </div>

        {/* Delete Banner (Warning) */}
        <div className="px-8 py-2 bg-rose-50 border-b border-rose-100 flex justify-between items-center group">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Danger Zone: Permanent Deletion</p>
          <button
            onClick={() => handleDeleteOrder(order._id, order.orderId)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider transition-colors"
          >
            <FiTrash2 size={12} /> Delete Order
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Info */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Payment Information</h4>
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-900 flex justify-between">Method <span>{order.paymentMethod}</span></p>
                <p className="text-sm font-medium text-stone-900 flex justify-between">Transaction ID <span className="font-mono text-stone-500">{order.paymentId || "N/A"}</span></p>
                <p className="text-sm font-medium text-stone-900 flex justify-between">Paid Status <span className={order.isPaid ? "text-emerald-600" : "text-amber-600"}>{order.isPaid ? "Paid" : "Unpaid"}</span></p>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Shipping Information</h4>
              <p className="font-bold text-stone-900">{order.shippingAddress?.fullName}</p>
              <p className="text-sm text-stone-600 mt-1">{order.shippingAddress?.phone}</p>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                {order.shippingAddress?.houseNo}, {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}
              </p>
            </div>

            {canAutoRefund && (
              <div className={`col-span-1 md:col-span-2 p-6 rounded-2xl border border-stone-200 ${order.refundStatus === "Success" ? "bg-emerald-50/50" : "bg-blue-50/50"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Refund Console</h4>
                  <span className="text-xs font-bold px-2 py-0.5 bg-white rounded-md border border-stone-200">{order.refundStatus || "None"}</span>
                </div>
                {order.refundStatus !== "Success" && (
                  <button
                    onClick={() => onProcessRefund(order._id)}
                    className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-stone-800 transition-colors"
                  >
                    Process Razorpay Refund
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                  <img src={getFullImageUrl(item.image)} className="w-12 h-12 object-contain bg-stone-50 rounded-lg p-1" />
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 text-sm">{item.name}</p>
                    <p className="text-xs text-stone-500 font-medium">Qty: {item.qty}</p>
                  </div>
                  <p className="font-mono font-bold text-stone-900">₹{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-stone-50 border-t border-stone-100">
          <div className="flex justify-between items-end">
            <button onClick={onClose} className="px-6 py-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-100 text-xs uppercase">Close</button>
            <div className="text-right space-y-1">
              <p className="text-xs text-stone-500">Subtotal: <span className="font-bold text-stone-900">₹{order.itemsPrice}</span></p>
              <p className="text-xs text-stone-500">Tax: <span className="font-bold text-stone-900">₹{order.taxPrice}</span></p>
              <p className="text-xl font-light text-stone-900 mt-2">Total: <span className="font-bold">₹{order.totalAmount.toLocaleString()}</span></p>
            </div>
          </div>
          <div className="hidden"><Invoice order={order} /></div>
        </div>

      </motion.div>
    </div>
  );
}