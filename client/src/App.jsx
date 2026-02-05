import { useState } from "react"; 
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion"; 
import { GoogleOAuthProvider } from "@react-oauth/google"; 

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar"; 
import PageTransition from "./components/PageTransition"; 
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout"; 
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails"; 
import Notifications from "./pages/Notifications";

// Legal Pages
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cancellation from "./pages/Cancellation";

// Admin
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
import AdminRoute from "./components/AdminRoute";

// Context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";

import SupportWidget from "./components/SupportWidget";

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = () => setIsCartOpen(true); 

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa] dark:bg-[#0a1625] transition-colors duration-500 ease-in-out relative">
      <ScrollToTop />
      {!isAdminRoute && <Navbar openCart={openCart} />}
      {!isAdminRoute && <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}

      <div className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/products" element={<PageTransition><Products openCart={openCart} /></PageTransition>} /> 
            <Route path="/products/:id" element={<PageTransition><ProductDetails /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="/notifications" element={<PageTransition><Notifications /></PageTransition>} />
            <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
            <Route path="/success" element={<PageTransition><OrderSuccess /></PageTransition>} />
            <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} /> 
            <Route path="/orders/:orderId" element={<PageTransition><OrderDetails /></PageTransition>} /> 

            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
            <Route path="/cancellation" element={<PageTransition><Cancellation /></PageTransition>} />

            <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
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
        </AnimatePresence>
      </div>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <SupportWidget />}
    </div>
  );
}

export default function App() {
  return (
    // ✅ WRAPPER IS OUTSIDE ALL OTHER PROVIDERS TO ENSURE GLOBAL AUTH CONTEXT
    <GoogleOAuthProvider clientId="781532512036-kaouiapk5q6akjofr45t7ff7d7t6jm9k.apps.googleusercontent.com">
      <ThemeProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}