import { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import toast from "../../utils/toast";
import { Helmet } from "react-helmet-async";
import {
  FiCheck, FiZap, FiTruck, FiStar, FiShield, FiGift, FiClock, FiX
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "";

const PLANS = {
  monthly: { label: "Monthly", price: 149, period: "/month", tag: null, duration: "30 days", savings: null },
  yearly:  { label: "Yearly",  price: 999, period: "/year",  tag: "BEST VALUE", duration: "365 days", savings: "₹789 saved" },
};

const BENEFITS = [
  { icon: <FiTruck size={20} />, title: "Free Delivery", desc: "On every order, no minimum required", free: false, prime: true },
  { icon: <FiZap size={20} />, title: "Early Flash Sale Access", desc: "Shop 30 mins before everyone else", free: false, prime: true },
  { icon: <FiStar size={20} />, title: "5% Extra Discount", desc: "On top of any existing offers", free: false, prime: true },
  { icon: <FiShield size={20} />, title: "Priority Support", desc: "Dedicated support lane, 2h response", free: false, prime: true },
  { icon: <FiGift size={20} />, title: "Birthday Surprise", desc: "Special gift on your birthday month", free: false, prime: true },
  { icon: <FiClock size={20} />, title: "Same-Day Delivery", desc: "Express slots on select orders", free: "Paid", prime: "Free" },
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
      <Helmet>
        <title>SeaBite Prime — Exclusive Membership</title>
        <meta name="description" content="Join SeaBite Prime for free delivery, early flash sale access, and 5% extra off every order." />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* 💎 Hero Banner Card */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-[#1A2E2C] to-[#5BBFB5] px-6 py-16 md:py-20 text-white shadow-xl text-center mb-12">
          {/* Glowing backgrounds */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#5BBFB5]/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black uppercase tracking-widest text-[#5BBFB5] mb-6">
              <span>💎</span> SeaBite Prime
            </div>
            <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white mb-6 leading-tight">
              Elevate Your <span className="font-bold">Seafood Experience</span>
            </h1>
            <p className="text-sm md:text-base text-slate-200 font-medium leading-relaxed max-w-xl mx-auto mb-8">
              Enjoy unlimited free delivery, exclusive member pricing, early access to fresh catches, and priority support.
            </p>
            
            {/* Active prime notification */}
            {isPrime && primeExpiry && (
              <div className="inline-flex items-center gap-4 bg-white/10 border border-white/20 rounded-2xl p-4 md:px-6">
                <span className="text-2xl">💎</span>
                <div className="text-left">
                  <p className="text-[#5BBFB5] font-black uppercase tracking-wider text-[10px]">Active Membership</p>
                  <p className="text-slate-200 text-xs font-semibold mt-0.5">
                    Valid until {primeExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plan selection */}
        {!isPrime && (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {Object.entries(PLANS).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`bg-white rounded-[2.5rem] p-8 border-2 cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                    selectedPlan === key
                      ? "border-[#5BBFB5] shadow-[0_20px_50px_rgba(91,191,181,0.12)] scale-[1.02]"
                      : "border-slate-100 hover:border-slate-200 hover:scale-[1.01] shadow-[0_20px_50px_rgba(0,0,0,0.02)]"
                  }`}
                >
                  {plan.tag && (
                    <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-[#5BBFB5] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                      {plan.tag}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">{plan.label} Plan</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPlan === key ? "border-[#5BBFB5] bg-[#5BBFB5]" : "border-slate-200 bg-transparent"
                    }`}>
                      {selectedPlan === key && <FiCheck size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">₹{plan.price}</span>
                      <span className="text-sm font-semibold text-slate-400">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <p className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-50 inline-block px-2.5 py-1 rounded-lg">{plan.savings} vs monthly</p>
                    )}
                    <p className="text-[11px] font-medium text-slate-400 mt-3">Billed for {plan.duration} · Cancel anytime</p>
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
              className={`w-full py-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                loading 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-slate-900 hover:bg-[#5BBFB5] text-white shadow-slate-900/10"
              }`}
            >
              {loading ? "Processing…" : <><span className="text-sm">💎</span> Get SeaBite Prime — ₹{PLANS[selectedPlan].price}{PLANS[selectedPlan].period}</>}
            </motion.button>
            <p className="text-center text-[11px] font-semibold text-slate-400 mt-4">
              🔒 Secure payment via Razorpay · Cancel anytime after expiry
            </p>
          </div>
        )}

        {/* Benefits Comparison Grid */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden mb-16">
          <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50/50">
            <div className="col-span-8 p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Membership Benefits</span>
            </div>
            <div className="col-span-2 p-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Free</span>
            </div>
            <div className="col-span-2 p-6 text-center bg-[#5BBFB5]/5 border-l border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5BBFB5]">Prime</span>
            </div>
          </div>
          
          {BENEFITS.map((b, i) => (
            <div key={i} className="grid grid-cols-12 border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
              <div className="col-span-8 p-6 flex items-start gap-4">
                <div className="text-[#5BBFB5] p-2 bg-[#5BBFB5]/10 rounded-xl mt-0.5 shrink-0">{b.icon}</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm md:text-base">{b.title}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
              
              <div className="col-span-2 p-6 flex items-center justify-center">
                {b.free === true ? <FiCheck size={18} className="text-emerald-500" strokeWidth={3} /> :
                 b.free === false ? <FiX size={18} className="text-slate-200" strokeWidth={3} /> :
                 <span className="text-xs font-bold text-slate-400">{b.free}</span>}
              </div>
              
              <div className="col-span-2 p-6 flex items-center justify-center bg-[#5BBFB5]/5 border-l border-slate-100">
                {b.prime === true ? <FiCheck size={18} className="text-[#5BBFB5]" strokeWidth={3} /> :
                 b.prime === false ? <FiX size={18} className="text-slate-200" strokeWidth={3} /> :
                 <span className="text-xs font-black text-[#5BBFB5]">{b.prime}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 text-center">
            Frequently Asked Questions
          </h2>
          {[
            { q: "Can I cancel my Prime membership?", a: "You can cancel anytime. Your benefits continue until your current billing period ends — no early termination." },
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] mb-4 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-6 flex justify-between items-center bg-transparent border-none cursor-pointer outline-none text-left"
      >
        <span className="text-sm font-bold text-slate-900 pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <FiCheck size={18} className={open ? "text-[#5BBFB5]" : "text-slate-350"} />
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
