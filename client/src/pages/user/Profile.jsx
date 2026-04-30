import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiGift, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { motion, useInView, AnimatePresence } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) return toast.error("Please fill both fields");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPass !== confirmPass) return toast.error("Passwords do not match");
    if (newPass === oldPass) return toast.error("New password cannot be same as old password");
    
    setPassLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/change-password`, { oldPassword: oldPass, newPassword: newPass }, { withCredentials: true });
      toast.success("Password updated!");
      setShowPassModal(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect current password");
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    }
    finally {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("seabite_session_id");
      window.location.href = "/?auth=login"; // Redirect and trigger login to show it's cleared
    }
  };

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) {
    return <SeaBiteLoader fullScreen />;
  }

  if (!user) return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl = user.picture || user.avatar || null;

  return (
    <div style={{
      minHeight: "100vh", background: "#F4F9F8",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: "hidden",
      paddingBottom: 100, // For mobile nav
    }}>
      {/* ── HERO BANNER ── */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        {/* Ocean photo */}
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
          src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop"
          alt="Ocean"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Premium Gradient Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(26,43,53,0.4), rgba(244,249,248,1))",
        }} />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/")}
          style={{
            position: "absolute", top: 40, left: 24,
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 99,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#1A2B35", fontSize: 13, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <FiArrowLeft size={16} />
          Back
        </motion.button>
      </div>

      {/* ── AVATAR CARD (overlapping banner) ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "#ffffff",
            borderRadius: 28, border: "1px solid #E2EEEC",
            boxShadow: "0 20px 60px rgba(26,43,53,0.08)",
            padding: "32px",
            marginTop: -60, marginBottom: 32,
            display: "flex", alignItems: "center", gap: 24,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "linear-gradient(135deg, #5BA8A0, #89C2D9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, fontWeight: 800, color: "#ffffff",
              border: "4px solid #ffffff",
              boxShadow: "0 12px 32px rgba(91,168,160,0.3)",
              overflow: "hidden"
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : avatarLetter}
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                position: "absolute", bottom: 6, right: 6,
                width: 18, height: 18, borderRadius: "50%",
                background: "#5BA8A0", border: "3px solid #ffffff",
              }}
            />
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A2B35", margin: 0, letterSpacing: "-0.03em" }}>
                {user.name}
              </h1>
              {user.role === "admin" && (
                <span style={{
                  padding: "4px 10px", borderRadius: 8,
                  background: "#1A2B35", color: "#FFD700",
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.1em"
                }}>Admin</span>
              )}
            </div>
            <p style={{ fontSize: 15, color: "#8BA5B3", fontWeight: 500, margin: 0 }}>{user.email}</p>
          </div>

          {/* Wallet / Stats */}
          <div style={{ display: "flex", gap: 32 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#1A2B35", margin: 0 }}>₹{user.walletBalance || 0}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>Wallet</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#5BA8A0", margin: 0 }}>{user.totalOrders || 0}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#8BA5B3", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>Orders</p>
            </div>
          </div>
        </motion.div>

        {/* ── GRID LAYOUT FOR INFO ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 40 }}>
          <FadeUp delay={0.1}>
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #E2EEEC", padding: 24, height: "100%" }}>
              <UserInfo user={user} />
            </div>
          </FadeUp>
          
          <FadeUp delay={0.2}>
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #E2EEEC", padding: 24, height: "100%" }}>
              <AddressManager />
            </div>
          </FadeUp>
        </div>

        {/* ── SECURITY SECTION ── */}
        <FadeUp delay={0.3}>
          <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #E2EEEC", padding: 32, marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A2B35", margin: "0 0 4px" }}>Security & Access</h3>
                <p style={{ fontSize: 14, color: "#8BA5B3", margin: 0 }}>Manage your password and authentication methods.</p>
              </div>
              
              {user.isGoogleUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#F8FAFB", borderRadius: 16, border: "1px solid #E2EEEC" }}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{ width: 20 }} alt="G" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#4285F4" }}>Connected via Google</span>
                </div>
              ) : (
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPassModal(true)}
                  style={{
                    padding: "14px 28px", borderRadius: 16,
                    background: "#5BA8A0", color: "#fff", border: "none",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(91,168,160,0.2)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                >
                  Change Password
                </motion.button>
              )}
            </div>
          </div>
        </FadeUp>

        {/* ── DANGER ZONE ── */}
        <FadeUp delay={0.4}>
          <div style={{ textAlign: "center" }}>
            <motion.button
              whileHover={{ scale: 1.02, color: "#E8816A" }}
              onClick={handleLogout}
              style={{
                background: "none", border: "none",
                fontSize: 14, fontWeight: 700, color: "#8BA5B3",
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                transition: "color 0.2s"
              }}
            >
              <FiLogOut size={16} /> Sign Out from SeaBite
            </motion.button>
          </div>
        </FadeUp>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPassModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(26,43,53,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}
            >
              <motion.div 
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                style={{ background: "#fff", padding: 40, borderRadius: 32, width: "100%", maxWidth: 440, boxShadow: "0 40px 100px rgba(0,0,0,0.25)", position: "relative" }}
              >
                <button onClick={() => setShowPassModal(false)} style={{ position: "absolute", top: 24, right: 24, background: "#F8FAFB", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "#1A2B35" }}><FiX size={18} /></button>
                
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(91,168,160,0.1)", color: "#5BA8A0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <FiLock size={28} />
                </div>
                
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A2B35", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Update Password</h2>
                <p style={{ fontSize: 15, color: "#8BA5B3", marginBottom: 32, lineHeight: 1.5 }}>Secure your account by choosing a strong, unique password.</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
                  <div style={{ position: "relative" }}>
                    <input 
                      type={showOld ? "text" : "password"} placeholder="Current Password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                      style={{ width: "100%", padding: "16px 20px", paddingRight: 50, borderRadius: 16, border: "1px solid #E2EEEC", outline: "none", fontSize: 16, background: "#F8FAFB", transition: "border-color 0.2s" }}
                    />
                    <button onClick={() => setShowOld(!showOld)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8BA5B3", cursor: "pointer" }}>
                      {showOld ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <input 
                      type={showNew ? "text" : "password"} placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)}
                      style={{ width: "100%", padding: "16px 20px", paddingRight: 50, borderRadius: 16, border: "1px solid #E2EEEC", outline: "none", fontSize: 16, background: "#F8FAFB" }}
                    />
                    <button onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8BA5B3", cursor: "pointer" }}>
                      {showNew ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                    </button>
                  </div>

                  <input 
                    type="password" placeholder="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    style={{ width: "100%", padding: "16px 20px", borderRadius: 16, border: "1px solid #E2EEEC", outline: "none", fontSize: 16, background: "#F8FAFB" }}
                  />
                  {newPass && confirmPass && newPass !== confirmPass && (
                    <p style={{ color: "#E8816A", fontSize: 12, fontWeight: 700, margin: "-12px 0 0 4px" }}>Passwords do not match</p>
                  )}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChangePassword} disabled={passLoading || (newPass !== confirmPass && newPass)}
                  style={{ 
                    width: "100%", padding: "18px", borderRadius: 18, border: "none", 
                    background: (passLoading || (newPass !== confirmPass && newPass)) ? "#B8CFCC" : "#5BA8A0", 
                    color: "#fff", fontWeight: 800, fontSize: 16, cursor: (passLoading || (newPass !== confirmPass && newPass)) ? "not-allowed" : "pointer",
                    boxShadow: "0 12px 30px rgba(91,168,160,0.25)",
                    transition: "all 0.3s"
                  }}
                >
                  {passLoading ? "Updating..." : "Update Security"}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}