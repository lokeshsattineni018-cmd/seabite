// src/App.jsx
import { useState, lazy, Suspense } from "react";
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

// Simple loader (for store lazy pages only)
const SeaBiteLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-blue-500 font-medium animate-pulse">
      Fresh Catch Loading...
    </p>
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

// Admin (NOT lazy – load once, no Suspense flash)
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AddProduct from "./admin/AddProduct";
import EditProduct from "./admin/AddProduct";
import AdminOrders from "./admin/AdminOrders";
import AdminUsers from "./admin/AdminUsers";
import AdminLogin from "./admin/AdminLogin";
import AdminMessages from "./admin/AdminMessages";
import AdminCoupons from "./admin/AdminCoupons";

// Context
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// Axios global config
axios.defaults.withCredentials = true;
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

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
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />
      )}

      <div className="flex-grow">
        {isAdminRoute ? (
          // 🔹 ADMIN ROUTES: no Suspense, no loader flash, instant switches
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Admin login */}
              <Route
                path="/admin/login"
                element={
                  <PageTransition>
                    <AdminLogin />
                  </PageTransition>
                }
              />

              {/* Admin protected area */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
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
        ) : (
          // 🔹 STORE + INFO ROUTES: lazy + Suspense + PageTransition
          <Suspense fallback={<SeaBiteLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* STORE ROUTES */}
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <Home />
                    </PageTransition>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <PageTransition>
                      <Products openCart={openCart} />
                    </PageTransition>
                  }
                />
                <Route
                  path="/products/:id"
                  element={
                    <PageTransition>
                      <ProductDetails />
                    </PageTransition>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <PageTransition>
                      <Cart />
                    </PageTransition>
                  }
                />
                <Route
                  path="/spin"
                  element={
                    <PageTransition>
                      <Spin />
                    </PageTransition>
                  }
                />

                {/* PROTECTED USER ROUTES */}
                <Route
                  path="/notifications"
                  element={
                    <PageTransition>
                      <PrivateRoute>
                        <Notifications />
                      </PrivateRoute>
                    </PageTransition>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <PageTransition>
                      <PrivateRoute>
                        <Checkout />
                      </PrivateRoute>
                    </PageTransition>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PageTransition>
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    </PageTransition>
                  }
                />
                <Route
                  path="/success"
                  element={
                    <PageTransition>
                      <PrivateRoute>
                        <OrderSuccess />
                      </PrivateRoute>
                    </PageTransition>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <PageTransition>
                      <PrivateRoute>
                        <Orders />
                      </PrivateRoute>
                    </PageTransition>
                  }
                />
                <Route
                  path="/orders/:orderId"
                  element={
                    <PageTransition>
                      <PrivateRoute>
                        <OrderDetails />
                      </PrivateRoute>
                    </PageTransition>
                  }
                />

                {/* PUBLIC AUTH + INFO */}
                <Route
                  path="/login"
                  element={
                    <PageTransition>
                      <Login />
                    </PageTransition>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <PageTransition>
                      <About />
                    </PageTransition>
                  }
                />
                <Route
                  path="/faq"
                  element={
                    <PageTransition>
                      <FAQ />
                    </PageTransition>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <PageTransition>
                      <Terms />
                    </PageTransition>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <PageTransition>
                      <Privacy />
                    </PageTransition>
                  }
                />
                <Route
                  path="/cancellation"
                  element={
                    <PageTransition>
                      <Cancellation />
                    </PageTransition>
                  }
                />
              </Routes>
            </AnimatePresence>
          </Suspense>
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
