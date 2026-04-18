export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration.scope);

          // ✅ Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60000);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    });
  }
}

// ✅ Request notification permission
export async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return Notification.permission === "granted";
}

// ✅ Trigger background SOS sync
export async function triggerBackgroundSOS() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("emergency-sos");
      console.log("✅ Background SOS sync registered");
      return true;
    } catch (error) {
      console.error("❌ Background sync failed:", error);
      return false;
    }
  }
  return false;
}
