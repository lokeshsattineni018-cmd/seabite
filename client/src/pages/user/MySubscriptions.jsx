import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { 
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiCreditCard,
  FiXCircle, FiPlay, FiPause, FiInfo, FiPackage, FiActivity
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/enterprise/subscriptions`, { withCredentials: true });
      if (res.data.success) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      console.error("Fetch Subscriptions Error:", err);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axios.put(`${API_URL}/api/enterprise/subscriptions/${id}/status`, { status }, { withCredentials: true });
      if (res.data.success) {
        toast.success(`Subscription ${status === 'active' ? 'resumed' : 'paused'} successfully!`);
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update subscription status");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this subscription? You will lose your 5% discount lock.")) return;
    
    try {
      const res = await axios.put(`${API_URL}/api/enterprise/subscriptions/cancel/${id}`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success("Subscription cancelled successfully");
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel subscription");
    }
  };

  if (loading) return <SeaBiteLoader fullScreen />;

  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pt-32 pb-12 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 🔙 Navigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <button 
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
          >
            <FiArrowLeft size={14} /> Back to Profile
          </button>
        </motion.div>

        {/* Header */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -z-10 group-hover:bg-teal-50 transition-all duration-700" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              📅 Recurring Subscriptions
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage your active seafood schedules with a locked-in 5% savings.</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/10 px-5 py-3 rounded-2xl border border-emerald-100 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Active schedules</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount} / {subscriptions.length}</span>
          </div>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-16 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 text-emerald-500">
              <FiCalendar size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No recurring subscriptions yet.</h2>
            <p className="text-slate-400 font-medium mb-10 max-w-md mx-auto">
              Unlock a continuous supply of ocean-fresh seafood at a fixed 5% discount, delivered straight to your door.
            </p>
            <Link 
              to="/products" 
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest shadow-xl transition-all inline-block cursor-pointer"
            >
              Explore Menu
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {subscriptions.map((sub) => {
                const totalDeliveryPrice = sub.items.reduce((sum, item) => sum + (item.priceSnapshot * item.qty), 0);
                return (
                  <motion.div
                    key={sub._id}
                    layoutId={sub._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 space-y-6 hover:border-slate-300 transition-all duration-300"
                  >
                    {/* Top row status */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <FiActivity size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subscription ID</p>
                          <p className="text-sm font-bold text-slate-800 font-mono">#{sub._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                          sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          sub.status === 'paused' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full capitalize">
                          {sub.frequency}
                        </span>
                      </div>
                    </div>

                    {/* Subscription Items */}
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Included Items</p>
                      {sub.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                            <img 
                              src={item.product?.image ? `${API_URL}/uploads/${item.product.image.replace("uploads/", "")}` : "https://placehold.co/100"} 
                              alt={item.product?.name || "Product"} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=SeaBite"; }}
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 truncate">{item.product?.name || "Ocean Catch"}</h4>
                            <p className="text-xs font-medium text-slate-500">{item.qty} units × ₹{item.priceSnapshot}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-bold text-sm text-slate-900">₹{item.qty * item.priceSnapshot}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Schedule breakdown info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                      
                      <div className="flex gap-3">
                        <FiCalendar className="text-slate-400 mt-1" size={18} />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Next Billing</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {sub.status === 'cancelled' ? 'Stopped' : new Date(sub.nextBillingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <FiMapPin className="text-slate-400 mt-1" size={18} />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivery To</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block" title={sub.shippingAddress?.street}>
                            {sub.shippingAddress?.fullName || 'Me'} - {sub.shippingAddress?.city}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <FiCreditCard className="text-slate-400 mt-1" size={18} />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Billing Method</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{sub.paymentMethod}</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary cost & Action Cluster */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-400">Total per delivery:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-xl font-black block">₹{totalDeliveryPrice}</span>
                      </div>

                      <div className="flex gap-3 w-full sm:w-auto">
                        {sub.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(sub._id, 'paused')}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:border-slate-900 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                            >
                              <FiPause size={14} /> Pause
                            </button>
                            <button
                              onClick={() => handleCancel(sub._id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 border border-red-200 hover:bg-red-50 rounded-xl text-xs font-bold text-red-500 transition-all cursor-pointer"
                            >
                              <FiXCircle size={14} /> Cancel
                            </button>
                          </>
                        )}

                        {sub.status === 'paused' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(sub._id, 'active')}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                            >
                              <FiPlay size={14} /> Resume
                            </button>
                            <button
                              onClick={() => handleCancel(sub._id)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 border border-red-200 hover:bg-red-50 rounded-xl text-xs font-bold text-red-500 transition-all cursor-pointer"
                            >
                              <FiXCircle size={14} /> Cancel
                            </button>
                          </>
                        )}

                        {sub.status === 'cancelled' && (
                          <Link
                            to={`/products/${sub.items[0]?.product?._id || ''}`}
                            className="w-full text-center flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                          >
                            Re-subscribe Catch
                          </Link>
                        )}
                      </div>
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
