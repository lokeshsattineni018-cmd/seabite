import { Link } from "react-router-dom";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";

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
      { to: "/login",    label: "Sign In" },
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

export default function Footer() {
  return (
    <footer style={{
      background: "#fff",
      borderTop: "1.5px solid #E2EEEC",
      fontFamily: "'Manrope', sans-serif",
    }}>

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
                src="/logo.png"
                alt="SeaBite"
                style={{ height: "52px", width: "auto" }}
              />
            </Link>
            <p style={{
              fontSize: "13px", color: "#6B8F8A",
              lineHeight: "1.75", maxWidth: "240px",
              marginBottom: "22px",
            }}>
              Premium seafood sourced from the Andhra Pradesh coastline. Chemical-free, fresh every morning.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <a href="tel:+919866635566" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B8F8A", textDecoration: "none", fontSize: "13px" }}>
                <FiPhone size={13} color="#5BBFB5" /> +91 98666 35566
              </a>
              <a href="mailto:support@seabite.co.in" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B8F8A", textDecoration: "none", fontSize: "13px" }}>
                <FiMail size={13} color="#5BBFB5" /> support@seabite.co.in
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B8F8A", fontSize: "13px" }}>
                <FiMapPin size={13} color="#5BBFB5" /> Mogalthur, AP 534281, Andhra Pradesh, India
              </div>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 style={{
                fontSize: "10px", fontWeight: "800", color: "#1A2E2C",
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
                      style={{ color: "#6B8F8A", textDecoration: "none", fontSize: "13px", fontWeight: "500", transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#1A2E2C"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6B8F8A"}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
          <p style={{ fontSize: "12px", color: "#B8CFCC", margin: 0, fontWeight: 500 }}>
            © {new Date().getFullYear()} SeaBite Seafoods Pvt. Ltd. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "18px" }}>
            {[{ to: "/terms", label: "Terms" }, { to: "/privacy", label: "Privacy" }, { to: "/cancellation", label: "Refunds" }].map(l => (
              <Link
                key={l.to} to={l.to}
                style={{ fontSize: "12px", color: "#B8CFCC", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#6B8F8A"}
                onMouseLeave={e => e.currentTarget.style.color = "#B8CFCC"}
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