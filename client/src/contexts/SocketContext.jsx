import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:9505";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      withCredentials: true,
      // Remove 'secure: true' for local development
      // Only use secure in production with proper SSL
      secure: SOCKET_URL.startsWith('https') || SOCKET_URL.startsWith('wss'),
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const connectToSession = (sessionId) => {
    if (socket && sessionId) {
      socket.emit("join_session", sessionId);
      console.log("Joined session:", sessionId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, connectToSession }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};