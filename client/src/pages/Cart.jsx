import { useEffect, useState, useContext } from "react";
import { getCart, saveCart } from "../utils/cartStorage";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiLock, FiPackage } from "react-icons/fi";
import PopupModal from "../components/PopupModal";
import { ThemeContext } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function Cart({ open, onClose }) {
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setCart(getCart());
    }
  }, [open]);

  const updateQty = (id, change) => {
    const updated = cart
      .map((item) =>
        item.id === id ? { ...item, qty: item.qty + change } : item
      )
      .filter((item) => item.qty > 0);

    setCart(updated);
    saveCart(updated);
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    saveCart(updated);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setShowPopup(true);
      return;
    }
    onClose();
    navigate("/checkout");
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      <PopupModal
        show={showPopup}
        message="Your cart is empty! Add some fresh catch first."
        type="error"
        onClose={() => setShowPopup(false)}
      />

      <AnimatePresence>
        {open && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />

            {/* SLIDING DRAWER */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-[#0f172a] z-[70] shadow-2xl flex flex-col border-l border-slate-100 dark:border-white/5 font-sans"
            >
              
              {/* === HEADER === */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <FiShoppingBag size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none">My Cart</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cart.length} items selected</p>
                    </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* === SCROLLABLE ITEMS === */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0f172a]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <FiPackage size={40} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
                    <p className="text-slate-500 text-sm max-w-[240px] mx-auto mb-8">Looks like you haven't added anything to your cart yet.</p>
                    <button 
                      onClick={onClose}
                      className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <AnimatePresence initial={false} mode="popLayout">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5"
                      >
                        {/* Image */}
                        <div className="w-24 h-24 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl p-2 flex items-center justify-center border border-slate-100 dark:border-white/5">
                           <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen" 
                           />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">₹{item.price.toFixed(2)} / unit</p>
                              </div>
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              >
                                <FiTrash2 size={16} />
                              </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                              <button 
                                onClick={() => updateQty(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-500 shadow-sm hover:text-blue-600 transition-colors"
                              >
                                <FiMinus size={12} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">{item.qty}</span>
                              <button 
                                onClick={() => updateQty(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-slate-500 shadow-sm hover:text-blue-600 transition-colors"
                              >
                                <FiPlus size={12} />
                              </button>
                            </div>

                            <p className="font-bold text-slate-900 dark:text-white">₹{(item.price * item.qty).toFixed(2)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* === FOOTER === */}
              {cart.length > 0 && (
                <div className="p-6 bg-white dark:bg-[#0f172a] border-t border-slate-100 dark:border-white/5 z-10">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Shipping</span>
                        <span className="font-bold text-emerald-600">Calculated at checkout</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    Checkout 
                    <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                    <FiLock size={12} /> Secure Transaction
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}