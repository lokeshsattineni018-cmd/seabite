import { useEffect, useState, useContext, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin, FiCheckCircle, FiMinus, FiPlus, FiTrash2, FiShield,
  FiXCircle, FiHome, FiShoppingBag, FiTag, FiX, FiCreditCard,
  FiTruck, FiLoader, FiAlertCircle, FiGift, FiChevronRight,
  FiClock, FiPercent, FiCheck, FiPlus as FiPlusIcon,
} from "react-icons/fi";
import AddressForm from "../../components/forms/AddressForm";
import PopupModal from "../../components/common/PopupModal";
import { CartContext } from "../../context/CartContext";
import toast from "react-hot-toast";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

import { formatAddress } from "../../utils/addressFormatter";

const API_URL = import.meta.env.VITE_API_URL || "";

const T = {
  bg: "#F4F9F8",
  surface: "#ffffff",
  border: "#E2EEEC",
  textDark: "#1A2B35",
  textMid: "#4A6572",
  textLite: "#8BA5B3",
  primary: "#5BA8A0",
  sky: "#89C2D9",
  coral: "#E8816A",
};

const font = "'Plus Jakarta Sans', sans-serif";

const STEPS = ["Shipping", "Payment", "Confirm"];

function SectionCard({ children, style = {} }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div style={{
      background: T.surface,
      borderRadius: 24,
      padding: isMobile ? "16px" : "24px",
      border: `1px solid ${T.border}`,
      boxShadow: "0 8px 32px rgba(91,168,160,0.05)",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
      ...style
    }}>
      {children}
    </div>
  );
}

function SectionHead({ icon, title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(91,168,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: T.textDark, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: T.textLite, margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function StepsBar({ currentStep }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const stepNum = i + 1;
        const active = currentStep >= stepNum;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: active ? T.primary : T.border,
                color: active ? "#fff" : T.textLite,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, flexShrink: 0
              }}>
                {active && currentStep > stepNum ? <FiCheck size={12} /> : stepNum}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: active ? T.textDark : T.textLite, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: active ? T.primary : T.border, opacity: 0.3, marginLeft: 8 }} />}
          </div>
        );
      })}
    </div>
  );
}


