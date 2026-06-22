import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Link } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { addToCart } from "../../utils/cartStorage";
import toast from "../../utils/toast";
import { FiClock, FiUsers, FiChevronRight, FiShoppingBag, FiZap } from "react-icons/fi";
import { Helmet } from "react-helmet-async";

const API_URL = import.meta.env.VITE_API_URL || "";

const difficultyColor = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "https://placehold.co/600x400?text=SeaBite";
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  const pathWithUploads = cleanPath.startsWith("/uploads") ? cleanPath : `/uploads${cleanPath}`;
  return `${API_URL}${pathWithUploads}`;
};

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/recipes`)
      .then(res => { setRecipes(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.tags?.some(t => t.includes(search.toLowerCase()));
    const matchFilter = filter === "all" || r.difficulty === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>Recipes — SeaBite | Cook with the Freshest Catch</title>
        <meta name="description" content="Explore seafood recipes and add all ingredients to your cart in one click." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1A2E2C 0%, #2D4F4C 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "16px" }}>
            🍳 Content-Driven Commerce
          </span>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: "900", color: "#fff", letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.1 }}>
            Cook with SeaBite
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.65)", maxWidth: "560px", margin: "0 auto 40px", lineHeight: 1.6 }}>
            Discover coastal recipes crafted by our chefs. Add all ingredients to cart in one click.
          </p>
          {/* Search */}
          <div style={{ display: "flex", gap: "12px", maxWidth: "480px", margin: "0 auto" }}>
            <input
              placeholder="Search recipes, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, padding: "14px 20px", borderRadius: "12px",
                background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "14px",
                fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
                backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px 0" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
          {["all", "Easy", "Medium", "Hard"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "8px 20px", borderRadius: "100px", border: "2px solid",
                borderColor: filter === f ? "#5BBFB5" : "#E2EEEC",
                background: filter === f ? "#5BBFB5" : "#fff",
                color: filter === f ? "#fff" : "#6B8F8A",
                fontWeight: "700", fontSize: "13px", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {f === "all" ? "All Recipes" : f}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: "13px", color: "#6B8F8A", alignSelf: "center", fontWeight: "600" }}>
            {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#6B8F8A" }}>Loading recipes…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
            <p style={{ color: "#6B8F8A", fontSize: "16px", fontWeight: "600" }}>No recipes found. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", paddingBottom: "80px" }}>
            <AnimatePresence>
              {filtered.map((recipe, i) => (
                <RecipeCard key={recipe._id} recipe={recipe} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeCard({ recipe, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link to={`/recipes/${recipe.slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            background: "#fff", borderRadius: "20px", overflow: "hidden",
            border: "1.5px solid #E2EEEC", transition: "all 0.25s",
            cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(26,46,44,0.10)"; e.currentTarget.style.borderColor = "#B8DDD9"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "#E2EEEC"; }}
        >
          {/* Image */}
          <div style={{ height: "200px", background: "#F4F9F8", overflow: "hidden", position: "relative" }}>
            {recipe.featured && (
              <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 2, background: "#5BBFB5", color: "#fff", fontSize: "10px", fontWeight: "900", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ⭐ Featured
              </div>
            )}
            <img
              src={getFullImageUrl(recipe.coverImage)}
              alt={recipe.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
              onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.target.style.transform = ""}
            />
          </div>

          {/* Content */}
          <div style={{ padding: "20px" }}>
            {/* Tags */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {recipe.tags?.slice(0, 3).map(tag => (
                <span key={tag} style={{ fontSize: "10px", fontWeight: "700", color: "#5BBFB5", background: "rgba(91,191,181,0.1)", padding: "3px 8px", borderRadius: "20px", textTransform: "capitalize" }}>{tag}</span>
              ))}
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 8px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              {recipe.title}
            </h3>
            <p style={{ fontSize: "13px", color: "#6B8F8A", margin: "0 0 16px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {recipe.description}
            </p>

            {/* Meta */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center", borderTop: "1px solid #E2EEEC", paddingTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6B8F8A", fontSize: "12px", fontWeight: "600" }}>
                <FiClock size={13} /> {(recipe.prepTimeMinutes || 15) + (recipe.cookTimeMinutes || 30)}m
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#6B8F8A", fontSize: "12px", fontWeight: "600" }}>
                <FiUsers size={13} /> {recipe.servings} servings
              </div>
              <span style={{ marginLeft: "auto", fontSize: "11px", fontWeight: "800", color: difficultyColor[recipe.difficulty] || "#6B8F8A", background: `${difficultyColor[recipe.difficulty]}20`, padding: "3px 8px", borderRadius: "20px" }}>
                {recipe.difficulty}
              </span>
            </div>

            {/* CTA hint */}
            <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "6px", color: "#5BBFB5", fontSize: "13px", fontWeight: "700" }}>
              <FiShoppingBag size={14} />
              Add all ingredients to cart
              <FiChevronRight size={14} style={{ marginLeft: "auto" }} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
