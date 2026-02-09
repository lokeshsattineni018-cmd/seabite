import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiPackage,
  FiMapPin,
  FiCheck,
  FiX,
  FiRefreshCcw,
  FiChevronRight,
  FiShoppingBag,
  FiStar,
  FiEdit2,
  FiTag,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import ReviewModal from "../components/ReviewModal";
import PopupModal from "../components/PopupModal";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

const getStatusClasses = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: <FiCheck size={14} className="mr-1.5" />,
      };
    case "Cancelled":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: <FiX size={14} className="mr-1.5" />,
      };
    default:
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        icon: <FiRefreshCcw size={14} className="mr-1.5" />,
      };
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const FETCH_URL = `${API_URL}/api/orders/myorders`;

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setTimeout(() => navigate("/login"), 1000);
      return;
    }
    try {
      const response = await axios.get(FETCH_URL, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setOrders(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  const getUserReview = (item, orderUserId) => {
    const productData = item.productId || item.product;
    if (!productData || !productData.reviews) return null;
    return productData.reviews.find((r) => {
      const reviewUserId = typeof r.user === "object" ? r.user._id : r.user;
      const currentUserId =
        typeof orderUserId === "object" ? orderUserId._id : orderUserId;
      return reviewUserId?.toString() === currentUserId?.toString();
    });
  };

  const openReviewModal = (item, existingReview) => {
    let realProductId;
    if (item.productId) {
      realProductId =
        typeof item.productId === "object" ? item.productId._id : item.productId;
    } else if (item.product) {
      realProductId =
        typeof item.product === "object" ? item.product._id : item.product;
    } else {
      realProductId = item._id;
    }
    const productData = { _id: realProductId, name: item.name };
    setSelectedProduct(productData);
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  };

  const handleReviewSuccess = () => {
    setModalConfig({
      show: true,
      message: "Review Saved Successfully! 🌟",
      type: "success",
    });
    fetchOrders();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium tracking-widest text-xs uppercase">
          Loading History...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 p-4 md:p-8 font-sans transition-colors duration-500 pt-24 md:pt-36 overflow-x-hidden">
      <PopupModal
        show={modalConfig.show}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, show: false })}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={selectedProduct}
        existingReview={selectedReview}
        token={localStorage.getItem("token")}
        API_URL={API_URL}
        onSuccess={handleReviewSuccess}
      />

      <div className="fixed top-0 left-0 w-full h-[400px] bg-gradient-to-b from-blue-100/40 to-transparent dark:from-blue-900/10 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <br className="hidden md:block" />
            <br className="hidden md:block" />
            <br className="hidden md:block" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
              My<span className="text-blue-600">Orders</span>
            </h2>
          </div>
          {orders.length > 0 && (
            <div className="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[2rem] border border-slate-100 dark:border-white/5 text-center shadow-xl"
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShoppingBag
                className="text-blue-400 dark:text-slate-400"
                size={28}
              />
            </div>
            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-2">
              No Past Orders
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              You haven't placed any orders yet. Visit the marketplace to catch
              something fresh.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-xs hover:bg-blue-600 transition-colors shadow-lg"
            >
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence>
              {orders.map((order, index) => {
                const statusInfo = getStatusClasses(order.status);
                const isDelivered = order.status === "Delivered";

                return (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-100 dark:border-slate-700/50">
                      <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-blue-50 dark:bg-slate-700 rounded-xl hidden xs:block">
                          <FiPackage
                            className="text-blue-600 dark:text-blue-400"
                            size={20}
                          />
                        </div>
                        <div>
                          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Order ID
                          </p>
                          <h3 className="text-sm md:text-base font-mono font-bold text-slate-900 dark:text-white">
                            #
                            {order.orderId ||
                              order._id.slice(-6).toUpperCase()}
                          </h3>
                          <p className="flex items-center text-[10px] text-slate-500 font-medium mt-0.5">
                            <FiClock size={10} className="mr-1" />
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            order.paymentMethod === "Prepaid"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {order.paymentMethod || "COD"}
                        </span>
                        <div
                          className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wide flex items-center shadow-sm ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {statusInfo.icon} {order.status}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                            Bill Details
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] md:text-[11px] font-semibold text-slate-500">
                              <span>Subtotal</span>
                              <span className="text-slate-700 dark:text-slate-300">
                                ₹{(order.itemsPrice || 0).toFixed(2)}
                              </span>
                            </div>

                            {order.discount > 0 && (
                              <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-1 rounded border border-emerald-100 dark:border-emerald-800/30">
                                <span className="flex items-center gap-1">
                                  <FiTag size={10} /> Coupon
                                </span>
                                <span>
                                  - ₹{(order.discount || 0).toFixed(2)}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between text-[10px] md:text-[11px] font-semibold text-slate-500">
                              <span>Shipping Fee</span>
                              <span
                                className={
                                  order.shippingPrice === 0
                                    ? "text-emerald-500 font-bold"
                                    : "text-slate-700 dark:text-slate-300"
                                }
                              >
                                {order.shippingPrice === 0
                                  ? "FREE"
                                  : `₹${order.shippingPrice.toFixed(2)}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] md:text-[11px] font-semibold text-slate-500">
                              <span>Tax (GST 5%)</span>
                              <span className="text-slate-700 dark:text-slate-300">
                                ₹{(order.taxPrice || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col">
                          <span className="text-[10px] md:text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.totalAmount)}{" "}
                            {order.isPaid ? "Paid" : "Payable"}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2 flex flex-col justify-center">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-500 shrink-0">
                            <FiMapPin size={16} />
                          </div>
                          <div>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Shipping To
                            </p>
                            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                              {order.shippingAddress?.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              {order.shippingAddress?.houseNo},{" "}
                              {order.shippingAddress?.street},{" "}
                              {order.shippingAddress?.city} —{" "}
                              {order.shippingAddress?.zip}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <details className="group/details">
                      <summary className="list-none px-4 md:px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 cursor-pointer flex justify-between items-center select-none">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                          <FiShoppingBag size={12} /> Items (
                          {order.items.length})
                        </span>
                        <FiChevronRight
                          className="transition-transform duration-300 group-open/details:rotate-90 text-slate-400"
                          size={16}
                        />
                      </summary>

                      <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-900/50 pt-0 space-y-4">
                        <div className="h-px bg-slate-200 dark:bg-slate-700 w-full mb-4" />
                        {order.items.map((item, index) => {
                          const myReview = getUserReview(item, order.user);
                          return (
                            <div key={index} className="flex flex-col gap-2">
                              <div className="flex flex-row items-center gap-3 justify-between">
                                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                                  <div className="relative shrink-0">
                                    <img
                                      src={`${API_URL}/uploads/${item.image
                                        ?.replace(/^\/|\\/g, "")
                                        .replace("uploads/", "")}`}
                                      alt={item.name}
                                      className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 shadow-sm"
                                      onError={(e) => {
                                        e.target.src =
                                          "https://via.placeholder.com/100?text=SeaBite";
                                      }}
                                    />
                                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                      {item.qty}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[11px] md:text-xs truncate">
                                      {item.name}
                                    </h4>
                                    <p className="text-[9px] md:text-[10px] text-slate-500">
                                      {formatCurrency(item.price)}
                                    </p>
                                  </div>
                                </div>
                                {isDelivered && (
                                  <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                    {myReview && (
                                      <div className="hidden sm:flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                          <FiStar
                                            key={i}
                                            size={10}
                                            fill={
                                              i < myReview.rating
                                                ? "currentColor"
                                                : "none"
                                            }
                                          />
                                        ))}
                                      </div>
                                    )}
                                    {myReview ? (
                                      <button
                                        onClick={() =>
                                          openReviewModal(item, myReview)
                                        }
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100"
                                      >
                                        <FiEdit2 size={10} /> Edit
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          openReviewModal(item, null)
                                        }
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] md:text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-full hover:bg-amber-100"
                                      >
                                        <FiStar size={10} /> Review
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>

                    <div className="px-4 md:px-5 py-3 flex justify-end border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/30 dark:bg-slate-900/20">
                      <button
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-all flex items-center gap-1.5"
                      >
                        Details & Tracking <FiChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
