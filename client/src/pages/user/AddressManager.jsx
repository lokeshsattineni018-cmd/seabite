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
        <div>
            <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Delivery Addresses</h3>
                <button 
                    onClick={handleCreate} 
                    className="text-gray-900 font-semibold hover:bg-gray-100 py-2.5 px-5 rounded-2xl transition-all text-xs uppercase tracking-wider ring-1 ring-gray-900/5 flex items-center gap-2"
                >
                    <FiPlus size={14} /> Add New
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <p className="text-sm text-gray-400 font-medium">Fetching secure addresses...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {addresses.length === 0 ? (
                        <div className="col-span-full py-16 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                             <FiMapPin className="mx-auto text-gray-300 mb-3" size={32} />
                             <p className="text-sm text-gray-400 font-medium">No addresses saved yet.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr._id} className="relative p-6 rounded-3xl bg-white ring-1 ring-gray-900/5 flex flex-col justify-between group transition-all hover:ring-gray-900/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">{addr.name}</h4>
                                        {addr.isDefault && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed font-medium mb-3">
                                        {addr.houseNo}, {addr.street}<br/>
                                        {addr.city}, {addr.state} — {addr.postalCode}
                                    </p>
                                    <div className="flex items-center gap-2 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                                        {addr.phone}
                                    </div>
                                </div>
                                <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <button onClick={() => handleEdit(addr)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                        <FiEdit2 size={15} />
                                    </button>
                                    <button onClick={() => handleDelete(addr._id)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
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

