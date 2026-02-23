import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
    FiUser, FiPhone, FiCheckCircle, FiTruck, FiClock, FiMaximize2, FiLayers
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import PopupModal from "../components/common/PopupModal";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

// ── Shared motion helpers ──────────
const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
    hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: "blur(0px)",
        transition: { delay: i * 0.05, duration: 0.5, ease },
    }),
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
    const filteredProducts = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

    const backendBase = import.meta.env.VITE_API_URL || "";

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
            } finally {
                setLoading(false);
            }
        };
        const delay = setTimeout(fetchProducts, 300);
        return () => clearTimeout(delay);
    }, [search, backendBase]);

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
        if (window.confirm("Clear cart?")) setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.basePrice * item.qty), 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return toast.error("Cart is empty");
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

            setModal({ show: true, message: `Order Placed! ₹${cartTotal}`, type: "success" });
            setCart([]);
            setCustomer({ phone: "", name: "", email: "", deliveryType: "Walk-in", houseNo: "", street: "", city: "Vizag", zip: "530001" });
        } catch (err) {
            setModal({ show: true, message: err.response?.data?.message || "Failed", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" className="flex h-screen bg-stone-50 font-sans text-stone-900">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; }
                .pos-grid::-webkit-scrollbar { width: 4px; }
                .pos-grid::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 10px; }
            `}</style>

            <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

            {/* LEFT: Product Grid */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-stone-200/50">
                {/* Header */}
                <div className="p-8 border-b border-stone-200/50 bg-white/80 backdrop-blur-md flex items-center justify-between gap-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-100 text-stone-900 rounded-2xl flex items-center justify-center border border-stone-200/50 shadow-sm">
                            <FiLayers size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Point of Sale</h1>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                                <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active Session
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><FiClock size={10} /> {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative flex-1 group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={16} />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-11 pr-5 py-3.5 bg-stone-100/50 border border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-stone-200 transition-all outline-none"
                            />
                        </div>
                        <button className="p-3 text-stone-400 hover:text-stone-900 bg-stone-100/50 hover:bg-stone-100 rounded-2xl transition-all border border-transparent hover:border-stone-200">
                            <FiMaximize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="px-8 py-5 bg-white border-b border-stone-100 flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-900/10' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-white hover:text-stone-900 hover:border-stone-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50 pos-grid">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center">
                            <SeaBiteLoader />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(p => (
                                <motion.div
                                    key={p._id}
                                    variants={fadeUp}
                                    onClick={() => addToCart(p)}
                                    className="bg-white p-5 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:border-stone-300 cursor-pointer transition-all group flex flex-col h-full active:scale-95"
                                >
                                    <div className="aspect-[4/3] bg-stone-50/50 rounded-2xl mb-5 relative overflow-hidden flex items-center justify-center border border-stone-100 group-hover:bg-white transition-colors">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <div className="bg-white p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <FiPlus size={20} className="text-stone-900" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto space-y-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">{p.category}</p>
                                            <h3 className="font-bold text-stone-900 text-sm leading-tight line-clamp-2">{p.name}</h3>
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-stone-50">
                                            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-md">{p.unit}</span>
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
            <div className="w-[450px] flex flex-col bg-white shadow-2xl z-30 border-l border-stone-200/50">
                {/* Cart Header */}
                <div className="p-8 border-b border-stone-200/50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-stone-900/20">
                            <FiShoppingCart size={18} />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-stone-900 text-xl tracking-tight">Active Cart</h2>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{cart.length} items selected</p>
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs font-bold text-stone-400 hover:text-rose-600 px-3 py-1.5 rounded-xl transition-all hover:bg-rose-50 border border-transparent hover:border-rose-100 uppercase tracking-widest text-[9px]">
                            Clear All
                        </button>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 pos-grid">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-stone-300">
                            <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center mb-4 border border-stone-100 shadow-inner">
                                <FiShoppingCart size={32} />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item, i) => (
                            <motion.div key={item._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 items-center bg-white border border-stone-200/50 p-4 rounded-3xl hover:border-stone-400 transition-all shadow-sm">
                                <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                                    <img src={item.image} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{item.name}</h4>
                                        <span className="font-extrabold text-sm text-stone-900 ml-2">₹{item.basePrice * item.qty}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-stone-400">₹{item.basePrice}/{item.unit}</span>
                                        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200/50 rounded-xl px-2 py-1.5">
                                            <button onClick={() => updateQty(item._id, -1)} className="text-stone-400 hover:text-stone-900 p-1 transition-colors"><FiMinus size={12} /></button>
                                            <span className="text-xs font-bold w-4 text-center text-stone-900">{item.qty}</span>
                                            <button onClick={() => updateQty(item._id, 1)} className="text-stone-400 hover:text-stone-900 p-1 transition-colors"><FiPlus size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Checkout Section */}
                <div className="border-t border-stone-200/50 bg-stone-50/30 p-8 space-y-6 shadow-2xl relative z-10">
                    {/* Delivery Type Toggle */}
                    <div className="grid grid-cols-2 bg-stone-100/80 p-1.5 rounded-2xl gap-1.5 border border-stone-200/50">
                        <button
                            onClick={() => setCustomer({ ...customer, deliveryType: "Walk-in" })}
                            className={`text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all ${customer.deliveryType === "Walk-in" ? "bg-white text-stone-900 shadow-md border border-stone-200/50" : "text-stone-500 hover:text-stone-700"}`}
                        >
                            Walk-in
                        </button>
                        <button
                            onClick={() => setCustomer({ ...customer, deliveryType: "Delivery" })}
                            className={`text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${customer.deliveryType === "Delivery" ? "bg-white text-stone-900 shadow-md border border-stone-200/50" : "text-stone-500 hover:text-stone-700"}`}
                        >
                            <FiTruck size={14} /> Delivery
                        </button>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={14} />
                                <input
                                    placeholder="Phone"
                                    value={customer.phone}
                                    maxLength={10}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCustomer({ ...customer, phone: val });
                                    }}
                                    className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-stone-200/50 rounded-2xl bg-white focus:border-stone-400 transition-all outline-none"
                                />
                            </div>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" size={14} />
                                <input
                                    placeholder="Name"
                                    value={customer.name}
                                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 text-xs font-bold border border-stone-200/50 rounded-2xl bg-white focus:border-stone-400 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {customer.deliveryType === "Delivery" && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="H.No" value={customer.houseNo} onChange={e => setCustomer({ ...customer, houseNo: e.target.value })} className="w-full px-4 py-3 text-xs font-bold border border-stone-200/50 rounded-2xl bg-white focus:border-stone-400 outline-none" />
                                        <input placeholder="Street" value={customer.street} onChange={e => setCustomer({ ...customer, street: e.target.value })} className="w-full px-4 py-3 text-xs font-bold border border-stone-200/50 rounded-2xl bg-white focus:border-stone-400 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="City" value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} className="w-full px-4 py-3 text-xs font-bold border border-stone-200/50 rounded-2xl bg-white focus:border-stone-400 outline-none" />
                                        <input placeholder="Zip" value={customer.zip} onChange={e => setCustomer({ ...customer, zip: e.target.value })} className="w-full px-4 py-3 text-xs font-bold border border-stone-200/50 rounded-2xl bg-white focus:border-stone-400 outline-none" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Summary & Payment */}
                    <div className="flex justify-between items-end pt-4">
                        <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Payment Method</p>
                            <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
                                {["Cash", "UPI", "Card"].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setPaymentMethod(m)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${paymentMethod === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Payable</p>
                            <p className="text-4xl font-extrabold text-stone-900 tracking-tighter">₹{cartTotal.toLocaleString()}</p>
                        </div>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={processing}
                        className="w-full py-5 bg-stone-900 hover:bg-stone-800 text-white rounded-[24px] font-bold text-sm shadow-xl shadow-stone-900/20 hover:shadow-stone-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden relative"
                    >
                        {processing ? (
                            <SeaBiteLoader small />
                        ) : (
                            <>
                                <FiCheckCircle size={18} />
                                <span>Complete Transaction</span>
                            </>
                        )}
                        <motion.div initial={{ x: "-100%" }} whileHover={{ x: "100%" }} transition={{ duration: 0.6 }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
