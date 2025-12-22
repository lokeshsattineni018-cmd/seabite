// src/components/ProductQuickView.jsx
import { motion, AnimatePresence } from "framer-motion";
import { addToCart } from "../utils/cartStorage";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { FiX, FiMinus, FiPlus, FiShoppingBag } from "react-icons/fi"; // Using Feather Icons

export default function ProductQuickView({ product, onClose }) {
  const { refreshCartCount } = useContext(CartContext);
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  /* LOCK SCROLL ON MOUNT */
  useEffect(() => {
    if (product) document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    if (isAdding) return;
    setIsAdding(true);

    // 1. Add to Local Storage
    addToCart({ ...product, qty });
    
    // 2. Refresh Context
    refreshCartCount();

    // 3. Trigger Animation
    flyToCart();

    // 4. Close after short delay (so user sees button feedback)
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 600);
  };

  /* ✈️ FLY TO CART ANIMATION (Optimized) */
  const flyToCart = () => {
    const img = document.querySelector(".quick-img");
    const cartIcon = document.querySelector(".cart-icon"); // Ensure your Navbar cart has this class
    if (!img || !cartIcon) return;

    const clone = img.cloneNode(true);
    // Add same rounded aesthetic to clone
    clone.className = "fixed z-[9999] pointer-events-none transition-all duration-700 ease-in-out rounded-[30px] shadow-2xl border border-white/50";
    clone.style.width = "150px"; // Start slightly smaller than full modal image
    clone.style.height = "150px";
    clone.style.objectFit = "cover";
    
    document.body.appendChild(clone);

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    // Start position (center of modal image)
    clone.style.left = imgRect.left + (imgRect.width / 2 - 75) + "px";
    clone.style.top = imgRect.top + (imgRect.height / 2 - 75) + "px";

    requestAnimationFrame(() => {
      // End position (Cart Icon)
      clone.style.transform = `translate(${cartRect.left - imgRect.left}px, ${cartRect.top - imgRect.top}px) scale(0.1)`;
      clone.style.opacity = "0.5";
    });

    setTimeout(() => clone.remove(), 700);
  };

  return (
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* MODAL CARD */}
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden relative"
        >
          
          {/* CLOSE BUTTON (Floating Glass) */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 bg-white/80 backdrop-blur-md p-3 rounded-full text-slate-600 hover:text-rose-500 hover:rotate-90 transition-all duration-300 shadow-sm border border-white/50"
          >
            <FiX size={20} />
          </button>

          {/* IMAGE SECTION */}
          <div className="relative h-72 bg-slate-50">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover quick-img"
            />
            {/* Gradient Overlay for Text Readability if needed */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* CONTENT SECTION */}
          <div className="px-8 pb-8 pt-2 relative z-10">
            
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-serif text-slate-900 mb-2">{product.name}</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold tracking-widest uppercase rounded-full">
                  Fresh Catch
                </span>
                <p className="text-2xl font-semibold text-slate-800">
                  ₹{product.price}
                </p>
              </div>
            </div>

            {/* Description (Optional) */}
            {product.desc && (
              <p className="text-slate-500 text-sm text-center mb-8 leading-relaxed font-light">
                {product.desc}
              </p>
            )}

            {/* CONTROLS WRAPPER */}
            <div className="space-y-4">
              
              {/* QUANTITY SELECTOR (Pill Shape) */}
              <div className="flex items-center justify-between bg-slate-50 rounded-full p-2 border border-slate-100">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-600 shadow-sm hover:text-rose-500 transition-colors"
                >
                  <FiMinus size={16} />
                </button>

                <span className="font-serif text-lg font-medium text-slate-900 w-12 text-center">
                  {qty}
                </span>

                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-slate-600 shadow-sm hover:text-rose-500 transition-colors"
                >
                  <FiPlus size={16} />
                </button>
              </div>

              {/* ADD TO CART BUTTON */}
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className={`w-full py-4 rounded-full font-bold tracking-wide flex items-center justify-center gap-3 shadow-lg transition-all duration-300
                  ${isAdding 
                    ? "bg-green-500 text-white scale-95" 
                    : "bg-slate-900 text-white hover:bg-rose-500 hover:shadow-rose-500/30 active:scale-95"
                  }`}
              >
                {isAdding ? (
                  <>
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <FiShoppingBag size={18} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}