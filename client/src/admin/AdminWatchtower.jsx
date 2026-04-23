import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiActivity, FiCpu, FiGlobe, FiRadio, FiTerminal,
    FiUser, FiShoppingCart, FiSearch, FiLock, FiClock, FiZap, FiMapPin
} from "react-icons/fi";
import { useSocket } from "../context/SocketContext";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

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
    const { socket, isConnected, activeUsers: socketActiveUsers } = useSocket();
    const [logs, setLogs] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [traceFilter, setTraceFilter] = useState(null);
    const [activeUsers, setActiveUsers] = useState(0);

    const [systemPulse, setSystemPulse] = useState(null);

    // Initial Fetch & Periodic Metrics
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [liveRes, healthRes] = await Promise.all([
                    axios.get(`${API_URL}/api/admin/watchtower/live`, { withCredentials: true }),
                    axios.get(`${API_URL}/health`, { withCredentials: true })
                ]);
                setLogs(liveRes.data.logs);
                setActiveUsers(liveRes.data.activeCount);
                setMetrics(healthRes.data);
            } catch (err) {
                // Silent fail
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s monitoring
        return () => clearInterval(interval);
    }, []);

    // Real-time Listener
    useEffect(() => {
        if (!socket) return;

        const handleLog = (newLog) => {
            setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50
        };

        socket.on('WATCHTOWER_LOG', handleLog);
        socket.on('SYSTEM_PULSE', setSystemPulse);

        return () => {
            socket.off('WATCHTOWER_LOG', handleLog);
            socket.off('SYSTEM_PULSE', setSystemPulse);
        };
    }, [socket]);

    const getActionStyle = (action) => {
        switch (action) {
            case "LOGIN": return { icon: <FiLock />, color: T.teal, bg: T.tealL, label: "Login" };
            case "CART_UPDATE": return { icon: <FiShoppingCart />, color: T.warning, bg: T.warningL, label: "Cart" };
            case "SEARCH": return { icon: <FiSearch />, color: T.sky, bg: T.skyL, label: "Search" };
            case "WISHLIST_ADD": return { icon: <FiActivity />, color: T.purple, bg: T.purpleL, label: "Wishlist" };
            case "ORDER_STATUS_UPDATE":
            case "AUDIT": return { icon: <FiTerminal />, color: T.textMid, bg: T.surfaceMid, label: "Audit" };
            case "SECURITY":
            case "ORDER_CANCELLED": return { icon: <FiLock />, color: "#E11D48", bg: "#FFF1F2", label: "Security" };
            default: return { icon: <FiZap />, color: T.textMid, bg: T.surfaceMid, label: "System" };
        }
    };

    const formatTime = (iso) => {
        return new Date(iso).toLocaleTimeString('en-US', { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
    };

    const parseCartLog = (log) => {
        if (log.action === "CART_UPDATE" && log.meta?.items) {
           const itemCount = log.meta.items.reduce((acc, item) => acc + item.qty, 0);
           const totalVal = log.meta.items.reduce((acc, item) => acc + (item.qty * item.basePrice), 0);
           const itemNames = log.meta.items.map(i => \`\${i.qty}x \${i.name}\`).join(", ");
           return \`\${log.user?.name || 'Guest'} updated cart: \${itemNames} (Total: ₹\${totalVal})\`;
        }
        return log.details;
    };

    return (
        <>
            <GS />
            <motion.div className="sb" initial="hidden" animate="visible" variants={stagger}
                style={{ background: T.bg, padding: "16px 0 0 0", maxWidth: 1400, margin: "0 auto", color: T.text }}
            >
                {/* ── HEADER ─────────────────────────────────── */}
                <motion.div variants={fadeUp} style={{ marginBottom: 16, borderBottom: `1px solid ${T.borderSoft}`, paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "end" }}>
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

                    <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
                        {systemPulse && (
                            <div style={{ padding: "8px 16px", borderRadius: 12, background: systemPulse.reqCount > 50 ? T.roseL : T.surfaceMid, border: `1px solid ${systemPulse.reqCount > 50 ? T.rose : T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FiActivity size={14} className={systemPulse.reqCount > 0 ? "animate-pulse" : ""} style={{ color: systemPulse.reqCount > 50 ? T.rose : T.teal }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: systemPulse.reqCount > 50 ? T.rose : T.text }}>{systemPulse.reqCount} REQ / 5S</span>
                            </div>
                        )}
                        <Card style={{ padding: "12px 20px", borderRadius: 16 }}>
                            <div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Active Users</div>
                            <div style={{ fontSize: 24, fontWeight: 600, color: T.teal, display: "flex", alignItems: "center", gap: 8 }}>
                                {socketActiveUsers || activeUsers}
                            </div>
                        </Card>
                    </div>
                </motion.div>

                {/* ── METRICS BAR (NEW) ─────────────────────────── */}
                <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                    <Card style={{ padding: 16, border: systemPulse?.latency > 200 ? \`1.5px solid \${T.warning}\` : undefined, boxShadow: systemPulse?.latency > 200 ? \`0 0 16px \${T.warning}33\` : undefined }}>
                        <div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", marginBottom: 4 }}>DB Latency</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: (systemPulse?.latency > 200) ? T.warning : T.teal }}>
                            {systemPulse ? \`\${systemPulse.latency}ms\` : (metrics?.database?.latency || "---")}
                        </div>
                    </Card>
                    <Card style={{ padding: 16, border: systemPulse?.cpu > 0.8 ? \`1.5px solid \${T.warning}\` : undefined, boxShadow: systemPulse?.cpu > 0.8 ? \`0 0 16px \${T.warning}33\` : undefined }}>
                        <div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", marginBottom: 4 }}>CPU Load</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{systemPulse ? \`\${(systemPulse.cpu * 100).toFixed(1)}%\` : "---"}</div>
                    </Card>
                    <Card style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", marginBottom: 4 }}>Free RAM</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{systemPulse ? \`\${Math.round(systemPulse.freeRam)}MB\` : "---"}</div>
                    </Card>
                    <Card style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, color: T.textSoft, textTransform: "uppercase", marginBottom: 4 }}>Uptime</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{Math.floor((metrics?.uptime || 0) / 3600)}h {Math.floor(((metrics?.uptime || 0) % 3600) / 60)}m</div>
                    </Card>
                </motion.div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

                    {/* ── LIVE FEED TABLE ────────────────────────────── */}
                    <motion.div variants={fadeUp} custom={1}>
                        <Card hover={false} style={{ minHeight: "60vh" }}>
                            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                                        {traceFilter ? `Trace: ${traceFilter.slice(0, 8)}...` : "Recent Activity"}
                                    </h3>
                                    {traceFilter && (
                                        <button
                                            onClick={() => setTraceFilter(null)}
                                            style={{ fontSize: 10, color: T.teal, background: T.tealL, border: `1px solid ${T.teal}`, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
                                        >Clear Filter</button>
                                    )}
                                </div>
                                <div style={{ fontSize: 11, color: T.textGhost, fontFamily: "Geist Mono, monospace" }}>
                                    LATENCY: {metrics?.database?.latency || "---"}
                                </div>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <tbody style={{ fontSize: 13 }}>
                                        <AnimatePresence initial={false}>
                                            {logs
                                                .filter(log => !traceFilter || log.meta?.traceId === traceFilter)
                                                .map((log) => {
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
                                                                <div style={{ fontWeight: 500, color: T.text, marginBottom: 2 }}>{parseCartLog(log)}</div>
                                                                <div style={{ fontSize: 11, color: T.textSoft, display: "flex", gap: 6, alignItems: "center" }}>
                                                                    <span style={{ fontWeight: 600, color: style.color }}>{log.action}</span>
                                                                    {log.meta?.traceId && (
                                                                        <button
                                                                            onClick={() => setTraceFilter(log.meta.traceId)}
                                                                            style={{
                                                                                fontSize: 9, fontFamily: "Geist Mono", background: T.surfaceWarm,
                                                                                border: `1px solid ${T.border}`, padding: "1px 4px", borderRadius: 4,
                                                                                color: traceFilter === log.meta.traceId ? T.teal : T.textSoft,
                                                                                cursor: "pointer"
                                                                            }}
                                                                        >
                                                                            TRACE: {log.meta.traceId.slice(0, 8)}
                                                                        </button>
                                                                    )}
                                                                    {log.meta && Object.keys(log.meta).filter(k => k !== 'traceId' && k !== 'items').length > 0 && (
                                                                        <><span>•</span> <span>{JSON.stringify(Object.fromEntries(Object.entries(log.meta).filter(([k]) => k !== 'traceId' && k !== 'items')))}</span></>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                                                {log.user ? (
                                                                    <a href={`/admin/users/${typeof log.user === 'object' ? log.user._id : log.user}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                                                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surfaceWarm, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, cursor: "pointer" }} className="hover:bg-stone-200 transition-colors">
                                                                            <FiUser size={10} style={{ color: T.textSoft }} />
                                                                            <span style={{ fontSize: 11, fontWeight: 500, color: T.text }}>{log.user.name}</span>
                                                                        </div>
                                                                    </a>
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
                                                <td colSpan={4} style={{ padding: 40, textAlign: "center" }}>
                                                    <SeaBiteLoader />
                                                    <p style={{ marginTop: 12, fontSize: 12, color: T.textSoft, fontStyle: "italic" }}>
                                                        Waiting for stream data...
                                                    </p>
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
                                background: metrics?.status === "healthy"
                                    ? `linear-gradient(135deg, ${T.teal} 0%, #115E59 100%)`
                                    : `linear-gradient(135deg, ${T.warning} 0%, #B45309 100%)`,
                                color: "#FFF",
                                border: "none"
                            }}>
                                <FiZap size={20} style={{ opacity: 0.8, marginBottom: 12 }} />
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                                    {metrics?.status === "healthy" ? "System Healthy" : "Status Degraded"}
                                </h3>
                                <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
                                    {metrics?.status === "healthy"
                                        ? "All services operational. Database latency normal. Email service standing by."
                                        : "Database latency or memory pressure detected. Monitoring in progress."}
                                </p>
                            </Card>
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </>
    );
}
