const CACHE_NAME = "focus-flow-shell-v1";
const PRECACHE_ENTRIES = __PRECACHE_ENTRIES__;

const BYPASS_PATHS = [
  /^\/api(?:\/|$)/,
  /^\/auth(?:\/|$)/,
  /^\/oauth(?:\/|$)/,
  /^\/__manus__(?:\/|$)/,
  /^\/manus-storage(?:\/|$)/,
  /^\/download(?:\/|$)/,
];

function isExcludedNavigation(url) {
  return (
    BYPASS_PATHS.some(pattern => pattern.test(url.pathname)) ||
    url.pathname === "/sw.js" ||
    url.pathname === "/manifest.webmanifest" ||
    /\.[^/]+$/.test(url.pathname)
  );
}

function isCacheableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (/^\/assets\//.test(url.pathname) ||
      /\.(?:css|js|woff2?|png|svg|ico)$/.test(url.pathname))
  );
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ENTRIES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith("focus-flow-shell-") && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (isExcludedNavigation(url)) return;
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  if (!isCacheableAsset(url)) return;
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) {
          void caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        }
        return response;
      });
      return cached || network;
    })
  );
});
