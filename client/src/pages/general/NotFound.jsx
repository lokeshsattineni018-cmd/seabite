import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | SeaBite</title>
        <meta name="description" content="The page you are looking for does not exist on SeaBite." />
      </Helmet>
      <div 
        style={{ 
          minHeight: "100vh", 
          background: "#F4F9F8", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          textAlign: "center", 
          padding: "60px 24px", 
          fontFamily: "'Plus Jakarta Sans', sans-serif" 
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');`}</style>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎣</div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "26px", fontWeight: "600", color: "#1A2E2C", marginBottom: "8px" }}>
          Page Not Found
        </h2>
        <p style={{ color: "#6B8F8A", fontSize: "14px", marginBottom: "24px", maxWidth: "400px" }}>
          We couldn't find this page. It may have swum away.
        </p>
        <Link 
          to="/products" 
          style={{ 
            padding: "12px 28px", 
            background: "#1A2E2C", 
            color: "#fff", 
            borderRadius: "10px", 
            textDecoration: "none", 
            fontSize: "13px", 
            fontWeight: "700",
            transition: "opacity 0.2s"
          }}
        >
          Back to Market
        </Link>
      </div>
    </>
  );
}
