import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
  FiPackage,
} from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext";
import { removeFromCart, updateQty } from "../utils/cartStorage";

const API_URL = import.meta.env.VITE_API_URL || "";

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${API_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
};

const PriceCounter = ({ value }) => (
  <motion.span
    key={value}
    initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="inline-block"
  >
    {"\u20B9"}{value.toLocaleString()}
  </motion.span>
);

export default function CartSidebar({ isOpen, onClose }) {
  const { cartCount, refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const FREE_DELIVERY_THRESHOLD = 1000;
  const deliveryProgress = Math.min(
    (subtotal / FREE_DELIVERY_THRESHOLD) * 100,
    100
  );

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
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
          />

          {/* SIDEBAR */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 250,
              mass: 0.8,
            }}
            className="fixed top-0 right-0 h-full w-full md:max-w-md bg-white dark:bg-[#0b1221] shadow-2xl z-[70] flex flex-col border-l border-slate-100 dark:border-white/5 transition-colors duration-500"
          >
            {/* HEADER */}
            <div className="px-4 md:px-6 py-4 md:py-6 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    <FiShoppingBag size={20} />
                  </motion.div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Your Cart
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {cartCount} Items
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.3 }}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-all"
                >
                  <FiX size={24} />
                </motion.button>
              </div>

              {/* DELIVERY PROGRESS */}
              {cartItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    <span className="text-emerald-600 dark:text-emerald-500">
                      Freshness Meter
                    </span>
                    <span className="text-slate-400">
                      {subtotal < FREE_DELIVERY_THRESHOLD
                        ? `Add \u20B9${FREE_DELIVERY_THRESHOLD - subtotal} more`
                        : "Free Shipping Unlocked!"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deliveryProgress}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* CART ITEMS */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 no-scrollbar">
              {cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full flex flex-col items-center justify-center text-center px-6"
                >
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                    <FiPackage
                      size={32}
                      className="text-slate-200 dark:text-slate-700"
                    />
                  </div>
                  <p className="text-slate-500 font-bold tracking-tight">
                    Your catch is empty.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, x: 60, filter: "blur(4px)" }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        filter: "blur(0px)",
                        transition: {
                          delay: index * 0.05,
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      }}
                      exit={{
                        opacity: 0,
                        x: -60,
                        scale: 0.9,
                        filter: "blur(4px)",
                        transition: { duration: 0.3 },
                      }}
                      className="group flex gap-3 md:gap-4 p-3 md:p-4 rounded-[1.25rem] md:rounded-[1.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all shadow-sm"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center p-2 shrink-0 overflow-hidden">
                        <motion.img
                          src={getFullImageUrl(item.image)}
                          className="w-full h-full object-contain"
                          alt={item.name}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate pr-2">
                            {item.name}
                          </h4>
                          <motion.button
                            onClick={() => handleRemove(item._id)}
                            whileHover={{ scale: 1.2, color: "#ef4444" }}
                            whileTap={{ scale: 0.8 }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          >
                            <FiTrash2 size={14} />
                          </motion.button>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 rounded-full p-1 border border-slate-200/50 dark:border-slate-700">
                            <motion.button
                              onClick={() => handleUpdate(item, item.qty - 1)}
                              whileTap={{ scale: 0.8 }}
                              className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm"
                            >
                              <FiMinus size={10} />
                            </motion.button>
                            <motion.span
                              key={item.qty}
                              initial={{ scale: 1.3, color: "#3b82f6" }}
                              animate={{ scale: 1, color: "inherit" }}
                              className="text-[10px] md:text-xs font-black w-6 md:w-8 text-center text-slate-900 dark:text-white"
                            >
                              {item.qty}
                            </motion.span>
                            <motion.button
                              onClick={() => handleUpdate(item, item.qty + 1)}
                              whileTap={{ scale: 0.8 }}
                              className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm"
                            >
                              <FiPlus size={10} />
                            </motion.button>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white text-xs md:text-sm">
                            {"\u20B9"}{(item.price * item.qty).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* FOOTER */}
            {cartItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-white/5"
              >
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Total Amount
                    </span>
                    <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                      <PriceCounter value={subtotal} />
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleCheckout}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-slate-900 dark:bg-blue-600 text-white h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl transition-all flex items-center justify-center gap-3 group"
                >
                  Checkout Now{" "}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                  >
                    <FiArrowRight />
                  </motion.span>
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}