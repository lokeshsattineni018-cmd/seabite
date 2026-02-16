import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import PageTransition from "./components/PageTransition";
import ScrollToTop from "./components/ScrollToTop";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import SupportWidget from "./components/SupportWidget";

// Direct Imports for Critical Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Notifications from "./pages/Notifications";
import Spin from "./pages/Spin";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cancellation from "./pages/Cancellation";
import Maintenance from "./pages/Maintenance";

// Admin Imports
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AddProduct from "./admin/AddProduct";
import EditProduct from "./admin/EditProduct";
import AdminOrders from "./admin/AdminOrders";
import AdminUsers from "./admin/AdminUsers";
import AdminLogin from "./admin/AdminLogin";
import AdminMessages from "./admin/AdminMessages";
import AdminCoupons from "./admin/AdminCoupons";
import AdminKanban from "./admin/AdminKanban";
import AdminFlashSale from "./admin/AdminFlashSale";
import AdminMarketing from "./admin/AdminMarketing";

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

  // Warm up backend silently
  useEffect(() => {
    const warmUpBackend = async () => {
      try {
        await axios.get("/api/products?limit=1");
      } catch (err) {
        // Silent fail - non-critical
      }
    };
    warmUpBackend();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa] dark:bg-[#0a1625] transition-colors duration-500 ease-in-out relative">
      <ScrollToTop />

      {/* ✅ Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Toaster
        position="top-right"
      // ... (existing toaster config omitted for brevity)
      />

      {maintenance.active && !isAdminRoute ? (
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
            {isAdminRoute ? (
              <Routes>
                <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="add-product" element={<AddProduct />} />
                  <Route path="edit-product/:id" element={<EditProduct />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="flash-sale" element={<AdminFlashSale />} />
                  <Route path="marketing" element={<AdminMarketing />} />
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
          </div>

          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <SupportWidget />}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </CartProvider>
    </ThemeProvider>
  );
}