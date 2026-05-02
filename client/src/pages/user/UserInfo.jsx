import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

// Monochrome Google Icon
const GoogleMono = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-500">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
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
              {user.isGoogleUser && <GoogleMono />}
              <span className="text-sm font-medium text-gray-900 truncate">{user.email}</span>
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