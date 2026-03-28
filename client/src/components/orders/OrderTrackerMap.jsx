import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

export default function OrderTrackerMap({ orderStatus }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default SeaBite Hub (e.g., Mumbai / Coastal)
    const storeLocation = [19.0760, 72.8777];
    // Simulated customer location nearby
    const customerLocation = [19.1020, 72.8900];

    // Initialize map
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(storeLocation, 12);

    mapRef.current = map;

    // Add a custom Mapbox / Carto dark/premium tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom Icons
    const storeIcon = L.divIcon({
      html: `<div style="background:#1A2E2C;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:2px solid #fff;">🏪</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const homeIcon = L.divIcon({
      html: `<div style="background:#5BBFB5;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 4px 12px rgba(91,191,181,0.4);border:2px solid #fff;">📍</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const deliveryIcon = L.divIcon({
      html: `<div style="background:#F07468;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 6px 16px rgba(240,116,104,0.4);border:2px solid #fff; z-index: 1000;">🚚</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker(storeLocation, { icon: storeIcon }).addTo(map);
    L.marker(customerLocation, { icon: homeIcon }).addTo(map);

    // Draw route
    const latlngs = [storeLocation, [19.0850, 72.8850], customerLocation];
    L.polyline(latlngs, { color: '#5BBFB5', weight: 4, dashArray: '10, 10', opacity: 0.8 }).addTo(map);

    // Fit bounds
    map.fitBounds(L.latLngBounds(storeLocation, customerLocation).pad(0.3));

    // Marker animation based on status
    const isOutForDelivery = orderStatus === "Shipped" || orderStatus === "Processing";
    const isDelivered = orderStatus === "Delivered";

    let truckPos = storeLocation;
    if (isDelivered) truckPos = customerLocation;
    else if (isOutForDelivery) truckPos = latlngs[1]; // halfway

    const truckMarker = L.marker(truckPos, { icon: deliveryIcon, zIndexOffset: 1000 }).addTo(map);

    // If out for delivery, simulate movement
    if (isOutForDelivery) {
      let progress = 0;
      const animateRoute = () => {
        progress += 0.002;
        if (progress > 1) return;
        
        // Simple linear interpolation between middle point and destination
        const start = latlngs[1];
        const end = customerLocation;
        const currentLat = start[0] + (end[0] - start[0]) * progress;
        const currentLng = start[1] + (end[1] - start[1]) * progress;
        
        truckMarker.setLatLng([currentLat, currentLng]);
        requestAnimationFrame(animateRoute);
      };
      
      // small delay before starting animation
      setTimeout(() => requestAnimationFrame(animateRoute), 1500);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [orderStatus]);

  return (
    <div style={{ position: "relative", width: "100%", height: "260px", borderRadius: "16px", overflow: "hidden", background: "#F4F9F8", border: "1px solid #E2EEEC" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", zIndex: 10 }} />
      {/* Overlay gradient to blend borders */}
      <div style={{ pointerEvents: "none", position: "absolute", inset: 0, border: "1px solid rgba(0,0,0,0.05)", borderRadius: "16px", zIndex: 20, boxShadow: "inset 0 0 20px rgba(0,0,0,0.03)" }} />
    </div>
  );
}
