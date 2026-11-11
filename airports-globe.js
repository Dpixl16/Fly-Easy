/* ============================================================
   Airports — the 3D globe (loaded on demand by airports.js)

   Earth: one sphere with a custom shader that blends NASA's
   Blue Marble (day) and Black Marble (night lights) along the
   real, current day/night line, plus ocean sun-glint and a rim
   haze. A back-face shell adds the atmosphere glow.

   Camera: OrbitControls around the planet's center. flyTo()
   arcs over the surface (direction slerp + eased distance with
   an altitude "climb" for long hops) instead of cutting through.

   Pins are HTML (crisp text, site fonts, keyboard focus),
   projected to screen space every rendered frame and merged into
   one cluster pin while their labels would overlap.

   Rendering is on-demand: frames are drawn only while something
   moves, and the loop sleeps while the stage is off-screen.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEG = Math.PI / 180;
const MIN_DIST = 1.12;        // closest zoom over the base globe (closer just shows pixels)
const MIN_DIST_PATCH = 1.05;  // closest zoom over a sharp regional patch
const ARRIVE_DIST = 1.36;     // "region" view for an airport without a patch
const ARRIVE_DIST_PATCH = 1.22; // ...and with one: lower, because it stays crisp
const FOV = 36;

export function latLonToVec(lat, lon, r = 1) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* Where the sun is overhead right now (subsolar point), as a unit vector. */
function sunDirection(date = new Date()) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (date.getTime() - startOfYear) / 864e5;
  const decl = -23.44 * Math.cos((2 * Math.PI / 365) * (day + 10));
  const B = (2 * Math.PI * (day - 81)) / 364;
  const eqTimeMin = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const lon = -15 * (hours - 12 + eqTimeMin / 60);
  return latLonToVec(decl, lon).normalize();
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInCubic = (t) => t * t * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- Shaders ---------------- */
const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const EARTH_FRAG = /* glsl */ `
  // Used twice: the whole globe, and (with PATCH defined) each sharp
  // regional patch laid over it. Same lighting, so the two match.
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D waterMap;
  uniform vec3 sunDir;
  uniform vec3 camPos;
#ifdef PATCH
  uniform vec4 bounds;      // lonMin, latMin, lonMax, latMax (degrees)
  uniform float opacity;
#endif
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(camPos - vPosW);
    float ndl = dot(N, sunDir);
    float dayMix = smoothstep(-0.10, 0.16, ndl);

    vec2 worldUv = vUv;
#ifdef PATCH
    worldUv = vec2((mix(bounds.x, bounds.z, vUv.x) + 180.0) / 360.0,
                   (mix(bounds.y, bounds.w, vUv.y) + 90.0) / 180.0);
#endif

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 dayLit = day * (0.42 + 0.72 * clamp(ndl * 1.25 + 0.25, 0.0, 1.0));

    vec3 lights = texture2D(nightMap, vUv).rgb;
#ifdef PATCH
    // Black Marble 2016 also contains faint moonlit land; keep only the lights
    float lum = dot(lights, vec3(0.3, 0.59, 0.11));
    lights *= smoothstep(0.14, 0.9, lum);
    lights = pow(lights, vec3(1.6)) * vec3(1.30, 1.05, 0.72) * 0.95;
#else
    lights = pow(lights, vec3(1.25)) * vec3(1.45, 1.12, 0.72) * 1.7;   // warm sodium glow
#endif
    vec3 night = day * vec3(0.06, 0.07, 0.11) + lights;               // faint moonlit land

    vec3 col = mix(night, dayLit, dayMix);

    // ocean sun-glint
    float water = texture2D(waterMap, worldUv).r;
    vec3 H = normalize(sunDir + V);
    float spec = pow(max(dot(N, H), 0.0), 70.0) * water * dayMix;
    col += vec3(1.0, 0.94, 0.82) * spec * 0.5;

    // golden-hour band along the terminator
    float twilight = smoothstep(-0.18, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.22, ndl));
    col += vec3(1.0, 0.42, 0.18) * twilight * 0.10;

    // atmospheric haze toward the limb
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 haze = vec3(0.36, 0.64, 1.0) * (0.18 + 0.82 * smoothstep(-0.3, 0.4, ndl));
    col = mix(col, haze, fres * 0.6);

#ifdef PATCH
    // feather the edges so the patch melts into the base globe
    float e = 0.14;
    float fx = smoothstep(0.0, e, vUv.x) * smoothstep(0.0, e, 1.0 - vUv.x);
    float fy = smoothstep(0.0, e, vUv.y) * smoothstep(0.0, e, 1.0 - vUv.y);
    gl_FragColor = vec4(col, fx * fy * opacity);
#else
    gl_FragColor = vec4(col, 1.0);
#endif
  }
`;
const ATMO_VERT = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vNormalW;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMO_FRAG = /* glsl */ `
  uniform vec3 sunDir;
  uniform float opacity;
  varying vec3 vNormalV;
  varying vec3 vNormalW;
  void main() {
    float rim = pow(clamp(0.68 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.2);
    float lit = 0.22 + 0.78 * smoothstep(-0.35, 0.45, dot(normalize(vNormalW), sunDir));
    vec3 c = vec3(0.30, 0.62, 1.0) * rim * lit * 2.2;
    gl_FragColor = vec4(c, 1.0) * opacity;
  }
`;

