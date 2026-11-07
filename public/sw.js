const CACHE_NAME = "mountain-ceramics-static-v1";
const OFFLINE_SHELL = "/offline.html";
const STATIC_PREFIXES = [
  "/_next/static/",
  "/brand/",
  "/fonts/",
  "/images/",
  "/logo-trans.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("mountain-ceramics-static-") &&
                key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const responseToCache = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache))
              .catch((error) =>
                console.error("Mountain Ceramics asset cache failed.", error),
              );
          }
          return response;
        });
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlineShell = await caches.match(OFFLINE_SHELL);
        return offlineShell ?? Response.error();
      }),
    );
  }
});
