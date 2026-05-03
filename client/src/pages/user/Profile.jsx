import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock, 
  FiEye, FiEyeOff, FiShoppingBag, FiShield, FiX, 
  FiCheckCircle, FiUser, FiChevronRight, FiCreditCard,
  FiBell, FiSettings
} from "react-icons/fi";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Profile() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
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

  // Forgot Password States
  const [isForgot, setIsForgot] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(res.data);
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
      fetchUser(); 
    }
  }, [fetchUser, authLoading]);

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

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
      
      {/* 🌌 Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-600/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        
        {/* 🔙 Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <button 
            onClick={() => navigate("/")}
            className="group flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-white transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-700/50 transition-colors">
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            </div>
            Back to Shop
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* 📱 Left Sidebar / Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Profile Brief Card */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8 backdrop-blur-xl transition-all hover:bg-white/[0.05]">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-2xl shadow-blue-500/20">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-light overflow-hidden">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-[#020617] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  </div>
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-1">{user.name}</h2>
                <p className="text-xs font-medium text-slate-400 mb-6 uppercase tracking-widest">{user.role || 'Gourmet Member'}</p>
                
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <FiLogOut size={14} /> Sign Out
                </button>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
            </div>

            {/* Desktop Navigation List */}
            <div className="hidden lg:block space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${
                    activeTab === tab.id 
                      ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <tab.icon className={`transition-colors ${activeTab === tab.id ? 'text-blue-400' : 'group-hover:text-white'}`} size={18} />
                    <span className="text-sm font-semibold tracking-wide">{tab.label}</span>
                  </div>
                  <FiChevronRight className={`transition-all ${activeTab === tab.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              ))}
            </div>

            {/* Mobile Horizontal Nav */}
            <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 💎 Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-[600px]"
              >
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* Welcome Banner */}
                    <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-slate-900 to-black border border-white/10 p-10 lg:p-16 shadow-2xl">
                      <div className="relative z-10 max-w-2xl">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-3 mb-6"
                        >
                          <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">SeaBite Elite</span>
                          <span className="text-slate-500 text-xs font-medium italic">Member since {new Date(user.createdAt).getFullYear()}</span>
                        </motion.div>
                        <h1 className="text-4xl lg:text-6xl font-extralight tracking-tight mb-6 leading-[1.1]">
                          Welcome back, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">{user.name.split(' ')[0]}</span>.
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-lg font-light mb-10">
                          Your premium seafood experience is just a click away. Track orders, manage settings, and explore your gourmet profile.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                          <div className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors cursor-pointer shadow-lg shadow-white/5">
                            Quick Order
                          </div>
                          <div className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-colors cursor-pointer border border-white/10">
                            Support
                          </div>
                        </div>
                      </div>
                      
                      {/* Decorative Element */}
                      <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 h-80 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                      <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="200" cy="200" r="150" stroke="white" strokeWidth="0.5" strokeDasharray="10 10" />
                          <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="0.5" />
                          <circle cx="200" cy="200" r="50" stroke="white" strokeWidth="0.5" strokeDasharray="5 5" />
                        </svg>
                      </div>
                    </div>

                    {/* Stats Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="group relative rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8 hover:bg-white/[0.06] transition-all overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 ring-1 ring-blue-500/20">
                            <FiShoppingBag size={18} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Orders</span>
                        </div>
                        <div className="flex items-end justify-between relative z-10">
                          <span className="text-6xl font-extralight tracking-tighter">{user.totalOrders || 0}</span>
                          <span className="text-xs font-bold text-green-400 mb-2">+2 this month</span>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-600/5 blur-2xl rounded-full transition-all group-hover:scale-150"></div>
                      </div>

                      <div className="group relative rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8 hover:bg-white/[0.06] transition-all overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 ring-1 ring-indigo-500/20">
                            <FiCreditCard size={18} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Wallet</span>
                        </div>
                        <div className="flex items-end justify-between relative z-10">
                          <span className="text-6xl font-extralight tracking-tighter">₹{user.walletBalance || 0}</span>
                          <span className="text-xs font-bold text-slate-400 mb-2">Available Credits</span>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-600/5 blur-2xl rounded-full transition-all group-hover:scale-150"></div>
                      </div>

                      <div className="group relative rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8 hover:bg-white/[0.06] transition-all overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 ring-1 ring-cyan-500/20">
                            <FiShield size={18} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Security</span>
                        </div>
                        <div className="flex items-center gap-3 relative z-10 mt-6">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                          <span className="text-2xl font-bold tracking-tight">Verified</span>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-cyan-600/5 blur-2xl rounded-full transition-all group-hover:scale-150"></div>
                      </div>
                    </div>

                    {/* Personal Info Integrated */}
                    <div className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-2 overflow-hidden backdrop-blur-3xl">
                       <div className="p-8 pb-4">
                          <h3 className="text-xl font-bold tracking-tight">Account Details</h3>
                          <p className="text-sm text-slate-400 font-medium">Update your identity and contact preferences.</p>
                       </div>
                       <UserInfo user={user} onUpdate={fetchUser} />
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="relative rounded-[3rem] bg-white/[0.03] border border-white/10 p-12 lg:p-20 text-center overflow-hidden min-h-[500px] flex flex-col items-center justify-center">
                    <div className="relative z-10 max-w-md">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                        <FiShoppingBag className="text-slate-400" size={32} />
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight mb-4">No active orders found.</h2>
                      <p className="text-slate-400 leading-relaxed mb-10 font-medium">
                        Your pantry seems a bit empty. Explore our fresh catch of the day and start your culinary journey.
                      </p>
                      <button 
                        onClick={() => navigate("/products")}
                        className="px-10 py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5 flex items-center gap-3 mx-auto"
                      >
                        Browse Fresh Catch <FiChevronRight />
                      </button>
                    </div>
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
                  </div>
                )}

                {activeTab === "addresses" && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 backdrop-blur-3xl">
                      <AddressManager />
                    </div>
                  </motion.div>
                )}

                {activeTab === "security" && (
                  <div className="rounded-[3rem] bg-white/[0.03] border border-white/10 p-12 lg:p-16 relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                      <div className="max-w-md">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 ring-1 ring-indigo-500/20">
                          <FiLock size={20} />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Security Protocol</h2>
                        <p className="text-slate-400 leading-relaxed mb-4 font-medium">
                          We use end-to-end encryption to secure your account. Change your password regularly to maintain maximum protection.
                        </p>
                        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-green-500/5 border border-green-500/20 w-max">
                           <FiCheckCircle className="text-green-500" />
                           <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Biometric Login Ready</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 justify-center">
                        {user.isGoogleUser ? (
                          <div className="flex items-center gap-4 px-8 py-6 bg-white/5 rounded-3xl border border-white/10">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                            </svg>
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Authenticated via</p>
                               <span className="text-sm font-bold tracking-tight">Google Secure Login</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setShowPassModal(true); setIsForgot(true); setOtpSent(false); }}
                              className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                              Reset via Email
                            </button>
                            <button 
                              onClick={() => { setShowPassModal(true); setIsForgot(false); }}
                              className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                            >
                              Change Password
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 🔐 Advanced Password Modal */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPassModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0a1620] border border-white/10 rounded-[3rem] p-10 lg:p-14 shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <button onClick={() => setShowPassModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors">
                <FiX size={24} />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20">
                <FiLock size={28} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight mb-3">
                {isForgot ? "Account Recovery" : "Identity Update"}
              </h2>
              <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                Maintain your account's integrity by updating your secure credentials.
              </p>

              <div className="space-y-4 mb-10">
                 {!isForgot && (
                    <div className="relative">
                      <input 
                        type={showOld ? "text" : "password"} placeholder="Current Security Key" value={oldPass} onChange={e => setOldPass(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      />
                      <button onClick={() => setShowOld(!showOld)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showOld ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                      </button>
                    </div>
                 )}
                 
                 <div className="relative">
                    <input 
                      type={showNew ? "text" : "password"} placeholder="New Security Key" value={newPass} onChange={e => setNewPass(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button onClick={() => setShowNew(!showNew)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showNew ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                    </button>
                 </div>

                 <input 
                    type="password" placeholder="Confirm Security Key" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                 />
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={passLoading}
                className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
              >
                {passLoading ? "Authorizing..." : "Update Vault"}
              </button>
              
              {/* Background accent */}
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
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
