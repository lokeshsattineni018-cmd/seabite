import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock, 
  FiEye, FiEyeOff, FiShoppingBag, FiShield, FiX, 
  FiCheckCircle, FiUser, FiChevronRight, FiCreditCard,
  FiBell, FiSettings, FiPackage, FiCalendar
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import AnimatedOceanBanner from "./AnimatedOceanBanner";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Profile() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassModal, setShowPassModal] = useState(false);
  
  // Password States
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const navigate = useNavigate();

  const fetchUserAndOrders = useCallback(async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`, { withCredentials: true }),
        axios.get(`${API_URL}/api/orders/myorders`, { withCredentials: true })
      ]);
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
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("seabite_session_id");
      window.location.href = "/?auth=login";
    }
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) return toast.error("Please fill both fields");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPass !== confirmPass) return toast.error("Passwords do not match");
    
    setPassLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/change-password`, { oldPassword: oldPass, newPassword: newPass }, { withCredentials: true });
      toast.success("Password updated!");
      setShowPassModal(false);
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect current password");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return <SeaBiteLoader fullScreen />;
  if (!user) return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl = user.picture || user.avatar || null;

  const tabs = [
    { id: "overview", icon: FiHome, label: "Overview" },
    { id: "orders", icon: FiShoppingBag, label: "Orders" },
    { id: "addresses", icon: FiMapPin, label: "Addresses" },
    { id: "security", icon: FiShield, label: "Security" },
  ];

  const totalSpent = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 pt-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* 🔙 Navigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            <FiArrowLeft size={14} /> Back to Shop
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* 📱 Left Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-6 lg:sticky lg:top-32"
          >
            <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-100 to-indigo-100">
                  <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-3xl font-light text-slate-400 overflow-hidden">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-white"></div>
              </div>
              <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{user.role || 'Member'}</p>
              
              <button 
                onClick={handleLogout}
                className="mt-8 w-full py-3 rounded-2xl bg-red-50 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <FiLogOut size={14} /> Sign Out
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 hidden lg:block">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-slate-900 text-white shadow-xl' 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm font-bold">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Nav */}
            <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 💎 Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {activeTab === "overview" && (
                  <>
                    {/* Animated Ocean Header */}
                    <div className="relative group">
                       <AnimatedOceanBanner />
                       <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-16 pointer-events-none">
                          <motion.span 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2"
                          >
                            Welcome Back
                          </motion.span>
                          <motion.h1 
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                            className="text-3xl lg:text-5xl font-extralight tracking-tight text-slate-900"
                          >
                            Good morning, <span className="font-bold">{user.name.split(' ')[0]}</span>.
                          </motion.h1>
                       </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-blue-200 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Real-time Orders</p>
                        <p className="text-5xl font-extralight tracking-tighter">{orders.length}</p>
                      </div>
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-indigo-200 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Total Spent</p>
                        <p className="text-5xl font-extralight tracking-tighter">₹{totalSpent}</p>
                      </div>
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 group hover:border-green-200 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Profile Status</p>
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                           <span className="text-lg font-bold">Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100">
                       <h3 className="text-xl font-bold tracking-tight mb-8">Personal Information</h3>
                       <UserInfo user={user} onUpdate={fetchUserAndOrders} />
                    </div>
                  </>
                )}

                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h2 className="text-2xl font-bold tracking-tight">Recent Orders</h2>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{orders.length} total</span>
                    </div>
                    
                    {orders.length === 0 ? (
                      <div className="bg-white rounded-[2.5rem] p-20 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                          <FiShoppingBag className="text-slate-300" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No active orders.</h2>
                        <p className="text-slate-400 font-medium mb-10">You haven't ordered anything yet. Explore our menu!</p>
                        <button onClick={() => navigate("/products")} className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 transition-all">
                          Browse Menu
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-all">
                             <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                   <FiPackage size={24} />
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-900">Order #{order.orderId || order._id.slice(-6).toUpperCase()}</h4>
                                   <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                                      <span className="flex items-center gap-1"><FiCalendar size={12}/> {new Date(order.createdAt).toLocaleDateString()}</span>
                                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                      <span>{order.items?.length || 0} items</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="font-bold text-slate-900">₹{order.totalAmount}</p>
                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 block ${
                                  order.status === 'Delivered' ? 'text-green-500' : 'text-blue-500'
                                }`}>{order.status}</span>
                             </div>
                          </div>
                        ))}
                        <button onClick={() => navigate("/orders")} className="w-full py-4 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-bold hover:bg-slate-50 transition-all">
                           View All Orders
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "addresses" && (
                  <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100">
                    <AddressManager />
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="bg-white rounded-[2.5rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100">
                    <div className="flex flex-col lg:flex-row justify-between gap-12">
                       <div className="max-w-md">
                          <h2 className="text-2xl font-bold mb-4 tracking-tight">Security Protocol</h2>
                          <p className="text-slate-400 font-medium leading-relaxed mb-6">Manage your security keys and account protection settings.</p>
                          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-green-50 text-green-600 border border-green-100">
                             <FiCheckCircle size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Multi-Factor Enabled</span>
                          </div>
                       </div>
                       <div className="flex flex-col gap-3 justify-center">
                          {user.isGoogleUser ? (
                            <div className="flex items-center gap-4 px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                               <FiLock className="text-slate-400" />
                               <span className="text-sm font-bold">Authenticated via Google</span>
                            </div>
                          ) : (
                            <button onClick={() => setShowPassModal(true)} className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20">
                              Change Password
                            </button>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Clean Modal */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] p-12 w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden"
            >
              <button onClick={() => setShowPassModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                <FiX size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Update Security</h2>
              <p className="text-slate-400 font-medium mb-10 text-sm">Ensure your account stays protected with a high-entropy key.</p>
              
              <div className="space-y-4 mb-8">
                 <input 
                   type={showOld ? "text" : "password"} placeholder="Current Password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                 />
                 <input 
                   type={showNew ? "text" : "password"} placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                 />
                 <input 
                   type="password" placeholder="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm font-medium"
                 />
              </div>

              <button 
                onClick={handleChangePassword} disabled={passLoading}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 disabled:opacity-50"
              >
                {passLoading ? "Processing..." : "Update Password"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
