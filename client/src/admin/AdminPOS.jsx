import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
  FiUser, FiPhone, FiCheckCircle, FiDollarSign, FiCreditCard, FiX
} from "react-icons/fi";
import { toast } from "react-hot-toast";

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
        toast.error("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    const delay = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delay);
  }, [search, backendBase]);

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
    toast.success("Item removed");
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.basePrice || 0) * item.qty, 0);

  const handleCheckout = async () => {
    if (!customer.name || !customer.phone) {
      return toast.error("Enter customer details");
    }
    if (cart.length === 0) return toast.error("Cart is empty");

    setProcessing(true);
    try {
      const orderData = {
        items: cart.map((item) => ({ productId: item._id, qty: item.qty })),
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalAmount: cartTotal,
        paymentMethod: "POS",
      };

      await axios.post(`${backendBase}/api/orders`, orderData, { withCredentials: true });
      toast.success("Order created successfully!");
      setCart([]);
      setCustomer({ phone: "", name: "", email: "" });
    } catch (err) {
      toast.error("Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" className="p-5 md:p-8 lg:p-10 min-h-screen">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.1 }} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
            <FiShoppingCart size={24} />
          </motion.div>
          Point of Sale
        </h1>
        <p className="text-slate-400 text-sm mt-2 ml-16">Create orders directly at checkout</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <motion.div variants={fadeUp} custom={1} className="lg:col-span-2">
          <div className="relative mb-6">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 pl-10 pr-4 py-3 rounded-xl text-slate-300 outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <motion.div key={i} animate={{ opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="bg-slate-800/30 rounded-xl h-40" />
              ))
            ) : (
              products.map((product) => (
                <motion.div
                  key={product._id}
                  whileHover={{ y: -4 }}
                  onClick={() => addToCart(product)}
                  className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-4 cursor-pointer hover:border-orange-500/30 transition-all group"
                >
                  <div className="w-full h-32 bg-slate-700/20 rounded-lg mb-3 flex items-center justify-center text-slate-600">
                    <FiPackage size={28} />
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-orange-400 transition-colors">{product.name}</h3>
                  <p className="text-orange-400 font-bold mt-2">₹{product.basePrice}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Cart Section */}
        <motion.div variants={fadeUp} custom={2} className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-6 h-fit sticky top-8 backdrop-blur-sm">
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <FiShoppingCart className="text-orange-400" size={20} />
            Order Summary
          </h3>

          {/* Customer Info */}
          <div className="space-y-3 mb-6 pb-6 border-b border-slate-700/50">
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">Customer Name</label>
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700/50 p-2 rounded-lg text-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500/40 mt-1"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-bold uppercase">Phone</label>
              <input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700/50 p-2 rounded-lg text-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500/40 mt-1"
                placeholder="Enter phone"
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
            {cart.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-700/20 p-3 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-bold text-sm">{item.name}</p>
                    <p className="text-orange-400 text-xs">₹{item.basePrice}</p>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="text-slate-500 hover:text-red-400 p-1">
                    <FiX size={14} />
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => updateQty(item._id, -1)} className="p-1 hover:bg-slate-600/30 rounded text-slate-400">
                    <FiMinus size={12} />
                  </button>
                  <span className="text-white font-bold text-sm flex-1 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item._id, 1)} className="p-1 hover:bg-slate-600/30 rounded text-slate-400">
                    <FiPlus size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="mb-4 pb-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-sm">Subtotal</span>
              <span className="text-white font-bold">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Total</span>
              <span className="text-2xl font-bold text-orange-400">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? "Processing..." : <>
              <FiCheckCircle size={16} /> Complete Order
            </>}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}