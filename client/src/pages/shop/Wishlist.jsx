import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import toast from "react-hot-toast";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";

const API_URL = import.meta.env.VITE_API_URL || "";

/* ─────────────────────────────────────────
   CARD
───────────────────────────────────────── */
function Card({ p, onOpen, onRemove, onAdd, idx }) {
    const [hov, setHov] = useState(false);
    const [added, setAdded] = useState(false);
    const [out, setOut] = useState(false);

    const isFlash = p.flashSale?.isFlashSale && new Date(p.flashSale.saleEndDate) > new Date();
    const dp = isFlash ? p.flashSale.discountPrice : p.basePrice;
    const pct = dp < p.basePrice ? Math.round((1 - dp / p.basePrice) * 100) : 0;

    const handleRemove = e => {
        e.stopPropagation();
        setOut(true);
        setTimeout(() => onRemove(p._id), 280);
    };

    const handleAdd = e => {
        e.stopPropagation();
        setAdded(true);
        setTimeout(() => { setAdded(false); onAdd(p._id); }, 700);
    };

    return (
        <div
            onClick={() => onOpen(p)}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                cursor: "pointer",
                opacity: out ? 0 : 1,
                transform: out ? "translateY(6px)" : "translateY(0)",
                transition: out ? "opacity .28s ease, transform .28s ease" : "none",
                animationName: "wlUp",
                animationDuration: ".5s",
                animationTimingFunction: "cubic-bezier(.16,1,.3,1)",
                animationFillMode: "both",
                animationDelay: `${idx * 55}ms`,
            }}
        >
            {/* ── image ── */}
            <div style={{ position: "relative", overflow: "hidden", background: "#f5f4f2", aspectRatio: "3/4" }}>
                <img
                    src={p.images?.[0]}
                    alt={p.name}
                    style={{
                        width: "100%", height: "100%", objectFit: "cover", display: "block",
                        transform: hov ? "scale(1.04)" : "scale(1)",
                        transition: "transform .6s cubic-bezier(.16,1,.3,1)",
                    }}
                />

                {/* top row — badge + remove */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: 12,
                    opacity: hov ? 1 : 0,
                    transition: "opacity .22s ease",
                }}>
                    {pct > 0
                        ? <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", background: "#111", color: "#fff", padding: "3px 9px", borderRadius: 3 }}>{pct}% off</span>
                        : <span />
                    }
                    <button
                        onClick={handleRemove}
                        style={{
                            width: 28, height: 28, borderRadius: "50%", background: "#fff",
                            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 1px 6px rgba(0,0,0,.1)",
                        }}
                    >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1 1l7 7M8 1L1 8" stroke="#666" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* view label */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    textAlign: "center", padding: "22px 0 14px",
                    background: "linear-gradient(transparent, rgba(0,0,0,.38))",
                    opacity: hov ? 1 : 0,
                    transform: hov ? "translateY(0)" : "translateY(4px)",
                    transition: "opacity .22s ease, transform .22s ease",
                }}>
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,.9)" }}>View Details</span>
                </div>
            </div>

            {/* ── text ── */}
            <div style={{ paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 10, fontWeight: 400, color: "#aaa", letterSpacing: "0.06em", marginBottom: 3 }}>{p.category}</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#111", letterSpacing: "-0.01em", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>₹{dp.toLocaleString()}</p>
                        {pct > 0 && <p style={{ fontSize: 10, color: "#bbb", textDecoration: "line-through" }}>₹{p.basePrice.toLocaleString()}</p>}
                    </div>
                </div>

                <button
                    onClick={handleAdd}
                    style={{
                        marginTop: 11, width: "100%", padding: "9px 0",
                        background: added ? "#111" : "transparent",
                        color: added ? "#fff" : "#111",
                        border: "1px solid",
                        borderColor: added ? "#111" : "#ddd",
                        borderRadius: 4, fontFamily: "inherit",
                        fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "background .25s, color .25s, border-color .25s",
                    }}
                >
                    {added ? "Added ✓" : "Add to Cart"}
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   MODAL
───────────────────────────────────────── */
function Modal({ p, onClose, onAdd }) {
    const [vis, setVis] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

    const close = () => { setVis(false); setTimeout(onClose, 300); };

    const isFlash = p.flashSale?.isFlashSale && new Date(p.flashSale.saleEndDate) > new Date();
    const dp = isFlash ? p.flashSale.discountPrice : p.basePrice;
    const pct = dp < p.basePrice ? Math.round((1 - dp / p.basePrice) * 100) : 0;

    return (
        <div
            onClick={close}
            style={{
                position: "fixed", inset: 0, zIndex: 50,
                background: vis ? "rgba(0,0,0,.4)" : "rgba(0,0,0,0)",
                transition: "background .3s ease",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "100%", maxWidth: 680, background: "#fff",
                    borderRadius: "16px 16px 0 0", overflow: "hidden",
                    transform: vis ? "translateY(0)" : "translateY(40px)",
                    opacity: vis ? 1 : 0,
                    transition: "transform .35s cubic-bezier(.16,1,.3,1), opacity .3s ease",
                }}
            >
                <div style={{ width: 32, height: 3, background: "#e5e5e5", borderRadius: 99, margin: "12px auto 0" }} />

                <div style={{ display: "flex" }}>
                    {/* image */}
                    <div style={{ width: 240, flexShrink: 0, background: "#f5f4f2", position: "relative" }}>
                        <img src={p.images?.[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 340, display: "block" }} />
                        {pct > 0 && (
                            <div style={{ position: "absolute", top: 12, left: 12, background: "#111", color: "#fff", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 3 }}>
                                {pct}% off
                            </div>
                        )}
                    </div>

                    {/* info */}
                    <div style={{ flex: 1, padding: "36px 32px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 340 }}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 400, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{p.category}</p>
                            <h2 style={{ fontFamily: "inherit", fontSize: 26, fontWeight: 400, color: "#111", letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 20 }}>{p.name}</h2>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                                <span style={{ fontSize: 28, fontWeight: 400, color: "#111", letterSpacing: "-0.02em" }}>₹{dp.toLocaleString()}</span>
                                {pct > 0 && <span style={{ fontSize: 14, color: "#ccc", textDecoration: "line-through" }}>₹{p.basePrice.toLocaleString()}</span>}
                            </div>
                            {pct > 0 && <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 500 }}>You save ₹{(p.basePrice - dp).toLocaleString()}</p>}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                            <button
                                onClick={() => { onAdd(p._id); close(); }}
                                style={{
                                    padding: "13px 0", background: "#111", color: "#fff",
                                    border: "none", borderRadius: 6, fontFamily: "inherit",
                                    fontSize: 10, fontWeight: 600, letterSpacing: "0.16em",
                                    textTransform: "uppercase", cursor: "pointer",
                                    transition: "background .2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#333"}
                                onMouseLeave={e => e.currentTarget.style.background = "#111"}
                            >Add to Cart</button>
                            <button
                                onClick={close}
                                style={{
                                    padding: "12px 0", background: "transparent", color: "#999",
                                    border: "1px solid #e8e8e8", borderRadius: 6, fontFamily: "inherit",
                                    fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                                    textTransform: "uppercase", cursor: "pointer",
                                    transition: "border-color .2s, color .2s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#aaa"; e.currentTarget.style.color = "#555"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.color = "#999"; }}
                            >Dismiss</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Wishlist() {
    const { user } = useContext(AuthContext);
    const { addToCart, globalDiscount } = useContext(CartContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);

    useEffect(() => { fetchWishlist(); }, [user]);

    const fetchWishlist = async () => {
        if (!user) { setLoading(false); return; }
        try {
            const res = await axios.get(`${API_URL}/api/user/wishlist`, { withCredentials: true });
            setWishlist(res.data);
        } catch (err) {
            console.error("Failed to fetch wishlist", err);
        } finally {
            setLoading(false);
        }
    };

    const remove = id => setWishlist(p => p.filter(i => i._id !== id));

    const addCart = id => {
        const product = wishlist.find(p => p._id === id);
        if (!product) return;
        const isFlash = product.flashSale?.isFlashSale && new Date(product.flashSale.saleEndDate) > new Date();
        let price = isFlash ? product.flashSale.discountPrice : product.basePrice;
        if (!isFlash && globalDiscount > 0) price = Math.round(product.basePrice * (1 - globalDiscount / 100));
        addToCart({ ...product, quantity: 1, price });
        remove(id);
        toast.success(`${product.name} moved to cart`, {
            style: { background: "#111", color: "#fff", borderRadius: "6px", fontSize: "12px", fontWeight: 500 },
        });
    };

    const addAll = () => {
        const n = wishlist.length;
        if (!n) return;
        wishlist.forEach(product => {
            const isFlash = product.flashSale?.isFlashSale && new Date(product.flashSale.saleEndDate) > new Date();
            let price = isFlash ? product.flashSale.discountPrice : product.basePrice;
            if (!isFlash && globalDiscount > 0) price = Math.round(product.basePrice * (1 - globalDiscount / 100));
            addToCart({ ...product, quantity: 1, price });
        });
        setWishlist([]);
        toast.success(`${n} items moved to cart`, {
            style: { background: "#111", color: "#fff", borderRadius: "6px", fontSize: "12px", fontWeight: 500 },
        });
    };

    if (loading) return <SeaBiteLoader fullScreen />;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes wlUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fafaf9", minHeight: "100vh", paddingTop: 96, paddingBottom: 100, paddingLeft: 28, paddingRight: 28 }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                    {/* ── HEADER ── */}
                    <div style={{ marginBottom: 48 }}>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                            <div>
                                <p style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#bbb", fontWeight: 400, marginBottom: 10 }}>Saved Items</p>
                                <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 300, color: "#111", letterSpacing: "-0.03em", lineHeight: 1 }}>
                                    Wishlist
                                    <span style={{ fontSize: 14, fontWeight: 400, color: "#bbb", marginLeft: 14, letterSpacing: 0, verticalAlign: "middle" }}>
                                        {wishlist.length}
                                    </span>
                                </h1>
                            </div>

                            {wishlist.length > 0 && (
                                <button
                                    onClick={addAll}
                                    style={{
                                        padding: "9px 22px", background: "#111", color: "#fff",
                                        border: "none", borderRadius: 6, fontFamily: "inherit",
                                        fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
                                        textTransform: "uppercase", cursor: "pointer",
                                        transition: "background .2s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#333"}
                                    onMouseLeave={e => e.currentTarget.style.background = "#111"}
                                >Add all to cart</button>
                            )}
                        </div>
                        <div style={{ height: "0.5px", background: "#e5e5e5", marginTop: 24 }} />
                    </div>

                    {/* ── GRID ── */}
                    {wishlist.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "28px 20px" }}>
                            {wishlist.map((p, i) => (
                                <Card key={p._id} p={p} idx={i} onOpen={setModal} onRemove={remove} onAdd={addCart} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "100px 0" }}>
                            <p style={{ fontSize: 13, fontWeight: 400, color: "#ccc", letterSpacing: "0.04em", marginBottom: 24 }}>Your wishlist is empty</p>
                            <Link
                                to="/products"
                                style={{
                                    display: "inline-block", padding: "9px 22px",
                                    background: "#111", color: "#fff", textDecoration: "none",
                                    borderRadius: 6, fontSize: 10, fontWeight: 500,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                }}
                            >Browse Products</Link>
                        </div>
                    )}

                    {/* ── FOOTER ── */}
                    {wishlist.length > 0 && (
                        <div style={{ marginTop: 72, borderTop: "0.5px solid #eee", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 10, color: "#ccc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 400 }}>Free delivery over ₹999</p>
                            <p style={{ fontSize: 10, color: "#ccc", letterSpacing: "0.06em", fontWeight: 400 }}>SeaBite · 2026</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODAL ── */}
            {modal && <Modal p={modal} onClose={() => setModal(null)} onAdd={addCart} />}
        </>
    );
}