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

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";
const ALLOWED_DELIVERY_STATES = ["Andhra Pradesh", "Telangana", "AP", "TS"];

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const navigate = useNavigate();
  const { refreshCartCount } = useContext(CartContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [deliveryAddress, setDeliveryAddress] = useState({ fullName: "", phone: "", houseNo: "", street: "", city: "", state: "", zip: "" });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const itemTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryCharge = itemTotal < 1000 ? 99 : 0;

  // ✅ AUTO-SYNC WITH MONGODB (No LocalStorage)
  useEffect(() => {
    const fetchRewardFromDB = async () => {
      const email = localStorage.getItem("userEmail")?.toLowerCase();
      if (!email || itemTotal === 0) return;

      try {
        const res = await axios.post(`${API_URL}/api/coupons/validate`, {
          email,
          cartTotal: itemTotal,
          isAutoCheck: true // Backend signal to find the user's bound prize in MongoDB
        });

        if (res.data.success) {
          setCouponCode(res.data.code);
          setDiscount(res.data.discountAmount);
          setIsCouponApplied(true);
          setCouponMessage({ type: "success", text: "Reward discount applied from your account!" });
        }
      } catch (err) {
        console.log("No active MongoDB rewards for this user.");
      }
    };
    fetchRewardFromDB();
  }, [itemTotal]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setVerifyingCoupon(true);
    const email = localStorage.getItem("userEmail")?.toLowerCase();

    try {
      const res = await axios.post(`${API_URL}/api/coupons/validate`, {
        code: couponCode.trim().toUpperCase(),
        cartTotal: itemTotal,
        email: email
      });
      if (res.data.success) {
        setDiscount(res.data.discountAmount);
        setIsCouponApplied(true);
        setCouponMessage({ type: "success", text: res.data.message });
      }
    } catch (err) {
      setDiscount(0);
      setIsCouponApplied(false);
      setCouponMessage({ type: "error", text: err.response?.data?.message || "Invalid Code" });
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

  useEffect(() => {
    const c = getCart();
    if (c.length === 0) navigate("/products");
    else setCart(c);
  }, [navigate]);

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/^\/|\\/g, "").replace("uploads/", "");
    return `${API_URL}/uploads/${cleanPath}`;
  };

  const placeOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    setLoading(true);

    const orderDetails = { 
      amount: grandTotal, 
      items: cart.map(i => ({ productId: i._id, name: i.name, price: i.price, qty: i.qty, image: i.image })), 
      shippingAddress: deliveryAddress, 
      itemsPrice: itemTotal, 
      taxPrice: gst, 
      shippingPrice: deliveryCharge, 
      discount, 
      paymentMethod: "COD" 
    };

    try {
      const { data } = await axios.post(`${API_URL}/api/payment/checkout`, orderDetails, { headers: { Authorization: `Bearer ${token}` } });
      clearCart(); refreshCartCount(); navigate(`/success?dbId=${data.dbOrderId}`);
    } catch (err) { 
      setModal({ show: true, message: err.response?.data?.message || "Error", type: "error" }); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] pt-32 pb-20 px-4 md:px-8 font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500">
      <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <PopupModal show={modal.show} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, show: false })} />
      <AnimatePresence>{isAddressModalOpen && <AddressModal onClose={() => setIsAddressModalOpen(false)} onSave={(addr) => { setDeliveryAddress(addr); setIsAddressModalOpen(false); }} currentAddress={deliveryAddress} isDarkMode={isDarkMode} />}</AnimatePresence>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 block">Secure Checkout</span>
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">Order <span className="text-blue-600">Summary</span></h2>
          </motion.div>

          <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-8 gap-4">
              <h3 className="text-xl font-bold flex items-center gap-3"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiMapPin size={20} /></div> Delivery Address</h3>
              <button onClick={() => setIsAddressModalOpen(true)} className="text-[10px] font-bold text-blue-600 border border-blue-200 px-5 py-2.5 rounded-full uppercase">{deliveryAddress.street ? "Change Address" : "Add Address"}</button>
            </div>
            {deliveryAddress.street ? (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="font-bold text-lg">{deliveryAddress.fullName} • {deliveryAddress.phone}</p>
                  <p className="text-slate-500 text-sm">{deliveryAddress.houseNo}, {deliveryAddress.street}, {deliveryAddress.city} - {deliveryAddress.zip}</p>
                </div>
              ) : <p className="text-slate-400 text-sm text-center">Add a delivery address to proceed.</p>}
          </section>

          <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border shadow-xl">
             <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiCreditCard size={20} /></div> Payment</h3>
             <div onClick={() => setPaymentMethod("COD")} className="cursor-pointer p-5 rounded-2xl border-2 border-blue-500 bg-blue-50/30 flex items-center gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center"><div className="w-3 h-3 bg-blue-500 rounded-full" /></div>
                <p className="font-bold">Cash on Delivery</p>
             </div>
          </section>

          <section className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 shadow-xl">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiShoppingBag size={20} /></div> Your Items</h3>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-100">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-xl p-2 border overflow-hidden">
                    <img src={getFullImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base">{item.name}</h4>
                    <p className="text-slate-500 text-xs">₹{item.price.toFixed(2)} / unit</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-bold min-w-[80px] text-right">₹{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-2xl border border-slate-100 relative overflow-hidden text-slate-900">
              <h3 className="text-lg font-bold mb-6 uppercase tracking-wide dark:text-white">Payment Details</h3>
              
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Promo Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={isCouponApplied || verifyingCoupon} className="w-full pl-9 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold uppercase outline-none focus:border-blue-500" />
                    {isCouponApplied && <button onClick={handleRemoveCoupon} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><FiX size={16} /></button>}
                  </div>
                  <button onClick={handleApplyCoupon} disabled={isCouponApplied || !couponCode || verifyingCoupon} className="bg-slate-900 text-white px-4 rounded-xl font-bold text-xs">{verifyingCoupon ? <FiLoader className="animate-spin" /> : "Apply"}</button>
                </div>
                {couponMessage && <p className={`text-[10px] font-bold mt-2 ml-1 ${couponMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`}>{couponMessage.text}</p>}
              </div>

              <div className="space-y-4 text-sm font-medium">
                <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span className="font-bold dark:text-white">₹{itemTotal.toFixed(2)}</span></div>
                {isCouponApplied && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-bold">- ₹{discount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Shipping</span><span className={`font-bold ${deliveryCharge === 0 ? "text-emerald-500 uppercase" : "dark:text-white"}`}>{deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}</span></div>
              </div>

              <div className="my-6 h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex justify-between items-end mb-8">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Grand Total</span>
                <span className="text-3xl font-extrabold text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>

              <button onClick={placeOrder} disabled={loading} className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide text-xs shadow-lg transition-all active:scale-95 flex justify-center items-center gap-3 bg-slate-900 text-white hover:bg-blue-600`}>
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><FiCheckCircle size={16} /> Confirm Order</>}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold"><FiShield className="text-emerald-500" /> Secure Encryption</div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- ADDRESS MODAL COMPONENT --- */
function AddressModal({ onClose, onSave, currentAddress, isDarkMode }) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [form, setForm] = useState(currentAddress);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    if (mapInstance.current) return;
    const initialPos = [17.385, 78.4867];
    mapInstance.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(initialPos, 13);
    const tileUrl = isDarkMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    L.tileLayer(tileUrl).addTo(mapInstance.current);

    const CustomIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="20" width="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
      iconSize: [40, 40], iconAnchor: [20, 40],
    });

    markerInstance.current = L.marker(initialPos, { draggable: true, icon: CustomIcon }).addTo(mapInstance.current);
    markerInstance.current.on("dragend", (e) => { const { lat, lng } = e.target.getLatLng(); fetchAddress(lat, lng); });
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstance.current.setView([latitude, longitude], 16);
        markerInstance.current.setLatLng([latitude, longitude]);
        fetchAddress(latitude, longitude);
      });
    }
    return () => { if (mapInstance.current) mapInstance.current.remove(); };
  }, [isDarkMode]);

  const fetchAddress = async (lat, lon) => {
    setIsDetecting(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      const data = await res.json();
      if (data) {
        const addr = data.address || {};
        setForm((prev) => ({ ...prev, street: data.display_name, city: addr.city || addr.town || "", state: addr.state || "", zip: addr.postcode || "" }));
      }
    } catch { } finally { setIsDetecting(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="relative h-64 bg-slate-100 shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />
          <button onClick={onClose} className="absolute top-6 right-6 bg-white p-2 rounded-full shadow-lg text-red-500 z-[1000]"><FiX size={20} /></button>
        </div>
        <div className="p-8 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-5 text-slate-900">
            <input type="text" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full bg-slate-50 border p-3.5 rounded-xl text-sm" />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} className="w-full bg-slate-50 border p-3.5 rounded-xl text-sm" />
          </div>
          <input type="text" placeholder="House/Flat No." value={form.houseNo} onChange={(e) => setForm({ ...form, houseNo: e.target.value })} className="w-full bg-slate-50 border p-3.5 rounded-xl text-sm text-slate-900" />
          <input type="text" placeholder="Street/Area" value={form.street} readOnly className="w-full bg-slate-100 border p-3.5 rounded-xl text-xs opacity-70 text-slate-900" />
          <div className="grid grid-cols-3 gap-5 text-slate-900">
             <input type="text" placeholder="City" value={form.city} readOnly className="bg-slate-100 border p-3.5 rounded-xl text-sm" />
             <input type="text" placeholder="State" value={form.state} readOnly className="bg-slate-100 border p-3.5 rounded-xl text-sm" />
             <input type="text" placeholder="Zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="border p-3.5 rounded-xl text-sm" />
          </div>
          <button disabled={isDetecting || !form.fullName || !form.phone} onClick={() => onSave(form)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wide text-xs disabled:opacity-50">Confirm Address</button>
        </div>
      </motion.div>
    </div>
  );
}