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
    <div style={{ minHeight: "100vh", background: "#F4F9F8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>SeaBite Prime — Exclusive Membership</title>
        <meta name="description" content="Join SeaBite Prime for free delivery, early flash sale access, and 5% extra off every order." />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" />
      </Helmet>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0D1B1A 0%, #1A2E2C 50%, #0D2822 100%)",
        padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        {/* Background orbs */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(91,191,181,0.15), transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(91,191,181,0.1), transparent 70%)", borderRadius: "50%" }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(91,191,181,0.15)", border: "1px solid rgba(91,191,181,0.3)", borderRadius: "100px", padding: "8px 18px", marginBottom: "28px" }}>
            <span style={{ fontSize: "16px" }}>💎</span>
            <span style={{ fontSize: "12px", fontWeight: "900", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.12em" }}>SeaBite Prime</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "900", color: "#fff", letterSpacing: "-0.04em", margin: "0 0 20px", lineHeight: 1.05 }}>
            Elevate Your<br />Seafood Experience
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", maxWidth: "520px", margin: "0 auto 48px", lineHeight: 1.6, fontWeight: "500" }}>
            Free delivery, exclusive discounts, and early access to the freshest deals — all in one membership.
          </p>

          {/* Prime Status Banner */}
          {isPrime && primeExpiry && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: "inline-flex", alignItems: "center", gap: "12px", background: "linear-gradient(135deg, rgba(91,191,181,0.2), rgba(91,191,181,0.1))", border: "1.5px solid rgba(91,191,181,0.4)", borderRadius: "16px", padding: "16px 24px", marginBottom: "32px" }}
            >
              <span style={{ fontSize: "24px" }}>💎</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "#5BBFB5", fontWeight: "900", fontSize: "14px", margin: 0 }}>You're a Prime Member!</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "2px 0 0", fontWeight: "600" }}>
                  Active until {primeExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: "900px", margin: "-40px auto 0", padding: "0 24px", position: "relative", zIndex: 10 }}>
        {!isPrime && (
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "48px" }}>
              {Object.entries(PLANS).map(([key, plan]) => (
                <motion.div
                  key={key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlan(key)}
                  style={{
                    background: "#fff", borderRadius: "24px", padding: "28px",
                    border: `2.5px solid ${selectedPlan === key ? "#5BBFB5" : "#E2EEEC"}`,
                    cursor: "pointer", position: "relative", transition: "all 0.2s",
                    boxShadow: selectedPlan === key ? "0 16px 48px rgba(91,191,181,0.18)" : "0 4px 16px rgba(0,0,0,0.03)",
                    transform: selectedPlan === key ? "translateY(-4px)" : "none",
                  }}
                >
                  {plan.tag && (
                    <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#5BBFB5", color: "#fff", fontSize: "9px", fontWeight: "900", padding: "4px 12px", borderRadius: "20px", letterSpacing: "0.12em" }}>
                      {plan.tag}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#6B8F8A" }}>{plan.label}</span>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `2.5px solid ${selectedPlan === key ? "#5BBFB5" : "#E2EEEC"}`, background: selectedPlan === key ? "#5BBFB5" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                      {selectedPlan === key && <FiCheck size={12} color="#fff" strokeWidth={3} />}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "40px", fontWeight: "900", color: "#1A2E2C", letterSpacing: "-0.04em" }}>₹{plan.price}</span>
                    <span style={{ fontSize: "14px", color: "#6B8F8A", fontWeight: "600" }}>{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p style={{ fontSize: "12px", fontWeight: "800", color: "#10B981", margin: "6px 0 0" }}>{plan.savings} vs monthly</p>
                  )}
                  <p style={{ fontSize: "12px", color: "#6B8F8A", margin: "4px 0 0", fontWeight: "600" }}>Billed for {plan.duration}</p>
                </motion.div>
              ))}
            </div>

            {/* Subscribe Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                width: "100%", padding: "20px", borderRadius: "16px",
                background: loading ? "#B8CFCC" : "linear-gradient(135deg, #5BBFB5, #3D9E94)",
                border: "none", color: "#fff", fontSize: "17px", fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: "0 12px 32px rgba(91,191,181,0.35)",
                letterSpacing: "0.01em", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
              }}
            >
              {loading ? "Processing…" : <><span>💎</span> Get SeaBite Prime — ₹{PLANS[selectedPlan].price}{PLANS[selectedPlan].period}</>}
            </motion.button>
            <p style={{ textAlign: "center", fontSize: "12px", color: "#6B8F8A", fontWeight: "600" }}>
              🔒 Secure payment via Razorpay · Cancel anytime after expiry
            </p>
          </motion.div>
        )}

        {/* Benefits Comparison */}
        <div style={{ background: "#fff", borderRadius: "24px", border: "1.5px solid #E2EEEC", overflow: "hidden", marginBottom: "48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", borderBottom: "1.5px solid #E2EEEC" }}>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: "11px", fontWeight: "900", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Benefits</p>
            </div>
            <div style={{ padding: "20px 24px", textAlign: "center", minWidth: "100px" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#6B8F8A", margin: 0 }}>Free</p>
            </div>
            <div style={{ padding: "20px 24px", textAlign: "center", minWidth: "100px", background: "rgba(91,191,181,0.05)", borderLeft: "2px solid rgba(91,191,181,0.2)" }}>
              <p style={{ fontSize: "12px", fontWeight: "900", color: "#5BBFB5", margin: 0 }}>💎 Prime</p>
            </div>
          </div>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", borderBottom: i < BENEFITS.length - 1 ? "1px solid #E2EEEC" : "none" }}>
              <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ color: "#5BBFB5" }}>{b.icon}</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{b.title}</p>
                  <p style={{ fontSize: "12px", color: "#6B8F8A", margin: "2px 0 0", fontWeight: "500" }}>{b.desc}</p>
                </div>
              </div>
              <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "100px" }}>
                {b.free === true ? <FiCheck size={18} color="#10B981" strokeWidth={3} /> :
                 b.free === false ? <FiX size={18} color="#E2EEEC" strokeWidth={3} /> :
                 <span style={{ fontSize: "12px", fontWeight: "700", color: "#6B8F8A" }}>{b.free}</span>}
              </div>
              <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "100px", background: "rgba(91,191,181,0.03)", borderLeft: "2px solid rgba(91,191,181,0.2)" }}>
                {b.prime === true ? <FiCheck size={18} color="#5BBFB5" strokeWidth={3} /> :
                 b.prime === false ? <FiX size={18} color="#E2EEEC" strokeWidth={3} /> :
                 <span style={{ fontSize: "12px", fontWeight: "700", color: "#5BBFB5" }}>{b.prime}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ paddingBottom: "80px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1A2E2C", letterSpacing: "-0.02em", marginBottom: "24px", textAlign: "center" }}>
            Frequently Asked
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
    <div style={{ border: "1.5px solid #E2EEEC", borderRadius: "16px", marginBottom: "12px", overflow: "hidden", background: "#fff" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <span style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", textAlign: "left" }}>{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <FiCheck size={18} color={open ? "#5BBFB5" : "#B8CFCC"} />
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
            <p style={{ padding: "0 24px 18px", fontSize: "14px", color: "#6B8F8A", lineHeight: 1.65, margin: 0, fontWeight: "500" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
