// AdminDashboard.jsx — SeaBite · Cream & Stone Design System v2
// Fonts: Geist (display/body) + Geist Mono (code)
// Philosophy: cream/stone warmth · featherlight weights · soft blur hover · zero harshness

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  FiShoppingBag, FiUsers, FiDollarSign, FiClock,
  FiArrowUpRight, FiMail, FiTrash2, FiStar,
  FiRefreshCw, FiLock, FiUnlock, FiX,
  FiZap, FiDownload, FiWind, FiDroplet, FiSun,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS — Cream & Stone Coastal v2
// ═══════════════════════════════════════════════════════════
/*
  PALETTE
  ─────────────────────────────────────────────────────────
  bg:          #FAFAF8   warm cream canvas
  surface:     #FFFFFF   pure white cards
  surfaceWarm: #F7F5F0   stone-50 hover wash
  surfaceMid:  #F0EDE6   stone-100 zebra / sections

  border:      rgba(120,113,108,0.12)   near-invisible stone tint
  borderSoft:  rgba(120,113,108,0.07)   ghost dividers

  Teal:        #0D9488  /  light: #F0FDFA  /  mid: #14B8A6
  Sky:         #0284C7  /  light: #F0F9FF
  Purple:      #7C3AED  /  light: #F5F3FF
  Amber:       #B45309  /  light: #FFFBEB
  Coral:       #DC6B52  /  light: #FFF1EE
  Success:     #059669  /  light: #ECFDF5
  Warning:     #D97706  /  light: #FFFBEB
  Danger:      #DC2626  /  light: #FEF2F2

  text:        #1C1917   stone-900 — warm, not cold black
  textMid:     #57534E   stone-600
  textSoft:    #A8A29E   stone-400
  textGhost:   #D6D3D1   stone-300

  SHADOWS (single-tone, ultra-soft)
  sm:   0 1px 2px rgba(28,25,23,0.04)
  md:   0 4px 12px rgba(28,25,23,0.05), 0 1px 3px rgba(28,25,23,0.04)
  lg:   0 8px 28px rgba(28,25,23,0.06)
  warm: 0 4px 24px rgba(13,148,136,0.10)

  TYPOGRAPHY
  Display/UI: Geist 300–700 — airy, modern, zero pretension
  Mono:       Geist Mono   — IDs, numbers, codes

  RADIUS xs:6 sm:10 md:14 lg:18 xl:22 2xl:28

  ANIMATION
  Ease: cubic-bezier(0.22,1,0.36,1)
  Hover: translateY(-1px) + shadow upgrade
  Blur hover: backdrop-filter blur(4–8px) + opacity fade
  Gradient reveal: opacity 0→1 on hover via background transition
*/

const ease = [0.22, 1, 0.36, 1];

const T = {
  bg:          "#FAFAF8",
  surface:     "#FFFFFF",
  surfaceWarm: "#F7F5F0",
  surfaceMid:  "#F0EDE6",
  border:      "rgba(120,113,108,0.12)",
  borderSoft:  "rgba(120,113,108,0.07)",

  teal:    "#0D9488", tealL: "#F0FDFA", tealM: "#14B8A6", tealD: "#0F766E",
  sky:     "#0284C7", skyL:  "#F0F9FF",
  purple:  "#7C3AED", purpleL:"#F5F3FF",
  amber:   "#B45309", amberL: "#FFFBEB",
  coral:   "#DC6B52", coralL: "#FFF1EE",
  success: "#059669", successL:"#ECFDF5",
  warning: "#D97706", warningL:"#FFFBEB",
  danger:  "#DC2626", dangerL: "#FEF2F2",

  text:      "#1C1917",
  textMid:   "#57534E",
  textSoft:  "#A8A29E",
  textGhost: "#D6D3D1",

  shadowSm:   "0 1px 2px rgba(28,25,23,0.04), 0 1px 1px rgba(28,25,23,0.03)",
  shadowMd:   "0 4px 12px rgba(28,25,23,0.05), 0 1px 3px rgba(28,25,23,0.04)",
  shadowLg:   "0 8px 28px rgba(28,25,23,0.06), 0 2px 6px rgba(28,25,23,0.04)",
  shadowWarm: "0 4px 24px rgba(13,148,136,0.12)",
};

const fadeUp = {
  hidden:  { opacity:0, y:12 },
  visible: (i=0) => ({ opacity:1, y:0, transition:{ delay:i*0.055, duration:0.45, ease } }),
};
const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.055 } } };

