import { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlay, FiShoppingCart, FiClock, FiUsers, FiChevronRight, FiCheck } from "react-icons/fi";
import { CartContext } from "../../context/CartContext";
import toast from "../../utils/toast";

const RECIPES = [
  {
    id: 1,
    title: "Andhra Chettinad Fish Fry",
    description: "A spicy, crispy coastal delicacy made with fresh Vanjaram (Seer Fish) and authentic southern spices.",
    video: "/fishermen.mp4", // Placeholder video
    time: "25 mins",
    serves: "2-3",
    difficulty: "Medium",
    price: 1050,
    ingredients: [
      { name: "Fresh Vanjaram (500g)", price: 850, id: "vanjaram-500" },
      { name: "SeaBite Signature Masala", price: 120, id: "masala-01" },
      { name: "Cold Pressed Coconut Oil", price: 80, id: "oil-01" }
    ]
  },
  {
    id: 2,
    title: "Butter Garlic Tiger Prawns",
    description: "Juicy Tiger Prawns tossed in a rich, buttery garlic sauce with a hint of lemon and parsley.",
    video: "/bannervideo.mp4", // Placeholder video
    time: "15 mins",
    serves: "2",
    difficulty: "Easy",
    price: 1250,
    ingredients: [
      { name: "Tiger Prawns (Jumbo)", price: 1100, id: "prawns-tiger" },
      { name: "Garlic Butter Mix", price: 150, id: "butter-01" }
    ]
  }
];

const RecipeCard = ({ recipe, onAddAll }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    onAddAll(recipe);
    setTimeout(() => setIsAdding(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "#fff",
        borderRadius: "24px",
        overflow: "hidden",
        border: "1px solid #E2EEEC",
        boxShadow: isHovered ? "0 20px 40px rgba(91,168,160,0.12)" : "0 4px 20px rgba(0,0,0,0.03)",
        transition: "all 0.4s ease",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Video/Image Section */}
      <div style={{ position: "relative", height: "240px", overflow: "hidden" }}>
        <video 
          src={recipe.video} 
          autoPlay 
          muted 
          loop 
          playsInline 
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: "16px", left: "16px", display: "flex", gap: "8px" }}>
          <span style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff", padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>{recipe.difficulty}</span>
        </div>
        <motion.div 
          animate={{ scale: isHovered ? 1.1 : 1 }}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "48px", height: "48px", background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#5BBFB5", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", cursor: "pointer" }}
        >
          <FiPlay fill="#5BBFB5" size={18} />
        </motion.div>
      </div>

      {/* Content Section */}
      <div style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1A2E2C", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{recipe.title}</h3>
        <p style={{ fontSize: "13px", color: "#6B8F8A", margin: "0 0 20px", lineHeight: "1.6" }}>{recipe.description}</p>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FiClock size={14} style={{ color: "#5BBFB5" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1A2E2C" }}>{recipe.time}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FiUsers size={14} style={{ color: "#5BBFB5" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1A2E2C" }}>Serves {recipe.serves}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #E2EEEC", paddingTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#6B8F8A" }}>All Ingredients</span>
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#5BBFB5" }}>₹{recipe.price}</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            disabled={isAdding}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              background: isAdding ? "#10B981" : "#1A2E2C",
              color: "#fff",
              border: "none",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.3s ease"
            }}
          >
            {isAdding ? <FiCheck size={18} /> : <FiShoppingCart size={18} />}
            {isAdding ? "Added to Cart" : "Add All Ingredients"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const Recipes = () => {
  const { addToCart, refreshCartCount, setIsCartOpen } = useContext(CartContext);

  const handleAddAll = (recipe) => {
    // In a real app, these would be real products in the DB
    recipe.ingredients.forEach(ing => {
      addToCart({
        _id: ing.id,
        name: ing.name,
        price: ing.price,
        image: recipe.video.replace(".mp4", ".png"), // Mock image
        qty: 1
      });
    });
    refreshCartCount();
    setIsCartOpen(true);
    toast.success(`${recipe.title} ingredients added!`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F9F8", padding: "120px 20px 80px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "60px" }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", padding: "6px 16px", borderRadius: "20px", border: "1px solid #E2EEEC", marginBottom: "20px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5BBFB5" }} />
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.1em" }}>Shoppable Recipes</span>
          </div>
          <h1 style={{ fontSize: "48px", fontWeight: "800", color: "#1A2E2C", letterSpacing: "-0.04em", margin: "0 0 16px" }}>
            Cook Like a <span style={{ color: "#5BBFB5" }}>Coastliner</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#6B8F8A", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            From traditional Andhra curries to modern seafood grills. One click to get every ingredient you need, ocean-fresh.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "32px" }}>
          {RECIPES.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onAddAll={handleAddAll} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recipes;
