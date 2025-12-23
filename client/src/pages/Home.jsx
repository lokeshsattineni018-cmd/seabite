import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, useAnimationFrame, useVelocity, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  ArrowRight, Star, ShieldCheck, Truck, Clock, Fish, Sparkles, X, 
  Copy, Check, Gift, ChevronRight, ShoppingBag, Flame, Percent, 
  MapPin, Zap, Thermometer, User, Utensils, Anchor, ChevronDown 
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

// --- ANIMATION WRAPPER ---
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

// --- WELCOME POPUP (Kept Same) ---
const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [offer, setOffer] = useState({ code: "SEABITE20", value: 20, discountType: "percent" });

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenWelcomePopup");
    axios.get(`${API_URL}/api/coupons`)
      .then(res => {
        if (res.data && res.data.length > 0) {
            const activeCoupon = res.data.find(c => c.isActive) || res.data[0];
            setOffer(activeCoupon);
        }
      })
      .catch(err => console.log("No coupons found."));

    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 1500); 
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("hasSeenWelcomePopup", "true");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-white dark:bg-[#0a1625] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[500px]">
            <button onClick={handleClose} className="absolute top-4 right-4 z-30 p-2 bg-white/20 text-slate-900 dark:text-white hover:bg-red-500 hover:text-white rounded-full transition-all backdrop-blur-sm shadow-md"><X size={20} /></button>
            <div className="w-full md:w-1/2 h-64 md:h-full relative bg-gray-100">
                <img src="/20offer.png" alt="Offer" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden" />
                <div className="absolute bottom-4 left-4 md:top-6 md:left-6 z-10"><span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-slate-900 uppercase tracking-wider shadow-lg flex items-center gap-2"><Gift size={14} className="text-pink-500" /> Welcome Gift</span></div>
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-[#0a1625]">
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mb-4 leading-[1.1]">Enjoy <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{offer.discountType === 'flat' ? `₹${offer.value}` : `${offer.value}%`} OFF</span></h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg font-light leading-relaxed">Your first taste of the ocean should be special. Use this code at checkout.</p>
                  <div onClick={copyToClipboard} className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1 transition-all hover:border-blue-500 hover:shadow-lg">
                    <div className="relative flex items-center justify-between bg-white dark:bg-[#0f172a] rounded-xl p-4 z-10">
                        <div className="flex flex-col items-start"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Coupon Code</span><span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">{offer.code}</span></div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${copied ? "bg-emerald-500 text-white" : "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white group-hover:bg-blue-600 group-hover:text-white"}`}>{copied ? <Check size={24} /> : <Copy size={24} />}</div>
                    </div>
                    {copied && <motion.div layoutId="copied-bg" className="absolute inset-0 bg-emerald-500/10 z-0" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.5 }} />}
                  </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- HERO SECTION (Kept Same) ---
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
          <p className="text-blue-200 font-mono text-xs md:text-sm tracking-[0.5em] uppercase drop-shadow-md">The Ocean's Finest</p>
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

// --- BANK OFFERS TICKER (New) ---
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

// --- QUICK CATEGORIES (Story Style) (New) ---
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

// --- FLASH SALE BANNER ---
const FlashSale = () => {
    return (
        <section className="py-10 px-4">
            <div className="max-w-6xl mx-auto bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <div className="relative z-10 text-white text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/30">
                        <Flame size={14} className="text-yellow-300" /> Flash Deal
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2">TODAY'S CATCH</h2>
                    <p className="text-red-100 text-lg font-medium">Order before 11 AM for <span className="font-bold text-white underline decoration-yellow-400 decoration-2 underline-offset-4">Express Lunch Delivery</span>.</p>
                </div>

                <div className="relative z-10 bg-white p-6 rounded-xl shadow-lg transform rotate-2 md:rotate-0">
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ends In</p>
                        <div className="flex gap-2 text-slate-900 font-mono font-black text-3xl">
                            <span className="bg-slate-100 px-2 rounded">04</span>:
                            <span className="bg-slate-100 px-2 rounded">32</span>:
                            <span className="bg-slate-100 px-2 rounded text-red-600">18</span>
                        </div>
                    </div>
                    <Link to="/products" className="block mt-4 w-full bg-slate-900 text-white text-center py-3 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-slate-800 transition-colors">Grab The Deal</Link>
                </div>
            </div>
        </section>
    );
};

