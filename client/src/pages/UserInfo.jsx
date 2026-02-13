import React, { useState, useEffect, useContext } from 'react';
import { FiUser, FiMail, FiSmartphone, FiSave, FiX, FiEdit2, FiCheck, FiLock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || "";

const EditableInfoRow = ({ icon: Icon, label, initialValue, fieldKey, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const isEmailField = fieldKey === 'email';

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = async () => {
    if (value.trim() === initialValue) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/api/auth/me`,
        { [fieldKey]: value },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      onSave(fieldKey, res.data.user ? res.data.user[fieldKey] : value);
      setIsEditing(false);
    } catch (error) {
     // console.error(`Failed to update ${fieldKey}:`, error);
      setValue(initialValue);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      className={`group relative flex items-center gap-3 md:gap-5 p-4 md:p-6 rounded-2xl transition-all duration-300 ${
        isEditing
          ? 'bg-white dark:bg-slate-800 shadow-xl scale-[1.02] border border-blue-100 dark:border-blue-900/30'
          : 'hover:bg-white/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50'
      }`}
    >
      <div
        className={`shrink-0 p-2.5 md:p-3 rounded-full transition-colors duration-300 ${
          isEditing
            ? 'bg-blue-600 text-white'
            : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
        }`}
      >
        <Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 md:mb-1 flex items-center gap-2">
          {label}
          {isEmailField && <FiLock size={10} className="mb-0.5" />}
        </p>

        <div className="relative">
          {isEditing && !isEmailField ? (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <input
                type={fieldKey === 'phone' ? 'tel' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={loading}
                autoFocus
                className="w-full text-base md:text-lg font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-b-2 border-blue-500 p-1 md:p-2 outline-none transition-colors"
              />
            </motion.div>
          ) : (
            <p
              className={`text-base md:text-lg font-medium truncate ${
                isEmailField
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-slate-200'
              }`}
            >
              {initialValue || (
                <span className="text-slate-400 italic text-sm">Not provided</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {!isEmailField && (
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 md:gap-2"
              >
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FiCheck size={16} />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <FiX size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="edit-btn"
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FiEdit2 size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default function UserInfo({ user }) {
  const [currentUser, setCurrentUser] = useState(user);
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleFieldSave = (fieldKey, newValue) => {
    setCurrentUser((prevUser) => ({ ...prevUser, [fieldKey]: newValue }));
  };

  const name = currentUser.name || 'Valued Customer';
  const email = currentUser.email || 'No Email';
  const phone = currentUser.phone || '';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto -mt-16 md:-mt-24 relative z-10 px-4 md:px-6 mb-12 md:mb-20 font-sans">
      <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-700 shadow-xl flex items-center justify-center overflow-hidden"
          >
            <span className="text-4xl md:text-5xl font-serif font-bold text-slate-800 dark:text-white">
              {initial}
            </span>
          </motion.div>

          <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 bg-emerald-500 text-white p-1 md:p-1.5 rounded-full border-2 md:border-4 border-white dark:border-slate-800 shadow-md">
            <FiCheck size={12} strokeWidth={3} />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 md:mt-6"
        >
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
            {name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs md:text-sm font-medium">
            SeaBite Member since 2025
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-3xl p-1.5 md:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none"
      >
        <div className="h-1 w-16 md:w-20 bg-blue-600 mx-auto rounded-full mb-4 md:mb-6 opacity-20" />

        <div className="flex flex-col gap-1 md:gap-2">
          <EditableInfoRow
            icon={FiUser}
            label="Full Name"
            fieldKey="name"
            initialValue={name}
            onSave={handleFieldSave}
          />
          <EditableInfoRow
            icon={FiMail}
            label="Email Address"
            fieldKey="email"
            initialValue={email}
            onSave={handleFieldSave}
          />
          <EditableInfoRow
            icon={FiSmartphone}
            label="Phone Number"
            fieldKey="phone"
            initialValue={phone}
            onSave={handleFieldSave}
          />
        </div>
      </motion.div>
    </div>
  );
}
