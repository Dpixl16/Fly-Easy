/* Fly Easy service worker: makes the site work offline once it has
   been opened (and as a home-screen app).

   - Pages: opening the site (or reloading) is network first, so you
     always start on the newest version; that also refreshes the saved
     copy of every other page behind the scenes. Moving between pages
     inside the site then shows the saved copy instantly (tab switches
     never wait on the network) and refreshes it again for next time.
     Offline, the saved copy is used throughout.
   - Our CSS/JS/photos: the saved copy shows instantly and a fresh
     copy is fetched behind it, so an edit (even one without a new
     ?v= number) reaches phones by the next visit. Photos are saved
     the first time they are seen; the big globe textures are never
     saved (too heavy).
   - Fonts and the pinned Three.js library: saved copy first (they
     never change at the same URL).

   Bump VERSION when you change which files are pre-saved below, so
   phones throw away the old set. */
const VERSION = "fly-easy-v11";
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
  "packer.html",
  "delays.html"
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

function pageName(request) {
  const name = new URL(request.url).pathname.split("/").pop() || "./";
  return PAGES.includes(name) ? name : null;
}

/* Fetch a page and save it. */
async function fetchPage(request) {
  const res = await clean(await fetch(request));
  if (res.ok && res.type === "basic") {
    const cache = await caches.open(SHELL);
    await cache.put(pageName(request) || request, res.clone());
  }
  return res;
}

/* Re-save every page (at most once a minute), so the copies used for
   instant tab switches are as new as the page you opened. */
let lastRefresh = 0;
async function refreshPages(except) {
  if (Date.now() - lastRefresh < 60000) return;
  lastRefresh = Date.now();
  const cache = await caches.open(SHELL);
  await Promise.all(PAGES.filter((p) => p !== except).map(async (page) => {
    try {
      const res = await clean(await fetch(page, { cache: "no-cache" }));
      if (res.ok && res.type === "basic") await cache.put(page, res);
    } catch (e) { /* offline: keep the copy we have */ }
  }));
}

async function pageRequest(event) {
  const { request } = event;
  const name = pageName(request);
  let inApp = false;
  try { inApp = !!request.referrer && new URL(request.referrer).origin === location.origin; } catch (e) {}

  /* Moving between our own pages: saved copy now, fresh copy behind it. */
  if (inApp && name && request.cache !== "reload" && request.cache !== "no-cache") {
    const cache = await caches.open(SHELL);
    const hit = await cache.match(name);
    if (hit) {
      event.waitUntil(fetchPage(request).catch(() => {}));
      return hit;
    }
  }

  try {
    const res = await fetchPage(request);
    if (!inApp) event.waitUntil(refreshPages(name));
    return res;
  } catch (e) {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    const cache = await caches.open(SHELL);
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
    event.respondWith(pageRequest(event));
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
