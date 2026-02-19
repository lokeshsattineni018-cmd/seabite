import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiActivity, FiCpu, FiGlobe, FiRadio, FiTerminal,
    FiUser, FiShoppingCart, FiSearch, FiLock, FiClock, FiZap, FiMapPin
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

// --- DESIGN SYSTEM CONSTANTS ---
const T = {
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    surfaceWarm: "#F7F5F0",
    surfaceMid: "#F0EDE6",
    border: "rgba(120,113,108,0.12)",
    borderSoft: "rgba(120,113,108,0.07)",
    teal: "#0D9488", tealL: "#F0FDFA",
    sky: "#0284C7", skyL: "#F0F9FF",
    purple: "#7C3AED", purpleL: "#F5F3FF",
    warning: "#D97706", warningL: "#FFFBEB",
    text: "#1C1917",
    textMid: "#57534E",
    textSoft: "#A8A29E",
    textGhost: "#D6D3D1",
    shadowSm: "0 1px 2px rgba(28,25,23,0.04), 0 1px 1px rgba(28,25,23,0.03)",
    shadowMd: "0 4px 12px rgba(28,25,23,0.05), 0 1px 3px rgba(28,25,23,0.04)",
};

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.055, duration: 0.45, ease } }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.055 } } };

const GS = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; }
    .sb { font-family:'Geist',system-ui,-apple-system,sans-serif; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.textGhost}; border-radius:4px; }
    ::-webkit-scrollbar-thumb:hover { background:${T.textSoft}; }
  `}</style>
);

function Card({ children, style = {}, hover = true }) {
    const [on, setOn] = useState(false);
    return (
        <div
            onMouseEnter={() => hover && setOn(true)}
            onMouseLeave={() => hover && setOn(false)}
            style={{
                background: T.surface,
                border: `1px solid ${on ? "rgba(120,113,108,0.17)" : T.border}`,
                borderRadius: 22,
                boxShadow: on ? T.shadowMd : T.shadowSm,
                transition: "all 0.28s cubic-bezier(0.22,1,0.36,1)",
                transform: on ? "translateY(-1px)" : "translateY(0)",
                overflow: "hidden",
                ...style,
            }}
        >{children}</div>
    );
}

export default function AdminWatchtower() {
    const { socket, isConnected, activeUsers } = useSocket();
    const [logs, setLogs] = useState([]);

    // Initial Fetch
    useEffect(() => {
        const fetchInitialLogs = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/admin/watchtower/live`, { withCredentials: true });
                setLogs(data.logs);
            } catch (err) {
                // console.error("Initial log fetch failed", err);
            }
        };
        fetchInitialLogs();
    }, []);

    // Real-time Listener
    useEffect(() => {
        if (!socket) return;

        const handleLog = (newLog) => {
            setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50
        };

        socket.on('WATCHTOWER_LOG', handleLog);

        return () => {
            socket.off('WATCHTOWER_LOG', handleLog);
        };
    }, [socket]);

    const getActionStyle = (action) => {
        switch (action) {
            case "LOGIN": return { icon: <FiLock />, color: T.teal, bg: T.tealL, label: "Login" };
            case "CART_UPDATE": return { icon: <FiShoppingCart />, color: T.warning, bg: T.warningL, label: "Cart" };
            case "SEARCH": return { icon: <FiSearch />, color: T.sky, bg: T.skyL, label: "Search" };
            case "WISHLIST_ADD": return { icon: <FiActivity />, color: T.purple, bg: T.purpleL, label: "Wishlist" };
            default: return { icon: <FiZap />, color: T.textMid, bg: T.surfaceMid, label: "System" };
        }
    };

    const formatTime = (iso) => {
        return new Date(iso).toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
    };

    return (
        <>
            <GS />
            <motion.div className="sb" initial="hidden" animate="visible" variants={stagger}
                style={{ minHeight: "100vh", background: T.bg, padding: "28px", maxWidth: 1400, margin: "0 auto", color: T.text }}
            >
                {/* ── HEADER ─────────────────────────────────── */}
                <motion.div variants={fadeUp} style={{ marginBottom: 28, borderBottom: `1px solid ${T.borderSoft}`, paddingBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <FiRadio size={14} style={{ color: isConnected ? T.teal : T.textGhost }} className={isConnected ? "animate-pulse" : ""} />
                            <span style={{ fontSize: 10, fontWeight: 500, color: isConnected ? T.teal : T.textGhost, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                {isConnected ? "Live Connection Established" : "Connecting to Matrix..."}
                            </span>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: "-0.02em", marginBottom: 6 }}>Live Operations</h1>
                        <p style={{ fontSize: 13, color: T.textSoft, fontWeight: 400 }}>Real-time visibility into user activity and system health.</p>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <Card style={{ padding: "12px 20px", borderRadius: 16 }}>
                            <div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Active Users</div>
                            <div style={{ fontSize: 24, fontWeight: 600, color: T.teal, display: "flex", alignItems: "center", gap: 8 }}>
                                <FiGlobe size={20} className="opacity-50" />
                                {activeUsers}
                            </div>
                        </Card>
                    </div>
                </motion.div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

                    {/* ── LIVE FEED TABLE ────────────────────────────── */}
                    <motion.div variants={fadeUp} custom={1}>
                        <Card hover={false} style={{ minHeight: "60vh" }}>
                            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Recent Activity</h3>
                                <div style={{ fontSize: 11, color: T.textGhost, fontFamily: "Geist Mono, monospace" }}>LATENCY: 24ms</div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <tbody style={{ fontSize: 13 }}>
                                        <AnimatePresence initial={false}>
                                            {logs.map((log) => {
                                                const style = getActionStyle(log.action);
                                                return (
                                                    <motion.tr
                                                        key={log._id}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0 }}
                                                        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                                                    >
                                                        <td style={{ padding: "16px 24px", width: "1%", whiteSpace: "nowrap", color: T.textSoft, fontFamily: "Geist Mono, monospace", fontSize: 11 }}>
                                                            {formatTime(log.timestamp)}
                                                        </td>
                                                        <td style={{ padding: "16px 12px", width: "1%" }}>
                                                            <div style={{
                                                                width: 32, height: 32, borderRadius: 10,
                                                                background: style.bg, color: style.color,
                                                                display: "flex", alignItems: "center", justifyContent: "center"
                                                            }}>
                                                                {style.icon}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "16px 12px" }}>
                                                            <div style={{ fontWeight: 500, color: T.text, marginBottom: 2 }}>{log.details}</div>
                                                            <div style={{ fontSize: 11, color: T.textSoft, display: "flex", gap: 6 }}>
                                                                <span style={{ fontWeight: 600, color: style.color }}>{log.action}</span>
                                                                {log.meta && Object.keys(log.meta).length > 0 && (
                                                                    <><span>•</span> <span>{JSON.stringify(log.meta)}</span></>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                                            {log.user ? (
                                                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surfaceWarm, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}` }}>
                                                                    <FiUser size={10} style={{ color: T.textSoft }} />
                                                                    <span style={{ fontSize: 11, fontWeight: 500, color: T.text }}>{log.user.name}</span>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px" }}>
                                                                    <span style={{ fontSize: 11, fontWeight: 500, color: T.textGhost }}>Guest</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                        {logs.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: 40, textAlign: "center", color: T.textSoft, fontStyle: "italic" }}>
                                                    Waiting for stream data...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>

                    {/* ── SIDEBAR STATS ────────────────────────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <motion.div variants={fadeUp} custom={2}>
                            <Card hover={false} style={{ padding: 24 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    <FiMapPin size={14} style={{ color: T.teal }} />
                                    Traffic Composition
                                </h3>
                                <div style={{ spaceY: 12 }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, fontWeight: 500 }}>
                                            <span style={{ color: T.textMid }}>Mobile</span>
                                            <span style={{ color: T.text }}>65%</span>
                                        </div>
                                        <div style={{ width: "100%", height: 4, background: T.surfaceWarm, borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ width: "65%", height: "100%", background: T.teal, borderRadius: 2 }} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, fontWeight: 500 }}>
                                            <span style={{ color: T.textMid }}>Desktop</span>
                                            <span style={{ color: T.text }}>35%</span>
                                        </div>
                                        <div style={{ width: "100%", height: 4, background: T.surfaceWarm, borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ width: "35%", height: "100%", background: T.sky, borderRadius: 2 }} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        <motion.div variants={fadeUp} custom={3}>
                            <Card hover={false} style={{
                                padding: 24,
                                background: `linear-gradient(135deg, ${T.teal} 0%, #115E59 100%)`,
                                color: "#FFF",
                                border: "none"
                            }}>
                                <FiZap size={20} style={{ opacity: 0.8, marginBottom: 12 }} />
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>System Healthy</h3>
                                <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
                                    All services operational. Database latency normal. Email service standing by.
                                </p>
                            </Card>
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </>
    );
}
