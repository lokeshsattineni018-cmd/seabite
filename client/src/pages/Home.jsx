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

/* --- AESTHETIC NAVY & WHITE SPIN WHEEL (MongoDB Sync) --- */
const SpinWheelPopup = ({ userEmail }) => {
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
    const timer = setTimeout(() => setIsOpen(true), 2000);
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
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(i * angle + angle / 2);
      ctx.fillStyle = prize.text;
      ctx.font = "bold 12px DM Sans";
      ctx.textAlign = "right";
      ctx.fillText(prize.label, 130, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(150, 150, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleSpin = async () => {
    if (spinning || result) return;
    const email = localStorage.getItem("userEmail")?.toLowerCase();

    if (!email) {
      alert("Please login first to claim rewards!");
      return;
    }

    setSpinning(true);

    try {
      const res = await axios.post(`${API_URL}/api/spin/spin`, { email });
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
      alert("Account limit: You have already used your spin.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="absolute inset-0 bg-transparent" />
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

              {!result ? (
                <button onClick={handleSpin} disabled={spinning} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95">
                  {spinning ? "THE WHEEL IS TURNING..." : "SPIN THE WHEEL"}
                </button>
              ) : (
                <div className="w-full space-y-4">
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {result.result === "BETTER_LUCK" ? (
                      <p className="text-center text-rose-500 font-bold italic">Better luck next time!</p>
                    ) : (
                      <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl text-center">
                        <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1">CONGRATULATIONS</p>
                        <p className="text-3xl font-mono font-black text-slate-900">{result.discountValue}% OFF</p>
                        <p className="text-[10px] text-blue-600 mt-2 italic">Discount applied directly at checkout</p>
                      </div>
                    )}
                  </motion.div>
                  <Link to="/products" className="block w-full">
                    <button className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                       Shop Now <ArrowRight size={18} />
                    </button>
                  </Link>
                </div>
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
            <Link to="/products"><button className="mt-8 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-500 shadow-xl">Shop Now</button></Link>
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
    <section className="py-20 px-4 md:px-12 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto mb-12 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white transition-colors duration-300">Shop By Category</h2>
        <p className="text-blue-600 dark:text-blue-200 mt-2 font-light tracking-wide transition-colors duration-300">Select your catch</p>
      </div>
      <div className="flex flex-col md:flex-row h-[400px] gap-4 max-w-6xl mx-auto relative z-10">
        {categories.map((cat, i) => (
          <Link
            to={`/products?category=${cat.title.split(" ")[1]}`}
            key={i}
            onMouseEnter={() => setHovered(i)}
            className={`relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 ease-[0.25, 1, 0.5, 1] border border-gray-200 dark:border-white/10 ${hovered === i ? "flex-[3] shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/20" : "flex-[1] opacity-80 dark:opacity-60 hover:opacity-100"}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${cat.bg} z-0`} />
            <div className="absolute inset-0 flex items-center justify-center z-10 p-6">
              <motion.img layout src={cat.img} alt={cat.title} className={`object-contain drop-shadow-2xl transition-all duration-700 ${hovered === i ? "w-[80%] h-[80%] opacity-100" : "w-24 h-24 opacity-50 grayscale"}`} />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-[#0a1625]/80 to-transparent">
              <h3 className={`font-serif text-slate-900 dark:text-white transition-all duration-500 whitespace-nowrap ${hovered === i ? "text-3xl opacity-100" : "text-xl opacity-70"}`}>{cat.title}</h3>
              <div className={`flex items-center gap-2 text-blue-600 dark:text-blue-300 text-sm font-bold uppercase tracking-widest mt-2 overflow-hidden transition-all duration-500 ${hovered === i ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>Explore <ArrowRight /></div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* --- MAIN EXPORT --- */
export default function Home() {
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail") || JSON.parse(localStorage.getItem("user") || "{}")?.email || "";
    if (storedEmail) setUserEmail(storedEmail.toLowerCase());
  }, []);

  return (
    <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-blue-500 selection:text-white font-sans transition-colors duration-300">
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
          {/* FlashSale and Marquee components omitted for space, keep original ones */}
        </div>
      </div>
    </div>
  );
}