// ═══════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; }
    @keyframes spin   { to { transform:rotate(360deg); } }
    @keyframes shimmer{ 0%{background-position:-400px 0}100%{background-position:400px 0} }
    .sb { font-family:'Geist',system-ui,-apple-system,sans-serif; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.textGhost}; border-radius:3px; }
    @media(max-width:1100px){ .g4{grid-template-columns:repeat(2,1fr)!important;} .gm{grid-template-columns:1fr!important;} }
    @media(max-width:640px) { .g4{grid-template-columns:1fr!important;} }
  `}</style>
);

// ═══════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════

function Card({ children, style={}, hover=true, topGrad }) {
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
    >
      {topGrad && (
        <div style={{ height:6, background:`linear-gradient(90deg, ${topGrad}60, ${topGrad}20, transparent)` }}/>
      )}
      {children}
    </div>
  );
}

function Chip({ children, color="stone" }) {
  const m = {
    teal:   { bg:T.tealL,   fg:T.teal    },
    sky:    { bg:T.skyL,    fg:T.sky     },
    purple: { bg:T.purpleL, fg:T.purple  },
    amber:  { bg:T.amberL,  fg:T.amber   },
    coral:  { bg:T.coralL,  fg:T.coral   },
    green:  { bg:T.successL,fg:T.success },
    yellow: { bg:T.warningL,fg:T.warning },
    red:    { bg:T.dangerL, fg:T.danger  },
    stone:  { bg:T.surfaceMid, fg:T.textMid },
  };
  const c = m[color] || m.stone;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center",
      background:c.bg, color:c.fg,
      fontSize:10, fontWeight:500,
      letterSpacing:"0.05em", textTransform:"uppercase",
      borderRadius:7, padding:"3px 8px",
    }}>{children}</span>
  );
}

function Toggle({ active, accent=T.teal }) {
  return (
    <div style={{
      width:40, height:22, borderRadius:11,
      background: active ? accent : T.surfaceMid,
      padding:"2px", flexShrink:0,
      transition:"background 0.22s ease",
      display:"flex", alignItems:"center",
      border:`1px solid ${active ? "transparent" : T.border}`,
    }}>
      <div style={{
        width:18, height:18, borderRadius:"50%",
        background:"#FFFFFF",
        boxShadow:"0 1px 3px rgba(28,25,23,0.18)",
        transform: active ? "translateX(18px)" : "translateX(0px)",
        transition:"transform 0.25s cubic-bezier(0.22,1,0.36,1)",
      }}/>
    </div>
  );
}

function GhostBtn({ children, onClick, icon, size="sm" }) {
  const [on, setOn] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding: size==="sm" ? "6px 13px" : "9px 18px",
        fontSize: size==="sm" ? 11 : 12,
        fontWeight:500, fontFamily:"Geist, system-ui",
        borderRadius:9,
        border:`1px solid ${on ? "rgba(120,113,108,0.2)" : T.border}`,
        background: on ? T.surfaceWarm : T.surface,
        color: on ? T.text : T.textMid,
        cursor:"pointer", transition:"all 0.18s ease",
        transform: on ? "translateY(-1px)" : "none",
        boxShadow: on ? T.shadowSm : "none",
      }}
    >{icon}{children}</button>
  );
}

function IconBtn({ children, onClick }) {
  const [on, setOn] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        width:30, height:30, borderRadius:8,
        background: on ? T.surfaceMid : T.surfaceWarm,
        border:`1px solid ${on ? "rgba(120,113,108,0.18)" : T.border}`,
        color:T.textMid, display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", transition:"all 0.18s ease",
        transform: on ? "translateY(-1px)" : "none",
      }}
    >{children}</button>
  );
}

function StatusPill({ status }) {
  const m = {
    Pending:   { bg:"rgba(217,119,6,0.08)",  fg:T.warning, dot:"#F59E0B" },
    Cooking:   { bg:"rgba(2,132,199,0.08)",   fg:T.sky,     dot:T.sky     },
    Ready:     { bg:"rgba(13,148,136,0.08)",  fg:T.teal,    dot:T.teal    },
    Completed: { bg:"rgba(5,150,105,0.08)",   fg:T.success, dot:T.success },
    Cancelled: { bg:"rgba(220,38,38,0.08)",   fg:T.danger,  dot:T.danger  },
  };
  const c = m[status] || { bg:T.surfaceMid, fg:T.textSoft, dot:T.textGhost };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:c.bg, color:c.fg,
      fontSize:10, fontWeight:500,
      letterSpacing:"0.04em", textTransform:"uppercase",
      borderRadius:7, padding:"3px 9px", whiteSpace:"nowrap",
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot, flexShrink:0 }}/>
      {status}
    </span>
  );
}

function SectionHead({ eyebrow, title, action, actionLabel }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16 }}>
      <div>
        {eyebrow && (
          <p style={{ fontSize:9, fontWeight:600, color:T.teal, letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:4 }}>{eyebrow}</p>
        )}
        <h2 style={{ fontSize:15, fontWeight:600, color:T.text, letterSpacing:"-0.01em" }}>{title}</h2>
      </div>
      {action && <GhostBtn onClick={action} icon={<FiArrowUpRight size={12}/>}>{actionLabel}</GhostBtn>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"rgba(255,255,255,0.94)", backdropFilter:"blur(14px)",
      border:`1px solid ${T.border}`, borderRadius:13,
      padding:"10px 14px", boxShadow:T.shadowLg,
    }}>
      <p style={{ fontSize:10, fontWeight:500, color:T.textSoft, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:7 }}>{label}</p>
      {payload.map((p,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:p.color }}/>
          <span style={{ fontSize:14, fontWeight:600, color:T.text }}>
            {p.dataKey==="revenue" ? `₹${Number(p.value).toLocaleString()}` : `${p.value} orders`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════
const Skeleton = () => (
  <div style={{ padding:28, background:T.bg, minHeight:"100vh" }}>
    <GS/>
    <div style={{ maxWidth:1480, margin:"0 auto", display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ width:100, height:10, borderRadius:6, background:T.surfaceMid, animation:"shimmer 1.4s infinite", backgroundSize:"400px", backgroundImage:`linear-gradient(90deg,${T.surfaceMid} 25%,${T.surfaceWarm} 50%,${T.surfaceMid} 75%)` }}/>
          <div style={{ width:210, height:22, borderRadius:9, background:T.surfaceMid, animation:"shimmer 1.4s infinite", backgroundSize:"400px", backgroundImage:`linear-gradient(90deg,${T.surfaceMid} 25%,${T.surfaceWarm} 50%,${T.surfaceMid} 75%)` }}/>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[...Array(4)].map((_,i)=>(
          <div key={i} style={{ height:124, borderRadius:22, border:`1px solid ${T.border}`, background:`linear-gradient(90deg,${T.surface} 25%,${T.surfaceWarm} 50%,${T.surface} 75%)`, backgroundSize:"400px", animation:"shimmer 1.4s infinite" }}/>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16 }}>
        {[360, 360].map((h,i)=>(
          <div key={i} style={{ height:h, borderRadius:22, border:`1px solid ${T.border}`, background:`linear-gradient(90deg,${T.surface} 25%,${T.surfaceWarm} 50%,${T.surface} 75%)`, backgroundSize:"400px", animation:"shimmer 1.4s infinite" }}/>
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
function StatCard({ title, value, icon, trend, trendUp, accent, accentL, sparkData, index }) {
  const [on, setOn] = useState(false);
  return (
    <motion.div variants={fadeUp} custom={index}>
      <div
        onMouseEnter={() => setOn(true)}
        onMouseLeave={() => setOn(false)}
        style={{
          background: on
            ? `linear-gradient(145deg, ${T.surface} 30%, ${accentL} 100%)`
            : T.surface,
          border:`1px solid ${on ? "rgba(120,113,108,0.17)" : T.border}`,
          borderRadius:22, padding:"20px 18px 14px",
          boxShadow: on ? T.shadowMd : T.shadowSm,
          transition:"all 0.32s cubic-bezier(0.22,1,0.36,1)",
          transform: on ? "translateY(-2px)" : "translateY(0)",
          position:"relative", overflow:"hidden",
        }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:accentL, color:accent,
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"transform 0.28s ease",
            transform: on ? "scale(1.08) rotate(-3deg)" : "scale(1) rotate(0deg)",
          }}>{icon}</div>
          <Chip color={trendUp ? "green" : "red"}>{trendUp ? "+" : "−"}{trend}</Chip>
        </div>
        <p style={{ fontSize:10, fontWeight:500, color:T.textSoft, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>{title}</p>
        <h4 style={{ fontSize:24, fontWeight:600, color:T.text, lineHeight:1, letterSpacing:"-0.02em" }}>{value}</h4>

        {sparkData?.length > 1 && (
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:36, opacity: on ? 0.15 : 0.07, pointerEvents:"none", transition:"opacity 0.3s ease" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`sp${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} fill={`url(#sp${index})`} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTROL ROW
// ═══════════════════════════════════════════════════════════
function ControlRow({ icon, label, sub, active, onClick, accent, accentL }) {
  const [on, setOn] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"13px 16px", borderRadius:14,
        border:`1px solid ${active ? `${accent}25` : on ? "rgba(120,113,108,0.16)" : T.border}`,
        background: active
          ? `linear-gradient(135deg, ${accentL} 0%, ${T.surface} 100%)`
          : on ? T.surfaceWarm : T.surface,
        cursor:"pointer",
        transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: active ? `0 2px 10px ${accent}14` : on ? T.shadowSm : T.shadowSm,
        transform: on && !active ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{
          width:34, height:34, borderRadius:9,
          background: active ? accent : T.surfaceMid,
          color: active ? "#FFF" : T.textSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.25s ease",
          transform: on ? "scale(1.06)" : "scale(1)",
        }}>{icon}</div>
        <div>
          <p style={{ fontSize:12, fontWeight:500, color: active ? accent : T.text, marginBottom:2 }}>{label}</p>
          <p style={{ fontSize:10, color:T.textSoft }}>{sub}</p>
        </div>
      </div>
      <Toggle active={active} accent={accent}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BANNER CONTROL
