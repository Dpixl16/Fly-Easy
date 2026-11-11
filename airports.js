/* ============================================================
   Airports — globe navigation (airports.html)

   Two layers, so the page never breaks:
     1. Directory UI (always): search combobox, airport card,
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
const card = $("ap-card");
const cardGo = $("ap-card-go");

let globe = null;          // set once the 3D globe is up
let selected = null;       // the airport whose card is open

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

/* ---------------- Airport card ---------------- */
let cardHideTimer = null;
function openCard(a) {
  selected = a;
  clearTimeout(cardHideTimer);
  $("ap-card-photo").style.backgroundImage = `url('${a.photo}')`;
  $("ap-card-photo").style.backgroundPosition = a.photoPos || "center";
  $("ap-card-codes").textContent = `${a.iata} · ${a.icao}`;
  $("ap-card-name").textContent = a.name;
  $("ap-card-blurb").textContent = a.blurb;
  const facts = $("ap-card-facts");
  facts.textContent = "";
  (a.facts || []).forEach(([k, v]) => {
    const li = el("li");
    li.append(el("span", null, k), document.createTextNode(v));
    facts.append(li);
  });
  cardGo.href = a.page;
  cardGo.setAttribute("aria-label", `Open the ${a.iata} guide`);
  card.hidden = false;
  stage.classList.add("has-card");
  requestAnimationFrame(() => card.classList.add("is-open"));
  if (globe) globe.setActive(a.id);
  history.replaceState(null, "", "#" + a.id);
}
function closeCard() {
  if (!selected) return;
  selected = null;
  card.classList.remove("is-open");
  stage.classList.remove("has-card");
  cardHideTimer = setTimeout(() => { card.hidden = true; }, 400);
  if (globe) globe.setActive(null);
  history.replaceState(null, "", location.pathname + location.search);
}
$("ap-card-close").addEventListener("click", closeCard);

/* Choosing an airport: fly there, then show its card.
   Choosing the airport that's already selected opens its guide. */
function choose(a, opts = {}) {
  closeList();
  input.blur();
  if (globe && selected && selected.id === a.id && card.classList.contains("is-open")) {
    openGuide();
    return;
  }
  if (!globe) {
    // No globe: go straight to the guide (fallback mode).
    if (opts.fromSearch) location.href = a.page;
    return;
  }
  setStatus(`Flying to ${a.iata}…`);
  card.classList.remove("is-open");
  globe.flyTo(a, { instant: opts.instant }).then((arrived) => {
    if (!arrived) { setStatus(""); return; }
    setStatus(`${a.city} · ${a.iata}`);
    openCard(a);
  });
}

/* "Open guide": a short dive toward the airport, then the site's
   plane page-transition. Used by the card button, a click anywhere on
   the card, and a second click on the selected pin. */
let leaving = false;
function openGuide() {
  if (!selected || leaving) return;
  const href = selected.page;
  if (!globe || reduceMotion) { location.href = href; return; }
  leaving = true;
  const transition = $("page-transition");
  stage.classList.add("is-diving");
  globe.dive(selected);
  setTimeout(() => transition && transition.classList.add("is-exiting"), 260);
  setTimeout(() => { location.href = href; }, 660);
}
cardGo.addEventListener("click", (e) => {
  // modified clicks (new tab etc.) keep normal link behaviour
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  e.stopPropagation();
  openGuide();
});
card.addEventListener("click", (e) => {
  if (e.target.closest("#ap-card-close, #ap-card-go")) return;
  openGuide();
});

// Coming back with the browser's Back button (bfcache): undo the dive.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  stage.classList.remove("is-diving");
  leaving = false;
  const t = $("page-transition");
  if (t) t.classList.remove("is-exiting");
  if (globe && selected) globe.flyTo(selected, { instant: true });
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
    li.addEventListener("mousedown", (e) => { e.preventDefault(); choose(a, { fromSearch: true }); });
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
    if (a) choose(a, { fromSearch: true });
  } else if (e.key === "Escape") {
    if (input.value) { input.value = ""; openList(); }
    else { closeList(); input.blur(); }
  }
});

// "/" focuses search; Esc closes the card.
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    input.focus();
  } else if (e.key === "Escape" && !typing && selected) {
    closeCard();
  } else if (e.key === "Escape" && !typing && globe && stage.classList.contains("is-zoomed")) {
    backToSpace();
  }
});

/* ---------------- Back to space ---------------- */
function backToSpace() {
  if (!globe) return;
  closeCard();
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
  import("./airports-globe.js?v=2")
    .then((mod) => mod.createGlobe({
      container: $("ap-canvas"),
      pinLayer: $("ap-pins"),
      airports: AIRPORTS,
      patches: window.FLY_EASY_GLOBE_PATCHES || [],
      reduceMotion,
      onZoomChange: (zoomedIn) => stage.classList.toggle("is-zoomed", zoomedIn),
      onPick: (a) => choose(a),
      onUserMove: () => { if (selected) closeCard(); setStatus(""); },
    }))
    .then((g) => {
      globe = g;
      stage.classList.add("is-ready");
      $("ap-controls").hidden = false;
      $("ap-controls").addEventListener("click", (e) => {
        const b = e.target.closest("[data-zoom]");
        if (!b) return;
        const z = b.dataset.zoom;
        if (z === "home") { closeCard(); setStatus(""); globe.home(); }
        else globe.zoomBy(z === "in" ? 0.6 : 1.6);
      });
      if (riseFrom) {
        setStatus(`Leaving ${riseFrom.iata}…`);
        globe.rise(riseFrom).then(() => setStatus(""));
      } else if (deepLink) {
        setTimeout(() => choose(deepLink), reduceMotion ? 0 : 500);
      }
    })
    .catch((err) => fallback(err && err.message));
}
