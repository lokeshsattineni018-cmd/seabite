import { useState, useContext, useEffect, useRef, forwardRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { FiSearch, FiCheck, FiShoppingBag, FiPackage, FiChevronDown } from "react-icons/fi";
import { CartContext } from "../context/CartContext";
import { addToCart } from "../utils/cartStorage";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

const CATEGORY_DATA = {
    "All": { title: "Fresh Catch", desc: "Sustainable seafood, straight from the source.", gradient: "from-blue-500/20 via-cyan-400/10 to-transparent", accent: "text-blue-600" },
    "Fish": { title: "Premium Fish", desc: "Freshwater and marine cuts, cleaned and ready.", gradient: "from-cyan-500/20 via-blue-400/10 to-transparent", accent: "text-cyan-600" },
    "Prawn": { title: "Jumbo Prawns", desc: "Juicy, deshelled, and perfect for grilling.", gradient: "from-orange-500/20 via-amber-400/10 to-transparent", accent: "text-orange-600" },
    "Crab": { title: "Live Crabs", desc: "Mud crabs and soft-shell delicacies.", gradient: "from-red-500/20 via-rose-400/10 to-transparent", accent: "text-red-600" }
};

// --- 1. 3D TILT CARD ---
const TiltCard = forwardRef(({ children, onClick }, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const internalRef = useRef(null);
    const rotateX = useTransform(y, [-100, 100], [7, -7]); 
    const rotateY = useTransform(x, [-100, 100], [-7, 7]); 

    const handleMouseMove = (e) => {
        if (!internalRef.current) return;
        const rect = internalRef.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width * 200 - 100);
        y.set((e.clientY - rect.top) / rect.height * 200 - 100);
    };

    return (
        <motion.div
            ref={(node) => { internalRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            onClick={onClick}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -8 }}
            className="relative group cursor-pointer"
        >
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-500 group-hover:shadow-blue-500/20 group-hover:border-blue-500/40">
                {children}
            </div>
        </motion.div>
    );
});

