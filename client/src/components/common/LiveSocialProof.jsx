import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiShoppingBag, FiMapPin, FiX } from "react-icons/fi";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function LiveSocialProof() {
  const [sale, setSale] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const socket = io(API_URL);

    socket.on("LIVE_SALE", (data) => {
      // Add to queue
      setQueue((prev) => [...prev, data]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!sale && queue.length > 0) {
      const nextSale = queue[0];
      setSale(nextSale);
      setQueue((prev) => prev.slice(1));

      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setSale(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [sale, queue]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    const filename = imagePath.split(/[/\\]/).pop();
    return `/uploads/${filename}`;
  };

  return (
    <AnimatePresence>
      {sale && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed bottom-24 left-6 z-[9999] max-w-[300px]"
        >
          <div className="bg-white/95 backdrop-blur-md border border-stone-200/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative group">
            <button 
              onClick={() => setSale(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-stone-100 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
            >
              <FiX size={12} />
            </button>

            <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 flex-shrink-0">
              <img 
                src={getImageUrl(sale.image)} 
                alt={sale.productName} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <FiShoppingBag className="text-emerald-500" size={12} />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Recent Purchase</span>
              </div>
              <p className="text-xs text-stone-900 leading-tight">
                <span className="font-bold">{sale.customerName}</span> from <span className="font-bold">{sale.location}</span> just bought <span className="text-emerald-600 font-bold">{sale.productName}</span>.
              </p>
              <div className="flex items-center gap-1 mt-1">
                <FiMapPin className="text-stone-300" size={10} />
                <span className="text-[9px] text-stone-400 font-medium">Verified Buyer • Just now</span>
              </div>
            </div>
          </div>
          
          {/* Subtle Progress Bar */}
          <motion.div 
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-1 bg-emerald-400/30 rounded-full mt-1 origin-left mx-2"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
