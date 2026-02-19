import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartSidebar from "./components/layout/CartSidebar";
import PageTransition from "./components/common/PageTransition";
import ScrollToTop from "./components/layout/ScrollToTop";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import SupportWidget from "./components/common/SupportWidget";
import BannerPopup from "./components/layout/BannerPopup";
import AnnouncementBar from "./components/layout/AnnouncementBar";
import PageSkeleton from "./components/common/PageSkeleton"; // 🟢 Added Skeleton

// Lazy Imports for Critical Pages
const Home = lazy(() => import("./pages/shop/Home"));
const Products = lazy(() => import("./pages/shop/Products"));
const ProductDetails = lazy(() => import("./pages/shop/ProductDetails"));
const Wishlist = lazy(() => import("./pages/shop/Wishlist"));
const Cart = lazy(() => import("./pages/shop/Cart"));
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

// Context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// ✅ Axios global config
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";

// Loader for secondary pages
const SeaBiteLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [maintenance, setMaintenance] = useState({ active: false, message: "" });
  const [announcement, setAnnouncement] = useState(null); // 🟢 Added

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
      } catch (error) {
        // console.error("Failed to check maintenance mode:", error);
      }
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            color: '#0f172a',
            borderRadius: '16px',
            padding: '16px 24px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          }
        }}
      />

      {/* 🟢 Global Announcement */}
      <AnnouncementBar settings={announcement} />

      {/* 🟢 Global Popup Banner */}
      <BannerPopup bannerSettings={maintenance.banner} />

      {maintenance.active && !isAdminRoute && location.pathname !== "/login" ? (
        <Maintenance message={maintenance.message} />
      ) : (
        <>
          {!isAdminRoute && <Navbar openCart={openCart} />}
          {!isAdminRoute && (
            <CartSidebar
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
            />
          )}

          <div className="flex-grow">
            <Suspense fallback={<PageSkeleton />}>
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
                  </Route>
                </Routes>
              ) : (
                <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                    <Route path="/products" element={<PageTransition><Products openCart={openCart} /></PageTransition>} />
                    <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
                    <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                    <Route path="/wishlist" element={<PageTransition><PrivateRoute><Wishlist /></PrivateRoute></PageTransition>} />
                    <Route path="/profile" element={<PageTransition><PrivateRoute><Profile /></PrivateRoute></PageTransition>} />
                    <Route path="/spin" element={<PageTransition><Spin /></PageTransition>} />
                    <Route path="/notifications" element={<PageTransition><PrivateRoute><Notifications /></PrivateRoute></PageTransition>} />
                    <Route path="/checkout" element={<PageTransition><PrivateRoute><Checkout /></PrivateRoute></PageTransition>} />
                    <Route path="/success" element={<PageTransition><PrivateRoute><OrderSuccess /></PrivateRoute></PageTransition>} />
                    <Route path="/orders" element={<PageTransition><PrivateRoute><Orders /></PrivateRoute></PageTransition>} />
                    <Route path="/orders/:orderId" element={<PageTransition><PrivateRoute><OrderDetails /></PrivateRoute></PageTransition>} />
                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/about" element={<PageTransition><About /></PageTransition>} />
                    <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
                    <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                    <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                    <Route path="/cancellation" element={<PageTransition><Cancellation /></PageTransition>} />
                    <Route path="/maintenance" element={<Maintenance />} />
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
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}