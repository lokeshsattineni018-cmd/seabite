import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
    FiUser, FiPhone, FiCheckCircle, FiDollarSign, FiCreditCard
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
    const [customer, setCustomer] = useState({ phone: "", name: "", email: "" });
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [modal, setModal] = useState({ show: false, message: "", type: "info" });
    const backendBase = import.meta.env.VITE_API_URL || "";

    // Fetch products for the grid
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

    // Cart Functions
    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item._id === product._id);
            if (existing) {
                return prev.map((item) =>
                    item._id === product._id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
        toast.success(`Added ${product.name}`);
    };

    const updateQty = (id, change) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item._id === id) {
                    const newQty = Math.max(1, item.qty + change);
                    return { ...item, qty: newQty };
                }
                return item;
            })
        );
    };

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((item) => item._id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.basePrice * item.qty, 0);

    // Customer Lookup
    const handlePhoneBlur = async () => {
        if (customer.phone.length < 10) return;
        try {
            // Assuming we have a search endpoint or we filter users
            // Ideally backend should have specific endpoint
            // For now, let's just proceed. 
            // In a real implementation: const res = await axios.get(...) 
        } catch (err) { }
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return toast.error("Cart is empty");
        if (!customer.phone || !customer.name) return toast.error("Customer details required");

        setProcessing(true);
        try {
            const orderData = {
                customer,
                items: cart.map(item => ({
                    productId: item._id,
                    name: item.name,
                    price: item.basePrice,
                    buyingPrice: item.buyingPrice || 0,
                    qty: item.qty,
                    image: item.image
                })),
                totalAmount: cartTotal,
                paymentMethod: "Cash (POS)",
                source: "POS"
            };

            await axios.post(`${backendBase}/api/admin/orders/manual`, orderData, { withCredentials: true });

            setModal({ show: true, message: "Order Placed Successfully! 🧾", type: "success" });
            setCart([]);
            setCustomer({ phone: "", name: "", email: "" });
        } catch (err) {
            setModal({ show: true, message: err.response?.data?.message || "Order Failed", type: "error" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
            <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                <motion.div variants={fadeUp} custom={0} className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Point of Sale</h1>
                        <p className="text-sm text-slate-500">Create manual orders</p>
                    </div>
                    <div className="relative w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                    </div>
                </motion.div>

                <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20 pr-2 custom-scrollbar">
                    {products.map((p) => (
                        <div
                            key={p._id}
                            onClick={() => addToCart(p)}
                            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
                        >
                            <div className="aspect-square bg-slate-50 rounded-xl mb-3 p-2 relative overflow-hidden">
                                <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <FiPlus className="text-white drop-shadow-md bg-blue-500 rounded-full p-1 w-8 h-8" />
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm truncate">{p.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-slate-500 font-bold uppercase">{p.unit}</span>
                                <span className="font-mono font-bold text-slate-900">₹{p.basePrice}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Right: Cart & Checkout */}
            <motion.div variants={fadeUp} custom={2} className="w-full md:w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full z-10">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FiShoppingCart /> Current Cart
                    </h2>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FiShoppingCart size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">Cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item._id} className="flex gap-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                <img src={item.image} className="w-12 h-12 rounded-lg bg-slate-50 object-contain" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-500">₹{item.basePrice} x {item.qty}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-mono font-bold text-sm">₹{item.basePrice * item.qty}</span>
                                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                                        <button onClick={() => updateQty(item._id, -1)} className="p-1 hover:text-red-500"><FiMinus size={12} /></button>
                                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item._id, 1)} className="p-1 hover:text-emerald-500"><FiPlus size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Customer Form */}
                <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            placeholder="Customer Phone"
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            onBlur={handlePhoneBlur}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            placeholder="Customer Name"
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                    </div>
                </div>

                {/* Totals & Action */}
                <div className="p-5 border-t border-slate-200 bg-white space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 text-sm">Total Amount</span>
                        <span className="text-2xl font-bold text-slate-900">₹{cartTotal.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={processing}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {processing ? "Processing..." : <><FiCreditCard /> Collect Cash & Order</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
