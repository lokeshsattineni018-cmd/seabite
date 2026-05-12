import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiActivity, FiZap, FiUsers, FiClock, FiEye, FiArrowRight, FiX, FiCheckCircle } from "react-icons/fi";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import toast from "../utils/toast";

export default function AdminStorefrontPulse() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [flashPrice, setFlashPrice] = useState("");
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/pulse/stats", { withCredentials: true });
      setStats(data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to fetch pulse stats");
      setLoading(false);
    }
  };

  const fetchHistory = async (productId) => {
    setLoadingHistory(true);
    try {
      const { data } = await axios.get(`/api/pulse/history/${productId}`, { withCredentials: true });
      setHistory(data);
      setLoadingHistory(false);
    } catch (err) {
      toast.error("Failed to fetch history");
      setLoadingHistory(false);
    }
  };

  const handleStartFlash = async () => {
    if (!flashPrice || isNaN(flashPrice)) return toast.error("Enter valid price");
    try {
      await axios.post(`/api/pulse/flash/${selectedProduct.productId}`, {
        discountPrice: Number(flashPrice),
        durationMinutes: duration
      }, { withCredentials: true });
      
      toast.success("Instant Flash Sale started!");
      setShowFlashModal(false);
      fetchStats();
    } catch (err) {
      toast.error("Failed to start flash sale");
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><SeaBiteLoader /></div>;

  return (
    <div className="p-6 md:p-10 min-h-screen bg-stone-50 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <FiActivity size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Storefront Pulse</h1>
            <p className="text-stone-500 text-sm">Real-time browsing activity & instant sales triggers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Pulse List */}
          <div className="lg:col-span-2 space-y-4">
            {stats.map((item) => (
              <motion.div 
                key={item.productId}
                layoutId={item.productId}
                onClick={() => { setSelectedProduct(item); fetchHistory(item.productId); }}
                className={`group bg-white p-5 rounded-3xl border transition-all cursor-pointer hover:shadow-xl ${selectedProduct?.productId === item.productId ? 'border-stone-900 shadow-md scale-[1.01]' : 'border-stone-200'}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-900 truncate">{item.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-stone-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1"><FiEye size={14} className="text-stone-400" /> {item.views} views</span>
                      <span className="flex items-center gap-1"><FiUsers size={14} className="text-stone-400" /> {item.uniques} unique</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-stone-900">₹{item.basePrice}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedProduct(item); setShowFlashModal(true); }}
                      className="mt-2 flex items-center gap-2 bg-stone-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full hover:bg-rose-600 transition-colors uppercase"
                    >
                      <FiZap size={10} /> Flash Sale
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detailed Pulse & History */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedProduct ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-3xl border border-stone-200 shadow-sm sticky top-24 overflow-hidden"
                >
                  <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="font-bold text-stone-900">Browsing History</h2>
                      <button onClick={() => setSelectedProduct(null)} className="p-1.5 hover:bg-stone-200 rounded-full transition-colors"><FiX size={18} /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                        <FiClock size={20} className="text-stone-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Last 24 Hours</p>
                        <p className="text-sm font-bold text-stone-900">{selectedProduct.views} interactions</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {loadingHistory ? (
                      <div className="py-10 flex justify-center"><SeaBiteLoader small /></div>
                    ) : history.length > 0 ? (
                      history.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500">
                            {h.userId?.name?.charAt(0) || 'G'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {h.userId ? h.userId.name : 'Guest User'}
                            </p>
                            <p className="text-[10px] text-stone-400 font-medium">
                              {new Date(h.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {h.ip?.split('.').slice(0,2).join('.')}.*.*
                            </p>
                          </div>
                          {h.userId && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />}
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-stone-400 text-xs font-bold">No history found.</div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-3xl text-stone-400 p-8 text-center">
                  <FiActivity size={32} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold">Select a product to view detailed browsing behavior.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Flash Sale Modal */}
      <AnimatePresence>
        {showFlashModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFlashModal(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <FiZap size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Pulse Flash Sale</h2>
                  <p className="text-xs text-stone-500 font-medium">Trigger an instant discount for current viewers.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-4 border border-stone-100">
                  <img src={selectedProduct.image} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Base Price</p>
                    <p className="text-lg font-bold text-stone-900">₹{selectedProduct.basePrice}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 ml-1">Flash Discount Price (₹)</label>
                  <input 
                    type="number"
                    value={flashPrice}
                    onChange={(e) => setFlashPrice(e.target.value)}
                    placeholder="e.g. 899"
                    className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 font-bold text-stone-900 focus:border-stone-900 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[15, 30, 60].map(m => (
                    <button 
                      key={m}
                      onClick={() => setDuration(m)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${duration === m ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                    >
                      {m} Mins
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleStartFlash}
                  className="w-full h-14 bg-stone-900 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-rose-600 transition-all shadow-lg active:scale-[0.98]"
                >
                  <FiZap size={20} /> Launch Pulse Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
