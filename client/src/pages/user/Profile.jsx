import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock, FiEye, FiEyeOff, FiShoppingBag, FiShield, FiX, FiCheckCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";
import AnimatedOceanBanner from "./AnimatedOceanBanner";


const API_URL = import.meta.env.VITE_API_URL || "";

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
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon size={18} /> {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-max">
          <FiArrowLeft size={16} /> Back to Home
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar / Mobile Tabs */}
        <div className="col-span-1">
          <div className="md:sticky md:top-24 bg-white rounded-2xl border border-gray-200/60 p-2 md:p-4 shadow-sm overflow-x-auto no-scrollbar">
            <nav className="flex md:flex-col gap-1 min-w-max md:min-w-0">
              <TabButton id="overview" icon={FiHome} label="Overview" />
              <TabButton id="orders" icon={FiShoppingBag} label="My Orders" />
              <TabButton id="addresses" icon={FiMapPin} label="Addresses" />
              <TabButton id="security" icon={FiShield} label="Security" />
              <div className="hidden md:block h-[1px] bg-gray-100 my-2"></div>
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 transition-colors ml-auto md:ml-0">
                <FiLogOut size={18} /> Sign Out
              </button>
            </nav>
          </div>
        </div>

        {/* Right Content */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-5">
          
          {/* Profile Header */}
          <div className="relative mb-12">
            <AnimatedOceanBanner />

            {/* Avatar exactly on bottom edge */}
            <div className="absolute left-1/2 -bottom-12 -translate-x-1/2">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-semibold text-white shadow-sm overflow-hidden bg-white">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
              </div>
            </div>
          </div>

          <div className="text-center mt-0 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Dynamic Content based on activeTab */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            {activeTab === "overview" && (
              <>
                {/* Stats Widgets */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-white rounded-2xl p-5 border border-gray-200/60 shadow-sm flex items-center gap-4 max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <FiShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-xl font-semibold text-gray-900">{user.totalOrders || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                  <UserInfo user={user} onUpdate={fetchUser} />
                </div>
              </>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShoppingBag size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Order History</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  View your complete order history, track active shipments, and download past invoices.
                </p>
                <button
                  onClick={() => navigate("/orders")}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  Go to Orders Page <FiArrowLeft className="rotate-180" />
                </button>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                <AddressManager />
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 px-1">Security & Access</h3>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Authentication Method</h4>
                    <p className="text-sm text-gray-500 mt-1">Manage your password and how you sign in to SeaBite.</p>
                  </div>
                  {user.isGoogleUser ? (
                    <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-xl border border-gray-200/60 shrink-0">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" />
                      <span className="text-sm font-medium text-gray-900">Connected via Google</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                      <button onClick={() => { setShowPassModal(true); setIsForgot(true); setOtpSent(false); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                        Forgot Password?
                      </button>
                      <button onClick={() => { setShowPassModal(true); setIsForgot(false); }} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-gray-800 transition-colors">
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
          <div className="fixed inset-0 z-[2000] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl border border-gray-200/60 relative"
            >
              <button onClick={() => setShowPassModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"><FiX size={20} /></button>
              
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <FiLock size={20} />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isForgot ? "Reset Password" : "Update Password"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {isForgot 
                  ? "Receive an OTP to securely reset your password." 
                  : "Secure your account by choosing a strong, unique password."}
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
