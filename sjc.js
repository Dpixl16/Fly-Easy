/* ============================================================
   SJC Tips (demo) — circuit-board explorer.
   Self-contained so the shared script.js stays untouched until
   this page is approved. The chips are the real tab buttons; the
   panel render + directional slide are ported from the SFO
   explorer (runTerminalExplorer in script.js), and the signal
   pulse borrows the SFO AirTrain car's tween approach.
   ============================================================ */
(function () {
  var board = document.getElementById("sjc-board");
  if (!board) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STOPS = {
    /* Terminals A and B are drawn by sjc-terminal.js. Facts checked
       against flysanjose.com in November 2026 (see Sources). */
    termA: {
      eyebrow: "SJC · Gates 1–16",
      title: "Terminal A",
      badge: "Opens 4:00am",
      terminal: {
        key: "A",
        title: "Terminal A",
        otherName: "Terminal B",
        gates: [1, 16],
        landGate: 12,
        empty: [3, 11],
        next: { side: "right", label: "TO TERMINAL B →" },
        airlines: ["American", "Delta", "Frontier", "United", "Volaris"],
        brief: [
          ["4:00<small>am</small>", "Security opens", "and stays open until the last departure"],
          ["0", "Re-screenings to reach Terminal B", "walk gate to gate once you're through"],
          ["2<small>hrs</small>", "Arrive before a domestic flight", "3 hours for international (TSA's advice)"]
        ],
        stops: [
          { at: "curb", icon: "🚗", label: "Curb", kicker: "Curbside", title: "Drop-offs and pickups",
            text: "Drop-offs use the departures curb. For pickups, Lyft and Uber meet at <strong>Stop 1</strong> and Waymo at <strong>Stop 9</strong>. Always go to the stop your app shows." },
          { at: "checkin", icon: "🎫", label: "Check-in", kicker: "Ticketing", title: "At the wrong terminal? You may not need to move",
            text: "With a boarding pass and <strong>carry-on bags only</strong>, SJC lets you go through <strong>either terminal's checkpoint</strong>, then walk to your gate inside. Checking a bag? You'll need your own airline's counter." },
          { at: "security", icon: "🛂", label: "Security", kicker: "Opens 4:00am", title: "Terminal A checkpoint",
            text: "CLEAR is staffed Sun–Fri 4:30am–7pm and Sat 4:30am–4pm. Have TSA PreCheck on American, Delta or United? Opt in to <strong>Touchless ID</strong> in the airline app and you can keep your ID in your pocket (bring it anyway as a backup)." },
          { gate: 8, icon: "🎳", label: "Family corner", kicker: "Near Gate 8 · kids", title: "The family corner",
            text: "The <strong>Rolling Ball Sculpture</strong> keeps kids (and adults) watching. Close by: a private nursing room, open 24/7 with a sink, changing table and outlets, plus a water refill station." },
          { gate: 9, icon: "🔌", label: "Power Suite", kicker: "Gate 9 · free", title: "Power Suite",
            text: "Free workstations with built-in outlets and comfortable seats, so you can charge up before boarding. The other two are at Gates 18 and 28." },
          { gate: 15, icon: "🛋️", label: "The Club", kicker: "Gate 15 · 5am–10pm daily", title: "The Club SJC lounge",
            text: "Open to passengers on <strong>any airline</strong>: use Priority Pass or LoungeKey, or buy a $60 day pass. Snacks, drinks, workstations and showers inside. Airline lounge memberships aren't accepted." },
          { gate: 16.5, icon: "🚶", label: "Walk to B", kicker: "Gates 16 → 17", title: "Keep walking into Terminal B",
            text: "After security, A and B are one building: no re-screening, no tram, and every shop and restaurant in both is open to you. This walkway also has SJC's <strong>only pet relief area past security</strong>." }
        ]
      }
    },
    termB: {
      eyebrow: "SJC · Gates 17–36",
      title: "Terminal B",
      badge: "Opens 4:15am",
      terminal: {
        key: "B",
        title: "Terminal B",
        otherName: "Terminal A",
        gates: [17, 36],
        landGate: 21,
        empty: [20, 27, 34],
        next: { side: "left", label: "← TO TERMINAL A" },
        far: [29, 36, "GATES 29–36 · THE FAR END"],
        farNote: "⏱️ Gates 29–36 are the far end of the terminal, so head over early. Gate 32 has restrooms and water, so you won't need to walk back.",
        airlines: ["Alaska", "Hawaiian", "Southwest", "ZIPAIR"],
        brief: [
          ["4:15<small>am</small>", "Security opens", "and stays open until the last departure"],
          ["0", "Re-screenings to reach Terminal A", "walk gate to gate once you're through"],
          ["2<small>hrs</small>", "Arrive before a domestic flight", "3 hours for international (TSA's advice)"]
        ],
        stops: [
          { at: "curb", icon: "🚗", label: "Curb", kicker: "Curbside", title: "Drop-offs and pickups",
            text: "Pickups are on the Ground Transportation Island: Waymo at <strong>Stop 7</strong>, Uber at <strong>Stops 8 and 9</strong>, Lyft at <strong>Stop 10</strong>. The Rental Car Center is right across from Terminal B." },
          { at: "checkin", icon: "🎫", label: "Check-in", kicker: "Ticketing", title: "At the wrong terminal? You may not need to move",
            text: "With a boarding pass and <strong>carry-on bags only</strong>, SJC lets you go through <strong>either terminal's checkpoint</strong>, then walk to your gate inside. Checking a bag? You'll need your own airline's counter." },
          { at: "security", icon: "🛂", label: "Security", kicker: "Opens 4:15am", title: "Terminal B checkpoint",
            text: "CLEAR+ members can use the <strong>eGates</strong> at the PreCheck lane (added March 2026). CLEAR is staffed Sun–Fri 4:30am–8pm and Sat 4:30am–6pm, and signs people up for TSA PreCheck with no appointment. PreCheck on Alaska, Hawaiian or Southwest? Opt in to Touchless ID in the airline app." },
          { gate: 16.5, icon: "🪺", label: "Walkway", kicker: "Gates 16 ← 17", title: "The walkway to Terminal A",
            text: "Walk to Terminal A with no re-screening; The Club SJC lounge is just past it at Gate 15. SJC's <strong>only pet relief area past security</strong> is here. <strong>The Nest</strong>, a sensory-friendly room for kids, is expected to open across from Gate 17 in winter 2026.",
            action: { open: "core", label: "See the Calm Core →" } },
          { gate: 18, icon: "🔌", label: "Power Suite", kicker: "Gate 18 · free", title: "Power Suite",
            text: "Free workstations with built-in outlets and comfortable seats. There's another at Gate 28, and Gate 18 also has restrooms and a nursing room." },
          { gate: 24, icon: "🧒", label: "Zoom Zone", kicker: "Near Gates 24–25 · kids", title: "Zoom Zone play area",
            text: "A 600 sq ft play area built by the Children's Discovery Museum, all about how things fly. Restrooms, a nursing room and a water refill station are right at Gate 24." },
          { gate: 32, icon: "⏱️", label: "Far end", kicker: "Gates 29–36", title: "The far end",
            text: "These gates are the longest walk in the terminal, so head over early rather than waiting near security. <strong>Gate 32</strong> has restrooms and a water refill station, so you won't need to walk back." }
        ]
      }
    },
    intl: {
      eyebrow: "SJC · International Arrivals Building",
      title: "International Arrivals",
      badge: "Customs",
      col1Label: "🛬 On arrival",
      col2Label: "🧭 Good to know",
      chips: ["Global Entry kiosks", "Mobile Passport Control"],
      notes: [
        "🏢 <strong>It's a separate building</strong>, just past the Terminal A ticketing lobbies, with its own baggage claim after customs.",
        "📱 <strong>Mobile Passport Control and Global Entry</strong> are both available and can shorten the customs line.",
        "🚗 <strong>Meeting someone?</strong> Greeters should park in Hourly Lot 2, the closest garage.",
        "🚌 <strong>Renting a car?</strong> The free airport shuttle runs from here to the Rental Car Center."
      ]
    },
    transit: {
      eyebrow: "SJC · Getting Around",
      title: "Transportation",
      badge: "All terminals",
      warning: {
        title: "Switching terminals before security?",
        text: "On foot it's a long walk along the curb. Take the free airport shuttle instead: it runs 24/7, about every 7–10 minutes, from Terminal A Stop 6."
      },
      col1Label: "🚦 Ways to go",
      col2Label: "🧭 Good to know",
      chips: ["VTA Route 60", "Uber / Lyft", "Waymo", "Airport shuttle", "Rental Car Center"],
      notes: [
        "🚌 <strong>VTA Route 60 is free when you board at SJC</strong>, in either direction. It connects to Milpitas BART, Metro/Airport light rail and Santa Clara Caltrain.",
        "🚧 <strong>Route 60's Terminal A stop is temporarily moved</strong> for construction. Follow the signs and <a href=\"https://www.vta.org/go/service-alerts/route-60-vta-terminal-stop-relocation\" target=\"_blank\" rel=\"noopener\">check VTA's alert</a>.",
        "🚗 <strong>Rideshare</strong>: Terminal A Stop 1 (Uber/Lyft), Terminal B island Stops 8–10 (Uber/Lyft). Always go to the stop your app shows.",
        "🤖 <strong>Waymo</strong> (at SJC since Nov 2025): Terminal A Stop 9, Terminal B Stop 7.",
        "🔑 <strong>Rental Car Center is across from Terminal B</strong>. Walk over from B, or ride the shuttle from A. Free cell phone lot at 2470 Airport Blvd."
      ]
    },
    parking: {
      eyebrow: "SJC · Parking",
      title: "Parking",
      badge: "Book online",
      warning: {
        title: "Rates change, so check before you park",
        text: "These are the daily maximums posted in October 2026. Reserve at flysanjose.com/parking, which also shows live space availability."
      },
      col1Label: "🅿️ Lots · daily max",
      col2Label: "🧭 Good to know",
      chips: ["Economy Lot 1 · $19", "Lot 2 (Term. A) · $25", "Lot 3 (Term. B) · $41", "Daily Lot 4 · $31", "Lot 5 · $31"],
      chipClass: "chip--price",
      notes: [
        "🧭 <strong>Match your lot to your terminal</strong>: Lot 2 serves the Terminal A airlines, and Lots 3, 4 and 5 serve Terminal B.",
        "🚌 <strong>Economy Lot 1 is the cheapest</strong>, but you'll need the free shuttle. It stops at Terminal A first, then Terminal B.",
        "🔌 <strong>EV charging</strong> in Lots 2 and 5.",
        "⭐ <strong>New in 2026</strong>: Park Perks rewards (May) and Premium Reserved Parking, under a minute's walk from Terminal A (July).",
        "🧽 <strong>Optional Future Wash</strong> waterless car wash in the Hourly, Daily and Economy lots, so your car is clean when you land."
      ]
    }
  };

  /* ---------------- Board geometry ----------------
     Two hand-placed layouts (like the SFO map's desktop/mobile
     tracks): a wide board mirroring the real north→south building,
     and a tall one for phones. Node coords are viewBox units; the
     chip buttons are positioned by percentage from the same numbers. */
  var LAYOUTS = {
    desktop: {
      w: 1000, h: 380,
      nodes: { termA: [170, 115], core: [500, 115], termB: [830, 115], intl: [170, 285], transit: [500, 285], parking: [830, 285] },
      deco: [
        [[130, 80], [130, 46], [96, 12]],
        [[210, 80], [210, 52], [262, 52]],
        [[470, 80], [470, 40]],
        [[530, 80], [530, 56], [566, 30], [660, 30]],
        [[870, 80], [870, 44], [904, 12]],
        [[790, 80], [790, 52], [740, 52]],
        [[100, 285], [44, 285], [22, 307]],
        [[900, 285], [956, 285], [978, 263]],
        [[210, 320], [210, 352], [268, 352]],
        [[470, 320], [470, 360]],
        [[790, 320], [790, 352], [734, 352]],
        [[300, 200], [356, 200], [384, 228], [430, 228]],
        [[600, 228], [646, 200], [700, 200]]
      ],
      smd: [[300, 168, "R1"], [690, 240, "C4"], [380, 300, "R7"]],
      silk: [[30, 360, "FLY EASY · SJC · REV 1.0"]]
    },
    mobile: {
      w: 400, h: 560,
      nodes: { termA: [110, 85], core: [110, 280], termB: [110, 475], intl: [295, 85], transit: [295, 280], parking: [295, 475] },
      deco: [
        [[70, 52], [70, 22], [44, 6]],
        [[150, 52], [150, 26]],
        [[260, 52], [260, 24], [300, 24]],
        [[40, 280], [18, 280]],
        [[70, 508], [70, 536], [110, 536]],
        [[330, 508], [330, 540]],
        [[200, 180], [200, 150], [222, 128]],
        [[200, 380], [200, 410], [222, 432]]
      ],
      smd: [[200, 200, "R1"], [200, 370, "C4"]],
      silk: []
    }
  };
  var EDGES = [["termA", "core"], ["core", "termB"], ["termA", "intl"], ["core", "transit"], ["termB", "parking"]];

  var SVG_NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("sjc-board-svg");
  var chips = board.querySelectorAll(".sjc-chip");
  var mobileQuery = window.matchMedia("(max-width: 640px)");
  var layout, litPath, pulse, animId = null, fadeTimer = null;
  var currentKey = "termA";

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (parent || svg).appendChild(node);
    return node;
  }
  function pointsToD(pts) {
    return pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
  }

  function drawBoard() {
    layout = LAYOUTS[mobileQuery.matches ? "mobile" : "desktop"];
    svg.setAttribute("viewBox", "0 0 " + layout.w + " " + layout.h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    layout.deco.forEach(function (pts) {
      el("path", { d: pointsToD(pts), "class": "trace trace--deco" });
      var end = pts[pts.length - 1];
      el("circle", { cx: end[0], cy: end[1], r: 4.5, "class": "pad pad--deco" });
    });
    layout.smd.forEach(function (s) {
      el("rect", { x: s[0] - 13, y: s[1] - 6, width: 26, height: 12, rx: 2, "class": "smd" });
      el("text", { x: s[0] - 8, y: s[1] - 11, "class": "silk" }).textContent = s[2];
    });
    layout.silk.forEach(function (s) {
      el("text", { x: s[0], y: s[1], "class": "silk" }).textContent = s[2];
    });

    EDGES.forEach(function (e) {
      var d = pointsToD([layout.nodes[e[0]], layout.nodes[e[1]]]);
      el("path", { d: d, "class": "trace" });
      if (!reduceMotion) el("path", { d: d, "class": "trace--flow" });
    });

    litPath = el("path", { d: "", "class": "trace--lit is-fading" });
    pulse = el("g", { "class": "pulse" });
    el("circle", { r: 15, "class": "pulse__halo" }, pulse);
    el("circle", { r: 6, "class": "pulse__core" }, pulse);

    chips.forEach(function (chip) {
      var xy = layout.nodes[chip.getAttribute("data-stop")];
      chip.style.left = (xy[0] / layout.w * 100) + "%";
      chip.style.top = (xy[1] / layout.h * 100) + "%";
    });
  }

  /* The board is a tree, so the route between two chips is unique:
     walk each one up to the root (termA) and splice at the meeting point. */
  var PARENT = { core: "termA", termB: "core", intl: "termA", transit: "core", parking: "termB" };
  function routeBetween(from, to) {
    function chain(k) { var c = [k]; while (PARENT[k]) { k = PARENT[k]; c.push(k); } return c; }
    var a = chain(from), b = chain(to);
    var meet = a.filter(function (k) { return b.indexOf(k) !== -1; })[0];
    var up = a.slice(0, a.indexOf(meet) + 1);
    var down = b.slice(0, b.indexOf(meet)).reverse();
    return up.concat(down).map(function (k) { return layout.nodes[k]; });
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function sendSignal(from, to, onArrive) {
    if (animId) window.cancelAnimationFrame(animId);
    window.clearTimeout(fadeTimer);
    if (reduceMotion || from === to) { onArrive(); return; }

    var pts = routeBetween(from, to);
    var segs = [], total = 0;
    for (var i = 1; i < pts.length; i++) {
      var len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(len);
      total += len;
    }
    litPath.setAttribute("d", pointsToD(pts));
    litPath.style.strokeDasharray = total;
    litPath.style.strokeDashoffset = total;
    litPath.classList.remove("is-fading");
    pulse.classList.add("is-moving");

    var dur = Math.min(1100, Math.max(380, total * 1.4));
    var start = performance.now();
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var dist = total * easeInOut(t);
      var acc = 0, s = 0;
      while (s < segs.length - 1 && acc + segs[s] < dist) { acc += segs[s]; s++; }
      var f = segs[s] ? (dist - acc) / segs[s] : 0;
      var x = pts[s][0] + (pts[s + 1][0] - pts[s][0]) * f;
      var y = pts[s][1] + (pts[s + 1][1] - pts[s][1]) * f;
      pulse.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
      litPath.style.strokeDashoffset = total - dist;
      if (t < 1) { animId = window.requestAnimationFrame(step); return; }
      animId = null;
      pulse.classList.remove("is-moving");
      onArrive();
      fadeTimer = window.setTimeout(function () { litPath.classList.add("is-fading"); }, 500);
    }
    animId = window.requestAnimationFrame(step);
  }

  /* ---------------- Tips panel (ported from the SFO explorer) ---------------- */
  var panel = document.getElementById("sjc-panel");
  function field(name) { return panel.querySelector('[data-field="' + name + '"]'); }
  var F = {
    eyebrow: field("eyebrow"), title: field("title"), badge: field("badge"),
    col1: field("col1-label"), col2: field("col2-label"), chips: field("chips"), notes: field("notes"),
    warning: field("warning"), warningTitle: field("warning-title"), warningText: field("warning-text")
  };

  function renderStop(key) {
    var t = STOPS[key];
    var body = panel.querySelector(".explorer__body");
    var cc = field("concourse");
    if (t.terminal) {
      body.hidden = true;
      F.warning.hidden = true;
      F.eyebrow.innerHTML = t.eyebrow;
      F.title.textContent = t.title;
      F.badge.textContent = t.badge;
      cc.hidden = false;
      window.SJCTerminal.render(cc, t.terminal, { onAction: openStop });
      return;
    }
    cc.hidden = true;
    body.hidden = false;
    F.eyebrow.innerHTML = t.eyebrow;
    F.title.textContent = t.title;
    F.badge.textContent = t.badge;
    F.col1.textContent = t.col1Label;
    F.col2.textContent = t.col2Label;
    if (t.warning) {
      F.warningTitle.textContent = t.warning.title;
      F.warningText.textContent = t.warning.text;
      F.warning.hidden = false;
    } else {
      F.warning.hidden = true;
    }
    F.chips.innerHTML = "";
    t.chips.forEach(function (c) {
      var chip = document.createElement("span");
      chip.className = "chip" + (t.chipClass ? " " + t.chipClass : "");
      chip.textContent = c;
      F.chips.appendChild(chip);
    });
    F.notes.innerHTML = "";
    t.notes.forEach(function (n) {
      var li = document.createElement("li");
      li.className = "tip-row tip-row--emoji";
      li.innerHTML = n;
      F.notes.appendChild(li);
    });
  }


  /* a tip inside a terminal card can jump to another chip (e.g. the Calm Core) */
  function openStop(key) {
    var chip = board.querySelector('.sjc-chip[data-stop="' + key + '"]');
    if (!chip) return;
    chip.click();
    board.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  var ANIM = ["slide-out-w", "slide-out-e", "slide-in-w", "slide-in-e", "is-arriving"];
  var swapTimer = null, cleanTimer = null;
  var calmPanel = document.getElementById("calm-core");
  function panelFor(key) { return key === "core" ? calmPanel : panel; }
  function showStop(key) {
    if (key !== "core") renderStop(key);
    panel.hidden = key === "core";
    calmPanel.hidden = key !== "core";
  }

  function swapPanel(from, key, headingEast) {
    var outEl = panelFor(from), inEl = panelFor(key);
    if (reduceMotion) { showStop(key); return; }
    window.clearTimeout(swapTimer);
    window.clearTimeout(cleanTimer);
    [panel, calmPanel].forEach(function (el) { ANIM.forEach(function (c) { el.classList.remove(c); }); });
    void outEl.offsetWidth;
    outEl.classList.add(headingEast ? "slide-out-w" : "slide-out-e");
    swapTimer = window.setTimeout(function () {
      outEl.classList.remove("slide-out-w", "slide-out-e");
      showStop(key);
      inEl.classList.add(headingEast ? "slide-in-e" : "slide-in-w", "is-arriving");
      cleanTimer = window.setTimeout(function () {
        ANIM.forEach(function (c) { inEl.classList.remove(c); });
      }, 750);
    }, 190);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var key = chip.getAttribute("data-stop");
      if (key === currentKey) return;
      var from = currentKey;
      currentKey = key;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-selected", on ? "true" : "false");
        c.classList.remove("is-receiving");
      });
      var headingEast = layout.nodes[key][0] + layout.nodes[key][1] * 0.01 >= layout.nodes[from][0] + layout.nodes[from][1] * 0.01;
      swapPanel(from, key, headingEast);
      sendSignal(from, key, function () {
        void chip.offsetWidth;
        chip.classList.add("is-receiving");
      });
    });
  });

  /* If the viewport crosses the phone breakpoint, redraw the other
     board instead of leaving a pulse mid-flight on a hidden layout. */
  function onBreakpoint() {
    if (animId) { window.cancelAnimationFrame(animId); animId = null; }
    drawBoard();
  }
  if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onBreakpoint);
  else mobileQuery.addListener(onBreakpoint);

  drawBoard();
  showStop(currentKey);
})();

