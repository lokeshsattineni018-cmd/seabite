import "./AdminLogin.css";
import { useState } from "react";

export default function AdminLogin() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">

        <img src="/logo.png" alt="SeaBite Admin" className="admin-logo" />

        <h2 className="admin-title">Admin Panel Login</h2>
        <p className="admin-sub">Authorized personnel only</p>

        <input type="text" placeholder="Admin Username" className="admin-input" />

        <div className="admin-pass-box">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Admin Password"
            className="admin-input"
          />
          <span
            className="admin-toggle-pass"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? "🙈" : "👁️"}
          </span>
        </div>

        <button className="admin-btn">Login as Admin</button>

        <p className="admin-note">You will be redirected to the Admin Dashboard</p>
      </div>
    </div>
  );
}
