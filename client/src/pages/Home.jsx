import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  ArrowRight, Star, ShieldCheck, Truck, Clock, Fish, Sparkles, X, 
  Copy, Check, Gift, ChevronRight, ShoppingBag, Flame, Percent, 
  ChevronLeft, Timer, MapPin, Zap, Thermometer 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// --- HELPER: SCROLL REVEAL ---
const SectionReveal = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
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
};

// --- 1. HERO CAROUSEL (Real E-com Style) ---
const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const slides = [
    {
      id: 1,
      bg: "bg-gradient-to-r from-blue-900 to-slate-900",
      image: "https://images.unsplash.com/photo-1534948216015-843143f7aa67?auto=format&fit=crop&q=80&w=1000",
      title: "Fresh. Never Frozen.",
      subtitle: "Get ₹150 OFF on your first order.",
      code: "SEABITE150",
      cta: "Order Now"
    },
    {
      id: 2,
      bg: "bg-gradient-to-r from-emerald-900 to-slate-900",
      image: "https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&q=80&w=1000",
      title: "Jumbo Prawns Festival",
      subtitle: "Cleaned, Deveined & Ready to Cook.",
      code: "PRAWN20",
      cta: "Shop Prawns"
    },
    {
      id: 3,
      bg: "bg-gradient-to-r from-orange-900 to-slate-900",
      image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=1000",
      title: "Sunday Curry Special",
      subtitle: "Pre-cut Curry Slices delivered in 90 mins.",
      code: "CURRY50",
      cta: "Explore Cuts"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[450px] md:h-[500px] overflow-hidden bg-slate-100 dark:bg-[#0a1625]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img src={slides[current].image} alt="Hero" className="w-full h-full object-cover" />
          
          {/* Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 max-w-7xl mx-auto">
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="max-w-xl"
            >
              <span className="inline-block px-3 py-1 bg-yellow-400 text-slate-900 text-xs font-bold uppercase tracking-wider rounded-sm mb-4">
                Limited Offer
              </span>
              <h1 className="text-4xl md:text-6xl font-serif text-white mb-4 leading-tight drop-shadow-lg">
                {slides[current].title}
              </h1>
              <p className="text-gray-200 text-lg md:text-xl mb-6 font-light">
                {slides[current].subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl w-full sm:w-auto">
                    {slides[current].cta}
                  </button>
                </Link>
                <div className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white w-max">
                  <span className="text-xs uppercase opacity-70">Use Code:</span>
                  <span className="font-mono font-bold text-yellow-400">{slides[current].code}</span>
                  <Copy size={16} className="cursor-pointer hover:text-yellow-400" onClick={() => navigator.clipboard.writeText(slides[current].code)}/>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
              current === index ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// --- 2. QUICK CATEGORIES (Story Style) ---
const QuickCategories = () => {
    const items = [
        { name: "Sea Fish", img: "https://cdn-icons-png.flaticon.com/512/3065/3065535.png" },
        { name: "Prawns", img: "https://cdn-icons-png.flaticon.com/512/2829/2829822.png" },
        { name: "Crabs", img: "https://cdn-icons-png.flaticon.com/512/3065/3065548.png" },
        { name: "Boneless", img: "https://cdn-icons-png.flaticon.com/512/6065/6065488.png" },
        { name: "Steaks", img: "https://cdn-icons-png.flaticon.com/512/3274/3274099.png" },
        { name: "Today's Catch", img: "https://cdn-icons-png.flaticon.com/512/2553/2553691.png" },
    ];

    return (
        <div className="bg-white dark:bg-[#0f172a] py-6 border-b border-gray-100 dark:border-white/5 shadow-sm sticky top-16 z-10">
            <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-6 md:justify-center min-w-max">
                    {items.map((item, i) => (
                        <Link to={`/products?cat=${item.name}`} key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent group-hover:border-blue-500 p-3 transition-all shadow-sm group-hover:shadow-md">
                                <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

// --- 3. BANK OFFERS TICKER ---
const BankOffers = () => {
    const offers = [
        { icon: <Percent size={14} />, text: "Flat ₹100 OFF on Orders above ₹999 | Code: HUGE100" },
        { icon: <Zap size={14} />, text: "Free Delivery on your first Order | Code: FREEDEL" },
        { icon: <Gift size={14} />, text: "Get Free Marinade on 1kg Prawns" },
    ];
    
    return (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 py-3 overflow-hidden border-b border-blue-100 dark:border-white/5">
            <motion.div 
                className="flex gap-8 whitespace-nowrap min-w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
                {[...offers, ...offers, ...offers].map((offer, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-[#0a1625] px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30 shadow-sm">
                        {offer.icon} {offer.text}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

// --- 4. PRODUCT CARD (Professional Design) ---
const ProductCard = ({ product }) => {
    const getImageUrl = (path) => path ? `${API_URL}${path.startsWith('/') ? path : `/${path}`}` : "";
    const discount = 20; // Simulated discount percentage

    return (
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full">
            {/* Image Area */}
            <div className="relative h-48 bg-slate-50 dark:bg-[#0f172a] p-4 flex items-center justify-center">
                <Link to={`/products/${product._id}`} className="w-full h-full">
                   <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105" />
                </Link>
                {/* Badges */}
                <div className="absolute top-0 left-0 p-2 flex flex-col gap-1">
                    {product.trending && <span className="bg-amber-400 text-[10px] font-bold px-2 py-0.5 rounded text-amber-950 uppercase tracking-wide">Bestseller</span>}
                    <span className="bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wide">{discount}% OFF</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm dark:bg-black/50 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                    <Clock size={10} /> 90 min delivery
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-grow">
                <Link to={`/products/${product._id}`}>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-1 hover:text-blue-600 transition-colors line-clamp-2">{product.name}</h3>
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{product.netWeight || "500g"} Net Wt.</p>
                
                {/* Price & Action */}
                <div className="mt-auto flex justify-between items-end">
                    <div>
                        <p className="text-xs text-slate-400 line-through mb-0.5">₹{(product.basePrice * 1.25).toFixed(0)}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">₹{product.basePrice}</p>
                    </div>
                    
                    <button className="bg-white dark:bg-transparent border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all shadow-sm active:scale-95">
                        ADD <span className="text-xs ml-1">+</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- 5. E-COMMERCE SECTION ROW ---
const ProductRow = ({ title, subtitle, filter }) => {
    const [products, setProducts] = useState([]);
    
    useEffect(() => {
        axios.get(`${API_URL}/api/products`).then(res => {
            const all = res.data.products || [];
            // Simple filtering for demo
            if (filter === 'trending') setProducts(all.filter(p => p.trending).slice(0, 4));
            else if (filter === 'prawn') setProducts(all.filter(p => p.category === 'Prawn').slice(0, 4));
            else setProducts(all.slice(0, 4));
        });
    }, [filter]);

    if (products.length === 0) return null;

    return (
        <section className="py-10 px-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
                </div>
                <Link to="/products" className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1">View All <ChevronRight size={16} /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
        </section>
    )
}

// --- 6. TRUST GRID (Visual) ---
const TrustGrid = () => {
    const features = [
        { icon: <Truck className="text-blue-500" />, title: "90 Min Delivery", desc: "Ice packed freshness" },
        { icon: <ShieldCheck className="text-green-500" />, title: "Chemical Free", desc: "Lab tested quality" },
        { icon: <MapPin className="text-red-500" />, title: "Local Catch", desc: "Sourced daily" },
        { icon: <Thermometer className="text-orange-500" />, title: "Temp Controlled", desc: "0-4°C Always" },
    ];
    return (
        <section className="py-12 bg-slate-100 dark:bg-[#0d1b2e]">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-xl flex flex-col items-center text-center shadow-sm border border-gray-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-3">
                                {f.icon}
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{f.title}</h3>
                            <p className="text-xs text-slate-500">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// --- MAIN PAGE ---
export default function Home() {
    return (
        <div className="bg-white dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 font-sans pb-20">
            {/* The Order of Sections matters for 'Real E-com' feel */}
            <HeroCarousel />
            <BankOffers />
            <QuickCategories />

            <div className="space-y-4 mt-8">
                <SectionReveal>
                    <ProductRow 
                        title="Today's Flash Deals" 
                        subtitle="Lowest prices of the day. Ends soon!" 
                        filter="trending" 
                    />
                </SectionReveal>

                {/* Banner Strip */}
                <div className="max-w-7xl mx-auto px-4 my-8">
                    <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 md:p-10 flex items-center justify-between text-white relative overflow-hidden shadow-xl">
                        <div className="relative z-10">
                            <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">NEW ARRIVAL</span>
                            <h3 className="text-2xl md:text-4xl font-serif italic font-black">KING FISH STEAKS</h3>
                            <p className="opacity-90 mt-2 text-sm md:text-base">Experience the royal taste. Perfectly cut for frying.</p>
                            <Link to="/products"><button className="mt-6 bg-white text-red-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">Order Now</button></Link>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/3065/3065535.png" className="absolute -right-10 -bottom-10 w-48 h-48 opacity-20 rotate-12" alt="Fish" />
                    </div>
                </div>

                <SectionReveal>
                    <ProductRow 
                        title="Shellfish Specials" 
                        subtitle="Prawns, Crabs & Lobsters" 
                        filter="prawn" 
                    />
                </SectionReveal>

                <TrustGrid />
                
                <SectionReveal>
                    <ProductRow 
                        title="Explore More" 
                        subtitle="Fresh catch from our boats" 
                        filter="all" 
                    />
                </SectionReveal>
            </div>
            
            {/* Simple Footer Note */}
            <div className="text-center py-10 opacity-50 text-xs">
                <p>&copy; 2025 SeaBite India. Freshness Guaranteed.</p>
            </div>
        </div>
    );
}