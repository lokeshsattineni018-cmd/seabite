import { useState, useEffect } from "react";
import { FiX, FiFilter, FiCheck, FiChevronDown, FiSliders } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function FilterSidebar({
    isOpen,
    onClose,
    filters,
    setFilters,
    clearFilters
}) {
    const [localPrice, setLocalPrice] = useState({ min: filters.minPrice, max: filters.maxPrice });

    useEffect(() => {
        setLocalPrice({ min: filters.minPrice, max: filters.maxPrice });
    }, [filters.minPrice, filters.maxPrice]);

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setLocalPrice(prev => ({ ...prev, [name]: value }));
    };

    const applyPrice = () => {
        setFilters(prev => ({ ...prev, minPrice: localPrice.min, maxPrice: localPrice.max }));
    };

    const FilterContent = () => (
        <div className="space-y-8">
            {/* Sort Order */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Sort By
                </h3>
                <div className="space-y-2">
                    {[
                        { label: "Newest Arrivals", value: "newest" },
                        { label: "Price: Low to High", value: "price-asc" },
                        { label: "Price: High to Low", value: "price-desc" },
                        { label: "Top Rated", value: "rating" },
                    ].map((option) => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${filters.sort === option.value
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                                }`}>
                                {filters.sort === option.value && <FiCheck size={12} className="text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="sort"
                                value={option.value}
                                checked={filters.sort === option.value}
                                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                                className="hidden"
                            />
                            <span className={`text-sm ${filters.sort === option.value
                                    ? "font-bold text-blue-600 dark:text-blue-400"
                                    : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                }`}>
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-700" />

            {/* Price Range */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Price Range
                </h3>
                <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                        <input
                            type="number"
                            name="min"
                            value={localPrice.min}
                            onChange={handlePriceChange}
                            onBlur={applyPrice}
                            placeholder="Min"
                            className="w-full pl-6 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                        <input
                            type="number"
                            name="max"
                            value={localPrice.max}
                            onChange={handlePriceChange}
                            onBlur={applyPrice}
                            placeholder="Max"
                            className="w-full pl-6 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
                <button
                    onClick={applyPrice}
                    className="w-full py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Apply Price
                </button>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-700" />

            {/* Availability */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                    Availability
                </h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${filters.inStock
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300 dark:border-slate-600 group-hover:border-emerald-400"
                        }`}>
                        {filters.inStock && <FiCheck size={14} className="text-white" />}
                    </div>
                    <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                        className="hidden"
                    />
                    <span className={`text-sm ${filters.inStock
                            ? "font-bold text-emerald-600 dark:text-emerald-400"
                            : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}>
                        In Stock Only
                    </span>
                </label>
            </div>

            <div className="pt-4">
                <button
                    onClick={clearFilters}
                    className="w-full py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                >
                    Reset All Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Sticky) */}
            <div className="hidden lg:block w-64 shrink-0 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 custom-scrollbar">
                <div className="flex items-center gap-2 mb-6">
                    <FiSliders className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
                </div>
                <FilterContent />
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-[70] lg:hidden flex flex-col"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FiFilter /> Filter & Sort
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5">
                                <FilterContent />
                            </div>

                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                                >
                                    View Results
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
