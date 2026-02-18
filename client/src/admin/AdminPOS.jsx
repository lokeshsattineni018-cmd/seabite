// AdminPOS.jsx — SeaBite · Cream & Stone Design System v2
// Point of sale interface with refined aesthetics

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
  FiUser, FiPhone, FiCheckCircle, FiTruck, FiX
} from "react-icons/fi";
import toast from "react-hot-toast";

const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden:  { opacity:0, y:12 },
  visible: (i=0) => ({ opacity:1, y:0, transition:{ delay:i*0.04, duration:0.45, ease } }),
};

const T = {
  bg:          "#FAFAF8",
  surface:     "#FFFFFF",
  surfaceWarm: "#F7F5F0",
  surfaceMid:  "#F0EDE6",
  border:      "rgba(120,113,108,0.12)",
  borderSoft:  "rgba(120,113,108,0.07)",
  teal:    "#0D9488", tealL: "#F0FDFA",
  success: "#059669", successL:"#ECFDF5",
  text:      "#1C1917",
  textMid:   "#57534E",
  textSoft:  "#A8A29E",
  textGhost: "#D6D3D1",
  shadowSm:   "0 1px 2px rgba(28,25,23,0.04), 0 1px 1px rgba(28,25,23,0.03)",
  shadowMd:   "0 4px 12px rgba(28,25,23,0.05), 0 1px 3px rgba(28,25,23,0.04)",
};

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .sb { font-family:'Geist',system-ui,-apple-system,sans-serif; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.textGhost}; border-radius:3px; }
  `}</style>
);

function InputField({ label, value, onChange, placeholder, type="text", icon:Icon }) {
  const [on, setOn] = useState(false);
  return (
    <div>
      {label && <label style={{ display:"block", fontSize:9, fontWeight:600, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{label}</label>}
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        {Icon && <Icon size={13} style={{ position:"absolute", left:10, color:T.textGhost, pointerEvents:"none" }}/>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setOn(true)}
          onBlur={() => setOn(false)}
          style={{
            width:"100%",
            padding: Icon ? "10px 12px 10px 32px" : "10px 12px",
            background: on ? T.surface : T.surfaceWarm,
            border: `1px solid ${on ? T.teal : T.border}`,
            borderRadius:10,
            fontSize:12,
            fontWeight:500,
            fontFamily:"Geist, system-ui",
            color:T.text,
            outline:"none",
            transition:"all 0.2s ease",
            boxShadow: on ? `0 0 0 2.5px ${T.tealL}` : "none",
          }}
        />
      </div>
    </div>
  );
}

export default function AdminPOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState({
    phone: "", name: "", email: "",
    deliveryType: "Walk-in",
    houseNo: "", street: "", city: "Vizag", zip: "530001"
  });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modal, setModal] = useState({ show:false, message:"", type:"info" });

  const backendBase = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${backendBase}/api/admin/products`, {
          params: search ? { search } : {},
          withCredentials: true,
        });
        setProducts(data.products || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    const delay = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delay);
  }, [search, backendBase]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id);
      return existing
        ? prev.map(p => p._id === product._id ? { ...p, qty: p.qty + 1 } : p)
        : [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, change) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = Math.max(0, item.qty + change);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + ((item.basePrice || 0) * item.qty), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!customer.phone || !customer.name) return toast.error("Name & phone required");
    if (customer.deliveryType === "Delivery" && (!customer.houseNo || !customer.street)) {
      return toast.error("Address required");
    }

    setProcessing(true);
    try {
      await axios.post(`${backendBase}/api/admin/orders/manual`, {
        customer,
        items: cart.map(i => ({
          productId: i._id, name: i.name, price: i.basePrice, buyingPrice: i.buyingPrice,
          qty: i.qty, image: i.image
        })),
        totalAmount: cartTotal,
        paymentMethod,
        deliveryType: customer.deliveryType,
        address: customer.deliveryType === "Delivery" ? {
          houseNo: customer.houseNo, street: customer.street,
          city: customer.city, zip: customer.zip
        } : null,
        source: "POS"
      }, { withCredentials: true });

      setModal({ show:true, message:`Order Placed! ₹${cartTotal}`, type:"success" });
      setCart([]);
      setCustomer({ phone:"", name:"", email:"", deliveryType:"Walk-in", houseNo:"", street:"", city:"Vizag", zip:"530001" });
    } catch (err) {
      setModal({ show:true, message:err.response?.data?.message || "Failed", type:"error" });
    } finally { setProcessing(false); }
  };

  return (
    <>
      <GS/>
      <motion.div className="sb" initial="hidden" animate="visible"
        style={{ display:"flex", height:"100vh", background:`linear-gradient(135deg, ${T.bg} 0%, ${T.surface} 100%)`, overflow:"hidden", fontSize:T.text }}
      >
        {/* ── PRODUCT GRID (LEFT) ────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, borderRight:`1px solid ${T.borderSoft}` }}>

          {/* Header */}
          <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.borderSoft}`, background:T.surface, flexShrink:0 }}>
            <div style={{ marginBottom:10 }}>
              <h1 style={{ fontSize:16, fontWeight:600, color:T.text, letterSpacing:"-0.01em" }}>Point of Sale</h1>
              <p style={{ fontSize:10, color:T.textSoft, marginTop:3 }}>New order</p>
            </div>
            <div style={{ position:"relative" }}>
              <FiSearch style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textGhost, pointerEvents:"none" }} size={14}/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{
                  width:"100%", paddingLeft:32, padding:"9px 12px 9px 32px",
                  background:T.surfaceWarm, border:`1px solid ${T.border}`, borderRadius:10,
                  fontSize:12, fontWeight:500, fontFamily:"Geist, system-ui",
                  color:T.text, outline:"none", transition:"all 0.2s ease",
                }}
                onFocus={e => e.target.style.background = T.surface}
                onBlur={e => e.target.style.background = T.surfaceWarm}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div style={{ flex:1, overflowY:"auto", padding:12, background:T.bg }}>
            {loading ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12 }}>
                {[...Array(8)].map((_,i)=><div key={i} style={{ background:T.surface, height:160, borderRadius:14, border:`1px solid ${T.border}`, animation:"pulse" }}/>)}
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12 }}>
                {products.map((p, idx) => (
                  <motion.div key={p._id} variants={fadeUp} custom={idx}
                    onClick={() => addToCart(p)}
                    style={{
                      background:T.surface, padding:10, borderRadius:14,
                      border:`1px solid ${T.border}`, cursor:"pointer",
                      transition:"all 0.25s ease", position:"relative", group:"group",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.border = `1px solid ${T.teal}`;
                      e.currentTarget.style.boxShadow = T.shadowMd;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.border = `1px solid ${T.border}`;
                      e.currentTarget.style.boxShadow = T.shadowSm;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ aspectRatio:"4/3", background:T.surfaceWarm, borderRadius:10, marginBottom:8, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                      <div style={{ position:"absolute", inset:0, background:"rgba(13,148,136,0.08)", opacity:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"opacity 0.25s ease" }} onMouseEnter={e => e.parentElement.style.opacity="1"}>
                        <FiPlus style={{ color:T.teal, background:T.surface, borderRadius:"50%", padding:8, width:32, height:32, boxShadow:T.shadowMd }} size={14}/>
                      </div>
                    </div>
                    <h3 style={{ fontSize:10, fontWeight:500, color:T.text, lineHeight:1.3, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                      {p.name}
                    </h3>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:9, color:T.textGhost, fontWeight:500, textTransform:"uppercase" }}>{p.unit}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:T.teal, fontFamily:"Geist Mono, monospace" }}>₹{p.basePrice}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── CART SIDEBAR (RIGHT) ───────────────────── */}
        <div style={{ width:400, display:"flex", flexDirection:"column", background:T.surface, borderLeft:`1px solid ${T.borderSoft}`, boxShadow:`-4px 0 12px rgba(28,25,23,0.08)` }}>

          {/* Cart Header */}
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.borderSoft}`, flexShrink:0, background:`linear-gradient(135deg, ${T.surfaceWarm} 0%, ${T.surface} 100%)` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:32, height:32, background:T.tealL, color:T.teal, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <FiShoppingCart size={14}/>
                </div>
                <h2 style={{ fontSize:13, fontWeight:600, color:T.text }}>Cart</h2>
              </div>
              {cart.length > 0 && (
                <button onClick={() => setCart([])}
                  style={{ fontSize:10, color:T.textSoft, background:"transparent", border:"none", cursor:"pointer", padding:"4px 8px", borderRadius:6, transition:"all 0.18s ease" }}
                  onMouseEnter={e => { e.target.style.background = T.surfaceWarm; e.target.style.color = "#DC6B52"; }}
                  onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = T.textSoft; }}
                >Clear</button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex:1, overflowY:"auto", padding:"10px 12px" }}>
            {cart.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center" }}>
                <FiShoppingCart size={28} style={{ color:T.textGhost, marginBottom:8 }}/>
                <p style={{ fontSize:10, fontWeight:500, color:T.textGhost, letterSpacing:"0.05em", textTransform:"uppercase" }}>Empty</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {cart.map(item => (
                  <div key={item._id}
                    style={{
                      display:"flex", gap:10, alignItems:"start",
                      padding:"10px 11px", background:T.surfaceWarm, borderRadius:11,
                      border:`1px solid ${T.border}`, transition:"all 0.18s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.surfaceMid; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.surfaceWarm; }}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:T.surface, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
                      <img src={item.image} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <p style={{ fontSize:11, fontWeight:500, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</p>
                        <span style={{ fontSize:11, fontWeight:700, color:T.text, fontFamily:"Geist Mono, monospace", whitespace:"nowrap" }}>₹{item.basePrice * item.qty}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:T.textGhost }}>₹{item.basePrice} each</span>
                        <div style={{ display:"flex", alignItems:"center", gap:4, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 6px" }}>
                          <button onClick={() => updateQty(item._id, -1)} style={{ background:"none", border:"none", color:T.textSoft, cursor:"pointer", padding:2, fontSize:12 }}>
                            <FiMinus size={10}/>
                          </button>
                          <span style={{ fontSize:10, fontWeight:600, width:20, textAlign:"center", color:T.text }}>{item.qty}</span>
                          <button onClick={() => updateQty(item._id, 1)} style={{ background:"none", border:"none", color:T.textSoft, cursor:"pointer", padding:2, fontSize:12 }}>
                            <FiPlus size={10}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Section */}
          <div style={{ borderTop:`1px solid ${T.borderSoft}`, background:`linear-gradient(180deg, ${T.surface} 0%, ${T.surfaceWarm} 100%)`, padding:"14px 16px", flexShrink:0, boxShadow:`0 -2px 8px rgba(28,25,23,0.06)` }}>

            {/* Delivery Toggle */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:T.surfaceWarm, borderRadius:10, padding:"3px", border:`1px solid ${T.border}`, marginBottom:14, gap:2 }}>
              {["Walk-in", "Delivery"].map(mode => (
                <button key={mode} onClick={() => setCustomer({ ...customer, deliveryType:mode })}
                  style={{
                    padding:"8px", borderRadius:8, fontSize:10, fontWeight:600,
                    letterSpacing:"0.04em", textTransform:"uppercase",
                    border:"none", cursor:"pointer",
                    background: customer.deliveryType === mode ? T.surface : "transparent",
                    color: customer.deliveryType === mode ? T.teal : T.textSoft,
                    boxShadow: customer.deliveryType === mode ? T.shadowSm : "none",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:4,
                    transition:"all 0.18s ease",
                  }}
                >
                  {mode === "Delivery" && <FiTruck size={11}/>}
                  {mode}
                </button>
              ))}
            </div>

            {/* Customer Info */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              <InputField label="Phone" value={customer.phone} onChange={e => setCustomer({ ...customer, phone:e.target.value.replace(/\D/g,'').slice(0,10) })} placeholder="Phone" type="tel" icon={FiPhone}/>
              <InputField label="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name:e.target.value })} placeholder="Name" icon={FiUser}/>
            </div>

            {/* Delivery Address (Animated) */}
            <AnimatePresence>
              {customer.deliveryType === "Delivery" && (
                <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:"hidden", marginBottom:12 }}>
                  <div style={{ display:"grid", gap:8 }}>
                    <InputField label="House No" value={customer.houseNo} onChange={e => setCustomer({ ...customer, houseNo:e.target.value })} placeholder="House No"/>
                    <InputField label="Street" value={customer.street} onChange={e => setCustomer({ ...customer, street:e.target.value })} placeholder="Street"/>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <InputField label="City" value={customer.city} onChange={e => setCustomer({ ...customer, city:e.target.value })} placeholder="City"/>
                      <InputField label="Zip" value={customer.zip} onChange={e => setCustomer({ ...customer, zip:e.target.value })} placeholder="Zip"/>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment & Total */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
              <div>
                <p style={{ fontSize:9, fontWeight:600, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Payment</p>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  style={{
                    background:"transparent", border:"none", fontSize:12, fontWeight:700,
                    color:T.text, cursor:"pointer", outline:"none",
                  }}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                </select>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:9, fontWeight:600, color:T.textSoft, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:3 }}>Total</p>
                <p style={{ fontSize:18, fontWeight:700, color:T.teal, fontFamily:"Geist Mono, monospace" }}>₹{cartTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* Confirm Button */}
            <button onClick={handlePlaceOrder} disabled={processing}
              style={{
                width:"100%", padding:"12px",
                background: processing ? T.surfaceMid : T.success,
                color: processing ? T.textGhost : "#FFF",
                border:"none", borderRadius:11,
                fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase",
                cursor: processing ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                transition:"all 0.25s ease",
                boxShadow: processing ? "none" : `0 4px 12px rgba(5,150,105,0.2)`,
              }}
            >
              {processing ? (
                <><div style={{ width:10, height:10, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#FFF", borderRadius:"50%", animation:"spin 0.6s linear infinite" }}/> Processing…</>
              ) : (
                <><FiCheckCircle size={12}/> Confirm Order</>
              )}
            </button>
          </div>
        </div>

        {/* ── SUCCESS/ERROR MODAL ────────────────────── */}
        <AnimatePresence>
          {modal.show && (
            <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                onClick={() => setModal({ ...modal, show:false })}
                style={{ position:"absolute", inset:0, background:"rgba(28,25,23,0.22)", backdropFilter:"blur(12px)" }}
              />
              <motion.div
                initial={{ opacity:0, scale:0.95, y:20 }}
                animate={{ opacity:1, scale:1, y:0 }}
                exit={{ opacity:0, scale:0.95, y:20 }}
                transition={{ duration:0.3, ease }}
                style={{
                  position:"relative", background:T.surface, borderRadius:20,
                  padding:"30px 24px", maxWidth:320,
                  border:`1px solid ${T.border}`, boxShadow:T.shadowLg,
                  textAlign:"center",
                }}
              >
                <button onClick={() => setModal({ ...modal, show:false })}
                  style={{ position:"absolute", top:12, right:12, background:T.surfaceWarm, border:`1px solid ${T.border}`, borderRadius:8, padding:6, color:T.textSoft, cursor:"pointer", display:"flex" }}>
                  <FiX size={14}/>
                </button>
                <div style={{
                  width:48, height:48, borderRadius:12,
                  background: modal.type==="success" ? T.successL : "#FEF2F2",
                  color: modal.type==="success" ? T.success : "#DC2626",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  margin:"0 auto 12px", fontSize:20,
                }}>
                  {modal.type==="success" ? "✓" : "!"}
                </div>
                <h3 style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:8 }}>
                  {modal.type==="success" ? "Order Placed" : "Error"}
                </h3>
                <p style={{ fontSize:12, color:T.textSoft, lineHeight:1.6, marginBottom:16 }}>{modal.message}</p>
                <button onClick={() => setModal({ ...modal, show:false })}
                  style={{
                    width:"100%", padding:"10px",
                    background:T.teal, color:"#FFF",
                    border:"none", borderRadius:9,
                    fontSize:11, fontWeight:600, cursor:"pointer",
                    transition:"all 0.2s ease",
                  }}
                  onMouseEnter={e => e.target.style.background = "#0F766E"}
                  onMouseLeave={e => e.target.style.background = T.teal}
                >
                  {modal.type==="success" ? "New Order" : "Dismiss"}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
