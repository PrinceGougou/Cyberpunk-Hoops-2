// Network-only service worker.
// It keeps the PWA installation lifecycle without retaining page or schedule data.
const OLD_CACHE_PREFIX = "cyberpunk-hoops-";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(OLD_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// No fetch handler on purpose: every request uses the normal network path and
// browser HTTP behavior. React data only lives in the open page's memory.
