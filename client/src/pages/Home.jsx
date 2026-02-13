import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, useAnimationFrame, useVelocity, AnimatePresence } from "framer-motion";
import axios from "axios";
import { ArrowRight, Star, ShieldCheck, Truck, Clock, Quote, Fish, Sparkles, X, Copy, Check, Gift, Zap, User, Anchor, Thermometer, Utensils, ChevronDown, ShoppingBag, Flame, ChevronRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- ADVANCED ANIMATION WRAPPER with multiple reveal styles ---
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

      {/* Animated grid overlay */}
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

        {/* Scroll indicator */}
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

// --- ROLLING MARQUEE (scroll-velocity reactive) ---
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

// --- CATEGORIES with enhanced expand + parallax images ---
const categories = [
  { title: "Premium Fish", img: "/fish.png", bg: "from-blue-100/80 to-white dark:from-blue-900/40 dark:to-[#0a1625]" },
  { title: "Jumbo Prawns", img: "/prawn.png", bg: "from-indigo-100/80 to-white dark:from-indigo-900/40 dark:to-[#0a1625]" },
  { title: "Live Crabs", img: "/crab.png", bg: "from-cyan-100/80 to-white dark:from-cyan-900/40 dark:to-[#0a1625]" },
];

const CategoryPanel = () => {
  const [hovered, setHovered] = useState(0);
  return (
    <section className="py-20 px-4 md:px-12 relative overflow-hidden transition-colors duration-300">
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
          className="text-blue-600 dark:text-blue-200 mt-2 font-light tracking-wide transition-colors duration-300"
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
                ? "flex-[3] shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/20"
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
                className="flex items-center gap-2 text-blue-600 dark:text-blue-300 text-sm font-bold uppercase tracking-widest mt-2 overflow-hidden"
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
    <section className="py-10 px-4">
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        {/* Animated shine sweep */}
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

// --- PRODUCT SHOWCASE ROW with stagger ---
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

  const getImageUrl = (path) => {
    if (!path) return "";
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  if (products.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {filterType === "Fish" ? <Fish className="text-blue-500" /> : <Anchor className="text-orange-500" />}
            {title}
          </h2>
          <Link to="/products" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            See All <ChevronRight size={14} />
          </Link>
        </div>
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <StaggerItem key={p._id}>
              <Link to={`/products/${p._id}`}>
                <motion.div
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden h-full flex flex-col"
                >
                  <div className="relative h-40 md:h-48 bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-4 overflow-hidden">
                    <motion.img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="w-full h-full object-contain"
                      whileHover={{ scale: 1.12, rotate: 2 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {p.trending && (
                      <motion.span
                        initial={{ x: -60, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm"
                      >
                        BESTSELLER
                      </motion.span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base line-clamp-2 mb-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{p.netWeight}</p>
                    <div className="mt-auto flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400 line-through mr-2">
                          ₹{(p.basePrice * 1.2).toFixed(0)}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{p.basePrice}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        whileTap={{ scale: 0.8 }}
                        className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <ShoppingBag size={14} />
                      </motion.button>
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

// --- OFFER BANNER ---
const OfferBanner = () => {
  const [copied, setCopied] = useState(false);
  const [offer, setOffer] = useState({ code: "SEABITE20", value: 20, discountType: "percent" });

  useEffect(() => {
    axios
      .get(`${API_URL}/api/coupons/public`)  // ✅ Changed from /api/coupons to /api/coupons/public
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const activeCoupon = res.data.find((c) => c.isActive) || res.data[0];
          setOffer(activeCoupon);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-6 transition-colors duration-300 relative">
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto flex flex-col md:flex-row bg-[#0f172a] dark:bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10 group"
      >
        <div className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-30">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 3 }}
            className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12"
          />
        </div>
        <div className="w-full md:w-[60%] relative h-[300px] md:h-auto bg-gray-200 overflow-hidden">
          <motion.img
            src="/20offer.png"
            alt="20% Off"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="w-full md:w-[40%] bg-[#0f172a] dark:bg-blue-50 p-8 md:p-12 flex flex-col justify-center items-center text-center text-white dark:text-slate-900 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            className="bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 flex items-center gap-2"
          >
            <Sparkles size={12} /> Official Coupon
          </motion.div>
          <motion.h2
            className="text-6xl font-serif mb-2"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
          >
            {offer.discountType === "flat" ? `₹${offer.value}` : `${offer.value}%`}
          </motion.h2>
          <h3 className="text-xl font-medium tracking-widest uppercase mb-6 opacity-80">
            {offer.discountType === "flat" ? "Cash Discount" : "Flat Discount"}
          </h3>
          <motion.div
            onClick={handleCopy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="w-full border-2 border-dashed border-white/20 dark:border-slate-900/20 p-4 rounded-xl mb-6 relative group cursor-pointer hover:bg-white/10 dark:hover:bg-blue-100 transition-all"
            title="Click to copy code"
          >
            <p className="text-xs uppercase opacity-50 mb-1">Promo Code</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-emerald-400 dark:text-blue-600 flex items-center justify-center gap-2">
              {offer.code}
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                  >
                    <Check size={20} className="text-emerald-500" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="opacity-40 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </p>
          </motion.div>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-transform shadow-lg"
            >
              Shop Now
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

// --- TRENDING PRODUCTS ---
const TrendingMarquee = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      const trending = all.filter((p) => p.trending);
      setProducts([...trending, ...trending, ...trending]);
    });
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "";
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  return (
    <section className="py-24 overflow-hidden border-t border-gray-200 dark:border-white/5 transition-colors duration-300 relative">
      <div className="container mx-auto px-6 mb-12 flex justify-between items-end relative z-10">
        <TextReveal
          text="Best Sellers"
          className="text-4xl font-serif text-slate-900 dark:text-white transition-colors duration-300"
        />
      </div>
      <div className="relative w-full z-10">
        <motion.div
          className="flex gap-8 w-max"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {products.map((p, i) => (
            <Link to={`/products/${p._id}`} key={`${p._id}-${i}`} className="w-[300px] group">
              <motion.div
                whileHover={{ y: -12, rotate: -1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white dark:bg-[#0e1d30] border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 hover:bg-white/80 dark:hover:bg-[#112238] transition-colors backdrop-blur-sm shadow-sm hover:shadow-xl"
              >
                <div className="h-[220px] mb-6 flex items-center justify-center relative overflow-hidden">
                  <motion.img
                    src={getImageUrl(p.image)}
                    alt={p.name}
                    className="w-48 h-48 object-contain drop-shadow-2xl"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-1 truncate">
                    {p.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase">
                      {p.category}
                    </span>
                    <span className="text-lg font-mono text-blue-600 dark:text-blue-300">
                      ₹{p.basePrice}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// --- REVIEWS & PROMISE ---
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
    <section className="py-24 px-6 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10 pt-10">
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.userName}
                      </h4>
                      <span className="text-xs text-blue-500 uppercase tracking-wide font-bold">
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

// --- FOOTER ---
const Footer = () => {
  return (
    <footer className="relative bg-gray-50 dark:bg-[#081220] text-slate-900 dark:text-white py-24 border-t border-gray-200 dark:border-white/5 text-center overflow-hidden transition-colors duration-300 z-10">
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px]">
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
                className="absolute inset-0 bg-blue-600"
                initial={{ y: "100%" }}
                whileHover={{ y: "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </footer>
  );
};

export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-blue-500 selection:text-white font-sans transition-colors duration-300">
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
              className="text-blue-500/30 dark:text-blue-400/20"
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
          <SectionReveal direction="scale" delay={0.1}>
            <OfferBanner />
          </SectionReveal>
          <SectionReveal direction="up">
            <TrendingMarquee />
          </SectionReveal>
          <SectionReveal direction="up">
            <SeaBitePromise />
          </SectionReveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}
