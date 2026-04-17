import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be inside SocketProvider");
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);

      // ✅ Join user room for receiving link requests
      const storedUser = localStorage.getItem("safeguard_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        newSocket.emit("join_room", user.id || user._id);
        console.log("🏠 Joined user room:", user.id || user._id);
      }
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
