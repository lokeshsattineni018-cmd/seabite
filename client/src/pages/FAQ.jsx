import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiMinus, FiHome, FiHelpCircle, FiTruck, FiShield, FiHeart } from "react-icons/fi";

const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 30, filter: "blur(8px)" }
      }
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const faqData = [
  {
    category: "Freshness & Quality",
    icon: <FiShield />,
    questions: [
      {
        q: "How do you ensure the fish is fresh?",
        a: "Our seafood is sourced daily at 4 AM from local docks. It is immediately cleaned, vacuum-sealed, and packed in temperature-controlled boxes with gel ice packs to maintain 0-4°C from the water to your doorstep."
      },
      {
        q: "Is your seafood chemical-free?",
        a: "Absolutely. We have a zero-tolerance policy for ammonia, formalin, or any other preservatives. We rely exclusively on advanced cold-chain logistics to keep the meat naturally fresh."
      }
    ]
  },
  {
    category: "Delivery & Shipping",
    icon: <FiTruck />,
    questions: [
      {
        q: "Where do you deliver?",
        a: "Currently, we serve major zones across Andhra Pradesh and Telangana. We are rapidly expanding to more coastal cities."
      },
      {
        q: "How long does delivery take?",
        a: "Orders placed before 8 AM are eligible for same-day delivery. All other orders are delivered within 24 hours of sourcing to ensure maximum freshness."
      }
    ]
  },
  {
    category: "Orders & Returns",
    icon: <FiHeart />,
    questions: [
      {
        q: "What if I'm not happy with the quality?",
        a: "Your satisfaction is our priority. If you receive a product that doesn't meet our standards, please contact us within 2 hours of delivery for an immediate replacement or refund."
      }
    ]
  }
];

export default function FAQ() {
  const navigate = useNavigate();
  const [activeQuestion, setActiveQuestion] = useState(null);

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f18] text-slate-900 dark:text-white transition-colors duration-500 pt-20 md:pt-24 pb-12 md:pb-20 overflow-x-hidden">
      
      {/* TOP HEADER */}
      <section className="max-w-4xl mx-auto px-5 md:px-6 mb-12 md:mb-16 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-600 text-white mb-6 shadow-xl shadow-blue-500/20"
        >
          <FiHelpCircle size={28} className="md:w-8 md:h-8" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl md:text-6xl font-serif font-bold tracking-tight mb-4"
        >
          How can we help?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-slate-500 dark:text-slate-400 text-sm md:text-lg px-2"
        >
          Everything you need to know about SeaBite freshness and service.
        </motion.p>
      </section>

      {/* FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto px-5 md:px-6 space-y-10 md:space-y-12">
        {faqData.map((section, sIdx) => (
          <FadeUp key={sIdx} delay={sIdx * 0.08}>
            <div className="space-y-4">
              <div className="flex items-center gap-2 md:gap-3 text-blue-600 dark:text-blue-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-6">
                {section.icon} <span>{section.category}</span>
              </div>
              
              <div className="space-y-3">
                {section.questions.map((item, qIdx) => {
                  const uniqueId = `${sIdx}-${qIdx}`;
                  const isOpen = activeQuestion === uniqueId;

                  return (
                    <motion.div 
                      key={qIdx}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: qIdx * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={`border border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-slate-50 dark:bg-white/[0.03] ring-1 ring-blue-500/20' : 'bg-white dark:bg-transparent'}`}
                    >
                      <motion.button 
                        onClick={() => toggleQuestion(uniqueId)}
                        whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm md:text-lg pr-4 leading-tight">{item.q}</span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className={`shrink-0 ${isOpen ? 'text-blue-600' : 'text-slate-400'}`}
                        >
                          {isOpen ? <FiMinus /> : <FiPlus />}
                        </motion.div>
                      </motion.button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <div className="px-5 pb-5 md:px-6 md:pb-6 text-slate-500 dark:text-slate-400 text-xs md:text-base leading-relaxed">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </FadeUp>
        ))}
      </section>

      {/* BOTTOM CTA */}
      <section className="max-w-4xl mx-auto px-5 md:px-6 mt-20 md:mt-24 text-center">
        <FadeUp>
          <div className="p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3 md:mb-4 relative z-10">Still have questions?</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm mb-8 relative z-10">Our support team is available from 8 AM to 8 PM daily.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 relative z-10">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-8 py-3 bg-white/10 dark:bg-slate-100 border border-white/20 dark:border-slate-200 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                <FiHome className="inline mr-2" /> Home
              </motion.button>
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
              >
                Contact Support
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}