/* Fly Easy service worker: makes the site work offline once it has
   been opened (and as a home-screen app).

   - Pages: network first, so you always see the newest version when
     online; falls back to the saved copy offline.
   - Our CSS/JS/photos: the saved copy shows instantly and a fresh
     copy is fetched behind it, so an edit (even one without a new
     ?v= number) reaches phones by the next visit. Photos are saved
     the first time they are seen; the big globe textures are never
     saved (too heavy).
   - Fonts and the pinned Three.js library: saved copy first (they
     never change at the same URL).

   Bump VERSION when you change which files are pre-saved below, so
   phones throw away the old set. */
const VERSION = "fly-easy-v1";
const SHELL = VERSION + "-shell";
const RUNTIME = VERSION + "-runtime";

const PAGES = [
  "./",
  "index.html",
  "global.html",
  "airports.html",
  "sfo.html",
  "sjc.html",
  "timeblocker.html",
  "packer.html"
];

/* Everything the pages need to render, read from the pages' own
   <link>/<script> tags at install time so the ?v= numbers never go
   stale here. */
const EXTRA = [
  "manifest.webmanifest",
  "images/flyeasy-mark.svg",
  "images/app/icon-192.png",
  "images/app/apple-touch-icon.png",
  "images/globe/earth-day-512.jpg",
  "images/globe/earth-night-512.jpg",
  "images/globe/earth-water.png"      /* with the two above, the globe runs offline (softer detail) */
];

const NEVER_SAVE = /images\/globe\/(?!earth-(day|night)-512|earth-water)/;
const MAX_RUNTIME = 160;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    const assets = new Set(EXTRA);
    for (const page of PAGES) {
      try {
        const res = await clean(await fetch(page, { cache: "no-cache" }));
        if (!res.ok) continue;
        await cache.put(page, res.clone());
        const html = await res.text();
        for (const m of html.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
          const url = m[1];
          if (/^(https?:|data:|\/\/|#|mailto:)/.test(url)) continue;
          if (/\.(css|js|webmanifest|svg|png)(\?|$)/.test(url)) assets.add(url);
        }
      } catch (e) { /* offline during install: the next visit retries */ }
    }
    await Promise.all([...assets].map((url) =>
      cache.add(new Request(url, { cache: "no-cache" })).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k.startsWith("fly-easy-") && !k.startsWith(VERSION))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Safari refuses a page that a service worker answers with a
   redirected response (e.g. GitHub Pages' /Fly-Easy -> /Fly-Easy/),
   so store a clean copy instead. */
async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_RUNTIME; i++) await cache.delete(keys[i]);
}

async function pageRequest(request) {
  const cache = await caches.open(SHELL);
  try {
    const res = await clean(await fetch(request));
    if (res.ok && res.type === "basic") {
      const url = new URL(request.url);
      const name = url.pathname.split("/").pop() || "./";
      cache.put(PAGES.includes(name) ? name : request, res.clone());
    }
    return res;
  } catch (e) {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    return (await cache.match("index.html")) || Response.error();
  }
}

async function savedFirst(request, keep) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (keep && (res.ok || res.type === "opaque")) {
    const cache = await caches.open(RUNTIME);
    cache.put(request, res.clone()).then(() => trim(cache));
  }
  return res;
}

/* Show the saved copy now, refresh it behind for next time. */
async function savedThenRefresh(event, keep) {
  const { request } = event;
  const hit = await caches.match(request);
  const fresh = fetch(request).then(async (res) => {
    if (keep && res.ok) {
      const cache = await caches.open(hit ? await cacheOf(request) : RUNTIME);
      await cache.put(request, res.clone());
      if (!hit) trim(cache);
    }
    return res;
  });
  if (hit) {
    event.waitUntil(fresh.catch(() => {}));
    return hit;
  }
  return fresh;
}

async function cacheOf(request) {
  const shell = await caches.open(SHELL);
  return (await shell.match(request)) ? SHELL : RUNTIME;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate" && url.origin === location.origin) {
    event.respondWith(pageRequest(request));
    return;
  }
  if (url.origin === location.origin) {
    if (request.headers.has("range")) return;
    event.respondWith(savedThenRefresh(event, !NEVER_SAVE.test(url.pathname)));
    return;
  }
  if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(savedThenRefresh(event, true));
    return;
  }
  if (url.hostname === "fonts.gstatic.com" || url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(savedFirst(request, true));
  }
});
