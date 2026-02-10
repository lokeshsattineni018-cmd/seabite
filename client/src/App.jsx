// src/App.jsx
import { useState, lazy, Suspense } from "react"; // Added Suspense
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
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

// ✅ NEW: Simple, fast loading component to prevent white screen
const SeaBiteLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-blue-500 font-medium animate-pulse">Fresh Catch Loading...</p>
  </div>
);

// Lazy pages (store)
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Spin = lazy(() => import("./pages/Spin"));

// Lazy pages (info)
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cancellation = lazy(() => import("./pages/Cancellation"));

// Admin
import AdminLayout from "./admin/AdminLayout";
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./admin/AdminProducts"));
const AddProduct = lazy(() => import("./admin/AddProduct"));
const EditProduct = lazy(() => import("./admin/AddProduct"));
const AdminOrders = lazy(() => import("./admin/AdminOrders"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));
const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminMessages = lazy(() => import("./admin/AdminMessages"));
const AdminCoupons = lazy(() => import("./admin/AdminCoupons"));

// Context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// Axios global config
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa] dark:bg-[#0a1625] transition-colors duration-500 ease-in-out relative">
      <ScrollToTop />
      {!isAdminRoute && <Navbar openCart={openCart} />}
      {!isAdminRoute && (
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}

      <div className="flex-grow">
        <AnimatePresence mode="wait">
          {/* ✅ WRAP ROUTES IN SUSPENSE: This stops the white page */}
          <Suspense fallback={<SeaBiteLoader />}>
            <Routes location={location} key={location.pathname}>
              {/* STORE ROUTES */}
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/products" element={<PageTransition><Products openCart={openCart} /></PageTransition>} />
              <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
              <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
              <Route path="/spin" element={<PageTransition><Spin /></PageTransition>} />

              {/* PROTECTED USER ROUTES */}
              <Route path="/notifications" element={<PageTransition><PrivateRoute><Notifications /></PrivateRoute></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><PrivateRoute><Checkout /></PrivateRoute></PageTransition>} />
              <Route path="/profile" element={<PageTransition><PrivateRoute><Profile /></PrivateRoute></PageTransition>} />
              <Route path="/success" element={<PageTransition><PrivateRoute><OrderSuccess /></PrivateRoute></PageTransition>} />
              <Route path="/orders" element={<PageTransition><PrivateRoute><Orders /></PrivateRoute></PageTransition>} />
              <Route path="/orders/:orderId" element={<PageTransition><PrivateRoute><OrderDetails /></PrivateRoute></PageTransition>} />

              {/* PUBLIC AUTH + INFO */}
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/about" element={<PageTransition><About /></PageTransition>} />
              <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
              <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
              <Route path="/cancellation" element={<PageTransition><Cancellation /></PageTransition>} />

              {/* ADMIN AUTH */}
              <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />

              {/* ADMIN PROTECTED */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route path="dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
                <Route path="products" element={<PageTransition><AdminProducts /></PageTransition>} />
                <Route path="add-product" element={<PageTransition><AddProduct /></PageTransition>} />
                <Route path="edit-product/:id" element={<PageTransition><EditProduct /></PageTransition>} />
                <Route path="orders" element={<PageTransition><AdminOrders /></PageTransition>} />
                <Route path="users" element={<PageTransition><AdminUsers /></PageTransition>} />
                <Route path="messages" element={<PageTransition><AdminMessages /></PageTransition>} />
                <Route path="coupons" element={<PageTransition><AdminCoupons /></PageTransition>} />
              </Route>
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SupportWidget />}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="781532512036-kaouiapk5q6akjofr45t7ff7d7t6jm9k.apps.googleusercontent.com">
      <ThemeProvider>
        <CartProvider>
          <AuthProvider>
            <MainLayout />
          </AuthProvider>
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}