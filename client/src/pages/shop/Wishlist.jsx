import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import toast from "../../utils/toast"; // Custom SeaBite toast
import triggerHaptic from "../../utils/haptics"; // 📱 Haptic feedback
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Wishlist() {
    const { user } = useContext(AuthContext);
    const { addToCart, globalDiscount } = useContext(CartContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

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
        }//s
    };

    const handleWishlistRemove = (productId) => {
        setWishlist(prev => prev.filter(p => p._id !== productId));
    };

    const handleMoveToCart = (productId) => {
        triggerHaptic("medium"); // 📳 Haptic vibration
        const product = wishlist.find((p) => p._id === productId);
        if (!product) return;
        handleWishlistRemove(productId);
        toast.success(`${product.name} moved to cart`, {
            icon: "🛒",
        });
    };

    const handleMoveAllToCart = () => {
        triggerHaptic("heavy"); // 📳 Heavy haptic for bulk action
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
            icon: "🛒",
        });
    };

    if (loading) return <SeaBiteLoader fullScreen />;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
                .wishlist-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
                    gap: 24px;
                }
                @media (max-width: 640px) {
                    .wishlist-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 14px;
                    }
                }
            `}</style>

            <div style={{
                fontFamily: "'Manrope', sans-serif",
                background: "#F4F9F8",
                minHeight: "100vh",//f
                paddingTop: 96,
                paddingBottom: 100,
                paddingLeft: 28,
                paddingRight: 28,//sddgfcgf
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                    {/* ── HEADER ── */}
                    <div style={{ marginBottom: 40 }}>
                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                            <div>
                                <p style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#9AB5B1", fontWeight: 700, marginBottom: 10 }}>Saved Items</p>
                                <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#1A2E2C", letterSpacing: "-0.03em", lineHeight: 1 }}>
                                    Wishlist
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#9AB5B1", marginLeft: 14, letterSpacing: 0, verticalAlign: "middle" }}>
                                        {wishlist.length}
                                    </span>
                                </h1>
                            </div>

                            {wishlist.length > 0 && (
                                <button
                                    onClick={addAll}
                                    style={{
                                        padding: "10px 24px", background: "#5BBFB5", color: "#fff",
                                        border: "none", borderRadius: 10, fontFamily: "inherit",
                                        fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                                        textTransform: "uppercase", cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        boxShadow: "0 4px 16px rgba(91,191,181,0.25)",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#4AA99F"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#5BBFB5"; e.currentTarget.style.transform = "translateY(0)"; }}
                                >Add all to cart</button>
                            )}
                        </div>
                        <div style={{ height: "1px", background: "#E2EEEC", marginTop: 24 }} />
                    </div>

                    {/* ── GRID ── */}
                    {wishlist.length > 0 ? (
                        <div className="wishlist-grid">
                            {wishlist.map((product) => (
                                <EnhancedProductCard
                                    key={product._id}
                                    product={product}
                                    isWishlistMode={true}
                                    globalDiscount={globalDiscount}
                                    onWishlistChange={handleWishlistRemove}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "100px 0" }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: "50%",
                                background: "#E2EEEC", display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 20px", fontSize: 32,
                            }}>💚</div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: "#9AB5B1", marginBottom: 24 }}>Your wishlist is empty</p>
                            <Link
                                to="/products"
                                style={{
                                    display: "inline-block", padding: "11px 28px",
                                    background: "#5BBFB5", color: "#fff", textDecoration: "none",
                                    borderRadius: 10, fontSize: 12, fontWeight: 700,
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                    boxShadow: "0 4px 16px rgba(91,191,181,0.25)",
                                    transition: "all 0.2s ease",
                                }}
                            >Browse Products</Link>
                        </div>
                    )}

                    {/* ── FOOTER ── */}
                    {wishlist.length > 0 && (
                        <div style={{ marginTop: 72, borderTop: "1px solid #E2EEEC", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 10, color: "#9AB5B1", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Free delivery over ₹999</p>
                            <p style={{ fontSize: 10, color: "#9AB5B1", letterSpacing: "0.06em", fontWeight: 600 }}>SeaBite · 2026</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}