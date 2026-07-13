import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export const useTelemetry = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();

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
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        console.log("📍 Telemetry captured GPS coordinates:", coords);
        if (socket) {
          socket.emit("visitor-location", {
            visitorId: guestId,
            userId: user?._id || user?.id || null,
            location: coords
          });
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
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 25000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, user]);
};
