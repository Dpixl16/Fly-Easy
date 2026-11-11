/* ============================================================
   SJC Tips — the Terminal A / Terminal B card.

   An illustrated, zoomable schematic of one terminal: planes at
   their gates, the concourse, and the curb → ticketing → security
   path below it. Three ways in:
     1. The walk    — a short guided tour of the stops that matter.
                      The camera glides to each one and a signal
                      runs the copper trace there (same idea as the
                      circuit board above).
     2. My gate     — tap a gate (or a plane) to see the nearest
                      water, restrooms, power and nursing room.
     3. Highlights  — light up one kind of amenity across the map.

   Everything is one SVG whose viewBox is the "camera", so phones
   simply get a closer camera instead of a different layout.

   Amenity gate numbers come from flysanjose.com/services-amenities
   (checked November 2026). Update AMENITIES when SJC's list changes.

   Used by sjc.js:  SJCTerminal.render(rootEl, terminalDef, { onAction })
   ============================================================ */
(function () {
  "use strict";

  var AMENITIES = [
    { id: "water",    icon: "💧", name: "Water refill",  plural: "water refill stations", gates: [6, 8, 14, 15, 17, 24, 32] },
    { id: "restroom", icon: "🚻", name: "Restrooms",     plural: "restrooms",             gates: [10, 13, 18, 21, 24, 26, 32] },
    { id: "power",    icon: "🔌", name: "Power Suite",   plural: "Power Suites",          gates: [9, 18, 28] },
    { id: "nursing",  icon: "🍼", name: "Nursing room",  plural: "nursing rooms",         gates: [8, 18, 21, 24, 26] },
    { id: "atm",      icon: "💵", name: "ATM",           plural: "ATMs",                  gates: [10, 26] }
  ];
  var LOUNGE_GATE = 15;

  /* world geometry (SVG user units) */
  var G = 96, X0 = 170, H = 640;
  var Y = { taxi: 46, nose: 212, top: 232, badge: 253, amen: 284, spine: 337, bottom: 362, sec: 412, checkin: 484, curb: 580 };
  var TAILS = ["#7DD3FC", "#E3A548", "#9FB8C9", "#5EC2A2"];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var live = null;   // the currently mounted terminal (so a re-render can clean up)

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function render(root, def, opts) {
    opts = opts || {};
    if (live) live.destroy();

    var first = def.gates[0], last = def.gates[1], count = last - first + 1;
    var W = X0 * 2 + (count - 1) * G;
    var lx = gx(def.landGate);
    function gx(g) { return X0 + (g - first) * G; }
    function inTerminal(g) { return g >= first && g <= last; }

    var airStops = 0;
    var stops = def.stops.map(function (s, i) {
      var pos = s.at ? [lx, Y[s.at === "security" ? "sec" : s.at]] : [gx(s.gate), Y.spine];
      return { d: s, i: i, pos: pos, land: !!s.at, row: s.at ? 0 : (airStops++ % 2) };
    });

    /* ---------------- markup ---------------- */
    var h = '<div class="tm" data-terminal="' + def.key + '">';

    h += '<ul class="tm-brief">';
    def.brief.forEach(function (f, i) {
      h += '<li class="tm-fact" style="--i:' + i + '"><span class="tm-fact__big">' + f[0] + '</span>' +
        '<span class="tm-fact__text"><strong>' + esc(f[1]) + '</strong><span>' + esc(f[2]) + '</span></span></li>';
    });
    h += '</ul>';

    h += '<div class="tm-airlines"><span class="tm-label">Check in here for</span><div class="chip-list">' +
      def.airlines.map(function (a) { return '<span class="chip">' + esc(a) + '</span>'; }).join("") + '</div></div>';

    h += '<div class="tm-stage">' +
      '<svg class="tm-svg" role="group" aria-label="Schematic map of ' + esc(def.title) + ', gates ' + first + ' to ' + last + '"></svg>' +
      '<p class="tm-hud">' + esc(def.title) + ' · <span class="tm-hud__note">gates </span>' + first + '–' + last + '<span class="tm-hud__note"> · schematic, not to scale</span></p>' +
      '<div class="tm-zoom">' +
        '<button type="button" data-z="in" aria-label="Zoom in"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>' +
        '<button type="button" data-z="out" aria-label="Zoom out"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>' +
        '<button type="button" data-z="fit" aria-label="Show the whole terminal"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>' +
      '</div>' +
      '<p class="tm-hint" aria-hidden="true">Drag to look around · tap a gate</p>' +
    '</div>';

    h += '<div class="tm-filters" role="group" aria-label="Highlight on the map"><span class="tm-label">Show me</span>';
    AMENITIES.forEach(function (a) {
      if (!a.gates.some(inTerminal)) return;
      h += '<button type="button" class="tm-filter" data-f="' + a.id + '" aria-pressed="false"><span aria-hidden="true">' + a.icon + '</span>' + esc(a.name) + '</button>';
    });
    h += '<p class="tm-filter-readout" aria-live="polite"></p></div>';

    h += '<div class="tm-panels">';
    h += '<section class="tm-card tm-tour" aria-label="Walk through ' + esc(def.title) + '">' +
      '<div class="tm-tour__top"><p class="tm-label tm-tour__step"></p>' +
        '<div class="tm-tour__nav">' +
          '<button type="button" data-go="-1" aria-label="Previous stop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
          '<button type="button" data-go="1" aria-label="Next stop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
        '</div></div>' +
      '<div class="tm-tour__body" aria-live="polite"><span class="tm-tour__icon" aria-hidden="true"></span>' +
        '<div><p class="tm-tour__kicker"></p><h4 class="tm-tour__title"></h4><div class="tm-tour__text"></div><div class="tm-tour__extra"></div></div></div>' +
      '<div class="tm-tour__dots">' + stops.map(function (s) {
        return '<button type="button" data-stop="' + s.i + '" aria-label="Stop ' + (s.i + 1) + ': ' + esc(s.d.label) + '"><span aria-hidden="true">' + s.d.icon + '</span></button>';
      }).join("") + '</div>' +
    '</section>';

    h += '<section class="tm-card tm-gatecard" aria-label="What is near my gate">' +
      '<p class="tm-label">What’s near my gate?</p>' +
      '<div class="tm-keys" role="group" aria-label="Pick your gate">';
    for (var g = first; g <= last; g++) h += '<button type="button" class="tm-key" data-gate="' + g + '" aria-pressed="false">' + g + '</button>';
    h += '</div><div class="tm-near" aria-live="polite"><p class="tm-near__empty">Pick your gate number, or tap a plane on the map, to see the closest water, restrooms, power and more.</p></div>' +
    '</section>';
    h += '</div></div>';
    root.innerHTML = h;

    var wrap = root.querySelector(".tm");
    var stage = root.querySelector(".tm-stage");
    var svg = root.querySelector(".tm-svg");

    /* ---------------- the drawing ---------------- */
    var s = "";
    s += '<defs>' +
      '<linearGradient id="tm-roof-' + def.key + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B4560"/><stop offset="1" stop-color="#123347"/></linearGradient>' +
      '</defs>';

    // apron: taxi line, stand lead-in lines, a plane taxiing past
    s += '<path class="tm-taxi" d="M-200 ' + Y.taxi + 'H' + (W + 200) + '"/>';
    for (g = first; g <= last; g++) {
      s += '<path class="tm-stand" d="M' + gx(g) + ' ' + (Y.taxi + 8) + 'V' + (Y.nose - 4) + '"/>';
    }
    if (!reduceMotion) {
      s += '<g class="tm-taxiing" style="--from:-160px;--to:' + (W + 160) + 'px"><g transform="translate(0 ' + Y.taxi + ') rotate(-90) scale(0.5)">' + planeShape("#9FB8C9") + '</g></g>';
    }

    // planes (a few stands sit empty, like a real apron)
    for (g = first; g <= last; g++) {
      var empty = def.empty && def.empty.indexOf(g) !== -1;
      s += '<g class="tm-gate" data-gate="' + g + '" role="button" tabindex="0" aria-label="Gate ' + g + ': show what is nearby">';
      if (!empty) {
        s += '<g transform="translate(' + gx(g) + ' ' + Y.nose + ')"><g class="tm-plane" style="--i:' + (g - first) + '"><g transform="scale(0.7)">' + planeShape(TAILS[(g * 7) % TAILS.length]) + '</g></g></g>';
      } else {
        s += '<path class="tm-stand-t" d="M' + (gx(g) - 14) + ' ' + (Y.nose - 30) + 'h28"/>';
      }
      s += '<rect class="tm-bridge" x="' + (gx(g) - 5) + '" y="' + (Y.nose - 2) + '" width="10" height="' + (Y.top - Y.nose + 6) + '" rx="2"/>';
      s += '<rect class="tm-gate__hit" x="' + (gx(g) - G / 2) + '" y="64" width="' + G + '" height="' + (Y.badge + 20 - 64) + '"/>';
      s += '</g>';
    }

    // the concourse building
    s += '<rect class="tm-hall" x="' + (X0 - 110) + '" y="' + Y.top + '" width="' + (W - (X0 - 110) * 2) + '" height="' + (Y.bottom - Y.top) + '" rx="26" fill="url(#tm-roof-' + def.key + ')" pathLength="1"/>';
    for (g = first; g < last; g++) {
      s += '<path class="tm-rib" d="M' + (gx(g) + G / 2) + ' ' + (Y.top + 8) + 'v' + (Y.bottom - Y.top - 16) + '"/>';
    }
    // where the building continues into the other terminal
    if (def.next) {
      var right = def.next.side === "right";
      var ex = right ? W - (X0 - 110) : X0 - 110;
      s += '<path class="tm-exit" d="M' + ex + ' ' + (Y.top + 14) + 'v' + (Y.bottom - Y.top - 28) + '"/>';
      var ax = right ? ex - 30 : ex + 30, dir = right ? 1 : -1;
      s += '<path class="tm-exit-arrow" d="M' + ax + ' ' + (Y.top + 22) + 'l' + (10 * dir) + ' 9l' + (-10 * dir) + ' 9"/>';
    }

    // landside: security neck, ticketing hall, curb
    s += '<rect class="tm-neck" x="' + (lx - 30) + '" y="' + (Y.bottom - 4) + '" width="60" height="' + (Y.checkin - 52 - Y.bottom + 8) + '"/>';
    s += '<rect class="tm-ticketing" x="' + (lx - 215) + '" y="' + (Y.checkin - 52) + '" width="430" height="104" rx="20"/>';
    s += '<text class="tm-silk" x="' + (lx - 196) + '" y="' + (Y.checkin - 26) + '">TICKETING</text>';
    s += '<rect class="tm-road" x="' + (lx - 270) + '" y="' + (Y.curb - 24) + '" width="540" height="48" rx="12"/>';
    s += '<path class="tm-lane" d="M' + (lx - 250) + ' ' + Y.curb + 'h500"/>';
    s += '<text class="tm-silk" x="' + (lx - 196) + '" y="' + (Y.curb + 44) + '">CURB</text>';
    [-180, -96, 120].forEach(function (dx, i) {
      s += '<rect class="tm-car" x="' + (lx + dx) + '" y="' + (Y.curb - 17) + '" width="34" height="14" rx="5" style="--i:' + i + '"/>';
    });
    // pet relief: outside, north of ticketing
    s += '<rect class="tm-grass" x="' + (lx - 332) + '" y="' + (Y.checkin - 34) + '" width="92" height="62" rx="16"/>';
    s += '<text class="tm-emoji" x="' + (lx - 286) + '" y="' + (Y.checkin + 6) + '" font-size="26">🐾</text>';
    s += '<text class="tm-silk tm-silk--sm" x="' + (lx - 286) + '" y="' + (Y.checkin + 48) + '" text-anchor="middle">PET RELIEF</text>';
    // checkpoint bar
    s += '<rect class="tm-checkpoint" x="' + (lx - 44) + '" y="' + (Y.sec - 7) + '" width="88" height="14" rx="7"/>';

    // traces: spine + the path up from the curb, with flowing dashes
    var spineD = 'M' + (X0 - 80) + ' ' + Y.spine + 'H' + (W - (X0 - 80));
    var stemD = 'M' + lx + ' ' + Y.curb + 'V' + Y.spine;
    s += '<path class="tm-trace" d="' + spineD + '"/><path class="tm-trace" d="' + stemD + '"/>';
    if (!reduceMotion) s += '<path class="tm-flow" d="' + spineD + '"/><path class="tm-flow" d="' + stemD + '"/>';
    s += '<path class="tm-lit" d=""/>';

    // far-end bracket
    if (def.far) {
      s += '<path class="tm-far" d="M' + (gx(def.far[0]) - 30) + ' ' + (Y.bottom + 12) + 'v10H' + (gx(def.far[1]) + 30) + 'v-10"/>';
      s += '<text class="tm-silk" x="' + ((gx(def.far[0]) + gx(def.far[1])) / 2) + '" y="' + (Y.bottom + 46) + '" text-anchor="middle">' + esc(def.far[2]) + '</text>';
    }

    // gate badges + amenity dots
    for (g = first; g <= last; g++) {
      s += '<g class="tm-badge" data-gate="' + g + '"><rect x="' + (gx(g) - 21) + '" y="' + (Y.badge - 15) + '" width="42" height="30" rx="9"/>' +
        '<text x="' + gx(g) + '" y="' + (Y.badge + 7) + '">' + g + '</text></g>';
      var here = AMENITIES.filter(function (a) { return a.gates.indexOf(g) !== -1; });
      here.forEach(function (a, k) {
        var ax = gx(g) + (k - (here.length - 1) / 2) * 27;
        s += '<g class="tm-amen" data-a="' + a.id + '" data-gate="' + g + '"><circle cx="' + ax + '" cy="' + Y.amen + '" r="12.5"/>' +
          '<text class="tm-emoji" x="' + ax + '" y="' + (Y.amen + 5.5) + '" font-size="14">' + a.icon + '</text></g>';
      });
    }

    // tour pins
    stops.forEach(function (st) {
      var x = st.pos[0], y = st.pos[1];
      s += '<g class="tm-pin' + (st.land ? " tm-pin--land" : "") + '" data-stop="' + st.i + '" role="button" tabindex="0" aria-label="Stop ' + (st.i + 1) + ': ' + esc(st.d.label) + '" style="--i:' + st.i + '">';
      if (st.land) {
        s += '<text class="tm-pin__label" x="' + (x + 36) + '" y="' + (y + 7) + '">' + esc(st.d.label) + '</text>';
      } else {
        var ly = Y.bottom + 40 + st.row * 28;
        if (def.far && st.d.gate >= def.far[0]) ly = Y.bottom + 78;
        s += '<path class="tm-pin__stem" d="M' + x + ' ' + (y + 22) + 'V' + (ly - 20) + '"/>';
        s += '<text class="tm-pin__label" x="' + x + '" y="' + ly + '" text-anchor="middle">' + esc(st.d.label) + '</text>';
      }
      s += '<g transform="translate(' + x + ' ' + y + ')"><g class="tm-pin__body"><circle class="tm-pin__ring" r="30"/><circle class="tm-pin__disc" r="21"/>' +
        '<text class="tm-emoji" y="8" font-size="22">' + st.d.icon + '</text>' +
        '<circle class="tm-pin__num-bg" cx="17" cy="-17" r="10"/><text class="tm-pin__num" x="17" y="-12.5">' + (st.i + 1) + '</text></g></g>';
      s += '</g>';
    });

    // the traveller
    s += '<g class="tm-you"><circle class="tm-you__halo" r="20"/><circle class="tm-you__core" r="8"/></g>';
    svg.innerHTML = s;

    var litPath = svg.querySelector(".tm-lit");
    var you = svg.querySelector(".tm-you");
    var J = [lx, Y.spine], CURB = [lx, Y.curb];

    /* ---------------- camera ---------------- */
    var cam = { x: 0, y: 0, w: W, h: H };
    var aspect = 2.5;
    var youPos = CURB.slice();
    var anim = 0;
    var destroyed = false;
    var booted = false;

    function measure() {
      var r = stage.getBoundingClientRect();
      if (r.width && r.height) aspect = r.width / r.height;
    }
    function fit(f) {
      var fw = f.x1 - f.x0, fh = f.y1 - f.y0, w, hh;
      if (fw / fh > aspect) { w = fw; hh = fw / aspect; } else { hh = fh; w = fh * aspect; }
      return constrain({ x: (f.x0 + f.x1) / 2 - w / 2, y: (f.y0 + f.y1) / 2 - hh / 2, w: w, h: hh });
    }
    function constrain(c) {
      var maxW = Math.max(W, H * aspect);          // never wider than "whole terminal"
      if (c.w > maxW) { var k = maxW / c.w; c.x += (c.w - maxW) / 2; c.y += (c.h - c.h * k) / 2; c.w = maxW; c.h = maxW / aspect; }
      c.x = c.w >= W ? (W - c.w) / 2 : clamp(c.x, 0, W - c.w);
      c.y = c.h >= H ? (H - c.h) / 2 : clamp(c.y, 0, H - c.h);
      return c;
    }
    function applyCam() {
      svg.setAttribute("viewBox", cam.x.toFixed(1) + " " + cam.y.toFixed(1) + " " + cam.w.toFixed(1) + " " + cam.h.toFixed(1));
    }
    function overview() { return fit({ x0: 0, x1: W, y0: 0, y1: H }); }
    function frameFor(pos, kind) {
      if (kind === "gate") return { x0: pos[0] - 215, x1: pos[0] + 215, y0: 30, y1: 410 };
      if (pos[1] > Y.spine) return { x0: lx - 345, x1: lx + 290, y0: 222, y1: H - 6 };
      return { x0: pos[0] - 255, x1: pos[0] + 255, y0: 44, y1: 440 };
    }

    function routeBetween(a, b) {
      var aLand = a[1] > Y.spine, bLand = b[1] > Y.spine;
      return aLand === bLand ? [a, b] : [a, J, b];
    }
    function placeYou(p) {
      youPos = p;
      you.setAttribute("transform", "translate(" + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")");
      var pts = p[1] > Y.spine ? [CURB, p] : [CURB, J, p];
      litPath.setAttribute("d", pts.map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(""));
    }

    /* Glide the camera to a frame while the traveller walks the trace.
       Long trips pull the camera back mid-flight, then settle in. */
    function travel(toCam, toPos, done) {
      if (anim) cancelAnimationFrame(anim);
      anim = 0;
      if (booted) wrap.classList.add("has-moved");   // any move after the intro retires the hint
      var c0 = { x: cam.x, y: cam.y, w: cam.w, h: cam.h };
      var pts = toPos ? routeBetween(youPos, toPos) : null;
      var segs = [], total = 0;
      if (pts) for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
      if (reduceMotion || destroyed) {
        cam = toCam; applyCam();
        if (toPos) placeYou(toPos);
        if (done) done();
        return;
      }
      var dist = Math.hypot((toCam.x + toCam.w / 2) - (c0.x + c0.w / 2), (toCam.y + toCam.h / 2) - (c0.y + c0.h / 2));
      var maxW = Math.max(W, H * aspect);
      var bump = Math.max(0, Math.min(dist * 0.5, maxW - Math.max(c0.w, toCam.w)));
      var dur = clamp(520 + dist * 0.55 + Math.abs(Math.log(c0.w / toCam.w)) * 260, 560, 1500);
      var t0 = performance.now();
      wrap.classList.add("is-moving");
      function step(now) {
        var t = Math.min(1, (now - t0) / dur), e = ease(t);
        var w = lerp(c0.w, toCam.w, e) + bump * Math.sin(Math.PI * t);
        var hh = w / aspect;
        var cx = lerp(c0.x + c0.w / 2, toCam.x + toCam.w / 2, e);
        var cy = lerp(c0.y + c0.h / 2, toCam.y + toCam.h / 2, e);
        cam = constrain({ x: cx - w / 2, y: cy - hh / 2, w: w, h: hh });
        applyCam();
        if (pts) {
          var along = total * e, acc = 0, k = 0;
          while (k < segs.length - 1 && acc + segs[k] < along) { acc += segs[k]; k++; }
          var f = segs[k] ? (along - acc) / segs[k] : 1;
          placeYou([lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]);
        }
        if (t < 1) { anim = requestAnimationFrame(step); return; }
        anim = 0;
        cam = toCam; applyCam();
        wrap.classList.remove("is-moving");
        if (done) done();
      }
      anim = requestAnimationFrame(step);
      // safety: if frames are paused (hidden tab), still land
      setTimeout(function () {
        if (!anim || destroyed || performance.now() - t0 < dur) return;
        cancelAnimationFrame(anim); anim = 0;
        cam = toCam; applyCam(); if (toPos) placeYou(toPos);
        wrap.classList.remove("is-moving");
        if (done) done();
      }, dur + 400);
    }

    /* ---------------- the walk (tour) ---------------- */
    var tour = root.querySelector(".tm-tour");
    var tourBody = tour.querySelector(".tm-tour__body");
    var current = -1, swapT = 0;
    function fillTour(st) {
      tour.querySelector(".tm-tour__step").textContent = "The walk · " + (st.i + 1) + " of " + stops.length;
      tour.querySelector(".tm-tour__icon").textContent = st.d.icon;
      tour.querySelector(".tm-tour__kicker").textContent = st.d.kicker;
      tour.querySelector(".tm-tour__title").textContent = st.d.title;
      tour.querySelector(".tm-tour__text").innerHTML = st.d.text;
      var extra = "";
      if (st.d.action) extra = '<button type="button" class="tm-action" data-open="' + st.d.action.open + '">' + esc(st.d.action.label) + '</button>';
      tour.querySelector(".tm-tour__extra").innerHTML = extra;
      var b = tour.querySelector("[data-open]");
      if (b && opts.onAction) b.addEventListener("click", function () { opts.onAction(b.getAttribute("data-open")); });
    }
    function goStop(i, o) {
      o = o || {};
      i = (i + stops.length) % stops.length;
      var st = stops[i], dir = i >= current ? 1 : -1;
      current = i;
      each(svg.querySelectorAll(".tm-pin"), function (p) { p.classList.toggle("is-active", +p.getAttribute("data-stop") === i); });
      each(tour.querySelectorAll(".tm-tour__dots button"), function (b, k) {
        b.classList.toggle("is-active", k === i);
        b.classList.toggle("is-done", k < i);
        if (k === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      clearTimeout(swapT);
      if (o.instant || reduceMotion) { fillTour(st); }
      else {
        tourBody.style.setProperty("--dir", dir);
        tourBody.classList.add("is-out");
        swapT = setTimeout(function () {
          fillTour(st);
          tourBody.classList.remove("is-out");
          tourBody.classList.add("is-in");
          void tourBody.offsetWidth;
          tourBody.classList.remove("is-in");
        }, 180);
      }
      if (o.still) { placeYou(st.pos); return; }
      setFilter(null, true);
      travel(fit(frameFor(st.pos)), st.pos);
    }
    each(tour.querySelectorAll("[data-go]"), function (b) {
      b.addEventListener("click", function () { goStop(current + +b.getAttribute("data-go")); });
    });
    each(tour.querySelectorAll(".tm-tour__dots button"), function (b) {
      b.addEventListener("click", function () { goStop(+b.getAttribute("data-stop")); });
    });
    tour.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goStop(current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goStop(current - 1); }
    });
    // swipe the card on touch screens
    var sw = null;
    tour.addEventListener("touchstart", function (e) { var t = e.touches[0]; sw = { x: t.clientX, y: t.clientY }; }, { passive: true });
    tour.addEventListener("touchend", function (e) {
      if (!sw) return;
      var t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
      sw = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) goStop(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    /* ---------------- my gate ---------------- */
    var nearBox = root.querySelector(".tm-near");
    var gateSel = null;
    function nearest(list, gate) {
      return list.reduce(function (best, n) { return Math.abs(n - gate) < Math.abs(best - gate) ? n : best; }, list[0]);
    }
    function awayText(n, gate) {
      var d = Math.abs(n - gate);
      if (!d) return "right here";
      return d + (d === 1 ? " gate " : " gates ") + (n < gate ? "←" : "→");
    }
    function selectGate(gate, o) {
      o = o || {};
      gateSel = gate;
      each(svg.querySelectorAll(".tm-gate, .tm-badge"), function (el) { el.classList.toggle("is-selected", +el.getAttribute("data-gate") === gate); });
      each(root.querySelectorAll(".tm-key"), function (k) {
        var on = +k.getAttribute("data-gate") === gate;
        k.classList.toggle("is-active", on);
        k.setAttribute("aria-pressed", on ? "true" : "false");
        if (on && o.scrollKey !== false) {
          var box = k.parentNode;
          box.scrollTo({ left: k.offsetLeft - box.clientWidth / 2 + k.offsetWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
        }
      });
      var rows = AMENITIES.map(function (a) { return { a: a, n: nearest(a.gates, gate) }; })
        .concat([{ a: { icon: "🛋️", name: "The Club SJC lounge" }, n: LOUNGE_GATE }]);
      var out = '<p class="tm-near__head"><span class="tm-near__gate">' + gate + '</span><span><strong>Gate ' + gate + '</strong>' +
        '<span>Closest to you, counted in gates</span></span></p><ul class="tm-near__list">';
      rows.forEach(function (r, i) {
        var d = Math.abs(r.n - gate);
        var other = !inTerminal(r.n);
        out += '<li class="tm-near__row' + (d === 0 ? " is-here" : "") + '" style="--i:' + i + '">' +
          '<span class="tm-near__icon" aria-hidden="true">' + r.a.icon + '</span>' +
          '<span class="tm-near__name">' + esc(r.a.name) + '<small>' + (d === 0 ? "At your gate" : "Gate " + r.n + (other ? " · " + esc(def.otherName) : "")) + '</small></span>' +
          '<span class="tm-near__away">' + awayText(r.n, gate) + '</span>' +
          '<span class="tm-near__meter" aria-hidden="true"><i style="--w:' + Math.max(6, 100 - d * 9) + '%"></i></span></li>';
      });
      out += '</ul>';
      if (def.far && gate >= def.far[0]) out += '<p class="tm-near__note">' + esc(def.farNote) + '</p>';
      out += '<p class="tm-near__note tm-near__note--quiet">Arrows show which way along the gates. Lower gate numbers are to the left on the map.</p>';
      nearBox.innerHTML = out;
      if (o.still) return;
      setFilter(null, true);
      var p = [gx(gate), Y.spine];
      travel(fit(frameFor(p, "gate")), p);
    }
    each(root.querySelectorAll(".tm-key"), function (k) {
      k.addEventListener("click", function () { selectGate(+k.getAttribute("data-gate"), { scrollKey: false }); });
    });

    /* ---------------- highlights (filters) ---------------- */
    var readout = root.querySelector(".tm-filter-readout");
    var filter = null;
    function setFilter(id, quiet) {
      if (id === filter) id = null;
      filter = id;
      each(root.querySelectorAll(".tm-filter"), function (b) {
        var on = b.getAttribute("data-f") === id;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (id) svg.setAttribute("data-filter", id); else svg.removeAttribute("data-filter");
      each(svg.querySelectorAll(".tm-amen"), function (el) { el.classList.toggle("is-on", el.getAttribute("data-a") === id); });
      var a = AMENITIES.filter(function (x) { return x.id === id; })[0];
      var gatesHere = a ? a.gates.filter(inTerminal) : [];
      each(svg.querySelectorAll(".tm-badge"), function (el) { el.classList.toggle("is-lit", gatesHere.indexOf(+el.getAttribute("data-gate")) !== -1); });
      if (!a) { readout.textContent = ""; readout.classList.remove("is-on"); return; }
      readout.innerHTML = '<span aria-hidden="true">' + a.icon + '</span> ' + gatesHere.length + ' ' + esc(gatesHere.length === 1 ? a.name.toLowerCase() : a.plural) +
        ' in ' + esc(def.title) + ': <strong>' + (gatesHere.length === 1 ? "Gate " : "Gates ") + gatesHere.join(", ") + '</strong>';
      readout.classList.add("is-on");
      if (!quiet) travel(overview(), null);
    }
    each(root.querySelectorAll(".tm-filter"), function (b) {
      b.addEventListener("click", function () { setFilter(b.getAttribute("data-f")); });
    });

    /* ---------------- map input: taps, keys, drag, zoom ---------------- */
    var drag = null, dragged = false;
    function activate(target) {
      var pin = target.closest(".tm-pin");
      if (pin) { goStop(+pin.getAttribute("data-stop")); return true; }
      var gate = target.closest(".tm-gate, .tm-badge");
      if (gate) { selectGate(+gate.getAttribute("data-gate")); return true; }
      return false;
    }
    svg.addEventListener("click", function (e) {
      if (dragged) { dragged = false; return; }
      activate(e.target);
    });
    svg.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (activate(e.target)) e.preventDefault();
    });
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.target.closest(".tm-zoom")) return;
      drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, on: false, id: e.pointerId };
      dragged = false;
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy)) return;   // vertical = page scroll
        drag.on = true; dragged = true;
        if (anim) { cancelAnimationFrame(anim); anim = 0; wrap.classList.remove("is-moving"); }
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        stage.classList.add("is-dragging");
        wrap.classList.add("has-moved");
      }
      var k = cam.w / stage.clientWidth;
      cam = constrain({ x: drag.cx - dx * k, y: drag.cy - dy * k, w: cam.w, h: cam.h });
      applyCam();
    });
    function endDrag() {
      if (drag && drag.on) setTimeout(function () { dragged = false; }, 0);
      drag = null;
      stage.classList.remove("is-dragging");
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    each(root.querySelectorAll(".tm-zoom button"), function (b) {
      b.addEventListener("click", function () {
        var z = b.getAttribute("data-z");
        wrap.classList.add("has-moved");
        if (z === "fit") { travel(overview(), null); return; }
        var f = z === "in" ? 0.62 : 1.6;
        var w = clamp(cam.w * f, 300, Math.max(W, H * aspect)), hh = w / aspect;
        travel(constrain({ x: cam.x + cam.w / 2 - w / 2, y: cam.y + cam.h / 2 - hh / 2, w: w, h: hh }), null);
      });
    });

    /* ---------------- boot ---------------- */
    measure();
    cam = overview();
    applyCam();
    goStop(0, { instant: true, still: true });

    var ro = null, io = null, entered = false;
    function enter() {
      if (entered || destroyed) return;
      entered = true;
      wrap.classList.add("is-in");
      setTimeout(function () { wrap.classList.add("has-moved"); }, 7000);   // retire the hint
      setTimeout(function () {
        if (!destroyed) travel(fit(frameFor(stops[0].pos)), stops[0].pos, function () { booted = true; });
      }, reduceMotion ? 0 : 950);
    }
    if ("ResizeObserver" in window) {
      var lastAspect = aspect;
      ro = new ResizeObserver(function () {
        measure();
        if (Math.abs(aspect - lastAspect) < 0.01) return;
        lastAspect = aspect;
        if (anim) { cancelAnimationFrame(anim); anim = 0; wrap.classList.remove("is-moving"); }
        // re-frame whatever we were looking at for the new shape
        var c = { x0: cam.x + cam.w * 0.5 - 1, x1: cam.x + cam.w * 0.5 + 1, y0: cam.y, y1: cam.y + cam.h };
        cam = entered ? fit(gateSel && !filter ? frameFor([gx(gateSel), Y.spine], "gate") : frameFor(youPos)) : overview();
        void c;
        applyCam();
      });
      ro.observe(stage);
    }
    if ("IntersectionObserver" in window && !reduceMotion) {
      io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { enter(); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(stage);
    } else {
      enter();
    }

    live = {
      destroy: function () {
        destroyed = true;
        if (anim) cancelAnimationFrame(anim);
        clearTimeout(swapT);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        live = null;
      }
    };
  }

  /* a top-down airliner, nose at (0,0) pointing down the page */
  function planeShape(tail) {
    return '<path class="tm-plane__wing" d="M8 -64L66 -98V-110L8 -90ZM-8 -64L-66 -98V-110L-8 -90Z"/>' +
      '<path class="tm-plane__wing" d="M7 -134L30 -150V-157L7 -146ZM-7 -134L-30 -150V-157L-7 -146Z"/>' +
      '<path class="tm-plane__body" d="M0 0C7 -8 10 -20 10 -34V-122C10 -138 5 -152 0 -160C-5 -152 -10 -138 -10 -122V-34C-10 -20 -7 -8 0 0Z"/>' +
      '<path d="M0 -160C4 -153 7 -144 8.5 -134H-8.5C-7 -144 -4 -153 0 -160Z" fill="' + tail + '"/>' +
      '<path class="tm-plane__glass" d="M-5 -14C-3 -18 3 -18 5 -14C3 -11 -3 -11 -5 -14Z"/>';
  }

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  window.SJCTerminal = { render: render };
})();
