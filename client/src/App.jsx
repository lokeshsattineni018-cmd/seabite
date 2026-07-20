import { useState, useEffect, Suspense } from "react";
import { lazyWithRetry as lazy } from "./utils/lazyWithRetry"; // 🛠️ Stability: Auto-retry on deployment chunks
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartSidebar from "./components/layout/CartSidebar";
import ScrollToTop from "./components/layout/ScrollToTop";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import DriverRoute from "./components/DriverRoute";
import SupportWidget from "./components/common/SupportWidget";
import BannerPopup from "./components/layout/BannerPopup";
import AnnouncementBar from "./components/layout/AnnouncementBar";
import SeaBiteLoader from "./components/common/SeaBiteLoader"; // 🟢 Added Custom Loader
import CookieConsent from "./components/common/CookieConsent"; // 🟢 Cookie Consent
import PageTransition from "./components/common/PageTransition";

import ComparisonDrawer from "./components/common/ComparisonDrawer"; // 📊 Product Comparison Drawer
import GoogleOneTap from "./components/common/GoogleOneTap"; // 🟢 Google One Tap Login
import LiveSocialProof from "./components/common/LiveSocialProof"; // 🛰️ Live Sales Notification

// Lazy Imports for Critical Pages
const Home = lazy(() => import("./pages/shop/Home"), "Home");
const Products = lazy(() => import("./pages/shop/Products"), "Products");
const ProductDetails = lazy(() => import("./pages/shop/ProductDetails"), "ProductDetails");
const Wishlist = lazy(() => import("./pages/shop/Wishlist"), "Wishlist");
const Profile = lazy(() => import("./pages/user/Profile"), "Profile");
const Checkout = lazy(() => import("./pages/shop/Checkout"), "Checkout");
const Login = lazy(() => import("./pages/auth/Login"), "Login");
const OrderSuccess = lazy(() => import("./pages/shop/OrderSuccess"));
const Orders = lazy(() => import("./pages/user/Orders"));
const OrderDetails = lazy(() => import("./pages/user/OrderDetails"));
const Notifications = lazy(() => import("./pages/user/Notifications"));
const Spin = lazy(() => import("./pages/general/Spin"));
const About = lazy(() => import("./pages/general/About"));
const Blog = lazy(() => import("./pages/general/Blog"));
const BlogDetail = lazy(() => import("./pages/general/BlogDetail"));
const FAQ = lazy(() => import("./pages/legal/FAQ"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Cancellation = lazy(() => import("./pages/legal/Cancellation"));
const Maintenance = lazy(() => import("./pages/general/Maintenance"));
const Contact = lazy(() => import("./pages/general/Contact"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ReferEarn = lazy(() => import("./pages/user/ReferEarn"));
const LoyaltyCenter = lazy(() => import("./pages/user/LoyaltyCenter")); // 🏆 Rewards & Loyalty Program
const DeliveryTracker = lazy(() => import("./pages/user/DeliveryTracker")); // 🚚 Real-time Delivery Tracker

const NotFound = lazy(() => import("./pages/general/NotFound"));

// Admin Lazy Imports
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./admin/AdminProducts"));
const AddProduct = lazy(() => import("./admin/AddProduct"));
const EditProduct = lazy(() => import("./admin/EditProduct"));
const AdminOrders = lazy(() => import("./admin/AdminOrders"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));
const AdminMessages = lazy(() => import("./admin/AdminMessages"));
const AdminDelivery = lazy(() => import("./admin/AdminDelivery"));
const AdminReviews = lazy(() => import("./admin/AdminReviews"));
const AdminPOS = lazy(() => import("./admin/AdminPOS"));
const AdminFlashSale = lazy(() => import("./admin/AdminFlashSale"));
const AdminMarketing = lazy(() => import("./admin/AdminMarketing"));
const AdminWatchtower = lazy(() => import("./admin/AdminWatchtower"));
const AdminAbandonedCarts = lazy(() => import("./admin/AdminAbandonedCarts"));
const AdminSettings = lazy(() => import("./admin/AdminSettings"));
const AdminAnalytics = lazy(() => import("./admin/AdminAnalytics"));
const AdminSearchDiscovery = lazy(() => import("./admin/AdminSearchDiscovery"));
const AdminComplaints = lazy(() => import("./admin/AdminComplaints")); // 🟢 Added
const AdminCoupons = lazy(() => import("./admin/AdminCoupons")); // 🏷️ Added
const AdminLiveRadar = lazy(() => import("./admin/AdminLiveRadar")); // 📡 Added Live Radar
const AdminXRay = lazy(() => import("./admin/AdminXRay")); // 🔍 Added X-Ray Monitor
const AdminPricingEngine = lazy(() => import("./admin/AdminPricingEngine")); // 🌦️ Added AI Pricing Engine
const AdminInventoryAlerts = lazy(() => import("./admin/AdminInventoryAlerts")); // 📦 BI: Inventory Alerts
const AdminCommandCenter = lazy(() => import("./admin/AdminCommandCenter")); // 📡 Command Center
const AdminReturns = lazy(() => import("./admin/AdminReturns")); // 🔄 Returns Queue
const AdminNotificationOrchestrator = lazy(() => import("./admin/AdminNotificationOrchestrator")); // 📣 Notifications Orchestrator
const AdminABTesting = lazy(() => import("./admin/AdminABTesting")); // 🔬 A/B Testing
const AdminFleetConsole = lazy(() => import("./admin/AdminFleetConsole")); // 🛵 Fleet Console

const DeliveryDashboard = lazy(() => import("./delivery/DeliveryDashboard"));



import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CompareProvider } from "./context/CompareContext";
import { useSocket } from "./context/SocketContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useTelemetry } from "./hooks/useTelemetry"; // 🟢 Telemetry Tracker
import { PromoModal } from "./components/common/PromoModal"; // 🎁 Promo Modal Push

// Central API Config
axios.defaults.withCredentials = true;
const API_URL = import.meta.env.VITE_API_URL || "";
axios.defaults.baseURL = API_URL;

// 🟢 Automatically prefix outgoing API calls with versioned endpoint
axios.interceptors.request.use((config) => {
  if (config.url && config.url.includes("/api/")) {
    config.url = config.url.replace("/api/", "/api/v1/");
  }
  return config;
});

// 🟢 Automatically capture and sync CSRF tokens from backend responses
axios.interceptors.response.use(
  (response) => {
    if (response.data && response.data.csrfToken) {
      axios.defaults.headers.common["X-CSRF-Token"] = response.data.csrfToken;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);



function MainLayout() {
  const { promoOffer, clearPromoOffer } = useTelemetry(); // 🟢 Trigger Telemetry & Promo push listener
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isDashboardRoute = isAdminRoute || location.pathname.startsWith("/driver") || location.pathname.startsWith("/support");

  const knownPrefixes = ["/products/", "/orders/", "/track/", "/blog/", "/admin", "/driver"];
  const knownExactPaths = [
    "/", "/products", "/wishlist", "/profile", "/refer-earn", "/loyalty",
    "/notifications", "/checkout", "/success", "/orders", "/login", "/signup",
    "/about", "/blog", "/contact", "/faq", "/terms", "/privacy", "/cancellation", "/maintenance"
  ];
  const isKnownRoute = knownExactPaths.includes(location.pathname) || knownPrefixes.some(prefix => location.pathname.startsWith(prefix));
  const isNotFoundRoute = !isKnownRoute;
  const [maintenance, setMaintenance] = useState({ active: false, message: "" });
  const [announcement, setAnnouncement] = useState(() => {
    try {
      const cached = localStorage.getItem("seabite_announcement");
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  });
  const [spinWheelEnabled, setSpinWheelEnabled] = useState(false);
  const [isSpinOpen, setIsSpinOpen] = useState(false);



  // ✅ Axios Interceptor for Maintenance Mode
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 503 && error.response.data.maintenance) {
          setMaintenance({ active: true, message: error.response.data.message });
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // 🟢 Fetch Global Settings (Maintenance, Happy Hour, Banner)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/settings`);
        setMaintenance({
          active: data.isMaintenanceMode,
          message: data.maintenanceMessage,
          banner: data.banner
        });
        
        if (data.announcement) {
          setAnnouncement(data.announcement);
          localStorage.setItem("seabite_announcement", JSON.stringify(data.announcement));
        }
        
        setSpinWheelEnabled(data.spinWheelEnabled);
      } catch (error) {
        // Silent fail for settings fetch
      }
    };
    fetchSettings();
    
    // Listen to socket for settings updates
    if (socket) {
      socket.on("SETTINGS_UPDATE", (data) => {
        if (data) {
          setMaintenance({
            active: data.isMaintenanceMode,
            message: data.maintenanceMessage,
            banner: data.banner
          });
          if (data.announcement) {
            setAnnouncement(data.announcement);
            localStorage.setItem("seabite_announcement", JSON.stringify(data.announcement));
          }
          setSpinWheelEnabled(data.spinWheelEnabled);
        }
      });
    }

    const interval = setInterval(fetchSettings, 300000); // Check every 5 minutes as fallback
    return () => {
      clearInterval(interval);
      if (socket) socket.off("SETTINGS_UPDATE");
    };
  }, [socket]);

  // 🎡 Spin Wheel Trigger Logic
  useEffect(() => {
    const hasSpunThisSession = sessionStorage.getItem("seabite_spun_this_session");
    const hasExistingCoupon = localStorage.getItem("seabiteSpinDiscount");

    // Don't show if already spun this session or has an active coupon
    if (!spinWheelEnabled || hasSpunThisSession || hasExistingCoupon) return;

    const triggerWheel = () => {
      setTimeout(() => { setIsSpinOpen(true); }, 5000);
    };

    if (user) {
      // For logged-in users, strictly check backend eligibility
      axios.get(`${API_URL}/api/spin/can-spin`, { withCredentials: true })
        .then(({ data }) => {
          if (data.canSpin) triggerWheel();
        })
        .catch(() => { });
    } else {
      // For guests, show the wheel to tease rewards
      triggerWheel();
    }
  }, [spinWheelEnabled, user]);

  const adminLayoutElement = (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa] dark:bg-[#0a1625] transition-colors duration-500 ease-in-out relative">
      <ScrollToTop />
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A2B35',
            color: '#fff',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
        }}
      />

      {/* 🟢 Global Announcement (Rolling Ticker) */}
      {!isDashboardRoute && !isNotFoundRoute && <AnnouncementBar settings={announcement} />}

      {/* 🟢 Global Popup Banner */}
      {!isNotFoundRoute && <BannerPopup bannerSettings={maintenance.banner} />}

      {/* 🟢 Cookie Consent */}
      {!isNotFoundRoute && <CookieConsent />}

      {/* 🔐 Google One Tap Login */}
      {/* <GoogleOneTap /> Disabled to prevent unwanted auto-logins into Gmail accounts */}

      {/* 📱 Mobile Navigation Removed */}

      {maintenance.active && !isDashboardRoute && location.pathname !== "/login" ? (
        <Maintenance message={maintenance.message} />
      ) : (
        <>
          {!isDashboardRoute && !isNotFoundRoute && <Navbar announcementActive={!!announcement?.active} />}
          {!isDashboardRoute && !isNotFoundRoute && (
            <>
              <CartSidebar />
              <Suspense fallback={null}>
                <Spin isOpen={isSpinOpen} onClose={() => setIsSpinOpen(false)} />
              </Suspense>
            </>
          )}

          <div className={`flex-grow ${
            (!isDashboardRoute && !isNotFoundRoute && location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/signup")
              ? (announcement?.active ? "page-content-container announcement-active" : "page-content-container")
              : ""
          }`}>
            <Suspense fallback={<SeaBiteLoader fullScreen />}>
              {isAdminRoute ? (
                <Routes>
                  <Route path="/admin" element={adminLayoutElement}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="add-product" element={<AddProduct />} />
                    <Route path="edit-product/:id" element={<EditProduct />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="pos" element={<AdminPOS />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="flash-sale" element={<AdminFlashSale />} />
                    <Route path="marketing" element={<AdminMarketing />} />
                    <Route path="watchtower" element={<AdminWatchtower />} />
                    <Route path="carts" element={<AdminAbandonedCarts />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="delivery" element={<AdminDelivery />} />
                    <Route path="discovery" element={<AdminSearchDiscovery />} />
                    <Route path="complaints" element={<AdminComplaints />} />
                    <Route path="fleet" element={<AdminDelivery />} />
                    <Route path="radar" element={<AdminLiveRadar />} />
                    <Route path="xray" element={<AdminXRay />} />
                    <Route path="pricing-engine" element={<AdminPricingEngine />} />
                    <Route path="inventory-alerts" element={<AdminInventoryAlerts />} />
                    <Route path="command-center" element={<AdminCommandCenter />} />
                    <Route path="returns" element={<AdminReturns />} />
                    <Route path="campaigns" element={<AdminNotificationOrchestrator />} />
                    <Route path="ab-tests" element={<AdminABTesting />} />
                    <Route path="fleet-console" element={<AdminFleetConsole />} />
                  </Route>
                </Routes>
              ) : (
                <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                    <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
                    <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
                    <Route path="/products/:id/:slug" element={<PageTransition><ProductDetails /></PageTransition>} />
                    <Route path="/wishlist" element={<PrivateRoute><PageTransition><Wishlist /></PageTransition></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><PageTransition><Profile /></PageTransition></PrivateRoute>} />
                    <Route path="/refer-earn" element={<PrivateRoute><PageTransition><ReferEarn /></PageTransition></PrivateRoute>} />
                    <Route path="/loyalty" element={<PrivateRoute><PageTransition><LoyaltyCenter /></PageTransition></PrivateRoute>} />
                    <Route path="/track/:orderId" element={<PrivateRoute><PageTransition><DeliveryTracker /></PageTransition></PrivateRoute>} />

                    <Route path="/notifications" element={<PrivateRoute><PageTransition><Notifications /></PageTransition></PrivateRoute>} />
                    <Route path="/checkout" element={<PrivateRoute><PageTransition><Checkout /></PageTransition></PrivateRoute>} />
                    <Route path="/success" element={<PrivateRoute><PageTransition><OrderSuccess /></PageTransition></PrivateRoute>} />
                    <Route path="/orders" element={<PrivateRoute><PageTransition><Orders /></PageTransition></PrivateRoute>} />
                    <Route path="/orders/:orderId" element={<PrivateRoute><PageTransition><OrderDetails /></PageTransition></PrivateRoute>} />
                    
                    {/* Dashboards */}
                    <Route path="/driver" element={<DriverRoute><PageTransition><DeliveryDashboard /></PageTransition></DriverRoute>} />

                    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Navigate to="/?auth=login" replace />} />
                    <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Navigate to="/?auth=signup" replace />} />
                    <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                    <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
                    <Route path="/blog/:slug" element={<PageTransition><BlogDetail /></PageTransition>} />
                    <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                    <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
                    <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                    <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                    <Route path="/cancellation" element={<PageTransition><Cancellation /></PageTransition>} />
                    <Route path="/maintenance" element={<PageTransition><Maintenance /></PageTransition>} />
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                  </Routes>
                </AnimatePresence>
              )}
              {!isDashboardRoute && !isNotFoundRoute && location.pathname !== "/success" && <Footer />}
            </Suspense>
          </div>
          {!isDashboardRoute && !isNotFoundRoute && <SupportWidget />}
          {!isDashboardRoute && !isNotFoundRoute && <ComparisonDrawer />}
          {!isDashboardRoute && !isNotFoundRoute && <LiveSocialProof />}
          {promoOffer && !isNotFoundRoute && (
            <PromoModal offer={promoOffer} onClose={clearPromoOffer} />
          )}
        </>
      )
      }
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <CompareProvider>
                <MainLayout />
              </CompareProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}