import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiLock, FiPackage, FiTruck } from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext";
import { removeFromCart, updateQty } from "../utils/cartStorage";

const API_URL = import.meta.env.VITE_API_URL || ""; 

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `${API_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};

// --- Subtotal Counter Component for smooth numbers ---
const PriceCounter = ({ value }) => {
  return (
    <motion.span
      key={value}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="inline-block"
    >
      ₹{value.toLocaleString()}
    </motion.span>
  );
};

export default function CartSidebar({ isOpen, onClose }) {
  const { cartCount, refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Free delivery threshold logic
  const FREE_DELIVERY_THRESHOLD = 1000;
  const deliveryProgress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);

  const handleUpdate = (item, newQty) => {
    if (newQty < 1) return;
    updateQty(item._id, newQty);
    refreshCartCount();
  };

  const handleRemove = (id) => {
    removeFromCart(id);
    refreshCartCount();
  };

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP BLUR */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
          />

          {/* SIDEBAR DRAWER - Updated for full width on Mobile */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full md:max-w-md bg-white dark:bg-[#0b1221] shadow-2xl z-[70] flex flex-col border-l border-slate-100 dark:border-white/5 transition-colors duration-500"
          >
            
            {/* HEADER - Adjusted padding for mobile */}
            <div className="px-4 md:px-6 py-4 md:py-6 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <FiShoppingBag size={20} md:size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Your Cart</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cartCount} Items</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-all">
                  <FiX size={24} />
                </button>
              </div>

              {/* DELIVERY PROGRESS BAR */}
              {cartItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    <span className="text-emerald-600 dark:text-emerald-500">Freshness Meter</span>
                    <span className="text-slate-400">
                        {subtotal < FREE_DELIVERY_THRESHOLD 
                            ? `Add ₹${FREE_DELIVERY_THRESHOLD - subtotal} more` 
                            : "Free Shipping Unlocked!"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${deliveryProgress}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CART ITEMS LIST */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 no-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                    <FiPackage size={32} className="text-slate-200 dark:text-slate-700" />
                  </div>
                  <p className="text-slate-500 font-bold tracking-tight">Your catch is empty.</p>
                  <button onClick={onClose} className="mt-4 text-blue-600 font-bold text-sm">Continue Shopping</button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item._id} 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="group flex gap-3 md:gap-4 p-3 md:p-4 rounded-[1.25rem] md:rounded-[1.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all shadow-sm"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2 shrink-0">
                        <img src={getFullImageUrl(item.image)} className="w-full h-full object-contain" alt={item.name} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate pr-2">{item.name}</h4>
                          <button onClick={() => handleRemove(item._id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                            <FiTrash2 size={14} md:size={16} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 rounded-full p-1 border border-slate-200/50 dark:border-slate-700">
                            <button onClick={() => handleUpdate(item, item.qty - 1)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm"><FiMinus size={10} /></button>
                            <span className="text-[10px] md:text-xs font-black w-6 md:w-8 text-center text-slate-900 dark:text-white">{item.qty}</span>
                            <button onClick={() => handleUpdate(item, item.qty + 1)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm"><FiPlus size={10} /></button>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white text-xs md:text-sm">₹{(item.price * item.qty).toFixed(0)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* FOOTER */}
            {cartItems.length > 0 && (
              <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</span>
                    <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                       <PriceCounter value={subtotal} />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-slate-900 dark:bg-blue-600 text-white h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                  Checkout Now <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}