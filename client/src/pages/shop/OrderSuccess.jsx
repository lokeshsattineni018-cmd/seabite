import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiCheck, FiShoppingBag, FiArrowRight,
  FiPackage, FiCopy, FiTruck, FiDownload, FiChevronRight, FiCheckCircle
} from "react-icons/fi";
import { generateInvoicePDF } from "../../utils/pdfGenerator";

const API_URL = import.meta.env.VITE_API_URL || "";

// ── Shared motion helpers ──────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const dbId = params.get("dbId");
  const discount = Number(params.get("discount") || 0);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [redirectTime, setRedirectTime] = useState(30);

  useEffect(() => {
    // 🔐 Navigation Guard: Prevent direct URL access
    if (!location.state?.fromCheckout) {
      navigate("/orders", { replace: true });
      return;
    }

    if (!dbId) { setLoading(false); return; }
    axios.get(`${API_URL}/api/orders/${dbId}`, { withCredentials: true })
      .then(({ data }) => setOrder(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [dbId]);

  // Handle Redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/orders", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const copyId = () => {
    if (!order?.orderId) return;
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SeaBiteLoader fullScreen />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        .success-checkmark {
          color: #10B981;
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.2));
        }
      `}</style>

      {/* Main Container */}
      <div className="max-w-[640px] mx-auto px-6 pt-24 md:pt-32">

        {/* Success Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-block mb-6"
          >
            <FiCheckCircle size={80} className="success-checkmark mx-auto" strokeWidth={1.5} />
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Thank you for your order!
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
            Your order <span className="font-bold text-gray-800">#{order?.orderId}</span> is confirmed and we're getting it ready for delivery.
          </motion.p>
        </div>

        <div className="space-y-6">

          {/* Order Details Card */}
          <motion.div {...fadeUp(0.3)} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Confirmation Details</h3>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <span>{order?.orderId}</span>
                    <button onClick={copyId} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                      {copied ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Delivery</h3>
                  <p className="text-gray-900 font-semibold flex items-center gap-2">
                    <FiTruck size={14} className="text-emerald-500" /> 2–3 Business Days
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:w-48">
                <Link to={`/orders/${dbId}`} className="block">
                  <button className="w-full bg-black text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                    View Order
                  </button>
                </Link>
                <button
                  onClick={() => generateInvoicePDF(order)}
                  className="w-full border border-gray-200 text-gray-600 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <FiDownload size={14} /> Download Invoice
                </button>
              </div>
            </div>
          </motion.div>

          {/* Items Summary Card */}
          <motion.div {...fadeUp(0.4)} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Items Summary</h3>
            <div className="space-y-6">
              {order?.items?.map((item, idx) => {
                const realId = item.productId?._id || item.productId || item.product?._id || item.product || item._id;
                return (
                  <div key={idx} className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex-shrink-0 border border-gray-100 p-2 overflow-hidden">
                      <img
                        src={`${API_URL}/uploads/${item.image?.replace("uploads/", "")}`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={e => e.target.src = "https://via.placeholder.com/80"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-1">{item.name}</p>
                      <p className="text-xs text-gray-500 font-medium">Quantity: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{item.price * item.qty}</p>
                      <p className="text-[10px] text-gray-400 font-medium">₹{item.price} ea</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-900 font-semibold">₹{((order?.totalPrice || 0) + (discount || 0)).toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount Applied</span>
                  <span className="text-emerald-600 font-semibold">-₹{(discount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg pt-2">
                <span className="font-extrabold text-gray-900">Total</span>
                <span className="font-extrabold text-gray-900">₹{(order?.totalPrice || 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Footer CTAs */}
          <motion.div {...fadeUp(0.5)} className="text-center pt-8">
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors">
              <FiShoppingBag size={16} /> Continue Shopping <FiChevronRight />
            </Link>

            <p className="mt-12 text-gray-400 text-[11px] font-medium uppercase tracking-[0.2em]">
              Redirecting in {redirectTime}s
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}