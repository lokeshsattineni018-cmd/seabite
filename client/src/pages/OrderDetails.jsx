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
  FiCopy,
  FiPhone,
  FiCreditCard,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import PopupModal from "../components/PopupModal";
import Invoice from "../components/Invoice";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- HELPERS ---
const getStatusClasses = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
        icon: <FiCheck size={14} />,
        label: "Delivered",
        gradient: "from-emerald-500 to-emerald-600",
      };
    case "Cancelled":
    case "Cancelled by User":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/20",
        icon: <FiXCircle size={14} />,
        label: "Cancelled",
        gradient: "from-red-500 to-red-600",
      };
    case "Shipped":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20",
        icon: <FiTruck size={14} />,
        label: "Shipped",
        gradient: "from-blue-500 to-blue-600",
      };
    default:
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
        icon: <FiClock size={14} />,
        label: status || "Pending",
        gradient: "from-amber-500 to-amber-600",
      };
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

// --- TIMELINE STEP COMPONENT ---
function TimelineStep({ step, index, totalSteps, isActive, isCompleted, isCancelledFlow }) {
  const icons = {
    Pending: <FiClock size={16} />,
    Processing: <FiPackage size={16} />,
    Shipped: <FiTruck size={16} />,
    Delivered: <FiCheck size={16} />,
    Cancelled: <FiXCircle size={16} />,
    Refund: <FiDollarSign size={16} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="flex flex-col items-center relative z-10"
    >
      <motion.div
        animate={
          isActive && !isCompleted
            ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0 0 rgba(59,130,246,0)", "0 0 0 8px rgba(59,130,246,0.15)", "0 0 0 0 rgba(59,130,246,0)"] }
            : {}
        }
        transition={isActive && !isCompleted ? { duration: 2, repeat: Infinity } : {}}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
          isCompleted
            ? isCancelledFlow
              ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20"
              : "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            : isActive
            ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
        }`}
      >
        {isCompleted ? <FiCheck size={16} /> : icons[step] || <FiClock size={16} />}
      </motion.div>
      <span
        className={`mt-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
          isCompleted || isActive
            ? "text-slate-900 dark:text-white"
            : "text-slate-400"
        }`}
      >
        {step}
      </span>
    </motion.div>
  );
}

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
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];
  const currentStepIndex = statusSteps.indexOf(order?.status || "Pending");
  const isCancelled = order?.status?.includes("Cancelled");
  const isPrepaid = order?.paymentMethod === "Prepaid";
  const isRefundSuccessful =
    isCancelled && isPrepaid && order?.refundStatus === "Success";

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
    if (!orderId || orderId === "N/A") {
      setError("Invalid Order ID.");
      setLoading(false);
      return;
    }
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handlePrintInvoice = () => window.print();

  const copyOrderId = () => {
    navigator.clipboard.writeText(order?.orderId || orderId);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  const handleCancelOrder = async () => {
    const finalReason = cancelReason === "Other" ? customReason : cancelReason;
    if (!finalReason) return;

    setShowCancelConfirm(false);
    setCancelling(true);

    try {
      if (isPrepaid && order.isPaid) {
        await axios.put(
          `${API_URL}/api/payment/refund`,
          { orderId: order._id },
          { withCredentials: true }
        );
        setModalConfig({
          show: true,
          message: "Refund initiated! Money will return shortly.",
          type: "success",
        });
      } else {
        await axios.put(
          `${API_URL}/api/orders/${order._id}/cancel`,
          { reason: finalReason },
          { withCredentials: true }
        );
        setModalConfig({
          show: true,
          message: "Order cancelled successfully.",
          type: "success",
        });
      }
      fetchOrder();
    } catch (err) {
      setModalConfig({
        show: true,
        message: err.response?.data?.message || "Action failed.",
        type: "error",
      });
    } finally {
      setCancelling(false);
      setCancelReason("");
      setCustomReason("");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] flex flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FiPackage className="text-blue-600" size={18} />
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] flex flex-col items-center justify-center gap-4">
        <FiXCircle className="text-red-400" size={40} />
        <p className="text-slate-500 font-medium text-sm">{error}</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs"
        >
          Go Back
        </motion.button>
      </div>
    );

  const statusClasses = getStatusClasses(order.status);
  const canCancel =
    !isCancelled &&
    (order.status === "Pending" || order.status === "Processing");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060e1a] text-slate-900 dark:text-slate-200 font-sans transition-colors duration-500 overflow-x-hidden">
      <PopupModal
        show={modalConfig.show}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, show: false })}
      />

      {/* Cancel Confirm Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-white/5"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiXCircle className="text-red-500" size={20} />
              </div>
              <h3 className="text-lg font-bold mb-1 text-center text-slate-900 dark:text-white">
                Cancel Order
              </h3>
              <p className="text-xs text-slate-500 text-center mb-5">
                Please tell us why you want to cancel
              </p>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 mb-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none transition-all text-slate-900 dark:text-white focus:border-blue-500"
              >
                <option value="" disabled>
                  Select a reason...
                </option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Order taking too long">
                  Order taking too long
                </option>
                <option value="Found better price elsewhere">
                  Found better price elsewhere
                </option>
                <option value="Other">Other</option>
              </select>

              <AnimatePresence>
                {cancelReason === "Other" && (
                  <motion.textarea
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 96, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    placeholder="Please describe the reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full p-3 mb-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 transition-all resize-none text-slate-900 dark:text-white"
                  />
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setCancelReason("");
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Go Back
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={
                    !cancelReason ||
                    (cancelReason === "Other" && !customReason) ||
                    cancelling
                  }
                  onClick={handleCancelOrder}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 text-white disabled:opacity-50 transition-all hover:bg-red-700"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancel"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/80 via-transparent to-transparent dark:from-blue-950/20 dark:via-transparent" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-blue-100/20 dark:bg-blue-900/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 pt-24 pb-12">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-slate-500 font-bold text-xs hover:text-blue-600 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-blue-600 transition-all">
              <FiArrowLeft size={14} />
            </div>
            <span className="uppercase tracking-wider">Back to Orders</span>
          </button>
        </motion.div>

        {/* ============ ORDER HEADER CARD ============ */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden border border-slate-200/60 dark:border-white/5 mb-6"
        >
          {/* Header bar */}
          <div className="p-5 md:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  #{order.orderId || order._id.slice(-6).toUpperCase()}
                </h1>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={copyOrderId}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {copiedOrderId ? (
                    <FiCheck size={12} />
                  ) : (
                    <FiCopy size={12} />
                  )}
                </motion.button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <FiClock size={11} />
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${statusClasses.bg} ${statusClasses.text} ${statusClasses.border}`}
            >
              {statusClasses.icon}
              <span className="font-bold text-xs uppercase tracking-wider">
                {statusClasses.label}
              </span>
            </motion.div>
          </div>

          {/* ============ PROGRESS TIMELINE ============ */}
          <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700/30">
            <div className="relative w-full max-w-2xl mx-auto">
              {/* Track line */}
              <div
                className={`absolute top-5 md:top-6 left-[24px] md:left-[28px] right-[24px] md:right-[28px] h-[3px] rounded-full z-0 ${
                  isCancelled
                    ? "bg-red-100 dark:bg-red-900/20"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
              {/* Active line */}
              <motion.div
                className={`absolute top-5 md:top-6 left-[24px] md:left-[28px] h-[3px] rounded-full z-0 ${
                  isCancelled ? "bg-red-500" : "bg-emerald-500"
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: isCancelled
                    ? `calc(100% - 48px)`
                    : `calc(${
                        (currentStepIndex / (statusSteps.length - 1)) * 100
                      }% - ${currentStepIndex === 0 ? 0 : 48}px)`,
                }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />

              <div className="relative z-10 flex justify-between">
                {isCancelled ? (
                  <>
                    <TimelineStep
                      step="Pending"
                      index={0}
                      totalSteps={3}
                      isActive={false}
                      isCompleted={true}
                      isCancelledFlow={false}
                    />
                    <TimelineStep
                      step="Cancelled"
                      index={1}
                      totalSteps={3}
                      isActive={true}
                      isCompleted={true}
                      isCancelledFlow={true}
                    />
                    {isPrepaid && (
                      <div className="flex flex-col items-center relative z-10">
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                            isRefundSuccessful
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                          }`}
                        >
                          <FiDollarSign
                            size={16}
                            className={!isRefundSuccessful ? "animate-bounce" : ""}
                          />
                        </motion.div>
                        <span
                          className={`mt-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
                            isRefundSuccessful
                              ? "text-emerald-500"
                              : "text-blue-500"
                          }`}
                        >
                          {isRefundSuccessful ? "Refunded" : "Refund Pending"}
                        </span>
                        <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">
                          {isRefundSuccessful ? "to your account" : "(6-7 Days)"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  statusSteps.map((step, index) => (
                    <TimelineStep
                      key={step}
                      step={step}
                      index={index}
                      totalSteps={statusSteps.length}
                      isActive={index === currentStepIndex}
                      isCompleted={index < currentStepIndex}
                      isCancelledFlow={false}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ============ ADDRESS & PAYMENT GRID ============ */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700/30">
            {/* Address */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-5 md:p-7"
            >
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <FiMapPin size={12} /> Delivery Address
              </h2>
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/30">
                <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {order.shippingAddress?.fullName}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {order.shippingAddress?.street},{" "}
                  {order.shippingAddress?.city} -- {order.shippingAddress?.zip}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg">
                    <FiPhone size={10} />
                    +91 {order.shippingAddress?.phone}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="p-5 md:p-7"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                  <FiCreditCard size={12} /> Payment Summary
                </h2>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                    isPrepaid
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  {order.paymentMethod}
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(order.itemsPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Shipping</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {order.shippingPrice === 0
                      ? "Free"
                      : formatCurrency(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax (GST 5%)</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(order.taxPrice)}
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-700 w-full" />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-black text-xs uppercase text-slate-900 dark:text-white">
                    {order.isPaid ? "Total Paid" : "Total Payable"}
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {isCancelled && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl"
                  >
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                      Cancellation Reason
                    </p>
                    <p className="text-xs text-red-400 font-medium mt-1 leading-relaxed italic">
                      "{order.cancelReason || "Not specified"}"
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ============ ITEMS ============ */}
          <div className="p-5 md:p-7 border-t border-slate-100 dark:border-white/5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <FiShoppingBag size={12} /> Items ({order.items.length})
            </h2>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.5 + idx * 0.06,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/30 hover:border-blue-200 dark:hover:border-blue-900/40 transition-colors"
                >
                  <img
                    src={`${API_URL}/uploads/${item.image.split("/").pop()}`}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-100 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {"\u20B9"}
                      {item.price.toFixed(2)} x {item.qty}
                    </p>
                  </div>
                  <div className="text-right font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(item.price * item.qty)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ============ ACTION BUTTONS ============ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-white dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-slate-900 dark:text-white"
          >
            <FiHome size={14} /> Home
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePrintInvoice}
            className="px-6 py-3 bg-white dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-slate-900 dark:text-white"
          >
            <FiFileText size={14} /> Invoice
          </motion.button>
          {canCancel && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              disabled={cancelling}
              onClick={() => setShowCancelConfirm(true)}
              className="px-6 py-3 bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/15 rounded-2xl font-black text-xs hover:bg-red-500/10 transition-all"
            >
              Cancel Order
            </motion.button>
          )}
          <motion.button
            whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/products")}
            className="px-8 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20"
          >
            <FiShoppingBag size={14} /> Shop More
          </motion.button>
        </motion.div>
      </div>

      <div>
        <Invoice order={order} type="invoice" />
      </div>
    </div>
  );
}
