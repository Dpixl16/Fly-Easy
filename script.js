(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = document.querySelectorAll(".tip-card");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    cards.forEach(function (card) { card.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
    );
    cards.forEach(function (card, i) {
      card.style.transitionDelay = (i % 6) * 50 + "ms";
      observer.observe(card);
    });
  }

  /* ---------------- Page transition (plane fly-out on internal nav) ---------------- */
  var pageTransition = document.getElementById("page-transition");
  if (pageTransition && !reduceMotion) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest("a[href]");
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

      var url;
      try { url = new URL(link.href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;

      e.preventDefault();
      pageTransition.classList.add("is-exiting");
      window.setTimeout(function () {
        window.location.href = link.href;
      }, 380);
    });
  }

  /* ---------------- SFO Terminal Explorer ---------------- */
  var tabs = document.querySelectorAll(".explorer__tab");
  if (tabs.length) runTerminalExplorer(tabs);

  /* ---------------- SFO Tips view toggle (Terminal Explorer / Airline Searcher) ---------------- */
  var viewToggleButtons = document.querySelectorAll(".page-toggle__btn");
  if (viewToggleButtons.length) runViewToggle(viewToggleButtons);

  /* ---------------- SFO Airline Searcher ---------------- */
  var airlineGrid = document.getElementById("airline-grid");
  if (airlineGrid) runAirlineSearcher();

  /* ---------------- Global Tips Flight-Path Tracker ---------------- */
  var trackerStops = document.querySelectorAll(".tracker__stop");
  if (trackerStops.length) runFlightTracker(trackerStops, reduceMotion);

  /* ---------------- Timeblocker ---------------- */
  var tbTimelineEl = document.getElementById("tb-timeline");
  if (tbTimelineEl) runTimeblocker();

  function runTerminalExplorer(tabs) {
  var TERMINALS = {
    t1: {
      eyebrow: "SFO · Boarding Areas B &amp; C",
      title: "Harvey Milk Terminal 1",
      badge: "Domestic",
      col1Label: "✈️ Main carriers",
      col2Label: "💆 Ease the stress here",
      airlines: ["Alaska Airlines", "American Airlines", "Delta Air Lines", "Southwest Airlines"],
      notes: [
        "🍜 <strong>Bun Mee, Terminal 1</strong> — a local favorite for Vietnamese bánh mì sandwiches, open early into the evening.",
        "🧸 <strong>\"Tree Town\" kids' spot, Gate B18 (post-security)</strong> — a climbable structure carved from a reclaimed oak tree.",
        "🖼️ <strong>SFO Museum galleries throughout T1</strong> — rotating art and photography pre-security, plus \"Women of Afrofuturism\" post-security (running through Oct. 2026)."
      ]
    },
    t2: {
      eyebrow: "SFO · Boarding Area D",
      title: "Terminal 2",
      badge: "Domestic",
      col1Label: "✈️ Main carriers",
      col2Label: "💆 Ease the stress here",
      airlines: ["Air Canada", "Breeze Airways", "WestJet"],
      notes: [
        "🛬 <strong>Free planespotting before security</strong> — the SkyTerrace deck is on the Terminal 2 roof, landside, open to the public.",
        "🧘 <strong>Yoga room, Boarding Area D (just past security)</strong> — free mats, no-shoes policy, in the corridor toward Terminal 1.",
        "🍽️ <strong>Lark Creek Grill, Boarding Area D</strong> — a Condé Nast Traveler pick for one of the world's best airport restaurants."
      ]
    },
    t3: {
      eyebrow: "SFO · Boarding Areas E &amp; F",
      title: "Terminal 3",
      badge: "Domestic",
      col1Label: "✈️ Main carriers",
      col2Label: "💆 Ease the stress here",
      airlines: ["United Airlines"],
      notes: [
        "🚧 <strong>Under construction through 2027</strong> — part of the terminal is closed for the Terminal 3 West project; some United check-in has shifted to Terminal 2, and interim walkways route around the work zone.",
        "🧘 <strong>Yoga room near Gate E6</strong> — a free, self-guided space with mats provided; phones stay outside.",
        "🌈 <strong>\"Spirogyrate\" kids' spot, Gate E7</strong> — motion-activated, color-changing floor discs, a playful sensory stop.",
        "⚾ <strong>SF Giants Clubhouse, Gate F13</strong> — ballpark-style food (garlic fries, ballpark dogs) and one of the livelier spots to eat."
      ]
    },
    intlA: {
      eyebrow: "SFO · Boarding Area A",
      title: "International Terminal A",
      badge: "International",
      col1Label: "✈️ Main carriers",
      col2Label: "💆 Ease the stress here",
      airlines: ["British Airways", "Cathay Pacific", "Emirates"],
      notes: [
        "🧘 <strong>Berman Reflection Room</strong> — free meditation space before security, in the Main Hall, distraction-free (no phones, no talking).",
        "🥖 <strong>Boudin, Gate A2 (post-security)</strong> — SF's famous sourdough, serving clam chowder in a bread bowl until 11:30pm.",
        "🛋️ <strong>Most airline lounges cluster here</strong> — Air France/KLM, British Airways, Cathay Pacific, and more."
      ]
    },
    intlG: {
      eyebrow: "SFO · Boarding Area G",
      title: "International Terminal G",
      badge: "International",
      col1Label: "✈️ Main carriers",
      col2Label: "💆 Ease the stress here",
      airlines: ["United Airlines", "Lufthansa", "ANA"],
      notes: [
        "🛬 <strong>Planespot at the end of G</strong> — an open-air terrace near Gate G14.",
        "🚶 <strong>Budget extra walking time</strong> — Boarding Area G runs nearly 1,000 feet end to end, and connecting over from Terminal 3 alone is about a 6-minute walk.",
        "🍷 <strong>Mustards Bar &amp; Grill, Boarding Area G</strong> — sit-down Wine Country fare, open 7am–8pm, if you'd rather not eat at the gate."
      ]
    },
    transport: {
      eyebrow: "SFO · Getting Around",
      title: "Transportation",
      badge: "All terminals",
      col1Label: "🚦 Ways to go",
      col2Label: "🧭 Good to know",
      airlines: ["AirTrain", "BART", "Uber / Lyft", "Waymo"],
      notes: [
        "🚊 <strong>AirTrain is free</strong>, running 24/7 to every terminal, garage, and BART — but the Terminal 3 station is closed for construction through 2027; use the \"Terminals 2 &amp; 3\" stop instead.",
        "🚆 <strong>BART takes tap-to-pay</strong> — tap a contactless card or phone at the gate, no Clipper card needed (though a Clipper card still gets you any discount fare you're eligible for).",
        "🚗 <strong>Picking up an Uber/Lyft?</strong> For Terminals 1–3, that's Level 5 of the domestic garage, not the curb — a short walk or elevator ride from your terminal. The International Terminal is the exception: pickup stays on the Departures Level, 2nd curb.",
        "🚗 <strong>Dropping someone off?</strong> That's the normal Departures Level curb for every terminal.",
        "🤖 <strong>Waymo pickup/drop-off is at the Rental Car Center, Level 1 curbside</strong> — a short, free AirTrain ride away. It's a newer service at SFO, so availability may still be expanding."
      ]
    }
  };

  var panel = document.getElementById("explorer-panel");
  var eyebrowEl = panel.querySelector('[data-field="eyebrow"]');
  var titleEl = panel.querySelector('[data-field="title"]');
  var badgeEl = panel.querySelector('[data-field="badge"]');
  var col1LabelEl = panel.querySelector('[data-field="col1-label"]');
  var col2LabelEl = panel.querySelector('[data-field="col2-label"]');
  var airlinesEl = panel.querySelector('[data-field="airlines"]');
  var notesEl = panel.querySelector('[data-field="notes"]');

  function renderTerminal(key) {
    var t = TERMINALS[key];
    if (!t) return;
    eyebrowEl.innerHTML = t.eyebrow;
    titleEl.textContent = t.title;
    badgeEl.textContent = t.badge;
    col1LabelEl.textContent = t.col1Label;
    col2LabelEl.textContent = t.col2Label;

    airlinesEl.innerHTML = "";
    t.airlines.forEach(function (a) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = a;
      airlinesEl.appendChild(chip);
    });

    notesEl.innerHTML = "";
    t.notes.forEach(function (n) {
      var li = document.createElement("li");
      li.className = "tip-row tip-row--emoji";
      li.innerHTML = n;
      notesEl.appendChild(li);
    });
  }

  /* Directional card transition: the tips card travels WITH the
     AirTrain. Heading east (rightward on the map) the old content
     slides out to the west and the new stop's content pulls in
     from the east — and vice versa. Inner chips/tips stagger in. */
  var STOP_X = { intlA: 10, t1: 22, t2: 50, t3: 78, intlG: 90, transport: 50 };
  var currentTerminalKey = "t1";
  var panelSwapTimer = null;
  var panelCleanTimer = null;
  var PANEL_ANIM_CLASSES = ["slide-out-w", "slide-out-e", "slide-in-w", "slide-in-e", "is-arriving"];

  function selectTerminal(key) {
    if (reduceMotion) {
      renderTerminal(key);
      currentTerminalKey = key;
      return;
    }
    var headingEast = (STOP_X[key] || 50) >= (STOP_X[currentTerminalKey] || 50);
    currentTerminalKey = key;

    window.clearTimeout(panelSwapTimer);
    window.clearTimeout(panelCleanTimer);
    PANEL_ANIM_CLASSES.forEach(function (c) { panel.classList.remove(c); });
    void panel.offsetWidth;
    panel.classList.add(headingEast ? "slide-out-w" : "slide-out-e");

    panelSwapTimer = window.setTimeout(function () {
      renderTerminal(key);
      panel.classList.remove("slide-out-w", "slide-out-e");
      panel.classList.add(headingEast ? "slide-in-e" : "slide-in-w", "is-arriving");
      panelCleanTimer = window.setTimeout(function () {
        PANEL_ANIM_CLASSES.forEach(function (c) { panel.classList.remove(c); });
      }, 750);
    }, 190);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      if (tab.classList.contains("is-active")) return;
      tabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      selectTerminal(tab.getAttribute("data-terminal"));
    });
  });

  renderTerminal("t1");
  }

  function runViewToggle(buttons) {
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.classList.contains("is-active")) return;
      var activeBtn = null;
      buttons.forEach(function (b) { if (b.classList.contains("is-active")) activeBtn = b; });
      var oldPanel = activeBtn ? document.getElementById(activeBtn.getAttribute("aria-controls")) : null;
      var newPanel = document.getElementById(btn.getAttribute("aria-controls"));

      buttons.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (reduceMotion || !oldPanel || !newPanel) {
        if (oldPanel) oldPanel.hidden = true;
        if (newPanel) newPanel.hidden = false;
        return;
      }

      oldPanel.classList.add("view-panel--fading");
      window.setTimeout(function () {
        oldPanel.hidden = true;
        oldPanel.classList.remove("view-panel--fading");
        newPanel.hidden = false;
        newPanel.classList.add("view-panel--entering");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            newPanel.classList.remove("view-panel--entering");
          });
        });
      }, 180);
    });
  });
  }

  function runAirlineSearcher() {
  var AIRLINES = [
    { code: "AS", name: "Alaska Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "📲 The Alaska app sends gate-change alerts faster than the airport boards do." },
    { code: "WN", name: "Southwest Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "🎟️ Southwest ended open seating in January 2026 — you'll get an assigned seat and boarding group at booking, just like other airlines. Checked bags are still free." },
    { code: "SY", name: "Sun Country Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "🗓️ A seasonal leisure carrier — double-check your flight is still scheduled as booked." },
    { code: "B6", name: "JetBlue Airways", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "📶 Free high-speed Wi-Fi and live TV at every seat, no membership needed." },
    { code: "F9", name: "Frontier Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "🎒 Add bags and seats online in advance — it's much cheaper than at the gate." },
    { code: "NK", name: "Spirit Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "🎒 Weigh and measure bags at home — oversize fees at the gate are steep." },
    { code: "MX", name: "Breeze Airways", terminal: "Terminal 2", gates: "Gates D1–D18", domestic: true,
      tip: "📲 A newer low-cost carrier based in Terminal 2 — the app is the fastest way to track your gate and boarding time." },
    { code: "AA", name: "American Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "📲 Based in the renovated Terminal 1 (moved from Terminal 2 in 2020) — the app shows real-time gate and baggage info the moment you land." },
    { code: "DL", name: "Delta Air Lines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "🧳 Now based in Terminal 1, not Terminal 2 — the Fly Delta app tracks your bag live from drop-off to the carousel." },
    { code: "UA", name: "United Airlines", terminal: "Terminal 3 (domestic) & International Terminal (intl.)", gates: "Gates E1–E13/F1–F22 · G1–G14", domestic: true,
      tip: "🛫 SFO's United hub splits by flight type — mostly Terminal 3 for domestic (a few flights use Terminal 2), the International Terminal for overseas." },
    { code: "HA", name: "Hawaiian Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: true,
      tip: "🌺 Now boards from Terminal 1 alongside its parent Alaska Airlines, following the 2024 merger — no more trek to the International Terminal." },
    { code: "AC", name: "Air Canada", terminal: "Terminal 2", gates: "Gates D1–D18", domestic: false,
      tip: "🛂 Now based in Terminal 2, not the International Terminal — but a Canada trip is still an international departure, so bring your passport." },
    { code: "WS", name: "WestJet", terminal: "Terminal 2", gates: "Gates D1–D18", domestic: false,
      tip: "🛂 Now based in Terminal 2, not the International Terminal — a Canada hop is still an international departure, passport required." },
    { code: "PD", name: "Porter Airlines", terminal: "Terminal 1 · Boarding Areas B & C", gates: "Gates B1–B27", domestic: false,
      tip: "🇨🇦 A newer, fast-growing entrant to SFO — its terminal has shifted before as routes expand, so double-check the day of travel." },
    { code: "BA", name: "British Airways", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 Oneworld flyers can usually access a shared lounge in the International Terminal." },
    { code: "AF", name: "Air France", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A SkyTeam carrier — Delta status may unlock lounge access here too." },
    { code: "KL", name: "KLM Royal Dutch Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🌷 Air France's SkyTeam sister — the same lounge and check-in perks apply." },
    { code: "JL", name: "Japan Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A Oneworld carrier — check reciprocal lounge access before you connect." },
    { code: "KE", name: "Korean Air", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 One of the few nonstops to Seoul — a solid backup if a partner flight sells out." },
    { code: "CX", name: "Cathay Pacific", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A Oneworld carrier with strong reciprocal lounge access for elite members." },
    { code: "CI", name: "China Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 Taiwan's flag carrier — a handy connection point for onward Southeast Asia routes." },
    { code: "MU", name: "China Eastern Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A SkyTeam carrier — check partner lounge access before you connect." },
    { code: "CZ", name: "China Southern Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "💧 Runs some of the longer hauls out of SFO — build in extra time before boarding." },
    { code: "PR", name: "Philippine Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 One of the only nonstops between SFO and Manila — skips the layover." },
    { code: "QF", name: "Qantas", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🕐 Runs one of the longest hauls out of SFO, to Sydney — plan a very early check-in." },
    { code: "VS", name: "Virgin Atlantic", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔀 Codeshares closely with partners — double-check who actually operates your flight." },
    { code: "AM", name: "Aeroméxico", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A SkyTeam carrier connecting SFO with Mexico City and beyond." },
    { code: "Y4", name: "Volaris", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🎒 An ultra-low-cost carrier — add bags and seats online, they're pricier at the gate." },
    { code: "BR", name: "EVA Air", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🎀 Some Taipei flights are Hello Kitty-themed — check your aircraft before boarding." },
    { code: "LX", name: "Swiss International Air Lines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A Star Alliance carrier — reciprocal lounge access often applies nearby." },
    { code: "TK", name: "Turkish Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "💧 One of the longest hauls out of SFO — hydrate and stretch before boarding." },
    { code: "EI", name: "Aer Lingus", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🍀 Ireland's flag carrier — a handy nonstop to Dublin for onward Europe connections." },
    { code: "AI", name: "Air India", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 One of the only nonstops linking SFO directly with India — book early, seats sell out." },
    { code: "YP", name: "Air Premia", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🆕 A newer Korean carrier with budget-friendly fares to Seoul — still expanding its service." },
    { code: "AV", name: "Avianca", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🌎 Colombia's flag carrier — a useful connection point for onward South America routes." },
    { code: "DE", name: "Condor", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🇩🇪 A German leisure carrier — mostly seasonal, so double-check your route still operates." },
    { code: "CM", name: "Copa Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 Routes through Panama City's hub — often a cheaper way to reach South America." },
    { code: "EK", name: "Emirates", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🌟 A true flagship long-haul flight — arrive early to make the most of it." },
    { code: "F8", name: "Flair Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🎒 A Canadian ultra-low-cost carrier — add bags and seats online, they're pricier at the gate." },
    { code: "BF", name: "French bee", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "💶 A budget long-haul carrier to Paris — book add-ons online since fares are unbundled." },
    { code: "IB", name: "Iberia", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🤝 A Oneworld carrier — check reciprocal lounge access before connecting through Madrid." },
    { code: "AZ", name: "ITA Airways", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🇮🇹 Italy's flag carrier — a direct link to Rome for onward Mediterranean connections." },
    { code: "LO", name: "LOT Polish Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 One of the few nonstops connecting SFO with Central/Eastern Europe via Warsaw." },
    { code: "QR", name: "Qatar Airways", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🌟 Consistently rated among the world's top airlines — worth the early arrival." },
    { code: "SK", name: "SAS Scandinavian Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 A useful nonstop link to Scandinavia via Copenhagen." },
    { code: "JX", name: "STARLUX Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "✨ A newer Taiwanese carrier with a stylish cabin — a fresh alternative to the older Taipei nonstops." },
    { code: "TP", name: "TAP Air Portugal", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🇵🇹 A handy nonstop to Lisbon for onward connections across Europe." },
    { code: "VN", name: "Vietnam Airlines", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🔁 One of the few nonstop options between SFO and Vietnam." },
    { code: "ZG", name: "ZIPAIR Tokyo", terminal: "International Terminal · Boarding Area A", gates: "Gates A1–A15", domestic: false,
      tip: "🎒 A no-frills long-haul carrier — nearly everything beyond your seat costs extra, so pack light." },
    { code: "LH", name: "Lufthansa", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "🤝 Star Alliance flyers can usually use the United Club or Polaris Lounge nearby." },
    { code: "CA", name: "Air China", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "✈️ One of the few nonstops to mainland China — check current frequency before a tight connection." },
    { code: "NH", name: "ANA — All Nippon Airways", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "⭐ Consistently rated among the world's best cabins — worth arriving early to enjoy it." },
    { code: "NZ", name: "Air New Zealand", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "🥝 The Auckland flight crosses the international date line — you'll land two calendar days later." },
    { code: "OZ", name: "Asiana Airlines", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "🔁 A solid backup option to Seoul alongside Korean Air on this route." },
    { code: "SQ", name: "Singapore Airlines", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "⭐ Regularly ranked the world's best airline — arrive early just to enjoy it." },
    { code: "FJ", name: "Fiji Airways", terminal: "International Terminal · Boarding Area G", gates: "Gates G1–G14", domestic: false,
      tip: "🗓️ One of the only nonstops from the mainland US to Fiji — limited weekly flights." }
  ];

  var ACCENTS = ["predeparture", "departure", "inflight", "arrival"];

  var grid = document.getElementById("airline-grid");
  var searchInput = document.getElementById("airline-search-input");
  var filterButtons = document.querySelectorAll(".airline-filter");
  var emptyEl = document.getElementById("airline-empty");
  var countEl = document.getElementById("airline-count");
  var activeFilter = "all";

  function cardHTML(airline, accent) {
    return (
      '<article class="airline-card" data-phase="' + accent + '">' +
        '<div class="airline-card__head">' +
          '<span class="airline-badge">' + airline.code + "</span>" +
          "<div>" +
            '<h3 class="airline-card__name">' + airline.name + "</h3>" +
            '<p class="airline-card__terminal">' + airline.terminal + "</p>" +
          "</div>" +
        "</div>" +
        '<span class="airline-card__gates">' + airline.gates + "</span>" +
        '<p class="airline-card__tip">' + airline.tip + "</p>" +
      "</article>"
    );
  }

  function render() {
    var query = (searchInput.value || "").trim().toLowerCase();
    var results = AIRLINES.filter(function (a) {
      var matchesFilter = activeFilter === "all" || (activeFilter === "domestic") === a.domestic;
      var matchesQuery = !query || a.name.toLowerCase().indexOf(query) !== -1 || a.code.toLowerCase().indexOf(query) !== -1;
      return matchesFilter && matchesQuery;
    });

    grid.innerHTML = results.map(function (a) {
      var accent = ACCENTS[AIRLINES.indexOf(a) % ACCENTS.length];
      return cardHTML(a, accent);
    }).join("");

    emptyEl.hidden = results.length !== 0;
    if (!results.length) {
      emptyEl.textContent = 'No airlines match "' + searchInput.value + '." Try a different name or code.';
    }
    countEl.textContent = results.length + (results.length === 1 ? " airline" : " airlines") + " shown";
  }

  searchInput.addEventListener("input", render);
  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterButtons.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      activeFilter = btn.getAttribute("data-filter");
      render();
    });
  });

  render();
  }

  function runFlightTracker(stops, reduceMotion) {
  var planeWrap = document.getElementById("tracker-plane");
  var planeBank = document.getElementById("tracker-plane-bank");
  var card = document.getElementById("phase-card");
  var panels = card.querySelectorAll(".phase-panel");

  function revealPanel(panel) {
    var items = panel.querySelectorAll(".reveal");
    items.forEach(function (el, i) {
      el.classList.remove("is-visible");
      if (reduceMotion) {
        el.classList.add("is-visible");
        return;
      }
      el.style.transitionDelay = (i * 45) + "ms";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add("is-visible"); });
      });
    });
  }

  function showPanel(key) {
    panels.forEach(function (p) {
      p.hidden = p.getAttribute("data-phase") !== key;
    });
    card.setAttribute("data-phase", key);
    planeWrap.setAttribute("data-phase", key);
    var active = card.querySelector('.phase-panel[data-phase="' + key + '"]');
    if (active) revealPanel(active);
  }

  function setPhase(key) {
    stops.forEach(function (s) {
      var active = s.getAttribute("data-phase") === key;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (planeBank) {
      planeBank.classList.add("is-banking");
      window.setTimeout(function () { planeBank.classList.remove("is-banking"); }, 550);
    }

    if (reduceMotion) {
      showPanel(key);
      return;
    }

    card.classList.add("is-transitioning");
    window.setTimeout(function () {
      showPanel(key);
      card.classList.remove("is-transitioning");
    }, 220);
  }

  stops.forEach(function (stop) {
    stop.addEventListener("click", function () {
      if (stop.classList.contains("is-active")) return;
      setPhase(stop.getAttribute("data-phase"));
    });
  });

  revealPanel(card.querySelector('.phase-panel[data-phase="predeparture"]'));
  }

  function runTimeblocker() {
    var ICONS = {
      car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 16l1.5-5.5A2 2 0 017.4 9h9.2a2 2 0 011.9 1.5L20 16"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="20" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="20" r="1.3" fill="currentColor" stroke="none"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0112 3.5 6.5 6.5 0 0118.5 10c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
      bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
      walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="13" cy="4.5" r="1.6" fill="currentColor" stroke="none"/><path d="M10 22l1.5-6-2-2 .5-4.5L13 8l2 2.5 3 1M9.5 16l-3 2M13 12l3 6"/></svg>',
      cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h11v6a5 5 0 01-5 5H10a5 5 0 01-5-5V8z"/><path d="M16 10h1.5a2.5 2.5 0 010 5H16"/></svg>',
      cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h2l2.4 12.2a1.5 1.5 0 001.5 1.3h7.4a1.5 1.5 0 001.5-1.2L20 8H7"/><circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none"/></svg>',
      restroom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="6" r="2.2"/><path d="M8 21v-6.5a4 4 0 018 0V21"/></svg>',
      couch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12V9a2 2 0 012-2h10a2 2 0 012 2v3"/><rect x="3" y="12" width="18" height="6" rx="2"/><path d="M5 18v2M19 18v2"/></svg>',
      eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/></svg>',
      fork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2v6M8.5 2v6M11 2v6M6 8a2.5 2.5 0 005 0M8.5 8v14"/></svg>',
      battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="16" height="8" rx="2"/><rect x="19" y="10.5" width="2" height="3" rx="1" fill="currentColor" stroke="none"/><path d="M10.5 8l-2 4h3l-2 4"/></svg>',
      flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3v18"/><path d="M6 4h11l-2 4 2 4H6"/></svg>',
      droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c-1 3-6 8.2-6 12a6 6 0 0012 0c0-3.8-5-9-6-12z"/></svg>',
      camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.3-2.4a1 1 0 01.9-.6h3.6a1 1 0 01.9.6L16 7"/><circle cx="12" cy="13.5" r="3.3"/></svg>',
      compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/></svg>',
      laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 19h20l-1.5-3h-17L2 19z"/></svg>',
      star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20l1.4-6.3L3 9.4l6.4-.6L12 3z"/></svg>',
      train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="4" width="14" height="13" rx="3"/><path d="M5 12h14M9 17l-2 3M15 17l2 3"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/></svg>',
      bus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="10" rx="2"/><path d="M3 11h18M6 6V4h12v2"/><circle cx="7" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="17" cy="18" r="1.4" fill="currentColor" stroke="none"/></svg>',
      taxi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="10" y="6" width="4" height="2.4" rx="0.5"/><path d="M4 16l1.5-5.5A2 2 0 017.4 9h9.2a2 2 0 011.9 1.5L20 16"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="20" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="20" r="1.3" fill="currentColor" stroke="none"/></svg>',
      warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>',
      parking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9.2 16V8h3a2.4 2.4 0 010 4.8H9.2"/></svg>',
      passport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="2.3"/><path d="M9 16h6M8 19h8"/></svg>',
      printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/></svg>',
      coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.3 15.2c0 1 1.1 1.8 2.7 1.8 1.9 0 3-1 3-2.3 0-3-5.7-1.5-5.7-4.4 0-1.3 1.2-2.3 3-2.3 1.6 0 2.6.7 2.7 1.7"/></svg>',
      meal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.1"/></svg>',
      stretch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="4.2" r="1.6" fill="currentColor" stroke="none"/><path d="M12 8v5M8 6.5l4 2 4-2M8 20l4-7 4 7"/></svg>',
      headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14.5v-2a8 8 0 0116 0v2"/><rect x="3" y="13.2" width="4.2" height="6.2" rx="1.5"/><rect x="16.8" y="13.2" width="4.2" height="6.2" rx="1.5"/></svg>'
    };

    var SECURITY_NOTE = "Beware of unpredictable security times — double-check current wait times before you go.";

    var DEFAULTS = [
      { title: "Check in / Baggage Drop off", cat: "airport", icon: "bag", minutes: 15 },
      { title: "Security", cat: "airport", icon: "shield", minutes: 20, note: SECURITY_NOTE },
      { title: "Walk to your gate", cat: "airport", icon: "walk", minutes: 8 }
    ];

    var MAPS_NOTE = "Double-check Google Maps for traffic and current travel time.";

    /* Notes aren't part of the saved/shared plan format (see
       packActivity), so they're re-attached by title on restore —
       otherwise a step's warning would vanish the moment the plan
       round-trips through localStorage or a share link. */
    var NOTE_BY_TITLE = {
      "Security": SECURITY_NOTE,
      "Subway / transit": MAPS_NOTE,
      "Bus": MAPS_NOTE,
      "Driving": MAPS_NOTE,
      "Taxi / rideshare": MAPS_NOTE,
      "Curbside drop-off": MAPS_NOTE
    };

    /* Ordered to follow the actual shape of a travel day: get
       there, clear the required steps, handle logistics, then
       eat and unwind. */
    var SECTIONS = [
      { title: "Getting to the airport", cat: "going", items: [
          { key: "subway", title: "Subway / transit", icon: "train", minutes: 25, note: MAPS_NOTE },
          { key: "bus", title: "Bus", icon: "bus", minutes: 30, note: MAPS_NOTE },
          { key: "driving", title: "Driving", icon: "car", minutes: 30, note: MAPS_NOTE },
          { key: "taxi", title: "Taxi / rideshare", icon: "taxi", minutes: 25, note: MAPS_NOTE },
          { key: "parking", title: "Parking", icon: "parking", minutes: 10 },
          { key: "dropoff", title: "Curbside drop-off", icon: "pin", minutes: 5, note: MAPS_NOTE }
        ]
      },
      { title: "The essentials", cat: "airport", items: [
          { key: "bagdrop", title: "Check in / Baggage Drop off", icon: "bag", minutes: 15 },
          { key: "passport", title: "Passport control", icon: "passport", minutes: 15 },
          { key: "security2", title: "Security", icon: "shield", minutes: 20, note: SECURITY_NOTE },
          { key: "walk2", title: "Walk to your gate", icon: "walk", minutes: 8 }
        ]
      },
      { title: "Errands", cat: "gate", items: [
          { key: "restroom", title: "Restroom", icon: "restroom", minutes: 5 },
          { key: "charging", title: "Charge devices", icon: "battery", minutes: 10 },
          { key: "printing", title: "Print documents", icon: "printer", minutes: 5 },
          { key: "currency", title: "Currency exchange", icon: "coin", minutes: 10 },
          { key: "shopping", title: "Shopping", icon: "cart", minutes: 15 },
          { key: "work", title: "Work", icon: "laptop", minutes: 20 }
        ]
      },
      { title: "Food & drink", cat: "food", items: [
          { key: "coffee", title: "Coffee", icon: "cup", minutes: 10 },
          { key: "food", title: "Grab food", icon: "fork", minutes: 20 },
          { key: "meal", title: "Sit-down meal", icon: "meal", minutes: 30 },
          { key: "water", title: "Water refill", icon: "droplet", minutes: 5 }
        ]
      },
      { title: "Relax & explore", cat: "explore", items: [
          { key: "relax", title: "Time to relax", icon: "couch", minutes: 15 },
          { key: "stretch", title: "Stretch / walk", icon: "stretch", minutes: 10 },
          { key: "music", title: "Listen to music / podcast", icon: "headphones", minutes: 15 },
          { key: "lounge", title: "Airport lounge", icon: "star", minutes: 30 },
          { key: "planespotting", title: "Planespotting", icon: "eye", minutes: 10 },
          { key: "pictures", title: "Taking pictures", icon: "camera", minutes: 10 },
          { key: "explore", title: "Explore", icon: "compass", minutes: 15 }
        ]
      }
    ];

    var blocks = [];
    var nextId = 0;
    var dragIndex = null;

    var timelineEl = document.getElementById("tb-timeline");
    var leaveTimeEl = document.getElementById("tb-leaveTime");
    var boardTimeEl = document.getElementById("tb-boardTime");
    var warningEl = document.getElementById("tb-warning");
    var boardingInput = document.getElementById("tb-boardingTime");
    var activitySectionsEl = document.getElementById("tb-activitySections");

    function freshDefaults() {
      return DEFAULTS.map(function (b) { return Object.assign({ id: "b" + (nextId++) }, b); });
    }

    function parseTime(str) {
      var parts = str.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    function wrap(min) { return ((min % 1440) + 1440) % 1440; }
    function formatDisplay(totalMin) {
      var m = wrap(totalMin);
      var h = Math.floor(m / 60);
      var mins = m % 60;
      var period = h >= 12 ? "PM" : "AM";
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ":" + (mins < 10 ? "0" : "") + mins + " " + period;
    }
    function format24(totalMin) {
      var m = wrap(totalMin);
      var h = Math.floor(m / 60);
      var mins = m % 60;
      return (h < 10 ? "0" : "") + h + ":" + (mins < 10 ? "0" : "") + mins;
    }
    function boardingMin() {
      return parseTime(boardingInput.value || "17:30");
    }

    /* A block can carry up to 2 .partners (3 activities running
       at once, total) — the schedule reserves the LONGEST of the
       durations happening in that slot. */
    var MAX_SIMULTANEOUS = 3;
    function effMinutes(b) {
      var m = b.minutes;
      if (b.partners) {
        for (var i = 0; i < b.partners.length; i++) {
          if (b.partners[i].minutes > m) m = b.partners[i].minutes;
        }
      }
      return m;
    }

    function cascadeBackwardFrom(index) {
      for (var i = index - 1; i >= 0; i--) {
        blocks[i].start = blocks[i + 1].start - effMinutes(blocks[i]);
      }
    }
    function resequenceFromBoarding() {
      if (!blocks.length) return;
      var n = blocks.length;
      blocks[n - 1].start = boardingMin() - effMinutes(blocks[n - 1]);
      cascadeBackwardFrom(n - 1);
    }
    function recalcFromIndex(index) {
      if (index === blocks.length - 1) {
        blocks[index].start = boardingMin() - effMinutes(blocks[index]);
      } else {
        blocks[index].start = blocks[index + 1].start - effMinutes(blocks[index]);
      }
      cascadeBackwardFrom(index);
    }

    function updateDisplay() {
      if (!blocks.length) { leaveTimeEl.textContent = "—"; return; }
      leaveTimeEl.textContent = formatDisplay(blocks[0].start);

      boardTimeEl.textContent = "At the gate by " + formatDisplay(boardingMin());

      var total = blocks.reduce(function (s, b) { return s + effMinutes(b); }, 0);
      if (total < 40) {
        warningEl.textContent = "This is a tight timeline — consider adding a buffer step.";
        warningEl.classList.add("is-visible");
      } else {
        warningEl.classList.remove("is-visible");
      }

      blocks.forEach(function (b) {
        var row = timelineEl.querySelector('[data-id="' + b.id + '"]');
        if (!row) return;
        var timeInput = row.querySelector(".tb-block__time-input");
        if (document.activeElement !== timeInput) timeInput.value = format24(b.start);
        row.querySelector(".tb-block__mins").textContent = b.minutes + "m";
        if (b.partners) {
          row.querySelectorAll(".tb-pair__item").forEach(function (itemEl) {
            var pi = parseInt(itemEl.dataset.pIndex, 10);
            var mins = itemEl.querySelector(".tb-pair__mins");
            if (mins && b.partners[pi]) mins.textContent = b.partners[pi].minutes + "m";
          });
        }
      });
    }

    function insertAtEnd(newBlock) {
      blocks.push(newBlock);
      resequenceFromBoarding();
      render();
    }

    function escapeAttr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

    function formatDateLong(dateStr) {
      if (!dateStr) return "";
      var d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }

    /* Builds a plain, print-friendly itinerary from the current
       blocks — kept separate from the interactive DOM so printing
       doesn't fight the site's fixed sky/parallax layers. */
    function buildPrintSheet() {
      var sheet = document.getElementById("tb-printSheet");
      if (!sheet) return;
      var dateStr = (dateInput && dateInput.value) || todayStr();
      var leaveText = blocks.length ? formatDisplay(blocks[0].start) : "—";

      var rowsHTML = blocks.map(function (b) {
        var body = '<span class="tb-print-title">' + escapeAttr(b.title) + '</span> <span class="tb-print-dur">(' + b.minutes + ' min)</span>';
        if (b.partners) {
          b.partners.forEach(function (p) {
            body += '<span class="tb-print-partner">+ ' + escapeAttr(p.title) + " (" + p.minutes + " min, at the same time)</span>";
          });
        }
        if (b.note) body += '<span class="tb-print-note">' + escapeAttr(b.note) + "</span>";
        if (b.partners) {
          b.partners.forEach(function (p) {
            if (p.note) body += '<span class="tb-print-note">' + escapeAttr(p.note) + "</span>";
          });
        }
        return '<li class="tb-print-row"><span class="tb-print-time">' + formatDisplay(b.start) + '</span><span class="tb-print-body">' + body + "</span></li>";
      }).join("");

      rowsHTML += '<li class="tb-print-row tb-print-row--board"><span class="tb-print-time">' + formatDisplay(boardingMin()) + '</span><span class="tb-print-body"><span class="tb-print-title">Boarding</span></span></li>';

      sheet.innerHTML =
        '<p class="tb-print-brand">Fly Easy — Flight Day Plan</p>' +
        '<p class="tb-print-meta">' + formatDateLong(dateStr) + "</p>" +
        '<p class="tb-print-leave">Leave home by ' + leaveText + "</p>" +
        '<ol class="tb-print-list">' + rowsHTML + "</ol>" +
        '<p class="tb-print-footer">Estimates only — times can shift with traffic and lines. Confirm your gate on the airport monitors before you go.</p>';
    }

    function render() {
      timelineEl.innerHTML = '<div class="tb-timeline__rail" aria-hidden="true"></div>';
      blocks.forEach(function (b) {
        var row = document.createElement("div");
        row.className = "tb-block";
        var hasPartners = b.partners && b.partners.length;
        if (hasPartners) row.classList.add("tb-block--duo");
        row.dataset.id = b.id;
        row.classList.add("tb-cat-" + b.cat);
        row.style.borderLeftColor = getComputedStyle(row).color;
        var pairHTML = "";
        if (hasPartners) {
          var itemsHTML = b.partners.map(function (p, pi) {
            return (
              '<span class="tb-pair__item" data-p-index="' + pi + '">' +
                '<span class="tb-block__icon tb-pair__icon tb-cat-' + p.cat + '">' + ICONS[p.icon] + '</span>' +
                '<input class="tb-pair__title" value="' + escapeAttr(p.title) + '" aria-label="Simultaneous activity name">' +
                '<input type="range" class="tb-pair__range" min="0" max="120" step="5" value="' + p.minutes + '" aria-label="Simultaneous activity duration">' +
                '<span class="tb-pair__mins">' + p.minutes + 'm</span>' +
                '<button class="tb-pair__split" type="button" title="Split into its own step">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5"/></svg>' +
                  'Split' +
                '</button>' +
              '</span>'
            );
          }).join("");
          pairHTML =
            '<span class="tb-pair">' +
              '<span class="tb-pair__tie">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 12h8M12 8v8"/><circle cx="12" cy="12" r="9"/></svg>' +
                'At the same time' +
              '</span>' +
              itemsHTML +
            '</span>';
        }
        row.innerHTML =
          '<span class="tb-block__handle" draggable="true" aria-hidden="true">&#8942;&#8942;</span>' +
          '<span class="tb-block__icon tb-block__icon--grab tb-cat-' + b.cat + '" draggable="true">' + ICONS[b.icon] + '</span>' +
          '<span class="tb-block__main">' +
            '<span class="tb-block__top">' +
              '<input class="tb-block__title" value="' + escapeAttr(b.title) + '">' +
              '<input type="time" class="tb-block__time-input">' +
              '<button class="tb-block__remove" type="button" aria-label="Remove step">&times;</button>' +
            '</span>' +
            '<span class="tb-block__duration">' +
              '<input type="range" min="0" max="120" step="5" value="' + b.minutes + '">' +
              '<span class="tb-block__mins"></span>' +
            '</span>' +
            (b.note ? '<span class="tb-block__note">' + ICONS.warn + '<span>' + b.note + '</span></span>' : '') +
            pairHTML +
          '</span>';

        row.querySelector(".tb-block__title").addEventListener("input", function (e) { b.title = e.target.value; });
        row.querySelector(".tb-block__remove").addEventListener("click", function () {
          blocks = blocks.filter(function (x) { return x.id !== b.id; });
          resequenceFromBoarding();
          render();
        });
        row.querySelector('.tb-block__duration input[type="range"]').addEventListener("input", function (e) {
          b.minutes = parseInt(e.target.value, 10);
          var idx = blocks.findIndex(function (x) { return x.id === b.id; });
          recalcFromIndex(idx);
          updateDisplay();
        });
        row.querySelector(".tb-block__time-input").addEventListener("change", function (e) {
          var idx = blocks.findIndex(function (x) { return x.id === b.id; });
          blocks[idx].start = parseTime(e.target.value);
          cascadeBackwardFrom(idx);
          updateDisplay();
        });

        if (hasPartners) {
          row.querySelectorAll(".tb-pair__item").forEach(function (itemEl) {
            var pi = parseInt(itemEl.dataset.pIndex, 10);
            itemEl.querySelector(".tb-pair__title").addEventListener("input", function (e) {
              b.partners[pi].title = e.target.value;
            });
            itemEl.querySelector(".tb-pair__range").addEventListener("input", function (e) {
              b.partners[pi].minutes = parseInt(e.target.value, 10);
              var idx = blocks.findIndex(function (x) { return x.id === b.id; });
              recalcFromIndex(idx);
              updateDisplay();
            });
            itemEl.querySelector(".tb-pair__split").addEventListener("click", function () {
              var idx = blocks.findIndex(function (x) { return x.id === b.id; });
              var p = b.partners.splice(pi, 1)[0];
              blocks.splice(idx + 1, 0, { id: "b" + (nextId++), title: p.title, cat: p.cat, icon: p.icon, minutes: p.minutes, note: p.note || null });
              resequenceFromBoarding();
              render();
            });
          });
        }

        function startMove() {
          dragPayload = { type: "move", id: b.id };
          window.setTimeout(function () { row.classList.add("is-dragging"); }, 0);
        }
        function endMove() {
          row.classList.remove("is-dragging");
          dragPayload = null;
          clearDragUI();
        }
        row.querySelector(".tb-block__handle").addEventListener("dragstart", startMove);
        row.querySelector(".tb-block__handle").addEventListener("dragend", endMove);
        row.querySelector(".tb-block__icon--grab").addEventListener("dragstart", startMove);
        row.querySelector(".tb-block__icon--grab").addEventListener("dragend", endMove);

        timelineEl.appendChild(row);
      });

      updateDisplay();
    }

    /* ==========================================================
       Drag & drop: one timeline-level system.
       - The gaps light up with an insertion bar showing exactly
         where the step will land.
       - Hovering the MIDDLE of another step offers "At the same
         time": drop there to pair the two activities.
       Works for reordering steps AND for dragging activities in
       from the sidebar.
       ========================================================== */
    var dragPayload = null;
    var dropBar = document.createElement("div");
    dropBar.className = "tb-drop-bar";
    dropBar.innerHTML = '<span class="tb-drop-bar__plane">' + ICONS.walk + "</span>";

    function clearDragUI() {
      if (dropBar.parentNode) dropBar.parentNode.removeChild(dropBar);
      timelineEl.querySelectorAll(".pair-hint").forEach(function (r) { r.classList.remove("pair-hint"); });
    }

    function draggedBlock() {
      if (!dragPayload || dragPayload.type !== "move") return null;
      return blocks.find(function (x) { return x.id === dragPayload.id; }) || null;
    }

    function canPairWith(targetBlock) {
      if (!dragPayload) return false;
      var count = 1 + (targetBlock.partners ? targetBlock.partners.length : 0);
      if (count >= MAX_SIMULTANEOUS) return false;
      if (dragPayload.type === "move") {
        var src = draggedBlock();
        if (!src || src.id === targetBlock.id || (src.partners && src.partners.length)) return false;
      }
      return true;
    }

    function readDropSpot(e) {
      var rows = Array.prototype.slice.call(timelineEl.querySelectorAll(".tb-block"));
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i].getBoundingClientRect();
        var blk = blocks.find(function (x) { return x.id === rows[i].dataset.id; });
        var pairTop = r.top + r.height * 0.3;
        var pairBottom = r.bottom - r.height * 0.3;
        if (e.clientY < r.top + r.height / 2) {
          if (e.clientY >= pairTop && blk && canPairWith(blk) && !rows[i].classList.contains("is-dragging")) {
            return { mode: "pair", row: rows[i], block: blk };
          }
          return { mode: "insert", index: i, beforeRow: rows[i] };
        }
        if (e.clientY <= pairBottom && blk && canPairWith(blk) && !rows[i].classList.contains("is-dragging")) {
          return { mode: "pair", row: rows[i], block: blk };
        }
      }
      return { mode: "insert", index: rows.length, beforeRow: null };
    }

    timelineEl.addEventListener("dragover", function (e) {
      if (!dragPayload) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = dragPayload.type === "move" ? "move" : "copy";
      var spot = readDropSpot(e);
      timelineEl.querySelectorAll(".pair-hint").forEach(function (r) { r.classList.remove("pair-hint"); });
      if (spot.mode === "pair") {
        if (dropBar.parentNode) dropBar.parentNode.removeChild(dropBar);
        spot.row.classList.add("pair-hint");
      } else {
        if (spot.beforeRow) timelineEl.insertBefore(dropBar, spot.beforeRow);
        else timelineEl.appendChild(dropBar);
      }
    });

    timelineEl.addEventListener("dragleave", function (e) {
      if (e.target === timelineEl && !timelineEl.contains(e.relatedTarget)) clearDragUI();
    });

    timelineEl.addEventListener("drop", function (e) {
      if (!dragPayload) return;
      e.preventDefault();
      var spot = readDropSpot(e);
      var payload = dragPayload;
      dragPayload = null;
      clearDragUI();

      if (spot.mode === "pair") {
        var target = spot.block;
        target.partners = target.partners || [];
        if (payload.type === "new") {
          target.partners.push({ title: payload.item.title, cat: payload.item.cat, icon: payload.item.icon, minutes: payload.item.minutes, note: payload.item.note || null });
        } else {
          var srcIdx = blocks.findIndex(function (x) { return x.id === payload.id; });
          if (srcIdx === -1) return;
          var src = blocks.splice(srcIdx, 1)[0];
          target.partners.push({ title: src.title, cat: src.cat, icon: src.icon, minutes: src.minutes, note: src.note || null });
        }
        resequenceFromBoarding();
        render();
        return;
      }

      var index = spot.index;
      if (payload.type === "new") {
        blocks.splice(index, 0, { id: "b" + (nextId++), title: payload.item.title, cat: payload.item.cat, icon: payload.item.icon, minutes: payload.item.minutes, note: payload.item.note || null });
      } else {
        var fromIdx = blocks.findIndex(function (x) { return x.id === payload.id; });
        if (fromIdx === -1) return;
        var moved = blocks.splice(fromIdx, 1)[0];
        if (fromIdx < index) index--;
        blocks.splice(index, 0, moved);
      }
      resequenceFromBoarding();
      render();
    });

    document.addEventListener("dragend", function () {
      dragPayload = null;
      clearDragUI();
    });

    function renderChips() {
      activitySectionsEl.innerHTML = "";
      SECTIONS.forEach(function (section) {
        var titleEl = document.createElement("p");
        titleEl.className = "tb-activity-section__title tb-cat-title-" + (section.cat || "none");
        activitySectionsEl.appendChild(titleEl);
        titleEl.textContent = section.title;

        var grid = document.createElement("div");
        grid.className = "tb-activity-grid";

        section.items.forEach(function (item) {
          var cat = item.cat || section.cat;
          var card = document.createElement("button");
          card.type = "button";
          card.className = "tb-activity-card";
          card.innerHTML =
            '<span class="tb-activity-card__icon tb-cat-' + cat + '">' + ICONS[item.icon] + '</span>' +
            '<span class="tb-activity-card__title">' + item.title + '</span>' +
            '<span class="tb-activity-card__mins">' + item.minutes + 'm</span>';
          card.addEventListener("click", function () {
            insertAtEnd({ id: "b" + (nextId++), title: item.title, cat: cat, icon: item.icon, minutes: item.minutes, note: item.note || null });
          });
          card.draggable = true;
          card.addEventListener("dragstart", function (e) {
            dragPayload = { type: "new", item: { title: item.title, cat: cat, icon: item.icon, minutes: item.minutes, note: item.note || null } };
            card.classList.add("is-lifting");
            if (e.dataTransfer) { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", item.title); }
          });
          card.addEventListener("dragend", function () {
            card.classList.remove("is-lifting");
            dragPayload = null;
            clearDragUI();
          });
          grid.appendChild(card);
        });

        activitySectionsEl.appendChild(grid);
      });
    }

    function buildTimePicker() {
      var display = document.getElementById("tb-timeDisplay");
      var displayText = document.getElementById("tb-timeDisplayText");
      var popover = document.getElementById("tb-timePopover");
      var colHour = document.getElementById("tb-timeColHour");
      var colMinute = document.getElementById("tb-timeColMinute");
      var colPeriod = document.getElementById("tb-timeColPeriod");

      var hourBtns = {}, minuteBtns = {}, periodBtns = {};

      function makeItem(container, label, onSelect) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tb-time-col__item";
        btn.textContent = label;
        btn.addEventListener("click", onSelect);
        container.appendChild(btn);
        return btn;
      }

      [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(function (h) {
        hourBtns[h] = makeItem(colHour, String(h), function () { setPart("hour", h); });
      });
      ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].forEach(function (m) {
        minuteBtns[m] = makeItem(colMinute, m, function () { setPart("minute", parseInt(m, 10)); });
      });
      ["AM", "PM"].forEach(function (p) {
        periodBtns[p] = makeItem(colPeriod, p, function () { setPart("period", p); });
      });

      function currentParts() {
        var total = boardingMin();
        var h24 = Math.floor(total / 60);
        var mins = total % 60;
        var period = h24 >= 12 ? "PM" : "AM";
        var h12 = h24 % 12; if (h12 === 0) h12 = 12;
        var roundedMin = Math.round(mins / 5) * 5;
        if (roundedMin === 60) roundedMin = 0;
        return { hour: h12, minute: roundedMin, period: period };
      }

      function highlightSelection() {
        var parts = currentParts();
        Object.keys(hourBtns).forEach(function (k) { hourBtns[k].classList.toggle("is-selected", parseInt(k, 10) === parts.hour); });
        Object.keys(minuteBtns).forEach(function (k) { minuteBtns[k].classList.toggle("is-selected", parseInt(k, 10) === parts.minute); });
        Object.keys(periodBtns).forEach(function (k) { periodBtns[k].classList.toggle("is-selected", k === parts.period); });
      }

      function scrollSelectionIntoView() {
        [colHour, colMinute, colPeriod].forEach(function (col) {
          var sel = col.querySelector(".is-selected");
          if (sel) sel.scrollIntoView({ block: "center" });
        });
      }

      function setPart(part, value) {
        var parts = currentParts();
        parts[part] = value;
        var h24 = parts.hour % 12;
        if (parts.period === "PM") h24 += 12;
        boardingInput.value = (h24 < 10 ? "0" : "") + h24 + ":" + (parts.minute < 10 ? "0" : "") + parts.minute;
        boardingInput.dispatchEvent(new Event("change"));
      }

      function onDocClick(e) {
        if (!popover.contains(e.target) && e.target !== display && !display.contains(e.target)) closePopover();
      }
      function onKeydown(e) { if (e.key === "Escape") closePopover(); }

      function clampPopoverPosition() {
        /* Preferred: open BESIDE the field (left), so it never
           covers Flight day or the toolbar. If there's no room
           (mobile), drop below the field and clamp to viewport. */
        popover.classList.remove("tb-time-popover--below");
        popover.style.left = "";
        popover.style.right = "";
        var rect = popover.getBoundingClientRect();
        if (rect.left < 8) {
          popover.classList.add("tb-time-popover--below");
          rect = popover.getBoundingClientRect();
          if (rect.left < 8) {
            popover.style.right = "auto";
            popover.style.left = "0";
            rect = popover.getBoundingClientRect();
          }
          if (rect.right > window.innerWidth - 8) {
            popover.style.left = "auto";
            popover.style.right = "0";
          }
        }
      }

      function openPopover() {
        popover.hidden = false;
        display.setAttribute("aria-expanded", "true");
        highlightSelection();
        clampPopoverPosition();
        requestAnimationFrame(scrollSelectionIntoView);
        document.addEventListener("click", onDocClick, true);
        document.addEventListener("keydown", onKeydown);
      }
      function closePopover() {
        popover.hidden = true;
        display.setAttribute("aria-expanded", "false");
        document.removeEventListener("click", onDocClick, true);
        document.removeEventListener("keydown", onKeydown);
      }

      display.addEventListener("click", function () {
        if (popover.hidden) openPopover(); else closePopover();
      });

      window.addEventListener("resize", function () {
        if (!popover.hidden) clampPopoverPosition();
      });

      boardingInput.addEventListener("change", function () {
        displayText.textContent = formatDisplay(boardingMin());
        highlightSelection();
      });

      displayText.textContent = formatDisplay(boardingMin());
      highlightSelection();
    }

    document.getElementById("tb-addBtn").addEventListener("click", function () {
      insertAtEnd({ id: "b" + (nextId++), title: "New step", cat: "airport", icon: "flag", minutes: 10 });
    });
    document.getElementById("tb-resetBtn").addEventListener("click", function () {
      blocks = freshDefaults();
      boardingInput.value = "17:30";
      boardingInput.dispatchEvent(new Event("change"));
      resequenceFromBoarding();
      render();
    });
    boardingInput.addEventListener("change", function () {
      resequenceFromBoarding();
      updateDisplay();
    });

    /* ==========================================================
       Portability: the plan auto-saves in this browser, travels
       as a share link (whole plan encoded in the URL), and can
       be added to Apple/Google/Outlook calendars.
       ========================================================== */
    var STORE_KEY = "flyeasy-tb-plan";
    var VALID_CATS = { airport: 1, going: 1, food: 1, explore: 1, gate: 1 };
    var dateInput = document.getElementById("tb-flightDate");
    var statusEl = document.getElementById("tb-shareStatus");
    var saveTimer = null;
    var statusTimer = null;

    function todayStr() {
      var d = new Date();
      return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
    }

    function packActivity(x) {
      return [x.title, x.cat, x.icon, x.minutes];
    }
    function unpackActivity(row) {
      var title = String(row[0] || "Step").slice(0, 80);
      return {
        title: title,
        cat: VALID_CATS[row[1]] ? row[1] : "airport",
        icon: ICONS[row[2]] ? row[2] : "flag",
        minutes: Math.min(360, Math.max(1, parseInt(row[3], 10) || 10)),
        note: NOTE_BY_TITLE[title] || null
      };
    }

    function serializePlan() {
      return {
        v: 1,
        b: boardingInput.value || "17:30",
        d: (dateInput && dateInput.value) || todayStr(),
        s: blocks.map(function (x) {
          var row = packActivity(x);
          if (x.partners) x.partners.forEach(function (p) { row.push(packActivity(p)); });
          return row;
        })
      };
    }

    function restorePlan(plan) {
      if (!plan || plan.v !== 1 || !Array.isArray(plan.s) || !plan.s.length) return false;
      if (!/^\d{2}:\d{2}$/.test(plan.b || "")) return false;
      blocks = plan.s.slice(0, 30).map(function (row) {
        var blk = unpackActivity(row);
        blk.id = "b" + (nextId++);
        /* row[4]/row[5] hold up to 2 packed partners (older links
           only ever had one, at row[4] — this still reads those). */
        var partners = [];
        for (var i = 4; i < row.length && partners.length < MAX_SIMULTANEOUS - 1; i++) {
          if (Array.isArray(row[i])) partners.push(unpackActivity(row[i]));
        }
        if (partners.length) blk.partners = partners;
        return blk;
      });
      boardingInput.value = plan.b;
      if (dateInput && /^\d{4}-\d{2}-\d{2}$/.test(plan.d || "")) dateInput.value = plan.d;
      return true;
    }

    function encodePlan(plan) {
      var json = JSON.stringify(plan);
      return btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    function decodePlan(str) {
      try {
        var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        return JSON.parse(decodeURIComponent(escape(atob(b64))));
      } catch (e) { return null; }
    }

    function buildShareURL() {
      return location.origin + location.pathname + "#plan=" + encodePlan(serializePlan());
    }

    function flashStatus(msg) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(function () { statusEl.textContent = ""; }, 4000);
    }

    /* ---- calendar building ----
       Block .start values are raw (un-wrapped) minutes relative to
       the flight day, so values below 0 simply mean "the day
       before" — day offsets fall out of floor division. */
    function fmtLocalDT(dateStr, minutes) {
      var base = new Date(dateStr + "T00:00:00");
      base.setMinutes(base.getMinutes() + minutes);
      return base.getFullYear() +
        String(base.getMonth() + 1).padStart(2, "0") +
        String(base.getDate()).padStart(2, "0") + "T" +
        String(base.getHours()).padStart(2, "0") +
        String(base.getMinutes()).padStart(2, "0") + "00";
    }
    function icsEscape(s) {
      return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    }

    function buildICS() {
      var dateStr = (dateInput && dateInput.value) || todayStr();
      var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
      var lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Fly Easy//Timeblocker//EN",
        "CALSCALE:GREGORIAN"
      ];
      function addEvent(uidPart, title, startMin, endMin, alarmMinsBefore) {
        lines.push("BEGIN:VEVENT");
        lines.push("UID:" + dateStr + "-" + uidPart + "@flyeasy");
        lines.push("DTSTAMP:" + stamp);
        lines.push("DTSTART:" + fmtLocalDT(dateStr, startMin));
        lines.push("DTEND:" + fmtLocalDT(dateStr, endMin));
        lines.push("SUMMARY:" + icsEscape(title));
        if (alarmMinsBefore) {
          lines.push("BEGIN:VALARM");
          lines.push("TRIGGER:-PT" + alarmMinsBefore + "M");
          lines.push("ACTION:DISPLAY");
          lines.push("DESCRIPTION:" + icsEscape("Time to leave for the airport"));
          lines.push("END:VALARM");
        }
        lines.push("END:VEVENT");
      }
      if (blocks.length) {
        var leaveMin = blocks[0].start;
        addEvent("leave", "✈️ Leave home — Fly Easy plan", leaveMin, leaveMin + 5, 15);
        blocks.forEach(function (b, i) {
          addEvent("step" + i, b.title, b.start, b.start + b.minutes);
          if (b.partners) {
            b.partners.forEach(function (p, pi) {
              addEvent("step" + i + "p" + pi, p.title + " (at the same time)", b.start, b.start + p.minutes);
            });
          }
        });
        addEvent("board", "Boarding", boardingRawMin(), boardingRawMin() + 15);
      }
      lines.push("END:VCALENDAR");
      return lines.join("\r\n");
    }
    function boardingRawMin() {
      /* boarding is always at/after the last block's end */
      var m = boardingMin();
      if (blocks.length) {
        var last = blocks[blocks.length - 1];
        var lastEnd = last.start + effMinutes(last);
        while (m < lastEnd) m += 1440;
      }
      return m;
    }

    function savePlan() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(serializePlan())); } catch (e) {}
    }
    function scheduleSave() {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(savePlan, 250);
    }

    /* ---- wire up the share card ---- */
    if (dateInput) {
      dateInput.value = todayStr();
      dateInput.min = todayStr();
      dateInput.addEventListener("change", scheduleSave);
    }

    var copyBtn = document.getElementById("tb-copyLink");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var url = buildShareURL();
        function ok() { flashStatus("Link copied — your plan travels with it ✓"); }
        function fail() {
          /* Show the link inline, pre-selected, and try the legacy copy path */
          statusEl.textContent = "";
          var inp = document.createElement("input");
          inp.type = "text";
          inp.readOnly = true;
          inp.value = url;
          inp.className = "tb-share__url";
          inp.setAttribute("aria-label", "Your plan link");
          statusEl.appendChild(inp);
          inp.focus();
          inp.select();
          var copied = false;
          try { copied = document.execCommand("copy"); } catch (e) {}
          if (copied) {
            flashStatus("Link copied — your plan travels with it ✓");
          } else {
            window.clearTimeout(statusTimer);
            statusTimer = window.setTimeout(function () { statusEl.textContent = ""; }, 20000);
          }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(ok, fail);
        } else {
          fail();
        }
      });
    }

    var icsBtn = document.getElementById("tb-icsBtn");
    if (icsBtn) {
      icsBtn.addEventListener("click", function () {
        var blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "fly-easy-plan.ics";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        flashStatus("Calendar file downloaded — opens in Apple & Outlook, imports into Google Calendar ✓");
      });
    }

    var printBtn = document.getElementById("tb-printBtn");
    if (printBtn) {
      printBtn.addEventListener("click", function () {
        buildPrintSheet();
        window.print();
      });
    }

    /* Save on any plan change: structural re-renders, slider/title/
       time edits, and boarding-time changes. */
    if (timelineEl && "MutationObserver" in window) {
      new MutationObserver(scheduleSave).observe(timelineEl, { childList: true, subtree: true });
    }
    if (timelineEl) {
      timelineEl.addEventListener("input", scheduleSave);
      timelineEl.addEventListener("change", scheduleSave);
    }
    boardingInput.addEventListener("change", scheduleSave);

    /* Tiny public hook (also used for testing) */
    window.flyEasyPlan = { shareURL: buildShareURL };

    /* ---- init: a #plan link wins once, then the saved plan ---- */
    var restored = false;
    var hashMatch = location.hash.match(/^#plan=([A-Za-z0-9_-]+)$/);
    if (hashMatch) {
      restored = restorePlan(decodePlan(hashMatch[1]));
      if (restored) {
        history.replaceState(null, "", location.pathname + location.search);
        flashStatus("Shared plan loaded ✓");
      }
    }
    if (!restored) {
      try { restored = restorePlan(JSON.parse(localStorage.getItem(STORE_KEY))); } catch (e) {}
    }
    if (!restored) blocks = freshDefaults();

    boardingInput.dispatchEvent(new Event("change"));
    resequenceFromBoarding();
    renderChips();
    buildTimePicker();
    render();
    savePlan();
  }
})();

/* ============================================================
   WINDOW SEAT — journey scroll engine
   Injects the fixed sky (dawn->night gradient, parallax clouds,
   stars), a flight path drawn down each page with a plane that
   rides the scroll, a live altitude readout in the nav, and
   reveal choreography. Skips all motion for reduced-motion.
   ============================================================ */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CLOUD = '<svg viewBox="0 0 64 30" fill="currentColor"><path d="M14 22a9 9 0 01-2-17.8A11 11 0 0134 6a8 8 0 0115 8 8 8 0 01-3 15H14z"/></svg>';
  var PLANE_D = "M2 13l8-2 5-8 2 1-3 7 6-1 2 2-7 3-2 6-2-1 1-5-6 2z";

  /* ---------- Sky ---------- */
  var sky = document.createElement("div");
  sky.className = "ws-sky";
  sky.setAttribute("aria-hidden", "true");
  sky.innerHTML =
    '<div class="ws-sky__gradient"></div>' +
    '<div class="ws-clouds ws-clouds--far"></div>' +
    '<div class="ws-clouds ws-clouds--near"></div>' +
    '<div class="ws-sky__stars"></div>';
  document.body.insertBefore(sky, document.body.firstChild);

  var grad = sky.querySelector(".ws-sky__gradient");
  var far = sky.querySelector(".ws-clouds--far");
  var near = sky.querySelector(".ws-clouds--near");
  var stars = sky.querySelector(".ws-sky__stars");

  function seedClouds(layer, count, minW, maxW, minDur, maxDur) {
    for (var i = 0; i < count; i++) {
      var wrap = document.createElement("div");
      wrap.innerHTML = CLOUD;
      var c = wrap.firstChild;
      var w = minW + Math.random() * (maxW - minW);
      c.style.width = w + "px";
      c.style.top = Math.random() * 100 + "%";
      c.style.left = "0";
      c.style.setProperty("--cs", (0.8 + Math.random() * 0.5).toFixed(2));
      c.style.animationDuration = (minDur + Math.random() * (maxDur - minDur)) + "s";
      c.style.animationDelay = (-Math.random() * maxDur) + "s";
      layer.appendChild(c);
    }
  }
  seedClouds(far, 6, 60, 130, 70, 110);
  seedClouds(near, 4, 110, 210, 45, 75);

  for (var i = 0; i < 80; i++) {
    var s = document.createElement("span");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
    s.style.transform = "scale(" + (0.4 + Math.random() * 0.9).toFixed(2) + ")";
    stars.appendChild(s);
  }

  /* ---------- Altitude readout ---------- */
  var altVal = null;
  var navInner = document.querySelector(".site-nav__inner");
  if (navInner && !reduced) {
    var alt = document.createElement("span");
    alt.className = "ws-alt";
    alt.setAttribute("aria-hidden", "true");
    alt.innerHTML = 'ALT <span class="ws-alt__val">00,000</span> FT';
    navInner.appendChild(alt);
    altVal = alt.querySelector(".ws-alt__val");
  }

  /* ---------- Flight route over main ---------- */
  var main = document.getElementById("main");
  var routeWrap = null, routePath = null, routePlane = null, routeLen = 0;
  var SVG_NS = "http://www.w3.org/2000/svg";

  function buildRoute() {
    if (!main || reduced) return;
    if (routeWrap) routeWrap.remove();
    routeWrap = null; routePath = null; routePlane = null;
    var w = main.offsetWidth;
    var h = main.offsetHeight;
    if (h < 1400 || w < 761) return;

    routeWrap = document.createElement("div");
    routeWrap.className = "ws-route";
    routeWrap.setAttribute("aria-hidden", "true");
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("preserveAspectRatio", "none");

    var xL = w * 0.1, xR = w * 0.9;
    var seg = 850;
    var y = 260;
    var d = "M " + xL + " " + y;
    var side = 0;
    while (y + seg < h - 260) {
      var y2 = y + seg;
      var xFrom = side === 0 ? xL : xR;
      var xTo = side === 0 ? xR : xL;
      d += " C " + xFrom + " " + (y + seg * 0.55) + ", " + xTo + " " + (y2 - seg * 0.55) + ", " + xTo + " " + y2;
      y = y2;
      side = 1 - side;
    }
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);

    var plane = document.createElementNS(SVG_NS, "path");
    plane.setAttribute("d", PLANE_D);
    plane.setAttribute("class", "ws-route__plane");
    svg.appendChild(plane);

    routeWrap.appendChild(svg);
    main.appendChild(routeWrap);
    routePath = path;
    routePlane = plane;
    routeLen = path.getTotalLength();
  }

  /* ---------- Scroll driver ---------- */
  var docH = 1, vh = 1, gradTravel = 1, mainTop = 0, mainH = 1;

  function measure() {
    vh = window.innerHeight;
    docH = Math.max(1, document.documentElement.scrollHeight - vh);
    gradTravel = Math.max(0, grad.offsetHeight - vh);
    if (main) {
      var r = main.getBoundingClientRect();
      mainTop = r.top + window.scrollY;
      mainH = Math.max(1, main.offsetHeight);
    }
  }

  function frame() {
    ticking = false;
    var yPos = window.scrollY;
    var f = Math.min(1, Math.max(0, yPos / docH));

    grad.style.transform = "translateY(" + (-f * gradTravel).toFixed(1) + "px)";
    far.style.transform = "translateY(" + (-(yPos * 0.05)).toFixed(1) + "px)";
    near.style.transform = "translateY(" + (-(yPos * 0.11)).toFixed(1) + "px)";
    stars.style.opacity = f > 0.66 ? Math.min(1, (f - 0.66) / 0.22).toFixed(2) : 0;

    var tod = f < 0.3 ? "dawn" : f < 0.52 ? "day" : f < 0.78 ? "dusk" : "night";
    if (document.body.getAttribute("data-tod") !== tod) {
      document.body.setAttribute("data-tod", tod);
    }

    if (altVal) {
      var climb = f <= 0.5 ? f / 0.5 : (1 - f) / 0.5;
      var ft = Math.round((climb * 36000) / 100) * 100;
      var thousands = String(Math.floor(ft / 1000));
      while (thousands.length < 2) thousands = "0" + thousands;
      var rem = String(ft % 1000);
      while (rem.length < 3) rem = "0" + rem;
      altVal.textContent = thousands + "," + rem;
    }

    if (routePath && routeLen) {
      var p = Math.min(1, Math.max(0, (yPos + vh * 0.55 - mainTop) / mainH));
      var len = p * routeLen;
      var pt = routePath.getPointAtLength(len);
      var ahead = routePath.getPointAtLength(Math.min(routeLen, len + 3));
      var ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
      routePlane.setAttribute("transform",
        "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ") scale(1.7) translate(-12 -12)");
    }
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(frame);
    }
  }

  /* ---------- Reveal choreography ---------- */
  function initReveals() {
    var targets = document.querySelectorAll(
      ".dest-card, .tb-feature__card, .value-item, .explorer__panel, .airline-warning, .tb-notice, .stat-item, .photo-band"
    );
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("ws-reveal", "is-landed"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-landed");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -70px 0px", threshold: 0.12 });
    targets.forEach(function (t, i) {
      t.classList.add("ws-reveal");
      t.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(t);
    });
  }

  /* ---------- Boot ---------- */
  if (reduced) {
    document.body.setAttribute("data-tod", "day");
    initReveals();
    return;
  }

  buildRoute();
  measure();
  frame();
  initReveals();

  window.addEventListener("scroll", onScroll, { passive: true });

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      buildRoute();
      measure();
      frame();
    }, 180);
  });

  /* Content height can change after load (fonts, dynamic renders) */
  window.addEventListener("load", function () {
    buildRoute();
    measure();
    frame();
  });

  /* View toggles / searches / phase tabs change the page height —
     re-measure and redraw the route shortly after any interaction. */
  var interactTimer = null;
  function scheduleRemeasure() {
    clearTimeout(interactTimer);
    interactTimer = setTimeout(function () {
      buildRoute();
      measure();
      frame();
    }, 350);
  }
  document.addEventListener("click", scheduleRemeasure, { passive: true });
  document.addEventListener("input", scheduleRemeasure, { passive: true });
})();

/* ============================================================
   WINDOW SEAT v2 — postcard tilt + shooting stars
   ============================================================ */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  /* Postcard stack tilts toward the pointer (sfo.html) */
  var head = document.querySelector(".vista-head");
  if (head) {
    var pending = false;
    head.addEventListener("pointermove", function (e) {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () {
        pending = false;
        var r = head.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        head.style.setProperty("--tilt-y", (dx * 10).toFixed(2) + "deg");
        head.style.setProperty("--tilt-x", (-dy * 8).toFixed(2) + "deg");
      });
    });
    head.addEventListener("pointerleave", function () {
      head.style.setProperty("--tilt-y", "0deg");
      head.style.setProperty("--tilt-x", "0deg");
    });
  }

  /* A shooting star streaks across the night sky now and then */
  var starsLayer = document.querySelector(".ws-sky__stars");
  if (starsLayer) {
    window.setInterval(function () {
      if (document.body.getAttribute("data-tod") !== "night") return;
      if (document.hidden) return;
      var s = document.createElement("span");
      s.className = "ws-shoot";
      s.style.left = (30 + Math.random() * 60) + "%";
      s.style.top = (5 + Math.random() * 45) + "%";
      starsLayer.appendChild(s);
      window.setTimeout(function () { s.remove(); }, 1400);
    }, 5000);
  }
})();

/* ============================================================
   SFO AirTrain car — drives the map loop to the selected stop.
   The stops are the real tab buttons; panel switching is handled
   by the existing explorer code. This only moves the car.
   ============================================================ */
(function () {
  var map = document.getElementById("sfo-map");
  var path = document.getElementById("sfo-road-path");
  var car = document.getElementById("sfo-car");
  if (!map || !path || !car) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var totalLen = path.getTotalLength();

  /* Sample the loop once so each stop can find its spot on the track */
  var SAMPLES = 400;
  var pts = [];
  for (var i = 0; i <= SAMPLES; i++) {
    var p = path.getPointAtLength((i / SAMPLES) * totalLen);
    pts.push(p);
  }
  function nearestLen(x, y) {
    var best = 0, bestD = Infinity;
    for (var i = 0; i <= SAMPLES; i++) {
      var dx = pts[i].x - x, dy = pts[i].y - y;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return (best / SAMPLES) * totalLen;
  }

  /* Stop coordinates in viewBox units (1000 x 340).
     The car parks just short of each station so it stays visible
     beside the badge instead of hiding underneath it. */
  var PARK_OFFSET = 38;
  function parkLen(rawLen) {
    return rawLen <= PARK_OFFSET + 4 ? rawLen + PARK_OFFSET : rawLen - PARK_OFFSET;
  }
  var STOP_LEN = {
    intlA: parkLen(nearestLen(100, 245)),
    t1: parkLen(nearestLen(220, 82)),
    t2: parkLen(nearestLen(500, 41)),
    t3: parkLen(nearestLen(780, 82)),
    intlG: parkLen(nearestLen(900, 245))
  };
  var JUNCTION_LEN = nearestLen(500, 41);
  var SPUR = { x: 500, yTop: 45, yBottom: 200 };

  /* Car state: position along loop + how far down the spur (0-1) */
  var state = { len: STOP_LEN.t1, spur: 0 };
  var animId = null;

  function setCar(len, spur) {
    var x, y, ang;
    if (spur > 0) {
      x = SPUR.x;
      y = SPUR.yTop + (SPUR.yBottom - SPUR.yTop) * spur;
      ang = 90;
    } else {
      var p = path.getPointAtLength(len);
      var ahead = path.getPointAtLength(Math.min(totalLen, len + 2));
      var behind = path.getPointAtLength(Math.max(0, len - 2));
      x = p.x; y = p.y;
      ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
    }
    car.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")");
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function tween(from, to, dur, apply, done) {
    if (dur <= 0) { apply(to); if (done) done(); return; }
    var start = performance.now();
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      apply(from + (to - from) * easeInOut(t));
      if (t < 1) { animId = window.requestAnimationFrame(step); }
      else if (done) { done(); }
    }
    animId = window.requestAnimationFrame(step);
  }

  function driveTo(key) {
    if (animId) window.cancelAnimationFrame(animId);
    var targetSpur = key === "transport";
    var targetLen = targetSpur ? JUNCTION_LEN : STOP_LEN[key];
    if (targetLen === undefined) return;

    if (reduced) {
      state.len = targetLen;
      state.spur = targetSpur ? 1 : 0;
      setCar(state.len, state.spur);
      return;
    }

    var driveDur = Math.min(850, Math.max(280, Math.abs(targetLen - state.len) * 0.8));

    function phaseDrive() {
      tween(state.len, targetLen, driveDur, function (v) {
        state.len = v;
        setCar(v, 0);
      }, function () {
        state.len = targetLen;
        if (targetSpur) phaseSpurOut();
      });
    }
    function phaseSpurOut() {
      tween(0, 1, 260, function (v) {
        state.spur = v;
        setCar(state.len, v);
      }, function () { state.spur = 1; });
    }

    if (state.spur > 0) {
      tween(state.spur, 0, 220, function (v) {
        state.spur = v;
        setCar(state.len, v);
      }, function () {
        state.spur = 0;
        phaseDrive();
      });
    } else {
      phaseDrive();
    }
  }

  /* ---------- Idle patrol: after 10s without interaction the
     train shuttles slowly back and forth along the line, like
     the real AirTrain running its route. Any tap takes over. ---------- */
  var IDLE_DELAY = 10000;
  var PATROL_SPEED = 48; /* viewBox units per second */
  var idleTimer = null;
  var patrolling = false;
  var patrolRaf = null;
  var patrolLastTs = 0;
  var patrolDir = 1;
  var mapVisible = true;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      mapVisible = entries[0].isIntersecting;
    }, { threshold: 0.15 }).observe(map);
  }

  function patrolStep(ts) {
    if (!patrolling) return;
    if (!patrolLastTs) patrolLastTs = ts;
    var dt = Math.min(0.05, (ts - patrolLastTs) / 1000);
    patrolLastTs = ts;
    if (mapVisible) {
      state.len += PATROL_SPEED * dt * patrolDir;
      if (state.len >= totalLen) { state.len = totalLen; patrolDir = -1; }
      if (state.len <= 0) { state.len = 0; patrolDir = 1; }
      setCar(state.len, 0);
    }
    patrolRaf = window.requestAnimationFrame(patrolStep);
  }

  function startPatrol() {
    if (patrolling || reduced) return;
    function begin() {
      patrolling = true;
      patrolLastTs = 0;
      patrolRaf = window.requestAnimationFrame(patrolStep);
    }
    if (state.spur > 0) {
      tween(state.spur, 0, 260, function (v) {
        state.spur = v;
        setCar(state.len, v);
      }, function () { state.spur = 0; begin(); });
    } else {
      begin();
    }
  }

  function stopPatrol() {
    patrolling = false;
    if (patrolRaf) window.cancelAnimationFrame(patrolRaf);
    window.clearTimeout(idleTimer);
  }

  function armIdle() {
    if (reduced) return;
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(startPatrol, IDLE_DELAY);
  }

  map.addEventListener("click", function (e) {
    var stop = e.target.closest(".sfo-map__stop");
    if (!stop) return;
    stopPatrol();
    driveTo(stop.getAttribute("data-terminal"));
    armIdle();
  });

  setCar(state.len, 0);
  armIdle();
})();

