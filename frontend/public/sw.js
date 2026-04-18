const CACHE_NAME = "safeguard-v1";
const urlsToCache = [
  "/",
  "/dashboard",
  "/location",
  "/contacts",
  "/alerts",
  "/settings",
];

// ✅ Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Cache opened");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

// ✅ Activate service worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("🗑️ Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// ✅ Fetch - Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      }),
  );
});

// ✅ Handle background sync for SOS
self.addEventListener("sync", (event) => {
  if (event.tag === "emergency-sos") {
    event.waitUntil(sendEmergencySOS());
  }
});

// ✅ Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || "Emergency alert received",
    icon: "/icon-192x192.png",
    badge: "/sos-icon-96x96.png",
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: "emergency-notification",
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View Alert",
      },
      {
        action: "close",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("🆘 SafeGuard Emergency", options),
  );
});

// ✅ Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/dashboard"));
  }
});

// ✅ Function to send SOS
async function sendEmergencySOS() {
  try {
    const token = await getStoredToken();
    const position = await getCurrentPosition();

    const response = await fetch("/api/alert/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: position?.coords.latitude,
        longitude: position?.coords.longitude,
        type: "Volume Button SOS",
      }),
    });

    if (response.ok) {
      self.registration.showNotification("✅ Emergency Alert Sent", {
        body: "Your emergency contacts have been notified",
        icon: "/icon-192x192.png",
        vibrate: [200, 100, 200],
      });
    }
  } catch (error) {
    console.error("❌ Background SOS failed:", error);
  }
}

// Helper functions
function getStoredToken() {
  return new Promise((resolve) => {
    // This will be handled by the main app context
    resolve(null);
  });
}

function getCurrentPosition() {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
    );
  });
}
