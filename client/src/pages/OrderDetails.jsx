import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiMapPin,
  FiClock,
  FiShoppingBag,
  FiArrowLeft,
  FiCheck,
  FiHome,
  FiTruck,
  FiFileText,
  FiXCircle,
  FiDollarSign,
  FiDownload,
  FiMessageCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import PopupModal from "../components/PopupModal";
import Invoice from "../components/Invoice";

const API_URL = import.meta.env.VITE_API_URL || "";

const getStatusClasses = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        text: "text-emerald-600",
        icon: <FiCheck size={18} />,
        label: "Delivered",
      };
    case "Cancelled":
    case "Cancelled by User":
      return {
        bg: "bg-red-500/10 dark:bg-red-500/20",
        text: "text-red-600",
        icon: <FiXCircle size={18} />,
        label: "Order Voided",
      };
    case "Shipped":
      return {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        text: "text-blue-600",
        icon: <FiTruck size={18} />,
        label: "In Transit",
      };
    default:
      return {
        bg: "bg-amber-500/10 dark:bg-amber-500/20",
        text: "text-amber-600",
        icon: <FiClock size={18} />,
        label: "Preparing Catch",
      };
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [modalConfig, setModalConfig] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];
  const currentStepIndex = statusSteps.indexOf(order?.status || "Pending");
  const isCancelled = order?.status.includes("Cancelled");
  const isPrepaid = order?.paymentMethod === "Prepaid";

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        withCredentials: true,
      });
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handlePrintInvoice = () => window.print();

  const handleCancelOrder = async () => {
    const finalReason = cancelReason === "Other" ? customReason : cancelReason;
    if (!finalReason) return;
    setShowCancelConfirm(false);
    setCancelling(true);
    try {
      if (isPrepaid && order.isPaid) {
        await axios.put(`${API_URL}/api/payment/refund`, { orderId: order._id }, { withCredentials: true });
        setModalConfig({ show: true, message: "Refund initiated successfully.", type: "success" });
      } else {
        await axios.put(`${API_URL}/api/orders/${order._id}/cancel`, { reason: finalReason }, { withCredentials: true });
        setModalConfig({ show: true, message: "Order cancelled.", type: "success" });
      }
      fetchOrder();
    } catch (err) {
      setModalConfig({ show: true, message: "Action failed.", type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f1a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const statusClasses = getStatusClasses(order.status);
  const canCancel = !isCancelled && (order.status === "Pending" || order.status === "Processing");

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-200 pt-28 pb-32 px-4 md:px-8 relative overflow-hidden transition-colors duration-500">
      
      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <PopupModal show={modalConfig.show} message={modalConfig.message} type={modalConfig.type} onClose={() => setModalConfig({ ...modalConfig, show: false })} />

      {/* CANCEL MODAL (Re-styled for Seafood theme) */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl border border-white/20">
              <h3 className="text-xl font-serif font-bold mb-4 text-center">Cancel Order?</h3>
              <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full p-4 mb-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold outline-none border border-slate-200 dark:border-slate-700">
                <option value="" disabled>Choose a reason...</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Too slow">Order taking too long</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-700">Go Back</button>
                <button onClick={handleCancelOrder} className="flex-1 py-4 rounded-2xl font-bold bg-red-600 text-white">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* TOP NAV */}
        <div className="mb-10">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-500 transition-all">
            <FiArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Back to History
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: JOURNEY & ITEMS */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-2xl rounded-[3rem] border border-white/40 dark:border-white/10 shadow-sm overflow-hidden">
              
              {/* JOURNEY TRACKER */}
              <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Live Shipment</h2>
                    <p className="text-2xl font-serif font-bold italic">#{order.orderId || order._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className={`px-5 py-2 rounded-full border ${statusClasses.bg} ${statusClasses.text} flex items-center gap-2`}>
                    {statusClasses.icon} <span className="text-[10px] font-black uppercase tracking-widest">{statusClasses.label}</span>
                  </div>
                </div>

                {/* PROGRESS BAR (Refined) */}
                <div className="relative pt-4 px-2">
                  <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-700 -z-0" />
                  <motion.div initial={{ width: 0 }} animate={{ width: isCancelled ? '100%' : `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }} className={`absolute top-[18px] left-0 h-[2px] z-0 ${isCancelled ? 'bg-red-500' : 'bg-blue-500'}`} />

                  <div className="flex justify-between relative z-10">
                    {statusSteps.map((step, idx) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-4 border-[#fcfcfc] dark:border-[#0b0f1a] flex items-center justify-center transition-all duration-1000 ${idx <= currentStepIndex ? (isCancelled ? 'bg-red-500' : 'bg-blue-500') : 'bg-slate-200 dark:bg-slate-700'}`}>
                          {idx < currentStepIndex && <FiCheck size={12} className="text-white" />}
                        </div>
                        <span className={`mt-3 text-[9px] font-bold uppercase tracking-widest ${idx <= currentStepIndex ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRODUCT MANIFEST */}
              <div className="p-8 md:p-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2"><FiShoppingBag /> Items Selection</h3>
                <div className="space-y-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 group">
                      <div className="w-24 h-24 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0">
                        <img src={`${API_URL}/uploads/${item.image.split("/").pop()}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-serif font-bold">{item.name}</h4>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Qty: {item.qty} • {formatCurrency(item.price)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-serif font-bold text-blue-600 dark:text-blue-400">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: DESTINATION & BILLING */}
          <div className="space-y-8">
            {/* DELIVERY CARD */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/40 dark:border-white/10 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 flex items-center gap-2"><FiMapPin /> Destination</h3>
              <p className="font-bold text-xl font-serif mb-2">{order.shippingAddress?.fullName}</p>
              <p className="text-sm text-slate-500 leading-relaxed italic">
                {order.shippingAddress?.street},<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.zip}
              </p>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><FiTruck size={18} /></div>
                <div className="text-[10px] font-black uppercase tracking-widest">Courier Dispatch<br /><span className="text-slate-400">Verified Address</span></div>
              </div>
            </motion.div>

            {/* FINANCIAL RECEIPT */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8 flex items-center gap-2"><FiFileText /> Invoice Summary</h3>
              
              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatCurrency(order.itemsPrice)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Shipping</span><span>{order.shippingPrice === 0 ? "FREE" : formatCurrency(order.shippingPrice)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Tax (GST)</span><span>{formatCurrency(order.taxPrice)}</span></div>
                <div className="h-px bg-white/10 w-full my-6" />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Total Settlement</p>
                    <p className="text-4xl font-serif font-bold mt-1 text-white">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div className="pb-1"><FiCheck className="text-emerald-500" size={24} /></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FLOAT ACTION DOCK (The "Amazon/Flipkart" Upgrade) */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[500]">
        <button onClick={handlePrintInvoice} className="p-5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-[2rem] transition-all text-slate-600 dark:text-white" title="Download Invoice"><FiDownload size={22} /></button>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-1" />
        {canCancel && (
          <button onClick={() => setShowCancelConfirm(true)} className="px-8 py-5 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[2rem] transition-all">Cancel Catch</button>
        )}
        <button onClick={() => navigate("/products")} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2">
          <FiShoppingBag /> Shop More
        </button>
      </motion.div>

      {/* Hidden Invoice for Printing */}
      <div className="hidden"><Invoice order={order} type="invoice" /></div>
    </div>
  );
}