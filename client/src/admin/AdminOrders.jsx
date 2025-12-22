import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiRefreshCw, FiUser, FiMapPin, FiCalendar, FiXCircle, FiChevronRight, FiTag, FiAlertCircle, FiPhone, FiPrinter, FiDollarSign, FiTruck, FiCheckCircle, FiCreditCard, FiRotateCcw } from "react-icons/fi";
import PopupModal from "../components/PopupModal"; 
import Invoice from "../components/Invoice"; 

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app"; 
const STATUS_OPTIONS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Cancelled by User"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const [selectedOrder, setSelectedOrder] = useState(null); 

  const token = localStorage.getItem("token");

  const fetchOrders = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { 
          setOrders(res.data); 
          // 🟢 Auto-update the selected order modal if it's open
          if (selectedOrder) {
              const updated = res.data.find(o => o._id === selectedOrder._id);
              if (updated) setSelectedOrder(updated);
          }
          setLoading(false); 
      })
      .catch((err) => { console.error("Fetch Error:", err); setLoading(false); });
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    const orderToUpdate = orders.find(o => o._id === id);
    if (orderToUpdate?.status.includes("Cancelled")) {
        setModal({ show: true, message: "Action Restricted: Status cannot be modified once an order is Cancelled.", type: "error" });
        return;
    }

    try {
        await axios.put(`${API_URL}/api/orders/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
        setModal({ show: true, message: `Order status updated to ${status}`, type: "success" });
        fetchOrders();
    } catch (err) {
      setModal({ show: true, message: "Failed to update status.", type: "error" });
    }
  };

  // 🟢 NEW: Handle Automatic Razorpay Refund
  const handleRazorpayRefund = async (orderId) => {
      if(!window.confirm("⚠️ Are you sure? This will refund the full amount via Razorpay and Cancel the order.")) return;

      try {
          const res = await axios.put(`${API_URL}/api/payment/refund`, 
            { orderId, reason: "Admin Request" }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setModal({ show: true, message: "Refund Initiated. Status is now Processing.", type: "success" });
          
          // 🟢 Immediately update local state to show 'Processing' without closing modal
          fetchOrders(); 
          setSelectedOrder(prev => ({ ...prev, status: "Cancelled", refundStatus: "Processing", isPaid: false })); 

      } catch (err) {
          console.error("Refund Error:", err);
          setModal({ show: true, message: err.response?.data?.message || "Refund Failed", type: "error" });
      }
  }

  const updateRefundStatus = async (id, refundStatus) => {
      try {
          await axios.put(`${API_URL}/api/orders/${id}/status`, { refundStatus }, { headers: { Authorization: `Bearer ${token}` } });
          setModal({ show: true, message: `Refund state committed as ${refundStatus}`, type: "success" });
          
          // 🟢 Immediately update local state so manual toggle reflects instantly
          if (selectedOrder) setSelectedOrder(prev => ({...prev, refundStatus}));
          fetchOrders();
      } catch (err) { setModal({ show: true, message: "Failed to update refund status", type: "error" }); }
  }
  
  const filteredOrders = orders.filter(o => {
    const matchesStatus = filter === "All" || o.status === filter;
    return matchesStatus && (o.orderId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen font-sans text-slate-900">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">Order Console</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Settlement review and refund management.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={fetchOrders} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm">
                <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </button>
            <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 text-sm transition-all" />
            </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
         {STATUS_OPTIONS.map(status => (
             <button key={status} onClick={() => setFilter(status)} className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap ${filter === status ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{status}</button>
         ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="py-4 px-6">Order ID</th>
              <th className="py-4 px-6">Customer</th>
              <th className="py-4 px-6">Payment Info</th>
              <th className="py-4 px-6">Total</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredOrders.map((o) => (
              <tr key={o._id} onClick={() => setSelectedOrder(o)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                <td className="py-4 px-6 font-mono font-medium text-slate-600 group-hover:text-blue-600">#{o.orderId || o._id.slice(-6).toUpperCase()}</td>
                <td className="py-4 px-6"><span className="font-medium text-slate-900">{o.user?.name || "Guest"}</span></td>
                <td className="py-4 px-6">
                    <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded w-max border ${o.paymentMethod === 'Prepaid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{o.paymentMethod || 'COD'}</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 font-mono">{o.paymentId ? `TXN: ${o.paymentId.slice(-8)}` : "No TXN ID"}</span>
                    </div>
                </td>
                <td className="py-4 px-6 font-bold text-[#0f172a]">₹{o.totalAmount.toLocaleString()}</td>
                <td className="py-4 px-6"><StatusPill status={o.status} /></td>
                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <select value={o.status} disabled={o.status.includes("Cancelled")} onChange={(e) => updateStatus(o._id, e.target.value)} className="border rounded-lg p-1 text-xs font-bold">
                        {STATUS_OPTIONS.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((o) => (
          <div key={o._id} onClick={() => setSelectedOrder(o)} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform">
             <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono font-bold text-blue-600">#{o.orderId}</span>
                <StatusPill status={o.status} />
             </div>
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-sm font-bold text-slate-900">{o.user?.name || "Guest"}</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{o.paymentMethod} • ₹{o.totalAmount}</p>
                </div>
                <FiChevronRight className="text-slate-300" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
    const styles = { Pending: "bg-amber-50 text-amber-700 border-amber-200", Processing: "bg-blue-50 text-blue-700 border-blue-200", Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200", Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200", Cancelled: "bg-red-50 text-red-700 border-red-200", "Cancelled by User": "bg-red-100 text-red-800 border-red-300 font-black" };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.Pending}`}><span className={`w-1 h-1 rounded-full mr-1.5 ${status.includes('Cancelled') ? 'bg-red-500' : 'bg-current opacity-50'}`}></span>{status}</span>;
}

