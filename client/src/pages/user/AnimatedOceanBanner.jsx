import { motion } from "framer-motion";

export default function AnimatedOceanBanner() {
  return (
    <div className="w-full h-40 rounded-2xl border border-gray-200/60 shadow-sm relative overflow-hidden bg-gradient-to-b from-[#0a2e3f] via-[#105268] to-[#1a859e]">
      
      {/* SVG Canvas */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1000 160">
        
        {/* Subtle Wave Layers (Deep) */}
        <motion.path
          d="M0,60 C200,80 300,20 500,60 C700,100 800,40 1000,60 L1000,160 L0,160 Z"
          fill="rgba(255,255,255,0.04)"
          animate={{ x: [0, -40, 0] }}
          transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.path
          d="M-200,40 C0,10 200,70 400,40 C600,10 800,70 1000,40 L1000,160 L-200,160 Z"
          fill="rgba(255,255,255,0.06)"
          animate={{ x: [0, 40, 0] }}
          transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
        />

        {/* Sandy Floor */}
        <path d="M0,135 Q250,110 500,140 T1000,120 L1000,160 L0,160 Z" fill="#cba265" opacity="0.9" />
        <path d="M0,145 Q200,135 600,150 T1000,135 L1000,160 L0,160 Z" fill="#b98d4d" />

        {/* Coral Group - Left */}
        <g transform="translate(120, 85)">
          {/* Main coral branch */}
          <path d="M20,60 Q15,40 5,20 Q15,25 20,40 Q25,10 30,0 Q30,20 28,45 Q40,15 45,10 Q38,35 32,55 Z" fill="#ff7a59" />
          <path d="M25,60 Q20,45 15,30 Q25,35 25,50 Q35,25 40,15 Q30,40 28,60 Z" fill="#e65a3c" />
          {/* Secondary coral branch */}
          <path d="M-10,60 Q-20,40 -35,30 Q-20,38 -15,50 Q-5,25 0,15 Q-5,40 -8,58 Z" fill="#ff9c85" />
          
          {/* Rising Bubbles */}
          <motion.circle cx="28" cy="10" r="2.5" fill="rgba(255,255,255,0.6)"
            animate={{ y: [0, -70], opacity: [0, 0.8, 0], x: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.2 }} />
          <motion.circle cx="-5" cy="20" r="1.5" fill="rgba(255,255,255,0.5)"
            animate={{ y: [0, -60], opacity: [0, 0.6, 0], x: [0, 5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }} />
          <motion.circle cx="15" cy="30" r="2" fill="rgba(255,255,255,0.4)"
            animate={{ y: [0, -80], opacity: [0, 0.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 2.8 }} />
        </g>

        {/* Clownfish */}
        <motion.g 
          animate={{ x: [0, 30, 0], y: [0, -8, 0] }} 
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          transform="translate(160, 95)"
        >
          {/* Fish Body */}
          <path d="M25,10 C25,4 12,2 5,10 C12,18 25,16 25,10 Z" fill="#ff8c00" />
          {/* Tail */}
          <polygon points="7,10 0,5 0,15" fill="#ff8c00" />
          {/* White stripes */}
          <path d="M12,4 Q15,10 12,16" stroke="white" strokeWidth="2.5" fill="none" />
          <path d="M20,6 Q22,10 20,14" stroke="white" strokeWidth="2" fill="none" />
          {/* Eye */}
          <circle cx="22" cy="8" r="1" fill="#111" />
        </motion.g>

        {/* Starfish - Right of center */}
        <g transform="translate(680, 135) scale(0.65)">
          <path d="M25,0 L31,14 L46,15 L35,24 L39,38 L25,30 L11,38 L15,24 L4,15 L19,14 Z" fill="#ffb84d" />
          <circle cx="25" cy="22" r="3" fill="#e69524" />
          <circle cx="25" cy="14" r="1" fill="#e69524" />
          <circle cx="18" cy="26" r="1" fill="#e69524" />
          <circle cx="32" cy="26" r="1" fill="#e69524" />
        </g>

        {/* Seashell - Far Right */}
        <g transform="translate(850, 132) scale(0.8)">
          <path d="M15,22 C10,5 30,5 25,22 C35,28 5,28 15,22 Z" fill="#ffeadd" />
          {/* Shell ridges */}
          <path d="M15,22 L20,8" stroke="#dcb7a1" strokeWidth="1" fill="none" />
          <path d="M25,22 L20,8" stroke="#dcb7a1" strokeWidth="1" fill="none" />
          <path d="M10,24 L17,11" stroke="#dcb7a1" strokeWidth="1" fill="none" />
          <path d="M30,24 L23,11" stroke="#dcb7a1" strokeWidth="1" fill="none" />
        </g>

        {/* Ambient Light/Gradient overlay */}
        <linearGradient id="oceanLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <rect width="100%" height="100%" fill="url(#oceanLight)" pointerEvents="none" />
      </svg>
    </div>
  );
}
