import { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, useAnimationFrame, useVelocity, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ArrowRight, Star, ShieldCheck, Truck, Fish, User, Anchor, Thermometer, Utensils, ChevronDown, ShoppingBag, Flame, ChevronRight, Plus, Minus, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { CartContext } from "../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- ADVANCED ANIMATION WRAPPER ---
const SectionReveal = ({ children, direction = "up", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-12% 0px" });

  const directions = {
    up: { y: 60, x: 0, rotateX: 8 },
    left: { y: 0, x: -80, rotateX: 0 },
    right: { y: 0, x: 80, rotateX: 0 },
    scale: { y: 0, x: 0, scale: 0.9 },
  };

  const from = directions[direction] || directions.up;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: "blur(8px)", ...from }}
      animate={
        isInView
          ? { opacity: 1, y: 0, x: 0, rotateX: 0, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, filter: "blur(8px)", ...from }
      }
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 800 }}
    >
      {children}
    </motion.div>
  );
};

// --- STAGGER WRAPPER ---
const StaggerContainer = ({ children, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- ANIMATED COUNTER ---
const AnimatedCounter = ({ value, prefix = "", suffix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) springValue.set(value);
  }, [isInView, value, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
};

// --- TEXT REVEAL ---
const TextReveal = ({ text, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block mr-[0.3em]">
          {word.split("").map((char, ci) => (
            <motion.span
              key={`${wi}-${ci}`}
              className="inline-block"
              initial={{ opacity: 0, y: 30, rotateX: -60 }}
              animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: delay + wi * 0.08 + ci * 0.025,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ perspective: 400 }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
};

// --- SCROLL TO TOP BUTTON ---
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          <ChevronDown size={24} className="rotate-180" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// --- MINIMAL AESTHETIC PRODUCT CARD ---
const EnhancedProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return "";
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({ ...product, quantity });
    toast.success(`${quantity}x ${product.name} added to cart!`, {
      icon: '🛒',
    });
    setShowQuantity(false);
    setQuantity(1);
  };

  const getStockStatus = () => {
    if (!product.stock || product.stock === 0) return { label: 'OUT', color: 'text-red-500' };
    if (product.stock < 10) return { label: 'LOW', color: 'text-orange-500' };
    return { label: 'IN', color: 'text-green-500' };
  };

  const stockStatus = getStockStatus();
  const isNew = product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <Link to={`/products/${product._id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="group relative bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col"
      >
        {/* Image Section */}
        <div className="relative aspect-square bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
          <motion.img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover p-6"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.trending && (
              <span className="bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold px-2 py-1 uppercase tracking-wider">
                Hot
              </span>
            )}
            {isNew && (
              <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[9px] font-bold px-2 py-1 uppercase tracking-wider">
                New
              </span>
            )}
          </div>

          {/* Stock Badge */}
          <div className="absolute top-3 right-3">
            <span className={`text-[9px] font-mono font-bold ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
          </div>

          {/* Quick Add Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-[2px] flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {showQuantity ? (
                <motion.div
                  key="quantity"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg"
                  onClick={(e) => e.preventDefault()}
                >
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Minus size={14} />
                  </motion.button>
                  <span className="font-mono text-sm font-bold w-6 text-center">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuantity(Math.min(product.stock || 99, quantity + 1));
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Plus size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCart}
                    className="ml-2 px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider"
                  >
                    Add
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!product.stock || product.stock === 0) {
                      toast.error('Out of stock!');
                      return;
                    }
                    setShowQuantity(true);
                  }}
                  disabled={!product.stock || product.stock === 0}
                  className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ShoppingBag size={16} />
                  {!product.stock || product.stock === 0 ? 'Sold Out' : 'Quick Add'}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-mono">
              {product.category}
            </p>
            <h3 className="font-medium text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">
              {product.name}
            </h3>
          </div>
          
          <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  ₹{product.basePrice}
                </span>
                <span className="text-xs text-slate-400 line-through font-mono">
                  ₹{(product.basePrice * 1.2).toFixed(0)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {product.netWeight}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

// --- HERO SECTION ---
const VideoHero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 1.15]);
  const textY = useTransform(scrollY, [0, 400], [0, -80]);

  return (
    <div className="relative h-screen w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-slate-900 z-20">
      <motion.div style={{ y, opacity, scale }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />
        <video autoPlay loop muted playsInline src="1.mp4" className="w-full h-full object-cover" />
      </motion.div>

      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div style={{ y: textY }} className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.5em" }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-blue-200 font-mono text-xs md:text-sm uppercase drop-shadow-md"
          >
            The Ocean&apos;s Finest
          </motion.p>

          <motion.h1
            className="text-[15vw] md:text-[12vw] leading-none font-serif text-white opacity-95 select-none drop-shadow-2xl overflow-hidden"
          >
            {"SEABITE".split("").map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ y: "120%", opacity: 0, rotateX: -40 }}
                animate={{ y: "0%", opacity: 1, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5 + i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ perspective: 500 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto w-[120px] origin-center"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(59,130,246,0.3)" }}
                whileTap={{ scale: 0.93 }}
                className="group mt-8 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-500 shadow-xl relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Shop Now
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight size={14} />
                  </motion.span>
                </span>
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.span className="text-white/40 text-[10px] uppercase tracking-[0.3em]">Scroll</motion.span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="text-white/40" size={20} />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- ROLLING MARQUEE ---
const RollingText = () => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${v}%`);
  const directionFactor = useRef(1);
  const skewX = useTransform(smoothVelocity, [-1000, 0, 1000], [-3, 0, 3]);

  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * 2 * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="bg-[#0a1625] border-y border-white/5 py-4 relative z-30 overflow-hidden text-white">
      <motion.div className="flex whitespace-nowrap" style={{ x, skewX }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] mx-8 text-blue-200">Fresh Catch Daily</span>
            <Star className="w-3 h-3 text-blue-500" fill="currentColor" />
            <span className="text-sm font-bold uppercase tracking-[0.2em] mx-8 text-white">Sustainable</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-6" />
            <span className="text-sm font-bold uppercase tracking-[0.2em] mx-8 text-blue-200">Ocean to Table</span>
            <Star className="w-3 h-3 text-blue-500" fill="currentColor" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- CATEGORIES ---
const categories = [
  { title: "Premium Fish", img: "/fish.png", bg: "from-blue-100/80 to-white dark:from-blue-900/40 dark:to-[#0a1625]" },
  { title: "Jumbo Prawns", img: "/prawn.png", bg: "from-indigo-100/80 to-white dark:from-indigo-900/40 dark:to-[#0a1625]" },
  { title: "Live Crabs", img: "/crab.png", bg: "from-cyan-100/80 to-white dark:from-cyan-900/40 dark:to-[#0a1625]" },
];

const CategoryPanel = () => {
  const [hovered, setHovered] = useState(0);
  return (
    <section className="py-16 px-4 md:px-12 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto mb-12 text-center relative z-10">
        <TextReveal
          text="Shop By Category"
          className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white transition-colors duration-300"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-slate-600 dark:text-slate-400 mt-2 font-light tracking-wide transition-colors duration-300"
        >
          Select your catch
        </motion.p>
      </div>
      <div className="flex flex-col md:flex-row h-[400px] gap-4 max-w-6xl mx-auto relative z-10">
        {categories.map((cat, i) => (
          <Link
            to={`/products?category=${cat.title.split(" ")[1]}`}
            key={i}
            onMouseEnter={() => setHovered(i)}
            className={`relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 ease-[0.25, 1, 0.5, 1] border border-gray-200 dark:border-white/10 ${
              hovered === i
                ? "flex-[3] shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/20"
                : "flex-[1] opacity-80 dark:opacity-60 hover:opacity-100"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} z-0`} />
            <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
              <motion.img
                layout
                src={cat.img}
                alt={cat.title}
                animate={{
                  scale: hovered === i ? 1.05 : 0.8,
                  rotate: hovered === i ? 0 : -5,
                  filter: hovered === i ? "grayscale(0)" : "grayscale(1)",
                }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`object-contain drop-shadow-2xl ${
                  hovered === i
                    ? "w-[80%] h-[80%] opacity-100"
                    : "w-24 h-24 opacity-50"
                } transition-all duration-700`}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-[#0a1625]/80 to-transparent">
              <h3
                className={`font-serif text-slate-900 dark:text-white transition-all duration-500 whitespace-nowrap ${
                  hovered === i ? "text-3xl opacity-100" : "text-xl opacity-70"
                }`}
              >
                {cat.title}
              </h3>
              <motion.div
                animate={{
                  maxHeight: hovered === i ? 40 : 0,
                  opacity: hovered === i ? 1 : 0,
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-slate-900 dark:text-slate-300 text-sm font-bold uppercase tracking-widest mt-2 overflow-hidden"
              >
                Explore
                <motion.span animate={{ x: hovered === i ? [0, 6, 0] : 0 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <ArrowRight />
                </motion.span>
              </motion.div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

// --- FLASH SALE BANNER ---
const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 18 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  const formatTime = (value) => value.toString().padStart(2, "0");

  return (
    <section className="py-8 px-4">
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        <motion.div
          className="absolute inset-0 z-30 pointer-events-none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 3 }}
            className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          />
        </motion.div>

        <div className="relative z-10 text-white text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/30"
          >
            <Flame size={14} className="text-yellow-300" /> Flash Deal
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">
            {"TODAY'S CATCH".split("").map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            ))}
          </h2>
          <p className="text-red-50 text-xl md:text-2xl font-serif italic tracking-wide leading-relaxed">
            Order above{" "}
            <span className="text-yellow-300 font-bold decoration-wavy underline decoration-white/30">
              ₹1699
            </span>{" "}
            and use coupon{" "}
            <span className="mx-2 bg-white text-red-600 px-3 py-1 rounded-lg font-black font-mono not-italic text-lg border-2 border-dashed border-red-600 transform -rotate-2 inline-block shadow-lg">
              SEABITE10
            </span>{" "}
            to avail{" "}
            <span className="font-black text-white not-italic text-2xl drop-shadow-md">
              10% OFF
            </span>
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, rotate: 6, scale: 0.9 }}
          whileInView={{ opacity: 1, rotate: 2, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10 bg-white p-6 rounded-xl shadow-lg"
        >
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ends In</p>
            <div className="flex gap-2 text-slate-900 font-mono font-black text-3xl">
              {[
                { val: timeLeft.hours, color: "" },
                { val: timeLeft.minutes, color: "" },
                { val: timeLeft.seconds, color: "text-red-600" },
              ].map((t, i) => (
                <span key={i} className="contents">
                  {i > 0 && <span>:</span>}
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={t.val}
                      initial={{ y: -20, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 20, opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`bg-slate-100 px-2 rounded inline-block ${t.color}`}
                    >
                      {formatTime(t.val)}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ))}
            </div>
          </div>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="block mt-4 w-full bg-slate-900 text-white text-center py-3 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-slate-800 transition-colors"
            >
              Grab The Deal
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};

// --- PRODUCT SHOWCASE ROW WITH ICON BRACKETS ---
const CategoryRow = ({ title, filterType }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      let filtered = [];
      if (filterType === "Fish") {
        filtered = all.filter((p) => p.category === "Fish").slice(0, 4);
      } else if (filterType === "Shellfish") {
        filtered = all.filter((p) => p.category === "Prawn" || p.category === "Crab").slice(0, 4);
      }
      setProducts(filtered);
    });
  }, [filterType]);

  if (products.length === 0) return null;

  const Icon = filterType === "Fish" ? Fish : Anchor;

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-slate-900 dark:border-white">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <ChevronLeft size={32} className="text-slate-900 dark:text-white" strokeWidth={3} />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center"
            >
              <Icon size={24} className="text-white dark:text-slate-900" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white font-bold">
              {title}
            </h2>

            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center"
            >
              <Icon size={24} className="text-white dark:text-slate-900" />
            </motion.div>

            <motion.div
              animate={{ rotate: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <ChevronRight size={32} className="text-slate-900 dark:text-white" strokeWidth={3} />
            </motion.div>
          </div>

          <Link to="/products" className="text-sm font-mono font-bold text-slate-900 dark:text-white hover:underline uppercase tracking-widest">
            View All
          </Link>
        </div>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <StaggerItem key={p._id}>
              <EnhancedProductCard product={p} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

// --- ENHANCED TRENDING MARQUEE - FIXED ADD TO CART & FASTER SCROLL ---
const TrendingMarquee = () => {
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const baseX = useMotionValue(0);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      const trending = all.filter((p) => p.trending).slice(0, 8);
      setProducts([...trending, ...trending, ...trending]);
    });
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "";
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.stock || product.stock === 0) {
      toast.error('Out of stock!');
      return;
    }
    
    addToCart({ ...product, quantity: 1 });
    toast.success(`${product.name} added to cart!`, {
      icon: '🛒',
    });
  };

  // Continuous scrolling
  useAnimationFrame((t, delta) => {
    const moveBy = -0.5 * (delta / 1000) * 100; // Faster speed
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (v) => `${v % 33.33}%`);

  return (
    <section className="py-16 overflow-hidden border-y border-slate-200 dark:border-slate-800 transition-colors duration-300 relative bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-6 mb-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-block mb-3"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-mono font-bold border-2 border-slate-900 dark:border-white px-4 py-1">
            Customer Favorites
          </span>
        </motion.div>
        <TextReveal
          text="Best Sellers"
          className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white transition-colors duration-300 mb-4"
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
        >
          Handpicked from our ocean-fresh collection
        </motion.p>
      </div>

      <div className="relative w-full z-10">
        <motion.div
          className="flex gap-6 w-max"
          style={{ x }}
        >
          {products.map((p, i) => (
            <div key={`${p._id}-${i}`} className="w-[260px] flex-shrink-0">
              <Link to={`/products/${p._id}`}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-white dark:bg-slate-800 overflow-hidden h-full flex flex-col group"
                >
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
                    <motion.img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="w-full h-full object-cover p-6"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    />

                    <div className="absolute top-2 left-2">
                      <span className="bg-black text-white text-[8px] font-bold px-2 py-1 uppercase tracking-wider font-mono">
                        Hot
                      </span>
                    </div>

                    {/* Quick Add Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleQuickAdd(e, p)}
                      className="absolute bottom-3 left-3 right-3 bg-slate-900 text-white py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <ShoppingBag size={14} />
                      Quick Add
                    </motion.button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1 font-mono">
                        {p.category}
                      </p>
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm leading-tight line-clamp-2">
                        {p.name}
                      </h3>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                          ₹{p.basePrice}
                        </span>
                        <span className="text-xs text-slate-400 line-through font-mono">
                          ₹{(p.basePrice * 1.2).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">4.8</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// --- REVIEWS ---
const SeaBitePromise = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/products/top-reviews`)
      .then((res) => {
        setReviews(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 px-6 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <TextReveal
            text="Loved by Seafood Lovers"
            className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white mb-4"
          />
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-center col-span-3 text-slate-400">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map((r, i) => (
              <StaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -10, boxShadow: "0 25px 50px rgba(0,0,0,0.1)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white/80 dark:bg-[#0e1d30]/90 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 relative shadow-sm backdrop-blur-sm h-full"
                >
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, starI) => (
                      <motion.div
                        key={starI}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: starI * 0.08, type: "spring", stiffness: 300 }}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            starI < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-8 italic leading-relaxed">
                    &quot;{r.comment}&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.userName}
                      </h4>
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-mono">
                        {r.productName}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))
          ) : (
            <p className="text-center col-span-3 text-slate-400">No reviews yet.</p>
          )}
        </StaggerContainer>
      </div>
    </section>
  );
};

// --- WHY SEABITE ---
const WhySeaBite = () => {
  const features = [
    {
      icon: <ShieldCheck size={24} />,
      title: "Quality Guaranteed",
      desc: "Every batch is lab-tested and certified for freshness and safety.",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: <Thermometer size={24} />,
      title: "Cold Chain Delivery",
      desc: "Temperature-controlled packaging from ocean to your doorstep.",
      color: "text-slate-900 dark:text-slate-100",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      icon: <Truck size={24} />,
      title: "Same Day Dispatch",
      desc: "Orders before 2 PM ship the same day for express freshness.",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: <Utensils size={24} />,
      title: "Chef Approved",
      desc: "Trusted by 500+ restaurants and home cooks across the coast.",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-900/20",
    },
  ];

  return (
    <section className="py-16 px-6 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <TextReveal
            text="Why SeaBite?"
            className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-4"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 dark:text-slate-400 max-w-md mx-auto"
          >
            We set the bar higher so you can taste the difference.
          </motion.p>
        </div>

        <SectionReveal direction="scale">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: 10000, suffix: "+", label: "Happy Customers" },
              { value: 50, suffix: "+", label: "Varieties" },
              { value: 98, suffix: "%", label: "Freshness Score" },
              { value: 4, suffix: ".8", label: "Average Rating" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-[#0e1d30] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-all"
              >
                <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white dark:bg-[#0e1d30] border border-slate-100 dark:border-white/5 rounded-2xl p-6 md:p-8 h-full shadow-sm"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center mb-5`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

// --- FOOTER ---
const Footer = () => {
  return (
    <footer className="relative bg-gray-50 dark:bg-[#081220] text-slate-900 dark:text-white border-t border-gray-200 dark:border-white/5 overflow-hidden transition-colors duration-300 z-10">
      <div className="absolute inset-0 flex items-center whitespace-nowrap pointer-events-none overflow-hidden">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 20, ease: "linear", repeat: Infinity }}
          className="flex gap-20"
        >
          <h2 className="text-[18vw] leading-none font-black text-gray-200/60 dark:text-[#0f1b2d] select-none uppercase tracking-tighter">
            SEABITE SEABITE SEABITE
          </h2>
          <h2 className="text-[18vw] leading-none font-black text-gray-200/60 dark:text-[#0f1b2d] select-none uppercase tracking-tighter">
            SEABITE SEABITE SEABITE
          </h2>
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <p className="text-slate-600 dark:text-slate-400 font-light text-lg transition-colors duration-300 tracking-tight">
            Experience the true taste of the ocean.
          </p>
          <Link to="/products" className="inline-block">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.93 }}
              className="group px-12 py-5 bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg transition-all shadow-xl relative overflow-hidden"
            >
              <span className="relative z-10">Start Your Order</span>
              <motion.div
                className="absolute inset-0 bg-slate-700 dark:bg-slate-200"
                initial={{ y: "100%" }}
                whileHover={{ y: "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <div className="relative z-10 border-t border-slate-200/50 dark:border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-serif font-bold text-slate-900 dark:text-white">SeaBite</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">Fresh Coastal Catch</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link to="/products" className="hover:text-slate-900 dark:hover:text-white transition-colors">Products</Link>
            <Link to="/orders" className="hover:text-slate-900 dark:hover:text-white transition-colors">My Orders</Link>
            <Link to="/notifications" className="hover:text-slate-900 dark:hover:text-white transition-colors">Notifications</Link>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} SeaBite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// --- MAIN EXPORT ---
export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900 font-sans transition-colors duration-300">
      <VideoHero />
      <RollingText />
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full z-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "-200px", opacity: 0 }}
              animate={{
                x: "100vw",
                opacity: [0, 0.2, 0.2, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                x: {
                  duration: Math.random() * 20 + 15,
                  repeat: Infinity,
                  delay: Math.random() * 10,
                  ease: "linear",
                },
                rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              style={{
                position: "absolute",
                top: `${Math.random() * 100}%`,
                scale: Math.random() * 1.5 + 1.0,
              }}
              className="text-slate-500/20 dark:text-slate-400/10"
            >
              <Fish size={64} strokeWidth={1} fill="currentColor" />
            </motion.div>
          ))}
        </div>
        <div className="relative z-10">
          <SectionReveal direction="up">
            <CategoryPanel />
          </SectionReveal>
          <SectionReveal direction="scale" delay={0.1}>
            <FlashSale />
          </SectionReveal>
          <SectionReveal direction="left">
            <CategoryRow title="Fresh From The Nets" filterType="Fish" />
          </SectionReveal>
          <SectionReveal direction="right">
            <CategoryRow title="Shellfish Specials" filterType="Shellfish" />
          </SectionReveal>
          <SectionReveal direction="up">
            <TrendingMarquee />
          </SectionReveal>
          <SectionReveal direction="up">
            <SeaBitePromise />
          </SectionReveal>
          <SectionReveal direction="scale" delay={0.1}>
            <WhySeaBite />
          </SectionReveal>
        </div>
      </div>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}