// client/src/pages/Cart.jsx (PREMIUM DUAL-THEME VERSION)

import { useState, useEffect, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiShoppingBag, FiArrowRight, FiShield, FiTruck, FiActivity } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "./CartItem";
import { getCart, saveCart } from "../utils/cartStorage";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext"; // 🟢 IMPORT THEME

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext); // 🟢 USE THEME
  const navigate = useNavigate();

  useEffect(() => {
    const data = getCart();
    setCartItems(data);
    setLoading(false);
  }, []);

  const handleRemove = (id) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    saveCart(updated);
    refreshCartCount();
  };

  const handleUpdateQty = (id, newQty) => {
    if (newQty < 1) return;
    const updated = cartItems.map(item => 
      item.id === id ? { ...item, qty: newQty } : item
    );
    setCartItems(updated);
    saveCart(updated);
    refreshCartCount();
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 500 ? 0 : 50;

  if (loading) return null;

  return (
    /* 🟢 UPDATED: Dynamic background and text colors */
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-[#0a1625] text-slate-900 dark:text-slate-200 pt-32 pb-20 px-6 relative overflow-hidden transition-colors duration-500">
      
      {/* 🧬 DYNAMIC AMBIENT GLOWS */}
      <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-slate-200 dark:border-white/5 pb-10"
        >
          <div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em] mb-4 block">Manifest Registry</span>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              Your <span className="text-blue-600 italic">Basket</span>
            </h1>
          </div>
          <Link 
            to="/products" 
            className="group text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-white transition-all flex items-center gap-3"
          >
             Continue Harvest <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* LEFT: ITEMS LIST */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {cartItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-[#0e1d30]/40 backdrop-blur-md rounded-[3rem] p-24 text-center border border-dashed border-slate-200 dark:border-white/10 shadow-2xl shadow-blue-900/5"
                >
                  <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-700 shadow-inner">
                    <FiShoppingBag size={48} />
                  </div>
                  <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-3 uppercase tracking-widest">Null Response</h2>
                  <p className="text-slate-500 mb-10 max-w-xs mx-auto text-sm font-medium leading-relaxed">
                    Looks like your cargo hold is empty. Navigate back to the marketplace to initialize your catch.
                  </p>
                  <Link to="/products">
                    <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-2xl active:scale-95">
                      Explore Shoreline
                    </button>
                  </Link>
                </motion.div>
              ) : (
                cartItems.map((item) => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    onRemove={handleRemove} 
                    onUpdate={handleUpdateQty}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <AnimatePresence>
            {cartItems.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-32 bg-white dark:bg-[#0e1d30] rounded-[3rem] border border-slate-100 dark:border-white/5 p-10 shadow-2xl shadow-blue-900/5 overflow-hidden transition-colors duration-500">
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-12">Financial Summary</h3>

                  <div className="space-y-6 mb-12">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-400">Cargo Subtotal</span>
                      <span className="text-slate-900 dark:text-white font-mono text-lg tracking-tighter">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-400">Logistics Fee</span>
                      <span className={deliveryFee === 0 ? "text-emerald-600 dark:text-emerald-400 font-black uppercase text-[10px] tracking-widest" : "text-slate-900 dark:text-white font-mono text-lg tracking-tighter"}>
                        {deliveryFee === 0 ? "Complimentary" : `₹${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="pt-10 border-t border-slate-100 dark:border-white/10 flex justify-between items-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grand Total</span>
                        <span className="text-5xl font-serif font-black text-slate-900 dark:text-white tracking-tighter italic">₹{(subtotal + deliveryFee).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/checkout')}
                    className="group w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all duration-500 active:scale-95"
                  >
                    Execute Payment <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 space-y-5">
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm"><FiShield /></div>
                      Secure Matrix Encrypted
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm"><FiTruck /></div>
                      Shoreline Express
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}