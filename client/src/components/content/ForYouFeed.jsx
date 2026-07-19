import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ShoppingCart, Heart, Music, MessageCircle, Share2, Award, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";

const API = import.meta.env.VITE_API_URL || "";

export default function ForYouFeed({ isOpen, onClose }) {
  const [products, setProducts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState({});
  const { addToCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const fetchFeed = async () => {
      try {
        const { data } = await axios.get(`${API}/api/personalization/for-you`);
        setProducts(data);
      } catch (err) {
        toast.error("Failed to load feed");
      }
    };
    fetchFeed();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLike = (id) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
    if (!liked[id]) toast.success("Added to interests!");
  };

  const handleAddToCart = (product) => {
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.basePrice,
      image: product.image,
      qty: 1
    });
    toast.success(`${product.name} added to cart! 🛒`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex items-center justify-center font-sans">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex gap-4 text-sm font-bold text-slate-400">
          <span className="text-white border-b-2 border-white pb-1 cursor-pointer">For You</span>
          <span className="hover:text-white transition-colors cursor-pointer">Live Fresh Catch</span>
        </div>
        <button onClick={onClose} className="text-white text-xs font-bold bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition-colors">
          Close Feed
        </button>
      </div>

      {/* Main Swipeable Container */}
      <div className="relative w-full max-w-[420px] h-[100vh] bg-black overflow-hidden flex flex-col justify-center">
        {products.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">Loading feed...</div>
        ) : (
          <div className="relative w-full h-[90%] flex flex-col items-center">
            {/* Scrollable Products viewport simulation */}
            <AnimatePresence mode="wait">
              {products[activeIndex] && (
                <motion.div
                  key={products[activeIndex]._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full h-full flex flex-col justify-end p-6"
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, transparent 100%), url(${products[activeIndex].image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  {/* Left Bottom info card */}
                  <div className="space-y-3 max-w-[80%] text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-0.5">
                        <Zap size={8} /> Fresh
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold font-mono">₹{(products[activeIndex].price || products[activeIndex].basePrice)} / {products[activeIndex].unit}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white leading-tight">{products[activeIndex].name}</h2>
                    <p className="text-xs text-slate-400 leading-normal line-clamp-3">{products[activeIndex].desc}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-sky-400 font-bold font-mono">
                      <Music size={10} className="animate-spin" />
                      Original Sound - SeaBite Fresh Catch
                    </div>
                  </div>

                  {/* Right Bottom Interactions Side-bar */}
                  <div className="absolute bottom-6 right-6 flex flex-col items-center gap-5 z-20">
                    <button
                      onClick={() => handleLike(products[activeIndex]._id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        liked[products[activeIndex]._id] ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
                      }`}
                    >
                      <Heart size={20} fill={liked[products[activeIndex]._id] ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => handleAddToCart(products[activeIndex])}
                      className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black flex items-center justify-center transition-colors shadow-lg"
                    >
                      <ShoppingCart size={20} />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center transition-colors">
                      <Share2 size={20} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vertical swipe control dots on the far left side */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
              {products.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-1.5 rounded-full transition-all cursor-pointer ${
                    activeIndex === idx ? "h-6 bg-white" : "h-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
