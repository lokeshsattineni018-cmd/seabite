import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
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
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-semibold text-gray-900">My Addresses</h3>
                <button 
                    onClick={handleCreate} 
                    className="text-blue-600 font-medium hover:bg-blue-50 py-2 px-4 rounded-xl transition-colors text-sm flex items-center gap-2"
                >
                    <FiPlus size={16} /> Add New Address
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading addresses...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div key={addr._id} className="relative p-5 rounded-2xl bg-white border border-gray-200/60 shadow-sm flex flex-col justify-between group transition-all hover:border-blue-200">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-sm font-bold text-gray-900">{addr.name}</h4>
                                    {addr.isDefault && (
                                        <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                                    {addr.houseNo}, {addr.street}<br/>
                                    {addr.city}, {addr.state} — {addr.postalCode}
                                </p>
                                <p className="text-xs font-semibold text-gray-600">{addr.phone}</p>
                            </div>
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(addr)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <FiEdit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(addr._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl"
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