/* ============================================================
   Survey toast — nudges first-time visitors toward the feedback
   form once, then stays dismissed (localStorage) either when
   closed or once they click through to the survey.
   ============================================================ */
(function () {
  var toast = document.getElementById("surveyToast");
  if (!toast) return;
  var KEY = "flyeasy-survey-dismissed";

  function dismiss() {
    toast.classList.remove("is-visible");
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }

  var alreadyDismissed = false;
  try { alreadyDismissed = !!localStorage.getItem(KEY); } catch (e) {}
  if (alreadyDismissed) return;

  function reveal() {
    toast.hidden = false;
    window.requestAnimationFrame(function () { toast.classList.add("is-visible"); });
  }

  /* Never ambush the hero's own call-to-action buttons: wait for
     the timer AND for the visitor to have scrolled past the top
     of the page (the toast is tall enough on mobile to cover
     whatever sits at the very bottom of a full-height hero). */
  window.setTimeout(function () {
    if (window.scrollY > 80) {
      reveal();
    } else {
      window.addEventListener("scroll", function onScroll() {
        if (window.scrollY > 80) {
          window.removeEventListener("scroll", onScroll);
          reveal();
        }
      }, { passive: true });
    }
  }, 9000);

  toast.querySelector(".survey-toast__close").addEventListener("click", dismiss);
  document.getElementById("surveyToastCta").addEventListener("click", dismiss);
})();
