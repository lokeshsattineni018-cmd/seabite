import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiArchive, FiSearch, FiFilter, FiUser, FiCalendar, 
  FiChevronLeft, FiChevronRight, FiDatabase, FiInfo, 
  FiCheckCircle, FiAlertTriangle, FiShield, FiLock, FiCpu
} from "react-icons/fi";
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
    surfaceWarm: "#F7F5F0",
    danger: "#E11D48",
    dangerL: "#FFF1F2"
};

// Web Crypto SHA-256 Helper
async function calculateSHA256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export default function AdminRegistry() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ action: "", startDate: "", endDate: "" });
    const [expandedLog, setExpandedLog] = useState(null);
    
    // Verification State
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, ...filters };
            const { data } = await axios.get(`${API_URL}/api/admin/registry/logs`, { params, withCredentials: true });
            setLogs(data.logs);
            setTotalPages(data.pages);
            setVerificationResult(null); // Reset verification result on data fetch
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

    // Sequential integrity checking routine
    const handleVerifyRegistry = async () => {
        setVerifying(true);
        setVerificationResult(null);
        
        try {
            // We need to verify oldest-to-newest, so reverse the page logs
            const chronological = [...logs].reverse();
            const checkedBlocks = [];
            let isValid = true;
            let failureReason = "";
            let compromisedLog = null;
            let compromisedIdx = -1;

            for (let i = 0; i < chronological.length; i++) {
                const log = chronological[i];
                const expectedPrevHash = i === 0 
                    ? "0000000000000000000000000000000000000000000000000000000000000000" 
                    : chronological[i - 1].hash;

                // 1. Check if hash exists
                if (!log.hash) {
                    isValid = false;
                    failureReason = "Block lacks a cryptographic hash signature (Legacy/Unhashed Log).";
                    compromisedLog = log;
                    compromisedIdx = logs.findIndex(l => l._id === log._id);
                    break;
                }

                // 2. Check previousHash link integrity
                if (log.previousHash !== expectedPrevHash) {
                    isValid = false;
                    failureReason = `Previous block hash mismatch. Link between Block ${i-1} and Block ${i} is broken.`;
                    compromisedLog = log;
                    compromisedIdx = logs.findIndex(l => l._id === log._id);
                    break;
                }

                // 3. Recompute hash and match
                const timeStr = log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString();
                const dataToHash = log.previousHash + log.action + timeStr;
                const recomputedHash = await calculateSHA256(dataToHash);

                if (log.hash !== recomputedHash) {
                    isValid = false;
                    failureReason = `Block hash payload mismatch. Calculated: ${recomputedHash.slice(0, 10)}... vs Registry: ${log.hash.slice(0, 10)}... (Possible data tampering detected).`;
                    compromisedLog = log;
                    compromisedIdx = logs.findIndex(l => l._id === log._id);
                    break;
                }

                checkedBlocks.push({
                    _id: log._id,
                    action: log.action,
                    hash: log.hash
                });
            }

            setVerificationResult({
                success: isValid,
                count: chronological.length,
                reason: failureReason,
                compromisedLog,
                compromisedIdx
            });

            if (isValid) {
                toast.success("Cryptographic Ledger Integrity Verified!");
            } else {
                toast.error("Ledger Integrity Compromised / Unhashed Data Found");
            }
        } catch (err) {
            toast.error("Verification failed");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div style={{ padding: 24, background: T.bg, minHeight: "100vh", fontFamily: "Geist, sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.teal, marginBottom: 8 }}>
                        <FiDatabase size={16} />
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Cryptographic registry vault</span>
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Registry Audit Ledger</h1>
                    <p style={{ color: T.textMid, marginTop: 4 }}>Historical chain-validated archive of platform mutations and administrative actions.</p>
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
                        <span style={{ color: T.textSoft }}>-</span>
                        <input
                            type="date"
                            name="endDate"
                            onChange={handleFilterChange}
                            style={{ border: "none", fontSize: 12, color: T.text, outline: "none", background: "transparent" }}
                        />
                    </div>
                    
                    <button
                        onClick={handleVerifyRegistry}
                        disabled={verifying || logs.length === 0}
                        style={{ 
                            background: T.tealL, 
                            color: T.teal, 
                            border: `1px solid ${T.teal}`, 
                            padding: "8px 20px", 
                            borderRadius: 12, 
                            fontSize: 13, 
                            fontWeight: 600, 
                            cursor: verifying ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}
                    >
                        <FiShield size={14} />
                        {verifying ? "Verifying..." : "Verify Registry Integrity"}
                    </button>

                    <button
                        onClick={() => { setPage(1); fetchLogs(); }}
                        style={{ background: T.text, color: "#FFF", border: "none", padding: "8px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Verification Result Notification */}
            <AnimatePresence>
                {verificationResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            marginBottom: 24,
                            padding: 20,
                            borderRadius: 20,
                            border: `1px solid ${verificationResult.success ? T.teal : T.danger}`,
                            background: verificationResult.success ? T.tealL : T.dangerL,
                            display: "flex",
                            alignItems: "start",
                            gap: 16
                        }}
                    >
                        {verificationResult.success ? (
                            <FiCheckCircle size={24} style={{ color: T.teal, flexShrink: 0, marginTop: 2 }} />
                        ) : (
                            <FiAlertTriangle size={24} style={{ color: T.danger, flexShrink: 0, marginTop: 2 }} />
                        )}
                        <div>
                            <h4 style={{ fontWeight: 700, color: verificationResult.success ? T.teal : T.danger, fontSize: 14 }}>
                                {verificationResult.success 
                                    ? "Ledger Chain Validated Successfully" 
                                    : "Registry Security Breach / Integrity Failure Detected"}
                            </h4>
                            <p style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: "1.5" }}>
                                {verificationResult.success 
                                    ? `Sequential SHA-256 blockhashing checks completed. All ${verificationResult.count} blocks on the current view match their previous cryptographic hashes. Sequence is secure.`
                                    : `Ledger sequence check failed: ${verificationResult.reason}`}
                            </p>
                            {!verificationResult.success && verificationResult.compromisedLog && (
                                <div style={{ marginTop: 12, padding: 12, background: "#FFF", borderRadius: 12, border: `1px solid ${T.border}` }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: T.textSoft }}>Compromised block details:</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6, fontSize: 12 }}>
                                        <div><strong>Log Index:</strong> #{verificationResult.compromisedIdx + 1} (on current page view)</div>
                                        <div><strong>Action:</strong> {verificationResult.compromisedLog.action}</div>
                                        <div><strong>Details:</strong> {verificationResult.compromisedLog.details}</div>
                                        <div style={{ gridColumn: "span 2" }}>
                                            <strong>Hash Signature:</strong> <code style={{ fontStyle: "italic" }}>{verificationResult.compromisedLog.hash || "null (No Hash Signature)"}</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
                {loading ? (
                    <div style={{ padding: 100, textAlign: "center" }}><SeaBiteLoader /></div>
                ) : (
                    <>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: T.surfaceWarm, borderBottom: `1px solid ${T.border}` }}>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>Block ID & Hash</th>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>User / IAM</th>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>Action</th>
                                    <th style={{ padding: "16px 24px", textAlign: "left", color: T.textSoft, fontWeight: 500 }}>Mutation Details</th>
                                    <th style={{ padding: "16px 24px", textAlign: "right", color: T.textSoft, fontWeight: 500 }}>Verification Seal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => {
                                    const isCompromised = verificationResult && !verificationResult.success && verificationResult.compromisedLog?._id === log._id;
                                    const isVerified = verificationResult && verificationResult.success;
                                    return (
                                        <tr key={log._id} style={{ 
                                            borderBottom: `1px solid ${T.border}`,
                                            background: isCompromised ? T.dangerL : "transparent"
                                        }}>
                                            <td style={{ padding: "16px 24px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <FiLock size={12} style={{ color: T.textSoft }} />
                                                    <span style={{ fontWeight: 600, color: T.text }}>#{logs.length - idx}</span>
                                                </div>
                                                <div style={{ fontSize: 10, color: T.textSoft, fontFamily: "monospace", marginTop: 4 }}>
                                                    {log.hash ? `${log.hash.slice(0, 16)}...` : "legacy_unhashed_block"}
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 24px" }}>
                                                <div style={{ fontWeight: 500, color: T.text }}>{log.user?.name || "Guest User"}</div>
                                                <div style={{ fontSize: 11, color: T.textSoft }}>{log.user?.email || "No Session Auth"}</div>
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
                                            <td style={{ padding: "16px 24px", color: T.textMid }}>
                                                <div>{log.details}</div>
                                                <div style={{ fontSize: 10, color: T.textSoft, marginTop: 4 }}>
                                                    📅 {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px 24px", textAlign: "right" }}>
                                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
                                                    {log.hash ? (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 700, color: isCompromised ? T.danger : T.teal,
                                                            display: "inline-flex", alignItems: "center", gap: 4
                                                        }}>
                                                            <FiShield />
                                                            {isCompromised ? "Chain Broken" : isVerified ? "Verified" : "Chain Protected"}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: T.warning, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                            <FiAlertTriangle />
                                                            Unhashed
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                                                        style={{ background: "none", border: "none", color: T.teal, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px" }}
                                                    >
                                                        <FiInfo size={14} /> View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                            style={{ background: "#FFF", width: 600, borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 600 }}>Technical Cryptographic Ledger Metadata</h3>
                                <FiLock size={18} style={{ color: T.textSoft }} />
                            </div>

                            <div style={{ marginBottom: 20, fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
                                <p><strong>Block ID:</strong> {expandedLog}</p>
                                <p style={{ wordBreak: "break-all", marginTop: 4 }}>
                                    <strong>Prev Block Hash Link:</strong> <code style={{ background: T.surfaceWarm, padding: "2px 4px", borderRadius: 4 }}>{logs.find(l => l._id === expandedLog)?.previousHash || "genesis_block_0000000000000000"}</code>
                                </p>
                                <p style={{ wordBreak: "break-all", marginTop: 4 }}>
                                    <strong>Current Block Hash:</strong> <code style={{ background: T.surfaceWarm, padding: "2px 4px", borderRadius: 4 }}>{logs.find(l => l._id === expandedLog)?.hash || "legacy_unhashed"}</code>
                                </p>
                            </div>

                            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: T.textSoft, marginBottom: 8 }}>Log Mutation Payload</h4>
                            <pre style={{
                                background: "#1C1917", color: "#00FFC2", padding: 20, borderRadius: 16,
                                fontSize: 12, overflowX: "auto", fontFamily: "Geist Mono", maxHeight: 200
                            }}>
                                {(() => {
                                    const meta = logs.find(l => l._id === expandedLog)?.meta;
                                    if (!meta || Object.keys(meta).length === 0) return "No extended metadata payload captured for this block mutation.";
                                    return JSON.stringify(meta, null, 2);
                                })()}
                            </pre>
                            
                            <button
                                onClick={() => setExpandedLog(null)}
                                style={{ width: "100%", marginTop: 24, background: T.teal, color: "#FFF", border: "none", padding: "12px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                                Close Ledger Block
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
