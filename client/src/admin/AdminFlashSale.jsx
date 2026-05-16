// AdminFlashSale.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiZap, FiClock, FiDollarSign, FiSave,
    FiX, FiSearch, FiRefreshCw, FiPercent
} from "react-icons/fi";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

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
// hf
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
    const [massConfig, setMassConfig] = useState({
        category: "",
        discountPercent: 10,
        saleEndDate: ""
    });
    const [isMassLoading, setIsMassLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/products", { withCredentials: true });
            setProducts(Array.isArray(data.products) ? data.products : data);
        } catch {
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
            toast.success("Deal updated!");
            setEditingId(null);
            fetchProducts();
        } catch {
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
            toast.success("All sales ended");
            fetchProducts();
        } catch {
            toast.error("Mass end failed");
        }
    };

    const handleMassApply = async () => {
        if (!massConfig.category || !massConfig.saleEndDate || massConfig.discountPercent <= 0) {
            return toast.error("Please fill all fields for mass apply");
        }

        const targetProducts = massConfig.category === "All"
            ? products
            : products.filter(p => p.category?.toLowerCase() === massConfig.category.toLowerCase());

        if (targetProducts.length === 0) return toast.error("No products found in this category");

        if (!window.confirm(`Apply ${massConfig.discountPercent}% discount to ${targetProducts.length} products?`)) return;

        setIsMassLoading(true);
        try {
            await Promise.all(targetProducts.map(p => {
                const discountPrice = Math.round(p.basePrice * (1 - massConfig.discountPercent / 100));
                return axios.put(`/api/admin/products/${p._id}/flash-sale`, {
                    discountPrice,
                    saleEndDate: massConfig.saleEndDate,
                    isFlashSale: true
                }, { withCredentials: true });
            }));
            toast.success(`Successfully applied to ${targetProducts.length} products`);
            fetchProducts();
            setMassConfig({ category: "", discountPercent: 10, saleEndDate: "" });
        } catch (err) {
            toast.error("Mass apply failed");
        } finally {
            setIsMassLoading(false);
        }
    };

    const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm border border-amber-200/50">
                            <FiZap size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-1">Flash Sales</h1>
                            <p className="text-sm text-stone-500">Manage time-limited deals</p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search inventory..."
                                className="w-full pl-11 pr-5 py-3 rounded-2xl bg-stone-50 border border-stone-200/50 text-stone-800 font-medium placeholder:text-stone-400 focus:bg-white focus:border-stone-300 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={deactivateAll}
                            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg shrink-0"
                        >
                            End All
                        </button>
                    </div>
                </motion.div>

                {/* Mass Apply Feature */}
                <motion.div variants={fadeUp} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200/60 mb-8 flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</label>
                        <select
                            value={massConfig.category}
                            onChange={e => setMassConfig({ ...massConfig, category: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm font-bold text-stone-800 outline-none focus:bg-white focus:border-amber-400 transition-all"
                        >
                            <option value="">Select Category...</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Discount %</label>
                        <div className="relative">
                            <FiPercent className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                            <input
                                type="number"
                                min="1" max="99"
                                value={massConfig.discountPercent}
                                onChange={e => setMassConfig({ ...massConfig, discountPercent: Number(e.target.value) })}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-stone-800 outline-none focus:bg-white focus:border-amber-400 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ends At</label>
                        <input
                            type="datetime-local"
                            value={massConfig.saleEndDate}
                            onChange={e => setMassConfig({ ...massConfig, saleEndDate: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm font-bold text-stone-800 outline-none focus:bg-white focus:border-amber-400 transition-all"
                        />
                    </div>
                    <button
                        onClick={handleMassApply}
                        disabled={isMassLoading}
                        className="w-full md:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-lg flex items-center justify-center h-[46px] disabled:opacity-50"
                    >
                        {isMassLoading ? <FiRefreshCw className="animate-spin" /> : "Apply to Category"}
                    </button>
                </motion.div>

                {/* Grid */}
                <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {loading ? (
                            <div className="col-span-full py-20 flex justify-center">
                                <SeaBiteLoader />
                            </div>
                        ) : filtered.map((p) => (
                            <motion.div
                                key={p._id}
                                variants={fadeUp}
                                layout
                                className={`group bg-white rounded-3xl border overflow-hidden transition-all ${p.flashSale?.isFlashSale ? "border-amber-200 ring-4 ring-amber-50 shadow-lg shadow-amber-100/50" : "border-stone-200/60 shadow-sm hover:shadow-md hover:border-stone-300"}`}
                            >
                                <div className="h-48 bg-stone-50/50 p-6 relative flex items-center justify-center">
                                    <img
                                        src={p.image?.startsWith('http') ? p.image : `/uploads/${p.image?.split(/[/\\]/).pop()}`}
                                        alt={p.name}
                                        className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {p.flashSale?.isFlashSale && (
                                        <div className="absolute top-4 right-4 bg-amber-400 text-stone-900 text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                            <FiZap size={12} fill="currentColor" /> Live
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <h3 className="font-bold text-stone-900 truncate mb-4">{p.name}</h3>

                                    {editingId === p._id ? (
                                        <div className="space-y-4 animate-fadeIn">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sale Price</label>
                                                <div className="relative">
                                                    <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
                                                    <input
                                                        type="number"
                                                        value={saleConfig.discountPrice}
                                                        onChange={(e) => setSaleConfig({ ...saleConfig, discountPrice: Number(e.target.value) })}
                                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-8 pr-3 text-sm font-bold text-stone-800 outline-none focus:bg-white focus:border-amber-400 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ends At</label>
                                                <div className="relative">
                                                    <input
                                                        type="datetime-local"
                                                        value={saleConfig.saleEndDate}
                                                        onChange={(e) => setSaleConfig({ ...saleConfig, saleEndDate: e.target.value })}
                                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 px-3 text-xs font-bold text-stone-800 outline-none focus:bg-white focus:border-amber-400 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    id={`check-${p._id}`}
                                                    checked={saleConfig.isFlashSale}
                                                    onChange={(e) => setSaleConfig({ ...saleConfig, isFlashSale: e.target.checked })}
                                                    className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                                                />
                                                <label htmlFor={`check-${p._id}`} className="text-xs font-bold text-stone-600 cursor-pointer">Activate Deal</label>
                                            </div>

                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-xl bg-stone-100 text-stone-500 font-bold text-[10px] uppercase hover:bg-stone-200 transition-colors">Cancel</button>
                                                <button onClick={() => handleSave(p._id)} className="flex-[2] py-2 rounded-xl bg-stone-900 text-white font-bold text-[10px] uppercase hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center gap-1">
                                                    <FiSave size={12} /> Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end border-b border-stone-100 pb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Base</p>
                                                    <p className="text-sm font-medium text-stone-500 line-through">₹{p.basePrice?.toLocaleString()}</p>
                                                </div>
                                                {p.flashSale?.isFlashSale && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Deal</p>
                                                        <p className="text-lg font-bold text-stone-900">₹{p.flashSale.discountPrice?.toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {p.flashSale?.isFlashSale && (
                                                <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-3 border border-amber-100">
                                                    <FiClock className="text-amber-600 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[8px] font-bold text-amber-700 uppercase tracking-wider">Ends at</p>
                                                        <p className="text-[10px] font-semibold text-stone-700 truncate">{new Date(p.flashSale.saleEndDate).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="w-full py-3 rounded-xl border border-stone-200 text-stone-500 font-bold text-[10px] uppercase tracking-wider hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FiRefreshCw size={12} /> Configure
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

            </div>
        </motion.div>
    );
}
