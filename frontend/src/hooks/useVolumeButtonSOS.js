import { useEffect, useRef } from "react";
import { triggerEmergencyAlert } from "../services/alertService";
import { triggerBackgroundSOS } from "../utils/registerSW";
import toast from "react-hot-toast";

export const useVolumeButtonSOS = () => {
  const pressCountRef = useRef(0);
  const timeoutRef = useRef(null);
  const lastPressRef = useRef(0);

  useEffect(() => {
    const handleVolumePress = async (e) => {
      // ✅ Detect volume button press
      // Volume Up = 175, Volume Down = 174
      if (
        e.keyCode === 175 ||
        e.keyCode === 174 ||
        e.key === "AudioVolumeUp" ||
        e.key === "AudioVolumeDown"
      ) {
        e.preventDefault();

        const now = Date.now();
        const timeSinceLastPress = now - lastPressRef.current;

        // ✅ Reset if more than 2 seconds between presses
        if (timeSinceLastPress > 2000) {
          pressCountRef.current = 0;
        }

        lastPressRef.current = now;
        pressCountRef.current += 1;

        console.log(`🔊 Volume button pressed: ${pressCountRef.current}/5`);

        // ✅ Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // ✅ If 5 presses within 2 seconds = SOS
        if (pressCountRef.current >= 5) {
          console.log("🆘 SOS ACTIVATED via Volume Button!");
          pressCountRef.current = 0;

          // ✅ Vibrate for confirmation
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }

          // ✅ Show toast
          toast.loading("🆘 Triggering Emergency SOS...", {
            id: "volume-sos",
            duration: 5000,
          });

          try {
            // ✅ Get current location
            let locationData = {};

            if (navigator.geolocation) {
              try {
                const position = await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    enableHighAccuracy: true,
                  });
                });

                locationData = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
              } catch (geoError) {
                console.log("⚠️ Location unavailable");
              }
            }

            // ✅ Send alert
            const response = await triggerEmergencyAlert({
              ...locationData,
              type: "Volume Button SOS",
            });

            toast.success(
              `✅ SOS Sent! 📱 WhatsApp: ${response.alert.whatsappSentCount} | 📧 Email: ${response.alert.emailSentCount}`,
              { id: "volume-sos", duration: 6000 },
            );

            // ✅ Also trigger background sync as backup
            await triggerBackgroundSOS();
          } catch (error) {
            console.error("❌ SOS failed:", error);
            toast.error("Failed to send SOS. Retrying in background...", {
              id: "volume-sos",
            });

            // ✅ Try background sync as fallback
            await triggerBackgroundSOS();
          }
        }

        // ✅ Reset count after 2 seconds of no press
        timeoutRef.current = setTimeout(() => {
          if (pressCountRef.current > 0 && pressCountRef.current < 5) {
            console.log(
              `⏱️ Volume SOS cancelled (only ${pressCountRef.current}/5 presses)`,
            );
          }
          pressCountRef.current = 0;
        }, 2000);
      }
    };

    // ✅ Add event listener
    window.addEventListener("keydown", handleVolumePress);
    document.addEventListener("keydown", handleVolumePress);

    return () => {
      window.removeEventListener("keydown", handleVolumePress);
      document.removeEventListener("keydown", handleVolumePress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};
