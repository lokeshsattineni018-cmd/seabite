import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiActivity, FiCpu, FiGlobe, FiRadio, FiTerminal,
    FiUser, FiShoppingCart, FiSearch, FiLock
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AdminWatchtower() {
    const [logs, setLogs] = useState([]);
    const [activeCount, setActiveCount] = useState(0);
    const [isLive, setIsLive] = useState(true);
    const scrollRef = useRef(null);

    // Polling Effect
    useEffect(() => {
        if (!isLive) return;

        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/admin/watchtower/live`, { withCredentials: true });
                // Only update if data changed to prevent jitter? 
                // Actually, simple replace is fine for this "terminal" feel
                setLogs(data.logs);
                setActiveCount(data.activeCount);
            } catch (err) {
                console.error("Watchtower signal lost");
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2500); // 2.5s poll
        return () => clearInterval(interval);
    }, [isLive]);

    // Auto-scroll logic could go here, but latest is usually at top/bottom. 
    // Let's keep latest at TOP for easier reading.

    const getIcon = (action) => {
        switch (action) {
            case "LOGIN": return <FiLock className="text-emerald-400" />;
            case "CART_UPDATE": return <FiShoppingCart className="text-amber-400" />;
            case "SEARCH": return <FiSearch className="text-cyan-400" />;
            case "WISHLIST_ADD": return <FiActivity className="text-pink-400" />;
            default: return <FiTerminal className="text-gray-400" />;
        }
    };

    const formatTime = (iso) => {
        return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-6 lg:p-10 selection:bg-green-900 selection:text-white overflow-hidden">

            {/* Header / HUD */}
            <div className="flex justify-between items-end mb-8 border-b border-green-900/50 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-widest flex items-center gap-3 uppercase">
                        <FiRadio className={`animate-pulse ${isLive ? "text-red-500" : "text-gray-500"}`} />
                        The Watchtower
                    </h1>
                    <p className="text-xs text-green-700 mt-2 uppercase tracking-[0.2em]">Live Operations Command // Class-1 Clearance</p>
                </div>

                <div className="flex gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-green-800 uppercase">System Status</span>
                        <div className="flex items-center gap-2 text-green-400">
                            <FiCpu /> ONLINE
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-green-800 uppercase">Active Sessions</span>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-lg">
                            <FiGlobe /> {activeCount}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Terminal Grid */}
            <div className="grid lg:grid-cols-4 gap-6 h-[75vh]">

                {/* LIVE FEED */}
                <div className="lg:col-span-3 bg-gray-900/30 border border-green-800 rounded-lg p-4 overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50"></div>

                    <div className="flex justify-between items-center mb-4 text-xs uppercase tracking-widest text-green-700">
                        <span>Incoming Stream</span>
                        <button onClick={() => setIsLive(!isLive)} className="hover:text-white transition-colors">
                            [{isLive ? "PAUSE" : "RESUME"}]
                        </button>
                    </div>

                    <div className="overflow-y-auto pr-2 space-y-1 flex-1 custom-scrollbar">
                        <AnimatePresence initial={false}>
                            {logs.map((log) => (
                                <motion.div
                                    key={log._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-start gap-4 p-3 border-l-2 border-green-900 hover:border-green-400 hover:bg-green-900/10 transition-colors group text-sm"
                                >
                                    <span className="text-green-700 shrink-0 font-bold">[{formatTime(log.timestamp)}]</span>
                                    <span className="shrink-0 mt-0.5">{getIcon(log.action)}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-green-300">{log.action}</span>
                                            {log.user ? (
                                                <span className="text-xs text-green-600 border border-green-800 px-1 rounded">USER: {log.user.name}</span>
                                            ) : (
                                                <span className="text-xs text-gray-600 border border-gray-800 px-1 rounded">GUEST</span>
                                            )}
                                        </div>
                                        <p className="text-green-400/80 mt-1">{log.details}</p>
                                        {/* Meta Data Expansion */}
                                        {log.meta && Object.keys(log.meta).length > 0 && (
                                            <div className="text-[10px] text-gray-500 mt-1 font-mono">
                                                {JSON.stringify(log.meta)}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {logs.length === 0 && (
                            <div className="text-center text-green-900 mt-20 animate-pulse">
                                AWAITING DATA STREAM...
                            </div>
                        )}
                    </div>
                </div>

                {/* SIDEBAR INTEL */}
                <div className="space-y-6">
                    {/* Active Radar (Mock Visual) */}
                    <div className="bg-gray-900/30 border border-green-800 rounded-lg p-4 h-1/2 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent animate-pulse"></div>
                        <div className="w-32 h-32 border border-green-800 rounded-full flex items-center justify-center relative">
                            <div className="w-24 h-24 border border-green-900 rounded-full"></div>
                            <div className="w-1 h-16 bg-gradient-to-b from-green-500 to-transparent absolute top-1/2 left-1/2 origin-top animate-[spin_3s_linear_infinite]"></div>
                            {/* Dots for active users */}
                            {Array.from({ length: Math.min(activeCount, 5) }).map((_, i) => (
                                <div key={i} className="absolute w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" style={{
                                    top: `${50 + Math.random() * 40 - 20}%`,
                                    left: `${50 + Math.random() * 40 - 20}%`,
                                    animationDelay: `${i * 0.5}s`
                                }}></div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs uppercase text-green-600 tracking-widest">Sector Scan Active</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gray-900/30 border border-green-800 rounded-lg p-4 h-auto">
                        <h3 className="text-xs uppercase text-green-700 tracking-widest mb-4">Traffic Sources</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span>Direct</span>
                                <span className="text-green-400">65%</span>
                            </div>
                            <div className="w-full bg-green-900/30 h-1 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[65%]"></div>
                            </div>

                            <div className="flex justify-between text-xs">
                                <span>Search</span>
                                <span className="text-green-400">25%</span>
                            </div>
                            <div className="w-full bg-green-900/30 h-1 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[25%]"></div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}
