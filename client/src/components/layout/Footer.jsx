import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPhone, FiMail, FiMapPin, FiSend, FiArrowRight } from "react-icons/fi";

const COLS = [
  {
    title: "Shop",
    links: [
      { to: "/products",                label: "All Products" },
      { to: "/products?category=Fish",  label: "Fresh Fish" },
      { to: "/products?category=Prawn", label: "Prawns" },
      { to: "/products?category=Crab",  label: "Crabs" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/orders",   label: "My Orders" },
      { to: "/wishlist", label: "Wishlist" },
      { to: "/cart",     label: "Cart" },
    ],
  },
  {
    title: "Help",
    links: [
      { to: "/faq",          label: "FAQ" },
      { to: "/contact",      label: "Contact Us" },
      { to: "/cancellation", label: "Returns & Refunds" },
      { to: "/terms",        label: "Terms of Service" },
      { to: "/privacy",      label: "Privacy Policy" },
    ],
  },
];

// SVG social icons (inline for zero dependency)
const SocialIcon = ({ type, href }) => {
  const icons = {
    instagram: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    youtube: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.5c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
      </svg>
    ),
    facebook: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
    whatsapp: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
      </svg>
    ),
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={type}
      style={{
        width: 40, height: 40, borderRadius: 12,
        background: "#F4F9F8", border: "1px solid #E2EEEC",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#5A7774", textDecoration: "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#5BBFB5";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.borderColor = "#5BBFB5";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#F4F9F8";
        e.currentTarget.style.color = "#5A7774";
        e.currentTarget.style.borderColor = "#E2EEEC";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icons[type]}
    </a>
  );
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer style={{
      background: "#fff",
      borderTop: "1.5px solid #E2EEEC",
      fontFamily: "'Manrope', sans-serif",
    }}>

      {/* ── Newsletter Banner ────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1A2E2C 0%, #2A4A47 100%)",
        padding: "36px 24px",
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "20px",
        }}>
          <div style={{ maxWidth: "400px" }}>
            <h3 style={{
              fontSize: "18px", fontWeight: "800", color: "#fff",
              margin: "0 0 6px", letterSpacing: "-0.02em",
            }}>
              🐟 Get Fresh Catch Updates
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 }}>
              Be the first to know about daily catches, exclusive deals, and seasonal specials.
            </p>
          </div>
          <form
            onSubmit={handleNewsletterSubmit}
            style={{
              display: "flex", gap: 0,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)",
              overflow: "hidden", maxWidth: 400, width: "100%",
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                flex: 1, padding: "14px 16px", border: "none",
                background: "transparent", color: "#fff",
                fontSize: "14px", fontWeight: "500", outline: "none",
                fontFamily: "'Manrope', sans-serif",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px 24px", border: "none",
                background: subscribed ? "#10B981" : "#5BBFB5",
                color: "#fff", fontSize: "13px", fontWeight: "700",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'Manrope', sans-serif",
                transition: "background 0.3s ease",
              }}
            >
              {subscribed ? "✓ Subscribed!" : <>Subscribe <FiArrowRight size={14} /></>}
            </button>
          </form>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "44px 24px 36px" }}>
        <div className="footer-main-grid" style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "40px",
        }}>

          {/* Brand column */}
          <div>
            <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "16px" }}>
              <img
                src="/logo.webp"
                alt="SeaBite"
                width={105}
                height={72}
                style={{ height: "72px", width: "105px", objectFit: "contain" }}
              />
            </Link>
            <p style={{
              fontSize: "13px", color: "#374947",
              lineHeight: "1.75", maxWidth: "240px",
              marginBottom: "22px",
            }}>
              Premium seafood sourced from the Andhra Pradesh coastline. Chemical-free, fresh every morning.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "20px" }}>
              <a href="tel:+919866635566" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#374947", textDecoration: "none", fontSize: "13px" }}>
                <FiPhone size={13} color="#5BBFB5" /> +91 98666 35566
              </a>
              <a href="mailto:support@seabite.co.in" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#374947", textDecoration: "none", fontSize: "13px" }}>
                <FiMail size={13} color="#5BBFB5" /> support@seabite.co.in
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#374947", fontSize: "13px" }}>
                <FiMapPin size={13} color="#5BBFB5" /> Mogalthur, 534281, Andhra Pradesh, India
              </div>
            </div>

            {/* Social icons */}
            <div style={{ display: "flex", gap: 8 }}>
              <SocialIcon type="instagram" href="https://instagram.com/seabite.co.in" />
              <SocialIcon type="youtube" href="https://youtube.com/@seabite" />
              <SocialIcon type="facebook" href="https://facebook.com/seabite.co.in" />
              <SocialIcon type="whatsapp" href="https://wa.me/919866635566" />
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 style={{
                fontSize: "11px", fontWeight: "800", color: "#1A2E2C",
                textTransform: "uppercase", letterSpacing: "0.13em",
                margin: "0 0 16px",
              }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      style={{ color: "#374947", textDecoration: "none", fontSize: "13px", fontWeight: "500", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#1A2E2C"}
                      onMouseLeave={e => e.currentTarget.style.color = "#374947"}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Trust Badges Row ────────────────────────── */}
        <div style={{
          marginTop: 36, paddingTop: 28,
          borderTop: "1px solid #E2EEEC",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "center",
          gap: "24px",
        }}>
          {/* FSSAI Badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "#F4F9F8", border: "1px solid #E2EEEC",
          }}>
            <span style={{ fontSize: 16 }}>🏛️</span>
            <div>
              <p style={{ fontSize: "10px", fontWeight: "700", color: "#1A2E2C", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>FSSAI Licensed</p>
              <p style={{ fontSize: "10px", color: "#5A7774", margin: 0 }}>Lic. No: 13625005000548</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 16px", borderRadius: 10,
            background: "#F4F9F8", border: "1px solid #E2EEEC",
          }}>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "#5A7774", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>We Accept</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {["UPI", "Visa", "MC", "RuPay"].map((method) => (
                <span key={method} style={{
                  padding: "3px 8px", borderRadius: 5,
                  background: "#fff", border: "1px solid #E2EEEC",
                  fontSize: "9px", fontWeight: "800", color: "#374947",
                  letterSpacing: "0.02em",
                }}>
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Secure Checkout */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "#F4F9F8", border: "1px solid #E2EEEC",
          }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "#5A7774", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>256-bit SSL Secured</p>
          </div>

          {/* Cold Chain */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "#F4F9F8", border: "1px solid #E2EEEC",
          }}>
            <span style={{ fontSize: 14 }}>🧊</span>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "#5A7774", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cold Chain Delivery</p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────── */}
      <div style={{ borderTop: "1px solid #E2EEEC", padding: "13px 24px" }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: "8px",
        }}>
          <p style={{ fontSize: "12px", color: "#5A7774", margin: 0, fontWeight: 500 }}>
            © {new Date().getFullYear()} SeaBite Seafoods Pvt. Ltd. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "18px" }}>
            {[{ to: "/terms", label: "Terms" }, { to: "/privacy", label: "Privacy" }, { to: "/cancellation", label: "Refunds" }].map(l => (
              <Link
                key={l.to} to={l.to}
                style={{ fontSize: "12px", color: "#5A7774", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#1A2E2C"}
                onMouseLeave={e => e.currentTarget.style.color = "#5A7774"}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-main-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .footer-main-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </footer>
  );
}