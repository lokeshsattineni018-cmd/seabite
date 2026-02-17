import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
    FiUser, FiPhone, FiCheckCircle, FiDollarSign, FiCreditCard, FiTruck
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import PopupModal from "../components/PopupModal";

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

    // Quick amounts for cash calculation could be added later
    const backendBase = import.meta.env.VITE_API_URL || "";

    // Fetch products
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

    // Cart Logic
    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((p) => p._id === product._id);
            if (existing) {
                return prev.map((p) => (p._id === product._id ? { ...p, qty: p.qty + 1 } : p));
            }
            return [...prev, { ...product, qty: 1 }];
        });
        // toast.success(`Added ${product.name}`); // Optional: reduced noise for POS users
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
        if (window.confirm("Clear current cart?")) setCart([]);
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.basePrice * item.qty), 0);

    // Submit Order
    const handlePlaceOrder = async () => {
        if (cart.length === 0) return toast.error("Cart is empty");
        if (!customer.phone || !customer.name) return toast.error("Customer Name & Phone required");

        if (customer.deliveryType === "Delivery") {
            if (!customer.houseNo || !customer.street) return toast.error("Delivery address missing");
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
            setModal({ show: true, message: err.response?.data?.message || "Order Failed", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

            {/* LEFT: Product Grid (Flexible Width) */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Point of Sale</h1>
                        <p className="text-xs text-slate-500 font-medium">New Manual Order</p>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search products (name, category)..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => <div key={i} className="bg-white h-48 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map(p => (
                                <div key={p._id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group flex flex-col">
                                    <div className="aspect-[4/3] bg-slate-50 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center">
                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain mix-blend-multiply" />
                                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <FiPlus className="text-white bg-blue-600 rounded-full p-1.5 w-8 h-8 shadow-lg transform scale-90 group-hover:scale-100 transition-transform" />
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <h3 className="font-bold text-slate-800 text-xs md:text-sm line-clamp-1">{p.name}</h3>
                                        <div className="flex justify-between items-end mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.unit}</span>
                                            <span className="font-mono font-bold text-slate-900">₹{p.basePrice}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart & Customer (Fixed Width) */}
            <div className="w-[400px] flex flex-col bg-white shadow-2xl z-20">
                {/* Cart Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-800">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><FiShoppingCart /></div>
                        <h2 className="font-bold">Current Cart</h2>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                            Clear
                        </button>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl m-4">
                            <FiShoppingCart size={24} className="mb-2" />
                            <p className="text-xs font-bold uppercase tracking-wider">Empty Cart</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex gap-3 items-center bg-white border border-slate-100 p-2.5 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center p-1 shrink-0">
                                    <img src={item.image} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                                        <span className="font-mono font-bold text-xs text-slate-900">₹{item.basePrice * item.qty}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-slate-400">₹{item.basePrice} / {item.unit}</span>
                                        <div className="flex items-center gap-2 bg-slate-100 rounded-md px-1 py-0.5">
                                            <button onClick={() => updateQty(item._id, -1)} className="hover:text-red-600 px-1"><FiMinus size={10} /></button>
                                            <span className="text-[10px] font-bold w-3 text-center">{item.qty}</span>
                                            <button onClick={() => updateQty(item._id, 1)} className="hover:text-emerald-600 px-1"><FiPlus size={10} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Customer & Checkout Section */}
                <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {/* Delivery Type Toggle */}
                    <div className="grid grid-cols-2 bg-white p-1 rounded-xl border border-slate-200">
                        <button onClick={() => setCustomer({ ...customer, deliveryType: "Walk-in" })} className={`text-xs font-bold py-2 rounded-lg transition-all ${customer.deliveryType === "Walk-in" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>Walk-in</button>
                        <button onClick={() => setCustomer({ ...customer, deliveryType: "Delivery" })} className={`text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${customer.deliveryType === "Delivery" ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}><FiTruck size={12} /> Delivery</button>
                    </div>

                    {/* Customer Inputs */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <FiPhone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input
                                    placeholder="Phone (10 digits)"
                                    value={customer.phone}
                                    maxLength={10}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCustomer({ ...customer, phone: val });
                                    }}
                                    className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-blue-400 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <FiUser className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-blue-400 outline-none" />
                            </div>
                        </div>

                        <AnimatePresence>
                            {customer.deliveryType === "Delivery" && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                                    <input placeholder="House No / Flat" value={customer.houseNo} onChange={e => setCustomer({ ...customer, houseNo: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
                                    <input placeholder="Street / Area" value={customer.street} onChange={e => setCustomer({ ...customer, street: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input placeholder="City" value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
                                        <input placeholder="Zip" value={customer.zip} onChange={e => setCustomer({ ...customer, zip: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Payment & Total */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</p>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors">
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                </select>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payable</p>
                                <p className="text-2xl font-bold text-slate-900 leading-none">₹{cartTotal.toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={processing}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><FiCheckCircle size={18} /> CONFIRM ORDER</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
