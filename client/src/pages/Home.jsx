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
  User,
  Anchor,
  ShoppingBag,
  Flame,
  ChevronRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

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

/* --- AESTHETIC NAVY & WHITE SPIN WHEEL POPUP --- */
const SpinWheelPopup = ({ userEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);

  // Re-designed Aesthetic Palette: Navy and White
  const prizes = [
    { label: "5% OFF", color: "#0f172a", text: "#ffffff", value: 5 },
    { label: "10% OFF", color: "#ffffff", text: "#0f172a", value: 10 },
    { label: "NO LUCK", color: "#0f172a", text: "#ffffff", value: 0 },
    { label: "15% OFF", color: "#ffffff", text: "#0f172a", value: 15 },
    { label: "20% OFF", color: "#0f172a", text: "#ffffff", value: 20 },
    { label: "50% OFF", color: "#ffffff", text: "#0f172a", value: 50 },
  ];

  useEffect(() => {
    // 🛠️ FOR TESTING: Restriction is currently disabled so you can test multiple spins
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
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(i * angle + angle / 2);
      ctx.fillStyle = prize.text;
      ctx.font = "bold 14px DM Sans";
      ctx.textAlign = "right";
      ctx.fillText(prize.label, 130, 5);
      ctx.restore();
    });

    // Central aesthetic "SeaBite" Hub
    ctx.beginPath();
    ctx.arc(150, 150, 25, 0, 2 * Math.PI);
    ctx.fillStyle = "#38bdf8"; 
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    if (!userEmail) return alert("Please login so we can save your coupon.");

    setSpinning(true);
    const rotation = 1800 + Math.floor(Math.random() * 360); 
    
    if (canvasRef.current) {
      canvasRef.current.style.transition = "transform 4s cubic-bezier(0.15, 0, 0.15, 1)";
      canvasRef.current.style.transform = `rotate(${rotation}deg)`;
    }

    try {
      const res = await axios.post(`${API_URL}/api/spin/spin`, { email: userEmail });
      const data = res.data;

      setTimeout(() => {
        if (data.result === "BETTER_LUCK") {
          setResult({ type: "none", label: "Better luck next time" });
        } else {
          setResult({ type: "coupon", value: data.discountValue, code: data.code });
          localStorage.setItem("seabiteWheelCoupon", data.code);
        }
        // 🛠️ FOR TESTING: Re-enable this line for production once testing is finished
        // localStorage.setItem("seabiteWheelUsed", "true");
        setSpinning(false);
      }, 4000);
    } catch (e) {
      setSpinning(false);
      alert("Spin error. Try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10 border border-slate-100">
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-slate-900 mb-2">SeaBite Rewards</h2>
              <p className="text-slate-500 text-sm">Spin to unlock the ocean's freshest discounts</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative mb-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-rose-500 drop-shadow-md">
                  <Anchor size={36} fill="currentColor" />
                </div>
                <canvas ref={canvasRef} width="300" height="300" className="rounded-full border-[10px] border-slate-900 shadow-2xl transition-transform" />
              </div>
              <button onClick={handleSpin} disabled={spinning || result} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                {spinning ? "THE WHEEL IS TURNING..." : result ? "WINNER!" : "SPIN THE WHEEL"}
              </button>
              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full">
                  {result.type === "none" ? (
                    <p className="text-center text-rose-500 font-bold italic">Better luck next time!</p>
                  ) : (
                    <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl text-center">
                      <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1">CONGRATULATIONS</p>
                      <p className="text-3xl font-mono font-black text-slate-900">{result.value}% OFF</p>
                      <div className="mt-3 inline-block px-4 py-1 bg-white border border-emerald-100 rounded-lg text-xs font-bold text-slate-500">CODE: {result.code}</div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- HERO SECTION --- */
const VideoHero = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <div className="relative h-screen w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-slate-900 z-20">
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <video autoPlay loop muted playsInline src="1.mp4" className="w-full h-full object-cover" />
      </motion.div>
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="space-y-6">
          <p className="text-blue-200 font-mono text-xs md:text-sm tracking-[0.5em] uppercase drop-shadow-md">The Ocean&apos;s Finest</p>
          <h1 className="text-[15vw] md:text-[12vw] leading-none font-serif text-white opacity-95 select-none drop-shadow-2xl">SEABITE</h1>
          <motion.div initial={{ width: 0 }} animate={{ width: "100px" }} transition={{ delay: 1, duration: 1 }} className="h-[1px] bg-white/50 mx-auto" />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/products"><button className="mt-8 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold tracking-widest text-xs hover:bg-white hover:text-black transition-all shadow-xl">Shop Now</button></Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

/* --- ROLLING MARQUEE --- */
const RollingText = () => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${v}%`);
  const directionFactor = useRef(1);

  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * 2 * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="bg-[#0a1625] border-y border-white/5 py-4 relative z-30 overflow-hidden text-white">
      <motion.div className="flex whitespace-nowrap" style={{ x }}>
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

/* --- CATEGORIES --- */
const categories = [
  { title: "Premium Fish", img: "/fish.png", bg: "from-blue-100/80 to-white dark:from-blue-900/40 dark:to-[#0a1625]" },
  { title: "Jumbo Prawns", img: "/prawn.png", bg: "from-indigo-100/80 to-white dark:from-indigo-900/40 dark:to-[#0a1625]" },
  { title: "Live Crabs", img: "/crab.png", bg: "from-cyan-100/80 to-white dark:from-cyan-900/40 dark:to-[#0a1625]" },
];

const CategoryPanel = () => {
  const [hovered, setHovered] = useState(0);
  return (
    <section className="py-20 px-4 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto mb-12 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white">Shop By Category</h2>
        <p className="text-blue-600 dark:text-blue-200 mt-2 font-light tracking-wide">Select your catch</p>
      </div>
      <div className="flex flex-col md:flex-row h-[400px] gap-4 max-w-6xl mx-auto relative z-10">
        {categories.map((cat, i) => (
          <Link
            to={`/products?category=${cat.title.split(" ")[1]}`}
            key={i}
            onMouseEnter={() => setHovered(i)}
            className={`relative rounded-[2rem] overflow-hidden transition-all duration-700 ${hovered === i ? "flex-[3] shadow-2xl shadow-blue-900/10" : "flex-[1] opacity-80"}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} z-0`} />
            <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
              <motion.img layout src={cat.img} alt={cat.title} className={`object-contain transition-all duration-700 ${hovered === i ? "w-[80%] h-[80%] opacity-100" : "w-24 h-24 opacity-50 grayscale"}`} />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-[#0a1625]/80 to-transparent">
              <h3 className={`font-serif text-slate-900 dark:text-white transition-all whitespace-nowrap ${hovered === i ? "text-3xl" : "text-xl"}`}>{cat.title}</h3>
              <div className={`flex items-center gap-2 text-blue-600 text-sm font-bold uppercase mt-2 transition-all ${hovered === i ? "opacity-100" : "opacity-0"}`}>Explore <ArrowRight /></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* --- FLASH SALE --- */
const FlashSale = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 18 });
  useEffect(() => {
    const timer = setInterval(() => {
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
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-10 px-4">
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 text-white text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4"><Flame size={14} className="text-yellow-300" /> Flash Deal</div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">TODAY&apos;S CATCH</h2>
          <p className="text-red-50 text-xl font-serif leading-relaxed">Order above <span className="text-yellow-300 font-bold underline">₹1699</span> and use <span className="mx-2 bg-white text-red-600 px-3 py-1 rounded-lg font-black not-italic text-lg border-2 border-dashed border-red-600 inline-block transform -rotate-2">SEABITE10</span> for <span className="font-black text-white not-italic text-2xl">10% OFF</span></p>
        </div>
        <div className="relative z-10 bg-white p-6 rounded-xl shadow-lg transform rotate-2 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ends In</p>
            <div className="flex gap-2 text-slate-900 font-mono font-black text-3xl">
              <span className="bg-slate-100 px-2 rounded">{timeLeft.hours.toString().padStart(2, "0")}</span>:<span className="bg-slate-100 px-2 rounded">{timeLeft.minutes.toString().padStart(2, "0")}</span>:<span className="bg-slate-100 px-2 rounded text-red-600">{timeLeft.seconds.toString().padStart(2, "0")}</span>
            </div>
          <Link to="/products" className="block mt-4 w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm uppercase">Grab The Deal</Link>
        </div>
      </div>
    </section>
  );
};

/* --- CATEGORY ROW --- */
const CategoryRow = ({ title, filterType }) => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const all = res.data.products || [];
      if (filterType === "Fish") setProducts(all.filter((p) => p.category === "Fish").slice(0, 4));
      else if (filterType === "Shellfish") setProducts(all.filter((p) => p.category === "Prawn" || p.category === "Crab").slice(0, 4));
    });
  }, [filterType]);

  const getImageUrl = (path) => path ? `${API_URL}${path.startsWith("/") ? path : `/${path}`}` : "";
  if (products.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">{filterType === "Fish" ? <Fish className="text-blue-500" /> : <Anchor className="text-orange-500" />}{title}</h2>
          <Link to="/products" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">See All <ChevronRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <Link to={`/products/${p._id}`} key={p._id}>
              <div className="group bg-white dark:bg-[#1e293b] border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
                <div className="relative h-40 md:h-48 bg-slate-50 flex items-center justify-center p-4">
                  <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-contain group-hover:scale-105 transition-all" />
                  {p.trending && <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">BESTSELLER</span>}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base line-clamp-2 mb-1">{p.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{p.netWeight}</p>
                  <div className="mt-auto flex justify-between items-center">
                    <div><span className="text-xs text-slate-400 line-through mr-2">₹{(p.basePrice * 1.2).toFixed(0)}</span><span className="font-bold text-slate-900 dark:text-white">₹{p.basePrice}</span></div>
                    <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><ShoppingBag size={14} /></button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/* --- OFFER BANNER --- */
const OfferBanner = () => {
  const [copied, setCopied] = useState(false);
  const [offer, setOffer] = useState({ code: "SEABITE20", value: 20, discountType: "percent" });

  useEffect(() => {
    axios.get(`${API_URL}/api/coupons`).then((res) => {
      if (res.data && res.data.length > 0) setOffer(res.data.find((c) => c.isActive) || res.data[0]);
    }).catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl relative z-10 group">
        <div className="w-full md:w-[60%] relative h-[300px] md:h-auto bg-gray-200 overflow-hidden">
          <img src="/20offer.png" alt="20% Off" className="w-full h-full object-cover transition-all group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="w-full md:w-[40%] bg-[#0f172a] p-8 md:p-12 flex flex-col justify-center items-center text-center text-white">
          <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-4 flex items-center gap-2"><Sparkles size={12} /> Official Coupon</div>
          <h2 className="text-6xl font-serif mb-2">{offer.discountType === "flat" ? `₹${offer.value}` : `${offer.value}%`}</h2>
          <h3 className="text-xl uppercase opacity-80 mb-6">{offer.discountType === "flat" ? "Cash Discount" : "Flat Discount"}</h3>
          <div onClick={handleCopy} className="w-full border-2 border-dashed border-white/20 p-4 rounded-xl mb-6 cursor-pointer hover:bg-white/10 transition-all">
            <p className="text-xs uppercase opacity-50 mb-1">Promo Code</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-emerald-400 flex items-center justify-center gap-2">{offer.code} {copied && <Check size={20} className="text-emerald-500" />}</p>
          </div>
          <Link to="/products" className="w-full"><button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold uppercase shadow-lg">Shop Now</button></Link>
        </div>
      </div>
    </section>
  );
};

/* --- TRENDING MARQUEE --- */
const TrendingMarquee = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/products`).then((res) => {
      const trending = (res.data.products || []).filter((p) => p.trending);
      setProducts([...trending, ...trending, ...trending]);
    });
  }, []);
  const getImageUrl = (path) => path ? `${API_URL}${path.startsWith("/") ? path : `/${path}`}` : "";

  return (
    <section className="py-24 overflow-hidden border-t border-gray-200 relative">
      <div className="container mx-auto px-6 mb-12 flex justify-between items-end relative z-10">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white">Best Sellers</h2>
      </div>
      <div className="relative w-full z-10">
        <motion.div className="flex gap-8 w-max" animate={{ x: ["0%", "-33.33%"] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }}>
          {products.map((p, i) => (
            <Link to={`/products/${p._id}`} key={`${p._id}-${i}`} className="w-[300px] group">
              <div className="bg-white dark:bg-[#0e1d30] border border-gray-200 rounded-[2rem] p-6 hover:shadow-xl transition-all">
                <div className="h-[220px] mb-6 flex items-center justify-center relative">
                  <img src={getImageUrl(p.image)} alt={p.name} className="w-48 h-48 object-contain transition-all group-hover:scale-110 group-hover:rotate-3" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-1 truncate">{p.name}</h3>
                  <span className="text-lg font-mono text-blue-600">₹{p.basePrice}</span>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* --- REVIEWS --- */
const SeaBitePromise = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`).then((res) => {
      setReviews(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 px-6 relative transition-all">
      <div className="max-w-7xl mx-auto relative z-10 pt-10">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white mb-4">Loved by Seafood Lovers</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {!loading && reviews.map((r, i) => (
            <motion.div key={i} whileHover={{ y: -10 }} className="bg-white/80 dark:bg-[#0e1d30]/90 p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
              <div className="flex items-center gap-1 mb-6">{[...Array(5)].map((_, starI) => <Star key={starI} className={`w-4 h-4 ${starI < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />)}</div>
              <p className="text-slate-700 dark:text-slate-300 mb-8 italic leading-relaxed">&quot;{r.comment}&quot;</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm"><User size={16} /></div>
                <div><h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.userName}</h4><span className="text-xs text-blue-500 uppercase tracking-wide font-bold">{r.productName}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* --- FOOTER --- */
const Footer = () => {
  return (
    <footer className="relative bg-gray-50 dark:bg-[#081220] text-slate-900 dark:text-white py-24 border-t border-gray-200 text-center overflow-hidden z-10">
      <div className="absolute inset-0 flex items-center whitespace-nowrap pointer-events-none overflow-hidden">
        <motion.div initial={{ x: 0 }} animate={{ x: "-50%" }} transition={{ duration: 20, ease: "linear", repeat: Infinity }} className="flex gap-20">
          <h2 className="text-[18vw] leading-none font-black text-gray-200/60 dark:text-[#0f1b2d] select-none uppercase">SEABITE SEABITE SEABITE</h2>
          <h2 className="text-[18vw] leading-none font-black text-gray-200/60 dark:text-[#0f1b2d] select-none uppercase">SEABITE SEABITE SEABITE</h2>
        </motion.div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px]">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400 font-light text-lg">Experience the true taste of the ocean.</p>
          <Link to="/products"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-12 py-5 bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg shadow-xl">Start Your Order</motion.button></Link>
        </motion.div>
      </div>
    </footer>
  );
};

/* --- HOME PAGE EXPORT --- */
export default function Home() {
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail") || JSON.parse(localStorage.getItem("user") || "{}")?.email || "";
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-blue-500 selection:text-white font-sans transition-all">
      <SpinWheelPopup userEmail={userEmail} />
      <VideoHero />
      <RollingText />
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full z-0">
          {[...Array(15)].map((_, i) => (
            <motion.div key={i} initial={{ x: "-200px", opacity: 0 }} animate={{ x: "100vw", opacity: [0, 0.2, 0.2, 0], rotate: [0, 5, -5, 0] }} transition={{ x: { duration: Math.random() * 20 + 15, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }, rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" } }} style={{ position: "absolute", top: `${Math.random() * 100}%`, scale: Math.random() * 1.5 + 1.0 }} className="text-blue-500/30 dark:text-blue-400/20"><Fish size={64} strokeWidth={1} fill="currentColor" /></motion.div>
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