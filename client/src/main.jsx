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
