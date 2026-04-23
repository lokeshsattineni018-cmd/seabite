import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const CATEGORIES = [
  {
    id: "fish",
    name: "Fresh Fish",
    desc: "Sourced directly from the coast. Cleaned and ready to cook.",
    image: "https://images.unsplash.com/photo-1534889156217-d643df14f14a?auto=format&fit=crop&q=80&w=800",
    link: "/products?category=Fish",
    color: "#5BBFB5"
  },
  {
    id: "prawn",
    name: "Prawns & Shrimp",
    desc: "Juicy, tender, and available in multiple sizes. Perfect for curries.",
    image: "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?auto=format&fit=crop&q=80&w=800",
    link: "/products?category=Prawn",
    color: "#E8816A"
  },
  {
    id: "crab",
    name: "Crabs",
    desc: "Live and fresh crabs, packed securely for your favorite seafood boil.",
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=800",
    link: "/products?category=Crab",
    color: "#F0A868"
  },
  {
    id: "dry",
    name: "Dry Fish",
    desc: "Traditional sun-dried fish, rich in flavor and perfect for traditional recipes.",
    image: "https://images.unsplash.com/photo-1544025162-811114210214?auto=format&fit=crop&q=80&w=800",
    link: "/products?category=Dry",
    color: "#C19A6B"
  },
  {
    id: "ready",
    name: "Ready to Cook",
    desc: "Pre-marinated and spiced seafood. Just fry, bake, or grill.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800",
    link: "/products?category=Ready",
    color: "#6B8F8A"
  },
  {
    id: "combo",
    name: "Combos",
    desc: "Special bundles curated for parties and family gatherings.",
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=800",
    link: "/products?category=Combo",
    color: "#89C2D9"
  }
];

export default function Categories() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F9F8", fontFamily: "'Manrope', sans-serif" }}>
      <Helmet>
        <title>Shop by Category | SeaBite</title>
        <meta name="description" content="Browse SeaBite's fresh catch by category: Fish, Prawns, Crabs, and more." />
      </Helmet>

      {/* Hero Banner */}
      <div style={{ position: "relative", width: "100%", height: "280px", overflow: "hidden", background: "#1A2E2C" }}>
        <img 
          src="https://images.unsplash.com/photo-1522045663737-29177a561118?auto=format&fit=crop&q=80&w=1600" 
          alt="Fresh Catch" 
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 24px" }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontFamily: "'Lora', serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}
          >
            Shop by Category
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize: "15px", color: "rgba(255,255,255,0.8)", maxWidth: "500px", marginTop: "12px" }}
          >
            From the deep blue to your doorstep. Choose from our wide selection of premium seafood.
          </motion.p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={category.link} style={{ textDecoration: "none" }}>
                <motion.div 
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(26,46,44,0.12)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    background: "#fff", 
                    borderRadius: "20px", 
                    overflow: "hidden", 
                    border: "1.5px solid #E2EEEC",
                    boxShadow: "0 4px 12px rgba(26,46,44,0.04)",
                    transition: "border-color 0.3s",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = category.color}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "#E2EEEC"}
                >
                  <div style={{ height: "200px", overflow: "hidden", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)`, zIndex: 1 }} />
                    <motion.img 
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                      src={category.image} 
                      alt={category.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  </div>
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A2E2C", margin: "0 0 8px" }}>
                      {category.name}
                    </h2>
                    <p style={{ fontSize: "14px", color: "#6B8F8A", lineHeight: 1.6, margin: 0, flex: 1 }}>
                      {category.desc}
                    </p>
                    <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "8px", color: category.color, fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Explore <span style={{ fontSize: "16px", lineHeight: 1 }}>→</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