// Coupon Drawer Component
function CouponDrawer({ isOpen, onClose, coupons, appliedCoupon, onApply, onClear, itemTotal }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 400,
              background: "#fff", zIndex: 201, boxShadow: "-10px 0 40px rgba(0,0,0,0.1)",
              display: "flex", flexDirection: "column"
            }}
          >
            <div style={{ padding: "24px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.textDark, margin: 0 }}>Available Offers</h3>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textLite }}><FiX size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {coupons.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <FiGift size={40} style={{ color: T.border, marginBottom: 12 }} />
                  <p style={{ color: T.textLite, fontSize: 14 }}>No coupons available right now.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {coupons.map(c => {
                    const isApplied = appliedCoupon?.code === c.code;
                    const canApply = itemTotal >= (c.minOrderAmount || 0);
                    return (
                      <div key={c._id || c.code} style={{
                        padding: 16, borderRadius: 16, border: `2px dashed ${isApplied ? T.primary : T.border}`,
                        background: isApplied ? "rgba(91,168,160,0.04)" : "transparent",
                        position: "relative"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: T.textDark, fontFamily: "monospace" }}>{c.code}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>
                            {c.discountType === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: T.textMid, margin: "0 0 12px" }}>{c.description || "Limited time offer!"}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: canApply ? T.textLite : T.coral, fontWeight: 600 }}>
                            {canApply ? `Min. ₹${c.minOrderAmount} met` : `Need ₹${(c.minOrderAmount - itemTotal).toFixed(0)} more`}
                          </span>
                          <button
                            onClick={() => isApplied ? onClear() : onApply(c.code)}
                            disabled={!canApply && !isApplied}
                            style={{
                              padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                              background: isApplied ? "rgba(232,129,106,0.1)" : T.primary,
                              color: isApplied ? T.coral : "#fff",
                              border: "none", cursor: (canApply || isApplied) ? "pointer" : "not-allowed",
                              opacity: (!canApply && !isApplied) ? 0.5 : 1
                            }}
                          >
                            {isApplied ? "Remove" : "Apply"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Checkout() {
  const { cartItems, subtotal, storeSettings, refreshCartCount, clearCart, updateQuantity, removeFromCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);
  const [spinDiscount, setSpinDiscount] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState({});
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isItemsCollapsed, setIsItemsCollapsed] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/\\/g, "/").replace("uploads/", "");
    return `${API_URL}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/address`, { withCredentials: true });
        setAddresses(res.data);
        const defaultAddr = res.data.find(a => a.isDefault);
        if (defaultAddr) setDeliveryAddress(defaultAddr);
      } catch { }
    };
    fetchAddresses();
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/api/coupons/public`, { withCredentials: true })
      .then(res => setAvailableCoupons(Array.isArray(res.data) ? res.data : []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    const savedDiscount = localStorage.getItem("seabiteSpinDiscount");
    if (savedDiscount) {
      try {
        const discount = JSON.parse(savedDiscount);
        if (new Date() < new Date(discount.expiresAt)) setSpinDiscount(discount);
        else localStorage.removeItem("seabiteSpinDiscount");
      } catch { }
    }
  }, []);

  const isOrderSuccess = useRef(false);

  useEffect(() => {
    let timeoutId;
    if (cartItems.length === 0 && !isOrderSuccess.current) {
      setModal({ show: true, message: "Your cart is empty!", type: "error" });
      timeoutId = setTimeout(() => navigate("/products"), 2000);
    }
    return () => clearTimeout(timeoutId);
  }, [cartItems, navigate]);

  const itemTotal = parseFloat(subtotal) || 0;
  const taxRate = storeSettings?.taxRate !== undefined ? parseFloat(storeSettings.taxRate) / 100 : 0.05;
  const deliveryFee = storeSettings?.deliveryFee !== undefined ? parseFloat(storeSettings.deliveryFee) : 99;
  const freeThreshold = storeSettings?.freeDeliveryThreshold !== undefined ? parseFloat(storeSettings.freeDeliveryThreshold) : 1000;
  const isShippingCoupon = appliedCoupon?.discountType === "shipping";
  const deliveryCharge = (itemTotal >= freeThreshold || isShippingCoupon) ? 0 : deliveryFee;
  const freeDeliveryProgress = freeThreshold > 0 ? Math.min((itemTotal / freeThreshold) * 100, 100) : 100;

  const discountAmount = useMemo(() => {
    if (spinDiscount) return Math.min((itemTotal * (spinDiscount.percentage || 0)) / 100, itemTotal);
    if (!appliedCoupon) return 0;
    const val = parseFloat(appliedCoupon.discountValue || appliedCoupon.value || 0);
    if (appliedCoupon.discountType === "percent") return Math.min((itemTotal * val) / 100, itemTotal);
    if (appliedCoupon.discountType === "flat") return Math.min(val, itemTotal);
    return 0; // shipping coupons show in their own row
  }, [itemTotal, spinDiscount, appliedCoupon]);

  const taxableAmount = Math.max(0, itemTotal - discountAmount);
  const gst = Math.round(taxableAmount * taxRate);
  const grandTotal = taxableAmount + deliveryCharge + gst;

  const clearCoupon = () => { setAppliedCoupon(null); setCouponCode(""); setCouponMessage(null); };

  const applyCouponByCode = async (code) => {
    if (!code) return;
    setVerifyingCoupon(true); setCouponMessage(null);
    // First try to find locally
    const local = availableCoupons.find(c => c.code?.toUpperCase() === code.toUpperCase());
    if (local) {
      if (itemTotal < (local.minOrderAmount || 0)) {
        setCouponMessage({ type: "error", text: `Min order ₹${local.minOrderAmount} required` });
        setVerifyingCoupon(false); return;
      }
      setAppliedCoupon(local);
      setCouponCode(local.code);
      setCouponMessage({ type: "success", text: local.description || "Coupon applied!" });
      setVerifyingCoupon(false); return;
    }
    const currentEmail = localStorage.getItem("userEmail")?.toLowerCase();
    try {
      const res = await axios.post(`${API_URL}/api/coupons/validate`, { code: code.trim().toUpperCase(), cartTotal: itemTotal, email: currentEmail || undefined }, { withCredentials: true });
      if (res.data.success) {
        setAppliedCoupon({ code: code.trim().toUpperCase(), discountType: "flat", discountValue: res.data.discountAmount, description: res.data.message });
        setCouponCode(code.trim().toUpperCase());
        setCouponMessage({ type: "success", text: res.data.message });
      }
    } catch (err) {
      setCouponMessage({ type: "error", text: err.response?.data?.message || "Invalid Coupon Code" });
    } finally { setVerifyingCoupon(false); }
  };

  const handleApplyCoupon = () => applyCouponByCode(couponCode);

  const deleteAddress = async (addrId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/api/user/address/${addrId}`, { withCredentials: true });
      const updated = addresses.filter(a => a._id !== addrId);
      setAddresses(updated);
      if (deliveryAddress._id === addrId) setDeliveryAddress(updated[0] || {});
      toast.success("Address removed");
    } catch { toast.error("Failed to remove address"); }
  };

  const saveNewAddress = async (newAddress) => {
    try {
      const res = await axios.post(`${API_URL}/api/user/address`, newAddress, { withCredentials: true });
      setAddresses(res.data);
      const added = res.data[res.data.length - 1];
      setDeliveryAddress(added);
      setIsAddressModalOpen(false);
      toast.success("Address added");
    } catch { toast.error("Failed to save address"); }
  };

  const placeOrder = async () => {
    if (!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.street || !deliveryAddress.houseNo || !deliveryAddress.city || !deliveryAddress.postalCode) {
      setModal({ show: true, message: "Please complete all delivery address fields.", type: "error" });
      return;
    }
    // 🛡️ PIN CODE GUARD: Only AP & TS delivery (500001–535999)
    const pinNum = parseInt(deliveryAddress.postalCode, 10);
    if (isNaN(pinNum) || pinNum < 500001 || pinNum > 535999) {
      setModal({ show: true, message: "Sorry, we deliver only in Andhra Pradesh & Telangana (PIN: 500001–535999).", type: "error" });
      return;
    }
    setLoading(true);
    const orderDetails = {
      amount: grandTotal,
      items: cartItems.map(item => ({ productId: item._id, name: item.name, price: item.price, qty: item.qty, image: item.image })),
      shippingAddress: { fullName: deliveryAddress.name, phone: deliveryAddress.phone, houseNo: deliveryAddress.houseNo, street: deliveryAddress.street, city: deliveryAddress.city, state: deliveryAddress.state, zip: deliveryAddress.postalCode },
      itemsPrice: itemTotal, taxPrice: gst, shippingPrice: deliveryCharge, discount: discountAmount, paymentMethod,
    };
    try {
      const { data } = await axios.post(`${API_URL}/api/payment/checkout`, orderDetails, { withCredentials: true });
      const internalDbId = data.dbOrderId;
      if (spinDiscount) localStorage.removeItem("seabiteSpinDiscount");

      if (paymentMethod === "COD") {
        isOrderSuccess.current = true; // Prevent "Cart Empty" redirect
        clearCart();
        refreshCartCount();
        navigate(`/success?dbId=${internalDbId}&discount=${discountAmount}&total=${grandTotal}`, { replace: true, state: { fromCheckout: true } });
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RudgOJMh7819Qs",
        amount: data.order.amount, currency: "INR",
        name: "SeaBite", description: "Fresh Coastal Catch Payment", order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_URL}/api/payment/verify`, response, { withCredentials: true });
            if (verifyRes.data.success) {
              isOrderSuccess.current = true; // Prevent "Cart Empty" redirect
              clearCart();
              refreshCartCount();
              navigate(`/success?dbId=${internalDbId}&discount=${discountAmount}&total=${grandTotal}`, { replace: true, state: { fromCheckout: true } });
            }
          } catch { setModal({ show: true, message: "Payment Verification Failed", type: "error" }); }
        },
        prefill: { name: deliveryAddress.name, contact: deliveryAddress.phone },
        theme: { color: T.primary },
        modal: {
          ondismiss: () => {
            setLoading(false);
            // Don't flip isOrderSuccess here, as payment was cancelled but order might still be in DB (Pending)
          }
        },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        throw new Error("Razorpay SDK failed to load. Please check your connection.");
      }
    } catch (err) {
      setModal({ show: true, message: err.response?.data?.message || err.message || "Order initiation failed.", type: "error" });
    } finally {
      if (!isOrderSuccess.current) setLoading(false);
    }
  };

  const currentStep = deliveryAddress._id ? (paymentMethod ? 3 : 2) : 1;

  const handleApplyCouponFromDrawer = (code) => {
    applyCouponByCode(code);
    setShowCouponDrawer(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: font, padding: "100px 20px 60px", overflowX: "hidden" }}>
      <CouponDrawer 
        isOpen={showCouponDrawer} 
        onClose={() => setShowCouponDrawer(false)}
        coupons={availableCoupons}
        appliedCoupon={appliedCoupon}
        onApply={handleApplyCouponFromDrawer}
        onClear={clearCoupon}
        itemTotal={itemTotal}
      />
      
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 400, background: "linear-gradient(180deg, rgba(91,168,160,0.06) 0%, transparent 100%)" }} />
      </div>

      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />

      <AnimatePresence>
        {isAddressModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} style={{ width: "100%", maxWidth: 640 }}>
              <AddressForm onSave={saveNewAddress} onCancel={() => setIsAddressModalOpen(false)} initialData={deliveryAddress} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Steps */}
        <StepsBar currentStep={currentStep} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(180deg, ${T.primary}, ${T.sky})` }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.16em" }}>Secure Checkout</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: T.textDark, letterSpacing: "-0.03em", margin: 0 }}>
            Order <span style={{ color: T.primary }}>Summary</span>
          </h1>
        </motion.div>
        
        {/* Main Grid */}
        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginTop: 12 }}>
          {/* LEFT - FORM */}
          <div>
            {/* ── SHIPPING ADDRESS ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease }}>
              <SectionCard>
                <SectionHead 
                  icon={<FiMapPin size={16} />} 
                  title="Shipping Address" 
                  action={<motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsAddressModalOpen(true)} style={{ fontSize: 10, fontWeight: 800, color: T.primary, background: "rgba(91,168,160,0.1)", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 8 }}>{deliveryAddress._id ? "Change" : "Add New"}</motion.button>}
                />
                {deliveryAddress._id && (
                  <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 9, background: "rgba(91,168,160,0.08)", border: "1px solid rgba(91,168,160,0.18)", display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: T.primary }}>
                    <FiCheckCircle size={12} /> Delivering to: {formatAddress(`${deliveryAddress.city}, ${deliveryAddress.state}`)}
                  </div>
                )}
              </SectionCard>
            </motion.div>

            {/* ── PAYMENT METHOD ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.5, ease }}>
              <SectionCard>
                <SectionHead icon={<FiCreditCard size={16} />} title="Payment Method" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {/* Prepaid - disabled */}
                  <div style={{ opacity: 0.45, cursor: "not-allowed", position: "relative" }} title="Currently under maintenance">
                    <div style={{ padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${T.border}`, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: T.textMid, margin: 0 }}>Razorpay</p>
                        <p style={{ fontSize: 10, color: T.textLite, margin: "2px 0 0" }}>Under maintenance</p>
                      </div>
                    </div>
                  </div>

                  {/* COD */}
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPaymentMethod("COD")}
                    style={{
                      padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${paymentMethod === "COD" ? T.primary : T.border}`,
                      background: paymentMethod === "COD" ? "rgba(91,168,160,0.05)" : T.bg,
                      display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s",
                    }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${paymentMethod === "COD" ? T.primary : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {paymentMethod === "COD" && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: T.textDark, margin: 0 }}>Cash on Delivery</p>
                      <p style={{ fontSize: 10, color: T.textLite, margin: "2px 0 0" }}>Pay when it arrives</p>
                    </div>
                  </motion.div>
                </div>
              </SectionCard>
            </motion.div>

            {/* ── CART ITEMS ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.5, ease }}>
              <SectionCard>
                <div 
                  onClick={() => window.innerWidth < 768 && setIsItemsCollapsed(!isItemsCollapsed)}
                  style={{ cursor: window.innerWidth < 768 ? "pointer" : "default" }}
                >
                  <SectionHead
                    icon={<FiShoppingBag size={16} />}
                    title="Your Items"
                    action={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, background: "rgba(91,168,160,0.1)", padding: "4px 10px", borderRadius: 7 }}>
                          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                        </span>
                        {window.innerWidth < 768 && (
                          <motion.div animate={{ rotate: isItemsCollapsed ? 0 : 180 }}>
                            <FiChevronRight size={16} style={{ color: T.textLite, transform: "rotate(90deg)" }} />
                          </motion.div>
                        )}
                      </div>
                    }
                  />
                </div>
                <motion.div 
                  initial={false}
                  animate={{ height: isItemsCollapsed ? 0 : "auto", opacity: isItemsCollapsed ? 0 : 1 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: isItemsCollapsed ? 0 : 10 }}>
                  <AnimatePresence mode="popLayout">
                    {cartItems.map((item, index) => (
                      <motion.div
                        key={item._id} layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03, ease } }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, flexWrap: "wrap" }}
                      >
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, padding: 6, flexShrink: 0 }}>
                          <img src={getFullImageUrl(item.image)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontWeight: 700, fontSize: 13, color: T.textDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h4>
                          <p style={{ fontSize: 10, color: T.textLite, margin: "3px 0 0" }}>₹{item.price.toFixed(2)} / unit</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", borderRadius: 12, border: `1.5px solid ${T.border}`, overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                            <motion.button 
                              whileHover={{ background: "rgba(232,129,106,0.05)", color: T.coral }}
                              whileTap={{ scale: 0.9 }} 
                              onClick={() => updateQuantity(item._id, item.qty - 1)}
                              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: T.textLite, background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              <FiMinus size={12} strokeWidth={3} />
                            </motion.button>
                            <div style={{ width: 30, textAlign: "center", fontSize: 13, fontWeight: 800, color: T.textDark, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {item.qty}
                            </div>
                            <motion.button 
                              whileHover={{ background: "rgba(91,168,160,0.05)", color: T.primary }}
                              whileTap={{ scale: 0.9 }} 
                              onClick={() => updateQuantity(item._id, item.qty + 1)}
                              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: T.textLite, background: "none", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              <FiPlus size={12} strokeWidth={3} />
                            </motion.button>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: T.textDark, minWidth: 60, textAlign: "right" }}>₹{(item.price * item.qty).toFixed(2)}</span>
                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeFromCart(item._id)}
                            style={{ color: T.border, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                            <FiTrash2 size={13} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </SectionCard>
            </motion.div>
          </div>

          {/* RIGHT - ORDER SUMMARY */}
          <div style={{ position: "sticky", top: 96, alignSelf: "flex-start" }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease }}>
              <SectionCard>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: T.textDark, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <FiCreditCard size={14} style={{ color: T.primary }} /> Payment Details
                </h3>

                {/* Spin discount */}
                <AnimatePresence>
                  {spinDiscount && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 14, overflow: "hidden" }}>
                      <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(91,168,160,0.06)", border: "1px solid rgba(91,168,160,0.18)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(91,168,160,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
                          <FiGift size={14} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: T.primary, margin: 0 }}>Spin Wheel Discount Active</p>
                          <p style={{ fontSize: 10, color: T.textLite, margin: "2px 0 0" }}>{spinDiscount.percentage}% OFF · Until {new Date(spinDiscount.expiresAt).toLocaleDateString()}</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => { setSpinDiscount(null); localStorage.removeItem("seabiteSpinDiscount"); }}
                          style={{ color: T.textLite, background: "none", border: "none", cursor: "pointer" }}>
                          <FiX size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Coupon */}
                {!spinDiscount ? (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Promo Code</p>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCouponDrawer(true)}
                        style={{ 
                          fontSize: 10, fontWeight: 800, color: T.primary, 
                          background: "rgba(91,168,160,0.1)", border: "none", 
                          cursor: "pointer", fontFamily: font, padding: "4px 10px",
                          borderRadius: 6, display: "flex", alignItems: "center", gap: 4
                        }}>
                        <FiTag size={10} /> View available
                      </motion.button>
                    </div>

                    {/* Manual input row */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <FiTag size={12} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textLite }} />
                        <input
                          type="text" placeholder="Enter code" value={couponCode}
                          onChange={e => setCouponCode(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                          disabled={!!appliedCoupon || verifyingCoupon}
                          style={{
                            width: "100%", paddingLeft: 34, paddingRight: appliedCoupon ? 34 : 12, paddingTop: 11, paddingBottom: 11,
                            borderRadius: 11, border: `1px solid ${appliedCoupon ? T.primary : T.border}`, background: T.bg,
                            fontSize: 12, fontWeight: 700, color: T.textDark, outline: "none",
                            textTransform: "uppercase", fontFamily: font, boxSizing: "border-box",
                          }}
                        />
                        {appliedCoupon && (
                          <motion.button whileTap={{ scale: 0.85 }} onClick={clearCoupon}
                            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: T.textLite, background: "none", border: "none", cursor: "pointer" }}>
                            <FiX size={12} />
                          </motion.button>
                        )}
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={appliedCoupon ? clearCoupon : handleApplyCoupon}
                        disabled={!appliedCoupon && (!couponCode || verifyingCoupon)}
                        style={{
                          padding: "11px 16px", borderRadius: 11,
                          background: appliedCoupon ? "rgba(232,129,106,0.1)" : T.primary,
                          color: appliedCoupon ? T.coral : "#fff",
                          border: appliedCoupon ? `1px solid rgba(232,129,106,0.25)` : "none",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: font,
                          opacity: (!appliedCoupon && !couponCode) ? 0.5 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center", minWidth: 64,
                        }}>
                        {verifyingCoupon ? <FiLoader size={13} style={{ animation: "spin 1s linear infinite" }} /> : appliedCoupon ? "Remove" : "Apply"}
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {couponMessage && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 10, fontWeight: 700, marginTop: 6, display: "flex", alignItems: "center", gap: 4, color: couponMessage.type === "success" ? T.primary : T.coral }}>
                          {couponMessage.type === "success" ? <FiCheckCircle size={10} /> : <FiXCircle size={10} />}
                          {couponMessage.text}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: T.textLite, fontWeight: 500 }}>Coupon codes cannot be combined with spin discounts</p>
                  </div>
                )}

                {/* Price breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: T.textMid }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 700, color: T.textDark }}>₹{itemTotal.toFixed(2)}</span>
                  </div>
                  <AnimatePresence>
                    {(spinDiscount || appliedCoupon) && discountAmount > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ display: "flex", justifyContent: "space-between", color: T.primary, overflow: "hidden" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><FiPercent size={11} />{spinDiscount ? `Spin (${spinDiscount.percentage}%)` : appliedCoupon?.code}</span>
                        <span style={{ fontWeight: 700 }}>-₹{discountAmount.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {isShippingCoupon && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ display: "flex", justifyContent: "space-between", color: "#10b981", overflow: "hidden" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><FiTruck size={11} />Free Shipping ({appliedCoupon?.code})</span>
                        <span style={{ fontWeight: 700 }}>-₹{deliveryFee.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><FiTruck size={11} /> Shipping</span>
                    <span style={{ fontWeight: 800, color: deliveryCharge === 0 ? "#10B981" : T.textDark }}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge.toFixed(2)}`}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>GST ({Math.round(taxRate * 100)}%)</span>
                    <span style={{ fontWeight: 700, color: T.textDark }}>₹{gst.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ height: 1, background: T.border, margin: "16px 0" }} />

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textLite, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total</span>
                  <div style={{ textAlign: "right" }}>
                    <motion.span key={grandTotal} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: "block", fontSize: 28, fontWeight: 800, color: T.primary, letterSpacing: "-0.03em" }}>
                      ₹{grandTotal.toFixed(2)}
                    </motion.span>
                    {discountAmount > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: T.primary }}>You save ₹{discountAmount.toFixed(2)}</span>}
                  </div>
                </div>

                {/* Free delivery progress */}
                {itemTotal < freeThreshold && (
                  <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 12, background: "rgba(91,168,160,0.06)", border: "1px solid rgba(91,168,160,0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Free Delivery</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: T.primary }}>{Math.round(freeDeliveryProgress)}%</span>
                    </div>
                    <div style={{ height: 5, background: "#E2EEEC", borderRadius: 3, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${freeDeliveryProgress}%` }} transition={{ duration: 0.8, ease }}
                        style={{ height: "100%", background: `linear-gradient(90deg, ${T.primary}, ${T.sky})`, borderRadius: 3 }} />
                    </div>
                    <p style={{ fontSize: 9, color: T.textLite, textAlign: "center", marginTop: 6, fontWeight: 600 }}>
                      Add ₹{(freeThreshold - itemTotal).toFixed(0)} more for free shipping
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={placeOrder}
                    disabled={loading}
                    className="desktop-place-order"
                    style={{
                      width: "100%",
                      padding: "18px",
                      borderRadius: "16px",
                      background: T.primary,
                      color: "#fff",
                      fontSize: "15px",
                      fontWeight: "800",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: loading ? "none" : "0 12px 32px rgba(91,168,160,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      fontFamily: font,
                      transition: "all 0.3s ease"
                    }}
                  >
                    {loading ? <FiLoader size={18} style={{ animation: "spin 1s linear infinite" }} /> : <FiShoppingBag size={18} />}
                    {loading ? "Processing..." : `Place Order · ₹${grandTotal.toFixed(2)}`}
                  </motion.button>
                  
                  <div style={{ marginTop: 20, textAlign: "center", padding: "14px", background: "rgba(16,185,129,0.06)", borderRadius: 16, border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p style={{ fontSize: 12, color: "#065F46", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <FiCheckCircle size={14} style={{ color: "#10B981" }} /> 100% Freshness Guarantee
                    </p>
                    <p style={{ fontSize: 10, color: "#10B981", margin: "4px 0 0", fontWeight: 600, opacity: 0.85 }}>
                      No questions asked returns at the door if the seal is broken.
                    </p>
                  </div>
                </div>

                {/* Delivery estimate */}
                {deliveryAddress.street && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ marginTop: 12, padding: "11px 14px", borderRadius: 12, background: "rgba(91,168,160,0.08)", border: "1.5px solid rgba(91,168,160,0.22)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(91,168,160,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: T.primary, flexShrink: 0 }}>
                      <FiTruck size={12} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: T.primary, margin: 0 }}>Estimated Delivery</p>
                      <p style={{ fontSize: 10, color: T.primary, margin: "2px 0 0", opacity: 0.75 }}>
                        {new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} — {new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {deliveryAddress.city}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SSL */}
                <p style={{ textAlign: "center", fontSize: 10, color: T.textLite, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <FiShield size={10} style={{ color: T.primary }} /> Secure 256-bit SSL Encryption
                </p>
              </SectionCard>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile Only) */}
      <div className="mobile-sticky-bar" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
        background: "#fff", borderTop: `1px solid ${T.border}`,
        padding: "16px 20px",
        alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.05)"
      }}>
        <div>
          <p style={{ fontSize: 10, color: T.textLite, margin: 0, fontWeight: 700, textTransform: "uppercase" }}>Total Amount</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: T.textDark, margin: 0 }}>₹{grandTotal.toFixed(2)}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={placeOrder}
          disabled={loading}
          style={{
            padding: "12px 24px", borderRadius: 14, background: T.primary, color: "#fff",
            border: "none", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 20px rgba(91,168,160,0.25)`
          }}
        >
          {loading ? <FiLoader size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Place Order"}
          {!loading && <FiChevronRight size={16} />}
        </motion.button>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr 380px !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @media (max-width: 767px) {
          .desktop-place-order { display: none !important; }
          .mobile-sticky-bar { display: flex !important; }
          body { padding-bottom: 90px !important; }
        }
        @media (min-width: 768px) {
          .mobile-sticky-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
}