import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined") {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
    } catch (err) {
        console.error("Firebase Initialization Error:", err);
    }
} else {
    console.warn("⚠️ Firebase API Key is MISSING in this build.");
    console.log("Check for VITE_FIREBASE_API_KEY in your Vercel/Local environment.");
    console.log("Current Keys Found (Presence Only):", {
        apiKey: !!firebaseConfig.apiKey,
        authDomain: !!firebaseConfig.authDomain,
        projectId: !!firebaseConfig.projectId,
    });
}

export { auth };
export default app;
