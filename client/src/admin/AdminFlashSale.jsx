import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiZap, FiClock, FiDollarSign, FiSave,
    FiX, FiCheckCircle, FiSearch, FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";

const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.05, duration: 0.4 }
    })
};

export default function AdminFlashSale() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [saleConfig, setSaleConfig] = useState({
        discountPrice: 0,
        saleEndDate: "",
        isFlashSale: false
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/products", { withCredentials: true });
            setProducts(Array.isArray(data.products) ? data.products : data);
        } catch (err) {
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEdit = (p) => {
        setEditingId(p._id);
        setSaleConfig({
            discountPrice: p.flashSale?.discountPrice || 0,
            saleEndDate: p.flashSale?.saleEndDate ? new Date(p.flashSale.saleEndDate).toISOString().slice(0, 16) : "",
            isFlashSale: p.flashSale?.isFlashSale || false
        });
    };

    const handleSave = async (id) => {
        try {
            await axios.put(`/api/admin/products/${id}/flash-sale`, saleConfig, { withCredentials: true });
            toast.success("Flash Sale configured!");
            setEditingId(null);
            fetchProducts();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const deactivateAll = async () => {
        if (!window.confirm("End ALL flash sales immediately?")) return;
        try {
            const flashProducts = products.filter(p => p.flashSale?.isFlashSale);
            await Promise.all(flashProducts.map(p =>
                axios.put(`/api/admin/products/${p._id}/flash-sale`, { isFlashSale: false }, { withCredentials: true })
            ));
            toast.success("All sales deactivated");
            fetchProducts();
        } catch (err) {
            toast.error("Mass deactivate failed");
        }
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 lg:p-10 font-sans min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-900 flex items-center justify-center shadow-lg shadow-yellow-200">
                            <FiZap size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Flash Sale Manager</h1>
                            <p className="text-xs text-slate-500 font-medium">Configure deep discounts and countdown timers</p>
                        </div>
                    </div>
                </motion.div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-white bg-white shadow-sm outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={deactivateAll}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                    >
                        <FiX size={14} /> Kill All Deals
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-white/60 rounded-3xl animate-pulse" />
                    ))
                ) : filtered.map((p, i) => (
                    <motion.div
                        key={p._id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className={`group bg-white rounded-3xl border transition-all overflow-hidden ${p.flashSale?.isFlashSale ? "border-yellow-200 ring-4 ring-yellow-400/5 shadow-xl shadow-yellow-100/50" : "border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"
                            }`}
                    >
                        {/* Header */}
                        <div className="relative h-40 bg-slate-50 flex items-center justify-center p-6">
                            <img
                                src={p.image?.startsWith('http') ? p.image : `/uploads/${p.image?.split(/[/\\]/).pop()}`}
                                alt={p.name}
                                className="h-full object-contain drop-shadow-md"
                            />
                            {p.flashSale?.isFlashSale && (
                                <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-400 text-slate-900 text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 shadow-md">
                                    <FiZap size={10} /> Active Deal
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 truncate">{p.name}</h3>

                            {editingId === p._id ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sale Price (INR)</label>
                                        <div className="relative">
                                            <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                            <input
                                                type="number"
                                                value={saleConfig.discountPrice}
                                                onChange={(e) => setSaleConfig({ ...saleConfig, discountPrice: Number(e.target.value) })}
                                                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold focus:border-yellow-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ends At</label>
                                        <div className="relative">
                                            <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                            <input
                                                type="datetime-local"
                                                value={saleConfig.saleEndDate}
                                                onChange={(e) => setSaleConfig({ ...saleConfig, saleEndDate: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold focus:border-yellow-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 py-2">
                                        <input
                                            type="checkbox"
                                            id={`active-${p._id}`}
                                            checked={saleConfig.isFlashSale}
                                            onChange={(e) => setSaleConfig({ ...saleConfig, isFlashSale: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                                        />
                                        <label htmlFor={`active-${p._id}`} className="text-xs font-bold text-slate-700">Enable Flash Deal</label>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(p._id)}
                                            className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FiSave size={12} /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Base Price</p>
                                            <p className="text-xs font-bold text-slate-400 line-through">₹{p.basePrice?.toLocaleString()}</p>
                                        </div>
                                        {p.flashSale?.isFlashSale && (
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-1">Sale Price</p>
                                                <p className="text-base font-black text-slate-900">₹{p.flashSale.discountPrice?.toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    {p.flashSale?.isFlashSale && (
                                        <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-center gap-3">
                                            <FiClock className="text-yellow-600" size={14} />
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black text-yellow-600 uppercase tracking-widest">Sale Ends</p>
                                                <p className="text-[10px] font-bold text-slate-700 truncate">
                                                    {new Date(p.flashSale.saleEndDate).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="w-full py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiRefreshCw size={12} /> Configure Deal
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
