/* ============================================================
   Airports — globe navigation (airports.html)

   Two layers, so the page never breaks:
     1. Directory UI (always): search combobox,
        "All airport guides" list. Plain DOM, no dependencies.
     2. Globe (enhancement): Three.js is loaded with a dynamic
        import. If WebGL, the CDN or the textures fail, the page
        drops into "fallback" mode (search + list) instead.

   Airports come from window.FLY_EASY_AIRPORTS (airports-data.js).
   ============================================================ */

const AIRPORTS = (window.FLY_EASY_AIRPORTS || []).map((a) => ({
  ...a,
  id: a.iata.toLowerCase(),
  _search: fold([a.iata, a.icao, a.name, a.city, a.region].join(" ")),
}));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (id) => document.getElementById(id);
const stage = $("ap-stage");
const input = $("ap-search-input");
const listbox = $("ap-search-list");
const statusEl = $("ap-status");

let globe = null;          // set once the 3D globe is up
let selected = null;       // the airport being flown to

/* ---------------- helpers ---------------- */
function fold(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function setStatus(text) { statusEl.textContent = text || ""; }

/* ---------------- "All airport guides" list ---------------- */
(function buildList() {
  const ul = $("ap-list");
  AIRPORTS.forEach((a) => {
    const li = el("li", "ap-list__item");
    const link = el("a");
    link.href = a.page;
    const photo = el("div", "ap-list__photo");
    photo.style.backgroundImage = `url('${a.photo}')`;
    if (a.photoPos) photo.style.backgroundPosition = a.photoPos;
    const body = el("div", "ap-list__body");
    body.append(
      el("p", "ap-list__codes", `${a.iata} · ${a.icao}`),
      el("h3", "ap-list__name", a.name),
      el("p", "ap-list__city", `${a.city} · ${a.region}`)
    );
    link.append(photo, body);
    li.append(link);
    ul.append(li);
  });
})();

/* ---------------- One-click landing ----------------
   Click an airport (pin, search result or deep link) and it all happens
   in one go: the globe turns and descends toward the airport while a
   mini plane flies in from the edge of the screen, banks along its
   contrail, drops its shadow onto the runway and touches down on the
   pin. Clouds close over the landing and the guide page parts them. */
const flight = $("ap-flight");
const trailCanvas = $("ap-flight-trail");
const planeEl = $("ap-flight-plane");
const shadowEl = $("ap-flight-shadow");
const touchEl = $("ap-flight-touch");
const strip = $("ap-strip");
let leaving = false;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function showStrip(a) {
  $("ap-strip-code").textContent = a.iata;
  $("ap-strip-name").textContent = a.name;
  $("ap-strip-city").textContent = `${a.city} · ${a.region}`;
  strip.hidden = false;
  requestAnimationFrame(() => strip.classList.add("is-on"));
}

function goTo(a) {
  try { sessionStorage.setItem("fe-how", "clouds"); } catch (e) {}
  location.href = a.page;
}

function land(a) {
  if (leaving) return;
  closeList();
  input.blur();
  if (!globe) { location.href = a.page; return; }
  if (reduceMotion) {
    // no flight: a calm fade straight to the guide
    leaving = true;
    showStrip(a);
    document.documentElement.classList.add("is-cloud-leaving");
    const t = $("page-transition");
    if (t) t.classList.add("is-exiting");
    setTimeout(() => goTo(a), 260);
    return;
  }
  leaving = true;
  selected = a;
  setStatus(`Flying to ${a.iata}, ${a.name}…`);
  stage.classList.add("is-landing");
  showStrip(a);
  history.replaceState(null, "", "#" + a.id);

  // canvas for the contrail, sharp on retina
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = stage.clientWidth, H = stage.clientHeight;
  trailCanvas.width = Math.round(W * dpr);
  trailCanvas.height = Math.round(H * dpr);
  const ctx = trailCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // come in from the side away from the airport, along a high arc
  const p0 = globe.project(a);
  const fromRight = p0.x < W * 0.45;
  const S = { x: fromRight ? W + 40 : -40, y: H * (W < 700 ? 0.7 : 0.78) };
  const C = { x: fromRight ? W * 0.72 : W * 0.28, y: H * 0.08 };
  const trail = [];
  let heading = null;
  let touched = false;
  let clouded = false;
  flight.hidden = false;
  flight.classList.add("is-on");

  globe.land(a, (k, pin) => {
    // the plane lands at 86% of the move; the camera keeps settling after
    const u = Math.min(1, k / 0.86);
    // arrives already flying (no slow start off-screen), then a long, gentle final
    const e = 1 - Math.pow(1 - u, 2.3);
    const P = { x: pin.x, y: pin.y };
    // quadratic bezier whose end point follows the airport as the globe turns
    const x = (1 - e) * (1 - e) * S.x + 2 * (1 - e) * e * C.x + e * e * P.x;
    const y = (1 - e) * (1 - e) * S.y + 2 * (1 - e) * e * C.y + e * e * P.y;
    // tangent of the curve gives the heading; smoothed so it never twitches
    const tx = 2 * (1 - e) * (C.x - S.x) + 2 * e * (P.x - C.x);
    const ty = 2 * (1 - e) * (C.y - S.y) + 2 * e * (P.y - C.y);
    const want = Math.atan2(ty, tx);
    if (heading === null) heading = want;
    let diff = want - heading;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    heading += diff * 0.22;
    // bank into the turn, level out on final
    const bank = Math.max(-28, Math.min(28, diff * 160)) * (1 - u);
    // altitude: big near the viewer, small on the runway
    const alt = 1 - easeOut(u);
    const scale = 0.42 + alt * 0.9;
    const deg = heading * 180 / Math.PI + 45;   // the icon points up-right
    planeEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${deg.toFixed(1)}deg) rotateY(${bank.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    planeEl.style.opacity = u < 1 ? "1" : String(Math.max(0, 1 - (k - 0.86) / 0.06));
    // the shadow sits "on the ground" below the plane and meets it at touchdown
    const off = alt * 46;
    shadowEl.style.transform = `translate3d(${(x + off * 0.5).toFixed(1)}px, ${(y + off).toFixed(1)}px, 0) translate(-50%, -50%) rotate(${deg.toFixed(1)}deg) scale(${(scale * 0.9).toFixed(3)})`;
    shadowEl.style.opacity = String(0.15 + (1 - alt) * 0.35);

    // contrail: the last stretch of the path, tapering and fading out
    trail.push({ x, y });
    if (trail.length > 46) trail.shift();
    ctx.clearRect(0, 0, W, H);
    for (let i = 1; i < trail.length; i++) {
      const f = i / trail.length;
      ctx.strokeStyle = `rgba(255,255,255,${(f * 0.55 * (u < 1 ? 1 : 0.5)).toFixed(3)})`;
      ctx.lineWidth = 0.6 + f * 3.2 * (0.4 + alt);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
    if (u >= 1 && !touched) {
      touched = true;
      touchEl.style.transform = `translate3d(${P.x.toFixed(1)}px, ${P.y.toFixed(1)}px, 0)`;
      touchEl.classList.add("is-on");
      stage.classList.add("is-touched");
      setStatus(`Landed at ${a.iata}`);
    }
    if (touched) touchEl.style.transform = `translate3d(${P.x.toFixed(1)}px, ${P.y.toFixed(1)}px, 0)`;
    if (k >= 0.9 && !clouded) {
      clouded = true;
      // clouds close over the landing; the guide page parts them again
      document.documentElement.classList.add("is-cloud-leaving");
      const t = $("page-transition");
      if (t) t.classList.add("is-exiting");
    }
  }).then(() => {
    setTimeout(() => goTo(a), 120);
  });
}

function choose(a) { land(a); }

// Coming back with the browser's Back button (bfcache): undo the landing.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  leaving = false;
  stage.classList.remove("is-landing", "is-touched");
  document.documentElement.classList.remove("is-cloud-leaving");
  const t = $("page-transition");
  if (t) t.classList.remove("is-exiting");
  flight.classList.remove("is-on");
  flight.hidden = true;
  touchEl.classList.remove("is-on");
  strip.classList.remove("is-on");
  strip.hidden = true;
  setStatus("");
  if (globe) globe.reset(selected);
  selected = null;
});

/* ---------------- Search combobox ---------------- */
let results = [];
let activeIndex = -1;

function search(q) {
  const f = fold(q.trim());
  if (!f) return AIRPORTS.slice();
  const scored = [];
  AIRPORTS.forEach((a) => {
    let score = -1;
    if (fold(a.iata) === f || fold(a.icao) === f) score = 100;
    else if (fold(a.iata).startsWith(f) || fold(a.icao).startsWith(f)) score = 80;
    else if (fold(a.city).startsWith(f) || fold(a.name).startsWith(f)) score = 60;
    else if (a._search.split(/\s+/).some((w) => w.startsWith(f))) score = 40;
    else if (a._search.includes(f)) score = 20;
    if (score >= 0) scored.push([score, a]);
  });
  return scored.sort((x, y) => y[0] - x[0]).map((s) => s[1]);
}

function renderList() {
  listbox.textContent = "";
  if (!results.length) {
    const li = el("li", "ap-search__empty");
    li.setAttribute("role", "presentation");
    li.append("No guide for that airport yet. ");
    const a = el("a", null, "Suggest it");
    a.href = "https://forms.gle/eSWeZWQoHny6DYSU7";
    a.target = "_blank";
    a.rel = "noopener";
    li.append(a);
    listbox.append(li);
  }
  results.forEach((a, i) => {
    const li = el("li", "ap-search__opt");
    li.id = "ap-opt-" + a.id;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
    const text = el("span", "ap-search__text");
    text.append(el("span", "ap-search__name", a.name), el("span", "ap-search__meta", `${a.city} · ${a.icao}`));
    li.append(el("span", "ap-search__code", a.iata), text);
    // mousedown (not click) so the input's blur doesn't close the list first
    li.addEventListener("mousedown", (e) => { e.preventDefault(); choose(a); });
    li.addEventListener("mousemove", () => { if (activeIndex !== i) { activeIndex = i; syncActive(); } });
    listbox.append(li);
  });
  syncActive();
}
function syncActive() {
  [...listbox.querySelectorAll(".ap-search__opt")].forEach((li, i) => {
    li.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
    if (i === activeIndex) li.scrollIntoView({ block: "nearest" });
  });
  const a = results[activeIndex];
  if (a) input.setAttribute("aria-activedescendant", "ap-opt-" + a.id);
  else input.removeAttribute("aria-activedescendant");
}
function openList() {
  results = search(input.value);
  activeIndex = input.value.trim() && results.length ? 0 : -1;
  renderList();
  listbox.hidden = false;
  input.setAttribute("aria-expanded", "true");
}
function closeList() {
  listbox.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  activeIndex = -1;
}

input.addEventListener("focus", openList);
input.addEventListener("input", openList);
input.addEventListener("blur", () => setTimeout(closeList, 120));
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (listbox.hidden) openList();
    if (!results.length) return;
    const d = e.key === "ArrowDown" ? 1 : -1;
    activeIndex = (activeIndex + d + results.length) % results.length;
    syncActive();
  } else if (e.key === "Enter") {
    e.preventDefault();
    const a = results[activeIndex] || results[0];
    if (a) choose(a);
  } else if (e.key === "Escape") {
    if (input.value) { input.value = ""; openList(); }
    else { closeList(); input.blur(); }
  }
});