// --- PRODUCT CARD (Professional Design) (New) ---
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

// --- E-COMMERCE SECTION ROW (New) ---
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

// --- BUTCHERS CUT ---
const ButchersCut = () => {
    const cuts = [
        { name: "Whole Cleaned", desc: "Gutted & Scaled", icon: <Fish size={24} />, bg: "bg-blue-100 text-blue-700" },
        { name: "Curry Cut", desc: "Perfect Slices", icon: <Utensils size={24} />, bg: "bg-orange-100 text-orange-700" },
        { name: "Fillet", desc: "Boneless Meat", icon: <Sparkles size={24} />, bg: "bg-purple-100 text-purple-700" },
        { name: "Steaks", desc: "Thick & Juicy", icon: <Flame size={24} />, bg: "bg-red-100 text-red-700" },
    ];

    return (
        <section className="py-16 px-4 bg-slate-50 dark:bg-[#0b1120]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Shop by Cut</h2>
                    <p className="text-slate-500 mt-2 text-sm">We clean and cut exactly how you like it.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cuts.map((cut, i) => (
                        <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl text-center border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <div className={`w-14 h-14 mx-auto ${cut.bg} rounded-full flex items-center justify-center mb-4`}>
                                {cut.icon}
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{cut.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{cut.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// --- TRUST GRID (Visual) (New) ---
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

// --- OFFER BANNER ---
const OfferBanner = () => {
    const [copied, setCopied] = useState(false);
    const [offer, setOffer] = useState({ code: "SEABITE20", value: 20, discountType: "percent" });

    useEffect(() => {
        axios.get(`${API_URL}/api/coupons`).then(res => {
            if (res.data && res.data.length > 0) {
                const activeCoupon = res.data.find(c => c.isActive) || res.data[0];
                setOffer(activeCoupon);
            }
        }).catch(err => console.log("No coupons found."));
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(offer.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-20 px-6 transition-colors duration-300 relative">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row bg-[#0f172a] dark:bg-white rounded-3xl overflow-hidden shadow-2xl relative z-10 group">
                <div className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-30"><motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 3 }} className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12" /></div>
                <div className="w-full md:w-[60%] relative h-[300px] md:h-auto bg-gray-200">
                    <img src="/20offer.png" alt="20% Off" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>
                <div className="w-full md:w-[40%] bg-[#0f172a] dark:bg-blue-50 p-8 md:p-12 flex flex-col justify-center items-center text-center text-white dark:text-slate-900 relative">
                    <div className="bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={12} /> Official Coupon</div>
                    <h2 className="text-6xl font-serif mb-2">{offer.discountType === 'flat' ? `₹${offer.value}` : `${offer.value}%`}</h2>
                    <h3 className="text-xl font-medium tracking-widest uppercase mb-6 opacity-80">{offer.discountType === 'flat' ? 'Cash Discount' : 'Flat Discount'}</h3>
                    <div onClick={handleCopy} className="w-full border-2 border-dashed border-white/20 dark:border-slate-900/20 p-4 rounded-xl mb-6 relative group cursor-pointer hover:bg-white/10 dark:hover:bg-blue-100 transition-all active:scale-95" title="Click to copy code">
                        <p className="text-xs uppercase opacity-50 mb-1">Promo Code</p>
                        <p className="text-2xl font-mono font-bold tracking-wider text-emerald-400 dark:text-blue-600 flex items-center justify-center gap-2">{offer.code}{copied && <Check size={20} className="text-emerald-500" />}</p>
                    </div>
                    <Link to="/products"><button className="w-full py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:scale-105 transition-transform shadow-lg">Shop Now</button></Link>
                </div>
            </div>
        </section>
    )
}

// --- REVIEWS & FAQ ---
const SeaBitePromise = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/products/top-reviews`).then(res => {
        setReviews(res.data);
        setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const faqs = [
    { q: "Is the seafood fresh or frozen?", a: "100% Fresh. We do not sell frozen fish. It is packed in ice immediately after catching." },
    { q: "Do you clean and cut the fish?", a: "Yes! We clean, scale, and cut the fish exactly how you want it (slices, fillets, or whole)." },
    { q: "How long does delivery take?", a: "We deliver within 24 hours of the catch to ensure maximum freshness." }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10 pt-10">
        
        {/* FAQ SECTION */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-4">Frequently Asked</h2>
                <p className="text-slate-500 mb-6">Common questions about our process.</p>
                <div className="space-y-4">
                    {faqs.map((f, i) => (
                        <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                {f.q} <ChevronDown className={`transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {openFaq === i && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                        <p className="p-5 pt-0 text-slate-500 text-sm leading-relaxed">{f.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-center items-center text-center">
                <ShieldCheck size={48} className="mb-6 opacity-80" />
                <h3 className="text-2xl font-serif font-bold mb-2">100% Chemical Free</h3>
                <p className="opacity-80 text-sm leading-relaxed max-w-sm">We strictly test for formalin and ammonia. If you prove it's not fresh, we give your money back 2x.</p>
            </div>
        </div>

        {/* REVIEWS */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif text-slate-900 dark:text-white mb-4">Loved by Seafood Lovers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? <p className="text-center col-span-3 text-slate-400">Loading reviews...</p> : reviews.length > 0 ? reviews.map((r, i) => (
              <motion.div key={i} whileHover={{ y: -10 }} className="bg-white/80 dark:bg-[#0e1d30]/90 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 relative shadow-sm hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center gap-1 mb-6">{[...Array(5)].map((_, starI) => <Star key={starI} className={`w-4 h-4 ${starI < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />)}</div>
                <p className="text-slate-700 dark:text-slate-300 mb-8 italic leading-relaxed">"{r.comment}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm"><User size={16} /></div>
                  <div><h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.userName}</h4><span className="text-xs text-blue-500 uppercase tracking-wide font-bold">{r.productName}</span></div>
                </div>
              </motion.div>
          )) : <p className="text-center col-span-3 text-slate-400">No reviews yet.</p>}
        </div>
      </div>
    </section>
  );
};

// --- FOOTER ---
const Footer = () => {
  return (
    <footer className="relative bg-gray-50 dark:bg-[#081220] text-slate-900 dark:text-white py-24 border-t border-gray-200 dark:border-white/5 text-center overflow-hidden transition-colors duration-300 z-10">
      <div className="absolute inset-0 flex items-center whitespace-nowrap pointer-events-none overflow-hidden">
        <motion.div initial={{ x: 0 }} animate={{ x: "-50%" }} transition={{ duration: 20, ease: "linear", repeat: Infinity }} className="flex gap-20">
          <h2 className="text-[18vw] leading-none font-black text-gray-200/60 dark:text-[#0f1b2d] select-none uppercase tracking-tighter">SEABITE SEABITE SEABITE</h2>
          <h2 className="text-[18vw] leading-none font-black text-gray-200/60 dark:text-[#0f1b2d] select-none uppercase tracking-tighter">SEABITE SEABITE SEABITE</h2>
        </motion.div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px]">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="space-y-6">
          <p className="text-slate-600 dark:text-slate-400 font-light text-lg transition-colors duration-300 tracking-tight">Experience the true taste of the ocean.</p>
          <Link to="/products" className="inline-block"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-12 py-5 bg-[#0f172a] dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg transition-all shadow-xl hover:shadow-2xl">Start Your Order</motion.button></Link>
        </motion.div>
      </div>
    </footer>
  );
};

export default function Home() {
    return (
        <div className="bg-slate-50 dark:bg-[#0a1625] min-h-screen text-slate-900 dark:text-slate-200 selection:bg-blue-500 selection:text-white font-sans transition-colors duration-300">
            <WelcomePopup />
            <VideoHero />
            
            {/* Real E-Commerce Layout Below Video */}
            <div className="relative w-full z-10">
                <BankOffers />
                <QuickCategories />

                <div className="space-y-4 mt-8">
                    <SectionReveal><FlashSale /></SectionReveal>
                    
                    <SectionReveal>
                        <ProductRow 
                            title="Fresh From The Nets" 
                            subtitle="Caught daily, cleaned perfectly." 
                            filter="trending" 
                        />
                    </SectionReveal>

                    <SectionReveal><ButchersCut /></SectionReveal>
                    
                    <SectionReveal>
                        <ProductRow 
                            title="Shellfish Specials" 
                            subtitle="Jumbo Prawns, Crabs & more" 
                            filter="prawn" 
                        />
                    </SectionReveal>

                    <TrustGrid />
                    <SectionReveal><OfferBanner /></SectionReveal> 
                    <SectionReveal><SeaBitePromise /></SectionReveal>
                </div>
            </div>
            
            <Footer />
        </div>
    );
}