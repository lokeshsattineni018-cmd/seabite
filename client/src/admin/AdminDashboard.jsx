// AdminDashboard.jsx — SeaBite · Coastal Morning Design System
// Font: Manrope (display) + DM Sans (body) — loaded via @import in index.css or index.html

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  FiShoppingBag, FiUsers, FiTrendingUp, FiActivity,
  FiDollarSign, FiCalendar, FiMail, FiTrash2, FiStar,
  FiArrowUpRight, FiArrowDownRight, FiClock, FiEye,
  FiRefreshCw, FiMoreHorizontal, FiPackage, FiSettings, FiSearch,
  FiAlertCircle, FiPower, FiCheckCircle, FiLock, FiUnlock, FiX,
  FiZap, FiDownload, FiWind, FiDroplet, FiSun, FiBell,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// DESIGN SYSTEM — SeaBite Coastal Tokens
// ─────────────────────────────────────────────
/*
  TYPOGRAPHY
    Display:  Manrope (500/600/700/800)
    Body:     DM Sans (400/500)
    Mono:     JetBrains Mono (for IDs, codes)

  COLORS
    Background:    #F5F8FC   (coastal dawn sky)
    Surface:       #FFFFFF   (white foam)
    SurfaceAlt:    #F0F5FB   (sea glass wash)
    Border:        #E2EAF4   (shoreline haze)
    BorderSubtle:  #EDF2F9

    Primary:       #0B8F7F   (deep seafoam teal)
    PrimaryLight:  #E6F5F3   (seafoam mist)
    PrimaryMid:    #12A898   (active seafoam)

    Sky:           #3B82C4   (sky blue, calm)
    SkyLight:      #EBF3FC

    Sand:          #B68D5D   (warm sand)
    SandLight:     #FBF5ED

    Coral:         #D96B52   (sunrise coral — CTAs, alerts)
    CoralLight:    #FDEEE9

    Success:       #2A9D6E
    SuccessLight:  #E6F5EE
    Warning:       #C9883A
    WarningLight:  #FDF3E3
    Danger:        #C84B4B
    DangerLight:   #FDE8E8

    Text:          #18283D   (deep ocean)
    TextMid:       #4B607C   (mid-tide)
    TextSoft:      #8898B3   (sea mist)
    TextGhost:     #B8C8DA

  SPACING (4px base)
    xs:  4px    sm:  8px    md: 16px
    lg:  24px   xl:  32px   2xl: 48px

  RADIUS
    sm: 8px    md: 12px    lg: 16px    xl: 20px    2xl: 24px

  SHADOW
    sm:  0 1px 3px rgba(11,143,127,0.05), 0 1px 2px rgba(0,0,0,0.04)
    md:  0 4px 16px rgba(11,143,127,0.07), 0 1px 4px rgba(0,0,0,0.04)
    lg:  0 8px 32px rgba(11,143,127,0.09), 0 2px 8px rgba(0,0,0,0.04)
    glow: 0 0 0 3px rgba(11,143,127,0.12)

  ANIMATION
    Easing: cubic-bezier(0.22, 1, 0.36, 1)   (swift settle)
    Duration: 0.4s–0.6s for enter, 0.2s for hover
    Hover lift: translateY(-2px)
    Hover glow: box-shadow 0 0 0 3px rgba(11,143,127,0.12)
*/

const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// ─────────────────────────────────────────────
// ANIMATION CONFIG
// ─────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
};

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse space-y-8 p-6">
    <div className="flex justify-between items-end">
      <div className="space-y-2.5">
        <div className="h-7 w-56 rounded-xl" style={{ background: "#E2EAF4" }} />
        <div className="h-4 w-36 rounded-lg" style={{ background: "#EDF2F9" }} />
      </div>
      <div className="h-9 w-28 rounded-xl" style={{ background: "#E2EAF4" }} />
    </div>
    <div className="grid grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E2EAF4" }} />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 h-96 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E2EAF4" }} />
      <div className="h-96 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E2EAF4" }} />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// DESIGN TOKENS (inline style helpers)