// "/" focuses search; Esc goes back to space.
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    input.focus();
  } else if (e.key === "Escape" && !typing && globe && stage.classList.contains("is-zoomed")) {
    backToSpace();
  }
});

/* ---------------- Back to space ---------------- */
function backToSpace() {
  if (!globe || leaving) return;
  setStatus("");
  globe.home();
}
$("ap-space").addEventListener("click", backToSpace);

/* ---------------- Scrolling to the guide list ----------------
   A custom eased glide (cancels on any wheel/touch/key), and a gentle
   parallax as the globe scrolls away. */
const listSection = $("ap-all");
let glide = null;
function glideTo(y) {
  if (glide) cancelAnimationFrame(glide.raf);
  if (reduceMotion) { window.scrollTo(0, y); return; }
  const startY = window.scrollY;
  const dist = y - startY;
  const duration = clamp(Math.abs(dist) * 0.9, 650, 1100);
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / duration);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    window.scrollTo(0, startY + dist * e);
    glide.raf = k < 1 ? requestAnimationFrame(step) : 0;
    if (k >= 1) glide = null;
  };
  glide = { raf: requestAnimationFrame(step) };
}
["wheel", "touchstart", "keydown"].forEach((ev) =>
  window.addEventListener(ev, () => { if (glide) { cancelAnimationFrame(glide.raf); glide = null; } }, { passive: true }));
