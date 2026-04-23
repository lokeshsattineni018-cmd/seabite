import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiShare2, FiCopy, FiGift, FiChevronLeft, FiDollarSign } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const T = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  ink: "#1A2E2C",
  inkMid: "#4A6572",
  inkSoft: "#6B8F8A",
  inkGhost: "#B8CFCC",
  teal: "#5BBFB5",
  tealDeep: "#3E948C",
  tealGlow: "#E8F5F3",
  coral: "#E8A365",
  border: "#E2EEEC",
  spring: { type: "spring", stiffness: 350, damping: 30 },
};

export default function ReferEarn() {
  const { user } = useContext(AuthContext);
  const [copied, setCopied] = useState(false);

  // If user is not fully loaded or doesn't have a referral code yet (e.g. old users)
  // we fallback to a placeholder, though ideally the backend should backfill them.
  const referralCode = user?.referralCode || "SEABITE50";
  const walletBalance = user?.walletBalance || 0;
  const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;

  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    earnedCredits: 0,
    referralList: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || ""}/api/user/referrals`, { withCredentials: true });
        setReferralStats(data);
      } catch (err) {
        console.error("Stats fetch failed", err);
      } finally {
        setLoadingStats(false);
      }
    };
    if (user) fetchStats();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join SeaBite",
          text: `Use my referral code ${referralCode} to get ₹100 off your first SeaBite order!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, paddingBottom: 100, fontFamily: "'Manrope', sans-serif" }}>
      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "16px 24px", display: "flex", alignItems: "center", gap: 16
      }}>
        <Link to="/profile" style={{ color: T.ink, display: "flex", alignItems: "center" }}>
          <FiChevronLeft size={24} />
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0 }}>Refer & Earn</h1>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px" }}>
        
        {/* ── Wallet Balance ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T.spring }}
          style={{
            background: "linear-gradient(135deg, #1A2E2C 0%, #2A4A46 100%)",
            borderRadius: 24, padding: "24px", color: "#fff",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 32, boxShadow: "0 12px 32px rgba(26,46,44,0.15)"
          }}
        >
          <div>
            <p style={{ fontSize: 13, color: "#B8CFCC", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              SeaBite Cash
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: T.teal }}>₹</span>
              <span style={{ fontSize: 36, fontWeight: 800 }}>{walletBalance}</span>
            </div>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiDollarSign size={24} color={T.teal} />
          </div>
        </motion.div>

        {/* ── Stats Summary ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#F4F9F8", padding: 20, borderRadius: 20, textAlign: "center", border: `1.5px solid ${T.border}` }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Friends Joined</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>{referralStats.totalReferrals}</p>
          </div>
          <div style={{ background: "#F4F9F8", padding: 20, borderRadius: 20, textAlign: "center", border: `1.5px solid ${T.border}` }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Pending Reward</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: T.ink }}>₹{referralStats.pendingReferrals * 100 || 0}</p>
          </div>
        </div>

        {/* ── Illustration / Hero ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...T.spring, delay: 0.1 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: T.tealGlow,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
            color: T.tealDeep
          }}>
            <FiGift size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Give ₹100, Get ₹100
          </h2>
          <p style={{ fontSize: 15, color: T.inkMid, lineHeight: 1.6, margin: 0, padding: "0 20px" }}>
            Invite friends to SeaBite. They get <strong style={{ color: T.ink }}>₹100 off</strong> their first order, and you get <strong style={{ color: T.ink }}>₹100 SeaBite Cash</strong> when they buy!
          </p>
        </motion.div>

        {/* ── Referral Code Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T.spring, delay: 0.2 }}
          style={{
            background: "#fff", border: `2px dashed ${T.teal}`, borderRadius: 24,
            padding: "24px", textAlign: "center", position: "relative"
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Your Referral Code
          </p>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.ink, letterSpacing: "0.1em", marginBottom: 24 }}>
            {referralCode}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              style={{
                flex: 1, padding: "14px", borderRadius: 16, border: `1.5px solid ${T.border}`,
                background: copied ? T.tealGlow : "#fff", color: copied ? T.tealDeep : T.ink,
                fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <FiCopy size={18} /> {copied ? "Copied!" : "Copy"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              style={{
                flex: 1, padding: "14px", borderRadius: 16, border: "none",
                background: T.ink, color: "#fff",
                fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: "pointer", boxShadow: "0 8px 16px rgba(26,46,44,0.15)"
              }}
            >
              <FiShare2 size={18} /> Share Now
            </motion.button>
          </div>
        </motion.div>

        {/* ── How it works ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...T.spring, delay: 0.3 }}
          style={{ marginTop: 48 }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 20 }}>How it works</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { num: 1, title: "Share your code", desc: "Send your unique link or code to friends." },
              { num: 2, title: "They sign up", desc: "Your friends get ₹100 off their first order." },
              { num: 3, title: "You get rewarded", desc: "Earn ₹100 SeaBite Cash when their order is delivered." },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: T.tealGlow, color: T.tealDeep,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0
                }}>
                  {step.num}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.ink, margin: "0 0 4px" }}>{step.title}</p>
                  <p style={{ fontSize: 13, color: T.inkMid, margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Referral History ── */}
        {referralStats.referralList?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 20 }}>Referral History</h3>
            <div style={{ background: "#fff", borderRadius: 24, border: `1.5px solid ${T.border}`, overflow: "hidden" }}>
              {referralStats.referralList.map((ref, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: i === referralStats.referralList.length - 1 ? "none" : `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: 0 }}>{ref.name}</p>
                    <p style={{ fontSize: 11, color: T.inkSoft, margin: 0 }}>Joined {new Date(ref.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: ref.status === 'completed' ? T.teal : T.inkSoft }}>
                    {ref.status === 'completed' ? "+ ₹100" : "Pending Order"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
