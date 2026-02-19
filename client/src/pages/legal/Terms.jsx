import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowRight, FiShield } from "react-icons/fi";
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

const sections = [
  {
    title: "Ordering & Cancellation",
    content: "Orders can be cancelled at any time before they are shipped. Once the order status is marked as 'Shipped' or 'Out for Delivery', cancellations are not permitted due to the perishable nature of seafood."
  },
  {
    title: "Shipping & Delivery",
    content: "We aim to deliver all orders within 2-3 days of sourcing. Delivery timelines provided at checkout are estimates. SeaBite is not liable for delays caused by extreme weather or incorrect address details provided by the user."
  },
  {
    title: "Perishable Goods Policy",
    content: "Fresh seafood is highly sensitive to temperature. Customers must ensure someone is available to receive the package. We are not responsible for quality degradation if the package is left unattended after delivery."
  },
  {
    title: "Pricing & Payments",
    content: "Prices of seafood fluctuate daily based on market availability. The price at the time of order placement is final. All payments are processed through secure, encrypted payment gateways."
  },
  {
    title: "User Responsibility",
    content: "Users must provide accurate contact and location information. Account credentials should be kept confidential. SeaBite reserves the right to block users for fraudulent activity or repeated fake orders."
  }
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#080d17] text-slate-900 dark:text-white transition-colors duration-500 pt-24 md:pt-32 pb-12">
      
      {/* HEADER */}
      <section className="max-w-4xl mx-auto px-5 mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest"
          >
            <FiShield /> <span>Legal Center</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight"
          >
            Terms of <br/> <span className="text-blue-600">Service.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl"
          >
            Simple, transparent, and fair. Please review our standard terms for a smooth shopping experience at SeaBite.
          </motion.p>
        </motion.div>
      </section>

      {/* CONTENT BLOCKS */}
      <section className="max-w-4xl mx-auto px-5 space-y-12">
        {sections.map((section, index) => (
          <FadeUp key={index} delay={index * 0.06}>
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="text-xs font-mono font-bold text-blue-600"
                >
                  0{index + 1}.
                </motion.span>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  {section.title}
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed pl-7">
                {section.content}
              </p>
            </div>
          </FadeUp>
        ))}
      </section>

      {/* ACTION FOOTER */}
      <section className="max-w-4xl mx-auto px-5 mt-20">
        <FadeUp>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-[2rem] p-8 md:p-12 text-center space-y-6">
            <h3 className="text-xl md:text-2xl font-bold">Have a specific question?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">
              If you need more details about our policies, feel free to contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <motion.button
                whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm"
              >
                <FiHome className="inline mr-2" /> Home
              </motion.button>
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all group"
              >
                Go to Market <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
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
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">SeaBite Standard Agreement • 2025</p>
      </motion.div>
    </div>
  );
}