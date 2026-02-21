import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiLock, FiUnlock, FiUser, FiZap, FiShield, FiAlertTriangle } from "react-icons/fi";
import SeaBiteLoader from "../components/common/SeaBiteLoader";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
    bg: "#FAFAF8",
    surface: "#FFFFFF",
    border: "rgba(120,113,108,0.12)",
    teal: "#0D9488", tealL: "#F0FDFA",
    rose: "#E11D48", roseL: "#FFF1F2",
    text: "#1C1917",
    textMid: "#57534E",
    textSoft: "#A8A29E",
};

export default function AdminIAM() {
    const [lockedUsers, setLockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLocked = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/admin/iam/locked`, { withCredentials: true });
            setLockedUsers(data);
        } catch (err) {
            toast.error("Failed to fetch locked users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLocked(); }, []);

    const handleUnlock = async (id, email) => {
        try {
            await axios.post(`${API_URL}/api/admin/iam/unlock/${id}`, {}, { withCredentials: true });
            toast.success(`Unlocked ${email}`);
            fetchLocked();
        } catch (err) {
            toast.error("Unlock failed");
        }
    };

    if (loading) return <div style={{ padding: 100, textAlign: "center" }}><SeaBiteLoader /></div>;

    return (
        <div style={{ padding: 24, background: T.bg, minHeight: "100vh", fontFamily: "Geist, sans-serif" }}>
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.teal, marginBottom: 8 }}>
                    <FiShield size={16} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Access Sentinel</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>IAM Management</h1>
                <p style={{ color: T.textMid, marginTop: 4 }}>Monitor and manage account lockouts triggered by security policies.</p>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
                {lockedUsers.length === 0 ? (
                    <div style={{ padding: 64, textAlign: "center", background: T.surface, borderRadius: 24, border: `1px solid ${T.border}` }}>
                        <FiShield size={48} style={{ color: T.teal, opacity: 0.2, marginBottom: 16 }} />
                        <p style={{ color: T.textSoft, fontSize: 14 }}>No accounts are currently locked or under scrutiny.</p>
                    </div>
                ) : (
                    lockedUsers.map(user => {
                        const isLocked = user.lockUntil && new Date(user.lockUntil) > new Date();
                        return (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: T.surface,
                                    padding: 24,
                                    borderRadius: 24,
                                    border: `1px solid ${T.border}`,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 16,
                                        background: isLocked ? T.roseL : T.tealL,
                                        color: isLocked ? T.rose : T.teal,
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>
                                        {isLocked ? <FiLock size={20} /> : <FiZap size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: T.text, fontSize: 16 }}>{user.name}</div>
                                        <div style={{ fontSize: 13, color: T.textSoft }}>{user.email} • {user.role}</div>
                                        <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                                            <div style={{ fontSize: 11, color: T.textMid, display: "flex", alignItems: "center", gap: 4 }}>
                                                <FiAlertTriangle size={12} /> {user.loginAttempts} Failed Attempts
                                            </div>
                                            {isLocked && (
                                                <div style={{ fontSize: 11, color: T.rose, fontWeight: 500 }}>
                                                    Locked until {new Date(user.lockUntil).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleUnlock(user._id, user.email)}
                                    style={{
                                        background: T.text,
                                        color: "#FFF",
                                        border: "none",
                                        padding: "10px 20px",
                                        borderRadius: 12,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8
                                    }}
                                >
                                    <FiUnlock size={14} /> Clear Lockout
                                </button>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