// ═══════════════════════════════════════════════════════════
function BannerControl({ settings, setSettings }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [on, setOn] = useState(false);
  const active = settings.banner?.active;

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return toast.error("Image files only.");
    if (file.size > 5*1024*1024) return toast.error("Max 5 MB.");
    const fd = new FormData(); fd.append("image", file);
    setUploading(true);
    const tid = toast.loading("Uploading banner…");
    try {
      const { data } = await axios.post("/api/upload", fd, { headers:{"Content-Type":"multipart/form-data"}, withCredentials:true });
      const imageUrl = data.file || data.url;
      await axios.put("/api/admin/enterprise/settings", { banner:{ ...settings.banner, imageUrl } }, { withCredentials:true });
      setSettings(p => ({ ...p, banner:{ ...p.banner, imageUrl } }));
      toast.success("Banner uploaded!", { id:tid });
    } catch { toast.error("Upload failed.", { id:tid }); }
    finally { setUploading(false); }
  };

  return (
    <div onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}
      style={{
        borderRadius:14, padding:"13px 16px",
        border:`1px solid ${active ? `${T.sky}25` : on ? "rgba(120,113,108,0.16)" : T.border}`,
        background: active ? `linear-gradient(135deg, ${T.skyL} 0%, ${T.surface} 100%)` : on ? T.surfaceWarm : T.surface,
        transition:"all 0.25s ease",
        boxShadow: active ? `0 2px 10px ${T.sky}14` : T.shadowSm,
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:34, height:34, borderRadius:9, background: active ? T.sky : T.surfaceMid, color: active ? "#FFF" : T.textSoft, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s ease" }}>
            <FiSun size={14}/>
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:500, color: active ? T.sky : T.text, marginBottom:2 }}>Promo Banner</p>
            <p style={{ fontSize:10, color:T.textSoft }}>{active ? "Banner is live" : "Banner is hidden"}</p>
          </div>
        </div>
        <button onClick={async(e) => {
          e.stopPropagation();
          try {
            const next = !active;
            await axios.put("/api/admin/enterprise/settings", { banner:{...settings.banner,active:next} }, { withCredentials:true });
            setSettings(p => ({ ...p, banner:{...p.banner,active:next} }));
            toast.success(next ? "Banner published!" : "Banner hidden.");
          } catch { toast.error("Error updating banner."); }
        }}>
          <Toggle active={active} accent={T.sky}/>
        </button>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          position:"relative", borderRadius:10,
          border:`1.5px dashed ${dragging ? T.teal : T.textGhost}`,
          background: dragging ? T.tealL : T.surfaceWarm,
          padding:10, textAlign:"center",
          transition:"all 0.2s ease", cursor:"pointer", overflow:"hidden",
        }}
      >
        <input type="file" accept="image/*" style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer" }} onChange={e => handleFile(e.target.files[0])}/>
        {uploading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 0" }}>
            <div style={{ width:11, height:11, border:`2px solid ${T.teal}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
            <span style={{ fontSize:10, fontWeight:500, color:T.teal, letterSpacing:"0.04em", textTransform:"uppercase" }}>Uploading…</span>
          </div>
        ) : settings.banner?.imageUrl ? (
          <div style={{ position:"relative" }}>
            <img src={settings.banner.imageUrl} alt="Banner" style={{ height:48, width:"100%", objectFit:"cover", borderRadius:7 }}/>
            <div style={{ position:"absolute", inset:0, background:"rgba(28,25,23,0.38)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:7, backdropFilter:"blur(2px)" }}>
              <span style={{ color:"#FFF", fontSize:10, fontWeight:500 }}>Replace image</span>
            </div>
          </div>
        ) : (
          <div style={{ padding:"9px 0" }}>
            <FiDroplet size={15} style={{ color:T.textGhost, display:"block", margin:"0 auto 5px" }}/>
            <p style={{ fontSize:10, fontWeight:400, color:T.textSoft, letterSpacing:"0.04em", textTransform:"uppercase" }}>Drop image here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OTP MODAL
// ═══════════════════════════════════════════════════════════
function OtpModal({ visible, otp, setOtp, onSubmit, onClose, verifying, pending }) {
  return (
    <AnimatePresence>
      {visible && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{ position:"absolute", inset:0, background:"rgba(28,25,23,0.22)", backdropFilter:"blur(12px)" }}
          />
          <motion.div
            initial={{ opacity:0, scale:0.97, y:14 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.97, y:14 }}
            transition={{ duration:0.3, ease }}
            style={{
              position:"relative", width:"100%", maxWidth:400,
              background:T.surface, borderRadius:28,
              boxShadow:T.shadowLg, border:`1px solid ${T.border}`,
              padding:"34px 30px", overflow:"hidden",
            }}
          >
            {/* Soft warm teal wash at top */}
            <div style={{ position:"absolute", top:0, left:0, right:0, height:110, background:`linear-gradient(180deg,${T.tealL} 0%,transparent 100%)`, pointerEvents:"none" }}/>

            <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:T.surfaceWarm, border:`1px solid ${T.border}`, borderRadius:8, padding:6, color:T.textSoft, cursor:"pointer", display:"flex", zIndex:2 }}>
              <FiX size={14}/>
            </button>

            <div style={{ textAlign:"center", marginBottom:24, position:"relative", zIndex:1 }}>
              <div style={{ width:54, height:54, background:T.tealL, borderRadius:15, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:T.teal }}>
                <FiLock size={20}/>
              </div>
              <h3 style={{ fontSize:17, fontWeight:600, color:T.text, marginBottom:7, letterSpacing:"-0.01em" }}>Confirm Action</h3>
              <p style={{ fontSize:12, color:T.textSoft, lineHeight:1.7, maxWidth:265, margin:"0 auto" }}>
                Enter the 6-digit code sent to your admin email to {pending ? "enable" : "disable"} maintenance mode.
              </p>
            </div>

            <form onSubmit={onSubmit} style={{ position:"relative", zIndex:1 }}>
              <input
                type="text" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="· · · · · ·"
                autoFocus
                style={{
                  width:"100%", padding:"15px 12px",
                  textAlign:"center", fontSize:26, fontWeight:500,
                  letterSpacing:"0.55em", fontFamily:"Geist Mono, monospace",
                  color:T.text, background:T.surfaceWarm,
                  border:`1.5px solid ${otp.length===6 ? T.teal : T.border}`,
                  borderRadius:13, outline:"none",
                  transition:"border-color 0.2s ease",
                  marginBottom:12, boxSizing:"border-box",
                }}
              />
              <button type="submit" disabled={verifying || otp.length!==6}
                style={{
                  width:"100%", padding:"13px",
                  background: otp.length===6 ? T.teal : T.surfaceMid,
                  color: otp.length===6 ? "#FFF" : T.textGhost,
                  border:"none", borderRadius:13,
                  fontSize:12, fontWeight:500,
                  cursor: otp.length===6 && !verifying ? "pointer" : "not-allowed",
                  transition:"all 0.25s ease",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow: otp.length===6 ? T.shadowWarm : "none",
                }}
              >
                {verifying
                  ? <><div style={{ width:12,height:12,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#FFF",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/> Verifying…</>
                  : "Verify & Confirm"
                }
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// ROW COMPONENTS
// ═══════════════════════════════════════════════════════════

function OrderRow({ order, idx, onClick }) {
  const [on, setOn] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"9px 11px", borderRadius:11,
        background: on ? T.surfaceWarm : idx%2===0 ? T.surface : T.bg,
        border:`1px solid ${on ? "rgba(120,113,108,0.13)" : "transparent"}`,
        cursor:"pointer", transition:"all 0.18s ease",
        transform: on ? "translateX(2px)" : "none",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:T.tealL, color:T.teal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:600, fontFamily:"Geist Mono, monospace", flexShrink:0 }}>
          #{order._id.slice(-4)}
        </div>
        <div>
          <p style={{ fontSize:12, fontWeight:500, color:T.text, marginBottom:2 }}>{order.user?.name || "Customer"}</p>
          <p style={{ fontSize:10, color:T.textGhost }}>
            {new Date(order.createdAt).toLocaleDateString("en-IN",{ day:"numeric", month:"short" })}
          </p>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <p style={{ fontSize:13, fontWeight:600, color:T.text, minWidth:60, textAlign:"right", fontFamily:"Geist Mono, monospace" }}>
          ₹{(order.totalAmount||order.totalPrice||0).toLocaleString()}
        </p>
        <StatusPill status={order.status}/>
      </div>
    </div>
  );
}

function MessageRow({ msg, onClick }) {
  const [on, setOn] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        padding:"9px 10px", borderRadius:9,
        background: on ? T.surfaceWarm : "transparent",
        border:`1px solid ${on ? T.border : "transparent"}`,
        cursor:"pointer", transition:"all 0.18s ease", marginBottom:2,
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <p style={{ fontSize:11, fontWeight:500, color:T.text, maxWidth:155, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msg.email}</p>
        <span style={{ fontSize:9, color:T.textGhost }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
      </div>
      <p style={{ fontSize:11, color:T.textSoft, lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontStyle:"italic" }}>"{msg.message}"</p>
    </div>
  );
}

function ReviewRow({ rev, onDelete }) {
  const [on, setOn] = useState(false);
  return (
    <div
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      style={{
        padding:"10px 12px", borderRadius:11,
        background: on ? T.surfaceWarm : T.surface,
        border:`1px solid ${on ? "rgba(120,113,108,0.13)" : T.borderSoft}`,
        transition:"all 0.2s ease", marginBottom:5, position:"relative",
      }}
    >
      <div style={{ display:"flex", gap:2, marginBottom:5 }}>
        {[...Array(5)].map((_,i)=>(
          <FiStar key={i} size={9} style={{ color: i<rev.rating ? "#F59E0B" : T.textGhost, fill: i<rev.rating ? "#F59E0B" : "none" }}/>
        ))}
      </div>
      <p style={{ fontSize:11, color:T.textMid, lineHeight:1.55, marginBottom:7, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontStyle:"italic" }}>
        "{rev.comment}"
      </p>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:10, fontWeight:400, color:T.textSoft }}>{rev.userName}</span>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:9, fontWeight:500, color:T.teal, letterSpacing:"0.02em" }}>{rev.productName}</span>
          {on && (
            <button onClick={e=>{ e.stopPropagation(); onDelete(); }}
              style={{ background:T.dangerL, border:"none", borderRadius:5, padding:"2px 5px", color:T.danger, cursor:"pointer", display:"flex", alignItems:"center" }}>
              <FiTrash2 size={9}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportCard({ icon, title, sub, accent, accentL, onExport }) {
  const [on, setOn] = useState(false);
  return (
    <div onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}
      style={{
        background: on ? `linear-gradient(135deg, ${T.surface} 0%, ${accentL} 100%)` : T.surface,
        border:`1px solid ${on ? "rgba(120,113,108,0.17)" : T.border}`,
        borderRadius:15, padding:"14px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow: on ? T.shadowMd : T.shadowSm,
        transition:"all 0.25s cubic-bezier(0.22,1,0.36,1)",
        transform: on ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:accentL, color:accent, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
        <div>
          <p style={{ fontSize:12, fontWeight:500, color:T.text, marginBottom:2 }}>{title}</p>
          <p style={{ fontSize:10, color:T.textSoft }}>{sub}</p>
        </div>
      </div>
      <button onClick={onExport}
        style={{
          width:32, height:32, borderRadius:9,
          background: on ? accent : accentL,
          color: on ? "#FFF" : accent,
          border:"none", display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", transition:"all 0.2s ease",
          transform: on ? "scale(1.05)" : "scale(1)",
        }}
      ><FiDownload size={13}/></button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("6months");
  const { settings, setSettings } = useOutletContext();

  const [stats, setStats]                   = useState({ totalRevenue:0, totalOrders:0, activeUsers:0, pendingOrders:0 });
  const [graph, setGraph]                   = useState([]);
  const [recentOrders, setRecentOrders]     = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [allReviews, setAllReviews]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [isRefreshing, setIsRefreshing]     = useState(false);
  const [lastUpdated, setLastUpdated]       = useState(null);
  const [showOtp, setShowOtp]               = useState(false);
  const [otp, setOtp]                       = useState("");
  const [pendingMaint, setPendingMaint]     = useState(null);
  const [verifyingOtp, setVerifyingOtp]     = useState(false);

  const fetchData = useCallback(async (manual=false) => {
    if (manual) { setIsRefreshing(true); toast.loading("Refreshing…", { id:"rf" }); }
    try {
      const [dash, msgs, revs] = await Promise.all([
        axios.get("/api/admin", { params:{ range:timeFilter }, withCredentials:true }),
        axios.get("/api/contact", { withCredentials:true }),
        axios.get("/api/admin/reviews/all", { withCredentials:true }),
      ]);
      setStats(dash.data.stats);
      setGraph(dash.data.graph);
      setRecentOrders(dash.data.recentOrders);
      setRecentMessages(msgs.data.slice(0,5));
      setAllReviews(revs.data?.slice(0,6) || []);
      setLoading(false);
      setLastUpdated(new Date());
      if (manual) toast.success("Up to date", { id:"rf" });
    } catch (err) {
      setLoading(false);
      if (err.response?.status===401) navigate("/login");
      if (manual) toast.error("Refresh failed", { id:"rf" });
    } finally { if (manual) setIsRefreshing(false); }
  }, [timeFilter, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const iv = setInterval(()=>fetchData(), 30000); return ()=>clearInterval(iv); }, [fetchData]);

  const requestMaint = async () => {
    setPendingMaint(!settings.isMaintenanceMode);
    const tid = toast.loading("Sending OTP…");
    try {
      await axios.post("/api/admin/maintenance/request-otp", {}, { withCredentials:true });
      toast.success("OTP sent to email", { id:tid });
      setShowOtp(true); setOtp("");
    } catch { toast.error("Failed to send OTP", { id:tid }); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length!==6) return toast.error("Enter a valid 6-digit code");
    setVerifyingOtp(true);
    const tid = toast.loading("Verifying…");
    try {
      const { data } = await axios.post("/api/admin/maintenance/verify", { otp, desiredState:pendingMaint }, { withCredentials:true });
      setSettings(data.settings);
      setShowOtp(false);
      toast.success(data.message, { id:tid });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code", { id:tid });
    } finally { setVerifyingOtp(false); }
  };

  const deleteReview = async (productId, reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials:true });
      fetchData();
    } catch { toast.error("Could not delete."); }
  };

  const exportCSV = async (url, filename, mapper, headers) => {
    const tid = toast.loading("Preparing export…");
    try {
      const { data } = await axios.get(url, { withCredentials:true });
      const csv = [headers, ...data.map(mapper)].map(r=>r.join(",")).join("\n");
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})), download:filename });
      a.click();
      toast.success("Downloaded!", { id:tid });
    } catch { toast.error("Export failed", { id:tid }); }
  };

  const revSpark = graph.slice(-7).map((g,i)=>({ v: g.revenue ?? g.orders*150+i*20 }));
  const ordSpark = graph.slice(-7).map(g=>({ v: g.orders }));

  if (loading) return <Skeleton/>;

  return (
    <>
      <GS/>
      <OtpModal visible={showOtp} otp={otp} setOtp={setOtp} onSubmit={verifyOtp} onClose={()=>setShowOtp(false)} verifying={verifyingOtp} pending={pendingMaint}/>

      <motion.div className="sb" initial="hidden" animate="visible" variants={stagger}
        style={{ minHeight:"100vh", background:T.bg, padding:"28px 28px 56px", color:T.text, maxWidth:1480, margin:"0 auto" }}
      >

        {/* ── HEADER ─────────────────────────────────── */}
        <motion.div variants={fadeUp} custom={0}
          style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}
        >
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
              <span style={{ fontSize:10, fontWeight:500, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase" }}>SeaBite Admin</span>
              <span style={{ width:3, height:3, borderRadius:"50%", background:T.textGhost, display:"inline-block" }}/>
              <span style={{ fontSize:10, color:T.textGhost }}>
                {new Date().toLocaleDateString("en-IN",{ weekday:"long", day:"numeric", month:"long" })}
              </span>
            </div>
            <h1 style={{ fontSize:24, fontWeight:600, color:T.text, lineHeight:1.2, letterSpacing:"-0.02em" }}>Good morning ☀️</h1>
            <p style={{ fontSize:13, color:T.textSoft, marginTop:5, fontWeight:400 }}>Here's what's happening with your store today.</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {lastUpdated && (
              <span style={{ fontSize:10, color:T.textGhost, fontFamily:"Geist Mono, monospace" }}>
                ↻ {lastUpdated.toLocaleTimeString([],{ hour:"2-digit", minute:"2-digit" })}
              </span>
            )}
            <GhostBtn onClick={()=>fetchData(true)}
              icon={<FiRefreshCw size={12} style={{ animation:isRefreshing?"spin 0.7s linear infinite":"none" }}/>}
            >Refresh</GhostBtn>
          </div>
        </motion.div>

        {/* ── STAT CARDS ─────────────────────────────── */}
        <motion.div className="g4" variants={stagger} initial="hidden" animate="visible"
          style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 }}
        >
          <StatCard title="Total Revenue"    value={`₹${(stats.totalRevenue||0).toLocaleString()}`}  icon={<FiDollarSign size={16}/>}  trend="12.5%" trendUp={true}                           accent={T.success} accentL={T.successL} sparkData={revSpark} index={0}/>
          <StatCard title="Total Orders"     value={stats.totalOrders||0}   icon={<FiShoppingBag size={16}/>} trend="8.2%"  trendUp={true}                           accent={T.teal}    accentL={T.tealL}    sparkData={ordSpark} index={1}/>
          <StatCard title="Active Customers" value={stats.activeUsers||0}   icon={<FiUsers size={16}/>}       trend="2.4%"  trendUp={true}                           accent={T.sky}     accentL={T.skyL}     sparkData={[{v:5},{v:12},{v:10},{v:20},{v:18},{v:25},{v:30}]} index={2}/>
          <StatCard title="Pending Orders"   value={stats.pendingOrders||0} icon={<FiClock size={16}/>}       trend={stats.pendingOrders>5?"High":"Stable"} trendUp={stats.pendingOrders<5} accent={T.warning} accentL={T.warningL} sparkData={[]} index={3}/>
        </motion.div>

        {/* ── CHART + CONTROLS ───────────────────────── */}
        <div className="gm" style={{ display:"grid", gridTemplateColumns:"1fr 306px", gap:16, marginBottom:16 }}>

          <motion.div variants={fadeUp} custom={4}>
            <Card hover={false} style={{ height:"100%" }}>
              {/* Subtle top-wash — cream teal gradient in header area */}
              <div style={{ padding:"20px 22px 6px", background:`linear-gradient(180deg,${T.tealL} 0%,${T.surface} 55%)` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                  <div>
                    <p style={{ fontSize:9, fontWeight:500, color:T.textSoft, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>Overview</p>
                    <h3 style={{ fontSize:14, fontWeight:600, color:T.text, letterSpacing:"-0.01em" }}>Revenue Analytics</h3>
                  </div>
                  <div style={{ display:"flex", background:T.surfaceWarm, borderRadius:8, padding:"2px", border:`1px solid ${T.border}` }}>
                    {["6months","1year"].map(f=>(
                      <button key={f} onClick={()=>setTimeFilter(f)} style={{
                        padding:"5px 12px", borderRadius:7, fontSize:10, fontWeight:500,
                        letterSpacing:"0.04em", textTransform:"uppercase",
                        border:"none", cursor:"pointer",
                        background: timeFilter===f ? T.surface : "transparent",
                        color: timeFilter===f ? T.teal : T.textSoft,
                        boxShadow: timeFilter===f ? T.shadowSm : "none",
                        transition:"all 0.18s ease",
                      }}>{f==="6months"?"6 mo":"1 yr"}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ height:248, padding:"0 10px 20px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graph} margin={{ top:8, right:18, left:0, bottom:0 }}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={T.teal} stopOpacity={0.11}/>
                        <stop offset="100%" stopColor={T.teal} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" horizontal={true} vertical={false} stroke={T.borderSoft}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:10, fontWeight:400, fill:T.textGhost }} dy={10}/>
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10, fontWeight:400, fill:T.textGhost }} tickFormatter={v=>`₹${v/1000}k`} width={46}/>
                    <Tooltip content={<ChartTooltip/>} cursor={{ stroke:T.border, strokeWidth:1, strokeDasharray:"4 4" }}/>
                    <Area type="monotone" dataKey="revenue" stroke={T.teal} strokeWidth={1.8} fill="url(#rg)" dot={false} activeDot={{ r:4, fill:T.teal, strokeWidth:0 }} animationDuration={1200}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} custom={5} style={{ display:"flex", flexDirection:"column", gap:9 }}>
            <ControlRow
              icon={settings.isMaintenanceMode ? <FiLock size={14}/> : <FiUnlock size={14}/>}
              label={settings.isMaintenanceMode ? "Maintenance On" : "Maintenance Off"}
              sub={settings.isMaintenanceMode ? "Store locked for visitors." : "Store is live and open."}
              active={settings.isMaintenanceMode}
              onClick={requestMaint}
              accent={T.danger} accentL={T.dangerL}
            />
            <ControlRow
              icon={settings.globalDiscount>0 ? <FiZap size={14}/> : <FiWind size={14}/>}
              label={settings.globalDiscount>0 ? "Happy Hour On" : "Happy Hour Off"}
              sub={settings.globalDiscount>0 ? "−10% global discount active." : "Standard pricing."}
              active={settings.globalDiscount>0}
              onClick={async()=>{
                try {
                  const nd = settings.globalDiscount>0 ? 0 : 10;
                  await axios.put("/api/admin/enterprise/settings", { globalDiscount:nd }, { withCredentials:true });
                  setSettings(p=>({ ...p, globalDiscount:nd }));
                  toast.success(nd>0 ? "Happy Hour on! ⚡" : "Happy Hour ended.");
                } catch { toast.error("Update failed."); }
              }}
              accent={T.purple} accentL={T.purpleL}
            />
            <BannerControl settings={settings} setSettings={setSettings}/>
          </motion.div>
        </div>

        {/* ── ORDERS + MESSAGES/REVIEWS ──────────────── */}
        <div className="gm" style={{ display:"grid", gridTemplateColumns:"1fr 306px", gap:16, marginBottom:16 }}>

          <motion.div variants={fadeUp} custom={6}>
            <Card hover={false} style={{ height:"100%" }}>
              <div style={{ padding:"18px 20px 13px", borderBottom:`1px solid ${T.borderSoft}` }}>
                <SectionHead eyebrow="Live traffic" title="Recent Orders" action={()=>navigate("/admin/orders")} actionLabel="View all"/>
              </div>
              <div style={{ padding:"8px 13px 14px" }}>
                {recentOrders.length===0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0" }}>
                    <FiDroplet size={22} style={{ color:T.textGhost, display:"block", margin:"0 auto 9px" }}/>
                    <p style={{ fontSize:11, color:T.textGhost, fontWeight:400, letterSpacing:"0.05em", textTransform:"uppercase" }}>No orders yet</p>
                  </div>
                ) : recentOrders.map((o,i)=><OrderRow key={o._id} order={o} idx={i} onClick={()=>navigate("/admin/orders")}/>)}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} custom={7} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Card hover={false} style={{ display:"flex", flexDirection:"column", flex:1 }}>
              <div style={{ padding:"14px 16px 11px", borderBottom:`1px solid ${T.borderSoft}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                <div>
                  <p style={{ fontSize:9, fontWeight:500, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>Inbox</p>
                  <h3 style={{ fontSize:13, fontWeight:600, color:T.text }}>Inquiries</h3>
                </div>
                <IconBtn onClick={()=>navigate("/admin/messages")}><FiMail size={12}/></IconBtn>
              </div>
              <div style={{ overflowY:"auto", padding:"8px 12px", maxHeight:220 }}>
                {recentMessages.length===0
                  ? <p style={{ textAlign:"center", padding:"22px 0", fontSize:11, color:T.textGhost, fontWeight:400 }}>Inbox empty</p>
                  : recentMessages.map(m=><MessageRow key={m._id} msg={m} onClick={()=>navigate("/admin/messages")}/>)
                }
              </div>
            </Card>

            <Card hover={false} style={{ display:"flex", flexDirection:"column", flex:1 }}>
              <div style={{ padding:"14px 16px 11px", borderBottom:`1px solid ${T.borderSoft}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
                <div>
                  <p style={{ fontSize:9, fontWeight:500, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>Feedback</p>
                  <h3 style={{ fontSize:13, fontWeight:600, color:T.text }}>Reviews</h3>
                </div>
                <Chip color="teal">{allReviews.length}</Chip>
              </div>
              <div style={{ overflowY:"auto", padding:"8px 12px", maxHeight:220 }}>
                {allReviews.length===0
                  ? <p style={{ textAlign:"center", padding:"22px 0", fontSize:11, color:T.textGhost, fontWeight:400 }}>No reviews yet</p>
                  : allReviews.map(r=><ReviewRow key={r._id} rev={r} onDelete={()=>deleteReview(r.productId,r._id)}/>)
                }
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── EXPORTS ────────────────────────────────── */}
        <motion.div variants={fadeUp} custom={8}>
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:9, fontWeight:500, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:3 }}>Data</p>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.text }}>Export Reports</h3>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
            <ExportCard
              icon={<FiDollarSign size={14}/>} title="Sales Report" sub="Export all orders to CSV"
              accent={T.success} accentL={T.successL}
              onExport={()=>exportCSV("/api/orders",`sales_${new Date().toISOString().split("T")[0]}.csv`,
                o=>[o.orderId||o._id,new Date(o.createdAt).toLocaleDateString(),o.user?.name||"Guest",o.user?.email||"N/A",o.items?.map(i=>`${i.name}(x${i.qty})`).join(";"),o.totalAmount,o.status,o.paymentMethod],
                ["Order ID","Date","Customer","Email","Items","Total","Status","Payment"])}
            />
            <ExportCard
              icon={<FiUsers size={14}/>} title="Customer Data" sub="Export user list & CLV"
              accent={T.sky} accentL={T.skyL}
              onExport={()=>exportCSV("/api/admin/users/intelligence",`customers_${new Date().toISOString().split("T")[0]}.csv`,
                u=>[u._id,u.name,u.email,u.role,new Date(u.createdAt).toLocaleDateString(),u.intelligence?.totalSpent||0,u.intelligence?.orderCount||0],
                ["ID","Name","Email","Role","Joined","Spent","Orders"])}
            />
          </div>
        </motion.div>

      </motion.div>
    </>
  );
}