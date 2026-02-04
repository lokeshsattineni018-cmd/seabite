import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowRight, FiShield, FiLock, FiUser, FiShare2 } from "react-icons/fi";

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
      
      {/* 🟢 HEADER SECTION */}
      <section className="max-w-4xl mx-auto px-5 mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-left"
        >
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest">
            <FiShield /> <span>Privacy Center</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight">
            Privacy <br/> <span className="text-blue-600">Policy.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl">
            At SeaBite, your trust is as important as our freshness. Here is how we protect and handle your personal information.
          </p>
        </motion.div>
      </section>

      {/* 🟢 CONTENT BLOCKS */}
      <section className="max-w-4xl mx-auto px-5 space-y-10 md:space-y-16">
        {privacySections.map((section, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex gap-4 md:gap-6"
          >
            <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-lg md:text-xl border border-slate-100 dark:border-white/5">
              {section.icon}
            </div>
            <div className="space-y-2">
              <h2 className="text-lg md:text-2xl font-bold tracking-tight">
                {section.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                {section.content}
              </p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* 🟢 BOTTOM ACTION BOX */}
      <section className="max-w-4xl mx-auto px-5 mt-24">
        <div className="bg-slate-900 dark:bg-white p-10 rounded-[2.5rem] text-center space-y-6">
          <h3 className="text-xl md:text-2xl font-bold text-white dark:text-slate-900">Your Data, Your Control.</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm max-w-sm mx-auto">
            You can request to delete your account data at any time by contacting our support team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-10 py-4 bg-white/10 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all"
            >
              <FiHome className="inline mr-2" /> Home
            </button>
            <button 
              onClick={() => navigate('/products')}
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Marketplace <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      <div className="mt-16 text-center border-t border-slate-50 dark:border-white/5 pt-8">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">SeaBite Privacy Standard • 2025</p>
      </div>
    </div>
  );
}