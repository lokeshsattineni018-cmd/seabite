import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "";
const isProd = import.meta.env.PROD || (typeof window !== "undefined" && (window.location.hostname.includes("seabite.co.in") || window.location.hostname.includes("vercel.app") || window.location.hostname !== "localhost"));

let socket;

if (isProd) {
  socket = {
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {},
    connect: () => {},
    connected: false
  };
} else {
  socket = io(API_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"]
  });
}

export default socket;
