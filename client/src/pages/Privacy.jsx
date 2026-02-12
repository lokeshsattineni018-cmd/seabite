import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowRight, FiShield, FiLock, FiUser, FiShare2 } from "react-icons/fi";
import { useRef } from "react";

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

const privacySections = [
  {
    title: "Data Collection",
    icon: <FiUser className="text-blue-500" />,
    content: "We collect essential information such as your name, email (via Google Login), phone number, and delivery address. This data is required to process your orders and provide a personalized shopping experience."
  },
  {
    title: "How We Use Your Information",
    icon: <FiArrowRight className="text-blue-500" />,
    content: "Your data is used strictly for order fulfillment, real-time delivery tracking, and important account notifications. We do not sell your personal information to marketing agencies."
  },
  {
    title: "Data Security",
    icon: <FiLock className="text-blue-500" />,
    content: "We implement industry-standard 256-bit SSL encryption to protect your data. Your payment details are processed through secure third-party gateways; we never store credit card information on our servers."
  },
  {
    title: "Third-Party Services",
    icon: <FiShare2 className="text-blue-500" />,
    content: "To ensure your catch reaches you fresh, we share your delivery address and contact number with our trusted logistics partners. They are contractually bound to protect your data privacy."
  }
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#080d17] text-slate-900 dark:text-white transition-colors duration-500 pt-24 md:pt-32 pb-12">
      
      {/* HEADER */}
      <section className="max-w-4xl mx-auto px-5 mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4 text-left"
        >
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest"
          >
            <FiShield /> <span>Privacy Center</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight"
          >
            Privacy <br/> <span className="text-blue-600">Policy.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl"
          >
            At SeaBite, your trust is as important as our freshness. Here is how we protect and handle your personal information.
          </motion.p>
        </motion.div>
      </section>

      {/* CONTENT BLOCKS */}
      <section className="max-w-4xl mx-auto px-5 space-y-10 md:space-y-16">
        {privacySections.map((section, index) => (
          <FadeUp key={index} delay={index * 0.08}>
            <div className="flex gap-4 md:gap-6">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
                className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-lg md:text-xl border border-slate-100 dark:border-white/5"
              >
                {section.icon}
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-lg md:text-2xl font-bold tracking-tight">
                  {section.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </FadeUp>
        ))}
      </section>

      {/* BOTTOM ACTION BOX */}
      <section className="max-w-4xl mx-auto px-5 mt-24">
        <FadeUp>
          <div className="bg-slate-900 dark:bg-white p-10 rounded-[2.5rem] text-center space-y-6">
            <h3 className="text-xl md:text-2xl font-bold text-white dark:text-slate-900">Your Data, Your Control.</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm max-w-sm mx-auto">
              You can request to delete your account data at any time by contacting our support team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-10 py-4 bg-white/10 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all"
              >
                <FiHome className="inline mr-2" /> Home
              </motion.button>
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all group"
              >
                Marketplace <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mt-16 text-center border-t border-slate-50 dark:border-white/5 pt-8"
      >
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">SeaBite Privacy Standard • 2025</p>
      </motion.div>
    </div>
  );
}