/* ---------------- Calm Core ----------------
   A scroll story inside the U3 panel: the window stays pinned while
   the three programs scroll past. Whichever one crosses the middle
   of the viewport dips the shade, cross-fades the view behind the
   glass and swaps the medallion art. */
(function () {
  var core = document.getElementById("calm-core");
  var win = document.getElementById("calm-window");
  if (!core || !win) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chapters = Array.prototype.slice.call(core.querySelectorAll(".calm-chapter"));
  var views = win.querySelectorAll(".calm-window__view");
  var arts = win.querySelectorAll(".calm-art");
  var dots = win.querySelectorAll(".calm-window__dots button");
  var active = null;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function setActive(key) {
    if (key === active) return;
    var first = active === null;
    active = key;
    core.setAttribute("data-active", key);
    chapters.forEach(function (c) { c.classList.toggle("is-active", c.getAttribute("data-chapter") === key); });
    each(views, function (v) { v.classList.toggle("is-active", v.getAttribute("data-view") === key); });
    each(arts, function (a) { a.classList.toggle("is-active", a.getAttribute("data-art") === key); });
    each(dots, function (d) {
      var on = d.getAttribute("data-go") === key;
      d.classList.toggle("is-active", on);
      d.setAttribute("aria-current", on ? "true" : "false");
    });
    if (!first && !reduceMotion) {
      win.classList.remove("is-dipping");
      void win.offsetWidth;
      win.classList.add("is-dipping");
    }
  }
  win.addEventListener("animationend", function (e) {
    if (e.target.classList.contains("calm-window__shade")) win.classList.remove("is-dipping");
  });

  // a hidden panel never intersects, so this only fires while Calm Core is open
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.getAttribute("data-chapter"));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach(function (c) { io.observe(c); });
  }

  each(dots, function (d) {
    d.addEventListener("click", function () {
      var target = document.getElementById("calm-" + d.getAttribute("data-go"));
      if (!target) return;
      var y = target.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.3;
      window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
      setActive(d.getAttribute("data-go"));
    });
  });

  setActive("tails");
})();
