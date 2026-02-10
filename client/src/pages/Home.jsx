import { useState, useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { 
  motion, useScroll, useTransform, useInView, 
  useMotionValue, useAnimationFrame, useVelocity, useSpring,
  AnimatePresence 
} from "framer-motion";
import axios from "axios";
import { 
  ArrowRight, Star, Fish, Sparkles, Check, ShoppingBag, 
  Flame, ChevronRight, User, Anchor 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// --- HELPERS ---
const SectionReveal = memo(({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
});

// --- 1. HERO SECTION ---
const VideoHero = memo(() => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]); 
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 z-20">
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/30 z-10" /> 
        <video autoPlay loop muted playsInline src="1.mp4" className="w-full h-full object-cover" />
      </motion.div>
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <p className="text-blue-200 font-mono text-xs tracking-[0.5em] uppercase mb-4">The Ocean's Finest</p>
          <h1 className="text-[15vw] md:text-[12vw] leading-none font-serif text-white opacity-95 select-none drop-shadow-2xl">SEABITE</h1>
          <Link to="/products">
            <button className="mt-8 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-500">
              Shop Now
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
});

// --- 2. ROLLING TEXT ---
const RollingText = memo(() => {
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, (v) => `${v}%`);
  useAnimationFrame((t, delta) => {
    baseX.set(baseX.get() + 1.5 * (delta / 1000));
  });
  return (
    <div className="bg-[#0a1625] border-y border-white/5 py-4 overflow-hidden text-white relative z-30">
      <motion.div className="flex whitespace-nowrap" style={{ x }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] mx-8 text-blue-200">Fresh Catch Daily</span>
            <Star className="w-3 h-3 text-blue-500" fill="currentColor" />
          </div>
        ))}
      </motion.div>
    </div>
  );
});

