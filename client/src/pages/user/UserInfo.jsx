/**
 * UserInfo.jsx — Premium Redesign
 *
 * Design: "Personal Dossier"
 * ─────────────────────────────────────────────────────────────
 * The user info card presents personal data elegantly — each
 * field has an icon swatch, label, and value arranged in a
 * clean grid that scales from 1→2 columns.
 *
 * Key choices:
 *   • Icon chips: Small colored squares with icon inside,
 *     color-coded per field for instant visual orientation.
 *   • Value rows: Label above value, with a hairline separator
 *     below each — structured but light.
 *   • Admin highlight: Full accent color + badge inline.
 *   • Radial ambient blobs in corner — depth without noise.
 *
 * Props: { user } — unchanged.
 */

import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#F7F8FA",
  surface:  "#FFFFFF",
  border:   "#EAECF0",
  ink:      "#0D1117",
  inkMid:   "#44505C",
  inkSoft:  "#8A96A3",
  inkGhost: "#B8C0C8",
  teal:     "#4ECDC4",
  tealDeep: "#38B2AC",
  tealGlow: "rgba(78,205,196,0.12)",
  sky:      "#38BDF8",
  coral:    "#EF4444",
  coralBg:  "rgba(239,68,68,0.08)",
  rFull:    9999,
};

// ─────────────────────────────────────────────────────────────
// INFO FIELD
// ─────────────────────────────────────────────────────────────
function InfoField({ icon: Icon, label, value, accent, highlight, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: index * 0.055, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: 0 }}
    >
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent,
        }}>
          <Icon size={13} aria-hidden="true" />
        </div>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10, fontWeight: 600, color: T.inkGhost,
          textTransform: "uppercase", letterSpacing: "0.13em",
        }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div style={{ paddingLeft: 39 }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          fontSize: 14, fontWeight: highlight ? 700 : 500,
          color: highlight ? accent : T.ink,
          lineHeight: 1.5,
        }}>
          {value}
          {highlight && (
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "2px 8px",
              borderRadius: T.rFull,
              background: `${accent}15`, color: accent,
            }}>
              Admin
            </span>
          )}
        </span>
      </div>

      {/* Hairline separator */}
      <div style={{ marginTop: 13, marginLeft: 39, height: 1, background: T.bg }} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function UserInfo({ user }) {
  if (!user) return null;

  const primaryAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
  const addrLabel   = primaryAddr
    ? `${primaryAddr.houseNo ? primaryAddr.houseNo + ", " : ""}${primaryAddr.city}, ${primaryAddr.state}`
    : "No address saved";

  const fields = [
    { icon: FiUser,     label: "Full Name",       value: user.name,                                                         accent: T.teal                                 },
    { icon: FiMail,     label: "Email Address",   value: user.email,                                                        accent: T.sky                                  },
    { icon: FiPhone,    label: "Phone Number",    value: user.phone || "Not provided",                                      accent: T.teal                                 },
    { icon: FiMapPin,   label: "Primary Address", value: addrLabel,                                                         accent: T.sky                                  },
    {
      icon: FiCalendar, label: "Member Since",
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : "—",
      accent: T.teal,
    },
    {
      icon: FiShield, label: "Account Type",
      value: user.role === "admin" ? "Administrator" : "Customer",
      accent: user.role === "admin" ? T.coral : T.teal,
      highlight: user.role === "admin",
    },
  ];

  return (
    <div style={{
      background: T.surface,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      boxShadow: "0 2px 24px rgba(13,17,23,0.06), 0 1px 4px rgba(13,17,23,0.04)",
      padding: "32px 32px 24px",
      marginBottom: 22,
      position: "relative", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Ambient blobs */}
      <div aria-hidden="true" style={{
        position: "absolute", top: -60, right: -60,
        width: 220, height: 220, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.tealGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Section title */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 26, position: "relative", zIndex: 1,
      }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: T.teal }} />
        <h2 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 16, fontWeight: 700, color: T.ink,
          letterSpacing: "-0.01em", margin: 0,
        }}>
          Personal Information
        </h2>
      </div>

      {/* Fields grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "22px 40px",
        position: "relative", zIndex: 1,
      }}>
        {fields.map((f, i) => (
          <InfoField key={f.label} {...f} index={i} />
        ))}
      </div>
    </div>
  );
}