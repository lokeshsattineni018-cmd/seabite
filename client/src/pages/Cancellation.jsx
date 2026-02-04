import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiHome, FiRotateCcw, FiXCircle, FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

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
      
      {/* 🟢 HERO HEADER */}
      <header className="max-w-4xl mx-auto px-5 mb-12 md:mb-20 text-left">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <FiClock className="text-blue-600 text-[10px]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Timelines & Rules</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight">
            Cancellation <br/> <span className="text-blue-600">& Refunds.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl">
            We understand plans change. Here is how we manage cancellations and ensure your money is safe with us.
          </p>
        </motion.div>
      </header>

      {/* 🟢 POLICY BLOCKS */}
      <section className="max-w-4xl mx-auto px-5 space-y-8 md:space-y-12">
        {policies.map((policy, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-10 rounded-[2rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-2xl">
                {policy.icon}
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{policy.title}</h2>
            </div>
            
            <ul className="space-y-4">
              {policy.points.map((point, pIdx) => (
                <li key={pIdx} className="flex gap-3 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  <FiCheckCircle className="shrink-0 mt-1 text-blue-600" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        {/* 🟢 QUICK NOTICE BOX */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="flex items-start gap-4 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl"
        >
          <FiAlertCircle className="shrink-0 text-amber-600 mt-1" />
          <p className="text-xs md:text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
            <strong>Important:</strong> Since seafood is highly perishable, we cannot accept returns after delivery. Refunds are only applicable for verified quality issues or pre-shipping cancellations.
          </p>
        </motion.div>
      </section>

      {/* 🟢 ACTION DOCK */}
      <section className="max-w-4xl mx-auto px-5 mt-20">
        <div className="bg-slate-900 dark:bg-white p-10 rounded-[2.5rem] text-center space-y-6 shadow-2xl">
          <h3 className="text-xl md:text-2xl font-bold text-white dark:text-slate-900">Need to cancel an order?</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm max-w-xs mx-auto">
            Check your order status in your profile or talk to our live support team for help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-10 py-4 bg-white/10 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all"
            >
              <FiHome className="inline mr-2" /> Home
            </button>
            <button 
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER LABEL */}
      <div className="mt-16 text-center border-t border-slate-50 dark:border-white/5 pt-8">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">SeaBite Fair-Refund Policy • 2025</p>
      </div>
    </div>
  );
}