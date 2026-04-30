import { useParams, Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
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
  FiHeart, FiZap, FiChevronRight, FiBox, FiX
} from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import toast from "../../utils/toast"; // Custom SeaBite toast
import triggerHaptic from "../../utils/haptics"; // 📱 Haptic feedback
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
      fontFamily: "'Plus Jakarta Sans', sans-serif",
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
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
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
// ─── Freshness Meter ─────────────────────────────────────────────────────────
const FreshnessMeter = ({ createdAt }) => {
  const now = new Date();
  const catchDate = new Date(now);
  catchDate.setHours(4, 0, 0, 0);
  
  // If it's before 4 AM today, the latest catch was at 4 AM yesterday
  if (now < catchDate) {
    catchDate.setDate(catchDate.getDate() - 1);
  }

  const hoursSinceCatch = Math.max(0, (now - catchDate) / 3600000);
  
  // Logic: 
  // 0-12h: Ultimate (Green)
  // 12-24h: Premium (Teal)
  // 24-48h: Standard (Grey-Teal)
  // Normalize 0-48h to 0-100% (where 100% is freshest)
  const percentage = Math.max(0, Math.min(100, 100 - (hoursSinceCatch / 48) * 100));
  
  let label = "Ultimate";
  let color = "#10B981"; 
  let glow = "rgba(16, 185, 129, 0.4)";
  
  if (hoursSinceCatch > 12) {
    label = "Premium";
    color = "#5BBFB5"; 
    glow = "rgba(91, 191, 181, 0.4)";
  }
  if (hoursSinceCatch > 24) {
    label = "Standard";
    color = "#6B8F8A"; 
    glow = "rgba(107, 143, 138, 0.2)";
  }

  // SVG path constants for the arc
  const radius = 35;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      background: "rgba(255,255,255,0.8)",
      backdropFilter: "blur(10px)",
      border: "1px solid #E2EEEC",
      borderRadius: "20px",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginBottom: "24px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ position: "relative", width: "70px", height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg height="70" width="70" style={{ transform: "rotate(-90deg)" }}>
          <circle
            stroke="#F0FBF9"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="35"
            cy="35"
          />
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, filter: `drop-shadow(0 0 4px ${glow})` }}
            r={normalizedRadius}
            cx="35"
            cy="35"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "16px" }}>
          🌊
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1A2E2C" }}>{label} Freshness</h4>
          <span style={{ 
            fontSize: "9px", fontWeight: "900", background: color, color: "#fff", 
            padding: "2px 6px", borderRadius: "20px", textTransform: "uppercase" 
          }}>Live</span>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#6B8F8A", fontWeight: "500" }}>
          Caught approximately <span style={{ color: "#1A2E2C", fontWeight: "700" }}>{Math.floor(hoursSinceCatch) || "under 1"}h</span> ago. 
          Quality verified.
        </p>
      </div>
      
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "18px", fontWeight: "800", color: color, letterSpacing: "-0.02em" }}>{Math.round(percentage)}%</div>
        <div style={{ fontSize: "10px", fontWeight: "700", color: "#B8CFCC", textTransform: "uppercase" }}>Meter</div>
      </div>
    </div>
  );
};

