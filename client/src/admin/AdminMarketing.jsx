// AdminMarketing.jsx — SeaBite · Cream & Stone Design System v2
// Email campaign composer with refined aesthetics

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail, FiSend, FiUsers, FiCheck, FiX, FiSearch, FiTarget, FiZap, FiArrowUpRight
} from "react-icons/fi";
import toast from "react-hot-toast";

const ease = [0.22, 1, 0.36, 1];

const T = {
  bg:          "#FAFAF8",
  surface:     "#FFFFFF",
  surfaceWarm: "#F7F5F0",
  surfaceMid:  "#F0EDE6",
  border:      "rgba(120,113,108,0.12)",
  borderSoft:  "rgba(120,113,108,0.07)",
  teal:    "#0D9488", tealL: "#F0FDFA",
  sky:     "#0284C7", skyL:  "#F0F9FF",
  purple:  "#7C3AED", purpleL:"#F5F3FF",
  warning: "#D97706", warningL:"#FFFBEB",
  text:      "#1C1917",
  textMid:   "#57534E",
  textSoft:  "#A8A29E",
  textGhost: "#D6D3D1",
  shadowSm:   "0 1px 2px rgba(28,25,23,0.04), 0 1px 1px rgba(28,25,23,0.03)",
  shadowMd:   "0 4px 12px rgba(28,25,23,0.05), 0 1px 3px rgba(28,25,23,0.04)",
};