// --- 2. ADD BUTTON ---
const AddButton = ({ product, onAdd }) => {
    const [status, setStatus] = useState("idle");
    const handleClick = async (e) => {
        e.stopPropagation();
        setStatus("loading");
        setTimeout(() => {
            onAdd(e, product);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 1500);
        }, 600);
    };

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            disabled={status !== "idle"}
            className={`relative h-10 md:h-11 flex items-center justify-center rounded-full transition-all duration-300 font-bold uppercase tracking-tighter text-[10px] md:text-[11px] shadow-lg
                ${status === "success" ? "w-10 md:w-11 bg-emerald-500 text-white" : "w-28 md:w-32 bg-slate-900 dark:bg-blue-600 text-white hover:shadow-blue-500/40 hover:-translate-y-0.5"}
            `}
        >
            <AnimatePresence mode="wait">
                {status === "idle" && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 md:gap-2">
                        Add <span className="hidden xs:inline">to Cart</span> <FiShoppingBag />
                    </motion.div>
                )}
                {status === "loading" && (
                    <motion.div key="loading" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {status === "success" && (
                    <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center">
                        <FiCheck size={18} md:size={20} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export default function Products() {
    const { refreshCartCount } = useContext(CartContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [displayed, setDisplayed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("Newest");

    const categories = ["All", "Fish", "Crab", "Prawn"];
    const currentTheme = CATEGORY_DATA[activeCat] || CATEGORY_DATA["All"];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products`);
                setProducts(res.data.products || res.data || []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        let cat = params.get("category") || "All";
        cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase().replace(/s$/, "");
        setActiveCat(categories.includes(cat) ? cat : "All");
        setSearchTerm(params.get("search") || "");
    }, [location.search]);

    useEffect(() => {
        let result = products.filter(p => {
            const matchesCat = activeCat === "All" || p.category?.toLowerCase() === activeCat.toLowerCase();
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCat && matchesSearch;
        });

        if (sortBy === "Price: Low to High") {
            result.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sortBy === "Price: High to Low") {
            result.sort((a, b) => b.basePrice - a.basePrice);
        } else if (sortBy === "Popularity") {
            result.sort((a, b) => (b.trending === a.trending) ? 0 : b.trending ? -1 : 1);
        } else if (sortBy === "Newest") {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setDisplayed(result);
    }, [activeCat, searchTerm, products, sortBy]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0b1221] pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-12 transition-colors duration-500 overflow-x-hidden">
            
            <div className={`fixed top-0 left-0 w-full h-full bg-gradient-to-br ${currentTheme.gradient} opacity-40 pointer-events-none -z-10`} />

            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 md:mb-16 gap-6 md:gap-8">
                    <div className="max-w-xl">
                        <motion.span 
                            key={`label-${activeCat}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] ${currentTheme.accent} mb-2 md:mb-4 block`}
                        >
                            Selection / {activeCat}
                        </motion.span>
                        <motion.h1 
                            key={`title-${activeCat}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-7xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
                        >
                            {currentTheme.title.split(" ")[0]} <br className="hidden md:block"/>
                            <span className={`italic font-light opacity-80 ${currentTheme.accent}`}>{currentTheme.title.split(" ").slice(1).join(" ")}</span>
                        </motion.h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto">
                        <div className="relative group w-full sm:min-w-[180px]">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none w-full pl-4 md:pl-5 pr-10 py-3 md:py-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl md:rounded-2xl outline-none font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300 cursor-pointer transition-all border border-transparent"
                            >
                                <option value="Newest">Newest Arrival</option>
                                <option value="Price: Low to High">Price: Low to High</option>
                                <option value="Price: High to Low">Price: High to Low</option>
                                <option value="Popularity">Popularity</option>
                            </select>
                            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="relative w-full lg:w-80">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Find your favorite..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-3 md:py-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl md:rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white text-sm font-medium transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-8 md:mb-12 overflow-x-auto pb-4 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => navigate(cat === "All" ? "/products" : `/products?category=${cat}`)}
                            className={`px-6 md:px-8 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                                activeCat === cat 
                                ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xl" 
                                : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-white/5"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="h-80 md:h-96 rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            ))
                        ) : (
                            displayed.map((p, idx) => (
                                <TiltCard key={p._id} onClick={() => navigate(`/products/${p._id}`)}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="h-full flex flex-col"
                                    >
                                        {/* ✅ FIXED: Smaller, Contained Image (No Cropping) */}
                                        <div className="relative h-48 md:h-56 w-full bg-slate-50 dark:bg-slate-900/40 flex items-center justify-center overflow-hidden p-4 rounded-t-[2rem]">
                                            {p.trending && (
                                                <span className="absolute top-4 left-4 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg z-10 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" /> Hot
                                                </span>
                                            )}
                                            
                                            {/* ✅ FIXED: object-contain keeps the whole fish visible */}
                                            <motion.img 
                                                whileHover={{ scale: 1.1 }}
                                                transition={{ duration: 0.5 }}
                                                src={`${API_URL}${p.image}`} 
                                                className="w-full h-full object-contain drop-shadow-xl" 
                                            />
                                        </div>

                                        {/* Text Content */}
                                        <div className="p-5 md:p-6 flex-grow flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 mb-1 block">{p.category}</span>
                                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                            </div>
                                            
                                            <div className="mt-5 flex items-end justify-between gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">₹{Number(p.basePrice)}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per {p.unit || 'kg'}</span>
                                                </div>
                                                <AddButton product={p} onAdd={(e) => {
                                                    addToCart({ ...p, qty: 1, price: Number(p.basePrice) });
                                                    refreshCartCount();
                                                }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                </TiltCard>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {!loading && displayed.length === 0 && (
                    <div className="text-center py-20 md:py-40">
                        <FiPackage size={40} md:size={48} className="mx-auto text-slate-300 mb-4" />
                        <h2 className="text-xl md:text-2xl font-bold dark:text-white">No seafood found</h2>
                        <p className="text-sm text-slate-500">Try changing your filters or search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
}