// ─────────────────────────────────────────────
const T = {
  bg: "#F5F8FC",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F5FB",
  border: "#E2EAF4",
  borderSubtle: "#EDF2F9",

  primary: "#0B8F7F",
  primaryLight: "#E6F5F3",
  primaryMid: "#12A898",

  sky: "#3B82C4",
  skyLight: "#EBF3FC",

  coral: "#D96B52",
  coralLight: "#FDEEE9",

  sand: "#B68D5D",
  sandLight: "#FBF5ED",

  success: "#2A9D6E",
  successLight: "#E6F5EE",
  warning: "#C9883A",
  warningLight: "#FDF3E3",
  danger: "#C84B4B",
  dangerLight: "#FDE8E8",

  text: "#18283D",
  textMid: "#4B607C",
  textSoft: "#8898B3",
  textGhost: "#B8C8DA",

  shadowSm: "0 1px 3px rgba(11,143,127,0.05), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(11,143,127,0.07), 0 1px 4px rgba(0,0,0,0.04)",
  shadowLg: "0 8px 32px rgba(11,143,127,0.09), 0 2px 8px rgba(0,0,0,0.04)",
};

// ─────────────────────────────────────────────
// REUSABLE CARD
// ─────────────────────────────────────────────
function Card({ children, className = "", style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? "#CBD8EC" : T.border}`,
        borderRadius: 20,
        boxShadow: hovered ? T.shadowMd : T.shadowSm,
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        transform: hovered ? "translateY(-1px)" : "translateY(0px)",
        ...style,
      }}
      className={`overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────
function Badge({ children, color = "primary" }) {
  const map = {
    primary: { bg: T.primaryLight, color: T.primary },
    sky: { bg: T.skyLight, color: T.sky },
    coral: { bg: T.coralLight, color: T.coral },
    sand: { bg: T.sandLight, color: T.sand },
    success: { bg: T.successLight, color: T.success },
    warning: { bg: T.warningLight, color: T.warning },
    danger: { bg: T.dangerLight, color: T.danger },
    ghost: { bg: T.surfaceAlt, color: T.textSoft },
  };
  const c = map[color] || map.ghost;
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: 8,
        padding: "3px 8px",
        fontFamily: "Manrope, sans-serif",
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────
function Btn({ children, variant = "primary", size = "md", onClick, disabled = false, icon, className = "" }) {
  const [hovered, setHovered] = useState(false);
  const variants = {
    primary: {
      bg: hovered ? T.primaryMid : T.primary,
      color: "#FFFFFF",
      border: "none",
      shadow: hovered ? `0 4px 16px rgba(11,143,127,0.3), 0 0 0 3px rgba(11,143,127,0.12)` : T.shadowSm,
    },
    ghost: {
      bg: hovered ? T.surfaceAlt : "transparent",
      color: T.textMid,
      border: `1px solid ${hovered ? "#CBD8EC" : T.border}`,
      shadow: "none",
    },
    coral: {
      bg: hovered ? "#C05A42" : T.coral,
      color: "#FFFFFF",
      border: "none",
      shadow: hovered ? `0 4px 16px rgba(217,107,82,0.3)` : T.shadowSm,
    },
  };
  const sizes = {
    sm: { padding: "6px 14px", fontSize: 11, borderRadius: 10 },
    md: { padding: "9px 20px", fontSize: 12, borderRadius: 12 },
    lg: { padding: "12px 28px", fontSize: 13, borderRadius: 14 },
  };
  const v = variants[variant] || variants.ghost;
  const s = sizes[size] || sizes.md;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...v,
        ...s,
        fontFamily: "Manrope, sans-serif",
        fontWeight: 600,
        letterSpacing: "0.01em",
        transition: "all 0.22s cubic-bezier(0.22,1,0.36,1)",
        transform: hovered && !disabled ? "translateY(-1px)" : "translateY(0px)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
      }}
      className={className}
    >
      {icon && icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// TOGGLE SWITCH
// ─────────────────────────────────────────────
function Toggle({ active, color = T.primary }) {
  return (
    <div
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: active ? color : "#D8E4F0",
        padding: 3,
        transition: "background 0.25s ease",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          transform: active ? "translateX(20px)" : "translateX(0px)",
          transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    Pending:   { bg: T.warningLight, color: T.warning },
    Cooking:   { bg: T.skyLight,     color: T.sky },
    Ready:     { bg: T.primaryLight, color: T.primary },
    Completed: { bg: T.successLight, color: T.success },
    Cancelled: { bg: T.dangerLight,  color: T.danger },
  };
  const c = map[status] || { bg: T.surfaceAlt, color: T.textSoft };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: 8,
        padding: "4px 10px",
        fontFamily: "Manrope, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// CHART TOOLTIP
// ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: T.shadowLg,
        fontFamily: "Manrope, sans-serif",
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, color: T.textSoft, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
            {p.dataKey === "revenue" ? `₹${Number(p.value).toLocaleString()}` : `${p.value} orders`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
function StatCard({ title, value, icon, trend, trendUp, accentColor, accentLight, sparkData, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div variants={fadeUp} custom={index}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: T.surface,
          border: `1px solid ${hovered ? "#CBD8EC" : T.border}`,
          borderRadius: 20,
          padding: "22px 22px 16px",
          boxShadow: hovered ? T.shadowMd : T.shadowSm,
          transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
          transform: hovered ? "translateY(-2px)" : "translateY(0px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: accentLight,
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
          <Badge color={trendUp ? "success" : "danger"}>
            {trendUp ? "▲" : "▼"} {trend}
          </Badge>
        </div>

        {/* Value */}
        <p style={{ fontSize: 11, fontWeight: 600, color: T.textSoft, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 4 }}>{title}</p>
        <h4 style={{ fontSize: 26, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif", lineHeight: 1 }}>{value}</h4>

        {/* Sparkline overlay */}
        {sparkData?.length > 1 && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, opacity: 0.15, pointerEvents: "none" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={accentColor} strokeWidth={2} fill={`url(#spark-${index})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CONTROL TOGGLE ROW (Maintenance, Happy Hour)
// ─────────────────────────────────────────────
function ControlRow({ icon, label, sublabel, active, onClick, accentColor, accentLight }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderRadius: 16,
        border: `1px solid ${active ? accentColor + "30" : T.border}`,
        background: active ? accentLight : hovered ? T.surfaceAlt : T.surface,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: active ? `0 2px 12px ${accentColor}18` : T.shadowSm,
        transform: hovered ? "translateY(-1px)" : "translateY(0px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: active ? accentColor : T.surfaceAlt, color: active ? "#FFF" : T.textSoft, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease" }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: active ? accentColor : T.text, fontFamily: "Manrope, sans-serif", letterSpacing: "0.01em" }}>{label}</p>
          <p style={{ fontSize: 10, color: T.textSoft, marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>{sublabel}</p>
        </div>
      </div>
      <Toggle active={active} color={accentColor} />
    </div>
  );
}

// ─────────────────────────────────────────────
// BANNER CONTROL
// ─────────────────────────────────────────────
function BannerControl({ settings, setSettings }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (Max 5MB).");
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    const toastId = toast.loading("Uploading banner...");
    try {
      const res = await axios.post("/api/upload", formData, { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true });
      const imageUrl = res.data.file || res.data.url;
      await axios.put("/api/admin/enterprise/settings", { banner: { ...settings.banner, imageUrl } }, { withCredentials: true });
      setSettings(prev => ({ ...prev, banner: { ...prev.banner, imageUrl } }));
      toast.success("Banner uploaded!", { id: toastId });
    } catch {
      toast.error("Upload failed.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16,
        border: `1px solid ${settings.banner?.active ? T.sky + "40" : T.border}`,
        background: settings.banner?.active ? T.skyLight : hovered ? T.surfaceAlt : T.surface,
        padding: "16px 20px",
        transition: "all 0.25s ease",
        boxShadow: settings.banner?.active ? `0 2px 12px ${T.sky}18` : T.shadowSm,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: settings.banner?.active ? T.sky : T.surfaceAlt, color: settings.banner?.active ? "#FFF" : T.textSoft, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease" }}>
            <FiSun size={16} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: settings.banner?.active ? T.sky : T.text, fontFamily: "Manrope, sans-serif" }}>Promo Banner</p>
            <p style={{ fontSize: 10, color: T.textSoft, marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>{settings.banner?.active ? "Banner is live" : "Banner is hidden"}</p>
          </div>
        </div>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const next = !settings.banner?.active;
              await axios.put("/api/admin/enterprise/settings", { banner: { ...settings.banner, active: next } }, { withCredentials: true });
              setSettings(prev => ({ ...prev, banner: { ...prev.banner, active: next } }));
              toast.success(next ? "Banner published!" : "Banner hidden.");
            } catch { toast.error("Error updating banner."); }
          }}
        >
          <Toggle active={settings.banner?.active} color={T.sky} />
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
        style={{
          position: "relative",
          borderRadius: 12,
          border: `1.5px dashed ${isDragging ? T.primary : T.border}`,
          background: isDragging ? T.primaryLight : T.surfaceAlt,
          padding: "14px",
          textAlign: "center",
          transition: "all 0.2s ease",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} onChange={(e) => handleFileUpload(e.target.files[0])} />
        {uploading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 0" }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${T.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, fontFamily: "Manrope, sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>Uploading…</span>
          </div>
        ) : settings.banner?.imageUrl ? (
          <div style={{ position: "relative" }}>
            <img src={settings.banner.imageUrl} alt="Banner" style={{ height: 56, width: "100%", objectFit: "cover", borderRadius: 8 }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(24,40,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, opacity: 0, transition: "opacity 0.2s ease" }}
              className="group-hover-overlay"
            >
              <span style={{ color: "#FFF", fontSize: 10, fontWeight: 700 }}>Replace</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: "10px 0" }}>
            <FiDroplet size={18} style={{ color: T.textGhost, margin: "0 auto 6px" }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textSoft, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "Manrope, sans-serif" }}>Drop image here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// OTP MODAL
// ─────────────────────────────────────────────
function OtpModal({ visible, otp, setOtp, onSubmit, onClose, verifying, pending }) {
  return (
    <AnimatePresence>
      {visible && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(24,40,61,0.35)", backdropFilter: "blur(8px)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease }}
            style={{ position: "relative", width: "100%", maxWidth: 420, background: T.surface, borderRadius: 24, boxShadow: T.shadowLg, border: `1px solid ${T.border}`, padding: 36, overflow: "hidden" }}
          >
            {/* Decorative top wash */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100, background: `linear-gradient(180deg, ${T.primaryLight} 0%, transparent 100%)`, pointerEvents: "none" }} />

            <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: T.surfaceAlt, border: "none", borderRadius: 8, padding: 6, color: T.textSoft, cursor: "pointer", display: "flex", zIndex: 2 }}>
              <FiX size={16} />
            </button>

            <div style={{ textAlign: "center", marginBottom: 28, position: "relative", zIndex: 1 }}>
              <div style={{ width: 64, height: 64, background: T.primaryLight, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: T.primary }}>
                <FiLock size={26} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif", marginBottom: 6 }}>Confirm Identity</h3>
              <p style={{ fontSize: 13, color: T.textSoft, fontFamily: "DM Sans, sans-serif", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                Enter the 6-digit code sent to your admin email to {pending ? "enable" : "disable"} maintenance mode.
              </p>
            </div>

            <form onSubmit={onSubmit} style={{ position: "relative", zIndex: 1 }}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                autoFocus
                style={{
                  width: "100%",
                  padding: "18px",
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "0.5em",
                  fontFamily: "JetBrains Mono, monospace",
                  color: T.text,
                  background: T.surfaceAlt,
                  border: `2px solid ${otp.length === 6 ? T.primary : T.border}`,
                  borderRadius: 16,
                  outline: "none",
                  transition: "border-color 0.2s ease",
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: otp.length === 6 ? T.primary : T.surfaceAlt,
                  color: otp.length === 6 ? "#FFF" : T.textGhost,
                  border: "none",
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: otp.length === 6 && !verifying ? "pointer" : "not-allowed",
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: otp.length === 6 ? `0 4px 16px rgba(11,143,127,0.25)` : "none",
                }}
              >
                {verifying ? <><FiRefreshCw size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Verifying…</> : "Verify & Confirm"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────
function SectionHeader({ title, sub, action, actionLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 4 }}>
          {sub}
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif", lineHeight: 1.1 }}>{title}</h2>
      </div>
      {action && (
        <Btn variant="ghost" size="sm" onClick={action} icon={<FiArrowUpRight size={13} />}>
          {actionLabel}
        </Btn>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT CARD
// ─────────────────────────────────────────────
function ExportCard({ icon, title, sub, iconColor, iconBg, onExport }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? "#CBD8EC" : T.border}`,
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: hovered ? T.shadowMd : T.shadowSm,
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "Manrope, sans-serif" }}>{title}</p>
          <p style={{ fontSize: 11, color: T.textSoft, marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>{sub}</p>
        </div>
      </div>
      <button
        onClick={onExport}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          color: iconColor,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <FiDownload size={15} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("6months");
  const { settings, setSettings } = useOutletContext();
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, totalRevenue: 0 });
  const [graph, setGraph] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) { setIsRefreshing(true); toast.loading("Refreshing…", { id: "refresh" }); }
    try {
      const [dashboardRes, messagesRes, reviewsRes] = await Promise.all([
        axios.get("/api/admin", { params: { range: timeFilter }, withCredentials: true }),
        axios.get("/api/contact", { withCredentials: true }),
        axios.get("/api/admin/reviews/all", { withCredentials: true }),
      ]);
      setStats(dashboardRes.data.stats);
      setGraph(dashboardRes.data.graph);
      setRecentOrders(dashboardRes.data.recentOrders);
      setRecentMessages(messagesRes.data.slice(0, 5));
      setAllReviews(reviewsRes.data?.slice(0, 6) || []);
      setLoading(false);
      setLastUpdated(new Date());
      if (isManual) toast.success("Dashboard updated", { id: "refresh" });
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) navigate("/login");
      if (isManual) toast.error("Refresh failed", { id: "refresh" });
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [timeFilter, navigate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => {
    const interval = setInterval(() => fetchDashboardData(), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const deleteReviewHandler = async (productId, reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await axios.delete(`/api/admin/products/${productId}/reviews/${reviewId}`, { withCredentials: true });
      fetchDashboardData();
    } catch { alert("Failed to delete."); }
  };

  const toggleMaintenanceClick = async () => {
    setPendingMaintenanceState(!settings.isMaintenanceMode);
    const toastId = toast.loading("Sending OTP…");
    try {
      await axios.post("/api/admin/maintenance/request-otp", {}, { withCredentials: true });
      toast.success("OTP sent to email", { id: toastId });
      setShowOtpModal(true);
      setOtp("");
    } catch { toast.error("Failed to send OTP", { id: toastId }); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter a valid 6-digit code");
    setVerifyingOtp(true);
    const toastId = toast.loading("Verifying…");
    try {
      const res = await axios.post("/api/admin/maintenance/verify", { otp, desiredState: pendingMaintenanceState }, { withCredentials: true });
      setSettings(res.data.settings);
      setShowOtpModal(false);
      toast.success(res.data.message, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP", { id: toastId });
    } finally { setVerifyingOtp(false); }
  };

  const revenueSparkline = graph.slice(-7).map((g, i) => ({ v: g.revenue ?? g.orders * 150 + i * 20 }));
  const ordersSparkline  = graph.slice(-7).map((g)    => ({ v: g.orders }));

  if (loading) return <Skeleton />;

  return (
    <>
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD8EC; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #9FB4CF; }
      `}</style>

      <OtpModal
        visible={showOtpModal}
        otp={otp}
        setOtp={setOtp}
        onSubmit={handleVerifyOtp}
        onClose={() => setShowOtpModal(false)}
        verifying={verifyingOtp}
        pending={pendingMaintenanceState}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        style={{
          minHeight: "100vh",
          background: T.bg,
          padding: "28px",
          fontFamily: "DM Sans, sans-serif",
          color: T.text,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >

        {/* ── PAGE HEADER ─────────────────────────────── */}
        <motion.div variants={fadeUp} custom={0} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.primary, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 6 }}>
              SeaBite Admin
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif", lineHeight: 1.1 }}>
              Good morning ☀️
            </h1>
            <p style={{ fontSize: 13, color: T.textSoft, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>
              Here's what's happening with your store today.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastUpdated && (
              <span style={{ fontSize: 10, color: T.textGhost, fontFamily: "Manrope, sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              icon={<FiRefreshCw size={13} style={{ animation: isRefreshing ? "spin 0.7s linear infinite" : "none" }} />}
            >
              Refresh
            </Btn>
          </div>
        </motion.div>

        {/* ── STAT CARDS ──────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 24 }}
          className="responsive-grid-4"
        >
          <StatCard title="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} icon={<FiDollarSign size={18} />} trend="12.5%" trendUp={true}  accentColor={T.success}  accentLight={T.successLight} sparkData={revenueSparkline} index={0} />
          <StatCard title="Total Orders"  value={stats.totalOrders  || 0} icon={<FiShoppingBag size={18} />} trend="8.2%"  trendUp={true}  accentColor={T.primary}  accentLight={T.primaryLight} sparkData={ordersSparkline}  index={1} />
          <StatCard title="Active Customers" value={stats.activeUsers || 0} icon={<FiUsers size={18} />} trend="2.4%"  trendUp={true}  accentColor={T.sky}     accentLight={T.skyLight}    sparkData={[{v:5},{v:12},{v:10},{v:20},{v:18},{v:25},{v:30}]} index={2} />
          <StatCard title="Pending Orders" value={stats.pendingOrders || 0} icon={<FiClock size={18} />} trend={stats.pendingOrders > 5 ? "High" : "Stable"} trendUp={stats.pendingOrders < 5} accentColor={T.warning} accentLight={T.warningLight} sparkData={[]} index={3} />
        </motion.div>

        {/* ── ANALYTICS + CONTROLS ────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24 }}>

          {/* Revenue Chart */}
          <motion.div variants={fadeUp} custom={4}>
            <Card style={{ height: "100%" }}>
              <div style={{ padding: "22px 24px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.textSoft, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 4 }}>Revenue</p>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif" }}>Analytics Overview</h3>
                  </div>
                  {/* Time Filter */}
                  <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
                    {["6months", "1year"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setTimeFilter(f)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "Manrope, sans-serif",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          border: "none",
                          cursor: "pointer",
                          background: timeFilter === f ? T.surface : "transparent",
                          color: timeFilter === f ? T.primary : T.textSoft,
                          boxShadow: timeFilter === f ? T.shadowSm : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {f === "6months" ? "6M" : "1Y"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ height: 280, padding: "0 12px 20px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graph} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={T.primary} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={T.primary} stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" horizontal={true} vertical={false} stroke={T.borderSubtle} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: T.textGhost, fontFamily: "Manrope, sans-serif" }}
                      dy={12}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: T.textGhost, fontFamily: "Manrope, sans-serif" }}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                      width={50}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: T.border, strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={T.primary}
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: T.primary, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Control Stack */}
          <motion.div variants={fadeUp} custom={5} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ControlRow
              icon={settings.isMaintenanceMode ? <FiLock size={16} /> : <FiUnlock size={16} />}
              label={settings.isMaintenanceMode ? "Maintenance On" : "Maintenance Off"}
              sublabel={settings.isMaintenanceMode ? "Store is locked." : "Store is live."}
              active={settings.isMaintenanceMode}
              onClick={toggleMaintenanceClick}
              accentColor={T.danger}
              accentLight={T.dangerLight}
            />

            <ControlRow
              icon={settings.globalDiscount > 0 ? <FiZap size={16} /> : <FiWind size={16} />}
              label={settings.globalDiscount > 0 ? "Happy Hour On" : "Happy Hour Off"}
              sublabel={settings.globalDiscount > 0 ? "−10% global discount active." : "Normal pricing."}
              active={settings.globalDiscount > 0}
              onClick={async () => {
                try {
                  const newDiscount = settings.globalDiscount > 0 ? 0 : 10;
                  await axios.put("/api/admin/enterprise/settings", { globalDiscount: newDiscount }, { withCredentials: true });
                  setSettings(prev => ({ ...prev, globalDiscount: newDiscount }));
                  toast.success(newDiscount > 0 ? "Happy Hour activated! ⚡" : "Happy Hour ended.");
                } catch { toast.error("Failed to update."); }
              }}
              accentColor="#7C4FE0"
              accentLight="#F3EEFF"
            />

            <BannerControl settings={settings} setSettings={setSettings} />
          </motion.div>
        </div>

        {/* ── ORDERS + MESSAGES/REVIEWS ───────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24 }}>

          {/* Recent Orders */}
          <motion.div variants={fadeUp} custom={6}>
            <Card style={{ height: "100%" }} hover={false}>
              <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${T.borderSubtle}` }}>
                <SectionHeader
                  sub="Live traffic"
                  title="Recent Orders"
                  action={() => navigate("/admin/orders")}
                  actionLabel="View all"
                />
              </div>

              <div style={{ padding: "12px 16px" }}>
                {recentOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <FiDroplet size={28} style={{ color: T.textGhost, margin: "0 auto 10px", display: "block" }} />
                    <p style={{ fontSize: 12, color: T.textGhost, fontFamily: "Manrope, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>No orders yet</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {recentOrders.map((order, idx) => (
                      <OrderRow key={order._id} order={order} idx={idx} onClick={() => navigate("/admin/orders")} />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Messages + Reviews */}
          <motion.div variants={fadeUp} custom={7} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Inquiries */}
            <Card style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: 280 }} hover={false}>
              <div style={{ padding: "18px 20px 12px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 2 }}>Inbox</p>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif" }}>Recent Inquiries</h3>
                </div>
                <button onClick={() => navigate("/admin/messages")} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: 7, color: T.textSoft, cursor: "pointer", display: "flex" }}>
                  <FiMail size={13} />
                </button>
              </div>
              <div style={{ overflowY: "auto", padding: "10px 16px", flex: 1 }}>
                {recentMessages.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: T.textGhost, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>Inbox empty</p>
                ) : recentMessages.map((msg) => (
                  <MessageRow key={msg._id} msg={msg} onClick={() => navigate("/admin/messages")} />
                ))}
              </div>
            </Card>

            {/* Reviews */}
            <Card style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: 280 }} hover={false}>
              <div style={{ padding: "18px 20px 12px", borderBottom: `1px solid ${T.borderSubtle}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 2 }}>Feedback</p>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif" }}>Customer Reviews</h3>
                </div>
                <span style={{ background: T.primaryLight, color: T.primary, fontSize: 10, fontWeight: 800, fontFamily: "Manrope, sans-serif", borderRadius: 8, padding: "3px 10px" }}>
                  {allReviews.length}
                </span>
              </div>
              <div style={{ overflowY: "auto", padding: "10px 16px", flex: 1 }}>
                {allReviews.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: T.textGhost, fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>No reviews yet</p>
                ) : allReviews.map((rev) => (
                  <ReviewRow key={rev._id} rev={rev} onDelete={() => deleteReviewHandler(rev.productId, rev._id)} />
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── DATA EXPORTS ────────────────────────────── */}
        <motion.div variants={fadeUp} custom={8}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Manrope, sans-serif", marginBottom: 4 }}>Data</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif" }}>Export Reports</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <ExportCard
              icon={<FiDollarSign size={16} />}
              title="Sales Report"
              sub="Export all orders to CSV"
              iconColor={T.success}
              iconBg={T.successLight}
              onExport={async () => {
                const toastId = toast.loading("Exporting sales…");
                try {
                  const { data } = await axios.get("/api/orders", { withCredentials: true });
                  const rows = [
                    ["Order ID","Date","Customer","Email","Items","Total","Status","Payment"],
                    ...data.map(o => [o.orderId || o._id, new Date(o.createdAt).toLocaleDateString(), o.user?.name || "Guest", o.user?.email || "N/A", o.items.map(i => `${i.name} (x${i.qty})`).join("; "), o.totalAmount, o.status, o.paymentMethod])
                  ].map(e => e.join(",")).join("\n");
                  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `sales_${new Date().toISOString().split("T")[0]}.csv`;
                  link.click();
                  toast.success("Downloaded!", { id: toastId });
                } catch { toast.error("Export failed", { id: toastId }); }
              }}
            />
            <ExportCard
              icon={<FiUsers size={16} />}
              title="Customer Data"
              sub="Export user list & CLV"
              iconColor={T.sky}
              iconBg={T.skyLight}
              onExport={async () => {
                const toastId = toast.loading("Exporting customers…");
                try {
                  const { data } = await axios.get("/api/admin/users/intelligence", { withCredentials: true });
                  const rows = [
                    ["ID","Name","Email","Role","Joined","Spent","Orders"],
                    ...data.map(u => [u._id, u.name, u.email, u.role, new Date(u.createdAt).toLocaleDateString(), u.intelligence?.totalSpent || 0, u.intelligence?.orderCount || 0])
                  ].map(e => e.join(",")).join("\n");
                  const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
                  link.click();
                  toast.success("Downloaded!", { id: toastId });
                } catch { toast.error("Export failed", { id: toastId }); }
              }}
            />
          </div>
        </motion.div>

      </motion.div>

      {/* Responsive media queries inline */}
      <style>{`
        @media (max-width: 1024px) {
          .responsive-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .responsive-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────
// ORDER ROW
// ─────────────────────────────────────────────
function OrderRow({ order, idx, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 14px",
        borderRadius: 12,
        background: hovered ? T.surfaceAlt : idx % 2 === 0 ? T.surface : T.bg,
        border: `1px solid ${hovered ? T.border : "transparent"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.primaryLight, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>
          #{order._id.slice(-4)}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: "Manrope, sans-serif", marginBottom: 2 }}>{order.user?.name || "Customer"}</p>
          <p style={{ fontSize: 10, color: T.textGhost, fontFamily: "DM Sans, sans-serif" }}>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: "Manrope, sans-serif", minWidth: 70, textAlign: "right" }}>
          ₹{(order.totalAmount || order.totalPrice || 0).toLocaleString()}
        </p>
        <StatusPill status={order.status} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MESSAGE ROW
// ─────────────────────────────────────────────
function MessageRow({ msg, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: hovered ? T.surfaceAlt : "transparent",
        border: `1px solid ${hovered ? T.border : "transparent"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: "Manrope, sans-serif", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.email}</p>
        <span style={{ fontSize: 9, color: T.textGhost, fontFamily: "DM Sans, sans-serif" }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
      </div>
      <p style={{ fontSize: 11, color: T.textSoft, fontFamily: "DM Sans, sans-serif", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{msg.message}"</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEW ROW
// ─────────────────────────────────────────────
function ReviewRow({ rev, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: hovered ? T.surfaceAlt : T.surface,
        border: `1px solid ${hovered ? T.border : T.borderSubtle}`,
        transition: "all 0.2s ease",
        marginBottom: 6,
        position: "relative",
      }}
    >
      {/* Stars */}
      <div style={{ display: "flex", gap: 2, marginBottom: 6 }}>
        {[...Array(5)].map((_, i) => (
          <FiStar key={i} size={9} style={{ color: i < rev.rating ? "#F59E0B" : T.textGhost, fill: i < rev.rating ? "#F59E0B" : "none" }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: T.textMid, fontFamily: "DM Sans, sans-serif", lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        "{rev.comment}"
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.textSoft, fontFamily: "Manrope, sans-serif" }}>{rev.userName}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: T.primary, fontFamily: "Manrope, sans-serif", letterSpacing: "0.04em" }}>{rev.productName}</span>
          {hovered && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ background: T.dangerLight, border: "none", borderRadius: 6, padding: "3px 6px", color: T.danger, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <FiTrash2 size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}