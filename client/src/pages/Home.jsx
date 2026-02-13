import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, useAnimationFrame, useVelocity, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ArrowRight, Star, ShieldCheck, Truck, Clock, Quote, Fish, Sparkles, X, Copy, Check, Gift, Zap, User, Anchor, Thermometer, Utensils, ChevronDown, ShoppingBag, Flame, ChevronRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- ADVANCED ANIMATION WRAPPER ---
const SectionReveal = ({ children, direction = "up", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" }); // Tightened margin for faster trigger

  const directions = {
    up: { y: 40, x: 0, rotateX: 8 },
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

// --- TEXT REVEAL (character-by-character) ---
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

// --- DISCOUNT POPUP COMPONENT ---
const DiscountPopup = ({ isOpen, onClose, offer }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-[#0f172a] rounded-[2.5rem] overflow-hidden max-w-lg w-full shadow-2xl border border-white/10"
          >
            <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-black/20 text-white rounded-full"><X size={20}/></button>
            <div className="relative h-48 bg-blue-600">
              <img src="/20offer.png" className="w-full h-full object-cover opacity-60" alt="Offer"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent" />
              <div className="absolute bottom-6 left-8">
                <h2 className="text-5xl font-black text-white italic tracking-tighter">SAVE {offer.value}%</h2>
                <p className="text-blue-200 font-bold uppercase tracking-widest text-xs">Special Welcome Catch</p>
              </div>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Use code at checkout for your discount!</p>
              <motion.div 
                onClick={handleCopy}
                whileTap={{ scale: 0.98 }}
                className="group border-2 border-dashed border-blue-200 dark:border-blue-900/50 p-5 rounded-2xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
              >
                <div className="text-3xl font-mono font-black text-blue-600 dark:text-blue-400 flex items-center justify-center gap-3">
                  {offer.code}
                  {copied ? <Check size={24} className="text-emerald-500" /> : <Copy size={20} className="opacity-20 group-hover:opacity-100" />}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
    <section className="py-12 px-4 md:px-12 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto mb-10 text-center relative z-10">
        <TextReveal
          text="Shop By Category"
          className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white"
        />
      </div>
      <div className="flex flex-col md:flex-row h-[400px] gap-4 max-w-6xl mx-auto relative z-10">
        {categories.map((cat, i) => (
          <Link
            to={`/products?category=${cat.title.split(" ")[1]}`}
            key={i}
            onMouseEnter={() => setHovered(i)}
            className={`relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 ease-[0.25, 1, 0.5, 1] border border-gray-200 dark:border-white/10 ${
              hovered === i ? "flex-[3] shadow-2xl" : "flex-[1] opacity-80"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} z-0`} />
            <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
              <motion.img
                layout
                src={cat.img}
                alt={cat.title}
                animate={{ scale: hovered === i ? 1.05 : 0.8, rotate: hovered === i ? 0 : -5 }}
                transition={{ duration: 0.7 }}
                className={`object-contain drop-shadow-2xl ${hovered === i ? "w-[80%] h-[80%]" : "w-24 h-24"}`}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-[#0a1625]/80 to-transparent">
              <h3 className={`font-serif text-slate-900 dark:text-white transition-all duration-500 ${hovered === i ? "text-3xl" : "text-xl opacity-70"}`}>
                {cat.title}
              </h3>
              <motion.div
                animate={{ maxHeight: hovered === i ? 40 : 0, opacity: hovered === i ? 1 : 0 }}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-300 text-sm font-bold uppercase tracking-widest mt-2 overflow-hidden"
              >
                Explore <ArrowRight size={14} />
              </motion.div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

// --- FLASH SALE ---
const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date().setHours(24, 0, 0, 0);
      const diff = midnight - now;
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-6 px-4">
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="relative z-10 text-white text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/30">
            <Flame size={14} className="text-yellow-300" /> Flash Deal
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">TODAY'S CATCH</h2>
          <p className="text-red-50 text-xl md:text-2xl font-serif italic tracking-wide leading-relaxed">
            Order above ₹1699 & use code <span className="mx-2 bg-white text-red-600 px-3 py-1 rounded-lg font-black font-mono not-italic text-lg shadow-lg transform -rotate-2 inline-block">SEABITE10</span>
          </p>
        </div>
        <div className="relative z-10 bg-white p-6 rounded-xl shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ends In</p>
          <div className="flex gap-2 text-slate-900 font-mono font-black text-3xl">
            {Object.values(timeLeft).map((v, i) => (
              <span key={i} className="bg-slate-100 px-2 rounded">{v.toString().padStart(2, '0')}</span>
            ))}
          </div>
          <Link to="/products">
            <button className="block mt-4 w-full bg-slate-900 text-white text-center py-3 rounded-lg font-bold text-sm uppercase">Grab Deal</button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

// --- PRODUCT ROW ---
const CategoryRow = ({ title, filterType }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      setProducts(filterType === "Fish" ? all.filter(p => p.category === "Fish").slice(0, 4) : all.filter(p => p.category === "Prawn" || p.category === "Crab").slice(0, 4));
    });
  }, [filterType]);

  if (products.length === 0) return null;

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {filterType === "Fish" ? <Fish className="text-blue-500" /> : <Anchor className="text-orange-500" />} {title}
          </h2>
          <Link to="/products" className="text-sm font-bold text-blue-600 flex items-center gap-1">See All <ChevronRight size={14}/></Link>
        </div>
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <StaggerItem key={p._id}>
              <Link to={`/products/${p._id}`}>
                <motion.div whileHover={{ y: -8 }} className="group bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden h-full flex flex-col shadow-sm">
                  <div className="relative h-40 md:h-48 bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-4">
                    <img src={`${API_URL}${p.image.startsWith('/') ? p.image : `/${p.image}`}`} alt={p.name} className="w-full h-full object-contain" />
                    {p.trending && <span className="absolute top-2 left-2 bg-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded">BESTSELLER</span>}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 mb-3">{p.netWeight}</p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">₹{p.basePrice}</span>
                      <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingBag size={14} /></button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

// --- TRENDING MARQUEE ---
const TrendingMarquee = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const trending = (res.data.products || []).filter(p => p.trending);
      setProducts([...trending, ...trending]);
    });
  }, []);

  return (
    <section className="py-12 overflow-hidden border-t border-gray-100 dark:border-white/5 relative">
      <div className="container mx-auto px-6 mb-8">
        <TextReveal text="Best Sellers" className="text-4xl font-serif text-slate-900 dark:text-white" />
      </div>
      <motion.div className="flex gap-8 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}>
        {products.map((p, i) => (
          <Link to={`/products/${p._id}`} key={`${p._id}-${i}`} className="w-[300px]">
            <div className="bg-white dark:bg-[#0e1d30] border border-gray-100 rounded-[2rem] p-6 shadow-sm">
              <div className="h-[200px] mb-4 flex items-center justify-center">
                <img src={`${API_URL}${p.image.startsWith('/') ? p.image : `/${p.image}`}`} alt={p.name} className="w-44 h-44 object-contain" />
              </div>
              <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-1 truncate">{p.name}</h3>
              <span className="text-lg font-mono text-blue-600">₹{p.basePrice}</span>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
};

// --- REVIEWS ---
const SeaBitePromise = () => {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`).then(res => setReviews(res.data));
  }, []);

  return (
    <section className="py-12 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <TextReveal text="Loved by Seafood Lovers" className="text-3xl md:text-4xl font-serif" />
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((r, i) => (
            <StaggerItem key={i}>
              <div className="bg-white/80 dark:bg-[#0e1d30]/90 p-8 rounded-[2rem] border border-gray-100 shadow-sm h-full backdrop-blur-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (<Star key={s} size={14} className={s < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic mb-6 leading-relaxed">"{r.comment}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white"><User size={16} /></div>
                  <div><h4 className="font-bold text-sm">{r.userName}</h4><span className="text-[10px] text-blue-500 uppercase font-bold">{r.productName}</span></div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

// --- WHY SEABITE ---
const WhySeaBite = () => {
  const features = [
    { icon: <ShieldCheck size={24}/>, title: "Quality Guaranteed", desc: "Lab-tested for safety.", bg: "bg-emerald-50 text-emerald-600" },
    { icon: <Thermometer size={24}/>, title: "Cold Chain", desc: "Temp-controlled delivery.", bg: "bg-blue-50 text-blue-600" },
    { icon: <Truck size={24}/>, title: "Fast Dispatch", desc: "Same day shipping.", bg: "bg-amber-50 text-amber-600" },
    { icon: <Utensils size={24}/>, title: "Chef Approved", desc: "Trusted by top cooks.", bg: "bg-rose-50 text-rose-600" },
  ];
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12"><TextReveal text="Why SeaBite?" className="text-4xl font-serif" /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[{v:10000, s:"+", l:"Customers"}, {v:50, s:"+", l:"Varieties"}, {v:98, s:"%", l:"Freshness"}, {v:4, s:".8", l:"Rating"}].map((st, i) => (
            <div key={i} className="bg-white dark:bg-[#0e1d30] p-6 rounded-2xl text-center shadow-sm border border-slate-50 dark:border-white/5">
              <p className="text-3xl font-black mb-1"><AnimatedCounter value={st.v} suffix={st.s}/></p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{st.l}</p>
            </div>
          ))}
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <StaggerItem key={i}>
              <div className="bg-white dark:bg-[#0e1d30] p-8 rounded-2xl border border-slate-50 dark:border-white/5 h-full shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.bg}`}>{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

// --- FOOTER ---
const Footer = () => (
  <footer className="relative bg-gray-50 dark:bg-[#081220] border-t border-gray-100 dark:border-white/5 overflow-hidden z-10 transition-colors">
    <div className="absolute inset-0 flex items-center pointer-events-none opacity-5 overflow-hidden">
      <motion.div initial={{ x: 0 }} animate={{ x: "-50%" }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="flex gap-20">
        <h2 className="text-[15vw] font-black text-slate-900 select-none uppercase tracking-tighter">SEABITE SEABITE SEABITE</h2>
      </motion.div>
    </div>
    <div className="relative z-10 flex flex-col items-center justify-center py-24 text-center">
      <p className="text-slate-500 font-light text-lg mb-8">Experience the true taste of the ocean.</p>
      <Link to="/products"><motion.button whileHover={{ scale: 1.05 }} className="px-12 py-5 bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg shadow-xl">Start Your Order</motion.button></Link>
    </div>
    <div className="relative z-10 border-t border-slate-200/50 px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3"><span className="text-xl font-serif font-bold">SeaBite</span><span className="text-xs text-slate-400">Fresh Coastal Catch</span></div>
        <div className="flex gap-6 text-xs font-medium text-slate-500">
          <Link to="/products">Products</Link><Link to="/orders">My Orders</Link><Link to="/notifications">Notifications</Link>
        </div>
        <p className="text-[10px] text-slate-400">&copy; {new Date().getFullYear()} SeaBite. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default function Home() {
  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState({ code: "SEABITE20", value: 20 });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("offerSeen")) {
        setShowOffer(true);
        sessionStorage.setItem("offerSeen", "true");
      }
    }, 2500);
    axios.get(`${API_URL}/api/coupons/public`).then(res => res.data?.length > 0 && setOffer(res.data[0])).catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-blue-500 selection:text-white transition-colors duration-300">
      <DiscountPopup isOpen={showOffer} onClose={() => setShowOffer(false)} offer={offer} />
      <VideoHero />
      <RollingText />
      <div className="relative w-full overflow-hidden">
        {/* Intricate background fish system restored */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full z-0">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "-200px", opacity: 0 }}
              animate={{ x: "100vw", opacity: [0, 0.2, 0.2, 0], rotate: [0, 5, -5, 0] }}
              transition={{ x: { duration: Math.random() * 20 + 15, repeat: Infinity, delay: i * 2, ease: "linear" }, rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
              style={{ position: "absolute", top: `${Math.random() * 100}%`, scale: Math.random() * 1.5 + 1.0 }}
              className="text-blue-500/30 dark:text-blue-400/20"
            >
              <Fish size={64} strokeWidth={1} fill="currentColor" />
            </motion.div>
          ))}
        </div>
        <div className="relative z-10 space-y-2">
          <SectionReveal direction="up"><CategoryPanel /></SectionReveal>
          <SectionReveal direction="scale"><FlashSale /></SectionReveal>
          <div className="py-2">
            <SectionReveal direction="left"><CategoryRow title="Fresh From The Nets" filterType="Fish" /></SectionReveal>
            <SectionReveal direction="right"><CategoryRow title="Shellfish Specials" filterType="Shellfish" /></SectionReveal>
          </div>
          <SectionReveal direction="up"><TrendingMarquee /></SectionReveal>
          <SectionReveal direction="up"><SeaBitePromise /></SectionReveal>
          <SectionReveal direction="scale"><WhySeaBite /></SectionReveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}