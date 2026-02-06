
import { useEffect, useState, useRef, useContext } from "react";
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
} from "react-icons/fi";
import PopupModal from "../components/PopupModal";
import { CartContext } from "../context/CartContext";
import { ThemeContext } from "../context/ThemeContext";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

const API_URL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";
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

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    show: false,
    message: "",
    type: "info",
  });

  // default COD
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const navigate = useNavigate();
  const { refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [deliveryAddress, setDeliveryAddress] = useState(
    DEFAULT_DELIVERY_ADDRESS
  );
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // NEW: user email stored on login (you must set localStorage.setItem("userEmail", email) in auth)
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const isDeliveryAllowed = ALLOWED_DELIVERY_STATES.some((allowed) =>
    deliveryAddress.state?.toLowerCase().includes(allowed.toLowerCase())
  );

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/^\/|\\/g, "").replace("uploads/", "");
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
        item._id === id ? { ...item, qty: item.qty + change } : item
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
  const deliveryCharge = itemTotal < 1000 ? 99 : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setVerifyingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await axios.post(`${API_URL}/api/coupons/validate`, {
        code: couponCode,
        cartTotal: itemTotal,
        email: userEmail || undefined,
      });

      if (res.data.success) {
        setDiscount(res.data.discountAmount);
        setIsCouponApplied(true);
        setCouponMessage({ type: "success", text: res.data.message });
      }
    } catch (err) {
      setDiscount(0);
      setIsCouponApplied(false);
      setCouponMessage({
        type: "error",
        text: err.response?.data?.message || "Invalid Coupon Code",
      });
    } finally {
      setVerifyingCoupon(false);
    }
  };

  // apply coupon that comes from spin wheel (localStorage)
  const handleApplyCouponFromWheel = async (code) => {
    if (!code) return;
    setVerifyingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await axios.post(`${API_URL}/api/coupons/validate`, {
        code,
        cartTotal: itemTotal,
        email: userEmail || undefined,
      });

      if (res.data.success) {
        setDiscount(res.data.discountAmount);
        setIsCouponApplied(true);
        setCouponMessage({ type: "success", text: res.data.message });
        // Optional: remove client-side
        // localStorage.removeItem("seabiteWheelCoupon");
      }
    } catch (err) {
      setDiscount(0);
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
    setDiscount(0);
    setIsCouponApplied(false);
    setCouponMessage(null);
  };

  const taxableAmount = Math.max(0, itemTotal - discount);
  const gst = Math.round(taxableAmount * 0.05);
  const grandTotal = taxableAmount + deliveryCharge + gst;

  const saveNewAddress = (newAddress) => {
    setDeliveryAddress(newAddress);
    setIsAddressModalOpen(false);
  };

  // on checkout open, auto-read wheel coupon & apply via backend
  useEffect(() => {
    const wheelCode = localStorage.getItem("seabiteWheelCoupon");
    if (wheelCode && !isCouponApplied) {
      setCouponCode(wheelCode);
      handleApplyCouponFromWheel(wheelCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemTotal, userEmail]);

  const placeOrder = async () => {
    if (!isDeliveryAllowed) {
      setModal({
        show: true,
        message: `Delivery restricted to AP & Telangana.`,
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
          "Please complete your delivery address (Zip/Pincode is required).",
        type: "error",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
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
      discount: discount,
      paymentMethod: paymentMethod,
    };

    try {
      const { data } = await axios.post(
        `${API_URL}/api/payment/checkout`,
        orderDetails,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const internalDbId = data.dbOrderId;

      if (paymentMethod === "COD") {
        clearCart();
        refreshCartCount();
        navigate(
          `/success?dbId=${internalDbId}&discount=${discount}&total=${grandTotal}`
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
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (verifyRes.data.success) {
              clearCart();
              refreshCartCount();
              navigate(
                `/success?dbId=${internalDbId}&discount=${discount}&total=${grandTotal}`
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
        theme: { color: "#2563eb" },
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
        message:
          err.response?.data?.message || "Order initiation failed.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-8 font-sans text-slate-900 dark:text-slate-200 relative overflow-hidden transition-colors duration-500">
      <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 relative z-10">
        {/* LEFT: address, payment, items */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1 md:mb-2 block">
              Secure Checkout
            </span>
            <h2 className="text-3xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              Order <span className="text-blue-600">Summary</span>
            </h2>
          </motion.div>

          {/* Delivery Address Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 md:p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <FiMapPin size={20} />
                </div>
                Delivery Address
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full sm:w-auto text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-5 py-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all tracking-wide uppercase"
              >
                {deliveryAddress.street ? "Change Address" : "Add Address"}
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
              {deliveryAddress.street ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <p className="font-bold text-base md:text-lg text-slate-900 dark:text-white">
                      {deliveryAddress.fullName}
                    </p>
                    <span className="hidden sm:block h-4 w-[1px] bg-slate-300 dark:bg-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-xs md:text-sm">
                      {deliveryAddress.phone}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 font-semibold text-xs md:text-sm flex items-center gap-2">
                      <FiHome className="text-blue-500" size={14} />{" "}
                      {deliveryAddress.houseNo}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                      {deliveryAddress.street}, {deliveryAddress.city},{" "}
                      {deliveryAddress.state} - {deliveryAddress.zip}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm py-4 text-center font-medium">
                  Please add a delivery address to proceed.
                </p>
              )}

              <div
                className={`mt-4 md:mt-6 inline-flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-3 md:px-4 py-2 rounded-lg border ${
                  isDeliveryAllowed
                    ? "text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "text-red-700 bg-red-50 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                }`}
              >
                {isDeliveryAllowed ? (
                  <>
                    <FiCheckCircle size={14} /> Serviceable Area
                  </>
                ) : (
                  <>
                    <FiXCircle size={14} /> Area Not Serviceable
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {/* Payment Method Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
              <div className="p-2 md:p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <FiCreditCard size={20} />
              </div>
              Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prepaid disabled */}
              <div className="group relative opacity-60 cursor-not-allowed p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="text-yellow-400" /> Currently
                    under maintenance
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>

                <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center" />
                <div>
                  <p className="font-bold text-slate-500 dark:text-slate-400">
                    Prepaid (Razorpay)
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Pay securely with Cards, UPI, Netbanking
                  </p>
                </div>
              </div>

              {/* COD active */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  paymentMethod === "COD"
                    ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/20"
                    : "border-slate-100 dark:border-slate-700 hover:border-slate-200"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "COD"
                      ? "border-blue-500"
                      : "border-slate-300"
                  }`}
                >
                  {paymentMethod === "COD" && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <FiTruck className="text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Cash on Delivery
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Pay when your order reaches your door
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Items Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-6 md:mb-8 flex items-center gap-3">
              <div className="p-2 md:p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <FiShoppingBag size={20} />
              </div>
              Your Items
            </h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center p-3 md:p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 p-2">
                      <img
                        src={getFullImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                        {item.name}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-medium mt-1">
                        ₹{item.price.toFixed(2)} / unit
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 md:gap-6">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                        <button
                          onClick={() => handleUpdateQty(item._id, -1)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="w-7 md:w-8 text-center font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item._id, 1)}
                          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base min-w-[70px] md:min-w-[80px] text-right">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        </div>

        {/* RIGHT: payment summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 md:top-32 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-5 md:mb-6 uppercase tracking-wide">
                Payment Details
              </h3>

              {/* COUPON INPUT */}
              <div className="mb-6">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 mb-2 block">
                  Have a Coupon?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={isCouponApplied || verifyingCoupon}
                      className="w-full pl-9 pr-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold outline-none focus:border-blue-500 transition-all uppercase placeholder:normal-case disabled:opacity-50"
                    />
                    {isCouponApplied && (
                      <button
                        onClick={handleRemoveCoupon}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isCouponApplied || !couponCode || verifyingCoupon}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 rounded-xl font-bold text-[10px] md:text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex items-center justify-center min-w-[70px]"
                  >
                    {verifyingCoupon ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                {couponMessage && (
                  <p
                    className={`text-[10px] font-bold mt-2 ml-1 ${
                      couponMessage.type === "success"
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              <div className="space-y-3 md:space-y-4 text-xs md:text-sm font-medium">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    ₹{itemTotal.toFixed(2)}
                  </span>
                </div>
                {isCouponApplied && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount Applied</span>
                    <span className="font-bold">
                      - ₹{discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Shipping Fee</span>
                  <span
                    className={`font-bold ${
                      deliveryCharge === 0
                        ? "text-emerald-500 uppercase"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {deliveryCharge === 0
                      ? "Free"
                      : `₹${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Applicable Tax (GST 5%)</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    ₹{gst.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="my-5 md:my-6 h-px bg-slate-100 dark:bg-slate-700" />

              <div className="flex justify-between items-end mb-6 md:mb-8">
                <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">
                  Grand Total
                </span>
                <span className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {itemTotal < 1000 && (
                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                  <p className="text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center mb-2">
                    Unlock{" "}
                    <span className="text-emerald-500 italic">
                      Free Delivery
                    </span>
                  </p>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(itemTotal / 1000) * 100}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center mt-2">
                    Add ₹{(1000 - itemTotal).toFixed(0)} more for Free
                    shipping!
                  </p>
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={loading || !isDeliveryAllowed}
                className={`w-full py-3.5 md:py-4 rounded-xl font-bold uppercase tracking-wide text-[10px] md:text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 ${
                  isDeliveryAllowed
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-50 shadow-slate-900/20"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isDeliveryAllowed ? (
                  <>
                    <FiCheckCircle size={16} />{" "}
                    {paymentMethod === "COD"
                      ? "Place COD Order"
                      : "Pay & Place Order"}
                  </>
                ) : (
                  "Location Not Supported"
                )}
              </button>
            </motion.div>

            <div className="flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <FiShield className="text-emerald-500" size={12} />
              <span>Secure 256-bit SSL Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ADDRESS MODAL
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
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl).addTo(mapInstance.current);

    const CustomIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="20" width="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
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
      if (mapInstance.current) mapInstance.current.remove();
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
        const addr = data.address || {};
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
            state.toLowerCase().includes(s.toLowerCase())
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
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstance.current.setView([latitude, longitude], 16);
        markerInstance.current.setLatLng([latitude, longitude]);
        fetchAddress(latitude, longitude);
      });
    }
  };

  const handleFormSearch = async (e) => {
    e.preventDefault();
    setIsDetecting(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}, India&addressdetails=1&limit=1`
      );
      const data = await res.json();
      if (data[0]) {
        const { lat, lon } = data[0];
        mapInstance.current.setView([lat, lon], 16);
        markerInstance.current.setLatLng([lat, lon]);

        const addr = data[0].address || {};
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
            state.toLowerCase().includes(s.toLowerCase())
          )
        );
      }
    } catch {
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white dark:border-white/5 overflow-hidden flex flex-col max-h-[95vh] transition-colors"
      >
        <form
          onSubmit={handleFormSearch}
          className="p-4 md:p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-3 md:gap-4 bg-white dark:bg-slate-800 z-10"
        >
          <div className="relative flex-1">
            <FiSearch
              className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="w-full pl-10 md:pl-11 pr-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 md:p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <FiXCircle size={20} />
          </button>
        </form>

        <div className="relative h-48 md:h-72 bg-slate-100 shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          <button
            onClick={detectLocation}
            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white dark:bg-slate-800 p-2.5 md:p-3 rounded-xl shadow-lg text-blue-600 dark:text-blue-400 z-[1000] hover:scale-105 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
          >
            <FiTarget size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8 space-y-4 md:space-y-5 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
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
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
              House No. / Flat / Building
            </label>
            <div className="relative">
              <FiHome
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="e.g. Flat 101, Sea View Apts"
                value={form.houseNo}
                onChange={(e) =>
                  setForm({ ...form, houseNo: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-11 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
              Street / Area
            </label>
            <input
              type="text"
              placeholder="Street name, area, landmark"
              value={form.street}
              onChange={(e) =>
                setForm({ ...form, street: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                City
              </label>
              <input
                type="text"
                placeholder="City / Town"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                State
              </label>
              <input
                type="text"
                placeholder="Andhra Pradesh / Telangana"
                value={form.state}
                onChange={(e) =>
                  setForm({ ...form, state: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">
                Pincode / Zip Code
              </label>
              <div className="relative">
                <FiHash
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="534281"
                  value={form.zip}
                  onChange={(e) =>
                    setForm({ ...form, zip: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-11 p-3 md:p-3.5 rounded-xl text-slate-900 dark:text-white text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/10 rounded-2xl">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Selected Location
              </p>
              {isDetecting ? (
                <span className="text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                  <FiLoader className="animate-spin" /> Detecting...
                </span>
              ) : (
                <span
                  className={`text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isDeliverable
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30"
                      : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30"
                  }`}
                >
                  {isDeliverable ? "Serviceable" : "Not Serviceable"}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium line-clamp-2">
              {form.street || "Select a location on the map..."}
            </p>
          </div>

          <button
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
            className={`w-full py-3.5 md:py-4 rounded-xl font-bold uppercase tracking-wide text-[10px] md:text-xs transition-all shadow-lg ${
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
          </button>
        </div>
      </motion.div>
    </div>
  );
}