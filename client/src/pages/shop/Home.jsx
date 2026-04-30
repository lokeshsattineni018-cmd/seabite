import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import PullToRefresh from "../../components/common/PullToRefresh"; // 🎣 Pull to Refresh
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Star,
  ShieldCheck,
  Truck,
  User,
  Thermometer,
  Utensils,
  ChevronDown,
  Flame,
  ChevronRight,
  Zap,
  Waves,
  Copy,
  Check,
} from "lucide-react";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";
import TrendingProducts from "../../components/products/TrendingProducts";


const API_URL = import.meta.env.VITE_API_URL || "";

// ══════════════════════════════════════════════
//  ANIMATION PRIMITIVES
// ══════════════════════════════════════════════

const Reveal = ({ children, delay = 0, y = 28, x = 0, duration = 0.65 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y, x }} animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}} transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

const RevealLeft = ({ children, delay = 0 }) => <Reveal delay={delay} y={0} x={-32}>{children}</Reveal>;
const RevealRight = ({ children, delay = 0 }) => <Reveal delay={delay} y={0} x={32}>{children}</Reveal>;

const ScaleReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-4% 0px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.96 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

const Stagger = ({ children, className = "", staggerDelay = 0.09 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-6% 0px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.08 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const SI = ({ children, className = "" }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
    className={className}
  >
    {children}
  </motion.div>
);

const Counter = ({ value, suffix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 60, damping: 22 });
  const [display, setDisplay] = useState(0);
  useEffect(() => { if (isInView) spring.set(value); }, [isInView, value]);
  useMotionValueEvent(spring, "change", (v) => setDisplay(Math.round(v)));
  return <span ref={ref}>{display}{suffix}</span>;
};

// ── SHARED UI ──────────────────────────────────

const Chip = ({ children, color = "teal" }) => {
  const p = {
    teal: "bg-[#EAF6F5] text-[#3D8C85] border-[#C5E6E4]",
    coral: "bg-[#FEF0EC] text-[#C05A45] border-[#F5C4BB]",
    sand: "bg-[#FAF4EC] text-[#8B6D45] border-[#EAD9C0]",
    sky: "bg-[#EDF5FB] text-[#3A7DA0] border-[#BDD9EE]",
  };
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${p[color]}`}>{children}</span>;
};

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-6 h-px bg-[#5BA8A0]" />
    <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#5BA8A0]">{children}</span>
  </div>
);

const CTAButton = ({ children, to, variant = "primary", className = "" }) => {
  const base = "inline-flex items-center gap-2.5 font-semibold text-sm transition-all duration-300 rounded-full";
  const styles = {
    primary: "px-7 py-3.5 bg-[#1A2B35] text-white hover:bg-[#5BA8A0] shadow-sm hover:shadow-[0_4px_20px_rgba(91,168,160,0.35)]",
    outline: "px-7 py-3.5 border border-[#CBD8DF] text-[#4A6572] hover:border-[#5BA8A0] hover:text-[#5BA8A0] bg-white",
    coral: "px-7 py-3.5 bg-[#E8816A] text-white hover:bg-[#D4705A] shadow-sm hover:shadow-[0_4px_20px_rgba(232,129,106,0.3)]",
  };
  return (
    <Link to={to}>
      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className={`${base} ${styles[variant]} ${className}`}>
        {children}
      </motion.button>
    </Link>
  );
};

// ══════════════════════════════════════════════
//  HERO
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  HERO CAROUSEL
// ══════════════════════════════════════════════
const Hero = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, 140]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.25]);

  return (
    <section className="relative h-screen min-h-[680px] max-h-[960px] overflow-hidden">
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />
        
        {!isVideoLoaded && (
          <div className="absolute inset-0 z-40 bg-[#1A2B35] flex items-center justify-center">
            <SeaBiteLoader />
          </div>
        )}

        <video
          autoPlay
          loop
          muted
          playsInline
          onCanPlayThrough={() => setIsVideoLoaded(true)}
          src="1.mp4"
          className="w-full h-full object-cover scale-105"
        />
      </motion.div>

      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div>
              <Chip color="teal"><Waves size={11} /> Every Day Fresh Catch</Chip>
            </div>

            <h1
              className="text-4xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.06] tracking-tight text-white drop-shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Premium Fresh<br />
              <span style={{ color: "#5BA8A0" }}>Seafood</span><br />
              Delivered Home.
            </h1>

            <p className="text-white/75 text-lg leading-relaxed max-w-md">
              Experience the finest quality seafood sourced daily at 4 AM and delivered fresh by noon. Chemical-free and 100% traceable.
            </p>

            <div className="flex flex-wrap gap-3">
              <CTAButton to="/products" variant="primary">Shop Now <ArrowRight size={15} /></CTAButton>
              <Link to="/products">
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2.5 font-semibold text-sm px-7 py-3.5 rounded-full border border-white/25 text-white/80 hover:border-white/60 hover:text-white bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  View All Catch
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <div className="hidden md:flex justify-center items-center relative h-[420px]">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-white/60 p-8 text-center w-52"
            >
              <div className="text-6xl mb-3">🦐</div>
              <p className="text-sm font-semibold text-[#1A2B35]">Fresh Jumbo Prawns</p>
              <p className="text-xs text-[#8BA5B3] mt-1">Just arrived today</p>
            </motion.div>

            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.2 }}
              className="absolute bottom-8 left-8 bg-[#1A2B35]/80 backdrop-blur-md text-white rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-xl"
            >
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold">4.9</span>
              <span className="text-[10px] text-white/50">· 200+ reviews</span>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Scroll</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <ChevronDown size={16} className="text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

// ══════════════════════════════════════════════
//  WAVE TICKER
// ══════════════════════════════════════════════
const WaveTicker = () => {
  const items = ["Fresh Catch Daily", "Ocean to Table", "Sustainable Sourcing", "Cold Chain Delivery", "Chef Approved", "Lab Tested Quality"];

  const WaveWord = ({ text, index, totalWords }) => {
    const phase = (index / totalWords) * Math.PI * 2;
    return (
      <motion.span
        animate={{ y: [Math.sin(phase) * 3, Math.sin(phase + Math.PI) * 3, Math.sin(phase) * 3] }}
        transition={{ repeat: Infinity, duration: 2.4, delay: (index / totalWords) * 1.2, ease: "easeInOut" }}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/70 mx-8">{text}</span>
        <span style={{ color: "#5BA8A0", fontSize: "13px" }}>〰</span>
      </motion.span>
    );
  };

  const doubled = [...items, ...items];

  return (
    <div style={{ lineHeight: 0 }}>
      <div className="bg-[#1A2B35] overflow-hidden" style={{ paddingTop: "16px", paddingBottom: "16px", position: "relative", lineHeight: "normal" }}>
        <div className="absolute left-0 right-0 pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)", height: "1px", background: "linear-gradient(90deg, transparent, rgba(91,168,160,0.18), transparent)" }} />
        <motion.div className="flex whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 32, ease: "linear", repeat: Infinity }} style={{ willChange: "transform" }}>
          {doubled.map((item, i) => <WaveWord key={i} text={item} index={i % items.length} totalWords={items.length} />)}
        </motion.div>
      </div>
      <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "60px", background: "#F8FAFB" }} preserveAspectRatio="none">
        <path d="M0 0 C200 60, 400 0, 600 30 C800 60, 1000 0, 1200 30 C1320 50, 1400 20, 1440 30 L1440 0 Z" fill="#1A2B35" />
      </svg>
    </div>
  );
};

// ══════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════
const categories = [
  { title: "Premium Fish", sub: "20+ varieties", img: "/fish.png", tag: "Fish", bg: "from-[#EAF6F5] to-[#F8FAFB]", accent: "#5BA8A0" },
  { title: "Jumbo Prawns", sub: "Wild-caught daily", img: "/prawn.png", tag: "Prawn", bg: "from-[#EDF5FB] to-[#F8FAFB]", accent: "#89C2D9" },
  { title: "Live Crabs", sub: "Ships in tank water", img: "/crab.png", tag: "Crab", bg: "from-[#FEF0EC] to-[#F8FAFB]", accent: "#E8816A" },
];

const CategorySection = () => {
  const [hovered, setHovered] = useState(null);
  return (
    <section className="py-20 px-6 md:px-12 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <RevealLeft>
            <div>
              <SectionLabel>Browse Categories</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A2B35] leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                What are you<br />craving today?
              </h2>
            </div>
          </RevealLeft>
          <RevealRight delay={0.1}><CTAButton to="/products" variant="outline">All Products <ArrowRight size={14} /></CTAButton></RevealRight>
        </div>

        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <SI key={i}>
              <Link to={`/products?category=${cat.tag}`}>
                <motion.div onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
                  className={`relative rounded-2xl overflow-hidden border border-[#E8EEF2] bg-gradient-to-br ${cat.bg} p-6 h-64 cursor-pointer shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A2B35]">{cat.title}</h3>
                      <p className="text-sm text-[#8BA5B3] mt-0.5">{cat.sub}</p>
                    </div>
                    <motion.div animate={{ rotate: hovered === i ? 45 : 0 }} transition={{ duration: 0.25 }} className="w-8 h-8 rounded-full border border-[#E8EEF2] bg-white flex items-center justify-center">
                      <ArrowRight size={14} className="text-[#8BA5B3]" />
                    </motion.div>
                  </div>
                  <motion.img src={cat.img} alt={cat.title} animate={{ scale: hovered === i ? 1.06 : 1, rotate: hovered === i ? 3 : 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-4 right-4 w-36 h-36 object-contain drop-shadow-lg" />
                  <div className="absolute bottom-5 left-6">
                    <motion.div animate={{ opacity: hovered === i ? 1 : 0, y: hovered === i ? 0 : 6 }} transition={{ duration: 0.25 }} className="text-xs font-bold text-white px-3 py-1.5 rounded-full" style={{ backgroundColor: cat.accent }}>
                      Explore →
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </SI>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════
//  FLASH SALE
// ══════════════════════════════════════════════
const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date().setHours(24, 0, 0, 0) - Date.now();
      if (diff > 0) setTimeLeft({ hours: Math.floor((diff / 36e5) % 24), minutes: Math.floor((diff / 6e4) % 60), seconds: Math.floor((diff / 1e3) % 60) });
    };
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("SEABITE10");
    setCopied(true);
    toast.success("Coupon code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const pad = (v) => String(v).padStart(2, "0");

  return (
    <section className="px-6 md:px-12 py-6 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto">
        <ScaleReveal>
          <div className="relative rounded-2xl overflow-hidden border border-[#E8EEF2] bg-white shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5BA8A0] via-[#89C2D9] to-[#E8816A]" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF0EC] flex items-center justify-center flex-shrink-0"><Flame size={22} className="text-[#E8816A]" /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1"><Chip color="coral"><Zap size={10} /> Flash Deal</Chip></div>
                  <p className="text-[#1A2B35] font-bold text-lg md:text-xl leading-snug">Order above <span className="text-[#5BA8A0]">₹1,699</span> — get <span className="text-[#E8816A]">10% OFF</span></p>
                  <div className="flex items-center gap-2 text-[#8BA5B3] text-sm mt-1">
                    Use coupon
                    <button
                      onClick={handleCopy}
                      className="group flex items-center gap-2 font-mono font-bold text-[#1A2B35] bg-[#F5EFE6] px-2.5 py-1 rounded-md text-xs border border-[#E8D9C4] hover:bg-[#E8D9C4] transition-colors"
                    >
                      SEABITE10
                      {copied ? <Check size={12} className="text-[#5BA8A0]" /> : <Copy size={12} className="text-[#8BA5B3] group-hover:text-[#1A2B35]" />}
                    </button>
                    at checkout
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  {[{ v: timeLeft.hours, label: "HRS" }, { v: timeLeft.minutes, label: "MIN" }, { v: timeLeft.seconds, label: "SEC" }].map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-[#CBD8DF] font-bold text-lg mb-2">:</span>}
                      <div className="text-center">
                        <AnimatePresence mode="popLayout">
                          <motion.div key={t.v} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.2 }} className="w-11 h-11 bg-[#F8FAFB] border border-[#E8EEF2] rounded-xl flex items-center justify-center font-bold text-[#1A2B35] text-base tabular-nums">
                            {pad(t.v)}
                          </motion.div>
                        </AnimatePresence>
                        <p className="text-[9px] text-[#8BA5B3] mt-1 font-medium tracking-wider">{t.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <CTAButton to="/products" variant="coral">Grab Deal <ArrowRight size={14} /></CTAButton>
              </div>
            </div>
          </div>
        </ScaleReveal>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════
//  PRODUCT ROWS
// ══════════════════════════════════════════════
const CategoryRow = ({ title, filterType }) => {
  const [products, setProducts] = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      setGlobalDiscount(res.data.globalDiscount || 0);
      const filtered = filterType === "Fish"
        ? all.filter((p) => p.category === "Fish").slice(0, 4)
        : all.filter((p) => p.category === "Prawn" || p.category === "Crab").slice(0, 4);
      setProducts(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filterType]);

  const Skeleton = () => (
    <div className="bg-white rounded-2xl border border-[#E8EEF2] overflow-hidden p-4 space-y-4 animate-pulse">
      <div className="aspect-square bg-stone-100 rounded-xl" />
      <div className="h-4 bg-stone-100 rounded-md w-3/4" />
      <div className="h-4 bg-stone-100 rounded-md w-1/2" />
    </div>
  );
  if (!products.length) return null;
  return (
    <section className="py-16 px-6 md:px-12 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <RevealLeft>
            <div>
              <SectionLabel>{filterType === "Fish" ? "Fish" : "Shellfish"}</SectionLabel>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B35]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
            </div>
          </RevealLeft>
          <RevealRight delay={0.1}>
            <Link to="/products" className="flex items-center gap-1.5 text-sm font-semibold text-[#5BA8A0] hover:text-[#3D8C85] transition-colors">
              See all <motion.span whileHover={{ x: 3 }} className="inline-block"><ChevronRight size={15} /></motion.span>
            </Link>
          </RevealRight>
        </div>
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((p) => (
              <SI key={p._id}>
                <div className="bg-white rounded-2xl border border-[#E8EEF2] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1">
                  <EnhancedProductCard product={p} globalDiscount={globalDiscount} />
                </div>
              </SI>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-[#8BA5B3]">No products available in this category.</div>
          )}
        </Stagger>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════
//  WHY SEABITE
// ══════════════════════════════════════════════
const WhySeaBite = () => {
  const features = [
    { icon: <ShieldCheck size={20} />, title: "Quality Guaranteed", desc: "Every batch lab-tested for freshness and safety before dispatch.", color: "text-[#3D8C85]", bg: "bg-[#EAF6F5]" },
    { icon: <Thermometer size={20} />, title: "Cold Chain Delivery", desc: "Temperature-controlled packaging from ocean to your doorstep.", color: "text-[#3A7DA0]", bg: "bg-[#EDF5FB]" },
    { icon: <Truck size={20} />, title: "Same Day Dispatch", desc: "Order before 2 PM and it ships today — freshness guaranteed.", color: "text-[#8B6D45]", bg: "bg-[#FAF4EC]" },
    { icon: <Utensils size={20} />, title: "Chef Approved", desc: "Trusted by restaurants and home cooks across the coastline.", color: "text-[#C05A45]", bg: "bg-[#FEF0EC]" },
  ];
  const stats = [
    { value: 500, suffix: "+", label: "Happy Customers" },
    { value: 20, suffix: "+", label: "Varieties Available" },
    { value: 98, suffix: "%", label: "Freshness Score" },
    { value: 4, suffix: ".8★", label: "Average Rating" },
  ];
  return (
    <section className="py-20 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <RevealLeft>
            <div>
              <SectionLabel>Why Choose Us</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A2B35] leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>The SeaBite<br />difference.</h2>
            </div>
          </RevealLeft>
          <RevealRight delay={0.1}>
            <p className="text-[#4A6572] max-w-sm text-[15px] leading-relaxed">We set the bar higher so every meal you cook starts with the finest, freshest ingredient possible.</p>
          </RevealRight>
        </div>
        <ScaleReveal delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {stats.map((s, i) => (
              <motion.div key={i} whileHover={{ y: -3, borderColor: "#C5E6E4" }} transition={{ duration: 0.25 }} className="bg-[#F8FAFB] border border-[#E8EEF2] rounded-2xl p-6 text-center transition-colors duration-300">
                <p className="text-3xl font-black text-[#1A2B35] mb-1"><Counter value={s.value} suffix={s.suffix} /></p>
                <p className="text-[11px] text-[#8BA5B3] font-medium uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </ScaleReveal>
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <SI key={i}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="bg-[#F8FAFB] border border-[#E8EEF2] rounded-2xl p-6 h-full hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300">
                <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-5`}>{f.icon}</div>
                <h3 className="font-bold text-[#1A2B35] mb-2 text-[15px]">{f.title}</h3>
                <p className="text-sm text-[#8BA5B3] leading-relaxed">{f.desc}</p>
              </motion.div>
            </SI>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`)
      .then((res) => { 
        setReviews(res.data); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return cleanPath.startsWith("/uploads")
      ? `${API_URL}${cleanPath}`
      : `${API_URL}/uploads${cleanPath}`;
  };

  return (
    <section className="py-24 px-6 md:px-12 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F0FBF9] rounded-full blur-3xl opacity-60 -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FEF0EC] rounded-full blur-3xl opacity-40 -ml-48 -mb-48" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <Reveal>
            <SectionLabel>Wall of Love</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A2B35] tracking-tight mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              What our community <br className="hidden md:block" />
              is <span className="text-[#5BA8A0]">catching</span>.
            </h2>
          </Reveal>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><SeaBiteLoader /></div>
        ) : reviews.length > 0 ? (
          <Stagger className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {reviews.map((r, i) => (
              <SI key={i} className="break-inside-avoid">
                <motion.div 
                  whileHover={{ y: -6 }} 
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} 
                  className="bg-[#F8FAFB] border border-[#E8EEF2] rounded-[2rem] p-6 md:p-8 hover:shadow-[0_20px_50px_rgba(26,46,44,0.08)] transition-all duration-500 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={14} className={j < r.rating ? "text-amber-400 fill-amber-400" : "text-[#E8EEF2]"} />
                      ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B8CFCC]">Verified</span>
                  </div>

                  <p className="text-[#4A6572] text-[15px] leading-relaxed mb-6 font-medium italic">
                    &ldquo;{r.comment}&rdquo;
                  </p>

                  {/* Review Images Feed */}
                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                      {r.images.map((img, idx) => (
                        <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          <img src={getFullImageUrl(img)} alt="Customer review" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-6 border-t border-[#E8EEF2]">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1A2B35] to-[#4A6572] flex items-center justify-center text-white shadow-lg">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-[#1A2B35]">{r.userName}</p>
                      <p className="text-xs text-[#5BA8A0] font-bold tracking-tight uppercase">{r.productName}</p>
                    </div>
                  </div>
                </motion.div>
              </SI>
            ))}
          </Stagger>
        ) : (
          <div className="text-center py-20 bg-[#F8FAFB] rounded-[3rem] border border-dashed border-[#E2EEEC]">
            <p className="text-[#B8CFCC] font-bold">The wall is waiting for your story. 🌊</p>
          </div>
        )}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

// ══════════════════════════════════════════════
//  SCROLL-TO-TOP
// ══════════════════════════════════════════════
const ScrollTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { const h = () => setShow(window.scrollY > 500); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} whileHover={{ y: -2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-white border border-[#E8EEF2] rounded-full shadow-md flex items-center justify-center text-[#4A6572] hover:border-[#5BA8A0] hover:text-[#5BA8A0] transition-colors"
        >
          <ChevronDown size={20} className="rotate-180" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ══════════════════════════════════════════════
//  PAGE EXPORT
// ══════════════════════════════════════════════
export default function Home() {
  const handleRefresh = async () => {
    // Simulate data refetch or just reload
    return new Promise(resolve => setTimeout(resolve, 1500)).then(() => {
      window.location.reload();
    });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-[#F8FAFB] min-h-screen text-[#1A2B35] selection:bg-[#C5E6E4] selection:text-[#1A2B35] antialiased" style={{ fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif" }}>
        <Helmet>
          <title>SeaBite - Premium Ocean-Fresh Seafood Delivered</title>
          <meta name="description" content="Shop premium fish, prawns, and crabs sourced daily from Mogalthur. Cold-chain delivered ocean-fresh seafood directly to your doorstep. Experience the SeaBite quality." />
          <meta property="og:title" content="SeaBite - Fresh Coastal Catch Delivered" />
          <meta property="og:description" content="Premium seafood sourced daily at 4 AM and delivered fresh by noon. Chemical-free and 100% traceable coastal catch from SeaBite." />
          <meta property="og:image" content="/fisherman.jpg" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          * { -webkit-font-smoothing: antialiased; }
        `}</style>
  
        <div className="bg-[#1A2B35]">
          <Hero />
          <WaveTicker />
        </div>
  
        <CategorySection />
        <FlashSale />
        <CategoryRow title="Fresh From The Nets" filterType="Fish" />
        <CategoryRow title="Shellfish Specials" filterType="Shellfish" />
  
        <section className="py-4 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <SectionLabel>Trending</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A2B35] mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Customer Favorites</h2>
            </Reveal>
            <TrendingProducts />
          </div>
        </section>
  
        <Reviews />
        <WhySeaBite />
        <ScrollTop />
      </div>
    </PullToRefresh>
  );
}