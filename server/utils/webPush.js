import webpush from "web-push";
import User from "../models/User.js";

// Load keys from environment or generate them programmatically
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.log("⚠️ No VAPID keys found in environment. Generating temporary ones for local session.");
  const keys = webpush.generateVAPIDKeys();
  vapidPublicKey = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
}

webpush.setVapidDetails(
  "mailto:support@seabite.co.in",
  vapidPublicKey,
  vapidPrivateKey
);

export const getVapidPublicKey = () => vapidPublicKey;

/**
 * Sends a push notification to all subscribed devices of a user
 * @param {string} userId - User model ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {string} [path] - Destination path for click action (e.g. "/profile", "/orders")
 */
export const sendPushNotification = async (userId, title, body, path = "/") => {
  try {
    const user = await User.findById(userId).select("pushSubscriptions");
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      data: { url: path }
    });

    const failedSubscriptions = [];

    const sendPromises = user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payload
        );
      } catch (err) {
        // If subscription is expired/invalid (404 or 410 Gone), mark it for removal
        if (err.statusCode === 404 || err.statusCode === 410) {
          failedSubscriptions.push(sub._id);
        } else {
          console.error("❌ Push notification error for subscription endpoint:", sub.endpoint, err.message);
        }
      }
    });

    await Promise.all(sendPromises);

    // Clean up failed/expired subscriptions from database
    if (failedSubscriptions.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: { _id: { $in: failedSubscriptions } } }
      });
    }
  } catch (err) {
    console.error("❌ sendPushNotification critical failure:", err);
  }
};

/**
 * Broadcasts a push notification to all users subscribed on the platform
 */
export const broadcastPushNotification = async (title, body, path = "/") => {
  try {
    const users = await User.find({ "pushSubscriptions.0": { $exists: true } }).select("pushSubscriptions");
    const broadcastPromises = users.map(user => sendPushNotification(user._id, title, body, path));
    await Promise.all(broadcastPromises);
  } catch (err) {
    console.error("❌ broadcastPushNotification critical failure:", err);
  }
};
