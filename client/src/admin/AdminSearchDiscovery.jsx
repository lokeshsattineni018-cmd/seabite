import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiSearch, FiTarget, FiTrendingUp, FiAlertCircle, FiTag, FiShoppingBag } from "react-icons/fi";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    border: "rgba(120,113,108,0.12)",
    teal: "#0D9488", tealL: "#F0FDFA",
    orange: "#D97706", orangeL: "#FFFBEB",
    text: "#1C1917",
    textMid: "#57534E",
    textSoft: "#A8A29E",
};

export default function AdminSearchDiscovery() {
    const [data, setData] = useState({ topSearches: [], zeroResults: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/api/admin/insights/search-discovery`, { withCredentials: true });
                setData(data);
            } catch (err) { }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div style={{ padding: 100, textAlign: "center" }}><SeaBiteLoader /></div>;

    return (
        <div style={{ padding: 24, background: T.bg, minHeight: "100vh", fontFamily: "Geist, sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.orange, marginBottom: 8 }}>
                    <FiTarget size={16} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Market Intelligence System</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", color: T.text }}>Search Discovery Engine</h1>
                <p style={{ color: T.textMid, marginTop: 4, fontSize: 15 }}>Real-time analysis of customer intent and catalog coverage gaps.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 32 }}>

                {/* Captured Demand (Top Searches) */}
                <div style={{ background: T.surface, padding: 32, borderRadius: 32, border: `1px solid ${T.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 16, background: T.tealL, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiTrendingUp size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 20, fontWeight: 600, color: T.text }}>Market Demand</h3>
                                <p style={{ fontSize: 13, color: T.textSoft }}>Top products customers are actively finding.</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {data.topSearches.map((item, i) => (
                            <div key={item._id} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: T.textGhost, width: 30 }}>{String(i + 1).padStart(2, '0')}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, textTransform: "capitalize", fontSize: 15 }}>{item.query}</span>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>{item.count} hits</span>
                                            <span style={{ fontSize: 11, color: T.textSoft }}>• {(item.count / data.topSearches.reduce((a,b)=>a+b.count,0) * 100).toFixed(1)}% share</span>
                                        </div>
                                    </div>
                                    <div style={{ width: "100%", height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.count / data.topSearches[0].count) * 100}%` }}
                                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ height: "100%", background: T.teal, borderRadius: 4 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lost Opportunities (Zero Results) */}
                <div style={{ background: T.surface, padding: 32, borderRadius: 32, border: `1px solid ${T.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: T.orangeL, color: T.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiAlertCircle size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 20, fontWeight: 600, color: T.text }}>Supply Gaps</h3>
                            <p style={{ fontSize: 13, color: T.textSoft }}>Missed intents due to missing catalog items.</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {data.zeroResults.map(item => (
                            <div key={item._id} style={{
                                padding: 20, borderRadius: 24, background: T.bg, border: `1px solid ${T.border}`,
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }} className="hover:border-orange-200 hover:shadow-sm">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15, textTransform: "capitalize", color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {item.query}
                                        {item.count > 10 && (
                                            <span style={{ fontSize: 9, background: T.orange, color: '#fff', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Demand</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 12, color: T.orange, marginTop: 4, fontWeight: 500 }}>{item.count} missed intents</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button title="Stock this product" style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1px solid ${T.border}`, color: T.textSoft, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiTag size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {data.zeroResults.length === 0 && (
                        <div style={{ padding: "60px 0", textAlign: "center", color: T.textSoft }}>
                            <FiShoppingBag size={64} style={{ opacity: 0.1, marginBottom: 20 }} />
                            <p style={{ fontSize: 14 }}>Inventory health is optimal.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
