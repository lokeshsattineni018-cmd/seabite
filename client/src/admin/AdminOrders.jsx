// AdminOrders.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiRefreshCw, FiTruck, FiPrinter,
  FiXCircle, FiPackage, FiArrowUpRight, FiFilter, FiTrash2, FiDollarSign,
  FiSettings, FiActivity, FiGrid, FiList
} from "react-icons/fi";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import Invoice from "../components/content/Invoice";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

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
  const [partners, setPartners] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'kanban'

  // New real-time, telemetry, and control states
  const { socket } = useSocket();
  const [pageSize, setPageSize] = useState(() => Number(localStorage.getItem("adminOrdersPageSize")) || 10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPageSizeSettings, setShowPageSizeSettings] = useState(false);
  const [pendingCancelOrder, setPendingCancelOrder] = useState(null);
  const [shimmeringOrderIds, setShimmeringOrderIds] = useState([]);
  const [flashingOrderIds, setFlashingOrderIds] = useState([]);

  // Telemetry popover states
  const [activeTelemetryOrderId, setActiveTelemetryOrderId] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  const settingsRef = useRef(null);
  const telemetryPopoverRef = useRef(null);

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
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowPageSizeSettings(false);
      }
      if (telemetryPopoverRef.current && !telemetryPopoverRef.current.contains(event.target)) {
        setActiveTelemetryOrderId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchOrders();
    const fetchPartners = async () => {
      try {
        const { data } = await axios.get("/api/delivery/partners", { withCredentials: true });
        setPartners(data.filter(p => p.status === 'Active'));
      } catch (err) { }
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOrderPlaced = (newOrder) => {
      setOrders((prevOrders) => {
        if (prevOrders.some((o) => o._id === newOrder._id)) return prevOrders;
        return [newOrder, ...prevOrders];
      });

      setShimmeringOrderIds((prev) => [...prev, newOrder._id]);
      setTimeout(() => {
        setShimmeringOrderIds((prev) => prev.filter((id) => id !== newOrder._id));
      }, 3000);
    };

    const handleAdminOrderUpdated = ({ order, operator }) => {
      setOrders((prevOrders) => {
        return prevOrders.map((o) => (o._id === order._id ? order : o));
      });

      setFlashingOrderIds((prev) => [...prev, order._id]);
      setTimeout(() => {
        setFlashingOrderIds((prev) => prev.filter((id) => id !== order._id));
      }, 1500);

      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-amber-50 border border-amber-200 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 z-[9999]`}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-amber-900">
                  Order Status Updated
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Order #{order.orderId} was updated by Operator: {operator}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-amber-100 pl-3 ml-3 items-center">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-bold text-amber-600 hover:text-amber-800 focus:outline-none"
            >
              Close
            </button>
          </div>
        </motion.div>
      ), { duration: 4000 });
    };

    socket.on("ORDER_PLACED", handleOrderPlaced);
    socket.on("ADMIN_ORDER_UPDATED", handleAdminOrderUpdated);

    return () => {
      socket.off("ORDER_PLACED", handleOrderPlaced);
      socket.off("ADMIN_ORDER_UPDATED", handleAdminOrderUpdated);
    };
  }, [socket]);

  const handleTelemetryClick = async (orderId) => {
    if (activeTelemetryOrderId === orderId) {
      setActiveTelemetryOrderId(null);
      return;
    }
    setActiveTelemetryOrderId(orderId);
    setLoadingTelemetry(true);
    setTelemetryData(null);
    try {
      const { data } = await axios.get(`/api/orders/${orderId}/telemetry`, { withCredentials: true });
      setTelemetryData(data);
    } catch {
      toast.error("Failed to load telemetry");
      setActiveTelemetryOrderId(null);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const updateStatus = async (id, status) => {
    const currentOrder = orders.find((o) => o._id === id);
    if (!currentOrder) return;
    if (currentOrder.status === "Delivered") {
      return toast.error("Cannot modify Delivered orders");
    }
    if (currentOrder.status.includes("Cancelled")) {
      return toast.error("Cannot modify Cancelled orders");
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

  const handleBulkAssign = async (partnerId) => {
    if (selectedOrderIds.length === 0 || !partnerId) return;
    setIsBulkUpdating(true);
    const t = toast.loading(`Assigning ${selectedOrderIds.length} orders...`);
    try {
      await Promise.all(
        selectedOrderIds.map(orderId => axios.post("/api/delivery/assign", { orderId, partnerId }, { withCredentials: true }))
      );
      toast.success(`Assigned ${selectedOrderIds.length} orders to partner`, { id: t });
      setSelectedOrderIds([]);
      fetchOrders(true);
    } catch (err) {
      toast.error("Failed to assign some orders", { id: t });
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

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredOrders.length, pageSize, totalPages, currentPage]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
            fetchOrders={fetchOrders}
            handleDeleteOrder={handleDeleteOrder}
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

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowPageSizeSettings(!showPageSizeSettings)}
                className="p-3.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-colors"
                title="Page Size Preferences"
              >
                <FiSettings size={18} />
              </button>

              <AnimatePresence>
                {showPageSizeSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 bg-white border border-stone-200 shadow-xl rounded-2xl p-3.5 z-50 text-left"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2 px-1">Items Per Page</span>
                    <div className="flex flex-col gap-1">
                      {[10, 25, 50].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            localStorage.setItem("adminOrdersPageSize", size);
                            setCurrentPage(1);
                            setShowPageSizeSettings(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex justify-between items-center ${
                            pageSize === size
                              ? "bg-stone-900 text-white"
                              : "text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          <span>{size} items</span>
                          {pageSize === size && <span className="text-[10px] font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex bg-stone-100 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "table" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500 hover:text-stone-900"}`}
                title="Table View"
              >
                <FiList size={16} />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "kanban" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-500 hover:text-stone-900"}`}
                title="Kanban Pipeline"
              >
                <FiGrid size={16} />
              </button>
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

                <select
                  disabled={isBulkUpdating || partners.length === 0}
                  onChange={(e) => handleBulkAssign(e.target.value)}
                  className="bg-stone-800 border-none text-white text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer hover:bg-stone-700 transition-colors"
                  value=""
                >
                  <option value="" disabled>{partners.length === 0 ? "No active partners" : "Assign to Partner..."}</option>
                  {partners.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
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

        {viewMode === "kanban" ? (
          <KanbanBoard
            orders={filteredOrders}
            onUpdateStatus={updateStatus}
            onSelectOrder={setSelectedOrder}
            partners={partners}
            onAssignPartner={async (orderId, partnerId) => {
              try {
                await axios.put(`/api/orders/${orderId}/status`, { deliveryPartner: partnerId, deliveryStatus: "Assigned" }, { withCredentials: true });
                toast.success("Delivery partner assigned");
                fetchOrders(true);
              } catch (err) {
                toast.error("Failed to assign partner");
              }
            }}
          />
        ) : (
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
                    <td colSpan={7} className="py-20">
                      <SeaBiteLoader />
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-stone-400 font-medium">No orders found</td></tr>
                ) : (
                  paginatedOrders.map((o) => {
                    const isShimmering = shimmeringOrderIds.includes(o._id);
                    const isFlashing = flashingOrderIds.includes(o._id);
                    return (
                      <tr
                        key={o._id}
                        onClick={() => setSelectedOrder(o)}
                        className={`group transition-colors cursor-pointer ${
                          isShimmering 
                            ? "shimmer-row-green hover:bg-emerald-50/30" 
                            : isFlashing 
                            ? "flash-row-amber hover:bg-amber-50/30" 
                            : selectedOrderIds.includes(o._id) 
                            ? 'bg-stone-100/80 hover:bg-stone-100' 
                            : 'hover:bg-stone-50/50'
                        }`}
                      >
                        <td className="px-6 py-4" onClick={(e) => toggleSelectOrder(o._id, e)}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                            checked={selectedOrderIds.includes(o._id)}
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-medium text-stone-500 group-hover:text-blue-600 transition-colors relative">
                          <div className="flex items-center gap-2">
                            <span>#{o.orderId}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTelemetryClick(o._id);
                              }}
                              className="text-stone-400 hover:text-blue-600 transition-colors p-1"
                              title="View Execution Telemetry"
                            >
                              <FiActivity size={14} className="opacity-60 hover:opacity-100" />
                            </button>
                          </div>

                          {activeTelemetryOrderId === o._id && (
                            <div
                              ref={telemetryPopoverRef}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 bg-white border border-stone-200 shadow-2xl rounded-2xl p-4 z-50 text-left font-sans"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-center pb-1.5 border-b border-stone-100">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Trace Telemetry</span>
                                  {loadingTelemetry ? (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                  ) : (
                                    <span className="text-[9px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{telemetryData?.traceId}</span>
                                  )}
                                </div>
                                {loadingTelemetry ? (
                                  <div className="py-4 text-center text-xs text-stone-400">Fetching spans...</div>
                                ) : (
                                  <div className="space-y-1.5 text-xs text-stone-700">
                                    <div className="flex justify-between">
                                      <span>API Latency:</span>
                                      <span className="font-mono font-bold text-emerald-600">{telemetryData?.apiLatency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>DB Execution:</span>
                                      <span className="font-mono font-bold text-blue-600">{telemetryData?.dbExecution}</span>
                                    </div>
                                    <div className="text-[10px] text-stone-400 mt-2 border-t border-stone-100 pt-1.5">
                                      Trace fetched from traceMiddleware
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-stone-900">{o.user?.name || "Guest"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wide border ${o.paymentMethod === "Prepaid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                            {o.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-bold text-stone-900">₹{o.totalAmount.toLocaleString()}</td>
                        <td className="px-6 py-4"><StatusPill status={o.status} /></td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <AnimatePresence mode="wait">
                            {pendingCancelOrder?.id === o._id ? (
                              <motion.div
                                key="safeguard"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 22 } }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl p-1.5 shadow-sm inline-flex"
                              >
                                <span className="text-[10px] font-bold text-rose-700 whitespace-nowrap pl-1">Confirm Cancel?</span>
                                <button
                                  onClick={() => {
                                    updateStatus(o._id, pendingCancelOrder.status);
                                    setPendingCancelOrder(null);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setPendingCancelOrder(null)}
                                  className="px-2.5 py-1 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-lg hover:bg-stone-300 transition-colors"
                                >
                                  No
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-end gap-2"
                              >
                                <select
                                  value={o.status}
                                  disabled={o.status.includes("Cancelled") || o.status === "Delivered"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "Cancelled" || val === "Cancelled by User") {
                                      setPendingCancelOrder({ id: o._id, status: val });
                                    } else {
                                      updateStatus(o._id, val);
                                    }
                                  }}
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">
                Showing {Math.min(filteredOrders.length, (currentPage - 1) * pageSize + 1)} to{" "}
                {Math.min(filteredOrders.length, currentPage * pageSize)} of {filteredOrders.length} orders
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3.5 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:bg-stone-50"
                >
                  Prev
                </button>
                <div className="flex items-center text-xs font-bold text-stone-700 px-1">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3.5 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:bg-stone-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
        )}

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

function OrderDetailsModal({ order, onClose, updateRefundStatus, onProcessRefund, fetchOrders, handleDeleteOrder }) {
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const filename = imagePath.split(/[/\\]/).pop();
    return `/uploads/${filename}`;
  };

  const canAutoRefund = order.paymentMethod === "Prepaid" && order.isPaid && order.paymentId;

  const [actualWeights, setActualWeights] = useState(
    order.items.reduce((acc, item, idx) => {
      if (item.orderedWeightGrams > 0) {
        acc[idx] = item.actualWeightGrams || item.orderedWeightGrams;
      }
      return acc;
    }, {})
  );
  const [submittingWeight, setSubmittingWeight] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const isCOD = order.paymentMethod === "COD";
  const isPaid = order.isPaid === true;
  const walletUsed = order.walletAppliedAmount || 0;
  const refundAmount = (isCOD || !isPaid) ? walletUsed : (order.totalAmount + walletUsed);

  const handleWalletRefund = async () => {
    if (!window.confirm(`Refund ₹${refundAmount} to customer's wallet and cancel this order?`)) return;
    setRefunding(true);
    try {
      const { data } = await axios.post("/api/payment/refund-wallet", { orderId: order._id }, { withCredentials: true });
      toast.success(data.message || "Refund processed!");
      if (fetchOrders) fetchOrders(true);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Wallet refund failed");
    } finally {
      setRefunding(false);
    }
  };

  const handleConfirmWeights = async () => {
    setSubmittingWeight(true);
    const itemWeights = Object.keys(actualWeights).map((key) => ({
      itemIndex: Number(key),
      actualWeightGrams: Number(actualWeights[key]),
    }));
    try {
      const res = await axios.post(`/api/admin/orders/${order._id}/confirm-weight`, { itemWeights }, { withCredentials: true });
      toast.success(res.data.message);
      if (fetchOrders) fetchOrders(true);
      onClose();
    } catch (err) {
      toast.error("Failed to confirm weights");
    } finally {
      setSubmittingWeight(false);
    }
  };

  const hasWeightItems = order.items.some(item => item.orderedWeightGrams > 0);
  const showConfirmButton = hasWeightItems && !order.weightVarianceRefundIssued;
  const canWalletRefund = !order.status?.includes("Cancelled") && order.refundStatus !== "Refunded to Wallet" && refundAmount > 0;

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

        {/* Cancellation Reason Banner */}
        {order.cancelReason && (
          <div className="px-8 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <FiXCircle size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-0.5">Cancellation Reason</p>
              <p className="text-sm font-bold text-rose-700">{order.cancelReason}</p>
            </div>
          </div>
        )}



        {/* content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Row 1: Order Timeline & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Timeline */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Order Timeline</h4>
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-stone-900 flex justify-between">
                  Created <span className="font-mono text-stone-500 text-xs">{new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </p>
                {order.paidAt && (
                  <p className="text-sm font-medium text-stone-900 flex justify-between">
                    Paid <span className="font-mono text-stone-500 text-xs">{new Date(order.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                )}
                {order.deliveredAt && (
                  <p className="text-sm font-medium text-stone-900 flex justify-between">
                    Delivered <span className="font-mono text-stone-500 text-xs">{new Date(order.deliveredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                )}
                {order.deliverySlot && (
                  <p className="text-sm font-medium text-stone-900 flex justify-between">
                    Slot <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{order.deliverySlot}</span>
                  </p>
                )}
                {order.deliveryDate && (
                  <p className="text-sm font-medium text-stone-900 flex justify-between">
                    Delivery Date <span className="font-mono text-stone-500 text-xs">{new Date(order.deliveryDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Payment Information</h4>
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-stone-900 flex justify-between">Method <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${order.paymentMethod === "Prepaid" ? "bg-emerald-50 text-emerald-700" : order.paymentMethod === "Wallet" ? "bg-purple-50 text-purple-700" : "bg-amber-50 text-amber-700"}`}>{order.paymentMethod}</span></p>
                <p className="text-sm font-medium text-stone-900 flex justify-between">Transaction ID <span className="font-mono text-stone-500 text-xs">{order.paymentId || "N/A"}</span></p>
                <p className="text-sm font-medium text-stone-900 flex justify-between">Paid Status <span className={order.isPaid ? "text-emerald-600 font-bold text-xs" : "text-amber-600 font-bold text-xs"}>{order.isPaid ? "✓ Paid" : "Unpaid"}</span></p>
                {order.refundStatus && order.refundStatus !== "None" && (
                  <p className="text-sm font-medium text-stone-900 flex justify-between">Refund <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{order.refundStatus}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Shipping & Price Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Price Breakdown */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Price Breakdown</h4>
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-700 flex justify-between">Subtotal <span className="font-mono font-bold text-stone-900">₹{order.itemsPrice?.toLocaleString() || 0}</span></p>
                <p className="text-sm font-medium text-stone-700 flex justify-between">Tax (GST) <span className="font-mono font-bold text-stone-900">₹{order.taxPrice?.toLocaleString() || 0}</span></p>
                <p className="text-sm font-medium text-stone-700 flex justify-between">Shipping <span className="font-mono font-bold text-stone-900">₹{order.shippingPrice?.toLocaleString() || 0}</span></p>
                {order.couponCode && (
                  <p className="text-sm font-medium text-emerald-700 flex justify-between bg-emerald-50/50 px-2 py-1 rounded-lg -mx-2">
                    <span className="flex items-center gap-1.5">🏷️ Coupon <code className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded font-bold">{order.couponCode}</code></span>
                    <span className="font-mono font-bold">-₹{order.couponDiscount?.toLocaleString() || order.discount?.toLocaleString() || 0}</span>
                  </p>
                )}
                {!order.couponCode && order.discount > 0 && (
                  <p className="text-sm font-medium text-emerald-700 flex justify-between">Discount <span className="font-mono font-bold">-₹{order.discount?.toLocaleString()}</span></p>
                )}
                {order.walletAppliedAmount > 0 && (
                  <p className="text-sm font-medium text-purple-700 flex justify-between bg-purple-50/50 px-2 py-1 rounded-lg -mx-2">
                    <span className="flex items-center gap-1.5">💰 Wallet Used</span>
                    <span className="font-mono font-bold">-₹{order.walletAppliedAmount?.toLocaleString()}</span>
                  </p>
                )}
                <div className="border-t border-stone-200 pt-2 mt-2">
                  <p className="text-base font-bold text-stone-900 flex justify-between">Grand Total <span className="font-mono">₹{order.totalAmount?.toLocaleString()}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Proof */}
          {((order.deliveryProof && (order.deliveryProof.photoUrl || order.deliveryProof.signature)) || order.proofOfDelivery) ? (
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">📸 Proof of Delivery & Handoff</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(order.deliveryProof?.photoUrl || order.proofOfDelivery) && (
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">POD Photo</span>
                    <img 
                      src={order.deliveryProof?.photoUrl || order.proofOfDelivery} 
                      alt="Proof of Delivery" 
                      className="max-h-48 rounded-xl object-contain border border-stone-200 bg-white p-1.5 shadow-sm"
                    />
                  </div>
                )}
                {order.deliveryProof?.signature && (
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Customer Signature</span>
                    <img 
                      src={order.deliveryProof.signature} 
                      alt="Customer Signature" 
                      className="max-h-24 rounded-xl object-contain border border-stone-200 bg-white p-2.5 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            order.status === "Delivered" && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>No digital signature or photo proof was captured during handoff (Old Order / Manual dispatch).</span>
              </div>
            )
          )}

          {/* Gift Message Card */}
          {order.giftMessage && (
            <div className="bg-[#5BBFB5]/10 p-6 rounded-3xl border border-[#5BBFB5]/20 flex items-start gap-4">
              <div className="w-10 h-10 bg-[#5BBFB5] text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎁</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold text-[#5BBFB5] uppercase tracking-widest">Personalized Gift Card Message</h4>
                <p className="text-sm font-semibold text-stone-800 mt-1.5 italic bg-white/60 p-3.5 rounded-2xl border border-[#5BBFB5]/10 leading-relaxed shadow-sm">
                  "{order.giftMessage}"
                </p>
              </div>
            </div>
          )}

          {/* Refund Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Refund */}
            {canWalletRefund && (
              <div className="p-6 rounded-2xl border border-purple-200 bg-purple-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Refund to Wallet</h4>
                  <span className="text-xs font-bold text-purple-700">₹{refundAmount?.toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">
                  {(isCOD || !isPaid)
                    ? "Cancel order and refund the wallet balance used to the customer's wallet balance instantly."
                    : "Cancel order and refund the total paid amount to the customer's wallet balance instantly."
                  }
                </p>
                <button
                  onClick={handleWalletRefund}
                  disabled={refunding}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FiDollarSign size={14} />
                  {refunding ? "Processing Refund..." : "Refund to Wallet"}
                </button>
              </div>
            )}

            {/* Already refunded badge */}
            {order.refundStatus === "Refunded to Wallet" && (
              <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FiDollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Refunded to Wallet</p>
                  <p className="text-sm text-emerald-600 mt-0.5">₹{order.walletAppliedAmount?.toLocaleString() || order.totalAmount?.toLocaleString()} credited to customer wallet</p>
                </div>
              </div>
            )}

            {/* 💰 Pending Wallet Refund — Admin Approval Required */}
            {order.refundStatus === "Pending" && order.walletAppliedAmount > 0 && (
              <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <FiDollarSign size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Wallet Refund Pending</p>
                    <p className="text-sm text-amber-600 mt-0.5">₹{order.walletAppliedAmount?.toLocaleString()} needs to be refunded to customer wallet</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg uppercase">Awaiting Approval</span>
                </div>
                <button
                  onClick={() => updateRefundStatus(order._id, "Refunded to Wallet")}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FiDollarSign size={14} />
                  Approve Wallet Refund · ₹{order.walletAppliedAmount?.toLocaleString()}
                </button>
              </div>
            )}

            {/* Razorpay Refund */}
            {canAutoRefund && (
              <div className={`p-6 rounded-2xl border border-stone-200 ${order.refundStatus === "Success" ? "bg-emerald-50/50" : "bg-blue-50/50"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Razorpay Refund</h4>
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
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Order Items ({order.items.length})</h4>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={getFullImageUrl(item.image)} className="w-12 h-12 object-contain bg-stone-50 rounded-lg p-1" />
                    <div className="flex-1">
                      <p className="font-bold text-stone-900 text-sm">{item.name}</p>
                      <div className="flex flex-wrap gap-2 items-center text-xs text-stone-500 font-medium mt-0.5">
                        <span>Qty: {item.qty}</span>
                        {item.selectedCut && (
                          <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            Cut: {item.selectedCut}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-mono font-bold text-stone-900">₹{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  {item.orderedWeightGrams > 0 && (
                    <div className="border-t border-stone-50 pt-2 mt-1 flex flex-col gap-1">
                      <div className="text-xs text-stone-500 font-semibold flex justify-between">
                        <span>Ordered Weight:</span>
                        <span>{item.orderedWeightGrams >= 1000 ? `${item.orderedWeightGrams/1000}kg` : `${item.orderedWeightGrams}g`}</span>
                      </div>
                      {order.weightVarianceRefundIssued ? (
                        <div className="text-xs text-stone-500 font-semibold flex justify-between">
                          <span>Packed Weight:</span>
                          <span>{item.actualWeightGrams || item.orderedWeightGrams}g</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 mt-1 bg-stone-50/50 p-2 rounded-xl">
                          <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Packed Weight:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={actualWeights[i] || ""}
                              onChange={(e) => setActualWeights({ ...actualWeights, [i]: Number(e.target.value) })}
                              className="w-20 bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 outline-none text-right"
                              placeholder="grams"
                            />
                            <span className="text-xs text-stone-400 font-semibold">g</span>
                          </div>
                        </div>
                      )}
                      {!order.weightVarianceRefundIssued && actualWeights[i] < item.orderedWeightGrams && (
                        <div className="text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100 flex justify-between items-center">
                          <span>Shortfall Refund Preview:</span>
                          <span className="font-mono">₹{Math.round((item.orderedWeightGrams - (actualWeights[i] || 0)) * (item.price / item.orderedWeightGrams))}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showConfirmButton && (
              <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-[11px] text-stone-500 font-medium leading-relaxed max-w-lg">
                  ⚖️ Confirm actual packed weights for items. If the packed weight is less than ordered, the difference will be automatically refunded to the user's wallet.
                </div>
                <button
                  onClick={handleConfirmWeights}
                  disabled={submittingWeight}
                  className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {submittingWeight ? "Confirming..." : "Confirm Weights"}
                </button>
              </div>
            )}

            {order.weightVarianceRefundIssued && (
              <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-center gap-2">
                <span>⚖️</span>
                <span className="text-xs font-bold">Packed weights confirmed! Refund of ₹{order.weightVarianceRefundAmount || 0} issued to wallet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-stone-50 border-t border-stone-100">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-6 py-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-100 text-xs uppercase">Close</button>
              <button
                onClick={() => handleDeleteOrder(order._id, order.orderId)}
                className="px-4 py-3 bg-white border border-rose-200 text-rose-500 font-bold rounded-xl hover:bg-rose-50 text-xs uppercase flex items-center gap-1.5 transition-colors"
              >
                <FiTrash2 size={13} /> Delete
              </button>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-stone-500">Subtotal: <span className="font-bold text-stone-900">₹{order.itemsPrice?.toLocaleString() || 0}</span></p>
              {order.discount > 0 && <p className="text-xs text-emerald-600">Discount: <span className="font-bold">-₹{order.discount?.toLocaleString()}</span></p>}
              <p className="text-xs text-stone-500">Tax: <span className="font-bold text-stone-900">₹{order.taxPrice?.toLocaleString() || 0}</span></p>
              <p className="text-xl font-light text-stone-900 mt-2">Total: <span className="font-bold">₹{order.totalAmount?.toLocaleString()}</span></p>
            </div>
          </div>
          <div className="hidden"><Invoice order={order} /></div>
        </div>

      </motion.div>
    </div>
  );
}

function KanbanBoard({ orders, onUpdateStatus, onSelectOrder, partners, onAssignPartner }) {
  const columns = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData("text/plain", orderId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("text/plain");
    if (orderId) {
      onUpdateStatus(orderId, status);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 overflow-x-auto pb-6">
      {columns.map((column) => {
        const columnOrders = orders.filter(o => o.status === column);
        return (
          <div
            key={column}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
            className="flex flex-col min-w-[280px] bg-stone-50 border border-stone-200/60 rounded-3xl p-4 min-h-[600px] shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">{column}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
                {columnOrders.length}
              </span>
            </div>

            {/* Cards list */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] no-scrollbar">
              {columnOrders.map((order) => (
                <div
                  key={order._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, order._id)}
                  onClick={() => onSelectOrder(order)}
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-left"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-blue-600">#{order.orderId}</span>
                    <span className="text-xs font-bold text-stone-800">₹{(order.totalAmount || 0).toLocaleString()}</span>
                  </div>

                  <p className="text-xs font-bold text-stone-800 truncate mb-1">
                    {order.shippingAddress?.fullName || order.user?.name}
                  </p>
                  
                  <div className="text-[10px] text-slate-500 truncate mb-3">
                    {order.items?.map(i => `${i.qty}x ${i.name}`).join(", ")}
                  </div>

                  {column === "Processing" && partners.length > 0 && (
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      <select
                        onChange={(e) => onAssignPartner(order._id, e.target.value)}
                        value={order.deliveryPartner?._id || ""}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl text-[10px] p-2 font-semibold text-stone-600 outline-none cursor-pointer"
                      >
                        <option value="" disabled>Assign Partner...</option>
                        {partners.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-stone-100" onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] text-stone-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-1">
                      {column !== "Pending" && (
                        <button
                          onClick={() => {
                            const prevStatus = columns[columns.indexOf(column) - 1];
                            if (prevStatus) onUpdateStatus(order._id, prevStatus);
                          }}
                          className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold flex items-center justify-center transition-colors"
                          title="Move Left"
                        >
                          ←
                        </button>
                      )}
                      {column !== "Cancelled" && column !== "Delivered" && (
                        <button
                          onClick={() => {
                            const nextStatus = columns[columns.indexOf(column) + 1];
                            if (nextStatus) onUpdateStatus(order._id, nextStatus);
                          }}
                          className="w-6 h-6 rounded bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center transition-colors"
                          title="Move Right"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {columnOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/20">
                  <span className="text-xs text-stone-400">Empty column</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}