// ─── Image Magnifier ───────────────────────────────────────────────────────────
const ImageMagnifier = ({ src, alt, productId }) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [{ x, y }, setXY] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  return (
    <div 
      style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}
      onMouseEnter={(e) => {
        const { width, height } = e.currentTarget.getBoundingClientRect();
        setImgSize({ w: width, h: height });
        setShowMagnifier(true);
      }}
      onMouseLeave={() => setShowMagnifier(false)}
      onMouseMove={(e) => {
        const elem = e.currentTarget;
        const { top, left } = elem.getBoundingClientRect();
        const mouseX = e.pageX - left - window.scrollX;
        const mouseY = e.pageY - top - window.scrollY;
        setXY({ x: mouseX, y: mouseY });
      }}
    >
      <motion.img
        layoutId={`product-image-${productId}`}
        layout="position"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "crosshair", pointerEvents: "none" }}
      />
      <AnimatePresence>
        {showMagnifier && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              pointerEvents: "none",
              height: "160px",
              width: "160px",
              top: y - 80,
              left: x - 80,
              opacity: 1,
              border: "3px solid #5BBFB5",
              borderRadius: "50%",
              backgroundColor: "#fff",
              backgroundImage: `url('${src}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${imgSize.w * 2.5}px ${imgSize.h * 2.5}px`,
              backgroundPositionX: `${-x * 2.5 + 80}px`,
              backgroundPositionY: `${-y * 2.5 + 80}px`,
              boxShadow: "0 12px 30px rgba(26, 46, 44, 0.15)",
              zIndex: 100
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Pincode Checker ───────────────────────────────────────────────────────────
const PincodeChecker = () => {
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState(null);

  const checkPincode = () => {
    if (pincode.length !== 6) return setStatus("error");
    setStatus("loading");
    setTimeout(() => {
      // AP & TS pin codes: 500001–535999 (prefixes 50, 51, 52, 53)
      const num = parseInt(pincode, 10);
      if (num >= 500001 && num <= 535999) {
        setStatus("success");
      } else {
        setStatus("unavailable");
      }
    }, 600);
  };

  return (
    <div style={{ marginBottom: "24px", padding: "16px", background: "#F4F9F8", border: "1.5px solid #E2EEEC", borderRadius: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <FiTruck style={{ color: "#5BBFB5" }} />
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C" }}>Check Expected Delivery</span>
      </div>
      <div style={{ display: "flex", gap: "8px", height: "42px" }}>
        <input 
          maxLength={6} 
          placeholder="Enter Pincode" 
          value={pincode} 
          onChange={(e) => { setPincode(e.target.value.replace(/[^0-9]/g, '')); setStatus(null); }}
          style={{ flex: 1, padding: "0 14px", border: "1.5px solid #E2EEEC", borderRadius: "8px", fontSize: "13px", color: "#1A2E2C", outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
        />
        <button 
          onClick={checkPincode}
          disabled={pincode.length !== 6 || status === 'loading'}
          style={{ padding: "0 20px", background: pincode.length === 6 ? "#1A2E2C" : "#DDE9E7", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: pincode.length === 6 ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.2s" }}
        >
          {status === 'loading' ? '...' : 'Check'}
        </button>
      </div>
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: "12px", fontSize: "12px", color: "#059669", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
            <FiCheck /> Express delivery available: Get it by 2 PM today.
          </motion.div>
        )}
        {status === 'unavailable' && pincode.length === 6 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: "12px", fontSize: "12px", color: "#DC2626", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
            <FiX /> Sorry, we currently deliver only in Andhra Pradesh & Telangana.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─── Recently Viewed Component ──────────────────────────────────────────────────
const RecentlyViewed = ({ items, getFullImageUrl }) => {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: "48px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1A2E2C", marginBottom: "20px" }}>
        Recently Viewed
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
        {items.map(item => (
          <Link key={item._id} to={`/products/${item._id}`} style={{ textDecoration: "none" }}>
            <div style={{ 
              background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px", padding: "16px",
              textAlign: "center", transition: "all 0.2s", cursor: "pointer", height: "100%"
            }} className="recent-card">
              <div style={{ width: "100%", aspectRatio: "1/1", background: "#F4F9F8", borderRadius: "12px", padding: "10px", marginBottom: "12px" }}>
                <img src={getFullImageUrl(item.image)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#1A2E2C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>{item.name}</p>
              <p style={{ fontSize: "13px", fontWeight: "800", color: "#5BBFB5" }}>₹{item.basePrice}</p>
            </div>
          </Link>
        ))}
      </div>
      <style>{`.recent-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(26,46,44,0.06); border-color: #B8DDD9 !important; }`}</style>
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
  const [isWaitlisting, setIsWaitlisting] = useState(false);
  const [isJoinedWaitlist, setIsJoinedWaitlist] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [flyItems, setFlyItems] = useState([]);
  const flyIdRef = useRef(0);
  const [recentItems, setRecentItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

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
      .then((res) => { 
        setProduct(res.data); 
        setSelectedImage(res.data.image);
        setLoading(false); 
        
        // Save to Recently Viewed
        try {
          const recent = JSON.parse(localStorage.getItem("seabite_recent") || "[]");
          const filtered = recent.filter(p => p._id !== res.data._id);
          filtered.unshift({
            _id: res.data._id,
            name: res.data.name,
            image: res.data.image,
            basePrice: res.data.basePrice
          });
          const newRecent = filtered.slice(0, 4);
          localStorage.setItem("seabite_recent", JSON.stringify(newRecent));
          setRecentItems(newRecent.filter(p => p._id !== res.data._id));
        } catch {}
      })
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
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsAdded(true);
    const safetyTimer = setTimeout(() => setIsAdded(false), 4500);

    try {
      const btn = e ? e.currentTarget : null;
      if (btn) {
        const btnRect = btn.getBoundingClientRect();
        
        const cartIcons = Array.from(document.querySelectorAll('[data-cart-icon]'));
        const cartIconEl = cartIcons.find(icon => {
          const r = icon.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        const cartRect = cartIconEl 
            ? cartIconEl.getBoundingClientRect() 
            : { left: window.innerWidth - 40, top: 20, width: 30, height: 30 };

        const startX = btnRect.left + btnRect.width / 2 - 30;
        const startY = btnRect.top + btnRect.height / 2 - 30;
        const endX = cartRect.left + cartRect.width / 2 - 15;
        const endY = cartRect.top + cartRect.height / 2 - 15;

        const flyId = ++flyIdRef.current;
        setFlyItems(prev => [...prev, {
          id: flyId,
          startX, startY, endX, endY,
          image: getFullImageUrl(product.image)
        }]);
        
        setTimeout(() => {
            if (cartIconEl) {
                cartIconEl.animate([
                  { transform: "scale(1)" }, { transform: "scale(1.5)" }, 
                  { transform: "scale(0.9)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }
                ], { duration: 500, easing: "ease-out" });
            }
        }, 1100);
      }
    } catch (err) {
      console.error("Cart animation computation failed: ", err);
      setIsAdded(false);
      clearTimeout(safetyTimer);
    }

    setTimeout(() => {
      try {
        triggerHaptic("medium");
        addToCart({ ...product, qty, price: parseFloat(totalPrice) });
        refreshCartCount();
        toast.success(`${product.name} added`, {
          icon: "🛒",
        });
      } finally {
        setTimeout(() => {
          setIsAdded(false);
          clearTimeout(safetyTimer);
        }, 2000);
      }
    }, 1100);
  };

  const handleFlyComplete = useCallback((fId) => {
    setFlyItems((prev) => prev.filter((item) => item.id !== fId));
  }, []);

  const handleBuyNow = () => {
    if (!product || product.stock === "out") return;
    addToCart({ ...product, qty, price: parseFloat(totalPrice) });
    refreshCartCount();
    navigate("/checkout");
  };

  const handleWishlistToggle = async () => {
    triggerHaptic("soft");
    if (!user) { toast.error("Please login to save items"); return navigate("/login"); }
    setLoadingWishlist(true);
    try {
      const res = await axios.post(`${API_URL}/api/user/wishlist/${product._id}`, {}, { withCredentials: true });
      toast.success(res.data.message, { icon: "❤️" });
      await refreshMe();
    } catch { toast.error("Failed to update wishlist"); }
    finally { setLoadingWishlist(false); }
  };

  const handleWaitlistJoin = async () => {
    if (!user) { toast.error("Please login to join the waitlist"); return navigate("/login"); }
    setIsWaitlisting(true);
    try {
      const res = await axios.post(`${API_URL}/api/products/${product._id}/waitlist`, {}, { withCredentials: true });
      toast.success(res.data.message, { icon: "📧" });
      setIsJoinedWaitlist(true);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to join waitlist"); }
    finally { setIsWaitlisting(false); }
  };

  if (loading) {
    return <SeaBiteLoader fullScreen />;
  }

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F9F8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');`}</style>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎣</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "26px", fontWeight: "600", color: "#1A2E2C", marginBottom: "8px" }}>Item Not Found</h2>
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .detail-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        .qty-btn:hover { background: #E2EEEC !important; }
        .tab-btn { background: none; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: color 0.2s; }
        .wishlist-btn:hover { border-color: #F07468 !important; color: #F07468 !important; }
        .add-btn:hover:not(:disabled) { background: #2D4A47 !important; }
        .review-card:hover { border-color: #B8DDD9 !important; }
        .product-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: start; }
        @media (min-width: 768px) {
          .product-grid { grid-template-columns: 1fr 1fr; gap: 48px; }
        }
      `}</style>

      {typeof document !== "undefined" && createPortal(
        flyItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ left: item.startX, top: item.startY, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ left: item.endX, top: item.endY, opacity: 0.6, scale: 0.2, rotate: 90 }}
            transition={{ 
              duration: 1.1,
              left: { ease: "linear", duration: 1.1 },
              top: { ease: [0.3, -0.4, 0.7, 1], duration: 1.1 },
              scale: { ease: "easeOut", duration: 1.1 },
              rotate: { ease: "easeOut", duration: 1.1 },
            }}
            onAnimationComplete={() => handleFlyComplete(item.id)}
            style={{ 
              position: "fixed", 
              width: "60px", 
              height: "60px", 
              zIndex: 99999999, 
              pointerEvents: "none",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
            }}
          >
            <img src={item.image} alt="Flying item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>
        )),
        document.body
      )}

      <div
        className="detail-root"
        style={{ minHeight: "100vh", background: "#F4F9F8", paddingTop: "88px", paddingBottom: "64px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "400px", background: "linear-gradient(180deg, rgba(91,191,181,0.06) 0%, transparent 100%)", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Link to="/products" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B8F8A", textDecoration: "none", fontSize: "13px", fontWeight: "600", transition: "color 0.2s" }}>
              <FiArrowLeft size={14} />
              Market
            </Link>
            <FiChevronRight size={11} style={{ color: "#B8CFCC" }} />
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#5BBFB5" }}>{product.name}</span>
          </motion.div>

          <div className="product-grid">
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
                <div style={{ position: "absolute", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(91,191,181,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

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

                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
                    <ImageMagnifier src={getFullImageUrl(selectedImage || product.image)} alt={product.name} productId={product._id} />
                  </div>
                  
                  {product.images && product.images.length > 0 && (
                    <div style={{ 
                      display: "flex", 
                      gap: "10px", 
                      justifyContent: "center", 
                      padding: "20px 0 0",
                      overflowX: "auto",
                      scrollbarWidth: "none"
                    }}>
                      {[product.image, ...product.images].filter(Boolean).map((img, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedImage(img)}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "10px",
                            border: `2px solid ${selectedImage === img ? "#5BBFB5" : "#E2EEEC"}`,
                            background: "#F4F9F8",
                            padding: "4px",
                            cursor: "pointer",
                            flexShrink: 0,
                            overflow: "hidden"
                          }}
                        >
                          <img src={getFullImageUrl(img)} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt={`Gallery ${idx}`} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{ paddingTop: "8px" }}
            >
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#5BBFB5", textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: "10px" }}>
                {product.category || "Fresh Catch"} · Fresh From The Sea
              </span>

              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "700", color: "#1A2E2C", letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: "20px" }}>
                {product.name}
              </h1>

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

              <div style={{ height: "1px", background: "#F0F5F4", marginBottom: "20px" }} />

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

              {/* Freshness Meter */}
              <FreshnessMeter createdAt={product.createdAt} />

              <PincodeChecker />

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
                      style={{ background: "none", border: "none", cursor: isJoinedWaitlist ? "default" : "pointer", fontSize: "12px", fontWeight: "700", color: isJoinedWaitlist ? "#5BBFB5" : "#6B8F8A", textDecoration: "underline", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
                      style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* Star Distribution Histogram */}
                      {product.reviews?.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "24px", background: "#F4F9F8", padding: "20px", borderRadius: "16px", border: "1.5px solid #E2EEEC" }}>
                          <div style={{ textAlign: "center", flexShrink: 0 }}>
                            <div style={{ fontSize: "36px", fontWeight: "800", color: "#1A2E2C", lineHeight: 1 }}>
                              {product.rating ? product.rating.toFixed(1) : "5.0"}
                            </div>
                            <div style={{ display: "flex", gap: "2px", margin: "6px 0 4px" }}>
                              {[...Array(5)].map((_, s) => (
                                <FiStar key={s} size={14} fill={s < Math.round(product.rating || 5) ? "#F59E0B" : "none"} style={{ color: s < Math.round(product.rating || 5) ? "#F59E0B" : "#E2EEEC" }} />
                              ))}
                            </div>
                            <div style={{ fontSize: "11px", color: "#6B8F8A", fontWeight: "700" }}>{product.numReviews} Reviews</div>
                          </div>

                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[5, 4, 3, 2, 1].map(star => {
                              const count = product.reviews.filter(r => Math.round(r.rating) === star).length;
                              const percentage = product.numReviews > 0 ? (count / product.numReviews) * 100 : 0;
                              return (
                                <div key={star} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "11px", color: "#1A2E2C", width: "16px", fontWeight: "800", textAlign: "right" }}>{star}</span>
                                  <FiStar size={10} style={{ color: "#F59E0B", flexShrink: 0 }} fill="#F59E0B" />
                                  <div style={{ flex: 1, height: "6px", background: "#E2EEEC", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: `${percentage}%`, height: "100%", background: "#F59E0B", borderRadius: "4px", transition: "width 0.5s ease-out" }} />
                                  </div>
                                  <span style={{ fontSize: "10px", color: "#6B8F8A", width: "20px", textAlign: "right", fontWeight: "600" }}>{percentage.toFixed(0)}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {product.reviews?.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "360px", overflowY: "auto", paddingRight: "6px" }}>
                          {product.reviews.map((review, i) => (
                            <div key={i} className="review-card" style={{ background: "#fff", border: "1.5px solid #E2EEEC", borderRadius: "16px", padding: "16px", transition: "border-color 0.2s", boxShadow: "0 2px 8px rgba(26,46,44,0.02)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                <div>
                                  <span style={{ fontSize: "14px", fontWeight: "800", color: "#1A2E2C", display: "flex", alignItems: "center", gap: "6px" }}>
                                    {review.name}
                                    <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#5BBFB5", background: "#F0FBF9", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                      <FiCheck size={10} /> Verified Purchase
                                    </span>
                                  </span>
                                  <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                                    {[...Array(5)].map((_, s) => (
                                      <FiStar key={s} size={11} fill={s < review.rating ? "#F59E0B" : "none"} style={{ color: s < review.rating ? "#F59E0B" : "#E2EEEC" }} />
                                    ))}
                                  </div>
                                </div>
                                <span style={{ fontSize: "11px", color: "#8BA5B3", fontWeight: "600" }}>{new Date(review.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                              </div>
                              <p style={{ fontSize: "14px", color: "#4A6572", lineHeight: "1.6", margin: "8px 0" }}>{review.comment}</p>
                              
                              {/* Review Images */}
                              {review.images && review.images.length > 0 && (
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                                  {review.images.map((img, idx) => (
                                    <motion.img
                                      key={idx}
                                      whileHover={{ scale: 1.05 }}
                                      src={getFullImageUrl(img)}
                                      alt={`Review ${idx}`}
                                      style={{ 
                                        width: "60px", 
                                        height: "60px", 
                                        borderRadius: "8px", 
                                        objectFit: "cover", 
                                        border: "1px solid #E2EEEC",
                                        cursor: "zoom-in"
                                      }}
                                      onClick={() => setSelectedImage(img)}
                                    />
                                  ))}
                                </div>
                              )}

                              <div style={{ display: "flex", gap: "12px", marginTop: "12px", borderTop: "1px solid #F4F9F8", paddingTop: "12px" }}>
                                <button style={{ background: "none", border: "none", fontSize: "12px", color: "#6B8F8A", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontWeight: "600" }}>
                                  👍 Helpful (0)
                                </button>
                              </div>
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
                          style={{ padding: "10px 0", background: "#F0FBF9", border: "1.5px solid #B8DDD9", borderRadius: "10px", color: "#5BBFB5", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s" }}
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
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
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
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "background 0.2s ease",
                    letterSpacing: "0.02em",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isAdded ? (
                      <motion.span key="added" initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiCheck size={15} /> Added
                      </motion.span>
                    ) : product.stock === "out" ? (
                      <span>Sold Out</span>
                    ) : (
                      <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiShoppingBag size={15} /> Add
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                {/* Buy Now */}
                <motion.button
                  whileTap={product.stock !== "out" ? { scale: 0.97 } : {}}
                  onClick={handleBuyNow}
                  disabled={product.stock === "out"}
                  style={{
                    flex: 1, height: "46px",
                    border: "none", borderRadius: "10px",
                    background: product.stock === "out" ? "#F0F5F4" : "#E8A365",
                    color: product.stock === "out" ? "#B8CFCC" : "#1A2E2C",
                    fontSize: "13px", fontWeight: "800",
                    cursor: product.stock === "out" ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "background 0.2s ease",
                    letterSpacing: "0.02em",
                  }}
                >
                  Buy Now
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

          {/* ── Recently Viewed Section ───────────────────────────── */}
          {recentItems.length > 0 && (
            <RecentlyViewed items={recentItems} getFullImageUrl={getFullImageUrl} />
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