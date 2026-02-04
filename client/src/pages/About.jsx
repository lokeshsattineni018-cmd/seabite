import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiHome, FiShield, FiZap, FiTruck, FiCompass } from "react-icons/fi";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f18] text-slate-900 dark:text-white transition-colors duration-500 pt-20 pb-12 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* 🌊 HERO SECTION - Reduced Text Size & Spacing */}
      <section className="px-5 md:px-10 max-w-6xl mx-auto mb-16 md:mb-28">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 md:space-y-6"
        >
          <p className="text-blue-600 dark:text-blue-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            Established 2025 • Mogalthur
          </p>
          <h1 className="text-6xl md:text-8xl font-serif font-black leading-[0.9] tracking-tighter italic">
            About <br/> <span className="text-blue-600 not-italic">SeaBite.</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 dark:text-slate-500 max-w-2xl font-light leading-relaxed">
            We are a coastline collective dedicated to delivering the ocean's finest catch in its most honest form.
          </p>
        </motion.div>
      </section>

      {/* 🌊 WHY CHOOSE US - Tightened Grid and Text */}
      <section className="px-5 md:px-10 max-w-6xl mx-auto mb-24 md:mb-40">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-3">Why Choose us?</h2>
          <div className="h-1 w-16 bg-blue-600 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { icon: <FiZap />, t: "Morning Sourcing", d: "Harvested at 4 AM, reaching us while the coast is still quiet." },
            { icon: <FiShield />, t: "Zero Chemicals", d: "Strictly no Ammonia or Formalin. We use only ice and speed." },
            { icon: <FiTruck />, t: "Rapid Cold-Chain", d: "Maintained at a precise 0-4°C from boat to doorstep." },
            { icon: <FiCompass />, t: "Coastal Heritage", d: "100% sourced from Mogalthur's local artisan community." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group space-y-3 p-6 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-blue-600 transition-all duration-300"
            >
              <div className="text-2xl text-blue-600 group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <h4 className="text-lg font-bold group-hover:text-white transition-colors">{item.t}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-blue-50 group-hover:opacity-90 transition-colors">
                {item.d}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🌊 IMAGE & STORY - Scaled Down aspect ratio */}
      <section className="px-5 md:px-10 max-w-6xl mx-auto mb-24 md:mb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-3xl bg-slate-100 dark:bg-white/5 shadow-xl"
          >
            <img 
              src="fisherman.jpg" 
              className="w-full h-auto aspect-[4/3] object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              alt="Mogalthur Coast"
            />
          </motion.div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter">The Origin Story</h2>
            <div className="space-y-3 md:space-y-4 text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
              <p>
                In the village of Mogalthur, we watched as the morning's freshest harvest was traded through six different hands before reaching a kitchen.
              </p>
              <p>
                SeaBite was born to kill that system. We partner with local boat owners to bring you seafood that has never seen a market floor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🌊 CTA SECTION - Tighter typography */}
      <section className="px-5 max-w-6xl mx-auto text-center pb-16">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter leading-none">
            Ready to taste <br/> <span className="text-blue-600">the coast?</span>
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3.5 border border-slate-200 dark:border-white/10 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <FiHome className="inline mr-2" /> Back Home
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="px-8 py-3.5 bg-blue-600 text-white rounded-full font-bold uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Shop Market <FiArrowRight />
            </button>
          </div>
        </motion.div>
      </section>

      <div className="py-8 text-center opacity-30">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em]">SeaBite Integrity • 2025</p>
      </div>
    </div>
  );
}