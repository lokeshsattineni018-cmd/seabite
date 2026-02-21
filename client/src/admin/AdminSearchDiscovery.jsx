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
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.orange, marginBottom: 8 }}>
                    <FiTarget size={16} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Market Intel</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Search Intelligence</h1>
                <p style={{ color: T.textMid, marginTop: 4 }}>Discover what your customers are looking for and identify gaps in your catalog.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

                {/* Captured Demand (Top Searches) */}
                <div style={{ background: T.surface, padding: 32, borderRadius: 24, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.tealL, color: T.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiTrendingUp size={20} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Captured Demand</h3>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {data.topSearches.map((item, i) => (
                            <div key={item._id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.textSoft, width: 24 }}>#{i + 1}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{item.query}</span>
                                        <span style={{ fontSize: 12, color: T.textMid }}>{item.count} searches</span>
                                    </div>
                                    <div style={{ width: "100%", height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.count / data.topSearches[0].count) * 100}%` }}
                                            style={{ height: "100%", background: T.teal }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lost Opportunities (Zero Results) */}
                <div style={{ background: T.surface, padding: 32, borderRadius: 24, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.orangeL, color: T.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiAlertCircle size={20} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Lost Opportunities</h3>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {data.zeroResults.map(item => (
                            <div key={item._id} style={{
                                padding: 16, borderRadius: 16, background: T.bg, border: `1px solid ${T.border}`,
                                display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{item.query}</div>
                                    <div style={{ fontSize: 11, color: T.orange }}>{item.count} missed intents</div>
                                </div>
                                <button style={{ background: "none", border: "none", color: T.textSoft, cursor: "pointer" }}>
                                    <FiTag size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {data.zeroResults.length === 0 && (
                        <div style={{ padding: "40px 0", textAlign: "center", color: T.textSoft }}>
                            <FiShoppingBag size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                            <p>Catalog perfectly matches all customer intents.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
