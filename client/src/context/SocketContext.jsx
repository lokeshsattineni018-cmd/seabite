import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeUsers, setActiveUsers] = useState(0);

    useEffect(() => {
        // Determine URL: Use specific URL if in production, else auto-detect (for proxy)
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

        // console.log("🔌 Initializing Socket Connection to:", socketUrl);

        // Force polling on Vercel due to Serverless limitations on WebSockets
        const isVercel = socketUrl.includes('vercel.app') || window.location.hostname.includes('seabite.co.in');

        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: isVercel ? ['polling'] : ['websocket', 'polling'], // Fallback options
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            // console.log("✅ Socket Connected:", newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            // console.log("⚠️ Socket Disconnected");
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            // console.error("❌ Socket Connection Error:", err.message);
        });

        // Global listener for active users
        newSocket.on('USER_COUNT_UPDATE', (count) => {
            setActiveUsers(count);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, activeUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
