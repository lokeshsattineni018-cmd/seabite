import { useEffect, useState } from "react";
import axios from "axios";
import { FiTrash2, FiTag, FiPlus } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "https://seabite-server.vercel.app";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [formData, setFormData] = useState({ code: "", value: "", minOrderAmount: "" });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/coupons`);
      setCoupons(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/coupons`, formData);
      setFormData({ code: "", value: "", minOrderAmount: "" });
      fetchCoupons();
    } catch (err) { alert("Error creating coupon"); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this coupon?")) return;
    await axios.delete(`${API_URL}/api/coupons/${id}`);
    fetchCoupons();
  };

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Manage Coupons</h1>

      {/* CREATE FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FiPlus /> Create New Coupon</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            placeholder="Coupon Code (e.g. FRESH20)" 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
            className="border p-2 rounded-lg uppercase font-bold" required 
          />
          <input 
            type="number" placeholder="Discount % (e.g. 20)" 
            value={formData.value} 
            onChange={e => setFormData({...formData, value: e.target.value})}
            className="border p-2 rounded-lg" required 
          />
          <input 
            type="number" placeholder="Min Order ₹ (Optional)" 
            value={formData.minOrderAmount} 
            onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
            className="border p-2 rounded-lg" 
          />
          <button type="submit" className="bg-blue-600 text-white font-bold rounded-lg py-2 hover:bg-blue-700">Create</button>
        </form>
      </div>

      {/* COUPON LIST */}
      <div className="grid gap-4">
        {coupons.map(coupon => (
          <div key={coupon._id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-blue-500">
            <div>
              <h3 className="text-lg font-black text-slate-800">{coupon.code}</h3>
              <p className="text-sm text-slate-500">{coupon.value}% Off • Min Order: ₹{coupon.minOrderAmount}</p>
            </div>
            <button onClick={() => handleDelete(coupon._id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
              <FiTrash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}