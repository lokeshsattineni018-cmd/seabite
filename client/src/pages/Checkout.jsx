// src/pages/Checkout.jsx
import { useEffect, useState, useRef, useContext, useMemo } from "react";
import { getCart, saveCart, clearCart } from "../utils/cartStorage";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShield,
  FiXCircle,
  FiHome,
  FiShoppingBag,
  FiTag,
  FiX,
  FiTarget,
  FiSearch,
  FiCreditCard,
  FiTruck,
  FiLoader,
  FiHash,
  FiAlertCircle,
  FiGift,
  FiChevronRight,
  FiClock,
  FiPercent,
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API_URL = import.meta.env.VITE_API_URL || "";

const ALLOWED_DELIVERY_STATES = ["Andhra Pradesh", "Telangana", "AP", "TS"];

const DEFAULT_DELIVERY_ADDRESS = {
  fullName: "",
  phone: "",
  houseNo: "",
  street: "",
  city: "",
  state: "",
  zip: "",
};

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const [spinDiscount, setSpinDiscount] = useState(null);

  const navigate = useNavigate();
  const { refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [deliveryAddress, setDeliveryAddress] = useState(
    DEFAULT_DELIVERY_ADDRESS
  );
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setUserEmail(storedEmail.toLowerCase());
    }
  }, []);

  // Load spin discount from localStorage
  useEffect(() => {
    const savedDiscount = localStorage.getItem("seabiteSpinDiscount");
    if (savedDiscount) {
      try {
        const discount = JSON.parse(savedDiscount);
        const expiresAt = new Date(discount.expiresAt);
        const now = new Date();

        if (now < expiresAt) {
          setSpinDiscount(discount);
        } else {
          localStorage.removeItem("seabiteSpinDiscount");
        }
      } catch (e) {
       // console.error("Error parsing spin discount:", e);
      }
    }
  }, []);

  const isDeliveryAllowed = ALLOWED_DELIVERY_STATES.some((allowed) =>
    deliveryAddress.state?.toLowerCase().includes(allowed.toLowerCase())
  );

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/\\/g, "/").replace("uploads/", "");
    return `${API_URL}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    const c = getCart();
    if (c.length === 0) {
      setModal({
        show: true,
        message: "Your cart is empty!",
        type: "error",
      });
      setTimeout(() => navigate("/products"), 2000);
    } else {
      setCart(c);
    }
  }, [navigate]);

  const handleUpdateQty = (id, change) => {
    const updated = cart
      .map((item) =>
        item._id === id
          ? { ...item, qty: Math.max(0, item.qty + change) }
          : item
      )
      .filter((item) => item.qty > 0);

    setCart(updated);
    saveCart(updated);
    refreshCartCount();
    if (isCouponApplied) handleRemoveCoupon();
  };

  const handleRemoveItem = (id) => {
    const updated = cart.filter((item) => item._id !== id);
    setCart(updated);
    saveCart(updated);
    refreshCartCount();
    if (isCouponApplied) handleRemoveCoupon();
  };

  const itemTotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const deliveryCharge = itemTotal >= 1000 ? 0 : 99;

 // Around line 112 - This line looks fine, but let's verify the error handling:

const handleApplyCoupon = async () => {
  if (!couponCode) return;

  setVerifyingCoupon(true);
  setCouponMessage(null);

  const currentEmail = localStorage.getItem("userEmail")?.toLowerCase();

  try {
    const res = await axios.post(
      `${API_URL}/api/coupons/validate`,
      {
        code: couponCode.trim().toUpperCase(),
        cartTotal: itemTotal,
        email: currentEmail || undefined,
      },
      {
        withCredentials: true,
      }
    );

    if (res.data.success) {
      setCouponDiscount(res.data.discountAmount);
      setIsCouponApplied(true);
      setCouponMessage({ type: "success", text: res.data.message });
    }
  } catch (err) {
    setCouponDiscount(0);
    setIsCouponApplied(false);
    setCouponMessage({
      type: "error",
      text: err.response?.data?.message || "Invalid Coupon Code",
    });
  } finally {
    setVerifyingCoupon(false);
  }
};

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setIsCouponApplied(false);
    setCouponMessage(null);
  };

  // Calculate total discount (spin takes priority)
  const discountAmount = useMemo(() => {
    let discount = 0;

    if (spinDiscount) {
      discount = (itemTotal * spinDiscount.percentage) / 100;
    } else if (isCouponApplied) {
      discount = couponDiscount;
    }

    return Math.min(discount, itemTotal);
  }, [itemTotal, spinDiscount, isCouponApplied, couponDiscount]);

  const taxableAmount = Math.max(0, itemTotal - discountAmount);
  const gst = Math.round(taxableAmount * 0.05);
  const grandTotal = taxableAmount + deliveryCharge + gst;

  const saveNewAddress = (newAddress) => {
    setDeliveryAddress(newAddress);
    setIsAddressModalOpen(false);
  };

  const placeOrder = async () => {
    if (!isDeliveryAllowed) {
      setModal({
        show: true,
        message: "Delivery restricted to AP & Telangana.",
        type: "error",
      });
      return;
    }

    if (
      !deliveryAddress.fullName ||
      !deliveryAddress.phone ||
      !deliveryAddress.street ||
      !deliveryAddress.houseNo ||
      !deliveryAddress.city ||
      !deliveryAddress.zip
    ) {
      setModal({
        show: true,
        message:
          "Please complete your delivery address. Zip/Pincode is required.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    const orderDetails = {
      amount: grandTotal,
      items: cart.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
      })),
      shippingAddress: deliveryAddress,
      itemsPrice: itemTotal,
      taxPrice: gst,
      shippingPrice: deliveryCharge,
      discount: discountAmount,
      paymentMethod: paymentMethod,
    };

    try {
      const { data } = await axios.post(
        `${API_URL}/api/payment/checkout`,
        orderDetails,
        {
          withCredentials: true,
        }
      );

      const internalDbId = data.dbOrderId;

      // Remove spin discount after successful order creation
      if (spinDiscount) {
        localStorage.removeItem("seabiteSpinDiscount");
      }

      if (paymentMethod === "COD") {
        clearCart();
        refreshCartCount();
        navigate(
          `/success?dbId=${internalDbId}&discount=${discountAmount}&total=${grandTotal}`
        );
        return;
      }

      const options = {
        key: "rzp_test_RudgOJMh7819Qs",
        amount: data.order.amount,
        currency: "INR",
        name: "SeaBite",
        description: "Fresh Coastal Catch Payment",
        order_id: data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${API_URL}/api/payment/verify`,
              response,
              {
                withCredentials: true,
              }
            );
            if (verifyRes.data.success) {
              clearCart();
              refreshCartCount();
              navigate(
                `/success?dbId=${internalDbId}&discount=${discountAmount}&total=${grandTotal}`
              );
            }
          } catch (err) {
            setModal({
              show: true,
              message: "Payment Verification Failed",
              type: "error",
            });
          }
        },
        prefill: {
          name: deliveryAddress.fullName,
          contact: deliveryAddress.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setModal({
        show: true,
        message: err.response?.data?.message || "Order initiation failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const freeDeliveryProgress = Math.min((itemTotal / 1000) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-8 font-sans text-slate-900 dark:text-slate-200 relative overflow-hidden transition-colors duration-500">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-blue-500/[0.04] dark:bg-blue-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-300/20 dark:bg-slate-600/10 rounded-full blur-[100px]" />
      </div>

      <PopupModal
        show={modal.show}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal({ ...modal, show: false })}
      />

      <AnimatePresence>
        {isAddressModalOpen && (
          <AddressModal
            onClose={() => setIsAddressModalOpen(false)}
            onSave={saveNewAddress}
            currentAddress={deliveryAddress}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 relative z-10"
      >
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-5 md:space-y-7">
          {/* Page Header */}
          <motion.div variants={fadeUp} custom={0}>
            <span className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1 block">
              Secure Checkout
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              Order{" "}
              <span className="text-blue-600 dark:text-blue-400">Summary</span>
            </h2>
          </motion.div>

          {/* ========== DELIVERY ADDRESS ========== */}
          <motion.section
            variants={fadeUp}
            custom={1}
            className="bg-white dark:bg-slate-800/80 p-5 md:p-7 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-white/5 shadow-lg shadow-slate-200/40 dark:shadow-none backdrop-blur-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 md:mb-6 gap-3">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <FiMapPin size={18} />
                </div>
                Delivery Address
              </h3>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full sm:w-auto text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all tracking-wider uppercase"
              >
                {deliveryAddress.street ? "Change" : "Add Address"}
              </motion.button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-5 rounded-xl border border-slate-100 dark:border-white/5">
              {deliveryAddress.street ? (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <p className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
                      {deliveryAddress.fullName}
                    </p>
                    <span className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                      {deliveryAddress.phone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2">
                      <FiHome className="text-blue-500 shrink-0" size={13} />
                      {deliveryAddress.houseNo}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                      {deliveryAddress.street}, {deliveryAddress.city},{" "}
                      {deliveryAddress.state} - {deliveryAddress.zip}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <FiMapPin size={20} />
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-medium text-center">
                    Please add a delivery address to proceed.
                  </p>
                </div>
              )}
            </div>

            <div
              className={`mt-4 inline-flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
                isDeliveryAllowed
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "text-red-700 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
              }`}
            >
              {isDeliveryAllowed ? (
                <>
                  <FiCheckCircle size={12} />
                  <span>Serviceable Area</span>
                </>
              ) : (
                <>
                  <FiXCircle size={12} />
                  <span>Area Not Serviceable</span>
                </>
              )}
            </div>
          </motion.section>

          {/* ========== PAYMENT METHOD ========== */}
          <motion.section
            variants={fadeUp}
            custom={2}
            className="bg-white dark:bg-slate-800/80 p-5 md:p-7 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-white/5 shadow-lg shadow-slate-200/40 dark:shadow-none backdrop-blur-sm"
          >
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-5 md:mb-6 flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <FiCreditCard size={18} />
              </div>
              Payment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Prepaid - Disabled */}
              <div className="group relative opacity-50 cursor-not-allowed">
                <div className="p-4 md:p-5 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <FiCreditCard
                      className="text-slate-400 shrink-0"
                      size={16}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-500 dark:text-slate-400 text-sm">
                        Prepaid (Razorpay)
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Cards, UPI, Netbanking
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="text-amber-400" size={12} />
                    <span>Currently under maintenance</span>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              </div>

              {/* COD */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod("COD")}
                className={`cursor-pointer p-4 md:p-5 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  paymentMethod === "COD"
                    ? "border-blue-500 bg-blue-50/40 dark:bg-blue-900/20 shadow-sm shadow-blue-500/10"
                    : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    paymentMethod === "COD"
                      ? "border-blue-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {paymentMethod === "COD" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 bg-blue-500 rounded-full"
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <FiTruck className="text-slate-400 shrink-0" size={16} />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      Cash on Delivery
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Pay when your order arrives
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* ========== CART ITEMS ========== */}
          <motion.section
            variants={fadeUp}
            custom={3}
            className="bg-white dark:bg-slate-800/80 p-5 md:p-7 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-white/5 shadow-lg shadow-slate-200/40 dark:shadow-none backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-5 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <FiShoppingBag size={18} />
                </div>
                Your Items
              </h3>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {cart.map((item, index) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                    transition={{ delay: index * 0.03, ease }}
                    className="flex flex-col sm:flex-row gap-3 md:gap-5 items-center p-3 md:p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/80 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all group"
                  >
                    {/* Product Image */}
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 p-1.5">
                      <img
                        src={getFullImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium mt-0.5">
                        {"₹"}
                        {item.price.toFixed(2)} / unit
                      </p>
                    </div>

                    {/* Qty Controls + Price + Remove */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 md:gap-5">
                      {/* Quantity */}
                      <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQty(item._id, -1)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <FiMinus size={12} />
                        </motion.button>
                        <span className="w-7 md:w-8 text-center font-bold text-xs text-slate-900 dark:text-white select-none">
                          {item.qty}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUpdateQty(item._id, 1)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <FiPlus size={12} />
                        </motion.button>
                      </div>

                      {/* Line Total */}
                      <p className="font-bold text-slate-900 dark:text-white text-sm min-w-[65px] md:min-w-[75px] text-right font-mono">
                        {"₹"}
                        {(item.price * item.qty).toFixed(2)}
                      </p>

                      {/* Remove */}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FiTrash2 size={15} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>

        {/* ========== RIGHT COLUMN - PAYMENT SUMMARY ========== */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 md:top-32 space-y-5">
            <motion.div
              variants={fadeUp}
              custom={2}
              className="bg-white dark:bg-slate-800/80 p-5 md:p-7 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden backdrop-blur-sm"
            >
              {/* Decorative accent */}
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/[0.07] rounded-full blur-2xl pointer-events-none" />

              <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                <FiCreditCard size={15} className="text-blue-500" />
                Payment Details
              </h3>

              {/* SPIN WHEEL DISCOUNT BANNER */}
              <AnimatePresence>
                {spinDiscount && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border-2 border-emerald-200/60 dark:border-emerald-500/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <FiGift size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              Spin Wheel Discount Active
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                              <FiPercent size={10} />
                              {spinDiscount.percentage}% OFF
                              <span className="text-slate-400 dark:text-slate-500">
                                &middot;
                              </span>
                              <FiClock size={10} />
                              Until{" "}
                              {new Date(
                                spinDiscount.expiresAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => {
                            setSpinDiscount(null);
                            localStorage.removeItem("seabiteSpinDiscount");
                          }}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                        >
                          <FiX size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* COUPON INPUT (disabled if spin discount active) */}
              {!spinDiscount ? (
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 mb-2 block uppercase tracking-wider">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FiTag
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={isCouponApplied || verifyingCoupon}
                        className="w-full pl-9 pr-9 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all uppercase placeholder:normal-case placeholder:font-medium disabled:opacity-50"
                      />
                      {isCouponApplied && (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={handleRemoveCoupon}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <FiX size={14} />
                        </motion.button>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleApplyCoupon}
                      disabled={
                        isCouponApplied || !couponCode || verifyingCoupon
                      }
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 rounded-xl font-bold text-[10px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-50 transition-colors flex items-center justify-center min-w-[65px] uppercase tracking-wider"
                    >
                      {verifyingCoupon ? (
                        <FiLoader className="animate-spin" size={14} />
                      ) : isCouponApplied ? (
                        <FiCheckCircle size={14} />
                      ) : (
                        "Apply"
                      )}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {couponMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`text-[10px] font-bold mt-2 ml-1 flex items-center gap-1 ${
                          couponMessage.type === "success"
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {couponMessage.type === "success" ? (
                          <FiCheckCircle size={10} />
                        ) : (
                          <FiXCircle size={10} />
                        )}
                        {couponMessage.text}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="mb-5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Coupon codes cannot be combined with spin discounts
                  </p>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">
                    {"₹"}
                    {itemTotal.toFixed(2)}
                  </span>
                </div>

                <AnimatePresence>
                  {(spinDiscount || isCouponApplied) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between text-emerald-600 dark:text-emerald-400"
                    >
                      <span className="flex items-center gap-1.5">
                        <FiPercent size={11} />
                        {spinDiscount
                          ? `Spin (${spinDiscount.percentage}%)`
                          : "Coupon"}
                      </span>
                      <span className="font-bold font-mono">
                        -{"₹"}
                        {discountAmount.toFixed(2)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FiTruck size={11} />
                    Shipping
                  </span>
                  <span
                    className={`font-bold ${
                      deliveryCharge === 0
                        ? "text-emerald-500 uppercase text-[10px]"
                        : "text-slate-900 dark:text-white font-mono"
                    }`}
                  >
                    {deliveryCharge === 0 ? (
                      "Free"
                    ) : (
                      <>
                        {"₹"}
                        {deliveryCharge.toFixed(2)}
                      </>
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>GST (5%)</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">
                    {"₹"}
                    {gst.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-slate-100 dark:bg-slate-700/80" />

              {/* Grand Total */}
              <div className="flex justify-between items-end mb-6">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total
                </span>
                <div className="text-right">
                  <motion.span
                    key={grandTotal}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 block font-mono"
                  >
                    {"₹"}
                    {grandTotal.toFixed(2)}
                  </motion.span>
                  {discountAmount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-500">
                      You save {"₹"}
                      {discountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Free Delivery Progress */}
              {itemTotal < 1000 && (
                <div className="mb-6 p-3.5 bg-blue-50/60 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                      Free Delivery
                    </p>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(freeDeliveryProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${freeDeliveryProgress}%`,
                      }}
                      transition={{ duration: 0.8, ease }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center mt-2">
                    Add {"₹"}
                    {(1000 - itemTotal).toFixed(0)} more for free shipping
                  </p>
                </div>
              )}

              {/* Place Order Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={placeOrder}
                disabled={loading || !isDeliveryAllowed}
                className={`w-full py-3.5 md:py-4 rounded-xl font-bold uppercase tracking-wider text-[10px] md:text-xs shadow-lg transition-all disabled:cursor-not-allowed flex justify-center items-center gap-2.5 ${
                  isDeliveryAllowed
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-50 shadow-slate-900/20 disabled:opacity-60"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : !isDeliveryAllowed ? (
                  "Location Not Supported"
                ) : paymentMethod === "COD" ? (
                  <>
                    <FiCheckCircle size={15} /> Place COD Order
                  </>
                ) : (
                  <>
                    <FiCreditCard size={15} /> Pay & Place Order
                  </>
                )}
              </motion.button>

              {/* SSL Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <FiShield className="text-emerald-500" size={12} />
                <span>Secure 256-bit SSL Encryption</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   ADDRESS MODAL with Leaflet Map
   ============================================================ */
function AddressModal({ onClose, onSave, currentAddress, isDarkMode }) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const [form, setForm] = useState(currentAddress);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    if (mapInstance.current) return;

    const initialPos = [17.385, 78.4867];

    mapInstance.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(initialPos, 13);

    const tileUrl = isDarkMode
      ? "https://s.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://s.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl).addTo(mapInstance.current);

    const CustomIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white">
          <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="20" width="20">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    markerInstance.current = L.marker(initialPos, {
      draggable: true,
      icon: CustomIcon,
    }).addTo(mapInstance.current);

    markerInstance.current.on("dragend", (e) => {
      const { lat, lng } = e.target.getLatLng();
      fetchAddress(lat, lng);
    });

    detectLocation();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [isDarkMode]);

  const fetchAddress = async (lat, lon) => {
    setIsDetecting(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await res.json();
      if (data) {
        const addr = data.address;
        const state = addr.state || "";
        const detectedCity =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.county ||
          "";

        setForm((prev) => ({
          ...prev,
          street: data.display_name,
          city: detectedCity,
          state: state,
          zip: addr.postcode || "",
        }));

        setIsDeliverable(
          ALLOWED_DELIVERY_STATES.some((s) =>
            (state || "").toLowerCase().includes(s.toLowerCase())
          )
        );
      }
    } catch {
    } finally {
      setIsDetecting(false);
    }
  };

  const detectLocation = () => {
    setIsDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          mapInstance.current.setView([latitude, longitude], 16);
          markerInstance.current.setLatLng([latitude, longitude]);
          fetchAddress(latitude, longitude);
        },
        () => {
          setIsDetecting(false);
        }
      );
    } else {
      setIsDetecting(false);
    }
  };

  const handleFormSearch = async (e) => {
    e.preventDefault();
    setIsDetecting(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}, India&addressdetails=1&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        const { lat, lon } = data[0];
        mapInstance.current.setView([lat, lon], 16);
        markerInstance.current.setLatLng([lat, lon]);

        const addr = data[0].address;
        const state = addr.state || "";
        const detectedCity =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.county ||
          "";

        setForm((prev) => ({
          ...prev,
          street: data[0].display_name,
          city: detectedCity,
          state: state,
          zip: addr.postcode || "",
        }));

        setIsDeliverable(
          ALLOWED_DELIVERY_STATES.some((s) =>
            (state || "").toLowerCase().includes(s.toLowerCase())
          )
        );
      }
    } catch {
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: "100%", filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: "100%", filter: "blur(4px)" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-3xl w-full max-w-2xl shadow-2xl border border-white/10 dark:border-white/5 overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]"
      >
        {/* Search Bar */}
        <form
          onSubmit={handleFormSearch}
          className="p-4 md:p-5 border-b border-slate-100 dark:border-white/5 flex items-center gap-3 bg-white dark:bg-slate-800 z-10"
        >
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
          >
            <FiXCircle size={18} />
          </motion.button>
        </form>

        {/* Map */}
        <div className="relative h-44 md:h-64 bg-slate-100 dark:bg-slate-900 shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={detectLocation}
            className="absolute bottom-3 right-3 md:bottom-5 md:right-5 bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg text-blue-600 dark:text-blue-400 z-[1000] hover:scale-105 transition-all border border-slate-200 dark:border-slate-700"
          >
            <FiTarget size={18} />
          </motion.button>
        </div>

        {/* Form Fields */}
        <div className="p-5 md:p-7 space-y-4 overflow-y-auto no-scrollbar flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setForm({ ...form, phone: value });
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
              House No. / Flat / Building
            </label>
            <div className="relative">
              <FiHome
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="e.g. Flat 101, Sea View Apts"
                value={form.houseNo}
                onChange={(e) =>
                  setForm({ ...form, houseNo: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-10 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
              Street / Area
            </label>
            <input
              type="text"
              placeholder="Street name, area, landmark"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
                City
              </label>
              <input
                type="text"
                placeholder="City / Town"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
                State
              </label>
              <input
                type="text"
                placeholder="Andhra Pradesh"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider">
                Pincode
              </label>
              <div className="relative">
                <FiHash
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="534281"
                  value={form.zip}
                  onChange={(e) =>
                    setForm({ ...form, zip: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-10 p-3 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Location Preview */}
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/10 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiMapPin size={10} />
                Selected Location
              </p>
              {isDetecting ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/30 flex items-center gap-1">
                  <FiLoader className="animate-spin" size={9} />
                  Detecting...
                </span>
              ) : (
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                    isDeliverable
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30"
                      : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30"
                  }`}
                >
                  {isDeliverable ? "Serviceable" : "Not Serviceable"}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">
              {form.street || "Select a location on the map..."}
            </p>
          </div>

          {/* Confirm Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={
              !isDeliverable ||
              !form.fullName ||
              !form.phone ||
              form.phone.length !== 10 ||
              !form.houseNo ||
              !form.zip ||
              isDetecting
            }
            onClick={() => onSave(form)}
            className={`w-full py-3.5 md:py-4 rounded-xl font-bold uppercase tracking-wider text-[10px] md:text-xs transition-all shadow-lg ${
              isDeliverable &&
              !isDetecting &&
              form.phone.length === 10 &&
              form.fullName &&
              form.houseNo &&
              form.zip
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-100 shadow-slate-900/20"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isDetecting ? "Fetching Location..." : "Confirm Address"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
