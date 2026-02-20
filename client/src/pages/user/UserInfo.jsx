import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield } from "react-icons/fi";

export default function UserInfo({ user }) {
  if (!user) return null;

  const primaryAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
  const addrLabel = primaryAddr
    ? `${primaryAddr.houseNo ? primaryAddr.houseNo + ", " : ""}${primaryAddr.city}, ${primaryAddr.state}`
    : "No address saved";

  const infoItems = [
    { icon: FiUser, label: "Full Name", value: user.name, accent: "#5BA8A0" },
    { icon: FiMail, label: "Email Address", value: user.email, accent: "#89C2D9" },
    { icon: FiPhone, label: "Phone Number", value: user.phone || "Not provided", accent: "#5BA8A0" },
    { icon: FiMapPin, label: "Primary Address", value: addrLabel, accent: "#89C2D9" },
    {
      icon: FiCalendar, label: "Member Since", accent: "#5BA8A0",
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : "—",
    },
    {
      icon: FiShield, label: "Account Type", accent: user.role === "admin" ? "#E8816A" : "#5BA8A0",
      value: user.role === "admin" ? "Administrator" : "Customer",
      highlight: user.role === "admin",
    },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        border: "1px solid #E2EEEC",
        boxShadow: "0 2px 24px rgba(91,168,160,0.08), 0 1px 4px rgba(26,43,53,0.04)",
        padding: "36px 36px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient radial accent */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,168,160,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(137,194,217,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, position: "relative", zIndex: 1 }}>
        <div style={{
          width: 4, height: 20, borderRadius: 2,
          background: "linear-gradient(180deg, #5BA8A0, #89C2D9)",
        }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A2B35", letterSpacing: "-0.01em", margin: 0 }}>
          Personal Information
        </h2>
      </div>

      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px 40px", position: "relative", zIndex: 1,
        }}
      >
        {infoItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -1 }}
            style={{ cursor: "default" }}
          >
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `${item.accent}15`,
                color: item.accent,
              }}>
                <item.icon size={14} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#8BA5B3",
                textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                {item.label}
              </span>
            </div>

            {/* Value */}
            <div style={{
              paddingLeft: 38,
              fontSize: 14, fontWeight: item.highlight ? 700 : 500,
              color: item.highlight ? item.accent : "#1A2B35",
              lineHeight: 1.5,
            }}>
              {item.value}
              {item.highlight && (
                <span style={{
                  display: "inline-block", marginLeft: 8,
                  padding: "2px 8px", borderRadius: 6,
                  background: `${item.accent}15`, color: item.accent,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", verticalAlign: "middle",
                }}>
                  Admin
                </span>
              )}
            </div>

            {/* Bottom border accent */}
            <div style={{
              marginTop: 12, marginLeft: 38,
              height: 1, background: "#F0F5F4",
            }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}