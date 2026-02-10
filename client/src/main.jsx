// src/main.jsx
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const GOOGLE_CLIENT_ID =
  "781532512036-kaouiapk5q6akjofr45t7ff7d7t6jm9k.apps.googleusercontent.com";

import { GoogleOAuthProvider } from "@react-oauth/google";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <img src="/logo.png" alt="SeaBite" className="h-12" />
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
