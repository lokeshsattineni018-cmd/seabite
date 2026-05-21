import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { 
  FiClock, FiUser, FiArrowLeft, FiShoppingCart, FiTag, 
  FiBookmark, FiShare2, FiCheck, FiChevronRight, FiCheckCircle
} from "react-icons/fi";
import { Waves } from "lucide-react";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { CartContext } from "../../context/CartContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

// Curated default content if API returns no populated ingredients
const DUMMY_PRODUCTS = [
  {
    _id: "650c1f2e9d2f2b3e8c111111",
    name: "Mogalthur Fresh Silver Pomfret",
    price: 499,
    basePrice: 499,
    image: "pomfret.jpg",
    unit: "500g",
    rating: 4.9,
    stock: 12
  },
  {
    _id: "650c1f2e9d2f2b3e8c222222",
    name: "Wild Black Tiger Prawns (Jumbo)",
    price: 649,
    basePrice: 649,
    image: "prawns.jpg",
    unit: "500g",
    rating: 4.8,
    stock: 8
  }
];

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useContext(CartContext);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/enterprise/blogs/${slug}`);
        if (data.success) {
          setPost(data.post);
        } else {
          toast.error("Article not found");
          navigate("/blog");
        }
      } catch (err) {
        console.warn("⚠️ Failed to load blog detail from backend, fallback to local lookup:", err.message);
        // Fallback mockup matching the selected slug
        const mockMatch = {
          title: slug === "pan-searing-mogalthur-pomfret" ? "The Ultimate Guide to Pan-Searing Mogalthur Pomfret" :
                 slug === "cold-chain-why-it-matters" ? "Understanding Cold-Chain: Why 0-4°C Matters for Fresh Fish" :
                 "Classic Andhra-Style Spicy Prawn Curry",
          slug,
          content: `Cooking high-quality, boat-fresh seafood requires minimal intervention, yet absolute precision. When you source seafood from the Mogalthur dock, the cells are fully intact, hydrated, and loaded with ocean flavor. 
          
          ### 1. The Prep Phase
          Avoid heavy acid marinades (like lime or vinegar) for more than 10 minutes. Premium fresh catch doesn't need to be 'cleaned' of its oceanic aroma. Gently pat the fish skin dry with a lint-free kitchen towel. Moisture is the ultimate enemy of a perfect sear!

          ### 2. High heat, heavy pans
          Use a heavy-bottomed cast iron or carbon steel skillet. Heat the skillet until it smokes lightly, then add a high-smoke-point oil (like cold-pressed peanut or coconut oil).
          
          ### 3. Searing rules
          Place the fish skin-side down. Press down gently with a flexible metal fish spatula for the first 10 seconds to prevent curling. Maintain medium-high heat. Do NOT shake, slide, or touch the fish for at least 3 to 4 minutes. Let the natural amino acids caramelize to form a golden, non-stick crust.
          
          ### 4. Basting
          Flip once. Toss in a dollop of grass-fed butter, two smashed garlic cloves, and a sprig of fresh dill. Spoon the hot, foaming butter over the fish for another 90 seconds. Serve immediately onto warmed plates.`,
          author: "Chef Aditya Murthy",
          readTime: 8,
          tags: ["Recipes", "Pomfret", "Cooking Tips"],
          image: slug === "pan-searing-mogalthur-pomfret" ? "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1200" :
                 slug === "cold-chain-why-it-matters" ? "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=1200" :
                 "https://images.unsplash.com/photo-1559847844-5315ba3cbffe?auto=format&fit=crop&q=80&w=1200",
          productsAssociated: slug === "andhra-spicy-prawn-curry" ? [DUMMY_PRODUCTS[1]] : [DUMMY_PRODUCTS[0]],
          createdAt: new Date().toISOString()
        };
        setPost(mockMatch);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogPost();
  }, [slug, navigate]);

  const handleAddIngredient = (prod) => {
    setAddingId(prod._id);
    addToCart(prod);
    setTimeout(() => {
      setAddingId(null);
      toast.success(`${prod.name} added to cooking cart!`, { icon: "🍳" });
      setIsCartOpen(true);
    }, 600);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) return <SeaBiteLoader fullScreen />;
  if (!post) return null;

  return (
    <>
      <Helmet>
        <title>{post.title} | SeaBite Chronicles</title>
        <meta name="description" content={post.content.slice(0, 155)} />
      </Helmet>
      
      <style>{FONTS}{`
        .recipe-content h3 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #1A2B35;
          margin-top: 32px;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .recipe-content p {
          font-size: 15px;
          color: #4A6572;
          line-height: 1.8;
          margin-bottom: 20px;
        }
        .ingredient-card:hover {
          border-color: #5BA8A0;
          box-shadow: 0 15px 35px rgba(91,168,160,0.06);
        }
      `}</style>

      <div 
        className="min-h-screen bg-[#F8FAFB] dark:bg-[#0A1118]"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "120px",
          paddingBottom: "100px"
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          
          {/* 🔙 Navigation */}
          <div className="mb-8 flex items-center justify-between">
            <button 
              onClick={() => navigate("/blog")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <FiArrowLeft size={14} /> Back to Chronicles
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#121E2A] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Share Article"
              >
                <FiShare2 size={16} />
              </button>
              <button 
                onClick={() => toast.success("Article saved to bookmarks!")}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#121E2A] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Bookmark Article"
              >
                <FiBookmark size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "48px", alignItems: "start" }} className="flex flex-col lg:grid">
            
            {/* 📝 Main Post Column */}
            <div>
              {/* Header Title & Tags */}
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  {post.tags?.map((t, i) => (
                    <span key={i} className="text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      {t}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {post.title}
                </h1>
                
                {/* Author row */}
                <div className="flex items-center gap-6 text-xs text-slate-400 font-semibold pt-2 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <FiUser size={14} className="text-slate-400" /> By {post.author}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="flex items-center gap-1.5"><FiClock size={14} /> {post.readTime} min read</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span>{new Date(post.createdAt || new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Large Image */}
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.03)] aspect-[16/9] mb-8 bg-slate-100 dark:bg-[#0B151F]">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1200"; }}
                />
              </div>

              {/* HTML Content Render */}
              <div className="recipe-content text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed space-y-6">
                {post.content.split("\n\n").map((para, pIdx) => {
                  if (para.startsWith("###")) {
                    return <h3 key={pIdx}>{para.replace("###", "").trim()}</h3>;
                  }
                  return <p key={pIdx} className="text-slate-600 dark:text-slate-350">{para}</p>;
                })}
              </div>

              {/* Guarantee Disclaimer banner */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-900/10 rounded-[2rem] p-8 mt-12 flex items-start gap-4">
                <FiCheckCircle size={24} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-1">SeaBite Culinary Pledge</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                    Our recipes are developed in collaboration with coastal fishermen and nutritionists. For best results, use ingredients verified by SeaBite's strict 0-4°C Cold-Chain process.
                  </p>
                </div>
              </div>
            </div>

            {/* 🛒 Sticky Buy Ingredients Sidebar */}
            <div className="space-y-6 sticky top-28 lg:block">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <FiShoppingCart size={14} /> Buy Sourced Ingredients
              </h2>
              
              {(!post.productsAssociated || post.productsAssociated.length === 0) ? (
                <div className="bg-white dark:bg-[#121E2A] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs font-bold text-slate-400">All seasonal ingredients are currently in high demand.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {post.productsAssociated.map((prod) => (
                    <div 
                      key={prod._id}
                      className="ingredient-card bg-white dark:bg-[#121E2A] rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-[#0B151F]">
                        <img 
                          src={prod.image ? `${API_URL}/uploads/${prod.image.replace("uploads/", "")}` : "https://placehold.co/100?text=SeaBite"} 
                          alt={prod.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=SeaBite"; }}
                        />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate" title={prod.name}>
                          {prod.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{prod.unit || "500g"}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-black text-sm text-[#5BA8A0]">₹{prod.price}</span>
                          <button
                            onClick={() => handleAddIngredient(prod)}
                            disabled={addingId === prod._id}
                            className="px-3.5 py-2 rounded-xl bg-slate-950 dark:bg-slate-850 hover:bg-[#5BA8A0] text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {addingId === prod._id ? (
                              <FiCheck size={11} className="animate-bounce" />
                            ) : (
                              <FiShoppingCart size={11} />
                            )}
                            {addingId === prod._id ? "Added" : "Buy Fresh"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fresh catch pledge */}
              <div className="bg-slate-900 dark:bg-[#121E2A] text-white rounded-[2rem] p-6 relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5BA8A0]/10 rounded-full blur-2xl -z-10 group-hover:bg-[#5BA8A0]/20 transition-all duration-500" />
                <h3 className="font-extrabold text-sm mb-2 text-white">✨ 100% Dock Fresh</h3>
                <p className="text-slate-400 font-semibold text-[11px] leading-relaxed mb-4">
                  All ingredients are sourced directly from boat landings at Mogalthur, packed in temperature-controlled cold-chain boxes, and delivered to your doorstep.
                </p>
                <Link 
                  to="/products"
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#5BA8A0] hover:text-[#72c2ba] transition-all"
                >
                  Explore Premium Catches <FiChevronRight size={12} />
                </Link>
              </div>

            </div>

          </div>

        </div>
      </div>
    </>
  );
}
