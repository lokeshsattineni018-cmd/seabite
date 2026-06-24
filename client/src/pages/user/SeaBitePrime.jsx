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
    icon: <FiTruck size={24} />, 
    title: "Free Delivery", 
    desc: "On every order, no minimum required",
    compare: { free: "₹49/order", prime: "FREE" }
  },
  { 
    icon: <FiZap size={24} />, 
    title: "Early Flash Sale Access", 
    desc: "Shop 30 mins before everyone else", 
    compare: { free: "Standard Access", prime: "30m Headstart" }
  },
  { 
    icon: <FiStar size={24} />, 
    title: "5% Extra Discount", 
    desc: "On top of any existing offers", 
    compare: { free: "None", prime: "Extra 5% Off" }
  },
  { 
    icon: <FiShield size={24} />, 
    title: "Priority Support", 
    desc: "Dedicated support lane, 2h response", 
    compare: { free: "Standard", prime: "2h Fast Lane" }
  },
  { 
    icon: <FiGift size={24} />, 
    title: "Birthday Surprise", 
    desc: "Special gift on your birthday month", 
    compare: { free: "None", prime: "Gift Box 🎁" }
  },
  { 
    icon: <FiClock size={24} />, 
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
        theme: { color: "#5BBFB5" },
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
    <div className="min-h-screen bg-[#060F18] text-white pb-20 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Helmet>
        <title>SeaBite Prime — Exclusive Membership</title>
        <meta name="description" content="Join SeaBite Prime for free delivery, early flash sale access, and 5% extra off every order." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" />
      </Helmet>

      {/* Decorative Glow Spots */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#5BBFB5]/10 to-[#3b82f6]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#6366f1]/5 to-[#5BBFB5]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* 💎 Hero Banner Card */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0c1928] via-[#0f2d2b] to-[#12423c] border border-white/5 px-6 py-20 text-white shadow-2xl text-center mb-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91,191,181,0.08),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#5BBFB5] mb-6"
            >
              <span>💎</span> SeaBite Prime Membership
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight text-white mb-6 leading-tight font-['Outfit',sans-serif]"
            >
              Elevate Your <span className="font-bold bg-gradient-to-r from-white via-[#e2f3f1] to-[#5BBFB5] bg-clip-text text-transparent">Seafood Experience</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-xl mx-auto mb-10"
            >
              Unlock unlimited free delivery, exclusive member-only pricing, early access to premium fresh catches, and priority support.
            </motion.p>
            
            {/* Active prime notification */}
            {isPrime && primeExpiry && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2rem] p-5 md:px-8 shadow-inner"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#5BBFB5] to-[#2e7d75] rounded-full flex items-center justify-center text-xl shadow-lg shadow-[#5BBFB5]/20">💎</div>
                <div className="text-left">
                  <p className="text-[#5BBFB5] font-black uppercase tracking-wider text-[9px]">Active VIP Membership</p>
                  <p className="text-slate-100 text-xs font-semibold mt-0.5">
                    Valid until {primeExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Subscription Plan selection */}
        {!isPrime && (
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-[#5BBFB5] mb-10">Choose Your Membership Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {Object.entries(PLANS).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`bg-[#0d1622]/85 backdrop-blur-md rounded-[2.5rem] p-10 border-2 cursor-pointer transition-all duration-300 relative flex flex-col justify-between group ${
                    selectedPlan === key
                      ? "border-[#5BBFB5] shadow-[0_20px_50px_rgba(91,191,181,0.12)] scale-[1.03]"
                      : "border-white/5 hover:border-white/10 hover:scale-[1.01] shadow-2xl"
                  }`}
                >
                  {plan.tag && (
                    <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 bg-[#5BBFB5] text-slate-900 text-[9px] font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg shadow-[#5BBFB5]/30">
                      {plan.tag}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black uppercase tracking-widest text-[#5BBFB5]">{plan.label} Plan</span>
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPlan === key ? "border-[#5BBFB5] bg-[#5BBFB5]" : "border-white/10 bg-transparent"
                    }`}>
                      {selectedPlan === key && <FiCheck size={14} color="#0d1622" strokeWidth={3} />}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white tracking-tight font-['Outfit',sans-serif]">₹{plan.price}</span>
                      <span className="text-sm font-semibold text-slate-400">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <p className="text-xs font-bold text-emerald-400 mt-3 bg-emerald-950/50 border border-emerald-800/30 inline-block px-3 py-1 rounded-xl">{plan.savings} vs monthly</p>
                    )}
                    <p className="text-[11px] font-medium text-slate-400 mt-4">Billed for {plan.duration} · Cancel anytime after expiration</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscribe CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubscribe}
              disabled={loading}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl ${
                loading 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none" 
                  : "bg-[#5BBFB5] hover:bg-[#4eb0a6] text-slate-900 shadow-[#5BBFB5]/20"
              }`}
            >
              {loading ? "Processing…" : <><span className="text-sm">💎</span> Get SeaBite Prime — ₹{PLANS[selectedPlan].price}{PLANS[selectedPlan].period}</>}
            </motion.button>
            <p className="text-center text-[10px] font-bold text-slate-500 mt-4 tracking-wider">
              🔒 Secure payment via Razorpay · Fast activation
            </p>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="mb-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#5BBFB5]">Member Privilege</span>
            <h2 className="text-3xl font-extralight tracking-tight font-['Outfit',sans-serif] mt-2 text-white">Compare Benefits</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div 
                key={i}
                className="bg-[#0d1622]/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#5BBFB5]/10 border border-[#5BBFB5]/20 flex items-center justify-center text-[#5BBFB5] mb-6 group-hover:scale-110 transition-transform">
                    {b.icon}
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">{b.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-6">{b.desc}</p>
                </div>
                
                {/* Comparison Details */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 text-[11px] font-bold">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-slate-500 uppercase tracking-widest text-[8px]">Regular</p>
                    <p className="text-slate-350 mt-1">{b.compare.free}</p>
                  </div>
                  <div className="bg-[#5BBFB5]/5 rounded-xl p-3 border border-[#5BBFB5]/10">
                    <p className="text-[#5BBFB5] uppercase tracking-widest text-[8px]">Prime VIP</p>
                    <p className="text-[#5BBFB5] mt-1">{b.compare.prime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#5BBFB5]">Have Questions?</span>
            <h2 className="text-3xl font-extralight tracking-tight font-['Outfit',sans-serif] mt-2 text-white">Membership FAQs</h2>
          </div>
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
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#0d1622]/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl mb-4 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-6 flex justify-between items-center bg-transparent border-none cursor-pointer outline-none text-left"
      >
        <span className="text-sm font-bold text-white pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <FiCheck size={18} className={open ? "text-[#5BBFB5]" : "text-slate-500"} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="px-6 pb-6 text-xs md:text-sm text-slate-400 font-semibold leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
