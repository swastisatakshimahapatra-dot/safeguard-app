import { useState, useEffect, useRef } from "react";
import { checkUserInDangerZone } from "../services/dangerZoneService";
import toast from "react-hot-toast";

export const useDangerZoneDetection = (
  userPosition,
  dangerZones,
  socket,
  userId,
) => {
  const [currentDangerZone, setCurrentDangerZone] = useState(null);
  const [isInDangerZone, setIsInDangerZone] = useState(false);
  const lastZoneIdRef = useRef(null);
  const notificationShownRef = useRef(false);

  useEffect(() => {
    if (!userPosition || !dangerZones || dangerZones.length === 0) {
      setIsInDangerZone(false);
      setCurrentDangerZone(null);
      return;
    }

    const [lat, lon] = userPosition;
    const result = checkUserInDangerZone(lat, lon, dangerZones);

    if (result.isInDanger) {
      const zoneId = result.zone.id;

      // ✅ Entered a danger zone
      if (!isInDangerZone || lastZoneIdRef.current !== zoneId) {
        console.log("⚠️ ENTERED DANGER ZONE:", result.zone.name);

        setIsInDangerZone(true);
        setCurrentDangerZone(result.zone);
        lastZoneIdRef.current = zoneId;

        // ✅ Show warning only once per zone
        if (!notificationShownRef.current || lastZoneIdRef.current !== zoneId) {
          notificationShownRef.current = true;

          // ✅ Vibrate
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
          }

          // ✅ Show toast (will be custom component)
          toast.error(
            `⚠️ DANGER ZONE: ${result.zone.name}\nRisk: ${result.zone.currentRisk.toUpperCase()}`,
            {
              duration: 10000,
              id: `danger-${zoneId}`,
            },
          );

          // ✅ Notify family via socket
          if (socket && userId) {
            socket.emit("danger_zone_entry", {
              userId,
              zoneName: result.zone.name,
              riskLevel: result.zone.currentRisk,
              latitude: lat,
              longitude: lon,
              timestamp: new Date(),
            });
          }
        }
      }
    } else {
      // ✅ Exited danger zone
      if (isInDangerZone) {
        console.log("✅ EXITED DANGER ZONE");

        setIsInDangerZone(false);
        setCurrentDangerZone(null);
        lastZoneIdRef.current = null;
        notificationShownRef.current = false;

        toast.success("✅ You exited the danger zone", {
          duration: 3000,
        });

        // ✅ Notify family
        if (socket && userId) {
          socket.emit("danger_zone_exit", {
            userId,
            timestamp: new Date(),
          });
        }
      }
    }
  }, [userPosition, dangerZones, socket, userId, isInDangerZone]);

  return {
    isInDangerZone,
    currentDangerZone,
  };
};
