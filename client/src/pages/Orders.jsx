import React, { useState, useEffect, useContext } from "react";
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
  FiTruck,
  FiFileText
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import ReviewModal from "../components/ReviewModal";
import PopupModal from "../components/PopupModal";

const API_URL = import.meta.env.VITE_API_URL || "";

const getStatusMeta = (status) => {
  switch (status) {
    case "Delivered":
      return {
        bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: <FiCheck size={14} />,
        progress: 100,
        label: "Handed Over",
      };
    case "Cancelled":
      return {
        bg: "bg-red-500/10 text-red-600 border-red-500/20",
        icon: <FiX size={14} />,
        progress: 0,
        label: "Voided",
      };
    case "Shipped":
      return {
        bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        icon: <FiTruck size={14} className="animate-pulse" />,
        progress: 75,
        label: "In Transit",
      };
    default:
      return {
        bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        icon: <FiRefreshCcw size={14} className="animate-spin" />,
        progress: 30,
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

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalConfig, setModalConfig] = useState({ show: false, message: "", type: "info" });

  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true });
      setOrders(response.data);
    } catch (err) {
      if (err.response?.status === 401) setTimeout(() => navigate("/login"), 1000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const getUserReview = (item, orderUserId) => {
    const productData = item.productId || item.product;
    if (!productData?.reviews) return null;
    return productData.reviews.find((r) => {
      const reviewUserId = typeof r.user === "object" ? r.user._id : r.user;
      const currentUserId = typeof orderUserId === "object" ? orderUserId._id : orderUserId;
      return reviewUserId?.toString() === currentUserId?.toString();
    });
  };

  const openReviewModal = (item, existingReview) => {
    const realProductId = item.productId?._id || item.productId || item.product?._id || item.product || item._id;
    setSelectedProduct({ _id: realProductId, name: item.name });
    setSelectedReview(existingReview);
    setIsReviewOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#0b101d] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading your history</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b101d] text-slate-900 dark:text-slate-200 p-4 md:p-12 transition-colors duration-500 pt-32 md:pt-40 relative">
      <PopupModal show={modalConfig.show} message={modalConfig.message} type={modalConfig.type} onClose={() => setModalConfig({ ...modalConfig, show: false })} />
      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} product={selectedProduct} existingReview={selectedReview} token={null} API_URL={API_URL} onSuccess={() => { setModalConfig({ show: true, message: "Review Saved!", type: "success" }); fetchOrders(); }} />

      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-400/5 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2 block">SeaBite Logistics</span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
              Order <span className="italic font-light text-slate-400">Archive</span>
            </h2>
          </div>
          {orders.length > 0 && (
            <div className="px-6 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500">
              {orders.length} Records Found
            </div>
          )}
        </header>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-20 rounded-[3rem] border border-white/40 text-center shadow-xl">
            <FiShoppingBag className="mx-auto mb-6 text-slate-300" size={48} />
            <h3 className="text-2xl font-serif font-bold mb-2">No Past Catches</h3>
            <button onClick={() => navigate("/products")} className="mt-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg">Start Shopping</button>
          </div>
        ) : (
          <div className="grid gap-8">
            <AnimatePresence>
              {orders.map((order, index) => {
                const meta = getStatusMeta(order.status);
                const isDelivered = order.status === "Delivered";

                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                  >
                    {/* Header: ID and Status */}
                    <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                           <FiPackage size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tracking Reference</p>
                          <h3 className="text-sm font-bold font-mono">#{order.orderId || order._id.slice(-6).toUpperCase()}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${meta.bg}`}>
                           {meta.icon} <span className="ml-1.5">{meta.label}</span>
                         </span>
                      </div>
                    </div>

                    {/* Body: Totals and Address */}
                    <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                      {/* Column 1: Receipt Details */}
                      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6 flex items-center gap-2"><FiFileText /> Settlement</h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatCurrency(order.itemsPrice)}</span></div>
                          {order.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Coupon</span><span>-{formatCurrency(order.discount)}</span></div>}
                          <div className="flex justify-between text-slate-400"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : formatCurrency(order.shippingPrice)}</span></div>
                          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Total Paid</p>
                            <p className="text-xl font-serif font-bold">{formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Logistics */}
                      <div className="lg:col-span-2 flex flex-col justify-center">
                         <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500"><FiMapPin size={20} /></div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Destination</p>
                               <p className="font-bold text-slate-900 dark:text-white leading-tight">{order.shippingAddress?.fullName}</p>
                               <p className="text-xs text-slate-500 mt-1 italic">{order.shippingAddress?.street}, {order.shippingAddress?.city} — {order.shippingAddress?.zip}</p>
                            </div>
                         </div>
                         
                         {/* Progress Meter */}
                         <div className="space-y-2">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                             <span>Order Life-cycle</span>
                             <span className="text-blue-500">{meta.progress}%</span>
                           </div>
                           <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${meta.progress}%` }} 
                                className={`h-full ${isDelivered ? 'bg-emerald-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`} 
                              />
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* Items Accordion */}
                    <details className="group/details border-t border-slate-100 dark:border-slate-700/50">
                      <summary className="list-none px-8 py-4 cursor-pointer flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><FiShoppingBag /> Items Manifest ({order.items.length})</span>
                         <FiChevronRight className="group-open/details:rotate-90 transition-transform duration-300 text-slate-400" />
                      </summary>
                      <div className="p-8 space-y-6">
                        {order.items.map((item, idx) => {
                          const myReview = getUserReview(item, order.user);
                          return (
                            <div key={idx} className="flex flex-wrap items-center justify-between gap-6">
                              <div className="flex items-center gap-6">
                                <div className="relative group/img shrink-0">
                                   <img 
                                     src={`${API_URL}/uploads/${item.image?.replace(/^\/|\\/g, "").replace("uploads/", "")}`} 
                                     className="w-16 h-16 object-cover rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 shadow-sm transition-transform group-hover/img:scale-105" 
                                     alt={item.name}
                                   />
                                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">{item.qty}</div>
                                </div>
                                <div>
                                  <h4 className="font-serif font-bold text-slate-900 dark:text-white">{item.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatCurrency(item.price)} per unit</p>
                                </div>
                              </div>
                              
                              {isDelivered && (
                                <div className="flex items-center gap-4">
                                  {myReview && (
                                    <div className="flex text-amber-400 gap-0.5">
                                      {[...Array(5)].map((_, i) => <FiStar key={i} size={12} fill={i < myReview.rating ? "currentColor" : "none"} />)}
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => openReviewModal(item, myReview)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${myReview ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}
                                  >
                                    {myReview ? <><FiEdit2 className="inline mr-1" /> Edit Review</> : <><FiStar className="inline mr-1" /> Rate Quality</>}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>

                    {/* Footer Actions */}
                    <div className="px-8 py-4 bg-slate-50/80 dark:bg-slate-900/40 flex justify-end items-center">
                       <button 
                         onClick={() => navigate(`/orders/${order._id}`)}
                         className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:gap-4 transition-all"
                       >
                         Detailed Journey Log <FiChevronRight />
                       </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style jsx>{`
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}