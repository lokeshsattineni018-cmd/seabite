import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiUsers, FiTrendingUp, FiAlertTriangle, FiZap, FiSend, FiDollarSign } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const SEGMENTS = {
  champions:   { label: "Champions",    emoji: "🏆", color: "#10B981", bg: "#F0FDF4", desc: "High value, recent, frequent buyers" },
  loyal:       { label: "Loyal",        emoji: "💚", color: "#5BBFB5", bg: "#F4F9F8", desc: "Regular buyers, good value" },
  at_risk:     { label: "At Risk",      emoji: "⚠️",  color: "#F59E0B", bg: "#FFFBEB", desc: "Previously frequent, now inactive" },
  hibernating: { label: "Hibernating",  emoji: "😴", color: "#8B5CF6", bg: "#F5F3FF", desc: "Long inactive, bought before" },
  churned:     { label: "Churned",      emoji: "💔", color: "#EF4444", bg: "#FEF2F2", desc: "One-time buyers, gone >30 days" },
  new:         { label: "New",          emoji: "🌱", color: "#6B8F8A", bg: "#F4F9F8", desc: "Recent joiners, low activity" },
};

export default function AdminRFM() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState("champions");
  const [sendingCampaign, setSendingCampaign] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/admin/bi/rfm`, { withCredentials: true })
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSendCampaign = async () => {
    const members = data?.segments?.[activeSegment] || [];
    const userIds = members.filter(m => m.user).map(m => m.user._id);
    if (!userIds.length) { alert("No users with emails in this segment."); return; }

    const subject = prompt(`Email subject for ${SEGMENTS[activeSegment]?.label} segment:`);
    if (!subject) return;
    const message = prompt("Email message:");
    if (!message) return;

    setSendingCampaign(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/marketing/email-blast`, {
        subject, message, recipients: userIds
      }, { withCredentials: true });
      alert(`✅ Campaign sent to ${res.data.stats?.sent || 0} users.`);
    } catch (err) {
      alert("Failed to send campaign: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingCampaign(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>👥</div>
        <p style={{ color: "#6B8F8A", fontWeight: "600" }}>Computing RFM segments…</p>
      </div>
    </div>
  );

  const summary = data?.summary || {};
  const segments = data?.segments || {};
  const activeMembers = segments[activeSegment] || [];
  const seg = SEGMENTS[activeSegment];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFB", padding: "32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          👥 RFM Customer Segments
        </h1>
        <p style={{ color: "#6B8F8A", fontSize: "14px", margin: 0, fontWeight: "500" }}>
          Recency · Frequency · Monetary — {summary.total || 0} customers analyzed
        </p>
      </div>

      {/* Segment Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {Object.entries(SEGMENTS).map(([key, cfg]) => (
          <motion.div
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveSegment(key)}
            style={{
              background: activeSegment === key ? cfg.bg : "#fff",
              border: `2px solid ${activeSegment === key ? cfg.color : "#E2EEEC"}`,
              borderRadius: "18px", padding: "20px", cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: activeSegment === key ? `0 8px 24px ${cfg.color}25` : "none",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>{cfg.emoji}</div>
            <p style={{ fontSize: "13px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 4px" }}>{cfg.label}</p>
            <p style={{ fontSize: "28px", fontWeight: "900", color: cfg.color, letterSpacing: "-0.04em", margin: "0 0 4px" }}>
              {summary[key] || 0}
            </p>
            <p style={{ fontSize: "10px", color: "#6B8F8A", margin: 0, fontWeight: "600" }}>customers</p>
          </motion.div>
        ))}
      </div>

      {/* Segment Detail */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1.5px solid #E2EEEC", overflow: "hidden" }}>
        {/* Segment Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1.5px solid #E2EEEC", display: "flex", alignItems: "center", justifyContent: "space-between", background: seg.bg }}>
          <div style={{ display: "flex", align: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>{seg.emoji}</span>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#1A2E2C", margin: "0 0 2px" }}>
                {seg.label} Customers
              </h2>
              <p style={{ fontSize: "12px", color: "#6B8F8A", margin: 0, fontWeight: "500" }}>{seg.desc}</p>
            </div>
          </div>
          <button
            onClick={handleSendCampaign}
            disabled={sendingCampaign || activeMembers.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "10px",
              background: seg.color, color: "#fff", border: "none",
              fontSize: "13px", fontWeight: "800", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              opacity: activeMembers.length === 0 ? 0.5 : 1,
            }}
          >
            <FiSend size={14} /> {sendingCampaign ? "Sending…" : "Email This Segment"}
          </button>
        </div>

        {/* RFM Score Legend */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #E2EEEC", background: "#F8FAFB", display: "flex", gap: "24px" }}>
          {[["R", "Recency"], ["F", "Frequency"], ["M", "Monetary"]].map(([abbr, full]) => (
            <div key={abbr} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "#6B8F8A" }}>
              <span style={{ width: "20px", height: "20px", background: seg.color, color: "#fff", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "10px" }}>{abbr}</span>
              {full} Score (1–5)
            </div>
          ))}
        </div>

        {/* Users Table */}
        {activeMembers.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
            <p style={{ color: "#6B8F8A", fontWeight: "600" }}>No customers in this segment</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFB" }}>
                  {["Customer", "Recency", "Orders", "Spent", "R", "F", "M", "Score"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: "900", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #E2EEEC", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMembers.map((m, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid #E2EEEC" }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{m.user?.name || "Unknown"}</p>
                        <p style={{ fontSize: "11px", color: "#6B8F8A", margin: "2px 0 0" }}>{m.user?.email || ""}</p>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: m.recencyDays > 60 ? "#EF4444" : m.recencyDays > 30 ? "#F59E0B" : "#10B981" }}>
                      {m.recencyDays}d ago
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>{m.orderCount}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: "#5BBFB5" }}>₹{m.totalSpent?.toLocaleString()}</td>
                    {[m.r, m.f, m.m].map((score, si) => (
                      <td key={si} style={{ padding: "14px 16px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: score >= 4 ? seg.bg : "#F8FAFB", border: `1.5px solid ${score >= 4 ? seg.color : "#E2EEEC"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "900", color: score >= 4 ? seg.color : "#6B8F8A" }}>
                          {score}
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "900", color: seg.color, background: seg.bg, padding: "4px 10px", borderRadius: "20px" }}>
                        {m.rfmScore}/15
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
