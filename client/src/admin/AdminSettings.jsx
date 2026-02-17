import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiSave, FiSettings, FiDollarSign, FiClock, FiMapPin, FiTruck, FiPercent } from "react-icons/fi";
import { motion } from "framer-motion";

export default function AdminSettings() {
    const { settings, setSettings } = useOutletContext();
    const [formData, setFormData] = useState(settings || {});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings) setFormData(settings);
    }, [settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await axios.put("/api/admin/enterprise/settings", formData, { withCredentials: true });
            setSettings(data.settings);
            toast.success("Settings updated successfully! ⚙️");
        } catch (err) {
            toast.error("Failed to update settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Store Settings</h1>
                    <p className="text-slate-500 text-sm">Manage global configurations for SeaBite.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <FiSettings className="animate-spin" /> : <FiSave />}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. General Settings */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FiMapPin /></div>
                        <h2 className="font-bold text-slate-800">General Info</h2>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Store Name</label>
                        <input name="storeName" value={formData.storeName || ""} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors" placeholder="SeaBite" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Phone</label>
                            <input name="contactPhone" value={formData.contactPhone || ""} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Email</label>
                            <input name="contactEmail" value={formData.contactEmail || ""} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Logo URL</label>
                        <input name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-colors" placeholder="/logo.png" />
                    </div>
                </div>

                {/* 2. Finance Settings */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FiDollarSign /></div>
                        <h2 className="font-bold text-slate-800">Finance & Tax</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><FiPercent size={10} /> Tax Rate (GST)</label>
                            <input type="number" name="taxRate" value={formData.taxRate || 0} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><FiTruck size={10} /> Delivery Fee</label>
                            <input type="number" name="deliveryFee" value={formData.deliveryFee || 0} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-colors" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Order Value</label>
                            <input type="number" name="minOrderValue" value={formData.minOrderValue || 0} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Free Delivery Over</label>
                            <input type="number" name="freeDeliveryThreshold" value={formData.freeDeliveryThreshold || 0} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none transition-colors" />
                        </div>
                    </div>
                </div>

                {/* 3. Operations Settings */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FiClock /></div>
                        <h2 className="font-bold text-slate-800">Operations & Hours</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Opening Time</label>
                            <input type="time" name="openingTime" value={formData.openingTime || "09:00"} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Closing Time</label>
                            <input type="time" name="closingTime" value={formData.closingTime || "23:00"} onChange={handleChange} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none transition-colors" />
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className={`p-2 rounded-full ${formData.isClosed ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                                <FiClock />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800">Manual Closure</h3>
                                <p className="text-xs text-slate-400">Force store offline</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="isClosed" checked={formData.isClosed || false} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </form>
        </motion.div>
    );
}
