import { useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function UserInfo({ user, onUpdate }) {
  if (!user) return null;

  const [editing, setEditing] = useState(null); // 'name' or 'phone'
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (field) => {
    if (!formData[field].trim()) {
      return toast.error("Field cannot be empty");
    }

    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, { [field]: formData[field] }, { withCredentials: true });
      toast.success("Profile updated");
      setEditing(null);
      if (onUpdate) onUpdate(res.data); // Optional callback to update parent state if needed
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
      <li className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
        <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0">
          <span className="text-sm font-medium text-gray-500 w-1/3">{label}</span>
          <div className="w-2/3 flex items-center gap-2">
            {isEditing ? (
              <input
                type={field === 'phone' ? 'tel' : 'text'}
                value={formData[field]}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="flex-1 px-3 py-1.5 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-gray-900">{value || "Not provided"}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center ml-4">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleSave(field)} 
                disabled={loading}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <FiCheck size={16} />
              </button>
              <button 
                onClick={() => handleCancel(field)}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setEditing(field)}
              className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all p-2 rounded-lg hover:bg-blue-50"
            >
              <FiEdit2 size={16} />
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4 px-1">Personal Information</h3>
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-100">
          
          {/* Name - Editable */}
          {renderField('name', 'Full Name', user.name)}

          {/* Email - Non-Editable */}
          <li className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0">
              <span className="text-sm font-medium text-gray-500 w-1/3">Email Address</span>
              <div className="w-2/3 flex items-center gap-2">
                {user.isGoogleUser && <FcGoogle size={18} />}
                <span className="text-sm font-medium text-gray-900">{user.email}</span>
              </div>
            </div>
            {/* Empty space to align with edit buttons */}
            <div className="w-8 ml-4"></div>
          </li>

          {/* Phone - Editable */}
          {renderField('phone', 'Phone Number', user.phone)}
          
        </ul>
      </div>
    </div>
  );
}