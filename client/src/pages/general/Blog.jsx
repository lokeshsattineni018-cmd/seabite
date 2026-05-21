import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { FiClock, FiUser, FiArrowRight, FiBookOpen, FiSearch, FiTag } from "react-icons/fi";
import { Waves } from "lucide-react";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

// Dynamic custom animation presets
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }
};

const DUMMY_POSTS = [
  {
    _id: "dummy1",
    title: "The Ultimate Guide to Pan-Searing Mogalthur Pomfret",
    slug: "pan-searing-mogalthur-pomfret",
    content: "Master the art of pan-searing fresh pomfret with a perfect golden crust and zero chemical additives. A recipe directly from local coastal kitchens.",
    author: "Chef Aditya Murthy",
    readTime: 8,
    tags: ["Recipes", "Pomfret", "Cooking Tips"],
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    _id: "dummy2",
    title: "Understanding Cold-Chain: Why 0-4°C Matters for Fresh Fish",
    slug: "cold-chain-why-it-matters",
    content: "An in-depth look at how SeaBite's continuous zero-compromise cold chain preserves natural oceanic texture, flavor, and nutrition without freezing.",
    author: "Dr. Suresh Varma (Marine Biologist)",
    readTime: 5,
    tags: ["Integrity", "Nutrition", "Freshness"],
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  },
  {
    _id: "dummy3",
    title: "Classic Andhra-Style Spicy Prawn Curry",
    slug: "andhra-spicy-prawn-curry",
    content: "A fiery coastal classic cooked with freshly sourced black tiger prawns, hand-ground spices, and pure organic coconut milk. An absolute showstopper.",
    author: "Amma's Kitchen Collective",
    readTime: 12,
    tags: ["Recipes", "Prawns", "Spicy Andhra"],
    image: "https://images.unsplash.com/photo-1559847844-5315ba3cbffe?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString()
  }
];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/enterprise/blogs`);
        if (data.success && data.posts.length > 0) {
          setPosts(data.posts);
        } else {
          setPosts(DUMMY_POSTS);
        }
      } catch (err) {
        console.warn("⚠️ Failed to load server blogs, using gorgeous curated defaults instead:", err.message);
        setPosts(DUMMY_POSTS);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogPosts();
  }, []);

  const tags = ["All", ...new Set(posts.flatMap(p => p.tags || []))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = activeTag === "All" || post.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  if (loading) return <SeaBiteLoader fullScreen />;

  return (
    <>
      <Helmet>
        <title>Coastal Chronicles & Recipes | SeaBite</title>
        <meta name="description" content="Discover direct boat-to-kitchen recipes, nutrition guidance, and seafood integrity logs from SeaBite's coastal chef collective." />
      </Helmet>
      
      <style>{FONTS}{`
        .blog-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(26,43,53,0.06);
          border-color: #5BA8A0;
        }
        .blog-card:hover img {
          transform: scale(1.05);
        }
        .tag-btn:hover {
          border-color: #5BA8A0;
          color: #5BA8A0;
        }
      `}</style>

      <div 
        className="min-h-screen bg-[#F8FAFB] dark:bg-[#0A1118]"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#1A2B35",
          paddingTop: "120px",
          paddingBottom: "80px"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          
          {/* 🌊 Brand Header */}
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 flex justify-center items-center -z-10 opacity-30">
              <span className="text-[120px] font-black tracking-widest text-[#5BA8A0]/5 select-none font-mono">CHRONICLES</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/10 rounded-full border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Waves size={12} /> Sourced coastal recipes
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4"
            >
              The Coastal Chronicles
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium text-sm md:text-base leading-relaxed"
            >
              Your guide to chemical-free cooking, marine biology reports, and master chef secrets fresh from the Mogalthur dock.
            </motion.p>
          </div>

          {/* 🔍 Search & Filters Bar */}
          <div className="bg-white dark:bg-[#121E2A] rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Search recipe or culinary guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-[#0B151F] border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none focus:border-[#5BA8A0] dark:focus:border-[#5BA8A0] text-slate-800 dark:text-white transition-all placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>

            {/* Tag Badges filter */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`tag-btn px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border uppercase tracking-wider cursor-pointer ${
                    activeTag === tag
                      ? "bg-[#5BA8A0] border-[#5BA8A0] text-white shadow-lg shadow-[#5BA8A0]/15"
                      : "bg-slate-50 dark:bg-[#0B151F] text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 📰 Grid of Posts */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-[#121E2A] rounded-[2.5rem] p-16 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-[#0B151F] flex items-center justify-center mx-auto mb-6 text-slate-400">
                <FiBookOpen size={24} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">No articles matched your filters</h2>
              <p className="text-slate-400 dark:text-slate-500 font-semibold mb-6 max-w-sm mx-auto text-sm">
                Try searching for other fresh catch recipes or tags.
              </p>
              <button 
                onClick={() => { setSearchTerm(""); setActiveTag("All"); }}
                className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Clear Search filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredPosts.map((post, idx) => (
                <motion.div
                  key={post._id}
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-10% 0px" }}
                  className="blog-card bg-white dark:bg-[#121E2A] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-500 cursor-pointer"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {/* Image wrapper */}
                  <div className="h-56 relative overflow-hidden bg-slate-100 dark:bg-[#0B151F]">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-[0.22,1,0.36,1]"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800"; }}
                    />
                    <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap z-10">
                      {post.tags?.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-slate-950/70 text-white backdrop-blur-md border border-white/10">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Body info */}
                  <div className="p-6 md:p-8 flex-grow flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      {/* Meta reading time & date */}
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1"><FiClock size={12} /> {post.readTime} min read</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span>{new Date(post.createdAt || new Date()).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-950 dark:text-white leading-snug hover:text-[#5BA8A0] dark:hover:text-[#5BA8A0] transition-colors">
                        {post.title}
                      </h3>
                      
                      {/* Snippet */}
                      <p className="text-slate-400 dark:text-slate-400 font-medium text-xs md:text-sm line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Bottom Author Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#0B151F] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
                          <FiUser size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Written By</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{post.author}</p>
                        </div>
                      </div>

                      <span className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#0B151F] hover:bg-[#5BA8A0] hover:text-white text-slate-400 dark:text-slate-500 flex items-center justify-center transition-all duration-300">
                        <FiArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
