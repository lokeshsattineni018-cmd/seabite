import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "";
const socket = io(API_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"]
});

export default socket;
