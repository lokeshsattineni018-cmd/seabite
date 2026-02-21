import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiArchive, FiSearch, FiFilter, FiUser, FiCalendar, FiChevronLeft, FiChevronRight, FiDatabase, FiInfo } from "react-icons/fi";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    border: "rgba(120,113,108,0.12)",
    teal: "#0D9488", tealL: "#F0FDFA",
    text: "#1C1917",
    textMid: "#57534E",
    textSoft: "#A8A29E",
    surfaceWarm: "#F7F5F0"
};

export default function AdminRegistry() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ action: "", startDate: "", endDate: "" });
    const [expandedLog, setExpandedLog] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, ...filters };
            const { data } = await axios.get(`${API_URL}/api/admin/registry/logs`, { params, withCredentials: true });
            setLogs(data.logs);
            setTotalPages(data.pages);
        } catch (err) {
            toast.error("Failed to load registry");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, [page]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div style={{ padding: 24, background: T.bg, minHeight: "100vh", fontFamily: "Geist, sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.teal, marginBottom: 8 }}>
                        <FiDatabase size={16} />
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Audit Vault</span>
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>The Registry</h1>
                    <p style={{ color: T.textMid, marginTop: 4 }}>Historical archive of all platform activity and administrative mutations.</p>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: T.surface, padding: "8px 16px", borderRadius: 12, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <FiCalendar size={14} style={{ color: T.textSoft }} />
                        <input
                            type="date"
                            name="startDate"
                            onChange={handleFilterChange}
                            style={{ border: "none", fontSize: 12, color: T.text, outline: "none", background: "transparent" }}
                        />
                        <span style={{ color: T.textGhost }}>-</span>
                        <input
                            type="date"
                            name="endDate"
                            onChange={handleFilterChange}
                            style={{ border: "none", fontSize: 12, color: T.text, outline: "none", background: "transparent" }}
                        />
                    </div>
                    <button
                        onClick={() => { setPage(1); fetchLogs(); }}
                        style={{ background: T.text, color: "#FFF", border: "none", padding: "8px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 100, textAlign: "center" }}><SeaBiteLoader /></div>
                ) : (
                    <>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: T.surfaceWarm, borderBottom: `1px solid ${T.border}` }}>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>Timestamp</th>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>User</th>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>Action</th>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>Details</th>
                                    <th style={{ padding: "16px 24px", textAlign: "right", color: T.textSoft, fontWeight: 500 }}>Payload</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                        <td style={{ padding: "16px 24px", color: T.textSoft, fontFamily: "Geist Mono" }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            <div style={{ fontWeight: 500, color: T.text }}>{log.user?.name || "Guest"}</div>
                                            <div style={{ fontSize: 11, color: T.textSoft }}>{log.user?.email || "No Auth"}</div>
                                        </td>
                                        <td style={{ padding: "16px 24px" }}>
                                            <span style={{
                                                padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                background: log.action === "SECURITY" ? "#FFF1F2" : T.tealL,
                                                color: log.action === "SECURITY" ? "#E11D48" : T.teal
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: "16px 24px", color: T.textMid }}>{log.details}</td>
                                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                            <button
                                                onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                                                style={{ background: "none", border: "none", color: T.teal, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                                            >
                                                <FiInfo size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surfaceWarm }}>
                            <div style={{ fontSize: 12, color: T.textSoft }}>Page {page} of {totalPages}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    style={{ padding: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, cursor: page === 1 ? "not-allowed" : "pointer" }}
                                >
                                    <FiChevronLeft />
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{ padding: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, cursor: page === totalPages ? "not-allowed" : "pointer" }}
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal for Meta Payload */}
            <AnimatePresence>
                {expandedLog && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{ background: "#FFF", width: 500, borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                        >
                            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Technical Metadata</h3>
                            <pre style={{
                                background: "#1C1917", color: "#00FFC2", padding: 20, borderRadius: 16,
                                fontSize: 12, overflowX: "auto", fontFamily: "Geist Mono"
                            }}>
                                {JSON.stringify(logs.find(l => l._id === expandedLog)?.meta, null, 2)}
                            </pre>
                            <button
                                onClick={() => setExpandedLog(null)}
                                style={{ width: "100%", marginTop: 24, background: T.teal, color: "#FFF", border: "none", padding: "12px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                                Close Payload
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
