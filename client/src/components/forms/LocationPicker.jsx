// client/src/components/LocationPicker.jsx (PREMIUM DARK OCEAN UI)

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSearch, FiTarget, FiMapPin, FiCheckCircle, FiXCircle, FiHome, FiNavigation } from "react-icons/fi";

const ALLOWED_STATES = ["Andhra Pradesh", "Telangana", "AP", "TS"];

export default function LocationPicker({ onClose, onSave, currentAddress }) {
    const mapContainerRef = useRef(null);
    const mapInstance = useRef(null);
    const markerInstance = useRef(null);
    
    const [form, setForm] = useState({
        ...currentAddress,
        houseNo: currentAddress.houseNo || ""
    });
    const [isDeliverable, setIsDeliverable] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (mapInstance.current) return;
        
        const initialPos = [17.3850, 78.4867]; 
        mapInstance.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(initialPos, 13);
        
        // Premium Dark Map Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);
        
        // Custom Luminous Marker
        const CustomIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-[#0a1625] shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center text-white"><svg stroke="currentColor" fill="none" stroke-width="3" viewBox="0 0 24 24" height="14" width="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        markerInstance.current = L.marker(initialPos, { draggable: true, icon: CustomIcon }).addTo(mapInstance.current);

        markerInstance.current.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            reverseGeocode(lat, lng);
        });

        detectLocation();
        return () => { if (mapInstance.current) mapInstance.current.remove(); };
    }, []);

    const reverseGeocode = async (lat, lon) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
            const data = await res.json();
            if (data) parseAddress(data);
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}, India&addressdetails=1&limit=1`);
            const data = await res.json();
            if (data && data[0]) {
                const { lat, lon } = data[0];
                mapInstance.current.setView([lat, lon], 16);
                markerInstance.current.setLatLng([lat, lon]);
                parseAddress(data[0]);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const parseAddress = (data) => {
        const addr = data.address || {};
        const newAddress = {
            ...form,
            street: data.display_name,
            city: addr.city || addr.town || addr.village || "",
            state: addr.state || "",
            zip: addr.postcode || "",
        };
        setForm(newAddress);
        const deliverable = ALLOWED_STATES.some(s => newAddress.state.toLowerCase().includes(s.toLowerCase()));
        setIsDeliverable(deliverable);
    };

    const detectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                mapInstance.current.setView([latitude, longitude], 16);
                markerInstance.current.setLatLng([latitude, longitude]);
                reverseGeocode(latitude, longitude);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050b14]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotateX: 15 }} 
                animate={{ opacity: 1, scale: 1, rotateX: 0 }} 
                className="bg-[#0e1d30] w-full max-w-2xl rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/5"
            >
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            placeholder="Search area/colony..." 
                            className="w-full pl-12 pr-4 py-4 bg-[#050b14] rounded-2xl outline-none text-white placeholder:text-slate-600 border border-white/5 focus:border-blue-500/50 transition-all font-medium" 
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="p-3 text-slate-500 hover:text-white transition-colors"
                    >
                        <FiXCircle size={24} />
                    </button>
                </form>

                {/* Map Section */}
                <div className="relative h-64 bg-slate-900">
                    <div ref={mapContainerRef} className="w-full h-full" />
                    <button 
                        onClick={detectLocation} 
                        className="absolute bottom-6 right-6 bg-blue-600 p-4 rounded-2xl shadow-2xl text-white z-[1000] hover:scale-110 active:scale-95 transition-all"
                    >
                        <FiTarget size={24} />
                    </button>
                    {/* Dark gradient overlay for a cinematic feel */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0e1d30] via-transparent to-transparent opacity-40" />
                </div>

                {/* Form Section */}
                <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Receiver Name</label>
                            <input type="text" placeholder="e.g. John Doe" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full bg-[#050b14] border border-white/5 p-4 rounded-xl outline-none text-white text-sm focus:border-blue-500/30" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Contact Link</label>
                            <input type="tel" placeholder="Mobile No." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-[#050b14] border border-white/5 p-4 rounded-xl outline-none text-white text-sm focus:border-blue-500/30" />
                        </div>
                    </div>

                    <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Exact Coordinates</label>
                         <div className="relative">
                            <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                            <input 
                                type="text" 
                                placeholder="House No. / Flat / Floor / Landmark" 
                                value={form.houseNo} 
                                onChange={e => setForm({...form, houseNo: e.target.value})} 
                                className="w-full bg-[#050b14] border border-white/5 pl-12 p-4 rounded-xl outline-none text-white text-sm focus:border-blue-500/50 transition-all font-medium" 
                            />
                         </div>
                    </div>
                    
                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-hidden group">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                            <FiNavigation className="text-blue-500" /> Current Radar Data
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium line-clamp-2 italic">
                            {form.street || "Drag the marker to your precise door..."}
                        </p>
                        {form.zip && <div className="mt-3 text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full w-fit">PIN: {form.zip}</div>}
                    </div>

                    <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest border transition-all ${isDeliverable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {isDeliverable ? <FiCheckCircle size={18} /> : <FiXCircle size={18} />}
                        {isDeliverable ? "Inside Serviceable Zone" : "Outside Delivery Zone (AP/TS Only)"}
                    </div>

                    <motion.button 
                        whileHover={isDeliverable ? { scale: 1.02 } : {}}
                        whileTap={isDeliverable ? { scale: 0.98 } : {}}
                        disabled={!isDeliverable || !form.fullName || !form.phone || !form.houseNo} 
                        onClick={() => onSave(form)} 
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all shadow-2xl ${isDeliverable ? 'bg-white text-slate-900 hover:bg-blue-500 hover:text-white' : 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'}`}
                    >
                        {loading ? "SYNCING..." : "CONFIRM DEPLOYMENT"}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}