import { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import toast from "../../utils/toast";
import { Helmet } from "react-helmet-async";
import {
  FiCheck, FiZap, FiTruck, FiStar, FiShield, FiGift, FiClock, FiX, FiCalendar
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const PLANS = {
  monthly: { label: "Monthly", price: 149, period: "/month", tag: null, duration: "30 days", savings: null },
  yearly:  { label: "Yearly",  price: 999, period: "/year",  tag: "BEST VALUE", duration: "365 days", savings: "₹789 saved" },
};

const BENEFITS = [
  { 
    icon: <FiTruck size={20} />, 
    title: "Free Delivery", 
    desc: "On every order, no minimum required",
    compare: { free: "₹49/order", prime: "FREE" }
  },
  { 
    icon: <FiZap size={20} />, 
    title: "Early Flash Sale Access", 
    desc: "Shop 30 mins before everyone else", 
    compare: { free: "Standard Access", prime: "30m Headstart" }
  },
  { 
    icon: <FiStar size={20} />, 
    title: "5% Extra Discount", 
    desc: "On top of any existing offers", 
    compare: { free: "None", prime: "Extra 5% Off" }
  },
  { 
    icon: <FiShield size={20} />, 
    title: "Priority Support", 
    desc: "Dedicated support lane, 2h response", 
    compare: { free: "Standard", prime: "2h Fast Lane" }
  },
  { 
    icon: <FiGift size={20} />, 
    title: "Birthday Surprise", 
    desc: "Special gift on your birthday month", 
    compare: { free: "None", prime: "Gift Box 🎁" }
  },
  { 
    icon: <FiClock size={20} />, 
    title: "Same-Day Delivery", 
    desc: "Express slots on select orders", 
    compare: { free: "Paid Slots", prime: "Free Slots" }
  },
];

export default function SeaBitePrime() {
  const { user, refreshMe } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [primeStatus, setPrimeStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/api/subscription/status`, { withCredentials: true })
        .then(res => { setPrimeStatus(res.data); setLoadingStatus(false); })
        .catch(() => setLoadingStatus(false));
    } else {
      setLoadingStatus(false);
    }
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth-drawer"));
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/subscription/create`, { plan: selectedPlan }, { withCredentials: true });

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: data.amount,
        currency: "INR",
        name: "SeaBite Prime",
        description: `${PLANS[selectedPlan].label} Membership`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const res = await axios.post(`${API_URL}/api/subscription/verify`, {
              ...response,
              plan: selectedPlan,
            }, { withCredentials: true });

            toast.success(res.data.message, {
              icon: "💎",
              duration: 5000,
              style: { background: "#1A2E2C", color: "#fff", borderRadius: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }
            });
            await refreshMe();
            const statusRes = await axios.get(`${API_URL}/api/subscription/status`, { withCredentials: true });
            setPrimeStatus(statusRes.data);
          } catch (err) {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || "" },
        theme: { color: "#1D1D1F" },
        modal: { ondismiss: () => setLoading(false) },
      });

      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const isPrime = primeStatus?.isPrime;
  const primeExpiry = primeStatus?.primeExpiry ? new Date(primeStatus.primeExpiry) : null;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      <Helmet>
        <title>SeaBite Prime — Exclusive Membership</title>
        <meta name="description" content="Join SeaBite Prime for free delivery, early flash sale access, and 5% extra off every order." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" />
      </Helmet>

      {/* Main Wrapper */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        {/* 💎 Hero Section */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60 text-[10px] font-black uppercase tracking-widest text-[#5BBFB5] mb-6"
          >
            <span>💎</span> SeaBite Prime
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#1D1D1F] mb-6 font-['Outfit',sans-serif] leading-[1.1]"
          >
            Elevate Your <span className="font-bold">Seafood Experience</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm md:text-base text-[#86868B] font-medium leading-relaxed max-w-xl mx-auto"
          >
            Enjoy unlimited free delivery, exclusive member pricing, early access to fresh catches, and priority support.
          </motion.p>
          
          {/* Active prime notification */}
          {isPrime && primeExpiry && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-4 bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl p-4 mt-8"
            >
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-base">💎</div>
              <div className="text-left">
                <p className="text-[#328F85] font-black uppercase tracking-wider text-[9px]">Active Membership</p>
                <p className="text-[#1D1D1F] text-xs font-bold mt-0.5">
                  Valid until {primeExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Subscription Plan Selection */}
        {!isPrime && (
          <div className="max-w-3xl mx-auto mb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {Object.entries(PLANS).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`bg-[#FFFFFF] rounded-[2rem] p-8 border-2 cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                    selectedPlan === key
                      ? "border-[#1D1D1F] shadow-[0_12px_36px_rgba(0,0,0,0.06)] scale-[1.01]"
                      : "border-[#E5E5E7] hover:border-[#D2D2D7] hover:scale-[1.005] shadow-[0_10px_24px_rgba(0,0,0,0.01)]"
                  }`}
                >
                  {plan.tag && (
                    <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-[#1D1D1F] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                      {plan.tag}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-[#86868B]">{plan.label} Plan</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPlan === key ? "border-[#1D1D1F] bg-[#1D1D1F]" : "border-[#E5E5E7] bg-transparent"
                    }`}>
                      {selectedPlan === key && <FiCheck size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight font-['Outfit',sans-serif]">₹{plan.price}</span>
                      <span className="text-xs font-bold text-[#86868B]">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <p className="text-xs font-bold text-[#117864] mt-2.5 bg-[#E8F8F5] inline-block px-3 py-1 rounded-lg">{plan.savings} vs monthly</p>
                    )}
                    <p className="text-[10px] font-bold text-[#86868B] mt-4">Billed for {plan.duration} · Cancel anytime after expiration</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscribe CTA */}
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSubscribe}
              disabled={loading}
              className={`w-full py-4.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-md ${
                loading 
                  ? "bg-[#F5F5F7] text-[#D2D2D7] cursor-not-allowed shadow-none" 
                  : "bg-[#1D1D1F] hover:bg-[#323236] text-white"
              }`}
              style={{ height: "54px" }}
            >
              {loading ? "Processing…" : <><span className="text-sm">💎</span> Get SeaBite Prime — ₹{PLANS[selectedPlan].price}{PLANS[selectedPlan].period}</>}
            </motion.button>
            <p className="text-center text-[10px] font-bold text-[#86868B] mt-4 tracking-wide">
              🔒 Secure payment via Razorpay · Fast activation
            </p>
          </div>
        )}

        {/* Benefits Comparison Grid (Apple Spec Layout) */}
        <div className="bg-[#F5F5F7] rounded-[2.5rem] p-8 md:p-12 border border-[#E5E5E7] mb-20">
          <div className="text-center mb-10 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#86868B]">Features Specifications</span>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight font-['Outfit',sans-serif] mt-2 text-[#1D1D1F]">Compare Benefits</h2>
          </div>
          
          <div className="space-y-6">
            {BENEFITS.map((b, i) => (
              <div 
                key={i} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-5 border-b border-[#E5E5E7] last:border-0 items-center"
              >
                {/* Benefit description */}
                <div className="md:col-span-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E7] flex items-center justify-center text-slate-800 shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1D1D1F]">{b.title}</h3>
                    <p className="text-xs text-[#86868B] font-semibold mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
                
                {/* Comparison items */}
                <div className="grid grid-cols-2 gap-4 md:col-span-6 text-xs font-bold text-center">
                  <div className="bg-white rounded-2xl p-3 border border-[#E5E5E7]/60">
                    <p className="text-[#86868B] uppercase tracking-widest text-[8px] mb-0.5">Regular</p>
                    <p className="text-stone-600">{b.compare.free}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-[#1D1D1F]/10">
                    <p className="text-[#328F85] uppercase tracking-widest text-[8px] mb-0.5">Prime VIP</p>
                    <p className="text-[#1D1D1F]">{b.compare.prime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-black uppercase tracking-widest text-[#86868B]">Frequently Asked Questions</span>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight font-['Outfit',sans-serif] mt-2 text-[#1D1D1F]">Membership FAQs</h2>
          </div>
          <div className="divide-y divide-[#E5E5E7] border-t border-b border-[#E5E5E7] mb-4">
            {[
              { q: "Can I cancel my Prime membership?", a: "You can cancel anytime. Your benefits continue until your current billing period ends — no early termination fees." },
              { q: "How does free delivery work?", a: "Prime members get free delivery on every order, regardless of order value, for the entire membership duration." },
              { q: "What is Early Flash Sale Access?", a: "Prime members get a 30-minute head start on all flash sales — ensuring you never miss out on the best deals." },
              { q: "Is my payment secure?", a: "Absolutely. Payments are processed via Razorpay, India's most trusted payment gateway, with 256-bit SSL encryption." },
            ].map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-4 flex justify-between items-center bg-transparent border-none cursor-pointer outline-none text-left"
      >
        <span className="text-sm md:text-base font-bold text-[#1D1D1F] pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <FiX size={18} className={open ? "text-[#1D1D1F]" : "text-[#86868B]"} style={{ transform: open ? "none" : "rotate(45deg)" }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="pb-4 text-xs md:text-sm text-[#86868B] font-semibold leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
