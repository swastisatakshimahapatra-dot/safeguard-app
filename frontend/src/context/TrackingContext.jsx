import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const TrackingContext = createContext();

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be inside TrackingProvider");
  return context;
};

export const TrackingProvider = ({ children }) => {
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ✅ Persist count across refresh using localStorage
  const [locationCount, setLocationCount] = useState(() => {
    return parseInt(localStorage.getItem("safeguard_location_count") || "0");
  });

  const watchIdRef = useRef(null);
  const isRestoringRef = useRef(false);

  // ✅ Save count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("safeguard_location_count", locationCount.toString());
  }, [locationCount]);

  // ✅ Restore tracking on app load if was previously active
  useEffect(() => {
    const wasTracking = localStorage.getItem("safeguard_tracking") === "true";
    if (wasTracking) {
      isRestoringRef.current = true;
      startTracking(true);
    }
  }, []);

  const startTracking = (silent = false) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    // Clear existing watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setTracking(true);
    localStorage.setItem("safeguard_tracking", "true");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition([latitude, longitude]);
        setAccuracy(Math.round(accuracy));
        setLastUpdated(new Date());
        // ✅ Increment and persist count
        setLocationCount((prev) => {
          const newCount = prev + 1;
          localStorage.setItem("safeguard_location_count", newCount.toString());
          return newCount;
        });

        try {
          await api.post("/location/update", { latitude, longitude, accuracy });
        } catch (err) {
          console.log("Location save failed:", err.message);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        if (!silent) toast.error("Location access denied");
        stopTracking(true);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );

    if (!silent) toast.success("Live tracking started 📍");
  };

  const stopTracking = (silent = false) => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    setPosition(null);
    setAccuracy(null);
    // ✅ Reset count on stop
    setLocationCount(0);
    localStorage.removeItem("safeguard_tracking");
    localStorage.removeItem("safeguard_location_count");
    if (!silent) toast("Tracking stopped", { icon: "⏸️" });
  };

  useEffect(() => {
    return () => {
      // ✅ Don't clear watch on unmount — let it persist
      // Only clear if explicitly stopped
    };
  }, []);

  return (
    <TrackingContext.Provider
      value={{
        tracking,
        position,
        accuracy,
        lastUpdated,
        locationCount,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};
