import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock,
  FiShoppingBag, FiShield, FiCheckCircle, FiUser,
  FiCreditCard, FiBell, FiPackage, FiCalendar, FiChevronRight,
  FiActivity, FiDollarSign, FiClock, FiCheck
} from "react-icons/fi";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { usePushSubscription } from "../../hooks/usePushSubscription";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Profile() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { isSupported, isSubscribed, loading: pushLoading, subscribeToPush, unsubscribeFromPush } = usePushSubscription();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Password States
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const navigate = useNavigate();

  const fetchUserAndOrders = useCallback(async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true })
      ]);
      if (userRes.data && userRes.data.success === false) {
        navigate("/login");
        return;
      }
      setUser(userRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      if (authUser) {
        setUser(authUser);
      } else {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, authUser]);

  useEffect(() => {
    if (!authLoading) {
      fetchUserAndOrders();
    }
  }, [fetchUserAndOrders, authLoading]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.removeItem("userInfo");
      setLogoutLoading(false);
      window.location.href = "/?auth=login";
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass) return toast.error("Please fill both fields");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPass !== confirmPass) return toast.error("Passwords do not match");

    setPassLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/change-password`, { oldPassword: oldPass, newPassword: newPass }, { withCredentials: true });
      toast.success("Password updated successfully!");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect current password");
    } finally {
      setPassLoading(false);
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribeFromPush();
      if (success) toast.success("Push notifications disabled!");
    } else {
      const success = await subscribeToPush();
      if (success) toast.success("Push notifications enabled!");
      else toast.error("Failed to enable push notifications. Check browser permissions.");
    }
  };

  if (loading) return <SeaBiteLoader fullScreen />;
  if (!user) return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl = user.picture || user.avatar || null;

  const tabs = [
    { id: "overview", icon: FiHome, label: "Overview" },
    { id: "orders", icon: FiShoppingBag, label: "My Orders" },
    { id: "wallet", icon: FiCreditCard, label: "SeaBite Wallet" },
    { id: "addresses", icon: FiMapPin, label: "Manage Addresses" },
    { id: "security", icon: FiShield, label: "Account Security" },
    { id: "notifications", icon: FiBell, label: "Notification Channels" },
  ];

  const totalSpent = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F9F8] text-[#1A2E2C] py-12" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Back Link */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5E7A77] hover:text-[#1A2E2C] transition-colors duration-200"
          >
            <FiArrowLeft size={14} className="stroke-[3]" /> Back to Home
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Left Sidebar */}
          <div className="md:col-span-1 space-y-6">
            
            {/* User Profile Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-[#E2EEEC] flex items-center justify-center text-3xl font-extrabold text-[#5BA8A0] bg-[#F4F9F8] overflow-hidden shadow-inner">
                  {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white"></div>
              </div>
              <h2 className="text-xl font-extrabold text-[#1A2E2C] leading-snug">{user.name}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E2EEEC]/50 text-[#1A2E2C] mt-2 border border-[#E2EEEC]">
                {user.role || 'Member'}
              </span>
              
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="mt-6 w-full py-3 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-rose-600 text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiLogOut size={13} className="stroke-[2.5]" />
                <span>{logoutLoading ? "Signing Out..." : "Sign Out"}</span>
              </button>
            </div>

            {/* Sidebar Navigation */}
            <div className="bg-white rounded-3xl p-3 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hidden md:block space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-[#1A2E2C] text-white shadow-md shadow-[#1A2E2C]/10"
                        : "text-[#5E7A77] hover:text-[#1A2E2C] hover:bg-[#F4F9F8]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon size={16} className={isActive ? "stroke-[2.5]" : "stroke-[2]"} />
                      <span>{tab.label}</span>
                    </div>
                    <FiChevronRight size={14} className={`stroke-[2.5] transition-transform duration-200 ${isActive ? "text-white translate-x-0.5" : "text-[#5E7A77]/40 group-hover:text-[#1A2E2C] group-hover:translate-x-0.5"}`} />
                  </button>
                );
              })}
            </div>

            {/* Mobile Navigation bar */}
            <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar py-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                      isActive
                        ? "bg-[#1A2E2C] text-white border-[#1A2E2C] shadow-sm"
                        : "bg-white text-[#5E7A77] border-[#E2EEEC]"
                    }`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right Main Content Panel */}
          <div className="md:col-span-3">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Clean Welcome Banner */}
                <div className="bg-gradient-to-r from-[#E2EEEC]/50 via-white to-white rounded-3xl p-8 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1A2E2C] tracking-tight leading-none">
                    Welcome back, <span className="text-[#5BA8A0] font-black">{user.name.split(" ")[0]}</span>
                  </h1>
                  <p className="text-xs text-[#5E7A77] mt-2 font-medium max-w-xl leading-relaxed">
                    Here is an overview of your active credentials, order counts, and wallet statement. Explore the options on the left side to configure your profile details.
                  </p>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-[#E2EEEC] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#5BA8A0] transition-colors duration-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F4F9F8] border border-[#E2EEEC] text-[#5BA8A0] flex items-center justify-center shrink-0">
                      <FiShoppingBag size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5E7A77]">Orders Placed</p>
                      <p className="text-2xl font-black text-[#1A2E2C] mt-0.5">{orders.length}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-5 border border-[#E2EEEC] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#5BA8A0] transition-colors duration-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F4F9F8] border border-[#E2EEEC] text-[#5BA8A0] flex items-center justify-center shrink-0">
                      <FiDollarSign size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5E7A77]">Lifetime Spent</p>
                      <p className="text-2xl font-black text-[#1A2E2C] mt-0.5">
                        ₹{Number(totalSpent || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-[#E2EEEC] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#5BA8A0] transition-colors duration-200 flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab("wallet")}>
                    <div className="w-12 h-12 rounded-xl bg-[#F4F9F8] border border-[#E2EEEC] text-[#5BA8A0] flex items-center justify-center shrink-0">
                      <FiCreditCard size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5E7A77]">Wallet Balance</p>
                      <p className="text-2xl font-black text-[#5BA8A0] mt-0.5">
                        ₹{Number(user.walletBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal Info Box */}
                <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-[#F4F9F8] pb-3">
                    <FiUser className="text-[#5BA8A0] stroke-[2.5]" size={18} />
                    <h3 className="text-base font-extrabold text-[#1A2E2C]">Personal Profile Details</h3>
                  </div>
                  <UserInfo user={user} onUpdate={fetchUserAndOrders} />
                </div>

              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex justify-between items-center border-b border-[#F4F9F8] pb-3">
                  <div className="flex items-center gap-2">
                    <FiShoppingBag className="text-[#5BA8A0] stroke-[2.5]" size={18} />
                    <h2 className="text-base font-extrabold text-[#1A2E2C]">Order History Statement</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#5E7A77] bg-[#F4F9F8] border border-[#E2EEEC] px-3 py-1 rounded-full">{orders.length} orders total</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <FiShoppingBag className="mx-auto text-[#5E7A77]/30 mb-3" size={36} />
                    <p className="text-sm font-bold text-[#1A2E2C]">No orders placed yet</p>
                    <p className="text-xs text-[#5E7A77] mt-1">Start shopping our fresh seafood daily catches.</p>
                    <button
                      onClick={() => navigate("/products")}
                      className="mt-6 px-6 py-2.5 bg-[#1A2E2C] hover:bg-[#2D504C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200"
                    >
                      Shop Seafood
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isDelivered = order.status === "Delivered";
                      const isCancelled = order.status?.includes("Cancelled");
                      return (
                        <div
                          key={order._id}
                          className="rounded-2xl border border-[#E2EEEC] hover:border-[#5BA8A0] transition-colors duration-200 overflow-hidden bg-[#F4F9F8]/10"
                        >
                          {/* Order Header Info */}
                          <div className="px-5 py-3 border-b border-[#E2EEEC] bg-[#F4F9F8]/40 flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#1A2E2C]">
                              <span>Order #{order.orderId || order._id.slice(-6).toUpperCase()}</span>
                              <span className="text-[#5E7A77]/40">•</span>
                              <span className="text-[#5E7A77] flex items-center gap-1 font-semibold"><FiCalendar size={11} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                              isDelivered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isCancelled ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          {/* Order Content */}
                          <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#1A2E2C]">Items:</p>
                              <p className="text-xs text-[#5E7A77] font-medium leading-relaxed">
                                {order.items?.map(i => `${i.name} (qty ${i.qty})`).join(", ")}
                              </p>
                            </div>
                            
                            <div className="flex sm:flex-col justify-between items-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2EEEC] shrink-0">
                              <p className="font-extrabold text-base text-[#1A2E2C]">₹{order.totalAmount}</p>
                              <button
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="mt-2 text-xs font-bold text-[#5BA8A0] hover:text-[#1A2E2C] transition-colors flex items-center gap-1"
                              >
                                View Details <FiChevronRight size={12} />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. WALLET TAB */}
            {activeTab === "wallet" && (
              <div className="space-y-6">
                
                {/* Premium Zomato/Swiggy style Digital Card */}
                <div className="bg-gradient-to-br from-[#1A2E2C] via-[#24423F] to-[#3D8C85] rounded-3xl p-8 text-white shadow-lg border border-[#E2EEEC]/10 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -left-10 -top-10 w-44 h-44 bg-[#5BA8A0]/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#5BA8A0] block">SeaBite Card Balance</span>
                      <h3 className="text-4xl font-extrabold tracking-tight mt-3">
                        ₹{Number(user.walletBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <p className="text-xs text-white/70 mt-4 font-medium leading-relaxed max-w-sm">Use wallet balance for instant checkout, special offers, and seamless refund processing.</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">Status</span>
                      <span className="text-xs font-bold text-[#5BA8A0] flex items-center justify-center gap-1">
                        Active Account
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Statement */}
                <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-4 border-b border-[#F4F9F8] pb-3">
                    <FiActivity className="text-[#5BA8A0] stroke-[2.5]" size={18} />
                    <h3 className="text-base font-extrabold text-[#1A2E2C]">Transaction Statement</h3>
                  </div>

                  {!user.walletTransactions || user.walletTransactions.length === 0 ? (
                    <div className="text-center py-10 text-[#5E7A77]">
                      <FiCreditCard className="mx-auto mb-3 opacity-30" size={32} />
                      <p className="text-xs font-bold">No transactions found</p>
                      <p className="text-[11px] text-[#5E7A77]/70 mt-0.5">Refunds or wallet credits will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {user.walletTransactions.map((tx, idx) => {
                        const isCredit = tx.type === "Credit";
                        return (
                          <div key={tx._id || idx} className="flex justify-between items-center p-4 rounded-xl border border-[#E2EEEC] bg-[#F4F9F8]/20 hover:border-[#5BA8A0] transition-colors duration-200">
                            <div>
                              <h4 className="text-xs font-bold text-[#1A2E2C]">{tx.description}</h4>
                              <div className="flex items-center gap-1 text-[10px] text-[#5E7A77] mt-1 font-semibold">
                                <FiCalendar size={11} />
                                <span>{new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-extrabold ${isCredit ? "text-emerald-600" : "text-rose-500"}`}>
                                {isCredit ? "+" : "-"} ₹{Number(tx.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#5E7A77] mt-0.5">{tx.type}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 4. ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 mb-4 border-b border-[#F4F9F8] pb-3">
                  <FiMapPin className="text-[#5BA8A0] stroke-[2.5]" size={18} />
                  <h3 className="text-base font-extrabold text-[#1A2E2C]">Delivery Address Book</h3>
                </div>
                <AddressManager />
              </div>
            )}

            {/* 5. SECURITY TAB */}
            {activeTab === "security" && (
              <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex items-center gap-2 border-b border-[#F4F9F8] pb-3">
                  <FiShield className="text-[#5BA8A0] stroke-[2.5]" size={18} />
                  <h3 className="text-base font-extrabold text-[#1A2E2C]">Account Credentials</h3>
                </div>

                {user.isGoogleUser ? (
                  <div className="flex items-center gap-3 p-4 bg-[#F4F9F8]/50 border border-[#E2EEEC] rounded-xl text-xs font-bold text-[#5E7A77]">
                    <FiCheckCircle className="text-emerald-500" />
                    <span>Your account is connected to and secured via Google OAuth. Password change is not required.</span>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5E7A77] mb-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={oldPass}
                        onChange={e => setOldPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2EEEC] focus:border-[#5BA8A0] outline-none transition-colors text-sm font-medium bg-[#F4F9F8]/30 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5E7A77] mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2EEEC] focus:border-[#5BA8A0] outline-none transition-colors text-sm font-medium bg-[#F4F9F8]/30 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5E7A77] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2EEEC] focus:border-[#5BA8A0] outline-none transition-colors text-sm font-medium bg-[#F4F9F8]/30 focus:bg-white"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={passLoading}
                      className="px-6 py-3 bg-[#1A2E2C] hover:bg-[#2D504C] text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors duration-200 disabled:opacity-50"
                    >
                      {passLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 6. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-3xl p-6 border border-[#E2EEEC] shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex items-center gap-2 border-b border-[#F4F9F8] pb-3">
                  <FiBell className="text-[#5BA8A0] stroke-[2.5]" size={18} />
                  <h3 className="text-base font-extrabold text-[#1A2E2C]">Notification Configuration</h3>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 border border-[#E2EEEC] bg-[#F4F9F8]/20 rounded-2xl">
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-[#1A2E2C]">Push Notifications</h4>
                    <p className="text-xs text-[#5E7A77] mt-1 font-medium leading-relaxed">Receive real-time alerts for delivery status updates, daily catch lists, and flash sales.</p>
                  </div>
                  
                  {isSupported ? (
                    <button
                      onClick={handlePushToggle}
                      disabled={pushLoading}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 shrink-0 ${
                        isSubscribed
                          ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-500 hover:text-white"
                          : "bg-[#1A2E2C] text-white hover:bg-[#2D504C]"
                      }`}
                    >
                      {isSubscribed ? "Disable Alerts" : "Enable Alerts"}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-[#5E7A77] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      Not Supported in this Browser
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
