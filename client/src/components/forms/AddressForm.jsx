import { useState, useEffect } from "react";
import { FiMapPin, FiNavigation, FiCheck, FiX, FiLoader, FiHome, FiSmartphone, FiUser, FiMap, FiHash } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const ALLOWED_STATES = ["Andhra Pradesh", "Telangana", "AP", "TS"];

export default function AddressForm({ onSave, onCancel, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        phone: initialData.phone || "",
        houseNo: initialData.houseNo || "",
        street: initialData.street || "",
        landmark: initialData.landmark || "",
        city: initialData.city || "",
        state: initialData.state || "Andhra Pradesh",
        postalCode: initialData.postalCode || "",
        isDefault: initialData.isDefault || false,
    });

    const [detecting, setDetecting] = useState(false);
    const [errors, setErrors] = useState({});

    // Auto-detect location
    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                    );
                    const data = await res.json();

                    if (data && data.address) {
                        const addr = data.address;
                        const state = addr.state || "";
                        const isAllowed = ALLOWED_STATES.some(s => state.toLowerCase().includes(s.toLowerCase()));

                        if (!isAllowed) {
                            toast.error(`Service not available in ${state}. Only AP & Telangana.`);
                        }

                        setFormData(prev => ({
                            ...prev,
                            street: data.display_name.split(",")[0],
                            city: addr.city || addr.town || addr.village || addr.county || "",
                            state: state,
                            postalCode: addr.postcode || "",
                        }));

                        toast.success("Location detected!");
                    }
                } catch (error) {
                    toast.error("Failed to fetch location details.");
                } finally {
                    setDetecting(false);
                }
            },
            () => {
                toast.error("Unable to retrieve your location.");
                setDetecting(false);
            }
        );
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = "Valid phone number required";
        if (!formData.houseNo) newErrors.houseNo = "House No is required";
        if (!formData.street) newErrors.street = "Street/Area is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.postalCode) newErrors.postalCode = "Pincode is required";

        const isAllowed = ALLOWED_STATES.some(s => formData.state.toLowerCase().includes(s.toLowerCase()));
        if (!isAllowed) newErrors.state = "Delivery available only in AP & Telangana";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        } else {
            toast.error("Please fix the errors");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FiMapPin className="text-blue-500" />
                    {initialData._id ? "Edit Address" : "Add New Address"}
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500">
                    <FiX size={20} />
                </button>
            </div>

            <button
                type="button"
                onClick={detectLocation}
                disabled={detecting}
                className="w-full mb-6 flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
            >
                {detecting ? <FiLoader className="animate-spin" /> : <FiNavigation />}
                Use My Current Location
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs ml-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                        <div className="relative">
                            <FiSmartphone className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="tel"
                                placeholder="9876543210"
                                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs ml-1">{errors.phone}</p>}
                    </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">House No / Flat / Building</label>
                    <div className="relative">
                        <FiHome className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Flat 101, Sea View Apartments"
                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.houseNo ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                            value={formData.houseNo}
                            onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                        />
                    </div>
                    {errors.houseNo && <p className="text-red-500 text-xs ml-1">{errors.houseNo}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Street / Area / Colony</label>
                    <div className="relative">
                        <FiMap className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Main Road, Near Clock Tower"
                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.street ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        />
                    </div>
                    {errors.street && <p className="text-red-500 text-xs ml-1">{errors.street}</p>}
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">City</label>
                        <input
                            type="text"
                            placeholder="Visakhapatnam"
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.city ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                        {errors.city && <p className="text-red-500 text-xs ml-1">{errors.city}</p>}
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Pincode</label>
                        <div className="relative">
                            <FiHash className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="530001"
                                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.postalCode ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            />
                        </div>
                        {errors.postalCode && <p className="text-red-500 text-xs ml-1">{errors.postalCode}</p>}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">State</label>
                    <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${errors.state ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                    </select>
                    {errors.state && <p className="text-red-500 text-xs ml-1">{errors.state}</p>}
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="defaultAddr"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="defaultAddr" className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as default address</label>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <FiCheck /> Save Address
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
