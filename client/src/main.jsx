// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./i18n";
import { GoogleOAuthProvider } from "@react-oauth/google";

import * as Sentry from "@sentry/react";
import { SocketProvider } from "./context/SocketContext";

// Suppress non-error logs in browser console in production
if (import.meta.env.PROD && typeof window !== "undefined") {
  window.console.log = () => {};
  window.console.info = () => {};
  window.console.debug = () => {};
  window.console.warn = () => {};
}

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "https://8bf89d53c7a048a1b65e90d238b704cd@o4500000000000000.ingest.sentry.io/4500000000000000",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

const GOOGLE_CLIENT_ID =
  "781532512036-kaouiapk5q6akjofr45t7ff7d7t6jm9k.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