// --- 3. CATEGORY PANEL ---
const CategoryPanel = memo(() => {
  const [hovered, setHovered] = useState(0);
  const cats = [
    { title: "Premium Fish", img: "/fish.png", bg: "from-blue-100/80 to-white dark:from-blue-900/40" },
    { title: "Jumbo Prawns", img: "/prawn.png", bg: "from-indigo-100/80 to-white dark:from-indigo-900/40" },
    { title: "Live Crabs", img: "/crab.png", bg: "from-cyan-100/80 to-white dark:from-cyan-900/40" },
  ];
  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row h-[400px] gap-4">
        {cats.map((cat, i) => (
          <Link
            to={`/products?category=${cat.title.split(" ")[1]}`}
            key={i}
            onMouseEnter={() => setHovered(i)}
            className={`relative rounded-[2rem] overflow-hidden transition-all duration-700 flex-[${hovered === i ? "3" : "1"}] border border-gray-200 dark:border-white/10`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg}`} />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <img src={cat.img} alt={cat.title} className={`object-contain transition-all duration-700 ${hovered === i ? "w-[80%]" : "w-24 grayscale"}`} />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-white dark:from-black">
              <h3 className="font-serif text-slate-900 dark:text-white text-2xl">{cat.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
});

// --- 4. FLASH SALE ---
const FlashSale = memo(() => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date().setHours(24,0,0,0) - new Date();
      setTimeLeft({ h: Math.floor(diff/3600000 % 24), m: Math.floor(diff/60000 % 60), s: Math.floor(diff/1000 % 60) });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between shadow-2xl">
      <div className="text-white">
        <h2 className="text-4xl font-black italic mb-2">TODAY'S CATCH</h2>
        <p>Use code <span className="bg-white text-red-600 px-2 py-1 rounded font-bold">SEABITE10</span> for 10% OFF</p>
      </div>
      <div className="bg-white p-4 rounded-xl mt-4 text-center font-mono font-black text-2xl">
        {timeLeft.h}h : {timeLeft.m}m : <span className="text-red-600">{timeLeft.s}s</span>
      </div>
    </div>
  );
});

// --- 5. CATEGORY ROW ---
const CategoryRow = memo(({ title, filterType }) => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      setProducts(all.filter(p => filterType === "Fish" ? p.category === "Fish" : (p.category === "Prawn" || p.category === "Crab")).slice(0, 4));
    });
  }, [filterType]);
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-2 text-slate-900 dark:text-white">
        {filterType === "Fish" ? <Fish className="text-blue-500" /> : <Anchor className="text-orange-500" />} {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map(p => (
          <Link to={`/products/${p._id}`} key={p._id} className="group bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
            <div className="h-40 p-4 flex items-center justify-center">
              <img src={`${API_URL}${p.image}`} alt={p.name} className="max-h-full group-hover:scale-110 transition-transform" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
              <p className="text-blue-600 font-bold mt-2">₹{p.basePrice}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
});

// --- 6. OFFER BANNER ---
const OfferBanner = memo(() => {
  const [copied, setCopied] = useState(false);
  return (
    <section className="py-12 px-4 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl">
        <img src="/20offer.png" className="md:w-1/2 h-64 md:h-auto object-cover" alt="offer" />
        <div className="p-12 text-center text-white flex flex-col justify-center items-center">
          <h2 className="text-6xl font-serif mb-4">20% OFF</h2>
          <div onClick={() => {navigator.clipboard.writeText("SEABITE20"); setCopied(true)}} className="border-2 border-dashed border-white/20 p-4 rounded-xl cursor-pointer">
            <p className="text-2xl font-mono text-emerald-400 font-bold">SEABITE20 {copied && "✓"}</p>
          </div>
        </div>
      </div>
    </section>
  );
});

// --- 7. TRENDING MARQUEE ---
const TrendingMarquee = memo(() => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then(res => setProducts(res.data.products?.filter(p => p.trending) || []));
  }, []);
  return (
    <section className="py-24 overflow-hidden">
      <motion.div className="flex gap-8" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }}>
        {[...products, ...products].map((p, i) => (
          <Link key={i} to={`/products/${p._id}`} className="w-[300px] bg-white dark:bg-[#0e1d30] p-6 rounded-[2rem] shadow-sm">
            <img src={`${API_URL}${p.image}`} className="w-full h-40 object-contain mb-4" alt={p.name} />
            <h3 className="font-bold truncate">{p.name}</h3>
            <p className="text-blue-500 font-bold">₹{p.basePrice}</p>
          </Link>
        ))}
      </motion.div>
    </section>
  );
});

// --- 8. PROMISE ---
const SeaBitePromise = memo(() => (
  <section className="py-24 text-center">
    <h2 className="text-4xl font-serif mb-12 dark:text-white">The SeaBite Promise</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
      <div className="p-8 bg-white dark:bg-[#0e1d30] rounded-3xl shadow-sm">
        <Star className="mx-auto text-amber-400 mb-4" size={40} />
        <p className="italic">"Best prawns I've ever had in Bangalore!"</p>
        <p className="mt-4 font-bold">- Rahul S.</p>
      </div>
      <div className="p-8 bg-white dark:bg-[#0e1d30] rounded-3xl shadow-sm">
        <Fish className="mx-auto text-blue-500 mb-4" size={40} />
        <p className="italic">"The chemical-free guarantee is why I buy here."</p>
        <p className="mt-4 font-bold">- Priya K.</p>
      </div>
      <div className="p-8 bg-white dark:bg-[#0e1d30] rounded-3xl shadow-sm">
        <Anchor className="mx-auto text-orange-400 mb-4" size={40} />
        <p className="italic">"Super fast delivery and the fish was actually fresh."</p>
        <p className="mt-4 font-bold">- Amit M.</p>
      </div>
    </div>
  </section>
));

// --- 9. FOOTER ---
const Footer = memo(() => (
  <footer className="bg-gray-50 dark:bg-[#081220] py-24 text-center border-t border-gray-100 dark:border-white/5">
    <h2 className="text-4xl font-black opacity-10 uppercase mb-8">SEABITE SEABITE SEABITE</h2>
    <Link to="/products">
      <button className="px-12 py-5 bg-[#0f172a] text-white rounded-full font-bold shadow-xl">Start Your Order</button>
    </Link>
  </footer>
));

// --- MAIN HOME COMPONENT ---
export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 transition-colors duration-500 selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <VideoHero />
      <RollingText />
      <div className="relative">
        <SectionReveal><CategoryPanel /></SectionReveal>
        <SectionReveal><FlashSale /></SectionReveal>
        <SectionReveal><CategoryRow title="Fresh From The Nets" filterType="Fish" /></SectionReveal>
        <SectionReveal><CategoryRow title="Shellfish Specials" filterType="Shellfish" /></SectionReveal>
        <SectionReveal><OfferBanner /></SectionReveal>
        <SectionReveal><TrendingMarquee /></SectionReveal>
        <SectionReveal><SeaBitePromise /></SectionReveal>
      </div>
      <Footer />
    </div>
  );
}