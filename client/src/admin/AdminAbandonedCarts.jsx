// AdminAbandonedCarts.jsx — SeaBite · Cream & Stone Design System v2
// Abandoned cart recovery interface

import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiShoppingCart, FiMail, FiClock, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

const ease = [0.22, 1, 0.36, 1];

const T = {
  bg:          "#FAFAF8",
  surface:     "#FFFFFF",
  surfaceWarm: "#F7F5F0",
  surfaceMid:  "#F0EDE6",
  border:      "rgba(120,113,108,0.12)",
  borderSoft:  "rgba(120,113,108,0.07)",
  teal:    "#0D9488", tealL: "#F0FDFA",
  coral:   "#DC6B52", coralL: "#FFF1EE",
  text:      "#1C1917",
  textMid:   "#57534E",
  textSoft:  "#A8A29E",
  textGhost: "#D6D3D1",
  shadowSm:   "0 1px 2px rgba(28,25,23,0.04), 0 1px 1px rgba(28,25,23,0.03)",
  shadowMd:   "0 4px 12px rgba(28,25,23,0.05), 0 1px 3px rgba(28,25,23,0.04)",
};

const fadeUp = {
  hidden:  { opacity:0, y:12 },
  visible: (i=0) => ({ opacity:1, y:0, transition:{ delay:i*0.055, duration:0.45, ease } }),
};
const stagger = { hidden:{}, visible:{ transition:{ staggerChildren:0.055 } } };

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes shimmer{ 0%{background-position:-400px 0}100%{background-position:400px 0} }
    .sb { font-family:'Geist',system-ui,-apple-system,sans-serif; }
    ::-webkit-scrollbar { width:3px; height:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${T.textGhost}; border-radius:3px; }
  `}</style>
);

function Card({ children, style={}, hover=true }) {
  const [on, setOn] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setOn(true)}
      onMouseLeave={() => hover && setOn(false)}
      style={{
        background: T.surface,
        border: `1px solid ${on ? "rgba(120,113,108,0.17)" : T.border}`,
        borderRadius: 22,
        boxShadow: on ? T.shadowMd : T.shadowSm,
        transition: "all 0.28s cubic-bezier(0.22,1,0.36,1)",
        transform: on ? "translateY(-1px)" : "translateY(0)",
        overflow: "hidden",
        ...style,
      }}
    >{children}</div>
  );
}

function Chip({ children, color="stone" }) {
  const m = { teal:{bg:T.tealL,fg:T.teal}, coral:{bg:T.coralL,fg:T.coral} };
  const c = m[color] || { bg:T.surfaceMid, fg:T.textMid };
  return <span style={{ display:"inline-flex", alignItems:"center", background:c.bg, color:c.fg, fontSize:9, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", borderRadius:6, padding:"4px 8px" }}>{children}</span>;
}

const Skeleton = () => (
  <div style={{ padding:28, background:T.bg, minHeight:"100vh" }}>
    <GS/>
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ height:10, width:140, borderRadius:6, background:T.surfaceMid, animation:"shimmer 1.4s infinite", backgroundSize:"400px", backgroundImage:`linear-gradient(90deg,${T.surfaceMid} 25%,${T.surfaceWarm} 50%,${T.surfaceMid} 75%)`, marginBottom:20 }}/>
      <div style={{ display:"grid", gap:14 }}>
        {[...Array(3)].map((_,i)=>(
          <div key={i} style={{ height:180, borderRadius:22, border:`1px solid ${T.border}`, background:`linear-gradient(90deg,${T.surface} 25%,${T.surfaceWarm} 50%,${T.surface} 75%)`, backgroundSize:"400px", animation:"shimmer 1.4s infinite" }}/>
        ))}
      </div>
    </div>
  </div>
);

export default function AdminAbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const { data } = await axios.get("/api/admin/carts/abandoned", { withCredentials:true });
      setCarts(data || []);
    } catch { toast.error("Failed to load carts"); }
    finally { setLoading(false); }
  };

  const handleRemind = async (userId) => {
    setSending(userId);
    try {
      await axios.post(`/api/admin/carts/remind/${userId}`, {}, { withCredentials:true });
      toast.success("Reminder sent! 📧");
    } catch { toast.error("Failed to send"); }
    finally { setSending(null); }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://images.pexels.com/photos/2903391/pexels-photo-2903391.jpeg?auto=compress&cs=tinysrgb&w=100";
    return imagePath.startsWith("http") ? imagePath : `/uploads/${imagePath}`;
  };

  if (loading) return <Skeleton/>;

  return (
    <>
      <GS/>
      <motion.div className="sb" initial="hidden" animate="visible" variants={stagger}
        style={{ minHeight:"100vh", background:T.bg, padding:"28px", maxWidth:1200, margin:"0 auto", color:T.text }}
      >
        {/* ── HEADER ─────────────────────────────────── */}
        <motion.div variants={fadeUp} style={{ marginBottom:28, borderBottom:`1px solid ${T.borderSoft}`, paddingBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <FiShoppingCart size={14} style={{ color:T.teal }}/>
                <span style={{ fontSize:10, fontWeight:500, color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase" }}>Recovery</span>
              </div>
              <h1 style={{ fontSize:24, fontWeight:600, color:T.text, letterSpacing:"-0.02em", marginBottom:6 }}>Abandoned Carts</h1>
              <p style={{ fontSize:13, color:T.textSoft, fontWeight:400 }}>Recover sales by reminding customers of their items</p>
            </div>
            <div style={{
              background:`linear-gradient(135deg, ${T.tealL} 0%, ${T.surface} 100%)`,
              borderRadius:14, padding:"12px 16px", border:`1px solid ${T.border}`,
              boxShadow:T.shadowSm,
            }}>
              <p style={{ fontSize:9, fontWeight:500, color:T.textSoft, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:4 }}>Potential Revenue</p>
              <p style={{ fontSize:20, fontWeight:600, color:T.teal, fontFamily:"Geist Mono, monospace" }}>
                ₹{carts.reduce((a,c)=>a+(c.total||0),0).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── CART CARDS ─────────────────────────────── */}
        {carts.length === 0 ? (
          <motion.div variants={fadeUp}>
            <Card hover={false}>
              <div style={{ padding:"60px 40px", textAlign:"center" }}>
                <FiShoppingCart size={40} style={{ color:T.textGhost, margin:"0 auto 12px", display:"block" }}/>
                <h3 style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:4 }}>No Abandoned Carts</h3>
                <p style={{ fontSize:12, color:T.textSoft }}>All customers completed their purchases! 🎉</p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display:"grid", gap:14 }}>
            {carts.map((user, idx) => (
              <motion.div key={user._id} variants={fadeUp} custom={idx}>
                <Card>
                  <div style={{ padding:"18px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

                    {/* ── LEFT: User & Action ──────────────── */}
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                        <div style={{
                          width:42, height:42, borderRadius:11,
                          background:T.tealL, color:T.teal,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:14, fontWeight:600,
                        }}>
                          {user.name?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <h3 style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3 }}>{user.name || "Customer"}</h3>
                          <p style={{ fontSize:11, color:T.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display:"flex", alignItems:"center", gap:8,
                        padding:"10px 12px", borderRadius:11,
                        background:T.surfaceWarm, border:`1px solid ${T.border}`,
                        marginBottom:12,
                      }}>
                        <FiClock size={13} style={{ color:T.textSoft, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:T.textSoft }}>
                          {new Date(user.updatedAt).toLocaleDateString("en-IN",{ day:"numeric", month:"short", year:"2-digit" })}
                        </span>
                      </div>

                      <button onClick={() => handleRemind(user._id)} disabled={sending === user._id}
                        style={{
                          width:"100%", padding:"11px",
                          background: sending === user._id ? T.surfaceMid : T.teal,
                          color: sending === user._id ? T.textGhost : "#FFF",
                          border:"none", borderRadius:11,
                          fontSize:11, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase",
                          cursor: sending === user._id ? "not-allowed" : "pointer",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                          transition:"all 0.25s ease",
                          boxShadow: sending === user._id ? "none" : `0 2px 8px rgba(13,148,136,0.16)`,
                        }}
                      >
                        {sending === user._id ? (
                          <><div style={{ width:9, height:9, border:"1.5px solid rgba(255,255,255,0.4)", borderTopColor:"#FFF", borderRadius:"50%", animation:"spin 0.6s linear infinite" }}/> Sending…</>
                        ) : (
                          <><FiMail size={12}/> Send Reminder</>
                        )}
                      </button>
                    </div>

                    {/* ── RIGHT: Cart Items ────────────────── */}
                    <div>
                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                          <p style={{ fontSize:10, fontWeight:600, color:T.textSoft, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                            Items ({user.cart?.length || 0})
                          </p>
                          <p style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"Geist Mono, monospace" }}>
                            ₹{(user.total || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        background:T.surfaceWarm, border:`1px solid ${T.border}`, borderRadius:12,
                        padding:"12px", maxHeight:180, overflowY:"auto",
                      }}>
                        {user.cart && user.cart.length > 0 ? (
                          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {user.cart.map((item, i) => (
                              <div key={i} style={{
                                display:"flex", alignItems:"center", gap:10,
                                padding:"9px 10px", borderRadius:9,
                                background:T.surface, border:`1px solid ${T.border}`,
                              }}>
                                <img
                                  src={getImageUrl(item.product?.image)}
                                  alt={item.product?.name}
                                  style={{
                                    width:36, height:36, borderRadius:8,
                                    objectFit:"contain", background:T.surfaceWarm,
                                    padding:2, flexShrink:0,
                                  }}
                                />
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:11, fontWeight:500, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
                                    {item.product?.name || "Product"}
                                  </p>
                                  <p style={{ fontSize:10, color:T.textGhost }}>
                                    {item.qty}x ₹{item.product?.price || 0}
                                  </p>
                                </div>
                                <span style={{ fontSize:11, fontWeight:600, color:T.text, whitespace:"nowrap", fontFamily:"Geist Mono, monospace", minWidth:50, textAlign:"right" }}>
                                  ₹{((item.qty || 0) * (item.product?.price || 0)).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ textAlign:"center", padding:"12px", fontSize:11, color:T.textGhost }}>No items in cart</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
