import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { CartContext } from "../../context/CartContext";
import { addToCart } from "../../utils/cartStorage";
import toast from "../../utils/toast";
import { Helmet } from "react-helmet-async";
import {
  FiClock, FiUsers, FiShoppingBag, FiCheck, FiArrowLeft,
  FiChevronRight, FiZap, FiAlertCircle
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "https://placehold.co/800x500?text=SeaBite+Recipe";
  if (imagePath.startsWith("http")) return imagePath;
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  const pathWithUploads = cleanPath.startsWith("/uploads") ? cleanPath : `/uploads${cleanPath}`;
  return `${API_URL}${pathWithUploads}`;
};

export default function RecipeDetail() {
  const { slug } = useParams();
  const { refreshCartCount } = useContext(CartContext);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedItems, setAddedItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/recipes/${slug}`)
      .then(res => {
        setRecipe(res.data);
        // Pre-select all available ingredients
        const available = res.data.ingredients
          .filter(i => i.productId && i.productId.stock !== "out" && i.productId.countInStock > 0)
          .map(i => i.productId._id);
        setSelectedIngredients(available);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const toggleIngredient = (id) => {
    setSelectedIngredients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddAllToCart = async () => {
    if (!recipe) return;
    setAddingToCart(true);

    const toAdd = recipe.ingredients.filter(i =>
      i.productId && selectedIngredients.includes(i.productId._id)
    );

    for (const ingredient of toAdd) {
      const p = ingredient.productId;
      const pricePerGram = p.basePrice / 1000; // assuming basePrice is per kg
      const itemTotal = Math.round(pricePerGram * ingredient.weightGrams);
      addToCart({
        ...p,
        price: itemTotal,
        quantity: 1,
        orderedWeightGrams: ingredient.weightGrams,
        originalPrice: itemTotal,
        recipeNote: `For: ${recipe.title} (${ingredient.weightGrams}g)`,
      });
    }

    refreshCartCount();
    setAddedItems(toAdd.map(i => i.productId._id));

    toast.success(`${toAdd.length} ingredient${toAdd.length > 1 ? "s" : ""} added to cart!`, {
      icon: "🛒",
      style: { background: "#1A2E2C", color: "#fff", borderRadius: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif" },
    });

    setTimeout(() => {
      setAddingToCart(false);
      setAddedItems([]);
    }, 2500);
  };

  const totalCartAmount = recipe?.ingredients
    .filter(i => i.productId && selectedIngredients.includes(i.productId._id))
    .reduce((sum, i) => {
      const p = i.productId;
      return sum + Math.round((p.basePrice / 1000) * i.weightGrams);
    }, 0) || 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍳</div>
          <p style={{ color: "#6B8F8A", fontWeight: "600" }}>Loading recipe…</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>😔</div>
          <h2 style={{ color: "#1A2E2C", marginBottom: "12px" }}>Recipe not found</h2>
          <Link to="/recipes" style={{ color: "#5BBFB5", fontWeight: "700", textDecoration: "none" }}>← Back to Recipes</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>{recipe.title} — SeaBite Recipes</title>
        <meta name="description" content={recipe.description} />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Hero Image */}
      <div style={{ position: "relative", height: "clamp(280px, 45vw, 500px)", overflow: "hidden", background: "#1A2E2C" }}>
        <img
          src={getFullImageUrl(recipe.coverImage)}
          alt={recipe.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(26,46,44,0.95))" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "clamp(24px, 4vw, 48px)" }}>
          <Link to="/recipes" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: "700", textDecoration: "none", marginBottom: "16px" }}>
            <FiArrowLeft size={14} /> All Recipes
          </Link>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {recipe.tags?.map(tag => (
              <span key={tag} style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", background: "rgba(91,191,181,0.2)", border: "1px solid rgba(91,191,181,0.3)", padding: "3px 10px", borderRadius: "20px", textTransform: "capitalize" }}>{tag}</span>
            ))}
          </div>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 44px)", fontWeight: "900", color: "#fff", letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.15 }}>
            {recipe.title}
          </h1>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { icon: <FiClock size={14} />, label: `${(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min` },
              { icon: <FiUsers size={14} />, label: `${recipe.servings} servings` },
              { icon: "🏷️", label: recipe.difficulty },
              { icon: "🌊", label: recipe.cuisine || "Coastal Indian" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.75)", fontSize: "13px", fontWeight: "600" }}>
                {m.icon} {m.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px 80px", display: "grid", gridTemplateColumns: "1fr clamp(280px, 35%, 380px)", gap: "40px" }}>

        {/* Left: Description + Steps */}
        <div>
          {recipe.description && (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", border: "1.5px solid #E2EEEC", marginBottom: "28px" }}>
              <p style={{ fontSize: "16px", color: "#4A6A67", lineHeight: 1.7, margin: 0 }}>{recipe.description}</p>
            </div>
          )}

          {/* Other Ingredients */}
          {recipe.otherIngredients?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", border: "1.5px solid #E2EEEC", marginBottom: "28px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 18px", letterSpacing: "-0.01em" }}>
                🧄 Other Ingredients
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {recipe.otherIngredients.map((item, i) => (
                  <li key={i} style={{ background: "#F4F9F8", border: "1.5px solid #E2EEEC", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", fontWeight: "600", color: "#4A6A67" }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          {recipe.steps?.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", border: "1.5px solid #E2EEEC" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 24px", letterSpacing: "-0.01em" }}>
                👨‍🍳 Instructions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {recipe.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    style={{ display: "flex", gap: "16px" }}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1A2E2C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "13px", flexShrink: 0, marginTop: "2px" }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: "15px", color: "#4A6A67", lineHeight: 1.65, margin: 0, paddingTop: "5px" }}>{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sticky Ingredient + Cart Panel */}
        <div>
          <div style={{ position: "sticky", top: "88px" }}>
            <div style={{ background: "#fff", borderRadius: "24px", border: "1.5px solid #E2EEEC", overflow: "hidden", boxShadow: "0 20px 60px rgba(26,46,44,0.08)" }}>
              {/* Header */}
              <div style={{ background: "linear-gradient(135deg, #1A2E2C, #2D4F4C)", padding: "24px" }}>
                <h2 style={{ color: "#fff", fontWeight: "900", fontSize: "18px", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  🛒 Add Ingredients to Cart
                </h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0, fontWeight: "600" }}>
                  Select what you need — add all in one click
                </p>
              </div>

              {/* Seafood Ingredients */}
              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: "800", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                  🐟 Seafood ({recipe.ingredients?.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {recipe.ingredients?.map((ingredient, i) => {
                    const p = ingredient.productId;
                    if (!p) return (
                      <div key={i} style={{ padding: "12px 14px", background: "#F4F9F8", borderRadius: "12px", fontSize: "13px", color: "#6B8F8A", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FiAlertCircle size={14} color="#EF4444" />
                        {ingredient.productName || "Product unavailable"} — {ingredient.weightGrams}g
                      </div>
                    );
                    const outOfStock = p.stock === "out" || p.countInStock <= 0;
                    const isSelected = selectedIngredients.includes(p._id);
                    const itemPrice = Math.round((p.basePrice / 1000) * ingredient.weightGrams);

                    return (
                      <motion.div
                        key={p._id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !outOfStock && toggleIngredient(p._id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "12px", borderRadius: "14px", cursor: outOfStock ? "not-allowed" : "pointer",
                          border: `2px solid ${isSelected ? "#5BBFB5" : "#E2EEEC"}`,
                          background: isSelected ? "rgba(91,191,181,0.05)" : "#fff",
                          transition: "all 0.2s", opacity: outOfStock ? 0.5 : 1,
                        }}
                      >
                        <div style={{ width: "40px", height: "40px", background: "#F4F9F8", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
                          <img src={getFullImageUrl(p.image)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                          <p style={{ fontSize: "11px", color: "#6B8F8A", margin: "2px 0 0", fontWeight: "600" }}>
                            {ingredient.weightGrams}g {ingredient.notes && `· ${ingredient.notes}`}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: "800", color: "#5BBFB5", margin: 0 }}>₹{itemPrice}</p>
                          <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: isSelected ? "#5BBFB5" : "#E2EEEC", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", marginTop: "4px", transition: "all 0.2s" }}>
                            {isSelected && <FiCheck size={12} color="#fff" strokeWidth={3} />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Total + CTA */}
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1.5px solid #E2EEEC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", color: "#6B8F8A", fontWeight: "600" }}>
                      {selectedIngredients.length} of {recipe.ingredients?.length} items
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "11px", color: "#6B8F8A", margin: "0 0 2px", fontWeight: "600" }}>Total seafood</p>
                      <p style={{ fontSize: "24px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.03em", margin: 0 }}>₹{totalCartAmount}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddAllToCart}
                    disabled={addingToCart || selectedIngredients.length === 0}
                    style={{
                      width: "100%", padding: "16px", borderRadius: "14px",
                      background: selectedIngredients.length === 0 ? "#B8CFCC" : "linear-gradient(135deg, #5BBFB5, #3D9E94)",
                      border: "none", color: "#fff", fontSize: "15px", fontWeight: "800",
                      cursor: selectedIngredients.length === 0 ? "not-allowed" : "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      boxShadow: selectedIngredients.length > 0 ? "0 8px 24px rgba(91,191,181,0.35)" : "none",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {addingToCart ? (
                      <><FiCheck size={18} /> Added!</>
                    ) : (
                      <><FiShoppingBag size={18} /> Add All to Cart</>
                    )}
                  </motion.button>
                  <p style={{ textAlign: "center", fontSize: "11px", color: "#6B8F8A", marginTop: "10px", fontWeight: "600" }}>
                    🐟 Fresh catch · 🚚 Same-day delivery available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .recipe-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
