import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// Colorful Google Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
    />
  </svg>
);

export default function UserInfo({ user, onUpdate }) {
  if (!user) return null;

  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (field) => {
    if (!formData[field].trim()) {
      return toast.error("Field cannot be empty");
    }

    if (field === "phone" && !/^\d+$/.test(formData[field])) {
      toast.error("Phone number must contain only digits");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/api/auth/me`, { [field]: formData[field] }, { withCredentials: true });
      toast.success("Profile updated");
      setEditing(null);
      if (onUpdate) onUpdate(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (field) => {
    setFormData({ ...formData, [field]: user[field] || "" });
    setEditing(null);
  };

  const renderField = (field, label, value) => {
    const isEditing = editing === field;

    return (
      <div className="flex items-center justify-between py-3 px-5 group">
        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-1 sm:gap-6">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold w-24 shrink-0">{label}</span>
          <div className="flex-1 flex items-center gap-2">
            {isEditing ? (
              <input
                type={field === 'phone' ? 'tel' : 'text'}
                value={formData[field]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full px-0 py-1 text-sm border-b border-gray-300 focus:border-gray-900 focus:outline-none bg-transparent font-medium text-gray-900"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-gray-900 truncate">{value || "—"}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center ml-4 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button onClick={() => handleSave(field)} disabled={loading} className="text-gray-900 hover:text-black transition-colors">
                <FiCheck size={16} />
              </button>
              <button onClick={() => handleCancel(field)} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FiX size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(field)} className="text-gray-300 group-hover:text-gray-500 transition-colors">
              <FiEdit2 size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl ring-1 ring-gray-900/5 overflow-hidden">
      <div className="divide-y divide-gray-100/80">
        {/* Name */}
        {renderField('name', 'Name', user.name)}

        {/* Email */}
        <div className="flex items-center justify-between py-3 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center w-full gap-1 sm:gap-6">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold w-24 shrink-0">Email</span>
            <div className="flex-1 flex items-center gap-2">
              {user.isGoogleUser && <GoogleIcon />}
              <span className="text-sm font-medium text-gray-900 truncate ml-2">{user.email}</span>
            </div>
          </div>
          <div className="w-4 ml-4 shrink-0"></div>
        </div>

        {/* Phone */}
        {renderField('phone', 'Phone', user.phone)}
      </div>
    </div>
  );
}