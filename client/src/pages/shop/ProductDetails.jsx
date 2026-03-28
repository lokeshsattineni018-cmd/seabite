import { useParams, Link, useNavigate } from "react-router-dom";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import { useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { CartContext } from "../../context/CartContext";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { addToCart } from "../../utils/cartStorage";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft, FiMinus, FiPlus, FiShoppingBag, FiTruck,
  FiInfo, FiCheck, FiPackage, FiStar, FiMessageSquare,
  FiHeart, FiZap, FiChevronRight, FiBox,
} from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import ReviewModal from "../../components/common/ReviewModal";

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── Bundle Section ───────────────────────────────────────────────────────────
const BundleSection = ({ mainProduct, relatedProducts, getFullImageUrl, refreshCartCount }) => {
  const [selectedItems, setSelectedItems] = useState(relatedProducts.map((p) => p._id));
  const [isAdding, setIsAdding] = useState(false);

  const toggleItem = (id) =>
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const mainPrice = mainProduct.flashSale?.isFlashSale
    ? mainProduct.flashSale.discountPrice
    : mainProduct.basePrice * (1 - (mainProduct.globalDiscount || 0) / 100);

  const bundleTotal = selectedItems.reduce((acc, id) => {
    const item = relatedProducts.find((p) => p._id === id);
    return acc + (item ? item.basePrice : 0);
  }, mainPrice);

  const handleAddBundle = () => {
    setIsAdding(true);
    addToCart({ ...mainProduct, price: mainPrice, qty: 1 });
    selectedItems.forEach((id) => {
      const item = relatedProducts.find((p) => p._id === id);
      if (item) addToCart({ ...item, price: item.basePrice, qty: 1 });
    });
    refreshCartCount();
    toast.success(`${selectedItems.length + 1} items added to cart`, {
      style: { background: "#5BBFB5", color: "#fff", borderRadius: "12px", fontSize: "13px" },
      icon: "📦",
    });
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #E2EEEC",
      borderRadius: "20px",
      padding: "32px",
      fontFamily: "'Manrope', sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <div style={{ width: "36px", height: "36px", background: "#F0FBF9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FiBox size={18} style={{ color: "#5BBFB5" }} />
        </div>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1A2E2C", letterSpacing: "-0.01em", margin: 0 }}>
            Frequently Bought Together
          </h3>
          <p style={{ fontSize: "12px", color: "#6B8F8A", margin: 0, marginTop: "2px" }}>Save when you bundle these fresh picks</p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
        {/* Product lineup */}
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          {/* Main item */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "100px", height: "100px",
              background: "#F4F9F8", borderRadius: "14px",
              border: "2px solid #5BBFB5",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "10px", position: "relative",
            }}>
              <span style={{
                position: "absolute", top: "-8px", left: "8px",
                background: "#5BBFB5", color: "#fff",
                fontSize: "8px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.05em"
              }}>This Item</span>
              <img src={getFullImageUrl(mainProduct.image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt={mainProduct.name} />
            </div>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#1A2E2C", marginTop: "8px", maxWidth: "100px", lineHeight: 1.3 }}>{mainProduct.name}</p>
            <p style={{ fontSize: "12px", fontWeight: "800", color: "#5BBFB5", margin: "2px 0 0" }}>₹{mainPrice.toFixed(0)}</p>
          </div>

          {relatedProducts.map((rel, i) => (
            <div key={rel._id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#B8CFCC", fontSize: "18px", fontWeight: "300" }}>+</span>
              <div style={{ textAlign: "center", cursor: "pointer" }} onClick={() => toggleItem(rel._id)}>
                <div style={{
                  width: "88px", height: "88px",
                  background: "#F4F9F8", borderRadius: "12px",
                  border: `2px solid ${selectedItems.includes(rel._id) ? "#5BBFB5" : "#E2EEEC"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "8px", position: "relative", transition: "all 0.2s ease",
                  opacity: selectedItems.includes(rel._id) ? 1 : 0.55,
                }}>
                  <div style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "18px", height: "18px", borderRadius: "6px",
                    background: selectedItems.includes(rel._id) ? "#5BBFB5" : "#E2EEEC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}>
                    <FiCheck size={10} style={{ color: selectedItems.includes(rel._id) ? "#fff" : "#E2EEEC", strokeWidth: 3 }} />
                  </div>
                  <img src={getFullImageUrl(rel.image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt={rel.name} />
                </div>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#1A2E2C", marginTop: "6px", maxWidth: "88px", lineHeight: 1.3 }}>{rel.name}</p>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#6B8F8A", margin: "2px 0 0" }}>₹{rel.basePrice}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bundle total card */}
        <div style={{
          minWidth: "220px",
          background: "#F4F9F8",
          border: "1.5px solid #E2EEEC",
          borderRadius: "16px",
          padding: "24px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: "#6B8F8A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            {selectedItems.length + 1} items total
          </p>
          <p style={{ fontSize: "32px", fontWeight: "800", color: "#1A2E2C", letterSpacing: "-0.03em", marginBottom: "20px", lineHeight: 1 }}>
            ₹{bundleTotal.toFixed(0)}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddBundle}
            disabled={isAdding}
            style={{
              width: "100%", padding: "11px 0",
              background: "#1A2E2C", color: "#fff",
              border: "none", borderRadius: "10px",
              fontSize: "13px", fontWeight: "700",
              cursor: "pointer", fontFamily: "'Manrope', sans-serif",
              letterSpacing: "0.02em",
              transition: "opacity 0.2s",
              opacity: isAdding ? 0.7 : 1,
            }}
          >
            {isAdding ? "Adding…" : "Add Bundle to Cart"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCartCount } = useContext(CartContext);
  const { token, user, refreshMe } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("desc");
  const [isAdded, setIsAdded] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isWaitlisting, setIsWaitlisting] = useState(false);
  const [isJoinedWaitlist, setIsJoinedWaitlist] = useState(false);

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === "string" ? item : item._id) === id
  );

  const isActiveFlashSale =
    product?.flashSale?.isFlashSale &&
    new Date(product.flashSale.saleEndDate) > new Date();

  const basePrice = product ? parseFloat(product.basePrice) : 0;
  let unitPrice = isActiveFlashSale ? product.flashSale.discountPrice : basePrice;
  const globalDiscount = product?.globalDiscount || 0;
  const isGlobalDiscount = !isActiveFlashSale && globalDiscount > 0;
  if (isGlobalDiscount) unitPrice = Math.round(basePrice * (1 - globalDiscount / 100));
  const totalPrice = (unitPrice * qty).toFixed(2);

  const discountPct = isActiveFlashSale
    ? Math.round((1 - product.flashSale.discountPrice / basePrice) * 100)
    : isGlobalDiscount ? globalDiscount : 0;

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return cleanPath.startsWith("/uploads")
      ? `${API_URL}${cleanPath}`
      : `${API_URL}/uploads${cleanPath}`;
  };

  const fetchProduct = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_URL}/api/products/${id}`, { withCredentials: true })
      .then((res) => { setProduct(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { window.scrollTo(0, 0); fetchProduct(); }, [fetchProduct]);

  useEffect(() => {
    if (user && id) {
      axios
        .get(`${API_URL}/api/products/${id}/can-review`, { withCredentials: true })
        .then((res) => setCanReview(res.data.canReview))
        .catch(() => setCanReview(false));
    }
  }, [user, id]);

  useEffect(() => {
    if (user && product?.waitlist) {
      setIsJoinedWaitlist(
        product.waitlist.some((wId) => (typeof wId === "string" ? wId : wId._id) === user._id)
      );
    }
  }, [user, product]);

  const handleAddToCart = (e) => {
    if (!product || isAdded) return;
    
    // Stop propagation just in case
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsAdded(true);

    try {
      const btn = e ? e.currentTarget : null;
      if (btn) {
        const btnRect = btn.getBoundingClientRect();
        
        // Find visible cart icon
        const cartIcons = Array.from(document.querySelectorAll('[data-cart-icon]'));
        const cartIconEl = cartIcons.find(icon => {
          const r = icon.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        // Fallback to top-right corner if hidden on mobile
        const cartRect = cartIconEl 
            ? cartIconEl.getBoundingClientRect() 
            : { left: window.innerWidth - 40, top: 20, width: 30, height: 30 };

        const startX = btnRect.left + btnRect.width / 2 - 30;
        const startY = btnRect.top + btnRect.height / 2 - 30;
        const endX = cartRect.left + cartRect.width / 2 - 15;
        const endY = cartRect.top + cartRect.height / 2 - 15;

        // X-Axis Container
        const flyerX = document.createElement("div");
        flyerX.style.position = "fixed";
        flyerX.style.left = `${startX}px`;
        flyerX.style.top = `0px`; 
        flyerX.style.zIndex = "99999999";
        flyerX.style.pointerEvents = "none";

        // Y-Axis Container
        const flyerY = document.createElement("div");
        flyerY.style.position = "absolute";
        flyerY.style.left = "0px";
        flyerY.style.top = `${startY}px`;

        // Exact Product Image clone without lollipop styles (raw image)
        const imgClone = document.createElement("img");
        imgClone.src = getFullImageUrl(product.image);
        imgClone.style.width = "60px";
        imgClone.style.height = "60px";
        imgClone.style.objectFit = "cover";
        imgClone.style.borderRadius = "12px"; 
        imgClone.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
        
        flyerY.appendChild(imgClone);
        flyerX.appendChild(flyerY);
        document.body.appendChild(flyerX);

        // Natively hardware-accelerated Bezier Curve
        flyerX.animate([
            { left: `${startX}px` },
            { left: `${endX}px` }
        ], { duration: 1100, easing: 'linear', fill: 'forwards' });

        const animY = flyerY.animate([
            { top: `${startY}px`, transform: `scale(1) rotate(0deg)`, opacity: 1 },
            { top: `${endY}px`, transform: `scale(0.2) rotate(90deg)`, opacity: 0.6 }
        ], { duration: 1100, easing: 'cubic-bezier(0.3, -0.4, 0.7, 1)', fill: 'forwards' });

        animY.onfinish = () => {
          flyerX.remove();
          if (cartIconEl) {
            cartIconEl.animate([
              { transform: "scale(1)" },
              { transform: "scale(1.5)" }, 
              { transform: "scale(0.9)" },
              { transform: "scale(1.1)" },
              { transform: "scale(1)" }
            ], { duration: 500, easing: "ease-out" });
          }
        };
      }
    } catch (err) {
      console.error("Cart animation failed: ", err);
    }

    // Wait for the visual flight before logically adding to cart
    setTimeout(() => {
      addToCart({ ...product, qty, price: parseFloat(totalPrice) });
      refreshCartCount();
      toast.success(`${product.name} added`, {
        style: { background: "#5BBFB5", color: "#fff", fontSize: "13px", borderRadius: "12px" },
        icon: "🛒",
      });
      setTimeout(() => setIsAdded(false), 2000);
    }, 1100);
  };

  const handleWishlistToggle = async () => {
    if (!user) { toast.error("Please login to save items"); return navigate("/login"); }
    setLoadingWishlist(true);
    try {
      const res = await axios.post(`${API_URL}/api/user/wishlist/${product._id}`, {}, { withCredentials: true });
      toast.success(res.data.message, { style: { borderRadius: "12px", fontSize: "13px" }, icon: "❤️" });
      await refreshMe();
    } catch { toast.error("Failed to update wishlist"); }
    finally { setLoadingWishlist(false); }
  };

  const handleWaitlistJoin = async () => {
    if (!user) { toast.error("Please login to join the waitlist"); return navigate("/login"); }
    setIsWaitlisting(true);
    try {
      const res = await axios.post(`${API_URL}/api/products/${product._id}/waitlist`, {}, { withCredentials: true });
      toast.success(res.data.message, { style: { borderRadius: "12px", fontSize: "13px" }, icon: "📧" });
      setIsJoinedWaitlist(true);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to join waitlist"); }
    finally { setIsWaitlisting(false); }
  };



  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return <SeaBiteLoader fullScreen />;
  }

  // ── Not found ─────────────────────────────────────────
  if (!product) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F9F8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", fontFamily: "'Manrope', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700&family=Lora:wght@500&display=swap');`}</style>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎣</div>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: "26px", fontWeight: "600", color: "#1A2E2C", marginBottom: "8px" }}>Item Not Found</h2>
        <p style={{ color: "#6B8F8A", fontSize: "14px", marginBottom: "24px" }}>We couldn't find this catch. It may have swum away.</p>
        <Link to="/products" style={{ padding: "10px 24px", background: "#1A2E2C", color: "#fff", borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>
          Back to Market
        </Link>
      </div>
    );
  }

  const TABS = [
    { id: "desc", label: "Description" },
    { id: "shipping", label: "Delivery" },
    { id: "reviews", label: `Reviews ${product.numReviews ? `(${product.numReviews})` : ""}` },
  ];

  return (
    <>
      {product && (
        <Helmet>
          <title>{product.name} | SeaBite - Fresh Seafood Delivery</title>
          <meta name="description" content={`Buy fresh ${product.name} online from SeaBite. ${product.description?.slice(0, 120) || "Sourced daily from the coast, delivered fresh to your door. Chemical-free and 100% traceable."}`} />
          <link rel="canonical" href={`https://seabite.co.in/products/${product._id}`} />
          <meta property="og:title" content={`${product.name} | SeaBite`} />
          <meta property="og:description" content={product.description?.slice(0, 160) || "Fresh coastal seafood from SeaBite."} />
          <meta property="og:image" content={product.image ? `${API_URL}${product.image}` : "https://seabite.co.in/fisherman.jpg"} />
          <meta property="og:type" content="product" />
          <meta property="og:url" content={`https://seabite.co.in/products/${product._id}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${product.name} | SeaBite`} />
          <meta name="twitter:description" content={product.description?.slice(0, 120) || "Fresh coastal seafood from SeaBite."} />
          <meta name="twitter:image" content={product.image ? `${API_URL}${product.image}` : "https://seabite.co.in/fisherman.jpg"} />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description || `Fresh ${product.name} from SeaBite`,
            "image": product.image ? `${API_URL}${product.image}` : "https://seabite.co.in/fisherman.jpg",
            "brand": { "@type": "Brand", "name": "SeaBite" },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": product.flashSale?.isFlashSale ? product.flashSale.discountPrice : product.basePrice,
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": `https://seabite.co.in/products/${product._id}`,
              "seller": { "@type": "Organization", "name": "SeaBite" }
            },
            ...(product.numReviews > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.rating || 4.5,
                "reviewCount": product.numReviews
              }
            })
          })}</script>
        </Helmet>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Lora:wght@500;600;700&display=swap');
        * { box-sizing: border-box; }
        .detail-root { font-family: 'Manrope', sans-serif; }
        .qty-btn:hover { background: #E2EEEC !important; }
        .tab-btn { background: none; border: none; cursor: pointer; font-family: 'Manrope', sans-serif; transition: color 0.2s; }
        .wishlist-btn:hover { border-color: #F07468 !important; color: #F07468 !important; }
        .add-btn:hover:not(:disabled) { background: #2D4A47 !important; }
        .review-card:hover { border-color: #B8DDD9 !important; }
        .product-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: start; }
        @media (min-width: 768px) {
          .product-grid { grid-template-columns: 1fr 1fr; gap: 48px; }
        }
      `}</style>



      <div
        className="detail-root"
        style={{ minHeight: "100vh", background: "#F4F9F8", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        {/* Subtle wave bg */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "400px", background: "linear-gradient(180deg, rgba(91,191,181,0.06) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Link to="/products" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B8F8A", textDecoration: "none", fontSize: "13px", fontWeight: "600", transition: "color 0.2s" }}>
              <FiArrowLeft size={14} />
              Market
            </Link>
            <FiChevronRight size={11} style={{ color: "#B8CFCC" }} />
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#5BBFB5" }}>{product.name}</span>
          </motion.div>

          {/* ── Main 2-col layout ─────────────────────────── */}
          <div className="product-grid">

            {/* ── LEFT: Image ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "sticky", top: "108px" }}
            >
              <div style={{
                background: "#fff",
                borderRadius: "20px",
                border: "1.5px solid #E2EEEC",
                padding: "40px",
                aspectRatio: "1/1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Soft ocean halo */}
                <div style={{ position: "absolute", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,191,181,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

                {/* Badges */}
                <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 10 }}>
                  {product.trending && (
                    <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: "9px", fontWeight: "800", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.08em" }}>🔥 Trending</span>
                  )}
                  {isActiveFlashSale && (
                    <span style={{ background: "#FEE2E2", color: "#B91C1C", fontSize: "9px", fontWeight: "800", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FiZap size={8} /> Flash Deal -{discountPct}%
                    </span>
                  )}
                  {isGlobalDiscount && (
                    <span style={{ background: "#EDE9FE", color: "#6D28D9", fontSize: "9px", fontWeight: "800", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Happy Hour -{globalDiscount}%
                    </span>
                  )}
                </div>

                <motion.img
                  layoutId={`product-image-${product._id}`}
                  layout="position"
                  initial={{ scale: 0.88, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  src={getFullImageUrl(product.image)}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1, transition: "transform 0.5s ease" }}
                  className="product-img-hover"
                />
              </div>

              <style>{`.product-img-hover:hover { transform: scale(1.04); }`}</style>
            </motion.div>

            {/* ── RIGHT: Details ───────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{ paddingTop: "8px" }}
            >
              {/* Category label */}
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: "10px" }}>
                {product.category || "Fresh Catch"} · Fresh From The Sea
              </span>

              {/* Product name */}
              <h1 style={{ fontFamily: "'Lora', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "700", color: "#1A2E2C", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "20px" }}>
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} size={14} style={{ color: i < Math.round(product.rating) ? "#F59E0B" : "#E2EEEC" }} fill={i < Math.round(product.rating) ? "#F59E0B" : "none"} />
                    ))}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>{product.rating.toFixed(1)}</span>
                  <span style={{ fontSize: "12px", color: "#B8CFCC" }}>({product.numReviews} reviews)</span>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: "1px", background: "#F0F5F4", marginBottom: "20px" }} />

              {/* Price */}
              <div style={{ marginBottom: "24px" }}>
                {(isActiveFlashSale || isGlobalDiscount) && (
                  <span style={{ fontSize: "16px", color: "#B8CFCC", textDecoration: "line-through", display: "block", marginBottom: "4px" }}>₹{basePrice.toFixed(0)}</span>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "40px", fontWeight: "800", color: "#1A2E2C", letterSpacing: "-0.04em", lineHeight: 1 }}>
                    ₹{Number(unitPrice).toFixed(0)}
                  </span>
                  <span style={{ fontSize: "14px", color: "#6B8F8A", fontWeight: "500" }}>/ {product.unit || "kg"}</span>
                  {discountPct > 0 && (
                    <span style={{ fontSize: "12px", fontWeight: "800", background: "#F0FBF9", color: "#5BBFB5", padding: "3px 10px", borderRadius: "20px", marginLeft: "4px" }}>
                      Save {discountPct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Stock status */}
              <div style={{ marginBottom: "28px" }}>
                {(product.stock === "out" || (product.countInStock !== undefined && product.countInStock <= 0)) ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "#FEF2F2", borderRadius: "20px", border: "1px solid #FECACA", fontSize: "11px", fontWeight: "700", color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#DC2626" }} />
                      Sold Out
                    </span>
                    <button
                      onClick={handleWaitlistJoin}
                      disabled={isWaitlisting || isJoinedWaitlist}
                      style={{ background: "none", border: "none", cursor: isJoinedWaitlist ? "default" : "pointer", fontSize: "12px", fontWeight: "700", color: isJoinedWaitlist ? "#5BBFB5" : "#6B8F8A", textDecoration: "underline", fontFamily: "'Manrope', sans-serif" }}
                    >
                      {isWaitlisting ? "Subscribing…" : isJoinedWaitlist ? "✓ Subscribed to alerts" : "Notify me when available"}
                    </button>
                  </div>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "#F0FBF9", borderRadius: "20px", border: "1px solid #B8DDD9", fontSize: "11px", fontWeight: "700", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#5BBFB5", animation: "pulse 2s infinite" }} />
                    In Stock
                    <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
                  </span>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#F0F5F4", marginBottom: "24px" }} />

              {/* ── Tabs ─────────────────────────────────── */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #E2EEEC", marginBottom: "20px", overflowX: "auto" }}>
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="tab-btn"
                      style={{
                        padding: "10px 18px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: activeTab === tab.id ? "#1A2E2C" : "#B8CFCC",
                        borderBottom: `2px solid ${activeTab === tab.id ? "#5BBFB5" : "transparent"}`,
                        marginBottom: "-1px",
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === "desc" && (
                    <motion.p key="desc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                      style={{ fontSize: "14px", color: "#6B8F8A", lineHeight: "1.8", fontWeight: "400" }}>
                      {product.desc || "Premium quality seafood sourced directly from local fishermen. Guaranteed fresh and stored at optimal temperatures to maintain flavor and texture."}
                    </motion.p>
                  )}

                  {activeTab === "shipping" && (
                    <motion.div key="shipping" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                      style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {[
                        { icon: <FiTruck size={16} style={{ color: "#5BBFB5" }} />, title: "Express Delivery", desc: "Delivered within 1–2 days of order confirmation." },
                        { icon: <FiInfo size={16} style={{ color: "#5BBFB5" }} />, title: "Packaging", desc: "Vacuum sealed to ensure maximum freshness." },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                          <div style={{ width: "36px", height: "36px", background: "#F0FBF9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", marginBottom: "3px" }}>{item.title}</p>
                            <p style={{ fontSize: "13px", color: "#6B8F8A", lineHeight: "1.6" }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === "reviews" && (
                    <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                      style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {product.reviews?.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
                          {product.reviews.map((review, i) => (
                            <div key={i} className="review-card" style={{ background: "#F4F9F8", border: "1.5px solid #E2EEEC", borderRadius: "12px", padding: "14px 16px", transition: "border-color 0.2s" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>{review.name}</span>
                                <div style={{ display: "flex", gap: "2px" }}>
                                  {[...Array(5)].map((_, s) => (
                                    <FiStar key={s} size={11} fill={s < review.rating ? "#F59E0B" : "none"} style={{ color: s < review.rating ? "#F59E0B" : "#E2EEEC" }} />
                                  ))}
                                </div>
                              </div>
                              <p style={{ fontSize: "13px", color: "#6B8F8A", lineHeight: "1.6", marginBottom: "6px" }}>{review.comment}</p>
                              <span style={{ fontSize: "10px", color: "#B8CFCC", fontWeight: "600" }}>{new Date(review.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "28px", border: "1.5px dashed #E2EEEC", borderRadius: "12px" }}>
                          <p style={{ fontSize: "14px", color: "#B8CFCC", marginBottom: "4px" }}>🎣 No reviews yet.</p>
                          <p style={{ fontSize: "12px", color: "#B8CFCC" }}>Be the first to share your catch experience!</p>
                        </div>
                      )}
                      {canReview ? (
                        <button
                          onClick={() => setIsReviewOpen(true)}
                          style={{ padding: "10px 0", background: "#F0FBF9", border: "1.5px solid #B8DDD9", borderRadius: "10px", color: "#5BBFB5", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "'Manrope', sans-serif", transition: "all 0.2s" }}
                        >
                          <FiMessageSquare size={14} /> Write a Review
                        </button>
                      ) : (
                        <p style={{ fontSize: "12px", color: "#B8CFCC", textAlign: "center" }}>
                          {user ? "Only verified buyers can leave reviews." : <><Link to="/login" style={{ color: "#5BBFB5", fontWeight: "700" }}>Login</Link> to write a review.</>}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#F0F5F4", marginBottom: "24px" }} />

              {/* ── Action Row ───────────────────────────── */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* Quantity */}
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "#F4F9F8", border: "1.5px solid #E2EEEC",
                  borderRadius: "10px", overflow: "hidden", flexShrink: 0,
                }}>
                  <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{ width: "38px", height: "46px", border: "none", background: "transparent", color: "#6B8F8A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                    <FiMinus size={13} />
                  </button>
                  <span style={{ width: "36px", textAlign: "center", fontSize: "15px", fontWeight: "800", color: "#1A2E2C" }}>{qty}</span>
                  <button className="qty-btn" onClick={() => setQty((q) => q + 1)}
                    style={{ width: "38px", height: "46px", border: "none", background: "transparent", color: "#6B8F8A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                    <FiPlus size={13} />
                  </button>
                </div>

                {/* Wishlist */}
                <button
                  className="wishlist-btn"
                  onClick={handleWishlistToggle}
                  disabled={loadingWishlist}
                  style={{
                    width: "46px", height: "46px", flexShrink: 0,
                    border: `1.5px solid ${isWishlisted ? "#F07468" : "#E2EEEC"}`,
                    borderRadius: "10px", background: isWishlisted ? "#FFF5F4" : "#fff",
                    color: isWishlisted ? "#F07468" : "#B8CFCC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                >
                  {loadingWishlist
                    ? <div style={{ width: "16px", height: "16px", border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                    : <FiHeart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                  }
                </button>

                {/* Add to cart */}
                <motion.button
                  className={`add-btn ${!isAdded && product.stock !== "out" ? "liquid-cta" : ""}`}
                  whileTap={!isAdded && product.stock !== "out" ? { scale: 0.97 } : {}}
                  onClick={handleAddToCart}
                  disabled={isAdded || product.stock === "out"}
                  style={{
                    flex: 1, height: "46px",
                    border: "none", borderRadius: "10px",
                    background: isAdded ? "#5BBFB5" : product.stock === "out" ? "#F0F5F4" : "#1A2E2C",
                    color: isAdded ? "#fff" : product.stock === "out" ? "#B8CFCC" : "#fff",
                    fontSize: "13px", fontWeight: "700",
                    cursor: product.stock === "out" ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    fontFamily: "'Manrope', sans-serif",
                    transition: "background 0.2s ease",
                    letterSpacing: "0.02em",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isAdded ? (
                      <motion.span key="added" initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiCheck size={15} /> Added to Cart
                      </motion.span>
                    ) : product.stock === "out" ? (
                      <span>Sold Out</span>
                    ) : (
                      <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiShoppingBag size={15} /> ₹{totalPrice} · Add
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* ── Bundle Section ───────────────────────────── */}
          {product.relatedProducts?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ marginTop: "48px" }}
            >
              <BundleSection
                mainProduct={product}
                relatedProducts={product.relatedProducts}
                getFullImageUrl={getFullImageUrl}
                refreshCartCount={refreshCartCount}
              />
            </motion.div>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={product}
        token={token}
        API_URL={API_URL}
        onSuccess={fetchProduct}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}