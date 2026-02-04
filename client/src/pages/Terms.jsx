import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowRight, FiCheckCircle, FiShield } from "react-icons/fi";

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
      
      {/* 🟢 HEADER SECTION */}
      <section className="max-w-4xl mx-auto px-5 mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest">
            <FiShield /> <span>Legal Center</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight">
            Terms of <br/> <span className="text-blue-600">Service.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl">
            Simple, transparent, and fair. Please review our standard terms for a smooth shopping experience at SeaBite.
          </p>
        </motion.div>
      </section>

      {/* 🟢 STATIC CONTENT BLOCKS */}
      <section className="max-w-4xl mx-auto px-5 space-y-12">
        {sections.map((section, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono font-bold text-blue-600">0{index + 1}.</span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                {section.title}
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed pl-7">
              {section.content}
            </p>
          </motion.div>
        ))}
      </section>

      {/* 🟢 SIMPLE ACTION FOOTER */}
      <section className="max-w-4xl mx-auto px-5 mt-20">
        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-[2rem] p-8 md:p-12 text-center space-y-6">
          <h3 className="text-xl md:text-2xl font-bold">Have a specific question?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">
            If you need more details about our policies, feel free to contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              <FiHome className="inline mr-2" /> Home
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Go to Market <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-16 text-center border-t border-slate-50 dark:border-white/5 pt-8">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">SeaBite Standard Agreement • 2025</p>
      </div>
    </div>
  );
}