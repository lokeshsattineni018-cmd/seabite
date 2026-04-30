import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiTruck, FiUser, FiMapPin, FiCheckCircle, FiClock, FiAlertCircle, FiPhone, FiMap } from "react-icons/fi";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

export default function FleetManagement() {
    const [riders, setRiders] = useState([]);
    const [unassignedOrders, setUnassignedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("Board"); // Board or Map

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ridersRes, ordersRes] = await Promise.all([
                axios.get("/api/delivery/partners", { withCredentials: true }),
                axios.get("/api/orders/unassigned", { withCredentials: true })
            ]);
            setRiders(ridersRes.data);
            setUnassignedOrders(ordersRes.data);
        } catch (err) {
            toast.error("Failed to sync fleet data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (orderId, partnerId) => {
        const t = toast.loading("Assigning rider...");
        try {
            await axios.post("/api/delivery/assign", { orderId, partnerId }, { withCredentials: true });
            toast.success("Rider dispatched!", { id: t });
            fetchData();
        } catch (err) {
            toast.error("Assignment failed", { id: t });
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 p-6 md:p-10 font-sans">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end border-b border-stone-200 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">Fleet Management</h1>
                        <p className="text-sm text-stone-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {riders.filter(r => r.status === 'Active').length} Riders Active • {unassignedOrders.length} Pending Shipments
                        </p>
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl border border-stone-200 shadow-sm">
                        <button 
                            onClick={() => setView("Board")}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${view === 'Board' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            Board
                        </button>
                        <button 
                            onClick={() => setView("Map")}
                            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${view === 'Map' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            Live Map
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="h-96 flex items-center justify-center">
                        <SeaBiteLoader />
                    </div>
                ) : view === "Board" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* 1. Unassigned Orders */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Ready for Dispatch ({unassignedOrders.length})</h3>
                            <div className="space-y-4">
                                {unassignedOrders.map(order => (
                                    <motion.div 
                                        key={order._id}
                                        layoutId={order._id}
                                        className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all space-y-4"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-stone-900">Order #{order.orderId}</h4>
                                                <p className="text-[10px] text-stone-400 font-mono uppercase tracking-widest">{order.shippingAddress?.city}</p>
                                            </div>
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100">Pending</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-xs text-stone-600">
                                            <FiMapPin size={14} className="text-stone-300" />
                                            <p className="truncate">{order.shippingAddress?.street}</p>
                                        </div>

                                        <select 
                                            onChange={(e) => handleAssign(order._id, e.target.value)}
                                            className="w-full py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 outline-none hover:bg-stone-100 transition-colors cursor-pointer"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Assign to Rider...</option>
                                            {riders.filter(r => r.status === 'Active').map(r => (
                                                <option key={r._id} value={r._id}>{r.name} ({r.activeOrders.length} active)</option>
                                            ))}
                                        </select>
                                    </motion.div>
                                ))}
                                {unassignedOrders.length === 0 && (
                                    <div className="py-12 text-center text-stone-400 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                                        <FiCheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-medium">No pending dispatches</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Active Riders */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Rider Network</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {riders.map(rider => (
                                    <div key={rider._id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400">
                                                    <FiUser size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-stone-900">{rider.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'Active' ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{rider.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <a href={`tel:${rider.phone}`} className="p-3 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors">
                                                <FiPhone size={16} />
                                            </a>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Deliveries ({rider.activeOrders?.length || 0})</p>
                                            <div className="space-y-2">
                                                {rider.activeOrders?.map(orderId => (
                                                    <div key={orderId} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-xs">
                                                        <span className="font-bold text-stone-800">Order #{orderId.substring(0,6)}</span>
                                                        <span className="text-stone-400 flex items-center gap-1"><FiClock size={12} /> 15m out</span>
                                                    </div>
                                                ))}
                                                {(!rider.activeOrders || rider.activeOrders.length === 0) && (
                                                    <p className="text-[10px] text-stone-400 italic">No active orders</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="h-[600px] bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <FiMap size={48} className="text-stone-200 mb-4" />
                        <p className="text-sm font-medium text-stone-500">Live Map requires Google Maps API Key</p>
                        <div className="absolute inset-0 opacity-10 pointer-events-none grayscale">
                             <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
