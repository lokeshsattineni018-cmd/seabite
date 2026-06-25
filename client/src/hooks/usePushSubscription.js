import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported and retrieve existing subscription status
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error("Error checking push subscription status:", err);
        }
      }
      setLoading(false);
    };

    checkSupport();
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      const registration = await navigator.serviceWorker.ready;

      // 2. Fetch VAPID public key from backend
      const { data } = await axios.get("/api/notifications/vapid-public-key", { withCredentials: true });
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      // 3. Subscribe with the push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // 4. Save the subscription object on the backend
      await axios.post(
        "/api/notifications/subscribe",
        { subscription },
        { withCredentials: true }
      );

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("❌ Failed to subscribe to push notifications:", err);
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Remove from backend database first
        await axios.post(
          "/api/notifications/unsubscribe",
          { endpoint: subscription.endpoint },
          { withCredentials: true }
        );

        // 2. Unsubscribe locally
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("❌ Failed to unsubscribe from push notifications:", err);
      setLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribeToPush,
    unsubscribeFromPush
  };
}
