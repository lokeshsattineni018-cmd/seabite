import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingBag, FiCalendar, FiCreditCard, FiChevronRight, FiAlertCircle, FiPackage, FiTruck, FiClock } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount);
};

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isDarkMode } = useContext(ThemeContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                // Optional: Redirect to login here
                return;
            }

            try {
                const res = await axios.get(`${API_URL}/api/orders/myorders`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setError("Unable to load order history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col items-center justify-center transition-colors duration-500">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6" />
                <p className="text-slate-500 font-medium tracking-widest text-sm uppercase">Loading History...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 p-4 md:p-12 font-sans transition-colors duration-500 pt-24 md:pt-32 relative overflow-x-hidden">
            
            {/* AMBIENT BACKGROUND */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/40 to-transparent dark:from-blue-900/10 pointer-events-none -z-10" />

            <div className="max-w-5xl mx-auto relative z-10">
                
                {/* HEADER - Adjusted for mobile stacking */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4"
                >
                    <div>
                        <span className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 md:mb-2 block">
                            Account Activity
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                            Past <span className="text-blue-600">Orders</span>
                        </h1>
                    </div>
                    {orders.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 px-4 py-1.5 md:px-5 md:py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] md:text-sm font-bold shadow-sm">
                            {orders.length} Records Found
                        </div>
                    )}
                </motion.div>
                
                {error ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-8 text-center bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl text-red-600 dark:text-red-400 font-medium flex flex-col items-center justify-center gap-2"
                    >
                        <FiAlertCircle size={32} /> 
                        {error}
                    </motion.div>
                ) : orders.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 p-10 md:p-16 rounded-[2rem] border border-slate-100 dark:border-white/5 text-center shadow-xl shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiShoppingBag className="text-blue-400 dark:text-slate-400" size={28} md:size={32} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">No Order History</h3>
                        <p className="text-xs md:text-sm text-slate-500 mb-8 max-w-md mx-auto px-4">It looks like you haven't made any purchases yet.</p>
                        <button 
                            onClick={() => navigate('/products')}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 md:px-8 md:py-3 rounded-full font-bold text-xs md:text-sm hover:bg-blue-600 dark:hover:bg-blue-100 transition-colors shadow-lg"
                        >
                            Start Shopping
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                            {orders.map((order, index) => (
                                <motion.div 
                                    key={order._id} 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-white/5 group cursor-pointer"
                                    onClick={() => navigate(`/orders/${order.orderId || order._id}`)}
                                >
                                    <div className="flex flex-col md:flex-row gap-4 md:gap-12 items-start md:items-center">
                                        
                                        {/* Icon Box - Hidden on very small mobile for space */}
                                        <div className="hidden md:flex shrink-0 w-16 h-16 bg-blue-50 dark:bg-slate-700/50 rounded-2xl items-center justify-center text-blue-600 dark:text-blue-400">
                                            {order.status === 'Delivered' ? <FiPackage size={24} /> : <FiTruck size={24} />}
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1 space-y-1 w-full">
                                            <div className="flex items-center justify-between md:justify-start gap-3">
                                                <h3 className="font-mono font-bold text-base md:text-lg text-slate-900 dark:text-white">
                                                    #{order.orderId || order._id.slice(-6).toUpperCase()}
                                                </h3>
                                                <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 md:px-3 md:py-1 rounded-full border ${
                                                    order.status === 'Delivered' 
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30' 
                                                    : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/30'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] md:text-sm text-slate-500 flex items-center gap-2">
                                                <FiCalendar size={12} className="md:size-[14px]" /> {formatDate(order.createdAt)}
                                            </p>
                                        </div>

                                        {/* Total */}
                                        <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end min-w-0 md:min-w-[120px] w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-slate-700/50">
                                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider md:mb-1">Total Amount</p>
                                            <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white font-sans">
                                                {formatCurrency(order.totalAmount)}
                                            </p>
                                        </div>

                                        {/* Action Arrow (Desktop) */}
                                        <div className="hidden md:flex w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                                            <FiChevronRight size={18} />
                                        </div>
                                    </div>

                                    {/* Mobile Only View Details Link */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 md:hidden flex justify-between items-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                                        View Order Details <FiChevronRight />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}