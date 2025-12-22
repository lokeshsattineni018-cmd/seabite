// client/src/components/Categories.jsx (PREMIUM DUAL-THEME UPGRADE)

import { useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight, FiActivity } from "react-icons/fi";
import { ThemeContext } from "../context/ThemeContext"; // 🟢 IMPORT THEME

const categories = [
  { name: "Fish", img: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png", slug: "fish", color: "from-blue-500/10 dark:from-blue-500/10" },
  { name: "Prawns", img: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png", slug: "prawns", color: "from-emerald-500/10 dark:from-emerald-500/10" },
  { name: "Crab", img: "https://cdn-icons-png.flaticon.com/512/3075/3075943.png", slug: "crab", color: "from-cyan-500/10 dark:from-cyan-500/10" },
  { name: "Salmon", img: "https://cdn-icons-png.flaticon.com/512/1046/1046795.png", slug: "salmon", color: "from-indigo-500/10 dark:from-indigo-500/10" },
  { name: "Dry Fish", img: "https://cdn-icons-png.flaticon.com/512/1046/1046788.png", slug: "dry-fish", color: "from-blue-400/10 dark:from-blue-400/10" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function Categories() {
  const { isDarkMode } = useContext(ThemeContext); // 🟢 USE THEME

  return (
    <section className="py-24 bg-[#f4f7fa] dark:bg-[#0a1625] relative overflow-hidden transition-colors duration-500">
      
      {/* 🧬 DYNAMIC AMBIENCE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
             <FiActivity className="text-blue-600 dark:text-blue-500" />
             <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em] block">
                Resource Matrix
             </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-none uppercase">
            Asset <span className="text-blue-600 italic">Sectors</span>
          </h2>
          <div className="w-24 h-1.5 bg-blue-600 dark:bg-blue-500 rounded-full mx-auto" />
        </motion.div>

        {/* Categories Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
        >
          {categories.map((cat) => (
            <motion.div key={cat.name} variants={itemVariants}>
              <Link to={`/products?category=${cat.slug}`}>
                <motion.div
                  whileHover={{ y: -12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative bg-white dark:bg-[#0e1d30] rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl shadow-blue-900/5 dark:shadow-none transition-all duration-500 cursor-pointer h-full flex flex-col items-center justify-center gap-8 overflow-hidden"
                >
                  {/* Bio-luminescent Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Icon Module */}
                  <div className="relative w-28 h-28 rounded-[2rem] bg-slate-50 dark:bg-[#050b14] border border-slate-100 dark:border-white/5 group-hover:border-blue-600 dark:group-hover:border-blue-500/50 flex items-center justify-center transition-all duration-500 shadow-inner group-hover:shadow-2xl">
                    <img 
                      src={cat.img} 
                      alt={cat.name} 
                      className={`w-14 h-14 object-contain transition-all duration-700 group-hover:scale-110 drop-shadow-xl 
                      ${isDarkMode ? 'opacity-70 group-hover:opacity-100' : 'opacity-90 grayscale-[0.2] group-hover:grayscale-0'}`} 
                    />
                  </div>

                  {/* Text Interface */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <p className="font-serif text-2xl font-black text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors uppercase tracking-tighter">
                      {cat.name}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        Query Sector <FiArrowRight className="text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}