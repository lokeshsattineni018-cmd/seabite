import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
    FiUser, FiPhone, FiCheckCircle, FiClock, FiMaximize2, FiChevronRight, FiBox
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

// ── Shared motion helpers ──────────
const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { delay: i * 0.05, duration: 0.6, ease },
    }),
};
const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
};

export default function AdminPOS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [customer, setCustomer] = useState({
        phone: "", name: "", email: "",
        deliveryType: "Walk-in",
        houseNo: "", street: "", city: "Vizag", zip: "530001"
    });
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [modal, setModal] = useState({ show: false, message: "", type: "info" });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeCategory, setActiveCategory] = useState("All");

    const backendBase = import.meta.env.VITE_API_URL || "";

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${backendBase}/api/admin/products`, {
                    params: search ? { search } : {},
                    withCredentials: true,
                });
                setProducts(res.data.products || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        const delay = setTimeout(fetchProducts, 300);
        return () => clearTimeout(delay);
    }, [search, backendBase]);

    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    const filteredProducts = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((p) => p._id === product._id);
            if (existing) {
                return prev.map((p) => (p._id === product._id ? { ...p, qty: p.qty + 1 } : p));
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id, change) => {
        setCart((prev) => prev.map((item) => {
            if (item._id === id) {
                const newQty = Math.max(0, item.qty + change);
                return newQty === 0 ? null : { ...item, qty: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const clearCart = () => {
        if (window.confirm("Clear current selection?")) setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.basePrice * item.qty), 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return toast.error("Selection is empty");
        if (!customer.phone || !customer.name) return toast.error("Name & phone required");

        if (customer.deliveryType === "Delivery") {
            if (!customer.houseNo || !customer.street) return toast.error("Address required");
        }

        setProcessing(true);
        try {
            const payload = {
                customer: { ...customer },
                items: cart.map(i => ({
                    productId: i._id,
                    name: i.name,
                    price: i.basePrice,
                    buyingPrice: i.buyingPrice,
                    qty: i.qty,
                    image: i.image
                })),
                totalAmount: cartTotal,
                paymentMethod,
                deliveryType: customer.deliveryType,
                address: customer.deliveryType === "Delivery" ? {
                    houseNo: customer.houseNo,
                    street: customer.street,
                    city: customer.city,
                    zip: customer.zip
                } : null,
                source: "POS"
            };

            await axios.post(`${backendBase}/api/admin/orders/manual`, payload, { withCredentials: true });

            setModal({ show: true, message: `Transaction Complete: ₹${cartTotal}`, type: "success" });
            setCart([]);
            setCustomer({ phone: "", name: "", email: "", deliveryType: "Walk-in", houseNo: "", street: "", city: "Vizag", zip: "530001" });
        } catch (err) {
            setModal({ show: true, message: err.response?.data?.message || "Internal System Error", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans text-stone-900 overflow-hidden">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .pos-grid::-webkit-scrollbar { width: 4px; }
        .pos-grid::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 10px; }
      `}</style>

            <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

            {/* LEFT: Product Grid */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-stone-200/50 relative z-10">
                {/* Minimalist Header */}
                <div className="px-10 py-8 border-b border-stone-200/50 bg-white/60 backdrop-blur-xl flex items-center justify-between gap-12 sticky top-0 z-20">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-light text-stone-900 tracking-tight leading-none uppercase flex items-center gap-3">
                            Sea<span className="font-extrabold">Bite</span>
                        </h1>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
                            Retail System
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative flex-1 group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={16} />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search catalog ID or name..."
                                className="w-full pl-11 pr-5 py-3.5 bg-stone-100/40 border border-stone-200/30 rounded-2xl text-sm font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 focus:ring-4 focus:ring-stone-200/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="hidden xl:flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-white border border-stone-200/50 px-4 py-2.5 rounded-xl shadow-sm">
                        <FiClock size={12} className="text-stone-400" /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="px-10 py-4 bg-white/40 border-b border-stone-200/30 flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat
                                ? 'bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-900/10'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-10 pos-grid">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <SeaBiteLoader />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((p, i) => (
                                <motion.div
                                    key={p._id}
                                    variants={fadeUp}
                                    custom={i}
                                    onClick={() => addToCart(p)}
                                    className="bg-white p-5 rounded-[2.5rem] border border-stone-200/50 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 hover:border-stone-300 cursor-pointer transition-all group flex flex-col h-full active:scale-95"
                                >
                                    <div className="aspect-[4/3] bg-stone-50 rounded-[1.8rem] mb-5 relative overflow-hidden flex items-center justify-center border border-stone-100 group-hover:bg-white transition-colors">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 ease-[0.16,1,0.3,1]" />
                                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <div className="bg-stone-900 p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                <FiPlus size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto space-y-3 px-1">
                                        <div>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">{p.category}</p>
                                            <h3 className="font-bold text-stone-900 text-[13px] leading-tight line-clamp-2">{p.name}</h3>
                                        </div>
                                        <div className="flex justify-between items-end pt-3 border-t border-stone-100/50">
                                            <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest bg-stone-50 px-2 py-0.5 rounded-md">{p.unit}</span>
                                            <span className="font-extrabold text-stone-900 text-lg tracking-tight">₹{p.basePrice}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart */}
            <div className="w-[480px] flex flex-col bg-white shadow-2xl z-20 border-l border-stone-200/50 relative">
                {/* Cart Header */}
                <div className="p-10 border-b border-stone-200/50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-stone-900 text-white rounded-[22px] flex items-center justify-center shadow-lg shadow-stone-900/20">
                            <FiShoppingCart size={22} />
                        </div>
                        <div>
                            <h2 className="font-bold text-stone-900 text-2xl tracking-tight">Checkout</h2>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-[10px] font-bold text-stone-400 hover:text-rose-600 px-4 py-2 rounded-xl transition-all hover:bg-rose-50 border border-transparent hover:border-rose-100 uppercase tracking-widest"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 pos-grid bg-stone-50/20">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-stone-300">
                            <div className="w-24 h-24 bg-stone-50 rounded-[40px] flex items-center justify-center mb-6 border border-stone-100 shadow-inner">
                                <FiBox size={40} className="opacity-20 translate-y-1" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item, i) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, ease }}
                                className="flex gap-4 items-center bg-white border border-stone-200/40 p-5 rounded-[2rem] hover:border-stone-300 transition-all shadow-sm hover:shadow-md cursor-default group"
                            >
                                <div className="w-16 h-16 rounded-[1.2rem] bg-stone-50 border border-stone-100 flex items-center justify-center p-2 shrink-0 overflow-hidden group-hover:bg-white transition-colors">
                                    <img src={item.image} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{item.name}</h4>
                                        <span className="font-extrabold text-sm text-stone-900 ml-2">₹{item.basePrice * item.qty}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">₹{item.basePrice} / {item.unit}</span>
                                        <div className="flex items-center gap-4 bg-stone-100/50 border border-stone-200/40 rounded-xl px-2 py-1.5">
                                            <button onClick={() => updateQty(item._id, -1)} className="text-stone-400 hover:text-stone-900 p-1 transition-colors"><FiMinus size={12} /></button>
                                            <span className="text-xs font-extrabold w-4 text-center text-stone-900">{item.qty}</span>
                                            <button onClick={() => updateQty(item._id, 1)} className="text-stone-400 hover:text-stone-900 p-1 transition-colors"><FiPlus size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* System Control / Checkout Footer */}
                <div className="border-t border-stone-200/50 bg-white p-10 space-y-8 shadow-[0_-20px_50px_rgba(28,25,23,0.05)] relative z-10">

                    {/* Customer Information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={14} />
                                <input
                                    placeholder="Phone"
                                    value={customer.phone}
                                    maxLength={10}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCustomer({ ...customer, phone: val });
                                    }}
                                    className="w-full pl-12 pr-5 py-4 text-xs font-bold border border-stone-200/50 rounded-2xl bg-stone-50/50 focus:bg-white focus:border-stone-400 transition-all outline-none"
                                />
                            </div>
                            <div className="relative group">
                                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={14} />
                                <input
                                    placeholder="Customer Name"
                                    value={customer.name}
                                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                    className="w-full pl-12 pr-5 py-4 text-xs font-bold border border-stone-200/50 rounded-2xl bg-stone-50/50 focus:bg-white focus:border-stone-400 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Order Type Toggle */}
                        <div className="flex bg-stone-100/50 p-1.5 rounded-2xl gap-2 border border-stone-200/40">
                            {["Walk-in", "Delivery"].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setCustomer({ ...customer, deliveryType: type })}
                                    className={`flex-1 text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all ${customer.deliveryType === type
                                        ? "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                                        : "text-stone-400 hover:text-stone-600"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {customer.deliveryType === "Delivery" && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="H.No / Flat" value={customer.houseNo} onChange={e => setCustomer({ ...customer, houseNo: e.target.value })} className="w-full px-5 py-4 text-xs font-bold border border-stone-200/50 rounded-2xl bg-stone-50/50 focus:bg-white focus:border-stone-400 outline-none" />
                                        <input placeholder="Street / Area" value={customer.street} onChange={e => setCustomer({ ...customer, street: e.target.value })} className="w-full px-5 py-4 text-xs font-bold border border-stone-200/50 rounded-2xl bg-stone-50/50 focus:bg-white focus:border-stone-400 outline-none" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Payment & Total Block */}
                    <div className="bg-stone-50 rounded-[2.5rem] p-8 border border-stone-200/50">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-3">Payment Method</h4>
                                <div className="flex bg-white/60 p-1.5 rounded-2xl gap-1.5 border border-stone-200/30">
                                    {["Cash", "UPI", "Card"].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${paymentMethod === m
                                                ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10'
                                                : 'text-stone-400 hover:text-stone-700 hover:bg-white/80'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-2">Grand Total</p>
                                <p className="text-4xl font-extrabold text-stone-900 tracking-tighter">₹{cartTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={processing}
                            className="w-full py-5 bg-stone-900 hover:bg-stone-800 text-white rounded-[2rem] font-bold text-[13px] uppercase tracking-widest shadow-2xl shadow-stone-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            {processing ? (
                                <SeaBiteLoader small />
                            ) : (
                                <>
                                    <FiCheckCircle size={18} className="translate-y-[-1px]" />
                                    <span>Complete Transaction</span>
                                    <FiChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-center text-[9px] font-bold text-stone-300 uppercase tracking-[0.5em] pb-2">
                        SeaBite Premium Retail Solutions
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
