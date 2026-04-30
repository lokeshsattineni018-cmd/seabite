import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const GoogleOneTap = () => {
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) return; // Don't show if already logged in

    const handleOneTapResponse = async (response) => {
      try {
        const { data } = await axios.post("/api/auth/google", {
          token: response.credential,
        });
        
        // Success: Log user in
        setUser(data.user);
        window.location.reload(); // Refresh to sync state
      } catch (error) {
        console.error("Google One Tap login failed", error);
      }
    };

    const initializeOneTap = () => {
      try {
        if (!window.google?.accounts?.id) {
          console.warn("Google One Tap: Library not fully loaded yet.");
          return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.warn("Google One Tap: Missing VITE_GOOGLE_CLIENT_ID");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleOneTapResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true, // 🟢 FedCM Migration
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.warn("One Tap not displayed:", notification.getNotDisplayedReason());
          }
        });
      } catch (err) {
        console.error("Google One Tap Initialization Error:", err);
      }
    };

    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Small delay to ensure internal Google objects are initialized
        setTimeout(initializeOneTap, 100);
      };
      document.head.appendChild(script);
    }
  }, [user, setUser]);

  return null;
};

export default GoogleOneTap;
