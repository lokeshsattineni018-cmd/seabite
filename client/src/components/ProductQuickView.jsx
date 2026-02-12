import { motion, AnimatePresence } from "framer-motion";
import { addToCart } from "../utils/cartStorage";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { FiX, FiMinus, FiPlus, FiShoppingBag, FiCheck } from "react-icons/fi";

export default function ProductQuickView({ product, onClose }) {
  const { refreshCartCount } = useContext(CartContext);
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (product) document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);
    addToCart({ ...product, qty });
    refreshCartCount();
    flyToCart();
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 600);
  };

  const flyToCart = () => {
    const img = document.querySelector(".quick-img");
    const cartIcon = document.querySelector(".cart-icon");
    if (!img || !cartIcon) return;

    const clone = img.cloneNode(true);
    clone.className =
      "fixed z-[9999] pointer-events-none transition-all duration-700 ease-in-out rounded-[30px] shadow-2xl border border-white/50";
    clone.style.width = "150px";
    clone.style.height = "150px";
    clone.style.objectFit = "cover";
    document.body.appendChild(clone);

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    clone.style.left = imgRect.left + (imgRect.width / 2 - 75) + "px";
    clone.style.top = imgRect.top + (imgRect.height / 2 - 75) + "px";

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${cartRect.left - imgRect.left}px, ${
        cartRect.top - imgRect.top
      }px) scale(0.1)`;
      clone.style.opacity = "0.5";
    });

    setTimeout(() => clone.remove(), 700);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ scale: 0.9, opacity: 0, y: 30, filter: "blur(6px)" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-100 dark:border-white/5"
        >
          {/* Close Button */}
          <motion.button
            onClick={onClose}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute top-5 right-5 z-20 bg-white/80 dark:bg-slate-700/80 backdrop-blur-md p-3 rounded-full text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors shadow-sm border border-white/50 dark:border-white/10"
          >
            <FiX size={20} />
          </motion.button>

          {/* Image */}
          <div className="relative h-72 bg-slate-50 dark:bg-slate-900/50">
            <motion.img
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover quick-img"
            />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-slate-800 to-transparent" />
          </div>

          {/* Content */}
          <div className="px-8 pb-8 pt-2 relative z-10">
            <div className="text-center mb-6">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-3xl font-serif text-slate-900 dark:text-white mb-2"
              >
                {product.name}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-center gap-2"
              >
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase rounded-full">
                  Fresh Catch
                </span>
                <p className="text-2xl font-semibold text-slate-800 dark:text-white">
                  {"\u20B9"}{product.price}
                </p>
              </motion.div>
            </div>

            {product.desc && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 leading-relaxed font-light"
              >
                {product.desc}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {/* Quantity */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-full p-2 border border-slate-100 dark:border-slate-700">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full text-slate-600 dark:text-white shadow-sm hover:text-blue-500 transition-colors"
                >
                  <FiMinus size={16} />
                </motion.button>

                <motion.span
                  key={qty}
                  initial={{ scale: 1.3, color: "#3b82f6" }}
                  animate={{ scale: 1, color: "inherit" }}
                  className="font-serif text-lg font-medium text-slate-900 dark:text-white w-12 text-center"
                >
                  {qty}
                </motion.span>

                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full text-slate-600 dark:text-white shadow-sm hover:text-blue-500 transition-colors"
                >
                  <FiPlus size={16} />
                </motion.button>
              </div>

              {/* Add to Cart */}
              <motion.button
                whileHover={!isAdding ? { scale: 1.02 } : {}}
                whileTap={!isAdding ? { scale: 0.97 } : {}}
                onClick={handleAdd}
                disabled={isAdding}
                className={`w-full py-4 rounded-full font-bold tracking-wide flex items-center justify-center gap-3 shadow-lg transition-all duration-300
                  ${
                    isAdding
                      ? "bg-emerald-500 text-white scale-95"
                      : "bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 active:scale-95"
                  }`}
              >
                {isAdding ? (
                  <span className="flex items-center gap-2">
                    <FiCheck size={18} /> Added!
                  </span>
                ) : (
                  <>
                    <FiShoppingBag size={18} />
                    <span>Add to Cart</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}