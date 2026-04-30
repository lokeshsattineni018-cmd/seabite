import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export const useTelemetry = () => {
  const location = useLocation();
  const { user } = useAuth();

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
};
