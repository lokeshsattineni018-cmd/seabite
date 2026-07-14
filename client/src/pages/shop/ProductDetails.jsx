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
  FiHeart, FiZap, FiChevronRight, FiBox, FiX, FiAlertCircle,
  FiShare2
} from "react-icons/fi";
import { Helmet } from "react-helmet-async";
import toast from "../../utils/toast"; // Custom SeaBite toast
import triggerHaptic from "../../utils/haptics"; // 📱 Haptic feedback
import ReviewModal from "../../components/common/ReviewModal";
import RecommendationBlock from "../../components/common/RecommendationBlock";
import EnhancedProductCard from "../../components/products/EnhancedProductCard";

import { slugify } from "../../utils/slugify";

const API_URL = import.meta.env.VITE_API_URL || "";
import socket from "../../utils/socket";
import { v4 as uuidv4 } from 'uuid';

// ─── Bundle Section ───────────────────────────────────────────────────────────
const BundleSection = ({ mainProduct, relatedProducts, getFullImageUrl, refreshCartCount, viewerCount }) => {
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ fontSize: "12px", fontWeight: "800", color: "#5BBFB5", margin: "2px 0 0" }}>₹{mainPrice.toFixed(0)}</p>
              {mainProduct.basePrice > mainPrice && (
                <p style={{ fontSize: "10px", color: "#6B8F8A", textDecoration: "line-through", margin: 0 }}>₹{mainProduct.basePrice}</p>
              )}
            </div>
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
                  <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    fontSize: "10px", fontWeight: "900", background: "rgba(91, 191, 181, 0.1)", color: "#5BBFB5",
                    padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.08em",
                    display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(91, 191, 181, 0.2)", marginBottom: "12px"
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5BBFB5] animate-pulse" />
                  {viewerCount > 1 ? `${viewerCount} people viewing now` : "Recently Viewed"}
                </motion.span>
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
const FreshnessMeter = ({ productId }) => {
  // Generate a realistic, deterministic number of hours between 2 and 14 based on product ID
  const hash = productId ? productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const hoursSinceCatch = (hash % 13) + 2;
  
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
    <div className="freshness-widget" style={{
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
      <style>{`
        @media (max-width: 768px) {
          .freshness-widget {
            padding: 12px 16px;
            gap: 12px;
          }
          .freshness-info p {
            font-size: 11px !important;
          }
          .freshness-info h4 {
            font-size: 13px !important;
          }
        }
      `}</style>
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
      
      <div className="freshness-info" style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1A2E2C" }}>{label} Freshness</h4>
          <span style={{ 
            fontSize: "9px", fontWeight: "900", background: color, color: "#fff", 
            padding: "2px 6px", borderRadius: "20px", textTransform: "uppercase" 
          }}>Live</span>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#6B8F8A", fontWeight: "500" }}>
          Caught <span style={{ color: "#1A2E2C", fontWeight: "700" }}>{Math.floor(hoursSinceCatch) || "under 1"}h</span> ago (at {(() => {
            const catchTime = new Date(Date.now() - hoursSinceCatch * 3600000);
            return catchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          })()}).
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
  const [deliveryInfo, setDeliveryInfo] = useState("");

  const checkPincode = () => {
    if (pincode.length !== 6) return setStatus("error");
    setStatus("loading");
    setTimeout(() => {
      const num = parseInt(pincode, 10);
      
      // AP & TS pin codes: 500001–539999 (prefixes 50, 51, 52, 53)
      if (num >= 500001 && num <= 539999) {
        setStatus("success");
        
        const now = new Date();
        const hour = now.getHours();
        
        let distanceKm = 0;
        let zone = "C";
        
        if (pincode === "534281") {
          distanceKm = 2;
          zone = "A";
        } else if (pincode.startsWith("5342")) {
          distanceKm = 8 + (Math.abs(parseInt(pincode.slice(4), 10) - 81) % 15);
          zone = "A";
        } else if (pincode.startsWith("534") || pincode.startsWith("533") || pincode.startsWith("520") || pincode.startsWith("521")) {
          distanceKm = 30 + (parseInt(pincode.slice(3), 10) % 70);
          zone = "B";
        } else {
          distanceKm = 120 + (parseInt(pincode.slice(3), 10) % 280);
          zone = "C";
        }
        
        let deliveryText = "";
        
        if (hour >= 17) {
          // Evening / Night: No dispatches possible today
          if (zone === "A") {
            deliveryText = "Tomorrow Morning (by 11:00 AM) • Dispatched tomorrow 6:00 AM";
          } else if (zone === "B") {
            deliveryText = "Tomorrow Afternoon (by 3:00 PM) • Dispatched tomorrow 7:00 AM";
          } else {
            deliveryText = "Day after tomorrow (by 12:00 PM) • Dispatched tomorrow 8:00 AM";
          }
        } else if (hour >= 12) {
          // Afternoon: Local can still be dispatched for tonight, others tomorrow
          if (zone === "A") {
            deliveryText = "Today Evening (by 7:00 PM) • Dispatched today 4:00 PM";
          } else if (zone === "B") {
            deliveryText = "Tomorrow Morning (by 11:00 AM) • Dispatched tomorrow 6:00 AM";
          } else {
            deliveryText = "Tomorrow Afternoon (by 4:00 PM) • Dispatched tomorrow 7:00 AM";
          }
        } else {
          // Morning: Can dispatch today
          if (zone === "A") {
            deliveryText = "Today Afternoon (by 2:00 PM) • Dispatched today 12:00 PM";
          } else if (zone === "B") {
            deliveryText = "Today Evening (by 7:00 PM) • Dispatched today 1:00 PM";
          } else {
            deliveryText = "Tomorrow Morning (by 11:00 AM) • Dispatched today evening";
          }
        }
        
        setDeliveryInfo(deliveryText);
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
          style={{ 
            padding: "0 20px", 
            background: pincode.length === 6 ? "#1A2E2C" : "#B8CFCC", 
            color: "#fff", 
            border: "none", 
            borderRadius: "8px", 
            fontSize: "13px", 
            fontWeight: "800", 
            cursor: pincode.length === 6 ? "pointer" : "not-allowed", 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            transition: "all 0.2s ease",
            boxShadow: pincode.length === 6 ? "0 4px 12px rgba(26, 46, 44, 0.15)" : "none"
          }}
        >
          {status === 'loading' ? '...' : 'Check'}
        </button>
      </div>
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: "12px", fontSize: "12px", color: "#059669", display: "flex", flexDirection: "column", gap: "4px", fontWeight: "600" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FiCheck /> Express delivery available!
            </div>
            <div style={{ fontSize: "11px", color: "#1F2937", background: "rgba(91,191,181,0.06)", border: "1px dashed rgba(91,191,181,0.3)", padding: "8px 12px", borderRadius: "8px", marginTop: "4px" }}>
              <strong style={{ color: "#5BBFB5" }}>Est. Delivery:</strong> {deliveryInfo}
            </div>
            <span style={{ fontSize: "9px", color: "#9CA3AF", alignSelf: "flex-end", marginTop: "2px", fontWeight: "500" }}>
              Checked at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
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
const RecentlyViewed = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: "48px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "24px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1A2E2C", marginBottom: "20px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Recently Viewed
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {items.map(item => (
          <EnhancedProductCard key={item._id} product={item} />
        ))}
      </div>
    </div>
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCartCount } = useContext(CartContext);
  const { user, refreshMe } = useContext(AuthContext);

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
  const [viewerCount, setViewerCount] = useState(1);
  // 🔪 Choose Your Cut + Weight
  const [selectedCut, setSelectedCut] = useState(null); // { name, priceAdjustmentPct, emoji }
  const [selectedWeightGrams, setSelectedWeightGrams] = useState(null); // For pricePerKg products
  const [lightboxImage, setLightboxImage] = useState(null);



  // 🛰️ Real-Time Pulse Tracking
  useEffect(() => {
    if (!product?._id) return;
    const prodId = product._id;
    
    socket.emit("join-product", prodId);
    socket.on("PRODUCT_VIEWER_COUNT", (data) => {
      if (data.productId === prodId) setViewerCount(data.count);
    });

    let guestId = localStorage.getItem("seabite_guest_id");
    if (!guestId) {
      guestId = uuidv4();
      localStorage.setItem("seabite_guest_id", guestId);
    }
    axios.post(`${API_URL}/api/pulse/track/${prodId}`, { guestId }).catch(() => {});

    return () => {
      socket.emit("leave-product", prodId);
      socket.off("PRODUCT_VIEWER_COUNT");
    };
  }, [product?._id]);

  const isWishlisted = user?.wishlist?.some(
    (item) => (typeof item === "string" ? item : item._id) === product?._id
  );

  const isActiveFlashSale =
    product?.flashSale?.isFlashSale &&
    product?.flashSale?.saleEndDate &&
    new Date(product.flashSale.saleEndDate) > new Date();

  const basePrice = product ? parseFloat(product.basePrice) : 0;
  let unitPrice = isActiveFlashSale ? product.flashSale.discountPrice : basePrice;
  const globalDiscount = product?.globalDiscount || 0;
  const isGlobalDiscount = !isActiveFlashSale && globalDiscount > 0;
  if (isGlobalDiscount) unitPrice = Math.round(basePrice * (1 - globalDiscount / 100));

  // ⚖️ Weight pricing
  const isWeightUnit = product?.unit && (product.unit.toLowerCase() === "kg" || product.unit.toLowerCase() === "g");
  const effectiveWeightGrams = selectedWeightGrams || (product?.minOrderWeight || 0);
  const weightPrice = product?.pricePerKg > 0 && isWeightUnit && effectiveWeightGrams > 0
    ? Math.round((product.pricePerKg / 1000) * effectiveWeightGrams)
    : unitPrice;
  // 🔪 Apply Cut Price Adjustment (applies to either weight price or standard unitPrice)
  const priceForWeight = selectedCut ? Math.round(weightPrice * (1 + (selectedCut.priceAdjustmentPct || 0) / 100)) : weightPrice;
  const totalPrice = (priceForWeight * qty).toFixed(2);

  const discountPct = isActiveFlashSale
    ? Math.round((1 - product.flashSale.discountPrice / basePrice) * 100)
    : isGlobalDiscount ? globalDiscount : 0;

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/400?text=No+Image";
    if (imagePath.startsWith("http")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    const pathWithUploads = cleanPath.startsWith("/uploads") ? cleanPath : `/uploads${cleanPath}`;
    const base = API_URL || (typeof window !== "undefined" ? window.location.origin : "https://seabite.co.in");
    return `${base}${pathWithUploads}`;
  };

  const productRef = useRef(null);
  useEffect(() => {
    productRef.current = product;
  }, [product]);

  const fetchProduct = useCallback(() => {
    const currentProduct = productRef.current;
    const isAlreadyLoaded = currentProduct && (currentProduct._id === id || slugify(currentProduct.name) === id);
    if (!isAlreadyLoaded) {
      setLoading(true);
    }
    axios
      .get(`${API_URL}/api/products/${id}`, { withCredentials: true })
      .then((res) => { 
        const p = res.data;
        setProduct(p); 
        setSelectedImage(p.image);
        setLoading(false); 
        
        // Save to Recently Viewed
        try {
          const isActiveFlashSale = p.flashSale?.isFlashSale && p.flashSale?.saleEndDate && new Date(p.flashSale.saleEndDate) > new Date();
          const basePrice = parseFloat(p.basePrice) || 0;
          let calculatedPrice = isActiveFlashSale ? p.flashSale.discountPrice : basePrice;
          const globalDiscount = p.globalDiscount || 0;
          if (!isActiveFlashSale && globalDiscount > 0) {
            calculatedPrice = Math.round(basePrice * (1 - globalDiscount / 100));
          }

          const recent = JSON.parse(localStorage.getItem("seabite_recent") || "[]");
          const filtered = recent.filter(item => item._id !== p._id);
          filtered.unshift({
            _id: p._id,
            name: p.name,
            image: p.image,
            basePrice: p.basePrice,
            price: calculatedPrice,
            flashSale: p.flashSale,
            globalDiscount: p.globalDiscount,
            countInStock: p.countInStock,
            unit: p.unit,
            category: p.category,
            trending: p.trending
          });
          const newRecent = filtered.slice(0, 4);
          localStorage.setItem("seabite_recent", JSON.stringify(newRecent));
          setRecentItems(newRecent.filter(item => item._id !== p._id));
        } catch {}
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { window.scrollTo(0, 0); fetchProduct(); }, [fetchProduct]);

  useEffect(() => {
    if (user && product?._id) {
      axios
        .get(`${API_URL}/api/products/${product._id}/can-review`, { withCredentials: true })
        .then((res) => setCanReview(res.data.canReview))
        .catch(() => setCanReview(false));
    }
  }, [user, product?._id]);

  useEffect(() => {
    if (user && product?.waitlist) {
      setIsJoinedWaitlist(
        product.waitlist.some((wId) => (typeof wId === "string" ? wId : wId._id) === user._id)
      );
    }
  }, [user, product]);

  useEffect(() => {
    if (product && product.name) {
      const slug = slugify(product.name);
      const pathParts = window.location.pathname.split("/");
      const currentSlug = pathParts[pathParts.length - 1];
      if (currentSlug !== slug || pathParts.length > 3) {
        window.history.replaceState(
          null,
          "",
          `/products/${slug}`
        );
      }
    }
  }, [product]);

  const handleShare = async () => {
    triggerHaptic("soft");
    if (!product) return;
    const slug = slugify(product.name);
    const shareUrl = `${window.location.origin}/products/${slug}`;
    const shareTitle = `${product.name} | SeaBite`;
    const shareText = `Check out this fresh catch on SeaBite: ${product.name}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Product link copied!", {
          icon: "🔗",
          style: {
            background: "#1A2E2C",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "13px",
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }
        });
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

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
        addToCart({
          ...product,
          quantity: qty,
          price: parseFloat(priceForWeight),
          originalPrice: parseFloat(basePrice),
          selectedCut: selectedCut?.name || "",
          cutPriceAdjustmentPct: selectedCut?.priceAdjustmentPct || 0,
          orderedWeightGrams: effectiveWeightGrams,
        });
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
    addToCart({ 
      ...product, 
      quantity: qty, 
      price: parseFloat(priceForWeight), 
      selectedCut: selectedCut?.name || "", 
      cutPriceAdjustmentPct: selectedCut?.priceAdjustmentPct || 0,
      orderedWeightGrams: effectiveWeightGrams 
    });
    refreshCartCount();
    navigate("/checkout");
  };

  const handleWishlistToggle = async () => {
    triggerHaptic("soft");
    if (!user) { 
      toast.error("Please login to save items"); 
      triggerHaptic("rigid");
      return window.dispatchEvent(new CustomEvent('open-auth-drawer'));
    }
    setLoadingWishlist(true);
    try {
      const res = await axios.post(`${API_URL}/api/user/wishlist/${product._id}`, {}, { withCredentials: true });
      toast.success(res.data.message, { icon: "❤️" });
      await refreshMe();
    } catch { toast.error("Failed to update wishlist"); }
    finally { setLoadingWishlist(false); }
  };

  const handleWaitlistJoin = async () => {
    if (!user) { 
      toast.error("Please login to join the waitlist"); 
      triggerHaptic("rigid");
      return window.dispatchEvent(new CustomEvent('open-auth-drawer'));
    }
    setIsWaitlisting(true);
    try {
      const res = await axios.post(`${API_URL}/api/products/${product._id}/waitlist`, {}, { withCredentials: true });
      toast.success(res.data.message, { icon: "📧" });
      setIsJoinedWaitlist(true);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to join waitlist"); }
    finally { setIsWaitlisting(false); }
  };



  if (loading) {
    return (
      <div className="detail-root" style={{ minHeight: "100vh", background: "#fff", paddingTop: "16px", paddingBottom: "100px", paddingLeft: "24px", paddingRight: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <style>{`
          .shimmer-block {
            background: linear-gradient(90deg, #f0f4f4 25%, #e2eeec 50%, #f0f4f4 75%);
            background-size: 200% 100%;
            animation: shimmer-anim 1.5s infinite;
            border-radius: 12px;
          }
          @keyframes shimmer-anim {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @media (max-width: 767px) {
            .product-grid { display: block !important; }
            .hero-image-container { width: 100% !important; aspect-ratio: 1/1 !important; margin-bottom: 24px; }
          }
        `}</style>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Breadcrumb Shimmer */}
          <div className="shimmer-block" style={{ width: "150px", height: "16px", marginBottom: "20px" }} />
          
          <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
            {/* Left Column: Image Shimmer */}
            <div className="hero-image-container" style={{ position: "sticky", top: "108px" }}>
              <div className="shimmer-block" style={{ width: "100%", aspectRatio: "1/1", borderRadius: "24px" }} />
              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="shimmer-block" style={{ width: "70px", height: "70px", borderRadius: "12px" }} />
                ))}
              </div>
            </div>

            {/* Right Column: Info Shimmer */}
            <div style={{ padding: "10px 0" }}>
              <div className="shimmer-block" style={{ width: "80px", height: "14px", marginBottom: "12px" }} />
              <div className="shimmer-block" style={{ width: "80%", height: "36px", marginBottom: "8px" }} />
              <div className="shimmer-block" style={{ width: "60%", height: "24px", marginBottom: "24px" }} />
              
              {/* Price Shimmer */}
              <div className="shimmer-block" style={{ width: "140px", height: "32px", marginBottom: "28px" }} />
              
              {/* Divider */}
              <div style={{ height: "1px", background: "#f0f4f4", margin: "24px 0" }} />
              
              {/* Selector Shimmers */}
              <div className="shimmer-block" style={{ width: "120px", height: "16px", marginBottom: "12px" }} />
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="shimmer-block" style={{ width: "100px", height: "40px", borderRadius: "100px" }} />
                ))}
              </div>

              {/* Qty & Add Button Shimmer */}
              <div style={{ display: "flex", gap: "16px", marginTop: "32px", alignItems: "center" }}>
                <div className="shimmer-block" style={{ width: "120px", height: "48px", borderRadius: "12px" }} />
                <div className="shimmer-block" style={{ flex: 1, height: "48px", borderRadius: "12px" }} />
              </div>

              {/* Description Shimmer */}
              <div style={{ marginTop: "40px" }}>
                <div className="shimmer-block" style={{ width: "100px", height: "18px", marginBottom: "16px" }} />
                <div className="shimmer-block" style={{ width: "100%", height: "14px", marginBottom: "8px" }} />
                <div className="shimmer-block" style={{ width: "95%", height: "14px", marginBottom: "8px" }} />
                <div className="shimmer-block" style={{ width: "70%", height: "14px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
          <meta name="description" content={`Buy fresh ${product.name} online from SeaBite. ${product.desc?.slice(0, 120) || product.description?.slice(0, 120) || "Sourced daily from the coast, delivered fresh to your door. Chemical-free and 100% traceable."}`} />
          <link rel="canonical" href={`https://seabite.co.in/products/${slugify(product.name)}`} />
          <meta property="og:title" content={`${product.name} | SeaBite`} />
          <meta property="og:description" content={product.desc?.slice(0, 160) || product.description?.slice(0, 160) || "Fresh coastal seafood from SeaBite."} />
          <meta property="og:image" content={getFullImageUrl(product.image)} />
          <meta property="og:type" content="product" />
          <meta property="og:url" content={`https://seabite.co.in/products/${slugify(product.name)}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${product.name} | SeaBite`} />
          <meta name="twitter:description" content={product.desc?.slice(0, 120) || product.description?.slice(0, 120) || "Fresh coastal seafood from SeaBite."} />
          <meta name="twitter:image" content={getFullImageUrl(product.image)} />
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.desc || product.description || `Fresh ${product.name} from SeaBite Mogalthur`,
            "image": [getFullImageUrl(product.image), ...((product.images || []).map(img => getFullImageUrl(img)))],
            "brand": { "@type": "Brand", "name": "SeaBite" },
            "sku": product._id,
            "mpn": product._id,
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": Number(unitPrice).toFixed(0),
              "priceValidUntil": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              "availability": product?.stock === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              "url": `https://seabite.co.in/products/${slugify(product.name)}`,
              "seller": { "@type": "Organization", "name": "SeaBite Seafoods" }
            },
            ...(product?.numReviews > 0 && {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product?.rating || 4.5,
                "reviewCount": product?.numReviews,
                "bestRating": "5",
                "worstRating": "1"
              }
            }),
            "review": (product.reviews || []).map(r => ({
              "@type": "Review",
              "author": { "@type": "Person", "name": r.name },
              "datePublished": r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : undefined,
              "reviewBody": r.comment,
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": r.rating,
                "bestRating": "5"
              }
            }))
          })}</script>
        </Helmet>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .detail-root { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff !important; }
        
        @media (max-width: 767px) {
          .detail-root { padding: 0 !important; }
          .product-grid { display: block !important; }
          .hero-image-container { 
            position: static !important;
            padding: 0 !important; 
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            aspect-ratio: 1/1 !important;
            background: #fff !important;
          }
          .info-container {
            padding: 20px 16px !important;
          }
          .breadcrumb-hide { display: none !important; }
          .mobile-sticky-actions {
            bottom: 0 !important;
            padding: 12px 16px !important;
          }
        }
        
        .qty-btn:hover { background: #E2EEEC !important; }
        .tab-btn { background: none; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: color 0.2s; }
        .wishlist-btn:hover { border-color: #F07468 !important; color: #F07468 !important; }
        .add-btn:hover:not(:disabled) { background: #2D4A47 !important; }
        .review-card:hover { border-color: #B8DDD9 !important; }
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
        style={{ minHeight: "100vh", background: "#fff", paddingTop: "16px", paddingBottom: "100px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div className="breadcrumb-hide" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Link to="/products" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6B8F8A", textDecoration: "none", fontSize: "12px", fontWeight: "600" }}>
              Market
            </Link>
            <FiChevronRight size={10} style={{ color: "#B8CFCC" }} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#5BBFB5" }}>{product?.name}</span>
          </motion.div>

          <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
            {/* Image Gallery Column */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hero-image-container"
              style={{ position: "sticky", top: "108px" }}
            >
              <div style={{ position: "relative", background: "#fff" }}>
                <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10, display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    onClick={handleWishlistToggle}
                    disabled={loadingWishlist}
                    style={{
                      width: "40px", height: "40px",
                      borderRadius: "50%", background: "rgba(255,255,255,0.9)",
                      border: "1px solid #eee", color: isWishlisted ? "#F07468" : "#ccc",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <FiHeart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.08, backgroundColor: "#fff", boxShadow: "0 6px 20px rgba(91,191,181,0.15)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    style={{
                      width: "40px", height: "40px",
                      borderRadius: "50%", background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid #eee", color: "#6B8F8A",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      cursor: "pointer",
                      transition: "color 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#5BBFB5"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#6B8F8A"}
                  >
                    <FiShare2 size={18} />
                  </motion.button>
                </div>
                
                <div style={{ width: "100%", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <ImageMagnifier src={getFullImageUrl(selectedImage || product.image)} alt={product.name} productId={product._id} />
                </div>

                {product.images?.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", padding: "16px", overflowX: "auto", scrollbarWidth: "none" }}>
                    {[product.image, ...product.images].map((img, idx) => (
                      <div key={idx} onClick={() => setSelectedImage(img)} style={{
                        width: "60px", height: "60px", flexShrink: 0, borderRadius: "8px", border: `2px solid ${selectedImage === img ? "#1A2E2C" : "#f0f0f0"}`,
                        padding: "4px", cursor: "pointer", overflow: "hidden"
                      }}>
                        <img src={getFullImageUrl(img)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info Column */}
            <div className="info-container">
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#6B8F8A", fontWeight: "600" }}>{product.category || "SeaBite Fresh"}</span>
              </div>
              
              {product?.salesLast24h > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#F0FBF9", padding: "6px 12px", borderRadius: "100px", alignSelf: "flex-start", marginBottom: "16px", border: "1.5px solid #E2EEEC", width: "fit-content" }}>
                  <div className="pulse-ping" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#5BBFB5" }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#1A2E2C", letterSpacing: "0.02em" }}>
                    {product.salesLast24h} {product.unit || 'kg'} sold in last 24 hrs
                  </span>
                </div>
              )}

              <style>{`
                @keyframes pulse-ping {
                  0% { transform: scale(1); opacity: 1; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
                .pulse-ping { position: relative; }
                .pulse-ping::after {
                  content: '';
                  position: absolute; inset: 0;
                  border-radius: 50%;
                  background: inherit;
                  animation: pulse-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
              `}</style>

              <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1A2E2C", lineHeight: 1.2, marginBottom: "8px" }}>
                {product.name}
              </h1>

              {product.rating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "1px" }}>
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} size={14} style={{ color: i < Math.round(product.rating) ? "#F59E0B" : "#eee" }} fill={i < Math.round(product.rating) ? "#F59E0B" : "none"} />
                    ))}
                  </div>
                  <span style={{ fontSize: "13px", color: "#007185", fontWeight: "500" }}>{product.numReviews} ratings</span>
                </div>
              )}

              <div style={{ height: "1px", background: "#f0f0f0", marginBottom: "16px" }} />

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "400", color: "#565959", marginTop: "4px" }}>₹</span>
                  <span style={{ fontSize: "32px", fontWeight: "500", color: "#1A2E2C" }}>{Number(unitPrice).toFixed(0)}</span>
                </div>
                {discountPct > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <span style={{ fontSize: "14px", color: "#CC0C39", fontWeight: "400" }}>-{discountPct}%</span>
                    <span style={{ fontSize: "14px", color: "#565959", textDecoration: "line-through" }}>M.R.P.: ₹{basePrice.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                {product.countInStock > 0 ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <p style={{ fontSize: "14px", color: product.countInStock <= 5 ? "#B12704" : "#007600", fontWeight: "700", margin: 0 }}>
                        {product.countInStock <= 5 ? `Only ${product.countInStock} ${product.unit || 'kg'} left in stock` : "In Stock"}
                      </p>
                      {product.countInStock <= 5 && (
                        <motion.div
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444" }}
                        />
                      )}
                    </div>
                    <p style={{ fontSize: "13px", color: "#565959", margin: 0 }}>
                      FREE delivery <span style={{ fontWeight: "700" }}>Tomorrow</span>. Order within <span style={{ color: "#B12704" }}>4 hrs 12 mins</span>.
                    </p>
                    {product.countInStock <= 5 && (
                      <p style={{ fontSize: "11px", color: "#B12704", fontWeight: "600", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FiAlertCircle size={12} /> Fresh batch selling out fast!
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: "14px", color: "#B12704", fontWeight: "700" }}>Currently Unavailable</p>
                )}
              </div>

              <FreshnessMeter productId={product._id} />
              <PincodeChecker />

              {/* 🔪 CHOOSE YOUR CUT */}
              {product.hasCuts && product.cuts?.filter(c => c.available).length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", marginBottom: "10px" }}>🔪 Choose Your Cut</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {product.cuts.filter(c => c.available).map(cut => (
                      <button
                        key={cut.name}
                        onClick={() => setSelectedCut(selectedCut?.name === cut.name ? null : cut)}
                        style={{
                          padding: "8px 14px", borderRadius: "100px", border: "2px solid",
                          borderColor: selectedCut?.name === cut.name ? "#1A2E2C" : "#E2EEEC",
                          background: selectedCut?.name === cut.name ? "#1A2E2C" : "#fff",
                          color: selectedCut?.name === cut.name ? "#fff" : "#4A6A67",
                          fontSize: "12px", fontWeight: "700", cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          transition: "all 0.2s",
                          display: "flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        {cut.emoji || "🐟"} {cut.name}
                        {cut.priceAdjustmentPct > 0 && (
                          <span style={{ fontSize: "10px", color: selectedCut?.name === cut.name ? "rgba(255,255,255,0.7)" : "#5BBFB5" }}>
                            +{cut.priceAdjustmentPct}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedCut && (
                    <p style={{ fontSize: "11px", color: "#5BBFB5", marginTop: "8px", fontWeight: "600" }}>
                      ✓ {selectedCut.name} selected{selectedCut.priceAdjustmentPct > 0 ? ` (+${selectedCut.priceAdjustmentPct}% processing fee)` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* ⚖️ WEIGHT SELECTOR */}
              {product.pricePerKg > 0 && isWeightUnit && product.minOrderWeight > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#1A2E2C", marginBottom: "10px" }}>
                    ⚖️ Select Weight
                    <span style={{ fontSize: "11px", color: "#5BBFB5", marginLeft: "8px", fontWeight: "600" }}>₹{product.pricePerKg}/kg</span>
                  </h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[250, 500, 750, 1000, 1500, 2000].filter(g => g >= product.minOrderWeight && g <= (product.maxOrderWeight || 5000)).map(grams => (
                      <button
                        key={grams}
                        onClick={() => setSelectedWeightGrams(grams)}
                        style={{
                          padding: "8px 14px", borderRadius: "100px", border: "2px solid",
                          borderColor: selectedWeightGrams === grams ? "#5BBFB5" : "#E2EEEC",
                          background: selectedWeightGrams === grams ? "rgba(91,191,181,0.08)" : "#fff",
                          color: selectedWeightGrams === grams ? "#5BBFB5" : "#4A6A67",
                          fontSize: "12px", fontWeight: "700", cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          transition: "all 0.2s",
                        }}
                      >
                        {grams >= 1000 ? `${grams/1000}kg` : `${grams}g`}
                        <span style={{ display: "block", fontSize: "10px", marginTop: "1px", color: selectedWeightGrams === grams ? "#5BBFB5" : "#6B8F8A" }}>
                          ₹{Math.round((product.pricePerKg / 1000) * grams)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* Weight Variance Guarantee */}
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#6B8F8A", fontWeight: "600", background: "#F4F9F8", padding: "8px 12px", borderRadius: "8px" }}>
                    <span>⚖️</span>
                    <span>Weight Variance Guarantee: if actual weight differs by more than {product.weightVariancePct || 5}%, we auto-refund the difference to your wallet.</span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdded || product.stock === "out"}
                  style={{
                    width: "100%", height: "48px", borderRadius: "100px", border: "none",
                    background: "#1A2E2C", color: "#FFFFFF", fontSize: "14px", fontWeight: "600",
                    cursor: "pointer", boxShadow: "0 4px 12px rgba(26,46,44,0.15)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {isAdded ? "✓ Added to Cart" : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === "out"}
                  style={{
                    width: "100%", height: "48px", borderRadius: "100px", border: "none",
                    background: "#5BBFB5", color: "#FFFFFF", fontSize: "14px", fontWeight: "600",
                    cursor: "pointer", boxShadow: "0 4px 12px rgba(91,191,181,0.15)",
                    transition: "all 0.2s ease"
                  }}
                >
                  Buy Now
                </button>
              </div>

              <div style={{ height: "1px", background: "#f0f0f0", marginBottom: "20px" }} />

              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>About this item</h3>
                <p style={{ fontSize: "14px", color: "#1A2E2C", lineHeight: 1.5 }}>
                  {product.desc || "Premium fresh seafood sourced daily. Hand-picked for quality and freshness."}
                </p>
              </div>

              {/* Related / Bundle */}
              {product.relatedProducts?.length > 0 && (
                <div style={{ marginTop: "40px" }}>
                   <BundleSection mainProduct={product} relatedProducts={product.relatedProducts} getFullImageUrl={getFullImageUrl} refreshCartCount={refreshCartCount} viewerCount={viewerCount} />
                </div>
              )}
            </div>
          </div>

          {/* 🟢 TABS SECTION */}
          <div style={{ marginTop: "48px", borderTop: "1px solid #E2EEEC", paddingTop: "32px", marginBottom: "40px" }}>
            <div style={{ display: "flex", gap: "24px", borderBottom: "2px solid #E2EEEC", marginBottom: "24px" }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    paddingBottom: "12px",
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === tab.id ? "3px solid #5BBFB5" : "3px solid transparent",
                    color: activeTab === tab.id ? "#1A2E2C" : "#6B8F8A",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ minHeight: "150px" }}>
              {activeTab === "desc" && (
                <div style={{ color: "#4A6A67", fontSize: "14px", lineHeight: 1.6 }}>
                  <p>{product.desc || "Premium fresh seafood sourced daily. Hand-picked for quality and freshness."}</p>
                  <p style={{ marginTop: "12px" }}><strong>Category:</strong> {product.category}</p>
                  <p><strong>Dock Source:</strong> {product.dockSource || "Mogalthur Docks"}</p>
                  {product.catchOfTheDay && <p style={{ color: "#5BBFB5", fontWeight: "700", marginTop: "8px" }}>🌟 Catch of the Day</p>}
                </div>
              )}

              {activeTab === "shipping" && (
                <div style={{ color: "#4A6A67", fontSize: "14px", lineHeight: 1.6 }}>
                  <p>🌊 Freshness is our guarantee. All orders are packed in temperature-controlled ice boxes to ensure zero spoilage during transit.</p>
                  <ul style={{ marginTop: "12px", listStyleType: "disc", paddingLeft: "20px" }}>
                    <li>Orders placed before 8 PM will be delivered tomorrow morning.</li>
                    <li>Delivery hours: 6 AM to 11 AM.</li>
                    <li>Free shipping on orders above ₹1,000.</li>
                  </ul>
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>Customer Reviews</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <div style={{ display: "flex" }}>
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} size={16} style={{ color: i < Math.round(product.rating || 0) ? "#F59E0B" : "#eee" }} fill={i < Math.round(product.rating || 0) ? "#F59E0B" : "none"} />
                          ))}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#1A2E2C" }}>
                          {product.rating ? `${product.rating.toFixed(1)} out of 5` : "No ratings yet"}
                        </span>
                        <span style={{ fontSize: "14px", color: "#6B8F8A" }}>({product.numReviews || 0} reviews)</span>
                      </div>
                    </div>
                    {canReview && (
                      <button
                        onClick={() => setIsReviewOpen(true)}
                        style={{
                          padding: "10px 20px",
                          background: "#5BBFB5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "100px",
                          fontWeight: "700",
                          fontSize: "13px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 4px 12px rgba(91,191,181,0.2)",
                        }}
                      >
                        Write a Review
                      </button>
                    )}
                  </div>

                  {(!product.reviews || product.reviews.length === 0) ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", border: "1px dashed #E2EEEC", borderRadius: "16px" }}>
                      <p style={{ color: "#6B8F8A", fontSize: "14px", margin: 0 }}>No reviews for this product yet. Be the first to share your thoughts!</p>
                      {canReview && (
                        <button
                          onClick={() => setIsReviewOpen(true)}
                          style={{
                            marginTop: "12px",
                            padding: "8px 16px",
                            background: "none",
                            border: "1.5px solid #5BBFB5",
                            color: "#5BBFB5",
                            borderRadius: "100px",
                            fontWeight: "700",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Write a Review
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {product.reviews.map((rev) => (
                        <div
                          key={rev._id}
                          className="review-card"
                          style={{
                            padding: "16px",
                            border: "1px solid #E2EEEC",
                            borderRadius: "16px",
                            background: "#fff",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                            <div>
                              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1A2E2C", margin: 0 }}>{rev.name}</h4>
                              <div style={{ display: "flex", gap: "1px", marginTop: "2px" }}>
                                {[...Array(5)].map((_, i) => (
                                  <FiStar key={i} size={12} style={{ color: i < rev.rating ? "#F59E0B" : "#eee" }} fill={i < rev.rating ? "#F59E0B" : "none"} />
                                ))}
                              </div>
                            </div>
                            <span style={{ fontSize: "11px", color: "#6B8F8A" }}>
                              {new Date(rev.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p style={{ fontSize: "13px", color: "#4A6A67", margin: "8px 0 0 0", lineHeight: 1.5 }}>{rev.comment}</p>
                          
                          {/* Review Images */}
                          {rev.images && rev.images.length > 0 && (
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                              {rev.images.map((imgUrl, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  onClick={() => setLightboxImage(imgUrl)}
                                  style={{
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    border: "1px solid #E2EEEC",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <img src={imgUrl} alt={`Review by ${rev.name}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {recentItems.length > 0 && (
            <RecentlyViewed items={recentItems} />
          )}

          {/* 🟢 Recommendation Engine Integration */}
          <RecommendationBlock 
            currentProductId={product._id} 
            category={product.category} 
            title="Customers also bought" 
          />
        </div>
      </div>



      {/* Lightbox for review images */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 1000000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "zoom-out",
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <FiX size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Review Image Enlarged"
              style={{
                maxWidth: "90%",
                maxHeight: "85%",
                borderRadius: "12px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={product}
        API_URL={API_URL}
        onSuccess={fetchProduct}
      />


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
      `}</style>
    </>
  );
}