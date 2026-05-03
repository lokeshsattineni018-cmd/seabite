import { motion } from "framer-motion";

export default function AnimatedOceanBanner() {
  return (
    <div className="w-full h-48 rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden bg-gradient-to-b from-[#eef2f3] to-[#d4eefc]">
      
      {/* SVG Canvas */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1000 160">
        
        {/* Subtle Wave Layers (Clean & Light) */}
        <motion.path
          d="M0,60 C200,80 300,20 500,60 C700,100 800,40 1000,60 L1000,160 L0,160 Z"
          fill="rgba(255,255,255,0.4)"
          animate={{ x: [0, -20, 0] }}
          transition={{ duration: 20, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.path
          d="M-200,40 C0,10 200,70 400,40 C600,10 800,70 1000,40 L1000,160 L-200,160 Z"
          fill="rgba(255,255,255,0.3)"
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 25, ease: "easeInOut", repeat: Infinity }}
        />

        {/* Soft Sandy Floor */}
        <path d="M0,135 Q250,115 500,140 T1000,125 L1000,160 L0,160 Z" fill="#f3e5ab" opacity="0.8" />
        <path d="M0,145 Q200,138 600,152 T1000,140 L1000,160 L0,160 Z" fill="#e9d6a3" />

        {/* 🦀 Crab - Scuttling on the sand */}
        <motion.g 
          animate={{ x: [400, 450, 400] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          transform="translate(0, 138) scale(0.6)"
        >
          <path d="M10,0 C10,-5 20,-5 20,0 C25,0 30,5 30,10 C30,15 25,20 15,20 C5,20 0,15 0,10 C0,5 5,0 10,0 Z" fill="#ff4d4d" />
          {/* Eyes */}
          <line x1="12" y1="-2" x2="12" y2="-6" stroke="#333" strokeWidth="1" />
          <line x1="18" y1="-2" x2="18" y2="-6" stroke="#333" strokeWidth="1" />
          <circle cx="12" cy="-6" r="1" fill="#333" />
          <circle cx="18" cy="-6" r="1" fill="#333" />
          {/* Claws */}
          <motion.path 
            animate={{ rotate: [0, -20, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            d="M5,5 Q-5,0 -5,8 Q-2,12 5,10" fill="#ff4d4d" 
          />
          <motion.path 
            animate={{ rotate: [0, 20, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
            d="M25,5 Q35,0 35,8 Q32,12 25,10" fill="#ff4d4d" 
          />
        </motion.g>

        {/* 🦐 Prawn - Flicking tail swimming */}
        <motion.g 
          animate={{ 
            x: [900, 700, 900], 
            y: [50, 70, 50],
            rotate: [180, 180, 180] 
          }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          transform="translate(0, 0) scale(0.5)"
        >
          {/* Prawn Body */}
          <path d="M0,0 Q15,-10 30,0 Q15,10 0,0 Z" fill="rgba(255, 127, 80, 0.6)" />
          {/* Segments */}
          <path d="M8,-4 Q15,-10 22,-4" stroke="rgba(255,255,255,0.4)" fill="none" />
          {/* Tail */}
          <motion.path 
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            d="M30,0 L40,-5 L40,5 Z" fill="rgba(255, 127, 80, 0.8)" 
          />
          {/* Feelers */}
          <path d="M0,0 Q-15,-5 -25,-2" stroke="rgba(255, 127, 80, 0.4)" strokeWidth="0.5" fill="none" />
          <path d="M0,0 Q-15,5 -25,2" stroke="rgba(255, 127, 80, 0.4)" strokeWidth="0.5" fill="none" />
        </motion.g>

        {/* 🐟 Fish Group */}
        <motion.g 
          animate={{ x: [0, 50, 0], y: [0, -10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          transform="translate(150, 60) scale(0.7)"
        >
          <path d="M20,10 C20,4 10,2 5,10 C10,18 20,16 20,10 Z" fill="#3b82f6" opacity="0.6" />
          <polygon points="6,10 0,6 0,14" fill="#3b82f6" opacity="0.6" />
          <circle cx="17" cy="8" r="0.8" fill="#fff" />
        </motion.g>

        {/* Rising Bubbles */}
        <motion.circle cx="450" cy="140" r="2" fill="rgba(255,255,255,0.8)"
          animate={{ y: [0, -120], opacity: [0, 1, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }} />
        <motion.circle cx="465" cy="140" r="1.5" fill="rgba(255,255,255,0.6)"
          animate={{ y: [0, -100], opacity: [0, 0.8, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
      </svg>

      {/* Decorative Light Overlay */}
      <div className="absolute inset-0 bg-white/20 pointer-events-none"></div>
    </div>
  );
}
