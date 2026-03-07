import { useState } from "react";
import { FiMapPin, FiNavigation, FiCheck, FiX, FiLoader, FiHome, FiSmartphone, FiUser, FiMap, FiHash } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import StripeInput from "../stripe/StripeInput";

const T = {
    bg: "#F4F9F8", surface: "#ffffff", border: "#E2EEEC",
    textDark: "#1A2B35", textMid: "#4A6572", textLite: "#8BA5B3",
    primary: "#5BA8A0", sky: "#89C2D9", coral: "#E8816A",
};
const font = "'Plus Jakarta Sans', sans-serif";

const ALLOWED_STATES = ["Andhra Pradesh", "Telangana", "AP", "TS"];

// Shared input style builder
const inputStyle = (hasError) => ({
    width: "100%", boxSizing: "border-box",
    paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
    borderRadius: 12,
    border: `1.5px solid ${hasError ? T.coral : T.border}`,
    background: T.bg,
    fontSize: 13, fontWeight: 500, color: T.textDark,
    outline: "none", fontFamily: font,
    transition: "border-color 0.2s",
});

const inputNoPadStyle = (hasError) => ({
    ...inputStyle(hasError),
    paddingLeft: 14,
});

const labelStyle = {
    fontSize: 9, fontWeight: 800, color: T.textLite,
    textTransform: "uppercase", letterSpacing: "0.14em",
    display: "block", marginBottom: 6,
};

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

    const detectLocation = () => {
        if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
                    );
                    const data = await res.json();
                    if (data?.address) {
                        const addr = data.address;
                        const state = addr.state || "";
                        const isAllowed = ALLOWED_STATES.some(s => state.toLowerCase().includes(s.toLowerCase()));
                        if (!isAllowed) toast.error(`Service not available in ${state}. Only AP & Telangana.`);
                        setFormData(prev => ({
                            ...prev,
                            street: data.display_name.split(",")[0],
                            city: addr.city || addr.town || addr.village || addr.county || "",
                            state,
                            postalCode: addr.postcode || "",
                        }));
                        toast.success("Location detected!");
                    }
                } catch { toast.error("Failed to fetch location."); }
                finally { setDetecting(false); }
            },
            () => { toast.error("Unable to retrieve location."); setDetecting(false); }
        );
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.phone || formData.phone.length < 10) newErrors.phone = "Valid phone required";
        if (!formData.houseNo) newErrors.houseNo = "House No is required";
        if (!formData.street) newErrors.street = "Street/Area is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.postalCode) newErrors.postalCode = "Pincode is required";
        const isAllowed = ALLOWED_STATES.some(s => formData.state.toLowerCase().includes(s.toLowerCase()));
        if (!isAllowed) newErrors.state = "Delivery only in AP & Telangana";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) onSave(formData);
        else toast.error("Please fix the errors");
    };

    const Field = ({ label, error, children }) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {label && <label style={labelStyle}>{label}</label>}
            {children}
            {error && <p style={{ fontSize: 10, color: T.coral, marginTop: 4, fontWeight: 600 }}>{error}</p>}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
                background: T.surface, borderRadius: 22, padding: 28,
                boxShadow: "0 8px 48px rgba(26,43,53,0.12)",
                border: `1px solid ${T.border}`, fontFamily: font,
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.textDark, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(91,168,160,0.1)", color: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FiMapPin size={15} />
                    </div>
                    {initialData._id ? "Edit Address" : "Add New Address"}
                </h3>
                <button onClick={onCancel} style={{ color: T.textLite, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <FiX size={20} />
                </button>
            </div>

            {/* Detect Location */}
            <button
                type="button"
                onClick={detectLocation}
                disabled={detecting}
                style={{
                    width: "100%", marginBottom: 20,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px 20px", borderRadius: 14,
                    background: "rgba(91,168,160,0.08)", color: T.primary,
                    border: `1.5px solid rgba(91,168,160,0.22)`,
                    fontSize: 13, fontWeight: 700, cursor: detecting ? "not-allowed" : "pointer",
                    fontFamily: font, transition: "all 0.2s",
                }}
            >
                {detecting ? <FiLoader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <FiNavigation size={14} />}
                Use My Current Location
            </button>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Name + Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field error={errors.name}>
                        <StripeInput
                            label="Full Name"
                            Icon={FiUser}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ borderColor: errors.name ? T.coral : undefined }}
                        />
                    </Field>
                    <Field error={errors.phone}>
                        <StripeInput
                            label="Phone Number"
                            Icon={FiSmartphone}
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            style={{ borderColor: errors.phone ? T.coral : undefined }}
                        />
                    </Field>
                </div>

                {/* House No */}
                <Field error={errors.houseNo}>
                    <StripeInput
                        label="House No / Flat / Building"
                        Icon={FiHome}
                        value={formData.houseNo}
                        onChange={e => setFormData({ ...formData, houseNo: e.target.value })}
                        style={{ borderColor: errors.houseNo ? T.coral : undefined }}
                    />
                </Field>

                {/* Street */}
                <Field error={errors.street}>
                    <StripeInput
                        label="Street / Area / Colony"
                        Icon={FiMap}
                        value={formData.street}
                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                        style={{ borderColor: errors.street ? T.coral : undefined }}
                    />
                </Field>

                {/* City + Pincode */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field error={errors.city}>
                        <StripeInput
                            label="City"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            style={{ borderColor: errors.city ? T.coral : undefined }}
                        />
                    </Field>
                    <Field error={errors.postalCode}>
                        <StripeInput
                            label="Pincode"
                            Icon={FiHash}
                            value={formData.postalCode}
                            onChange={e => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            style={{ borderColor: errors.postalCode ? T.coral : undefined }}
                        />
                    </Field>
                </div>

                {/* State */}
                <Field label="State" error={errors.state}>
                    <select value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        style={{ ...inputNoPadStyle(errors.state), appearance: "none", paddingRight: 14 }}>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                    </select>
                </Field>

                {/* Default checkbox */}
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                    <div
                        onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                        style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            border: `1.5px solid ${formData.isDefault ? T.primary : T.border}`,
                            background: formData.isDefault ? T.primary : T.surface,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", transition: "all 0.18s",
                        }}>
                        {formData.isDefault && <FiCheck size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>Set as default address</span>
                </label>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                    <button type="button" onClick={onCancel}
                        style={{
                            flex: 1, padding: "13px 20px", borderRadius: 14, fontWeight: 700, fontSize: 13,
                            color: T.textMid, background: T.bg, border: `1px solid ${T.border}`,
                            cursor: "pointer", fontFamily: font,
                        }}>
                        Cancel
                    </button>
                    <motion.button type="submit" whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(91,168,160,0.28)" }} whileTap={{ scale: 0.97 }}
                        style={{
                            flex: 2, padding: "13px 20px", borderRadius: 14, fontWeight: 700, fontSize: 13,
                            color: "#fff", background: T.primary, border: "none",
                            cursor: "pointer", fontFamily: font,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            boxShadow: "0 4px 16px rgba(91,168,160,0.22)",
                        }}>
                        <FiCheck size={14} strokeWidth={3} /> Save Address
                    </motion.button>
                </div>
            </form>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
    );
}