function OrderDetailsModal({ order, onClose, updateRefundStatus, onProcessRefund }) {
    // 🟢 FIXED: Robust image URL handling with Visible Placeholder fallback
    const getFullImageUrl = (imagePath) => {
        if (!imagePath) return "https://placehold.co/400?text=No+Image";
        const filename = imagePath.split(/[/\\]/).pop(); // Handles both / and \ paths
        return `${API_URL}/uploads/${filename}`;
    };

    const canAutoRefund = order.paymentMethod === "Prepaid" && order.isPaid && order.paymentId;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
                <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold">Order #{order.orderId}</h2>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] md:text-xs text-slate-500 font-mono">TXN: {order.paymentId || "N/A"}</span>
                             {order.isPaid && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold">PAID</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.print()} className="p-2 bg-slate-100 rounded-xl text-slate-700"><FiPrinter size={18} /></button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><FiXCircle size={24} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {/* REFUND SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border p-4 rounded-2xl">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account Settlement</h4>
                             <p className="text-sm font-bold text-slate-900">User UPI: <span className="text-blue-600 font-mono">{order.paymentResult?.upi_id || "Not Provided"}</span></p>
                        </div>

                        {/* 🟢 Razorpay Auto Refund Panel (2-Step Flow) */}
                        {canAutoRefund && (
                            <div className={`p-4 rounded-2xl border-2 ${order.refundStatus === 'Success' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${order.refundStatus === 'Success' ? 'text-emerald-800' : 'text-blue-800'}`}>Refund Management</h4>
                                
                                {order.refundStatus === "Success" ? (
                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase">
                                        <FiCheckCircle size={16}/> Refund Processed Successfully 
                                    </div>
                                ) : order.refundStatus === "Processing" ? (
                                    /* 🟢 Step 2: Processing State -> Confirm Success */
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                                            <FiRefreshCw className="animate-spin"/> Refund Initiated & Processing...
                                        </div>
                                        <button 
                                            onClick={() => updateRefundStatus(order._id, "Success")}
                                            className="w-full py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                                        >
                                            CONFIRM REFUND SUCCESS
                                        </button>
                                        <p className="text-[9px] text-slate-400 text-center">Click confirming once money leaves account.</p>
                                    </div>
                                ) : (
                                    /* 🟢 Step 1: Initial State -> Start Refund */
                                    <button 
                                        onClick={() => onProcessRefund(order._id)}
                                        disabled={order.status === "Cancelled" && !order.paymentId}
                                        className="w-full py-2.5 rounded-xl text-xs font-black bg-slate-900 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiRotateCcw size={14}/> PROCESS RAZORPAY REFUND
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* 🟢 Fallback / Manual Refund (UNLOCKED buttons) */}
                        {(!canAutoRefund && order.status.includes("Cancelled")) && (
                             <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl">
                                <h4 className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-3">Manual Refund Status</h4>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => updateRefundStatus(order._id, "Initiated")} 
                                        className={`flex-1 py-2 rounded-lg text-[9px] font-black border ${order.refundStatus === "Initiated" ? "bg-orange-600 text-white" : "bg-white text-orange-600 border-orange-200"}`}
                                    >
                                        INITIATED
                                    </button>
                                    <button 
                                        onClick={() => updateRefundStatus(order._id, "Success")} 
                                        className={`flex-1 py-2 rounded-lg text-[9px] font-black border ${order.refundStatus === "Success" ? "bg-emerald-600 text-white" : "bg-white text-emerald-600 border-emerald-200"}`}
                                    >
                                        SUCCESSFUL
                                    </button>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 text-center">Update manually based on offline settlement.</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer</h3>
                            <p className="text-sm font-bold text-slate-900">{order.user?.name}</p>
                            <p className="text-xs text-slate-500">{order.user?.email}</p>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shipping To</h3>
                            <p className="text-xs leading-relaxed text-slate-600">{order.shippingAddress?.houseNo}, {order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                            <p className="text-xs text-blue-600 font-bold mt-1"><FiPhone className="inline rotate-90 mr-1" size={10}/> {order.shippingAddress?.phone}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Line Items</h3>
                        {order.items.map((item, index) => (
                            <div key={index} className="flex items-center bg-white p-3 rounded-xl border border-slate-100 gap-4">
                                <img src={getFullImageUrl(item.image)} className="w-10 h-10 object-contain bg-slate-50 rounded-lg" />
                                <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{item.name}</p><p className="text-[10px] text-slate-500">₹{item.price} x {item.qty}</p></div>
                                <p className="text-xs font-black text-blue-600">₹{(item.price * item.qty).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="px-6 md:px-8 py-5 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-lg md:text-2xl font-serif font-bold text-blue-600">Total: ₹{order.totalAmount}</p>
                    <button onClick={onClose} className="w-full md:w-auto px-10 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase">Close Console</button>
                </div>
                <div className="hidden"><Invoice order={order} type="invoice" /></div>
            </motion.div>
        </div>
    );
}