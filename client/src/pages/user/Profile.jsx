import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock, FiEye, FiEyeOff, FiShoppingBag, FiShield, FiX, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";
import toast from "react-hot-toast";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const [isForgot, setIsForgot] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  

  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) return toast.error("Please fill both fields");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPass !== confirmPass) return toast.error("Passwords do not match");
    if (newPass === oldPass) return toast.error("New password cannot be same as old password");
    
    setPassLoading(true);
    try {
      await axios.put(`${API_URL}/api/auth/change-password`, { oldPassword: oldPass, newPassword: newPass }, { withCredentials: true });
      toast.success("Password updated!");
      setShowPassModal(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect current password");
    } finally {
      setPassLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setPassLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password-otp`, { email: user.email });
      toast.success("Reset OTP sent to your email!");
      setOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset OTP");
    } finally {
      setPassLoading(false);
    }
  };

  const handleResetWithOtp = async () => {
    if (!otp || !newPass) return toast.error("Please fill all fields");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPass !== confirmPass) return toast.error("Passwords do not match");

    setPassLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { email: user.email, otp, newPassword: newPass });
      toast.success("Password reset successful!");
      setShowPassModal(false);
      setOtp("");
      setNewPass("");
      setConfirmPass("");
      setOtpSent(false);
      setIsForgot(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP or error resetting password");
    } finally {
      setPassLoading(false);
    }
  };


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

  if (loading) return <SeaBiteLoader fullScreen />;
  if (!user) return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl = user.picture || user.avatar || null;

  const TabButton = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-2xl transition-all ${
          isActive
            ? "bg-gray-900 text-white shadow-lg shadow-gray-200/50"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] pb-20 font-sans text-gray-900">
      {/* Back to Home Header */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors w-max">
          <FiArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
        
        {/* Sidebar */}
        <div className="col-span-1">
          <div className="md:sticky md:top-24 bg-white rounded-[2.5rem] ring-1 ring-gray-900/5 p-3 flex md:flex-col gap-1 overflow-x-auto no-scrollbar shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
            <TabButton id="overview" icon={FiHome} label="Dashboard" />
            <TabButton id="orders" icon={FiShoppingBag} label="Orders" />
            <TabButton id="addresses" icon={FiMapPin} label="Addresses" />
            <TabButton id="security" icon={FiShield} label="Security" />
            <div className="hidden md:block h-[1px] bg-gray-100/80 my-3 mx-4"></div>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-2xl text-red-500 hover:bg-red-50 transition-colors ml-auto md:ml-0">
              <FiLogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-1 md:col-span-3">
          
          {/* Profile Header (Mesh Gradient) */}
          <div className="relative mb-16">
            <div className="h-44 rounded-[2.5rem] w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-200 via-[#1A2B35] to-[#0A1620] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              {/* Dynamic light flare */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Avatar overlapping precisely */}
            <div className="absolute left-10 -bottom-8 flex items-end gap-6">
              <div className="w-24 h-24 rounded-full border-[4px] border-white flex items-center justify-center text-3xl font-light text-white shadow-[0_15px_40px_rgba(0,0,0,0.15)] overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 relative z-10">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{user.name}</h1>
                <p className="text-sm font-medium text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Stats Bento Card */}
                <div className="bg-white rounded-[2.5rem] p-8 ring-1 ring-gray-900/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[160px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <FiShoppingBag size={14} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Total Orders</p>
                  </div>
                  <p className="text-5xl font-light tracking-tighter text-gray-900">{user.totalOrders || 0}</p>
                </div>

                {/* Status Bento Card */}
                <div className="bg-white rounded-[2.5rem] p-8 ring-1 ring-gray-900/5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <FiShield size={14} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Security Status</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <p className="text-lg font-bold tracking-tight text-gray-900">Verified Account</p>
                  </div>
                  <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-green-50/50 rounded-full blur-3xl transition-all group-hover:scale-110"></div>
                </div>

                {/* Info Section spanning bottom */}
                <div className="md:col-span-3 mt-4">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="text-lg font-bold tracking-tight text-gray-900">Personal Information</h3>
                  </div>
                  <UserInfo user={user} onUpdate={fetchUser} />
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-[2.5rem] ring-1 ring-gray-900/5 p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <FiShoppingBag size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-3">Order History</h3>
                <p className="text-gray-400 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                  Track your active shipments and view your complete purchasing history.
                </p>
                <button
                  onClick={() => navigate("/orders")}
                  className="px-8 py-3.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-900/20 inline-flex items-center gap-3"
                >
                  Enter Archive <FiArrowLeft className="rotate-180" size={14} />
                </button>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-white rounded-[2.5rem] ring-1 ring-gray-900/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <AddressManager />
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-[2.5rem] ring-1 ring-gray-900/5 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-10">
                  <div className="max-w-md">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Security & Access</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Manage your authentication methods and maintain control over your account security.</p>
                  </div>
                  
                  {user.isGoogleUser ? (
                    <div className="flex items-center gap-4 px-6 py-4 bg-gray-50/50 rounded-[1.5rem] ring-1 ring-gray-900/5 shrink-0">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                      </svg>
                      <span className="text-sm font-bold text-gray-900 tracking-tight">Protected via Google</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                      <button onClick={() => { setShowPassModal(true); setIsForgot(true); setOtpSent(false); }} className="px-6 py-3 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-gray-900 transition-colors">
                        Forgot Key?
                      </button>
                      <button onClick={() => { setShowPassModal(true); setIsForgot(false); }} className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:bg-black transition-all">
                        Change Password
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 z-[5000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white p-12 rounded-[3rem] w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.25)] ring-1 ring-gray-900/5 relative overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
              
              <button onClick={() => setShowPassModal(false)} className="absolute top-8 right-8 p-3 text-gray-300 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50"><FiX size={20} /></button>
              
              <div className="w-16 h-16 rounded-[1.5rem] bg-gray-50 text-gray-900 flex items-center justify-center mb-8 ring-1 ring-gray-900/5">
                <FiLock size={24} />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                {isForgot ? "Reset Access" : "Update Security"}
              </h2>
              <p className="text-sm text-gray-400 font-medium mb-10 leading-relaxed">
                {isForgot 
                  ? "Receive an encrypted OTP to securely restore your account access." 
                  : "Choose a complex, high-entropy password to protect your digital vault."}
              </p>
              
              <div className="flex flex-col gap-4 mb-8">
                {isForgot && !otpSent && (
                  <div className="text-sm text-gray-700 text-center mb-2">
                    We will send a 6-digit OTP to <b>{user.email}</b>.
                  </div>
                )}

                {isForgot && otpSent && (
                  <div className="relative">
                    <input 
                      type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all tracking-widest text-center"
                      maxLength={6}
                    />
                  </div>
                )}

                {(!isForgot) && (
                  <div className="relative">
                    <input 
                      type={showOld ? "text" : "password"} placeholder="Current Password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                    <button onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOld ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                    </button>
                  </div>
                )}

                {(!isForgot || otpSent) && (
                  <>
                    <div className="relative">
                      <input 
                        type={showNew ? "text" : "password"} placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                      />
                      <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                      </button>
                    </div>

                    <div>
                      <input 
                        type="password" placeholder="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                      />
                      {newPass && confirmPass && newPass !== confirmPass && (
                        <p className="text-red-500 text-xs font-medium mt-1.5 ml-1">Passwords do not match</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={isForgot ? (otpSent ? handleResetWithOtp : handleSendOtp) : handleChangePassword} 
                disabled={passLoading || (!isForgot && newPass !== confirmPass && newPass)}
                className="w-full py-3 rounded-xl border-none bg-gray-900 text-white font-medium text-sm shadow-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {passLoading ? "Wait..." : (isForgot ? (otpSent ? "Reset Password" : "Send OTP") : "Update Security")}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
