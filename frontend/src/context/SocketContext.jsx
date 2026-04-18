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
    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      },
    );

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);

      const storedUser = localStorage.getItem("safeguard_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userId = user.id || user._id;

          // ✅ Only emit if userId exists
          if (userId) {
            newSocket.emit("join_room", userId);
            console.log("🏠 Joined user room:", userId);
          }
        } catch (err) {
          console.log("Failed to parse user from storage");
        }
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
