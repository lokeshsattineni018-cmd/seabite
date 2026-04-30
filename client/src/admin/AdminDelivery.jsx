import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiTruck, FiPlus, FiUser, FiPhone, FiCheckCircle, 
  FiMapPin, FiClock, FiAlertCircle, FiX, FiActivity 
} from "react-icons/fi";
import toast from "react-hot-toast";
import SeaBiteLoader from "../components/common/SeaBiteLoader";

const ease = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.05, duration: 0.6, ease },
  }),
};

export default function AdminDelivery() {
  const [partners, setPartners] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: "", phone: "", vehicleNumber: "", vehicleType: "Bike" });
  const [view, setView] = useState("Board"); // 🟢 Board or Map view

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        axios.get("/api/delivery/partners", { withCredentials: true }),
        axios.get("/api/orders/unassigned", { withCredentials: true })
      ]);
      setPartners(pRes.data);
      setUnassignedOrders(oRes.data);
    } catch (err) {
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPartner = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/delivery/partners", newPartner, { withCredentials: true });
      toast.success("Delivery Partner added!");
      setShowAddModal(false);
      setNewPartner({ name: "", phone: "", vehicleNumber: "", vehicleType: "Bike" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add partner");
    }
  };

  const handleAssign = async (orderId, partnerId) => {
    const t = toast.loading("Assigning order...");
    try {
      await axios.post("/api/delivery/assign", { orderId, partnerId }, { withCredentials: true });
      toast.success("Order Assigned!", { id: t });
      fetchData();
    } catch (err) {
      toast.error("Assignment failed", { id: t });
    }
  };

  if (loading) return <SeaBiteLoader />;

  return (
    <motion.div initial="hidden" animate="visible" className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen font-sans">
      
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200/50 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-light text-stone-900 tracking-tight mb-2">Fleet Management</h1>
          <p className="text-sm text-stone-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {partners.filter(p => p.status === 'Active').length} Riders Online • {unassignedOrders.length} Shipments Ready
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button 
              onClick={() => setView("Board")}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'Board' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Board
            </button>
            <button 
              onClick={() => setView("Map")}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'Map' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Map
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2.5 px-6 py-3 bg-stone-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
          >
            <FiPlus size={16} /> Enlist Rider
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "Board" ? (
          <motion.div 
            key="board"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Dispatch Queue */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <FiActivity className="text-amber-500" size={16} />
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Dispatch Queue</h2>
              </div>

              <div className="space-y-4 max-h-[800px] overflow-y-auto no-scrollbar pb-20">
                {unassignedOrders.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-stone-100 shadow-sm">
                    <FiCheckCircle className="mx-auto mb-3 opacity-10" size={48} />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">All orders dispatched</p>
                  </div>
                ) : (
                  unassignedOrders.map(order => (
                    <motion.div 
                      layoutId={order._id}
                      key={order._id} 
                      className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Order #{order.orderId}</p>
                          <h4 className="text-sm font-bold text-stone-900">{order.shippingAddress?.fullName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-stone-900">₹{order.totalAmount}</p>
                          <p className="text-[9px] text-stone-400 font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-[11px] text-stone-500">
                        <FiMapPin className="shrink-0 mt-0.5 text-rose-400" size={14} />
                        <span className="truncate">{order.shippingAddress?.street}, {order.shippingAddress?.city}</span>
                      </div>

                      <div className="pt-4 border-t border-stone-50">
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-3">Dispatch to Rider</p>
                        <div className="grid grid-cols-1 gap-2">
                          {partners.filter(p => p.status === 'Active').length === 0 ? (
                            <p className="text-[10px] text-rose-400 font-bold italic">No active riders online</p>
                          ) : (
                            partners.filter(p => p.status === 'Active').map(p => (
                              <button 
                                key={p._id}
                                onClick={() => handleAssign(order._id, p._id)}
                                className="w-full text-left p-3 rounded-xl bg-stone-50 border border-stone-100 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all flex items-center justify-between group"
                              >
                                <span className="text-xs font-bold">{p.name}</span>
                                <FiPlus className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Fleet Status */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 px-2">
                <FiTruck className="text-stone-900" size={16} />
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Active Fleet</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {partners.map((p, i) => (
                  <motion.div 
                    key={p._id} 
                    custom={i}
                    className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500">
                          <FiUser size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">{p.name}</h3>
                          <p className="text-[10px] text-stone-400 font-bold flex items-center gap-1 uppercase"><FiPhone size={10} /> {p.phone}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        p.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        p.status === 'On Delivery' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                        'bg-stone-50 text-stone-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-50 mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Vehicle</p>
                        <p className="text-xs font-bold text-stone-800">{p.vehicleType} • {p.vehicleNumber}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">LTD Performance</p>
                        <p className="text-xs font-bold text-stone-800">{p.totalDeliveries || 0} Deliveries</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Deliveries</p>
                      <div className="space-y-2">
                        {p.activeOrders?.length > 0 ? p.activeOrders.map(oid => (
                          <div key={oid} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between text-xs">
                             <span className="font-bold text-stone-800">Order #{oid.slice(-6).toUpperCase()}</span>
                             <span className="text-stone-400 flex items-center gap-1"><FiClock size={12} /> 12m away</span>
                          </div>
                        )) : (
                          <p className="text-[10px] text-stone-400 italic">No active dispatches</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[700px] bg-white rounded-[2.5rem] border border-stone-200 shadow-sm relative overflow-hidden flex flex-col items-center justify-center"
          >
             <FiMapPin size={48} className="text-stone-100 mb-4" />
             <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Live GPS tracking active</p>
             <p className="text-[10px] text-stone-500 mt-2">Connecting to Rider Satellite Uplink...</p>
             
             {/* Mock Map Background */}
             <div className="absolute inset-0 -z-10 opacity-10 grayscale hover:grayscale-0 transition-all duration-1000">
                <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" />
             </div>

             {/* Mock Rider Indicators */}
             {partners.filter(p => p.status === 'Active').map((p, i) => (
                <motion.div 
                  key={p._id}
                  animate={{ 
                    x: [Math.random() * 200, Math.random() * -200, Math.random() * 200],
                    y: [Math.random() * 200, Math.random() * -200, Math.random() * 200]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute p-2 bg-stone-900 text-white rounded-full shadow-2xl border-2 border-white cursor-pointer group"
                >
                  <FiTruck size={14} />
                  <div className="absolute left-full ml-2 bg-stone-900 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <p className="text-[10px] font-bold">{p.name}</p>
                  </div>
                </motion.div>
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Partner Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-xl font-bold text-stone-900">Enlist New Rider</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-200 rounded-xl transition-all"><FiX size={20} /></button>
              </div>
              <form onSubmit={handleAddPartner} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
                  <input required value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-stone-50 border border-stone-200 outline-none focus:bg-white focus:border-stone-900 transition-all text-sm font-medium" placeholder="E.g. Rajesh Kumar" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1">Phone Number</label>
                  <input required value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-stone-50 border border-stone-200 outline-none focus:bg-white focus:border-stone-900 transition-all text-sm font-medium" placeholder="10 Digit Mobile" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1">Vehicle</label>
                    <select value={newPartner.vehicleType} onChange={e => setNewPartner({...newPartner, vehicleType: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-stone-50 border border-stone-200 outline-none focus:bg-white focus:border-stone-900 transition-all text-sm font-medium appearance-none">
                      <option value="Bike">Bike</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Cycle">Cycle</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2 px-1">Plate No.</label>
                    <input required value={newPartner.vehicleNumber} onChange={e => setNewPartner({...newPartner, vehicleNumber: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-stone-50 border border-stone-200 outline-none focus:bg-white focus:border-stone-900 transition-all text-sm font-medium" placeholder="AP 05 XX 0000" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 mt-4">
                  Enlist Member
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