const fadeUp = {
  hidden:  { opacity:0, y:12 },
  visible: (i=0) => ({ opacity:1, y:0, transition:{ delay:i*0.055, duration:0.45, ease } }),
};
const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.055 } } };

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; }
    .sb { font-family:'Geist',system-ui,-apple-system,sans-serif; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.textGhost}; border-radius:3px; }
  `}</style>
);

function Card({ children, style={}, hover=true }) {
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

function Chip({ children, color="stone" }) {
  const m = { teal:{bg:T.tealL,fg:T.teal}, sky:{bg:T.skyL,fg:T.sky}, purple:{bg:T.purpleL,fg:T.purple} };
  const c = m[color] || { bg:T.surfaceMid, fg:T.textMid };
  return <span style={{ display:"inline-flex", alignItems:"center", background:c.bg, color:c.fg, fontSize:10, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", borderRadius:7, padding:"3px 8px" }}>{children}</span>;
}

function GhostBtn({ children, onClick, icon }) {
  const [on, setOn] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"8px 14px", fontSize:11, fontWeight:500, fontFamily:"Geist, system-ui",
        borderRadius:9, border:`1px solid ${on ? "rgba(120,113,108,0.2)" : T.border}`,
        background: on ? T.surfaceWarm : T.surface,
        color: on ? T.text : T.textMid,
        cursor:"pointer", transition:"all 0.18s ease",
        transform: on ? "translateY(-1px)" : "none",
        boxShadow: on ? T.shadowSm : "none",
      }}
    >{icon}{children}</button>
  );
}

function InputField({ label, value, onChange, placeholder, rows, type="text" }) {
  const [on, setOn] = useState(false);
  const Component = rows ? 'textarea' : 'input';
  return (
    <div>
      <label style={{ display:"block", fontSize:10, fontWeight:500, color:T.textSoft, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:8 }}>
        {label}
      </label>
      <Component
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setOn(true)}
        onBlur={() => setOn(false)}
        style={{
          width:"100%",
          padding:"12px 14px",
          background: on ? T.surface : T.surfaceWarm,
          border: `1.5px solid ${on ? T.teal : T.border}`,
          borderRadius:11,
          fontSize:13,
          fontWeight:500,
          fontFamily: "Geist, system-ui",
          color:T.text,
          outline:"none",
          transition:"all 0.2s ease",
          boxShadow: on ? `0 0 0 3px ${T.tealL}` : "none",
          resize: rows ? "vertical" : "none",
        }}
      />
    </div>
  );
}

export default function AdminMarketing() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [targetMode, setTargetMode] = useState("all");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (targetMode === "select" && users.length === 0) fetchUsers();
  }, [targetMode, users.length]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data } = await axios.get("/api/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load users"); }
    finally { setIsLoadingUsers(false); }
  };

  const toggleUser = (id) => {
    const ns = new Set(selectedUsers);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelectedUsers(ns);
  };

  const toggleAll = () => {
    selectedUsers.size === filteredUsers.length ? setSelectedUsers(new Set()) : setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return toast.error("Subject and message required");
    if (targetMode === "select" && selectedUsers.size === 0) return toast.error("Select at least one user");

    const confirmMsg = targetMode === "all" ? "Send to all users?" : `Send to ${selectedUsers.size} users?`;
    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    const tid = toast.loading("Sending…");
    try {
      const { data } = await axios.post("/api/admin/marketing/email-blast", {
        subject, message,
        recipients: targetMode === "select" ? Array.from(selectedUsers) : []
      }, { withCredentials: true });
      toast.success(data.message, { id: tid });
      setSubject(""); setMessage(""); setSelectedUsers(new Set()); setTargetMode("all");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed", { id: tid });
    } finally { setSending(false); }
  };

  return (
    <>
      <GS />
      <motion.div className="sb" initial="hidden" animate="visible" variants={stagger}
        style={{ minHeight:"100vh", background:T.bg, padding:"28px", maxWidth:1200, margin:"0 auto", color:T.text }}
      >
        {/* ── HEADER ─────────────────────────────────── */}
        <motion.div variants={fadeUp} style={{ marginBottom:28, borderBottom:`1px solid ${T.borderSoft}`, paddingBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <FiTarget size={14} style={{ color:T.teal }}/>
            <span style={{ fontSize:10, fontWeight:500, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase" }}>Campaigns</span>
          </div>
          <h1 style={{ fontSize:24, fontWeight:600, color:T.text, letterSpacing:"-0.02em", marginBottom:6 }}>Email Marketing</h1>
          <p style={{ fontSize:13, color:T.textSoft, fontWeight:400 }}>Design meaningful connections with your audience</p>
        </motion.div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>
          {/* ── COMPOSER ────────────────────────────────── */}
          <motion.div variants={fadeUp} custom={1}>
            <Card hover={false}>
              <div style={{ padding:"24px" }}>
                {/* Audience Toggle */}
                <div style={{ marginBottom:22 }}>
                  <label style={{ display:"block", fontSize:10, fontWeight:500, color:T.teal, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Target Audience</label>
                  <div style={{ display:"flex", background:T.surfaceWarm, borderRadius:10, padding:"4px", border:`1px solid ${T.border}`, width:"fit-content", gap:2 }}>
                    <button onClick={() => setTargetMode("all")}
                      style={{
                        padding:"8px 16px", borderRadius:8, fontSize:11, fontWeight:500,
                        letterSpacing:"0.04em", textTransform:"uppercase",
                        border:"none", cursor:"pointer",
                        background: targetMode==="all" ? T.surface : "transparent",
                        color: targetMode==="all" ? T.teal : T.textSoft,
                        boxShadow: targetMode==="all" ? T.shadowSm : "none",
                        transition:"all 0.18s ease",
                      }}
                    >All Users</button>
                    <button onClick={() => { setTargetMode("select"); setShowUserModal(true); }}
                      style={{
                        padding:"8px 16px", borderRadius:8, fontSize:11, fontWeight:500,
                        letterSpacing:"0.04em", textTransform:"uppercase",
                        border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                        background: targetMode==="select" ? T.surface : "transparent",
                        color: targetMode==="select" ? T.teal : T.textSoft,
                        boxShadow: targetMode==="select" ? T.shadowSm : "none",
                        transition:"all 0.18s ease",
                      }}
                    >
                      Select
                      {selectedUsers.size > 0 && (
                        <span style={{ background:T.teal, color:"#FFF", fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:4 }}>{selectedUsers.size}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Inputs */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <InputField label="Subject" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Write something catchy…"/>
                  <div>
                    <InputField label="Message" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Craft your message here…" rows={9}/>
                    <p style={{ fontSize:10, color:T.textGhost, marginTop:6, textAlign:"right", fontFamily:"Geist Mono, monospace" }}>{message.length} chars</p>
                  </div>
                </div>

                <button onClick={handleSend} disabled={sending}
                  style={{
                    width:"100%", marginTop:24, padding:"13px",
                    background: sending ? T.surfaceMid : T.teal,
                    color: sending ? T.textGhost : "#FFF",
                    border:"none", borderRadius:11, fontSize:12, fontWeight:600,
                    letterSpacing:"0.04em", textTransform:"uppercase",
                    cursor: sending ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    transition:"all 0.25s ease",
                    boxShadow: sending ? "none" : `0 4px 12px rgba(13,148,136,0.2)`,
                  }}
                >
                  {sending ? (
                    <><div style={{ width:11, height:11, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#FFF", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/> Sending…</>
                  ) : (
                    <><FiSend size={13}/> Send Campaign</>
                  )}
                </button>
              </div>
            </Card>
          </motion.div>

          {/* ── TIPS SIDEBAR ────────────────────────────── */}
          <motion.div variants={fadeUp} custom={2}>
            <Card hover={false} style={{ background:`linear-gradient(135deg, ${T.surfaceWarm} 0%, ${T.surface} 100%)`, height:"100%" }}>
              <div style={{ padding:"18px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <FiZap size={14} style={{ color:T.teal }}/>
                  <h3 style={{ fontSize:12, fontWeight:600, color:T.text }}>Pro Tips</h3>
                </div>
                <ul style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    "Keep subject under 60 chars for mobile",
                    "Personalize for higher engagement",
                    "Test send to sample first",
                    "Best times: Tue-Thu 10am-2pm"
                  ].map((tip, i) => (
                    <li key={i} style={{ display:"flex", gap:8, fontSize:11, color:T.textSoft, lineHeight:1.5 }}>
                      <span style={{ color:T.textGhost, marginTop:2 }}>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── USER SELECTION MODAL ────────────────────── */}
        <AnimatePresence>
          {showUserModal && (
            <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setShowUserModal(false)}
                style={{ position:"absolute", inset:0, background:"rgba(28,25,23,0.22)", backdropFilter:"blur(12px)" }}
              />
              <motion.div
                initial={{ opacity:0, scale:0.97, y:14 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.97, y:14 }}
                transition={{ duration:0.3, ease }}
                style={{
                  position:"relative", width:"100%", maxWidth:520,
                  background:T.surface, borderRadius:22,
                  boxShadow:T.shadowLg, border:`1px solid ${T.border}`,
                  overflow:"hidden", maxHeight:"85vh", display:"flex", flexDirection:"column",
                }}
              >
                {/* Header */}
                <div style={{ padding:"18px 20px", borderBottom:`1px solid ${T.borderSoft}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                  <div>
                    <h3 style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:3 }}>Select Recipients</h3>
                    <p style={{ fontSize:11, color:T.textSoft }}>Target specific customers</p>
                  </div>
                  <button onClick={() => setShowUserModal(false)} style={{ background:T.surfaceWarm, border:`1px solid ${T.border}`, borderRadius:8, padding:6, color:T.textSoft, cursor:"pointer", display:"flex" }}>
                    <FiX size={16}/>
                  </button>
                </div>

                {/* Search */}
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.borderSoft}`, flexShrink:0 }}>
                  <div style={{ position:"relative" }}>
                    <FiSearch style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textGhost, pointerEvents:"none" }} size={14}/>
                    <input
                      placeholder="Search by name or email…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width:"100%", paddingLeft:32, padding:"10px 12px 10px 32px",
                        background:T.surfaceWarm, border:`1px solid ${T.border}`, borderRadius:10,
                        fontSize:12, fontWeight:500, fontFamily:"Geist, system-ui",
                        color:T.text, outline:"none", transition:"all 0.2s ease",
                      }}
                      onFocus={e => e.target.style.background = T.surface}
                      onBlur={e => e.target.style.background = T.surfaceWarm}
                    />
                  </div>
                </div>

                {/* User List */}
                <div style={{ overflowY:"auto", flex:1, padding:"8px 12px" }}>
                  {isLoadingUsers ? (
                    <p style={{ textAlign:"center", padding:"20px", fontSize:11, color:T.textGhost }}>Loading…</p>
                  ) : (
                    <>
                      {/* Select All */}
                      <div onClick={toggleAll}
                        style={{
                          display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                          borderRadius:10, cursor:"pointer", transition:"all 0.18s ease",
                          background: selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? T.surfaceWarm : "transparent",
                          marginBottom:4,
                        }}
                      >
                        <div style={{
                          width:18, height:18, borderRadius:6, border:`2px solid ${selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? T.teal : T.border}`,
                          background: selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? T.teal : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s ease",
                        }}>
                          {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 && <FiCheck size={12} style={{ color:"#FFF" }}/>}
                        </div>
                        <span style={{ fontSize:11, fontWeight:500, color:T.text }}>Select All ({filteredUsers.length})</span>
                      </div>

                      {/* Users */}
                      {filteredUsers.map(user => (
                        <div key={user._id} onClick={() => toggleUser(user._id)}
                          style={{
                            display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                            borderRadius:10, cursor:"pointer", transition:"all 0.18s ease",
                            background: selectedUsers.has(user._id) ? T.surfaceWarm : "transparent",
                            marginBottom:2,
                          }}
                        >
                          <div style={{
                            width:18, height:18, borderRadius:6, border:`2px solid ${selectedUsers.has(user._id) ? T.teal : T.border}`,
                            background: selectedUsers.has(user._id) ? T.teal : "transparent",
                            display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.18s ease",
                          }}>
                            {selectedUsers.has(user._id) && <FiCheck size={12} style={{ color:"#FFF" }}/>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:11, fontWeight:500, color:T.text }}>{user.name}</p>
                            <p style={{ fontSize:10, color:T.textGhost, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</p>
                          </div>
                        </div>
                      ))}

                      {filteredUsers.length === 0 && (
                        <p style={{ textAlign:"center", padding:"20px", fontSize:11, color:T.textGhost }}>No users found</p>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.borderSoft}`, background:T.surfaceWarm, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                  <span style={{ fontSize:11, fontWeight:500, color:T.textSoft }}>{selectedUsers.size} selected</span>
                  <button onClick={() => setShowUserModal(false)}
                    style={{
                      padding:"8px 16px", background:T.teal, color:"#FFF",
                      border:"none", borderRadius:9, fontSize:11, fontWeight:600,
                      cursor:"pointer", transition:"all 0.18s ease",
                    }}
                  >Done</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
