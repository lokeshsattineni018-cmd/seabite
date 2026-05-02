// AdminSettings.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiSave, FiSettings, FiDollarSign, FiClock, FiMapPin, FiTruck, FiPercent, FiBriefcase } from "react-icons/fi";
import { motion } from "framer-motion";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const fadeUp = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function AdminSettings() {
    const { settings, setSettings } = useOutletContext();
    const [formData, setFormData] = useState(settings || {});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings) setFormData(settings);
    }, [settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await axios.put("/api/admin/enterprise/settings", formData, { withCredentials: true });
            setSettings(data.settings);
            toast.success("Settings saved successfully");
        } catch {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="p-6 md:p-10 min-h-screen bg-gradient-to-br from-white via-stone-50 to-white font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center text-white shadow-lg shadow-stone-200">
                            <FiSettings size={26} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-light text-stone-900 tracking-tight mb-1">Store Settings</h1>
                            <p className="text-sm text-stone-500">Global configuration & preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-stone-900 text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wide hover:bg-stone-800 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <SeaBiteLoader small /> : <FiSave size={16} />}
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* General Info */}
                    <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FiMapPin size={20} /></div>
                            <h2 className="text-lg font-bold text-stone-900">General Information</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Store Name</label>
                                <input name="storeName" value={formData.storeName || ""} onChange={handleChange} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="SeaBite" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                                    <input name="contactPhone" value={formData.contactPhone || ""} onChange={handleChange} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                                    <input name="contactEmail" value={formData.contactEmail || ""} onChange={handleChange} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Logo URL</label>
                                <input name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all" placeholder="/logo.png" />
                            </div>
                        </div>
                    </div>

                    {/* Finance */}
                    <div className="bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FiDollarSign size={20} /></div>
                            <h2 className="text-lg font-bold text-stone-900">Tax & Finance</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">GST Rate (%)</label>
                                    <div className="relative">
                                        <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                                        <input type="number" name="taxRate" value={formData.taxRate || 0} onChange={handleChange} className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-BOLD text-stone-900 focus:bg-white focus:border-emerald-400 outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Delivery Fee</label>
                                    <div className="relative">
                                        <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                                        <input type="number" name="deliveryFee" value={formData.deliveryFee || 0} onChange={handleChange} className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-BOLD text-stone-900 focus:bg-white focus:border-emerald-400 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Min Order</label>
                                    <div className="relative">
                                        <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                                        <input type="number" name="minOrderValue" value={formData.minOrderValue || 0} onChange={handleChange} className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-BOLD text-stone-900 focus:bg-white focus:border-emerald-400 outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Free Delivery From</label>
                                    <div className="relative">
                                        <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                                        <input type="number" name="freeDeliveryThreshold" value={formData.freeDeliveryThreshold || 0} onChange={handleChange} className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-BOLD text-stone-900 focus:bg-white focus:border-emerald-400 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </form >
            </div >
        </motion.div >
    );
}
