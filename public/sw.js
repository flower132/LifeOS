const CACHE_VERSION =
  new URL(self.location.href).searchParams.get("v") || "v1";
const CACHE_NAME = `lifeos-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/home",
  "/objects",
  "/create-object",
  "/create-note",
  "/settings",
  "/manifest.json",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("lifeos-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Never cache _next/ static chunks — always fetch from network
  // This prevents "Failed to load chunk" errors after deployment
  const isNextChunk =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/");

  if (isNextChunk) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests: network-first strategy
  // Always try to get the latest HTML from the server first.
  // Only fall back to cache when offline. This ensures that after a new
  // deployment, the browser loads fresh HTML with up-to-date chunk references
  // instead of serving stale cached HTML that points to non-existent chunks.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest navigation response
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: serve cached page
          return caches.match(request).then(
            (cached) =>
              cached ||
              caches.match("/home") ||
              caches.match("/") ||
              new Response("Offline", { status: 503 })
          );
        })
    );
    return;
  }

  // Other GET requests: cache-first (static assets, images, etc.)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Cache successful same-origin static requests
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback for navigation requests when offline
          if (request.mode === "navigate") {
            return caches.match("/home") || caches.match("/");
          }
        });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action || "open";
  const reminderId = event.notification.data?.reminderId;
  const url = reminderId
    ? `/home?companionAction=${action}&reminderId=${reminderId}`
    : "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const client = clients.find((c) => c.url.includes("/home")) || clients[0];
      if (client) {
        return client.navigate(url).then((c) => c?.focus());
      }
      return self.clients.openWindow(url);
    })
  );
});
