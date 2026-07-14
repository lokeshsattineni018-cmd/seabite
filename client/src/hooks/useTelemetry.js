import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export const useTelemetry = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const lastRestUpdate = useRef(0);
  const [promoOffer, setPromoOffer] = useState(null);

  useEffect(() => {
    let guestId = localStorage.getItem("seabite_guest_id");
    if (!guestId) {
      guestId = "Guest_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("seabite_guest_id", guestId);
    }

    const pingTelemetry = async () => {
      try {
        await axios.post(`${API_URL}/api/telemetry/ping`, {
          visitorId: guestId,
          userId: user?._id || null,
          currentPath: location.pathname + location.search,
        });
      } catch (err) {
        // Silently fail for telemetry to avoid polluting console for users
      }
    };

    pingTelemetry();
  }, [location.pathname, location.search, user]);

  // ── LIVE LOCATION STREAMING ──
  useEffect(() => {
    if (!navigator.geolocation) return;

    let guestId = localStorage.getItem("seabite_guest_id");
    if (!guestId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        console.log("📍 Telemetry captured GPS coordinates:", coords);
        
        let resolvedCity = "Unknown";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`
          );
          const addrData = await res.json();
          if (addrData && addrData.address) {
            const addr = addrData.address;
            resolvedCity = addr.city || addr.town || addr.village || addr.county || "Unknown";
            if (addr.state) resolvedCity += `, ${addr.state}`;
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }

        // 1. WebSocket stream (real-time instant)
        if (socket) {
          socket.emit("visitor-location", {
            visitorId: guestId,
            userId: user?._id || user?.id || null,
            location: coords,
            city: resolvedCity
          });
        }

        // 2. Throttled REST API update fallback (once every 10 seconds)
        const now = Date.now();
        if (now - lastRestUpdate.current > 10000) {
          lastRestUpdate.current = now;
          axios.post(`${API_URL}/api/telemetry/location-update`, {
            visitorId: guestId,
            userId: user?._id || user?.id || null,
            lat: coords.lat,
            lng: coords.lng,
            city: resolvedCity
          }).catch(() => {});
        }
      },
      (err) => {
        console.error("Telemetry location access status:", err.message);
        if (socket) {
          socket.emit("visitor-location-error", {
            visitorId: guestId,
            code: err.code
          });
        }

        // Fallback REST error logging (once every 15 seconds)
        const now = Date.now();
        if (now - lastRestUpdate.current > 15000) {
          lastRestUpdate.current = now;
          axios.post(`${API_URL}/api/telemetry/location-update`, {
            visitorId: guestId,
            locationError: err.code
          }).catch(() => {});
        }
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 25000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, user]);

  // ── SCROLL TELEMETRY KEEP-ALIVE ──
  useEffect(() => {
    let guestId = localStorage.getItem("seabite_guest_id");
    if (!guestId) return;

    let lastScrollTime = 0;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime > 45000) { // Throttle keep-alive scroll ping to once every 45s
        lastScrollTime = now;
        axios.post(`${API_URL}/api/telemetry/ping`, {
          visitorId: guestId,
          userId: user?._id || null,
          currentPath: window.location.pathname + window.location.search,
        }).catch(() => {});
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  // ── REGISTER SOCKET & LISTEN FOR PROMO OFFERS ──
  useEffect(() => {
    if (!socket) return;
    let guestId = localStorage.getItem("seabite_guest_id");
    if (!guestId) return;

    // Register visitor on connect
    socket.emit("register-visitor", { visitorId: guestId });

    // Listen for promo pushes
    socket.on("RECEIVE_PROMO_OFFER", (offer) => {
      console.log("🎁 Received real-time promo offer from admin:", offer);
      setPromoOffer(offer);
    });

    return () => {
      socket.off("RECEIVE_PROMO_OFFER");
    };
  }, [socket]);

  return {
    promoOffer,
    clearPromoOffer: () => setPromoOffer(null)
  };
};