document.querySelector(".ap-peek").addEventListener("click", (e) => {
  e.preventDefault();
  const navH = document.querySelector(".site-nav").offsetHeight;
  glideTo(listSection.getBoundingClientRect().top + window.scrollY - navH + 1);
});

const canvasWrap = $("ap-canvas");
const pinsWrap = $("ap-pins");
const topWrap = document.querySelector(".ap-top");
let scrollTick = false;
function onScroll() {
  scrollTick = false;
  if (stage.classList.contains("is-fallback")) return;
  const h = stage.offsetHeight || 1;
  const p = clamp(window.scrollY / h, 0, 1);
  if (reduceMotion) return;
  const t = `translate3d(0, ${(p * h * 0.32).toFixed(1)}px, 0) scale(${(1 - p * 0.08).toFixed(4)})`;
  canvasWrap.style.transform = t;
  pinsWrap.style.transform = t;
  canvasWrap.style.opacity = pinsWrap.style.opacity = String(1 - p * 0.75);
  topWrap.style.transform = `translate3d(-50%, ${(-p * 60).toFixed(1)}px, 0)`;
  topWrap.style.opacity = String(clamp(1 - p * 1.6, 0, 1));
}
window.addEventListener("scroll", () => {
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();   // a reload can restore a scrolled position

// guide cards drift up into place as they scroll into view
if ("IntersectionObserver" in window && !reduceMotion) {
  const items = document.querySelectorAll(".ap-list__item");
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("is-in");
    io.unobserve(en.target);
  }), { rootMargin: "0px 0px -40px 0px", threshold: 0.15 });
  items.forEach((it, i) => { it.classList.add("ap-reveal"); it.style.transitionDelay = `${(i % 3) * 80}ms`; io.observe(it); });
}

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* ---------------- Globe boot ---------------- */
function fallback(reason) {
  if (reason) console.info("[airports] globe unavailable, showing list:", reason);
  stage.classList.add("is-fallback");
  globe = null;
  // the scroll parallax may already have positioned the header inline
  // (translate -50%), which would push it off-screen in the static layout
  const top = document.querySelector(".ap-top");
  if (top) { top.style.transform = ""; top.style.opacity = ""; }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

const deepLink = AIRPORTS.find((a) => "#" + a.id === location.hash.toLowerCase());
// coming back from a guide (airports.html?rise=sfo): start above that airport and climb
const params = new URLSearchParams(location.search);
const riseFrom = AIRPORTS.find((a) => a.id === (params.get("rise") || "").toLowerCase());
if (riseFrom) history.replaceState(null, "", location.pathname);

if (!hasWebGL() || new URLSearchParams(location.search).has("noglobe")) {
  fallback("no WebGL");
} else {
  // download now, but build the 3D globe (shader compile, textures,
  // first render) only once the page's arrival slide has finished
  Promise.all([import("./airports-globe.js?v=3"), window.feArrival])
    .then(([mod]) => mod.createGlobe({
      container: $("ap-canvas"),
      pinLayer: $("ap-pins"),
      airports: AIRPORTS,
      patches: window.FLY_EASY_GLOBE_PATCHES || [],
      reduceMotion,
      onZoomChange: (zoomedIn) => stage.classList.toggle("is-zoomed", zoomedIn),
      onPick: (a) => choose(a),
      onUserMove: () => { if (!leaving) setStatus(""); },
    }))
    .then((g) => {
      globe = g;
      stage.classList.add("is-ready");
      $("ap-controls").hidden = false;
      $("ap-controls").addEventListener("click", (e) => {
        const b = e.target.closest("[data-zoom]");
        if (!b) return;
        const z = b.dataset.zoom;
        if (leaving) return;
        if (z === "home") { setStatus(""); globe.home(); }
        else globe.zoomBy(z === "in" ? 0.6 : 1.6);
      });
      if (riseFrom) {
        setStatus(`Leaving ${riseFrom.iata}…`);
        globe.rise(riseFrom).then(() => setStatus(""));
      } else if (deepLink) {
        // a shared link to one airport: glide over to it and wait for a tap
        setTimeout(() => globe.flyTo(deepLink).then((ok) => {
          if (!ok) return;
          globe.setActive(deepLink.id);
          setStatus(`${deepLink.iata} · ${deepLink.name}. Tap the pin to land.`);
        }), reduceMotion ? 0 : 500);
      }
    })
    .catch((err) => fallback(err && err.message));
}
