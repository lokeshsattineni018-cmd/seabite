import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import axios from "axios";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import PageTransition from "./components/PageTransition";
import ScrollToTop from "./components/ScrollToTop";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import SupportWidget from "./components/SupportWidget";

// 🚀 PERFORMANCE FIX 1: Direct Imports for Critical Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";

// 💤 Lazy Load Secondary Pages
import Checkout from "./pages/Checkout";
const Login = lazy(() => import("./pages/Login"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Spin = lazy(() => import("./pages/Spin"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cancellation = lazy(() => import("./pages/Cancellation"));

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

// Context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// ✅ Axios global config
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "";

// 🔍 TEMP: Log every axios request
axios.interceptors.request.use((config) => {
  console.log("AXIOS REQUEST →", config.method?.toUpperCase(), config.url);
  return config;
});

// Loader for secondary pages only
const SeaBiteLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-blue-500 font-medium animate-pulse">Fresh Catch Loading...</p>
  </div>
);

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);

  // 🚀 PERFORMANCE FIX 2: Warm up the backend immediately
  useEffect(() => {
    const warmUpBackend = async () => {
      try {
        await axios.get("/api/products?limit=1");
        console.log("✅ Server Warmed Up");
      } catch (err) {
        console.log("⚠️ Server warmup failed (non-critical):", err.message);
      }
    };
    warmUpBackend();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa] dark:bg-[#0a1625] transition-colors duration-500 ease-in-out relative">
      <ScrollToTop />
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
            </Route>
          </Routes>
        ) : (
          /* ⚡ AnimatePresence mode="wait" ensures exit finishes before enter */
          <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <Routes location={location} key={location.pathname}>
              {/* Instant Load Pages */}
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/products" element={<PageTransition><Products openCart={openCart} /></PageTransition>} />
              <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
              <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><PrivateRoute><Profile /></PrivateRoute></PageTransition>} />

              {/* Lazy Load Pages: Individual Suspense wrappers prevent navigation hangs */}
              <Route path="/spin" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><Spin /></PageTransition></Suspense>} />
              <Route path="/notifications" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><PrivateRoute><Notifications /></PrivateRoute></PageTransition></Suspense>} />
              <Route path="/checkout" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><PrivateRoute><Checkout /></PrivateRoute></PageTransition></Suspense>} />
              <Route path="/success" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><PrivateRoute><OrderSuccess /></PrivateRoute></PageTransition></Suspense>} />
              <Route path="/orders" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><PrivateRoute><Orders /></PrivateRoute></PageTransition></Suspense>} />
              <Route path="/orders/:orderId" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><PrivateRoute><OrderDetails /></PrivateRoute></PageTransition></Suspense>} />
              <Route path="/login" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><Login /></PageTransition></Suspense>} />
              <Route path="/about" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><About /></PageTransition></Suspense>} />
              <Route path="/faq" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><FAQ /></PageTransition></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><Terms /></PageTransition></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><Privacy /></PageTransition></Suspense>} />
              <Route path="/cancellation" element={<Suspense fallback={<SeaBiteLoader />}><PageTransition><Cancellation /></PageTransition></Suspense>} />
            </Routes>
          </AnimatePresence>
        )}
      </div>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SupportWidget />}
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