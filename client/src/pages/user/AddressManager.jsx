import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import AddressForm from "../../components/forms/AddressForm";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function AddressManager() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const fetchAddresses = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/user/address`, { withCredentials: true });
            setAddresses(res.data);
        } catch (err) {
            toast.error("Failed to fetch addresses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleCreate = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleEdit = (addr) => {
        setEditingAddress(addr);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await axios.delete(`${API_URL}/api/user/address/${id}`, { withCredentials: true });
            toast.success("Address deleted");
            fetchAddresses();
        } catch (err) {
            toast.error("Failed to delete address");
        }
    };

    const handleSave = async (data) => {
        try {
            if (editingAddress) {
                await axios.put(`${API_URL}/api/user/address/${editingAddress._id}`, data, { withCredentials: true });
                toast.success("Address updated");
            } else {
                await axios.post(`${API_URL}/api/user/address`, data, { withCredentials: true });
                toast.success("Address added");
            }
            setIsModalOpen(false);
            fetchAddresses();
        } catch (err) {
            toast.error("Failed to save address");
        }
    };

    return (
        <div style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #E2EEEC",
            boxShadow: "0 2px 24px rgba(91,168,160,0.08), 0 1px 4px rgba(26,43,53,0.04)",
            padding: "36px 36px",
            marginTop: 24,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 4, height: 20, borderRadius: 2,
                        background: "linear-gradient(180deg, #5BA8A0, #89C2D9)",
                    }} />
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1A2B35", margin: 0 }}>My Addresses</h2>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreate}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 10,
                        background: "#5BA8A0", color: "#fff",
                        fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer"
                    }}
                >
                    <FiPlus size={14} /> Add New
                </motion.button>
            </div>

            {loading ? (
                <p style={{ color: "#8BA5B3", fontSize: 13 }}>Loading addresses...</p>
            ) : addresses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <FiMapPin size={32} style={{ color: "#E2EEEC", marginBottom: 12 }} />
                    <p style={{ color: "#8BA5B3", fontSize: 13, margin: 0 }}>No addresses found.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {addresses.map((addr) => (
                        <div key={addr._id} style={{
                            padding: 16, borderRadius: 14,
                            background: "#F4F9F8", border: "1px solid #E2EEEC",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A2B35" }}>{addr.name}</h4>
                                    {addr.isDefault && (
                                        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: 5, background: "rgba(91,168,160,0.12)", color: "#5BA8A0" }}>Default</span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: "#4A6572", lineHeight: 1.5 }}>
                                    {addr.houseNo}, {addr.street}, {addr.city}, {addr.state} — {addr.postalCode}
                                </p>
                                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8BA5B3", fontWeight: 600 }}>{addr.phone}</p>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <motion.button
                                    whileHover={{ scale: 1.1, color: "#5BA8A0" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleEdit(addr)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#8BA5B3", padding: 6 }}
                                >
                                    <FiEdit2 size={16} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, color: "#E8816A" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDelete(addr._id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#8BA5B3", padding: 6 }}
                                >
                                    <FiTrash2 size={16} />
                                </motion.button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: "fixed", inset: 0,
                        background: "rgba(26,43,53,0.45)", backdropFilter: "blur(10px)",
                        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            style={{ width: "100%", maxWidth: 640 }}
                        >
                            <AddressForm
                                onSave={handleSave}
                                onCancel={() => setIsModalOpen(false)}
                                initialData={editingAddress}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
