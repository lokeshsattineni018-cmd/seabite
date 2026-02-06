import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  useMotionValue,
  useAnimationFrame,
  useVelocity,
  AnimatePresence,
} from "framer-motion";
import axios from "axios";
import {
  ArrowRight,
  Star,
  Fish,
  Sparkles,
  X,
  Check,
  Gift,
  User,
  Anchor,
  ShoppingBag,
  Flame,
  ChevronRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// ✅ ENSURE AXIOS GLOBALS ARE SET (Failsafe)
axios.defaults.withCredentials = true;

/* --- ANIMATION WRAPPER --- */
const SectionReveal = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/* --- AESTHETIC NAVY & WHITE SPIN WHEEL (MongoDB Only) --- */
const SpinWheelPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);

  const prizes = [
    { label: "5% OFF", color: "#0f172a", text: "#ffffff", value: 5 },
    { label: "10% OFF", color: "#ffffff", text: "#0f172a", value: 10 },
    { label: "NO LUCK", color: "#0f172a", text: "#ffffff", value: 0 },
    { label: "15% OFF", color: "#ffffff", text: "#0f172a", value: 15 },
    { label: "20% OFF", color: "#0f172a", text: "#ffffff", value: 20 },
    { label: "50% OFF", color: "#ffffff", text: "#0f172a", value: 50 },
  ];

  useEffect(() => {
    // Show wheel after delay
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && canvasRef.current) drawWheel();
  }, [isOpen]);

  const drawWheel = () => {
    const ctx = canvasRef.current.getContext("2d");
    const radius = 145;
    ctx.clearRect(0, 0, 300, 300);
    
    prizes.forEach((prize, i) => {
      const angle = (2 * Math.PI) / prizes.length;
      ctx.beginPath();
      ctx.fillStyle = prize.color;
      ctx.moveTo(150, 150);
      ctx.arc(150, 150, radius, i * angle, (i + 1) * angle);
      ctx.fill();
      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(i * angle + angle / 2);
      ctx.fillStyle = prize.text;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(prize.label, 130, 5);
      ctx.restore();
    });

    // Center pin
    ctx.beginPath();
    ctx.arc(150, 150, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);

    try {
      // ✅ IDENTITY SYNC: Backend identifies user via Mongo Session Cookie
      const res = await axios.post(`${API_URL}/api/spin/spin`, {}, { withCredentials: true });
      const backendResult = res.data;

      const prizeIndex = prizes.findIndex(p => p.value === backendResult.discountValue);
      const targetDeg = 360 - (prizeIndex * 60) - 30; 
      const totalRotation = 1800 + targetDeg; 

      if (canvasRef.current) {
        canvasRef.current.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
        canvasRef.current.style.transform = `rotate(${totalRotation}deg)`;
      }

      setTimeout(() => {
        setResult(backendResult);
        setSpinning(false);
      }, 4000);
    } catch (e) {
      setSpinning(false);
      // 401 Unauthorized means no session found in MongoDB
      alert("Please login first to claim your SeaBite rewards!");
      window.location.href = "/login";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="absolute inset-0" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md bg-white rounded-[3.5rem] p-10 text-center shadow-2xl">
            <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-rose-500"><X size={24} /></button>
            <h2 className="text-3xl font-serif text-slate-900 mb-2">Ocean Luck</h2>
            <p className="text-slate-500 text-sm mb-10">Premium rewards for your Mongo account</p>
            <div className="relative mb-12 flex justify-center">
              <div className="absolute -top-6 z-20 text-rose-500 drop-shadow-md">
                <Anchor size={42} fill="currentColor" />
              </div>
              <canvas ref={canvasRef} width="300" height="300" className="rounded-full border-[10px] border-slate-900 shadow-2xl transition-transform" />
            </div>

            {!result ? (
              <button onClick={handleSpin} disabled={spinning} className="w-full py-5 bg-slate-900 text-white font-bold rounded-[1.5rem] shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                {spinning ? "THE WHEEL IS TURNING..." : "SPIN FOR LUCK"}
              </button>
            ) : (
              <div className="w-full space-y-6">
                {result.result === "BETTER_LUCK" ? (
                  <p className="text-rose-500 font-bold">Better luck next time!</p>
                ) : (
                  <div className="p-8 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[2rem]">
                    <p className="text-4xl font-black text-slate-900">{result.discountValue}% OFF</p>
                    <p className="text-[10px] text-blue-600 mt-3 font-bold uppercase">Saved to your Mongo Account</p>
                  </div>
                )}
                <Link to="/products" className="block w-full py-5 bg-blue-600 text-white font-bold rounded-[1.5rem] shadow-xl">Shop Now</Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- HERO & COMPONENTS --- */
const VideoHero = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 z-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <video autoPlay loop muted playsInline src="1.mp4" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="space-y-6">
          <p className="text-blue-200 font-mono text-xs md:text-sm tracking-[0.5em] uppercase">The Ocean&apos;s Finest</p>
          <h1 className="text-[15vw] md:text-[12vw] leading-none font-serif text-white opacity-95">SEABITE</h1>
          <Link to="/products"><button className="mt-8 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold tracking-widest text-xs hover:bg-white hover:text-black transition-all shadow-xl">Shop Now</button></Link>
        </motion.div>
      </div>
    </div>
  );
};

const RollingText = () => {
  return (
    <div className="bg-[#0a1625] border-y border-white/5 py-4 relative z-30 overflow-hidden text-white">
      <motion.div className="flex whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] mx-8 text-blue-200">Fresh Catch Daily</span>
            <Star className="w-3 h-3 text-blue-500" fill="currentColor" />
            <span className="text-sm font-bold uppercase tracking-[0.2em] mx-8 text-white">Sustainable</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-6" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

/* --- CATEGORIES & ROWS --- */
const categories = [
  { title: "Premium Fish", img: "/fish.png", bg: "from-blue-100/80 to-white dark:from-blue-900/40" },
  { title: "Jumbo Prawns", img: "/prawn.png", bg: "from-indigo-100/80 to-white dark:from-indigo-900/40" },
  { title: "Live Crabs", img: "/crab.png", bg: "from-cyan-100/80 to-white dark:from-cyan-900/40" },
];

const CategoryPanel = () => {
  const [hovered, setHovered] = useState(0);
  return (
    <section className="py-20 px-4 md:px-12">
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white">Shop By Category</h2>
      </div>
      <div className="flex flex-col md:flex-row h-[400px] gap-4 max-w-6xl mx-auto">
        {categories.map((cat, i) => (
          <Link to="/products" key={i} onMouseEnter={() => setHovered(i)} className={`relative rounded-[2rem] overflow-hidden transition-all duration-700 ${hovered === i ? "flex-[3]" : "flex-[1] opacity-70"}`}>
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} z-0`} />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <img src={cat.img} alt={cat.title} className="w-[80%] h-[80%] object-contain drop-shadow-2xl" />
            </div>
            <div className="absolute bottom-0 p-8 z-20 w-full bg-gradient-to-t from-white dark:from-black">
              <h3 className="font-serif text-slate-900 dark:text-white text-2xl">{cat.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const FlashSale = () => {
  return (
    <section className="py-10 px-4">
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl">
        <div>
          <h2 className="text-4xl md:text-5xl font-black italic mb-4 uppercase tracking-tighter">TODAY&apos;S CATCH</h2>
          <p className="text-red-50 text-xl font-serif">Order above ₹1699 & use <span className="bg-white text-red-600 px-3 py-1 rounded font-mono font-bold">SEABITE10</span></p>
        </div>
        <Link to="/products" className="px-10 py-4 bg-white text-red-600 rounded-xl font-bold uppercase tracking-widest shadow-lg mt-6 md:mt-0">Grab Deal</Link>
      </div>
    </section>
  );
};

const CategoryRow = ({ title, filterType }) => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      if (filterType === "Fish") setProducts(all.filter((p) => p.category === "Fish").slice(0, 4));
      else if (filterType === "Shellfish") setProducts(all.filter((p) => ["Prawn", "Crab"].includes(p.category)).slice(0, 4));
    });
  }, [filterType]);

  const getImageUrl = (path) => path ? `${API_URL}${path.startsWith("/") ? path : `/${path}`}` : "";
  if (!products.length) return null;

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 border-b pb-4 text-slate-900 dark:text-white">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link to={`/products/${p._id}`} key={p._id} className="group bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border dark:border-gray-800">
              <div className="h-48 bg-slate-50 dark:bg-[#0f172a] p-4">
                <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-all" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm mb-1">{p.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{p.netWeight}</p>
                <p className="font-bold text-lg">₹{p.basePrice}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const OfferBanner = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl">
        <div className="w-full md:w-[60%] h-64 md:h-auto"><img src="/20offer.png" className="w-full h-full object-cover" /></div>
        <div className="w-full md:w-[40%] p-12 text-center text-white flex flex-col justify-center items-center">
          <h2 className="text-6xl font-serif mb-2">20%</h2>
          <h3 className="text-xl uppercase tracking-widest mb-6 opacity-80">Flat Discount</h3>
          <div className="w-full border-2 border-dashed border-white/20 p-4 rounded-xl mb-6">
            <p className="text-2xl font-mono font-bold text-emerald-400 uppercase tracking-widest">SEABITE20</p>
          </div>
          <Link to="/products" className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold uppercase text-sm shadow-lg">Shop Now</Link>
        </div>
      </div>
    </section>
  );
};

const TrendingMarquee = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const trending = (res.data.products || []).filter((p) => p.trending);
      setProducts([...trending, ...trending]);
    });
  }, []);

  return (
    <section className="py-24 overflow-hidden bg-slate-50 dark:bg-[#081220]">
      <div className="container mx-auto px-6 mb-12"><h2 className="text-4xl font-serif text-slate-900 dark:text-white">Best Sellers</h2></div>
      <motion.div className="flex gap-8" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}>
        {products.map((p, i) => (
          <div key={`${p._id}-${i}`} className="w-[300px] bg-white dark:bg-[#0e1d30] p-6 rounded-[2rem] shadow-sm border dark:border-gray-800">
            <img src={`${API_URL}/${p.image}`} className="w-48 h-48 mx-auto object-contain mb-6" />
            <h3 className="text-lg font-serif mb-1 truncate">{p.name}</h3>
            <p className="font-bold text-blue-600">₹{p.basePrice}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
};

const SeaBitePromise = () => {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`).then((res) => setReviews(res.data));
  }, []);

  return (
    <section className="py-24 px-6 text-center">
      <h2 className="text-4xl font-serif mb-12">Loved by Seafood Lovers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white dark:bg-[#0e1d30] p-8 rounded-[2rem] border dark:border-gray-800 text-left shadow-sm">
             <div className="flex gap-1 mb-6 text-amber-400">{[...Array(5)].map((_, s) => <Star key={s} size={16} fill="currentColor" />)}</div>
             <p className="text-slate-600 dark:text-slate-300 italic mb-8">&quot;{r.comment}&quot;</p>
             <h4 className="font-bold text-sm">{r.userName}</h4>
          </div>
        ))}
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-24 text-center">
      <p className="text-slate-400 font-light text-lg mb-8">Experience the true taste of the ocean.</p>
      <Link to="/products"><button className="px-12 py-5 bg-white text-slate-900 rounded-full font-bold text-lg shadow-xl">Start Your Order</button></Link>
    </footer>
  );
};

/* --- MAIN PAGE --- */
export default function Home() {
  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen font-sans selection:bg-blue-500 selection:text-white transition-colors">
      <SpinWheelPopup />
      <VideoHero />
      <RollingText />
      <div className="relative">
        {/* Animated Background Fish */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(10)].map((_, i) => (
            <motion.div key={i} animate={{ x: ["-200px", "100vw"], opacity: [0, 0.2, 0.2, 0] }} transition={{ duration: 15 + i, repeat: Infinity, delay: i * 2, ease: "linear" }} className="absolute text-blue-500/20 top-[20%]" style={{ top: `${i * 10}%` }}>
              <Fish size={64} fill="currentColor" />
            </motion.div>
          ))}
        </div>
        <div className="relative z-10">
          <SectionReveal><CategoryPanel /></SectionReveal>
          <SectionReveal><FlashSale /></SectionReveal>
          <SectionReveal><CategoryRow title="Fresh From The Nets" filterType="Fish" /></SectionReveal>
          <SectionReveal><CategoryRow title="Shellfish Specials" filterType="Shellfish" /></SectionReveal>
          <SectionReveal><OfferBanner /></SectionReveal>
          <SectionReveal><TrendingMarquee /></SectionReveal>
          <SectionReveal><SeaBitePromise /></SectionReveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}