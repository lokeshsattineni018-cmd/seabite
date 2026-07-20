import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock,
  FiShoppingBag, FiShield, FiCheckCircle, FiUser,
  FiCreditCard, FiBell, FiPackage, FiCalendar
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
    { id: "orders", icon: FiShoppingBag, label: "Orders" },
    { id: "wallet", icon: FiCreditCard, label: "Wallet" },
    { id: "addresses", icon: FiMapPin, label: "Addresses" },
    { id: "security", icon: FiShield, label: "Security" },
    { id: "notifications", icon: FiBell, label: "Notifications" },
  ];

  const totalSpent = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F4F9F8] text-[#1A2E2C] py-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5E7A77] hover:text-[#1A2E2C] transition-colors"
          >
            <FiArrowLeft size={14} /> Back to Shop
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Left Sidebar */}
          <div className="md:col-span-1 space-y-4">
            
            {/* User Header Info */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] text-center shadow-sm">
              <div className="relative inline-block mb-3">
                <div className="w-20 h-20 rounded-full bg-[#F4F9F8] border-2 border-[#E2EEEC] flex items-center justify-center text-2xl font-bold text-[#5BA8A0] overflow-hidden">
                  {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
                </div>
              </div>
              <h2 className="text-lg font-bold text-[#1A2E2C] leading-snug">{user.name}</h2>
              <p className="text-xs font-semibold text-[#5BA8A0] mt-0.5">{user.email}</p>
              
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="mt-6 w-full py-2.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiLogOut size={13} />
                <span>{logoutLoading ? "Signing Out..." : "Sign Out"}</span>
              </button>
            </div>

            {/* Sidebar Navigation */}
            <div className="bg-white rounded-2xl p-2 border border-[#E2EEEC] shadow-sm hidden md:block">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#1A2E2C] text-white shadow-sm"
                        : "text-[#5E7A77] hover:text-[#1A2E2C] hover:bg-[#F4F9F8]"
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
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
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      isActive
                        ? "bg-[#1A2E2C] text-white border-[#1A2E2C]"
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

          {/* Right Main Content */}
          <div className="md:col-span-3 space-y-6">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Clean Welcome Banner */}
                <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm">
                  <h1 className="text-2xl font-extrabold text-[#1A2E2C] tracking-tight">
                    Good day, <span className="text-[#5BA8A0]">{user.name.split(" ")[0]}</span>
                  </h1>
                  <p className="text-xs text-[#5E7A77] mt-1 font-medium">
                    Welcome to your dashboard. Review your past orders, manage addresses, or configure preferences.
                  </p>
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-[#E2EEEC] shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5E7A77] mb-2">Orders Placed</p>
                    <p className="text-3xl font-extrabold text-[#1A2E2C]">{orders.length}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-[#E2EEEC] shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5E7A77] mb-2">Total Purchases</p>
                    <p className="text-3xl font-extrabold text-[#1A2E2C]">
                      ₹{Number(totalSpent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-[#E2EEEC] shadow-sm cursor-pointer hover:border-[#5BA8A0] transition-colors" onClick={() => setActiveTab("wallet")}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5E7A77] mb-2">Wallet Credits</p>
                    <p className="text-3xl font-extrabold text-[#5BA8A0]">
                      ₹{Number(user.walletBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Personal Info Box */}
                <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm">
                  <h3 className="text-base font-bold text-[#1A2E2C] mb-4 border-b border-[#F4F9F8] pb-3">Personal Details</h3>
                  <UserInfo user={user} onUpdate={fetchUserAndOrders} />
                </div>

              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-[#F4F9F8] pb-3">
                  <h2 className="text-base font-bold text-[#1A2E2C]">Order History</h2>
                  <span className="text-xs font-semibold text-[#5E7A77]">{orders.length} total orders</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <FiShoppingBag className="mx-auto text-[#5E7A77]/30 mb-3" size={36} />
                    <p className="text-sm font-bold text-[#1A2E2C]">No orders placed yet</p>
                    <p className="text-xs text-[#5E7A77] mt-1">Start shopping our fresh seafood daily catches.</p>
                    <button
                      onClick={() => navigate("/products")}
                      className="mt-6 px-6 py-2.5 bg-[#1A2E2C] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
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
                          className="p-4 rounded-xl border border-[#E2EEEC] hover:border-[#5BA8A0] transition-colors bg-[#F4F9F8]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-[#E2EEEC] text-[#1A2E2C] shrink-0 mt-0.5">
                              <FiPackage size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#1A2E2C]">
                                Order #{order.orderId || order._id.slice(-6).toUpperCase()}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#5E7A77] font-medium">
                                <span className="flex items-center gap-1"><FiCalendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{order.items?.length || 0} items</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex sm:flex-col justify-between items-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2EEEC]">
                            <div className="text-left sm:text-right">
                              <p className="font-extrabold text-sm text-[#1A2E2C]">₹{order.totalAmount}</p>
                              <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 block ${
                                isDelivered ? "text-emerald-600" : isCancelled ? "text-rose-500" : "text-amber-600"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="mt-2 text-xs font-bold text-[#5BA8A0] hover:text-[#1A2E2C] transition-colors"
                            >
                              View Details &rarr;
                            </button>
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
                
                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-br from-[#1A2E2C] to-[#2D504C] rounded-2xl p-6 text-white border border-[#E2EEEC] shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5BA8A0] block mb-1">SeaBite Wallet</span>
                      <h3 className="text-4xl font-extrabold">
                        ₹{Number(user.walletBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <p className="text-xs text-white/70 mt-2 font-medium">Use wallet balance for instant checkout and hassle-free payments.</p>
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-center shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 block mb-0.5">Status</span>
                      <span className="text-xs font-bold text-[#5BA8A0] flex items-center justify-center gap-1">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm">
                  <h3 className="text-base font-bold text-[#1A2E2C] mb-4 border-b border-[#F4F9F8] pb-3">Transaction History</h3>

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
                          <div key={tx._id || idx} className="flex justify-between items-center p-4 rounded-xl border border-[#E2EEEC] bg-[#F4F9F8]/10">
                            <div>
                              <h4 className="text-xs font-bold text-[#1A2E2C]">{tx.description}</h4>
                              <div className="flex items-center gap-1 text-[10px] text-[#5E7A77] mt-1">
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
              <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm">
                <h3 className="text-base font-bold text-[#1A2E2C] mb-4 border-b border-[#F4F9F8] pb-3">Delivery Addresses</h3>
                <AddressManager />
              </div>
            )}

            {/* 5. SECURITY TAB */}
            {activeTab === "security" && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm space-y-6">
                <h3 className="text-base font-bold text-[#1A2E2C] border-b border-[#F4F9F8] pb-3">Account Security</h3>

                {user.isGoogleUser ? (
                  <div className="flex items-center gap-3 p-4 bg-[#F4F9F8]/50 border border-[#E2EEEC] rounded-xl text-sm font-semibold">
                    <FiLock className="text-[#5E7A77]" />
                    <span>Your account is connected to and secured via Google OAuth.</span>
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
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2EEEC] focus:border-[#5BA8A0] outline-none transition-colors text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5E7A77] mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2EEEC] focus:border-[#5BA8A0] outline-none transition-colors text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5E7A77] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2EEEC] focus:border-[#5BA8A0] outline-none transition-colors text-sm font-medium"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={passLoading}
                      className="px-6 py-2.5 bg-[#1A2E2C] text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                      {passLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 6. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2EEEC] shadow-sm space-y-6">
                <h3 className="text-base font-bold text-[#1A2E2C] border-b border-[#F4F9F8] pb-3">Notification Preferences</h3>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 border border-[#E2EEEC] bg-[#F4F9F8]/20 rounded-xl">
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-[#1A2E2C]">Push Notifications</h4>
                    <p className="text-xs text-[#5E7A77] mt-1 font-medium">Receive real-time alerts for delivery status updates, daily catch lists, and flash sales.</p>
                  </div>
                  
                  {isSupported ? (
                    <button
                      onClick={handlePushToggle}
                      disabled={pushLoading}
                      className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                        isSubscribed
                          ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white"
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
