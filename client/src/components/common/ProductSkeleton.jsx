import { motion } from "framer-motion";

export default function ProductSkeleton() {
  return (
    <div style={{ 
      background: "#fff", 
      borderRadius: "20px", 
      border: "1.5px solid #E2EEEC", 
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Shimmer Effect */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
          zIndex: 1,
          pointerEvents: "none"
        }}
      />

      <div style={{ 
        width: "100%", 
        aspectRatio: "1/1", 
        background: "#F4F9F8", 
        borderRadius: "14px", 
        marginBottom: "16px" 
      }} />

      <div style={{ height: "18px", width: "70%", background: "#F4F9F8", borderRadius: "4px", marginBottom: "8px" }} />
      <div style={{ height: "12px", width: "40%", background: "#F4F9F8", borderRadius: "4px", marginBottom: "16px" }} />
      
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: "24px", width: "60px", background: "#F4F9F8", borderRadius: "4px" }} />
        <div style={{ height: "36px", width: "100px", background: "#F4F9F8", borderRadius: "10px" }} />
      </div>
    </div>
  );
}