/* ---------------- Globe ---------------- */
export async function createGlobe({ container, pinLayer, airports, patches = [], reduceMotion, onPick, onUserMove, onZoomChange }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x02050d, 1);
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.005, 200);

  /* --- loop + interaction state (declared up front; used by everything below) --- */
  let dirty = true;
  let running = true;
  let raf = 0;
  let tween = null;
  let activeId = null;
  let idleTimer = null;
  let wasZoomedIn = false;

  /* --- size + framing --- */
  let W = 1, H = 1, homeDist = 3.2;
  function computeHomeDist() {
    // globe fills ~76% of the smaller screen dimension
    const vHalf = (FOV / 2) * DEG;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    return 1 / Math.sin(0.76 * Math.min(vHalf, hHalf));
  }
  function resize() {
    W = Math.max(1, container.clientWidth);
    H = Math.max(1, container.clientHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // desktop: nudge the planet down a little so the title/search sit in space
    if (W > 760) camera.setViewOffset(W, H, 0, -H * 0.05, W, H);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    homeDist = computeHomeDist();
    // only a little zoom-out room past the home view; beyond it the wheel scrolls the page
    controls.maxDistance = homeDist * 1.02;
    dirty = true;
  }

  /* --- textures (tiny preview first, then full size) --- */
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const load = (url) => loader.loadAsync(url).then((t) => {
    t.anisotropy = maxAniso;
    return t;
  });
  // 4K whenever the GPU allows it (the region zoom needs every pixel);
  // 2K only on low-memory devices
  const big =
    renderer.capabilities.maxTextureSize >= 4096 &&
    !(navigator.deviceMemory && navigator.deviceMemory < 4);

  const [dayLo, nightLo, water] = await withTimeout(Promise.all([
    load("images/globe/earth-day-512.jpg"),
    load("images/globe/earth-night-512.jpg"),
    load("images/globe/earth-water.png"),
  ]), 15000);

  const sun = sunDirection();
  const earthUniforms = {
    dayMap: { value: dayLo },
    nightMap: { value: nightLo },
    waterMap: { value: water },
    sunDir: { value: sun.clone() },
    camPos: { value: new THREE.Vector3() },
  };
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 160, 80),
    new THREE.ShaderMaterial({ uniforms: earthUniforms, vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG })
  );
  scene.add(earth);

  const atmoUniforms = { sunDir: earthUniforms.sunDir, opacity: { value: 1 } };
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.075, 96, 48),
    new THREE.ShaderMaterial({
      uniforms: atmoUniforms,
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  scene.add(atmosphere);
  scene.add(makeStars());

  // full-resolution swap, in the background
  const size = big ? "4k" : "2k";
  Promise.all([load(`images/globe/earth-day-${size}.jpg`), load(`images/globe/earth-night-${size}.jpg`)])
    .then(([d, n]) => {
      earthUniforms.dayMap.value = d;
      earthUniforms.nightMap.value = n;
      dayLo.dispose(); nightLo.dispose();
      dirty = true;
    })
    .catch(() => { /* keep the preview textures; still usable */ });

  /* --- sharp regional patches (lazy: loaded when you get near one) --- */
  const patchList = patches.map((p) => {
    const [lonMin, latMin, lonMax, latMax] = p.bounds;
    return {
      ...p, lonMin, latMin, lonMax, latMax,
      center: latLonToVec((latMin + latMax) / 2, (lonMin + lonMax) / 2).normalize(),
      // angular radius of the patch, roughly
      radius: Math.max(lonMax - lonMin, latMax - latMin) * 0.5 * DEG,
      state: "idle", mesh: null, fadeStart: 0,
    };
  });
  const patchFor = (lat, lon) => patchList.find((p) =>
    lon > p.lonMin + 1 && lon < p.lonMax - 1 && lat > p.latMin + 1 && lat < p.latMax - 1);
  function ensurePatch(p) {
    if (p.state !== "idle") return p.promise;
    p.state = "loading";
    p.promise = Promise.all([load(p.day), load(p.night)]).then(([d, n]) => {
      const geo = new THREE.SphereGeometry(1, 72, 64,
        (p.lonMin + 180) * DEG, (p.lonMax - p.lonMin) * DEG,
        (90 - p.latMax) * DEG, (p.latMax - p.latMin) * DEG);
      const mat = new THREE.ShaderMaterial({
        defines: { PATCH: "" },
        uniforms: {
          dayMap: { value: d }, nightMap: { value: n },
          waterMap: earthUniforms.waterMap, sunDir: earthUniforms.sunDir, camPos: earthUniforms.camPos,
          bounds: { value: new THREE.Vector4(p.lonMin, p.latMin, p.lonMax, p.latMax) },
          opacity: { value: reduceMotion ? 1 : 0 },
        },
        vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG,
        transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      p.mesh = new THREE.Mesh(geo, mat);
      p.mesh.renderOrder = 1;
      scene.add(p.mesh);
      p.state = "ready";
      p.fadeStart = performance.now();
      dirty = true; wake();
    }).catch(() => { p.state = "failed"; });
    return p.promise;
  }
  // fade freshly loaded patches in; returns true while any is still fading
  function stepPatches(now) {
    let fading = false;
    const camDir = camera.position.clone().normalize();
    const dist = camera.position.length();
    patchList.forEach((p) => {
      if (p.state === "idle" && dist < 2.4 && camDir.angleTo(p.center) < p.radius + 0.35) ensurePatch(p);
      if (p.state !== "ready") return;
      // fade in after loading, and out again as you pull back to space
      // (from far away the base globe already looks right)
      const loadFade = reduceMotion ? 1 : clamp((now - p.fadeStart) / 700, 0, 1);
      const t = clamp((dist - 1.42) / 0.4, 0, 1);
      const distFade = 1 - t * t * (3 - 2 * t);
      const o = loadFade * distFade;
      const u = p.mesh.material.uniforms.opacity;
      if (Math.abs(u.value - o) > 0.001) { u.value = o; fading = loadFade < 1; }
      p.mesh.visible = o > 0.001;
    });
    return fading;
  }
  // allow a closer zoom only above a loaded patch (eased, so it never snaps)
  function stepMinDistance() {
    const v = camera.position;
    const lat = Math.asin(clamp(v.y / v.length(), -1, 1)) / DEG;
    const lon = ((Math.atan2(v.z, -v.x) / DEG) + 360) % 360 - 180;
    const p = patchFor(lat, lon);
    const target = p && p.state === "ready" ? MIN_DIST_PATCH : MIN_DIST;
    const cur = controls.minDistance;
    if (Math.abs(cur - target) < 0.0005) { controls.minDistance = target; return false; }
    controls.minDistance = cur + (target - cur) * 0.08;
    return v.length() < controls.minDistance + 0.01;   // keep rendering while it lifts us
  }

  // the day/night line keeps moving
  setInterval(() => { earthUniforms.sunDir.value.copy(sunDirection()); dirty = true; }, 60000);

  /* --- controls --- */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = MIN_DIST;
  controls.maxDistance = 8;
  controls.zoomSpeed = 0.7;
  controls.rotateSpeed = 0.6;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.28;

  resize();

  // start over the guides, a little east so they rotate into view
  const centroid = new THREE.Vector3();
  airports.forEach((a) => centroid.add(latLonToVec(a.lat, a.lon)));
  const startDir = (airports.length ? centroid.normalize() : latLonToVec(25, -100))
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), reduceMotion ? 0 : 18 * DEG);
  startDir.y = Math.max(startDir.y, Math.sin(18 * DEG));
  startDir.normalize();
  camera.position.copy(startDir).multiplyScalar(homeDist);
  camera.lookAt(0, 0, 0);
  controls.update();

  controls.addEventListener("start", () => {
    cancelTween();
    controls.autoRotate = false;
    clearTimeout(idleTimer);
    onUserMove && onUserMove();
  });
  controls.addEventListener("end", () => {
    clearTimeout(idleTimer);
    if (reduceMotion) return;
    // drift again after a quiet spell, but only when zoomed out
    idleTimer = setTimeout(() => {
      if (!tween && !activeId && camera.position.length() > homeDist * 0.8) controls.autoRotate = true;
    }, 15000);
  });

  /* --- pins --- */
  const pinData = airports.map((a) => ({ a, pos: latLonToVec(a.lat, a.lon, 1.0) }));
  const pinEls = new Map();     // key -> button

  function pinElement(key, members) {
    let b = pinEls.get(key);
    if (b) return b;
    b = document.createElement("button");
    b.type = "button";
    b.className = "ap-pin" + (members.length > 1 ? " is-cluster" : "");
    const dot = document.createElement("span");
    dot.className = "ap-pin__dot";
    const label = document.createElement("span");
    label.className = "ap-pin__label";
    const code = document.createElement("span");
    code.className = "ap-pin__code";
    code.textContent = members.map((m) => m.a.iata).join(" · ");
    label.append(code);
    if (members.length === 1) {
      const city = document.createElement("span");
      city.className = "ap-pin__city";
      city.textContent = members[0].a.city;
      // shown only while this airport is selected: the pin itself opens the guide
      const go = document.createElement("span");
      go.className = "ap-pin__go";
      go.innerHTML = 'Open guide<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      label.append(city, go);
      b.setAttribute("aria-label", `${members[0].a.iata}, ${members[0].a.name}. Fly there`);
    } else {
      const count = document.createElement("span");
      count.className = "ap-pin__count";
      count.textContent = String(members.length);
      label.append(count);
      b.setAttribute("aria-label", `${members.length} airports: ${members.map((m) => m.a.iata).join(", ")}. Zoom in`);
    }
    b.append(dot, label);
    b._members = members;
    b.addEventListener("pointerenter", () => members.forEach((m) => {
      const p = patchFor(m.a.lat, m.a.lon);
      if (p) ensurePatch(p);
    }));
    b.addEventListener("click", () => {
      const ms = b._members;
      if (ms.length === 1) onPick(ms[0].a);
      else zoomToCluster(ms);
    });
    pinLayer.append(b);
    pinEls.set(key, b);
    return b;
  }

  const tmp = new THREE.Vector3();
  const pinSize = { w: 118, h: 30 };   // measured below from a real label
  function updatePins() {
    const cam = camera.position;
    const camLen = cam.length();
    // 1) project + visibility (a surface point p is visible when dot(p, cam) > |p|^2 = 1)
    const vis = [];
    pinData.forEach((p) => {
      const facing = p.pos.dot(cam);
      if (facing < 1.0 + 0.02 * camLen) return;
      tmp.copy(p.pos).project(camera);
      if (tmp.z > 1) return;
      vis.push({ p, x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H });
    });
    // 2) label placement: labels go right of the dot; when two would
    //    collide, the western one flips its label to the left; only when
    //    neither side fits do they merge into one cluster pin. Labels must
    //    stay on screen. The selected pin's wider "Open guide" label is
    //    tried first; if it can't fit, it's placed compact instead.
    const PAD = 2, DOT = 6, EDGE = 6;
    vis.sort((u, v) => u.x - v.x);
    function place(goOk) {
      const groups = [];
      const boxFor = (x, y, side, wide, active) => {
        const w = pinSize.w * (wide ? 1.15 : 1) + (active && goOk ? 104 : 0), h = pinSize.h;
        return side === "right" ? [x - DOT, y - h / 2, x + w, y + h / 2] : [x - w, y - h / 2, x + DOT, y + h / 2];
      };
      const hit = (A, B) => A[0] < B[2] + PAD && B[0] < A[2] + PAD && A[1] < B[3] + PAD && B[1] < A[3] + PAD;
      const fits = (box) => box[0] >= EDGE && box[2] <= W - EDGE;
      const free = (box, except) => !groups.some((g) => g !== except && hit(g.box, box));
      let activeOk = true;
      vis.forEach((v) => {
        const act = v.p.a.id === activeId;
        const rb = boxFor(v.x, v.y, "right", false, act);
        const lb = boxFor(v.x, v.y, "left", false, act);
        if (fits(rb) && free(rb)) { groups.push({ x: v.x, y: v.y, m: [v], side: "right", box: rb }); return; }
        const blockers = groups.filter((g) => hit(g.box, rb));
        if (fits(rb) && blockers.length === 1 && blockers[0].m.length === 1 && blockers[0].side === "right") {
          const g = blockers[0];
          const gl = boxFor(g.x, g.y, "left", false, g.m[0].p.a.id === activeId);
          if (fits(gl) && free(gl, g) && !hit(gl, rb)) {
            g.side = "left"; g.box = gl;
            groups.push({ x: v.x, y: v.y, m: [v], side: "right", box: rb });
            return;
          }
        }
        if (fits(lb) && free(lb)) { groups.push({ x: v.x, y: v.y, m: [v], side: "left", box: lb }); return; }
        if (!blockers.length) {
          // near a screen edge with nothing in the way: take the side with more room
          const side = v.x > W / 2 ? "left" : "right";
          if (act) activeOk = false;
          groups.push({ x: v.x, y: v.y, m: [v], side, box: side === "left" ? lb : rb });
          return;
        }
        if (act || blockers[0].m.some((m) => m.p.a.id === activeId)) activeOk = false;
        const g = blockers[0];
        g.m.push(v);
        g.x = g.m.reduce((sum, m) => sum + m.x, 0) / g.m.length;
        g.y = g.m.reduce((sum, m) => sum + m.y, 0) / g.m.length;
        g.side = "right";
        g.box = boxFor(g.x, g.y, "right", true);
      });
      return { groups, activeOk };
    }
    let compactActive = false;
    let { groups, activeOk } = place(true);
    if (activeId && !activeOk) { groups = place(false).groups; compactActive = true; }
    // 3) place / reuse DOM
    const seen = new Set();
    groups.forEach((g) => {
      const members = g.m.map((m) => m.p).sort((u, v) => u.a.iata.localeCompare(v.a.iata));
      const key = members.map((m) => m.a.id).join("+");
      const b = pinElement(key, members);
      seen.add(key);
      const left = g.side === "left";
      b.classList.toggle("is-left", left);
      b.style.transform = `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) translate(${left ? "-100%" : "0"}, -50%)`;
      b.dataset.hidden = "false";
      const isActive = members.length === 1 && members[0].a.id === activeId;
      b.classList.toggle("is-compact", isActive && compactActive);
      if (b.classList.contains("is-active") !== isActive) {
        b.classList.toggle("is-active", isActive);
        if (members.length === 1) {
          const a = members[0].a;
          b.setAttribute("aria-label", isActive ? `Open the ${a.iata} guide` : `${a.iata}, ${a.name}. Fly there`);
        }
      }
    });
    pinEls.forEach((b, key) => {
      if (seen.has(key)) return;
      if (b === document.activeElement) b.blur();
      b.dataset.hidden = "true";
    });
    measurePins();
  }
  // measure a real single-pin label (once fonts are in) so clustering
  // uses true label sizes rather than a guess
  let fontsReady = !document.fonts;
  let measured = false;
  if (document.fonts) document.fonts.ready.then(() => { fontsReady = true; dirty = true; wake(); });
  function measurePins() {
    if (measured || !fontsReady) return;
    let w = 0, h = 0;
    pinEls.forEach((b) => {
      if (b._members.length !== 1 || b.dataset.hidden === "true" || b.classList.contains("is-active")) return;
      const l = b.querySelector(".ap-pin__label");
      w = Math.max(w, l.offsetWidth + 10);
      h = Math.max(h, l.offsetHeight);
    });
    if (w) { pinSize.w = w; pinSize.h = h; measured = true; dirty = true; }
  }

  /* --- camera tweens --- */
  function cancelTween() {
    if (!tween) return;
    const t = tween;
    tween = null;
    t.resolve(false);
  }
  function startTween(t) {
    cancelTween();
    controls.autoRotate = false;
    clearTimeout(idleTimer);
    return new Promise((resolve) => {
      tween = { ...t, start: performance.now(), resolve };
      wake();
    });
  }
  function stepTween(now) {
    const t = tween;
    const k = t.duration ? clamp((now - t.start) / t.duration, 0, 1) : 1;
    t.apply(k);
    camera.lookAt(0, 0, 0);
    if (k >= 1) {
      tween = null;
      controls.update();
      t.resolve(true);
    }
  }

  const qId = new THREE.Quaternion();
  function flyToDir(dir, dist, opts = {}) {
    const s = camera.position.clone().normalize();
    const e = dir.clone().normalize();
    const d0 = camera.position.length();
    const d1 = clamp(dist, MIN_DIST_PATCH, controls.maxDistance);
    const angle = s.angleTo(e);
    const q = new THREE.Quaternion().setFromUnitVectors(s, e);
    // long hops climb so you see the curve of the Earth, like a real flight
    const cruise = 1 + Math.min(2.4, angle * 1.15);
    const lift = Math.max(0, cruise - lerp(d0, d1, 0.5));
    const instant = opts.instant || reduceMotion;
    const duration = instant ? 0 : clamp(1100 + angle * 520 + Math.abs(Math.log(d0 / d1)) * 420, 1100, 2700);
    const qt = new THREE.Quaternion();
    return startTween({
      duration,
      apply(k) {
        const kd = easeInOutSine(k);
        qt.copy(qId).slerp(q, easeInOutCubic(k));
        const d = lerp(d0, d1, easeInOutCubic(k)) + lift * Math.sin(Math.PI * kd);
        camera.position.copy(s).applyQuaternion(qt).multiplyScalar(d);
      },
    });
  }

  function zoomToCluster(members) {
    const c = new THREE.Vector3();
    members.forEach((m) => c.add(m.pos));
    c.normalize();
    // high enough that the pins split (labels can flip left/right, so
    // ~28px apart is plenty), but never lower than the normal region view,
    // where the imagery still looks good
    let maxAng = 0;
    members.forEach((m) => members.forEach((n) => { maxAng = Math.max(maxAng, m.pos.angleTo(n.pos)); }));
    const vHalf = (FOV / 2) * DEG;
    const pxPerAltUnit = H / (2 * Math.tan(vHalf));
    const alt = clamp((maxAng * pxPerAltUnit) / 28, ARRIVE_DIST - 1, homeDist - 1);
    onUserMove && onUserMove();
    return flyToDir(c, 1 + alt);
  }

  /* --- render loop (on demand) --- */
  function frame(now) {
    raf = 0;
    if (!running) return;
    let changed = false;
    if (tween) { stepTween(now); changed = true; }
    else changed = controls.update();
    if (stepPatches(now)) changed = true;
    if (!tween && stepMinDistance()) changed = true;
    if (changed || dirty) {
      dirty = false;
      const dist = camera.position.length();
      // feel: slower rotation close to the ground
      controls.rotateSpeed = clamp((dist - 1) / (homeDist - 1), 0.04, 1) * 0.75;
      atmoUniforms.opacity.value = clamp((dist - 1.1) / 0.35, 0, 1);
      earthUniforms.camPos.value.copy(camera.position);
      renderer.render(scene, camera);
      updatePins();
      const zoomedIn = dist < homeDist * 0.72;
      if (zoomedIn !== wasZoomedIn) { wasZoomedIn = zoomedIn; onZoomChange && onZoomChange(zoomedIn); }
    }
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (running && !raf) raf = requestAnimationFrame(frame); }

  new ResizeObserver(() => { resize(); wake(); }).observe(container);

  /* Wheel: zoom the globe, but once it's fully zoomed out, scrolling down
     scrolls the page (to the guide list). Also once the page has scrolled
     at all, the wheel just scrolls. Pinch-zoom (ctrl+wheel) always zooms. */
  container.addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    const pastTop = container.getBoundingClientRect().top < -2;
    const zoomedOut = camera.position.length() >= homeDist * 0.995;
    if (pastTop || (e.deltaY > 0 && zoomedOut && !tween)) e.stopPropagation(); // OrbitControls never sees it
  }, { capture: true, passive: true });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      running = en.isIntersecting;
      if (running) { dirty = true; wake(); }
    }).observe(container);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { dirty = true; wake(); }
  });

  // first frame before we report ready, so the fade-in shows a planet
  renderer.render(scene, camera);
  wake();

  /* --- public API --- */
  return {
    flyTo(a, opts = {}) {
      const p = patchFor(a.lat, a.lon);
      if (p) ensurePatch(p);              // start loading now; it fades in on arrival
      return flyToDir(latLonToVec(a.lat, a.lon), p ? ARRIVE_DIST_PATCH : ARRIVE_DIST, opts);
    },
    prefetch(a) {
      const p = patchFor(a.lat, a.lon);
      if (p) ensurePatch(p);
    },
    dive(a) {
      const dir = latLonToVec(a.lat, a.lon).normalize();
      const s = camera.position.clone().normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(s, dir);
      const d0 = camera.position.length();
      const qt = new THREE.Quaternion();
      return startTween({
        duration: 650,
        apply(k) {
          const e = easeInCubic(k);
          qt.copy(qId).slerp(q, Math.min(1, k * 1.5));
          camera.position.copy(s).applyQuaternion(qt).multiplyScalar(lerp(d0, 1.012, e));
        },
      });
    },
    zoomBy(f) {
      const dir = camera.position.clone().normalize();
      const d = camera.position.length();
      const alt = clamp((d - 1) * f, controls.minDistance - 1, controls.maxDistance - 1);
      return flyToDir(dir, 1 + alt);
    },
    home() {
      const dir = camera.position.clone().normalize();
      return flyToDir(dir, homeDist).then((ok) => {
        if (ok && !reduceMotion) controls.autoRotate = true;
        return ok;
      });
    },
    setActive(id) { activeId = id; dirty = true; wake(); },
    // returning from a guide: start just above the airport, then climb to space
    rise(a) {
      const dir = latLonToVec(a.lat, a.lon).normalize();
      const p = patchFor(a.lat, a.lon);
      const sharp = p ? ensurePatch(p) : Promise.resolve();
      camera.position.copy(dir).multiplyScalar(1.06);
      camera.lookAt(0, 0, 0);
      controls.update();
      dirty = true;
      if (reduceMotion) { camera.position.copy(dir).multiplyScalar(homeDist); controls.update(); return Promise.resolve(true); }
      // tilt the end point a bit toward the equator so the planet's curve shows
      const end = dir.clone().lerp(new THREE.Vector3(dir.x, 0, dir.z).normalize(), 0.25).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(dir, end);
      const qt = new THREE.Quaternion();
      // wait (briefly) for the sharp patch so lift-off starts crisp
      const ready = Promise.race([sharp, new Promise((r) => setTimeout(r, 1200))]);
      return ready.then(() => startTween({
        duration: 2300,
        apply(k) {
          const e = 1 - Math.pow(1 - k, 3);          // fast lift-off, gentle arrival
          qt.copy(qId).slerp(q, easeInOutCubic(k));
          camera.position.copy(dir).applyQuaternion(qt).multiplyScalar(lerp(1.06, homeDist, e));
        },
      })).then((ok) => {
        if (ok && !reduceMotion) controls.autoRotate = true;
        return ok;
      });
    },
  };
}

/* ---------------- helpers ---------------- */
function makeStars() {
  const n = 2200;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.randomDirection().multiplyScalar(80);
    pos.set([v.x, v.y, v.z], i * 3);
    const b = 0.35 + Math.pow(Math.random(), 3) * 0.65;
    const warm = Math.random() < 0.15;
    col.set([b, b * (warm ? 0.9 : 0.97), b * (warm ? 0.78 : 1)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false,
  }));
}

function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("texture timeout")), ms))]);
}
