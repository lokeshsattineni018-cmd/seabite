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
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: <FiCheck size={16} className="mr-2" />,
        label: "Delivered",
      };
    case "Cancelled":
    case "Cancelled by User":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: <FiXCircle size={16} className="mr-2" />,
        label: "Cancelled",
      };
    case "Shipped":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        icon: <FiTruck size={16} className="mr-2" />,
        label: "Shipped",
      };
    default:
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        icon: <FiClock size={16} className="mr-2" />,
        label: status || "Pending",
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
    const interval = setInterval(() => {
      fetchOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handlePrintInvoice = () => {
    window.print();
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full"
        />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">
        {error}
      </div>
    );

  const statusClasses = getStatusClasses(order.status);
  const canCancel =
    !isCancelled &&
    (order.status === "Pending" || order.status === "Processing");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 pt-24 pb-12 px-4 md:px-8 font-sans transition-colors duration-500 overflow-x-hidden">
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
              initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(8px)" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] max-w-sm w-full shadow-2xl text-slate-900 border border-slate-100 dark:border-white/5"
            >
              <h3 className="text-lg font-bold mb-4 text-center text-slate-900 dark:text-white">
                Reason for Cancellation
              </h3>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none transition-all text-slate-900 dark:text-white focus:border-blue-500"
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
                    className="w-full p-3 mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none text-slate-900 dark:text-white"
                  />
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setCancelReason("");
                  }}
                  className="flex-1 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
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
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white disabled:opacity-50 transition-all hover:bg-red-700"
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-[150] mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center text-slate-500 font-bold text-xs hover:text-blue-600 transition-all cursor-pointer bg-transparent border-none p-0"
          >
            <FiArrowLeft
              size={18}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            BACK TO ORDERS
          </button>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 dark:border-white/5"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              #{order.orderId || order._id.slice(-6).toUpperCase()}
            </h1>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className={`px-4 py-1.5 rounded-full border flex items-center ${statusClasses.bg} ${statusClasses.text}`}
            >
              {statusClasses.icon}
              <span className="font-bold text-[10px] uppercase">
                {statusClasses.label}
              </span>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="p-8 bg-slate-50/30 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700/50">
            <div className="relative w-full max-w-2xl mx-auto text-slate-900">
              <div
                className={`absolute top-[14px] left-0 w-full h-[3px] rounded-full z-0 ${
                  isCancelled
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
              <div className="absolute top-[14px] left-0 h-[3px] z-0 flex w-full">
                <motion.div
                  className={`h-full rounded-full ${
                    isCancelled ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    width: isCancelled
                      ? "100%"
                      : `${
                          (currentStepIndex / (statusSteps.length - 1)) * 100
                        }%`,
                  }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>

              <div className="relative z-10 flex justify-between text-center">
                {isCancelled ? (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 bg-slate-400 shadow-sm">
                        <FiCheck className="text-white text-xs" />
                      </div>
                      <span className="mt-2 text-[9px] font-bold text-slate-400 uppercase">
                        Ordered
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 bg-red-600 shadow-md"
                      >
                        <FiXCircle className="text-white text-xs" />
                      </motion.div>
                      <span className="mt-2 text-[9px] font-black text-red-600 tracking-tighter uppercase">
                        Cancelled
                      </span>
                    </div>
                    {isPrepaid && (
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md ${
                            isRefundSuccessful ? "bg-emerald-500" : "bg-blue-500"
                          }`}
                        >
                          <FiDollarSign
                            className={`text-white text-xs ${
                              !isRefundSuccessful && "animate-bounce"
                            }`}
                          />
                        </div>
                        <span
                          className={`mt-2 text-[9px] font-black uppercase tracking-tighter ${
                            isRefundSuccessful
                              ? "text-emerald-500"
                              : "text-blue-500"
                          }`}
                        >
                          {isRefundSuccessful
                            ? "Refund Successful"
                            : "Refund Initiated"}
                        </span>
                        <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase tracking-widest">
                          {isRefundSuccessful ? "to your account" : "(6-7 Days)"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  statusSteps.map((step, index) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex flex-col items-center w-12"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 transition-colors duration-500 ${
                          index <= currentStepIndex
                            ? "bg-emerald-500 shadow-emerald-500/20 shadow-md"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        {index < currentStepIndex && (
                          <FiCheck className="text-white text-xs" />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-[9px] font-bold uppercase ${
                          index <= currentStepIndex
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {step}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Address + Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="p-6 md:border-r border-slate-100 dark:border-white/5"
            >
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FiMapPin /> Delivery Address
              </h2>
              <p className="font-bold text-base text-slate-900 dark:text-white">
                {order.shippingAddress?.fullName}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {order.shippingAddress?.street},{" "}
                {order.shippingAddress?.city} -- {order.shippingAddress?.zip}
              </p>
              <div className="mt-4 p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl inline-block">
                +91 {order.shippingAddress?.phone}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="p-6 bg-slate-50/20 dark:bg-slate-900/10 text-slate-900"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiFileText /> Payment Breakdown
                </h2>
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded uppercase tracking-widest">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.itemsPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Shipping</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {order.shippingPrice === 0
                      ? "Free"
                      : formatCurrency(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax (GST 5%)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(order.taxPrice)}
                  </span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-700 w-full my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-black text-[10px] uppercase text-slate-900 dark:text-white">
                    {order.isPaid ? "Total Paid" : "Total Payable"}
                  </span>
                  <span className="text-2xl font-serif font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {isCancelled && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl"
                  >
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase italic tracking-tight">
                      Cancellation Reason:
                    </p>
                    <p className="text-xs text-red-500 font-medium mt-1 leading-relaxed italic">
                      "{order.cancelReason || "Not specified"}"
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Items */}
          <div className="p-6 border-t border-slate-100 dark:border-white/5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiShoppingBag /> Items ({order.items.length})
            </h2>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.5 + idx * 0.08,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:border-blue-500/20 transition-colors"
                >
                  <img
                    src={`${API_URL}/uploads/${item.image.split("/").pop()}`}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-xl bg-slate-50 dark:bg-slate-800 p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black mt-0.5 tracking-tighter">
                      {"\u20B9"}{item.price.toFixed(2)} x {item.qty}
                    </p>
                  </div>
                  <div className="text-right font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(item.price * item.qty)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-slate-900 dark:text-white"
          >
            <FiHome /> Home
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePrintInvoice}
            className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all text-slate-900 dark:text-white"
          >
            <FiFileText /> Invoice
          </motion.button>
          {canCancel && (
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(239,68,68,0.15)" }}
              whileTap={{ scale: 0.97 }}
              disabled={cancelling}
              onClick={() => setShowCancelConfirm(true)}
              className="px-8 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20 rounded-2xl font-black text-xs hover:bg-red-100 transition-all"
            >
              Cancel Order
            </motion.button>
          )}
          <motion.button
            whileHover={{
              y: -2,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/products")}
            className="px-10 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg"
          >
            <FiShoppingBag /> Shop More
          </motion.button>
        </motion.div>
      </div>

      <div>
        <Invoice order={order} type="invoice" />
      </div>
    </div>
  );
}