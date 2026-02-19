import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiHome, FiRotateCcw, FiXCircle, FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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

const policies = [
  {
    title: "Cancellation Policy",
    icon: <FiXCircle className="text-red-500" />,
    points: [
      "Orders can be cancelled anytime before they are marked as 'Shipped'.",
      "Once the order is out for delivery or shipped, cancellations are not permitted due to the perishable nature of fresh seafood.",
      "To cancel, please visit your Orders page or contact support immediately."
    ]
  },
  {
    title: "Refunds & Returns",
    icon: <FiRotateCcw className="text-blue-500" />,
    points: [
      "For cancelled prepaid orders, the full amount will be credited back to your original payment method within 6-7 business days.",
      "In case of quality issues or damage, please share a photo/video within 2 hours of delivery.",
      "Once verified, refunds for quality issues are processed within 5-7 business days."
    ]
  }
];

export default function Cancellation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#080d17] text-slate-900 dark:text-white transition-colors duration-500 pt-24 md:pt-32 pb-12 overflow-x-hidden">
      
      {/* HERO HEADER */}
      <header className="max-w-4xl mx-auto px-5 mb-12 md:mb-20 text-left">
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
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full"
          >
            <FiClock className="text-blue-600 text-[10px]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Timelines & Rules</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight"
          >
            Cancellation <br/> <span className="text-blue-600">& Refunds.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl"
          >
            We understand plans change. Here is how we manage cancellations and ensure your money is safe with us.
          </motion.p>
        </motion.div>
      </header>

      {/* POLICY BLOCKS */}
      <section className="max-w-4xl mx-auto px-5 space-y-8 md:space-y-12">
        {policies.map((policy, index) => (
          <FadeUp key={index} delay={index * 0.1}>
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="p-6 md:p-10 rounded-[2rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-6"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                  className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-2xl"
                >
                  {policy.icon}
                </motion.div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">{policy.title}</h2>
              </div>
              
              <ul className="space-y-4">
                {policy.points.map((point, pIdx) => (
                  <motion.li
                    key={pIdx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + pIdx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-3 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed"
                  >
                    <FiCheckCircle className="shrink-0 mt-1 text-blue-600" />
                    {point}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </FadeUp>
        ))}

        {/* QUICK NOTICE BOX */}
        <FadeUp delay={0.15}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-start gap-4 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl"
          >
            <FiAlertCircle className="shrink-0 text-amber-600 mt-1" />
            <p className="text-xs md:text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
              <strong>Important:</strong> Since seafood is highly perishable, we cannot accept returns after delivery. Refunds are only applicable for verified quality issues or pre-shipping cancellations.
            </p>
          </motion.div>
        </FadeUp>
      </section>

      {/* ACTION DOCK */}
      <section className="max-w-4xl mx-auto px-5 mt-20">
        <FadeUp>
          <div className="bg-slate-900 dark:bg-white p-10 rounded-[2.5rem] text-center space-y-6 shadow-2xl">
            <h3 className="text-xl md:text-2xl font-bold text-white dark:text-slate-900">Need to cancel an order?</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm max-w-xs mx-auto">
              Check your order status in your profile or talk to our live support team for help.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
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
                className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all"
              >
                Contact Support
              </motion.button>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER LABEL */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mt-16 text-center border-t border-slate-50 dark:border-white/5 pt-8"
      >
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">SeaBite Fair-Refund Policy • 2025</p>
      </motion.div>
    </div>
  );
}