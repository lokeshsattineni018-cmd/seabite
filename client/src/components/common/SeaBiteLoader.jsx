import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SeaBiteLoader = ({ fullScreen = false, small = false }) => {
  const images = ["/auth-fish.png", "/auth-prawn.png", "/auth-crab.png"];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % images.length);
    }, 800); // Fast cycling for loader
    return () => clearInterval(interval);
  }, []);

  const size = small ? 32 : 120;

  const containerStyle = fullScreen
    ? {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }
    : {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      padding: small ? "0" : "60px 0",
    };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes sb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .loader-ring {
          position: absolute;
          width: ${size + (small ? 8 : 40)}px;
          height: ${size + (small ? 8 : 40)}px;
          border: 2px solid rgba(91, 191, 181, 0.05);
          border-top: 2px solid #5BBFB5;
          border-radius: 50%;
          animation: sb-spin 1.2s linear infinite;
        }
        @keyframes sb-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!small && <div className="loader-ring" />}
        
        <div style={{ 
          width: size, 
          height: size, 
          position: "relative",
          animation: small ? "none" : "sb-float 2s ease-in-out infinite"
        }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={idx}
              src={images[idx]}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 10 }}
              transition={{ duration: 0.3 }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "absolute",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.1))"
              }}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SeaBiteLoader;
