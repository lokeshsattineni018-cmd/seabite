import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiArrowLeft, FiMapPin, FiLock, FiEye, FiEyeOff, FiShoppingBag, FiShield, FiCreditCard } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import UserInfo from "./UserInfo";
import AddressManager from "./AddressManager";
import SeaBiteLoader from "../../components/common/SeaBiteLoader";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
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

  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    }
    finally {
      localStorage.removeItem("userInfo");
      localStorage.removeItem("seabite_session_id");
      window.location.href = "/?auth=login"; // Redirect and trigger login to show it's cleared
    }
  };

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) {
    return <SeaBiteLoader fullScreen />;
  }

  if (!user) return null;

  const avatarLetter = user.name?.charAt(0).toUpperCase() || "S";
  const avatarUrl = user.picture || user.avatar || null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
        {/* Back button */}
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors w-max">
                <FiArrowLeft size={16} /> Back to Home
            </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="col-span-1 hidden md:block">
                <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                    <nav className="flex flex-col gap-1">
                        <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl bg-gray-50 text-blue-600">
                           <FiHome size={18} /> Overview
                        </button>
                        <button onClick={() => navigate("/orders")} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                           <FiShoppingBag size={18} /> My Orders
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                           <FiMapPin size={18} /> Addresses
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                           <FiCreditCard size={18} /> Wallet
                        </button>
                        <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                           <FiShield size={18} /> Security
                        </button>
                        <div className="h-[1px] bg-gray-100 my-2"></div>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 transition-colors">
                           <FiLogOut size={18} /> Sign Out
                        </button>
                    </nav>
                </div>
            </div>

            {/* Right Content */}
            <div className="col-span-1 md:col-span-3 flex flex-col gap-10">
                {/* Hero Banner & Avatar */}
                <div className="relative mb-12">
                    <img 
                      src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop" 
                      className="w-full h-48 object-cover rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]" 
                      alt="Ocean cover"
                    />
                    <div className="absolute -bottom-10 left-8 flex items-end gap-6">
                        <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-md overflow-hidden shrink-0">
                            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : avatarLetter}
                        </div>
                        <div className="mb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-sm font-medium text-gray-500">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Premium Stat Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Wallet Balance</p>
                            <p className="text-3xl font-black">₹{user.walletBalance || 0}</p>
                        </div>
                        <button className="relative z-10 mt-6 w-max px-5 py-2 text-xs font-bold uppercase tracking-wider text-white border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors">
                            Top Up Wallet
                        </button>
                        {/* Background subtle decoration */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-between group">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
                            <p className="text-3xl font-black text-gray-900">{user.totalOrders || 0}</p>
                        </div>
                        <button onClick={() => navigate("/orders")} className="mt-6 w-max px-5 py-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                            View History
                        </button>
                    </div>
                </div>

                {/* Personal Information (UserInfo) */}
                <UserInfo user={user} />

                {/* Address Manager */}
                <AddressManager />

                {/* Security Section (Change Password) */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Security & Access</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                            <div>
                                <h4 className="text-base font-bold text-gray-900">Authentication Method</h4>
                                <p className="text-sm text-gray-500 mt-1">Manage your password and how you sign in to SeaBite.</p>
                            </div>
                            {user.isGoogleUser ? (
                                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" />
                                    <span className="text-sm font-bold text-blue-600">Connected via Google</span>
                                </div>
                            ) : (
                                <button onClick={() => setShowPassModal(true)} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-colors shrink-0">
                                    Change Password
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Change Password Modal */}
        <AnimatePresence>
          {showPassModal && (
            <div className="fixed inset-0 z-[2000] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                className="bg-white p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl relative"
              >
                <button onClick={() => setShowPassModal(false)} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-900 transition-colors"><FiX size={18} /></button>
                
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <FiLock size={24} />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Update Password</h2>
                <p className="text-sm text-gray-500 mb-8">Secure your account by choosing a strong, unique password.</p>
                
                <div className="flex flex-col gap-5 mb-8">
                  <div className="relative">
                    <input 
                      type={showOld ? "text" : "password"} placeholder="Current Password" value={oldPass} onChange={e => setOldPass(e.target.value)}
                      className="w-full px-5 py-4 pr-12 rounded-2xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
                    />
                    <button onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showOld ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                    </button>
                  </div>

                  <div className="relative">
                    <input 
                      type={showNew ? "text" : "password"} placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)}
                      className="w-full px-5 py-4 pr-12 rounded-2xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
                    />
                    <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <FiEyeOff size={18}/> : <FiEye size={18}/>}
                    </button>
                  </div>

                  <input 
                    type="password" placeholder="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 outline-none text-sm font-medium bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
                  />
                  {newPass && confirmPass && newPass !== confirmPass && (
                    <p className="text-red-500 text-xs font-bold mt-[-12px] ml-1">Passwords do not match</p>
                  )}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChangePassword} disabled={passLoading || (newPass !== confirmPass && newPass)}
                  className="w-full py-4 rounded-2xl border-none bg-gray-900 text-white font-bold text-sm shadow-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {passLoading ? "Updating..." : "Update Security"}
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}