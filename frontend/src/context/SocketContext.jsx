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

  // ✅ Store nearby alerts in context so Dashboard + AlertHistory both access them
  const [nearbyAlerts, setNearbyAlerts] = useState([]);

  // ✅ Store helper actions received by victim
  const [helperActions, setHelperActions] = useState([]);

  useEffect(() => {
    const newSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { transports: ["websocket"] },
    );

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setConnected(true);

      const storedUser = localStorage.getItem("safeguard_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userId = user.id || user._id;
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

    // ✅ Receive nearby emergency alert
    newSocket.on("nearby_emergency", (data) => {
      console.log("🆘 Nearby emergency received:", data);
      // ✅ Add to nearbyAlerts state - Dashboard + AlertHistory will read this
      setNearbyAlerts((prev) => {
        // Avoid duplicates
        const exists = prev.some(
          (a) => a.nearbyAlertId?.toString() === data.nearbyAlertId?.toString(),
        );
        if (exists) return prev;
        return [data, ...prev];
      });
    });

    // ✅ Receive helper action (victim receives this)
    newSocket.on("helper_action", (data) => {
      console.log("🤝 Helper action received:", data);
      setHelperActions((prev) => {
        const exists = prev.some(
          (a) =>
            a.helperActionId?.toString() === data.helperActionId?.toString(),
        );
        if (exists) return prev;
        return [data, ...prev];
      });
    });

    // ✅ Nearby alert expired (24hr TTL - notify user)
    newSocket.on("nearby_alert_expired", (data) => {
      console.log("⏰ Nearby alert expired:", data);
      setNearbyAlerts((prev) =>
        prev.filter(
          (a) => a.nearbyAlertId?.toString() !== data.nearbyAlertId?.toString(),
        ),
      );
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // ✅ Function to mark alert as seen (called from Dashboard or AlertHistory)
  const removeNearbyAlertFromDashboard = (nearbyAlertId) => {
    setNearbyAlerts((prev) =>
      prev.filter(
        (a) => a.nearbyAlertId?.toString() !== nearbyAlertId?.toString(),
      ),
    );
  };

  // ✅ Function to add nearby alert (called when fetched from DB on mount)
  const setInitialNearbyAlerts = (alerts) => {
    setNearbyAlerts(alerts);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        nearbyAlerts,
        helperActions,
        removeNearbyAlertFromDashboard,
        setInitialNearbyAlerts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
