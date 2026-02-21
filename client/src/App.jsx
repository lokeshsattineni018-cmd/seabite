import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
import SupportWidget from "./components/common/SupportWidget";
import BannerPopup from "./components/layout/BannerPopup";
import AnnouncementBar from "./components/layout/AnnouncementBar";
import SeaBiteLoader from "./components/common/SeaBiteLoader"; // 🟢 Added Custom Loader
import CookieConsent from "./components/common/CookieConsent"; // 🟢 Cookie Consent

// Lazy Imports for Critical Pages
const Home = lazy(() => import("./pages/shop/Home"));
const Products = lazy(() => import("./pages/shop/Products"));
const ProductDetails = lazy(() => import("./pages/shop/ProductDetails"));
const Wishlist = lazy(() => import("./pages/shop/Wishlist"));
const Profile = lazy(() => import("./pages/user/Profile"));
const Checkout = lazy(() => import("./pages/shop/Checkout"));
const Login = lazy(() => import("./pages/auth/Login"));
const OrderSuccess = lazy(() => import("./pages/shop/OrderSuccess"));
const Orders = lazy(() => import("./pages/user/Orders"));
const OrderDetails = lazy(() => import("./pages/user/OrderDetails"));
const Notifications = lazy(() => import("./pages/user/Notifications"));
const Spin = lazy(() => import("./pages/general/Spin"));
const About = lazy(() => import("./pages/general/About"));
const FAQ = lazy(() => import("./pages/legal/FAQ"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Cancellation = lazy(() => import("./pages/legal/Cancellation"));
const Maintenance = lazy(() => import("./pages/general/Maintenance"));
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
const AdminReviews = lazy(() => import("./admin/AdminReviews"));
const AdminCoupons = lazy(() => import("./admin/AdminCoupons"));
const AdminPOS = lazy(() => import("./admin/AdminPOS"));
const AdminFlashSale = lazy(() => import("./admin/AdminFlashSale"));
const AdminMarketing = lazy(() => import("./admin/AdminMarketing"));
const AdminWatchtower = lazy(() => import("./admin/AdminWatchtower"));
const AdminAbandonedCarts = lazy(() => import("./admin/AdminAbandonedCarts"));
const AdminSettings = lazy(() => import("./admin/AdminSettings"));
const AdminAnalytics = lazy(() => import("./admin/AdminAnalytics"));
const AdminIAM = lazy(() => import("./admin/AdminIAM"));
const AdminRegistry = lazy(() => import("./admin/AdminRegistry"));
const AdminSearchDiscovery = lazy(() => import("./admin/AdminSearchDiscovery"));

// Context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

// ✅ Axios global config
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";



function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [maintenance, setMaintenance] = useState({ active: false, message: "" });
  const [announcement, setAnnouncement] = useState(null); // 🟢 Added
  const [spinWheelEnabled, setSpinWheelEnabled] = useState(false);
  const [isSpinOpen, setIsSpinOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);

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
        const { data } = await axios.get(`${axios.defaults.baseURL}/api/admin/enterprise/settings`);
        setMaintenance({
          active: data.isMaintenanceMode,
          message: data.maintenanceMessage,
          banner: data.banner
        });
        setAnnouncement(data.announcement); // 🟢 Capture Announcement
        setSpinWheelEnabled(data.spinWheelEnabled); // 🟢 Capture Spin State
      } catch (error) {
        // console.error("Failed to check maintenance mode:", error);
      }
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // 🎡 Spin Wheel Trigger Logic
  useEffect(() => {
    const hasSpunThisSession = sessionStorage.getItem("seabite_spun_this_session");
    const user = JSON.parse(localStorage.getItem("userInfo") || "null");

    if (spinWheelEnabled && user && !hasSpunThisSession) {
      // Check if user actually can spin from backend
      axios.get("/api/spin/can-spin")
        .then(res => {
          if (res.data.canSpin) {
            setIsSpinOpen(true);
            sessionStorage.setItem("seabite_spun_this_session", "true");
          }
        })
        .catch(() => { });
    }
  }, [spinWheelEnabled]);

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
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1A2B35',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
          success: {
            icon: '✅',
            iconTheme: {
              primary: '#fff',
              secondary: '#1A2B35',
            },
          },
          error: {
            icon: '❌',
            iconTheme: {
              primary: '#fff',
              secondary: '#1A2B35',
            },
          }
        }}
      />

      {/* 🟢 Global Announcement */}
      <AnnouncementBar settings={announcement} />

      {/* 🟢 Global Popup Banner */}
      <BannerPopup bannerSettings={maintenance.banner} />

      {/* 🟢 Cookie Consent */}
      <CookieConsent />

      {maintenance.active && !isAdminRoute && location.pathname !== "/login" ? (
        <Maintenance message={maintenance.message} />
      ) : (
        <>
          {!isAdminRoute && <Navbar openCart={openCart} announcementActive={!!announcement?.active} />}
          {!isAdminRoute && (
            <>
              <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
              />
              <Spin isOpen={isSpinOpen} onClose={() => setIsSpinOpen(false)} />
            </>
          )}

          <div className="flex-grow">
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
                    <Route path="iam" element={<AdminIAM />} />
                    <Route path="registry" element={<AdminRegistry />} />
                    <Route path="discovery" element={<AdminSearchDiscovery />} />
                  </Route>
                </Routes>
              ) : (
                <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products openCart={openCart} />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                    <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
                    <Route path="/success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
                    <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
                    <Route path="/orders/:orderId" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/cancellation" element={<Cancellation />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatePresence>
              )}
            </Suspense>
          </div>

          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <SupportWidget />}
        </>
      )
      }
    </div >
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <MainLayout />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}