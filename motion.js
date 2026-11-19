/* ============================================================
   Fly Easy motion boot — loaded in <head>, before the page paints.

   Works out HOW this page was reached, so motion.css can play the
   right arrival:

     data-nav="next" / "prev"   moving right / left along the tab order
     data-nav="in"   / "out"    Airports -> a guide / a guide -> Airports
     data-nav="fade"            first visit, reload, same page

   Where the browser supports cross-document view transitions
   (iOS 18.2+, Chrome, Edge) the old and new pages slide as one
   move and <html> gets the class "vt". Everywhere else <main>
   plays a short arrival on its own.

   The big moments keep their own effects and skip the slide:
     - globe -> guide dive   (clouds close, then part: "arrive-clouds")
     - guide -> globe        (space opens, the globe climbs: "ap-rise")
   ============================================================ */
(function () {
  var root = document.documentElement;

  /* window.feArrival resolves once this page's arrival has finished.
     Heavy start-up work (the 3D globe) waits for it, so it never
     lands in the middle of a slide and stutters it. */
  var arrived;
  window.feArrival = new Promise(function (r) { arrived = r; });
  window.setTimeout(function () { arrived(); }, 1200);   /* never wait longer */

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Position of each page along the nav / phone tab bar. The airport
     guides sit "inside" Airports (same whole number, deeper level). */
  var ORDER = {
    "index.html": 0,
    "global.html": 1, "delays.html": 1.5,
    "airports.html": 2, "sfo.html": 2.5, "sjc.html": 2.5,
    "timeblocker.html": 3,
    "packer.html": 4
  };

  function pageKey() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function arrive() {
    var here = pageKey(), from = null, how = null, seen = null;
    try {
      from = sessionStorage.getItem("fe-last");
      how = sessionStorage.getItem("fe-how");
      seen = sessionStorage.getItem("fe-seen");
      sessionStorage.removeItem("fe-how");
      sessionStorage.setItem("fe-last", here);
      sessionStorage.setItem("fe-seen", "1");
    } catch (e) {}

    var a = ORDER[from], b = ORDER[here], nav = "fade";
    if (from && from !== here && a != null && b != null) {
      if (Math.floor(a) === Math.floor(b)) nav = b > a ? "in" : (b < a ? "out" : "fade");
      else nav = b > a ? "next" : "prev";
    }
    root.setAttribute("data-nav", nav);
    /* after the first page of a visit the tab bar is already "there" */
    root.classList.toggle("is-returning", !!seen);
    root.classList.toggle("arrive-clouds", how === "clouds" && !reduce);
  }

  /* When the browser drops a transition (fast taps, a hidden tab) it
     rejects these promises; nothing is broken, so swallow them. */
  /* No view transition: <main> plays its own arrival (0.42s) */
  function afterOwnArrival() { window.setTimeout(arrived, reduce ? 0 : 440); }

  function quiet(vt) {
    ["ready", "finished", "updateCallbackDone"].forEach(function (k) {
      if (vt[k] && vt[k].catch) vt[k].catch(function () {});
    });
  }

  if ("onpagereveal" in window) {
    /* fires before the first paint, and again on Back/Forward restores */
    window.addEventListener("pagereveal", function (e) {
      arrive();
      var vt = e.viewTransition;
      if (!vt) { root.classList.remove("vt"); afterOwnArrival(); return; }
      quiet(vt);
      if (reduce || root.classList.contains("ap-rise") || root.classList.contains("arrive-clouds")) {
        vt.skipTransition();
        arrived();
        return;
      }
      vt.finished.then(arrived, arrived);
      /* The view transition IS this page's arrival. "vt" stays on for
         the life of the page: removing it would hand <main> its backup
         arrival animation and the page would slide in a second time. */
      root.classList.add("vt");
    });
  } else {
    arrive();
    afterOwnArrival();
    /* A browser that can do cross-page transitions but has no
       pagereveal event: let the transition do the arriving alone. */
    if (window.CSSViewTransitionRule && !reduce) root.classList.add("vt");
    window.addEventListener("pageshow", function (e) { if (e.persisted) arrive(); });
  }

  /* Remember this page as the one we came from at the moment we leave
     it, so a tap that lands before this page has even painted still
     gives the next page the right direction. */
  function leaving() {
    try { sessionStorage.setItem("fe-last", pageKey()); } catch (e) {}
  }
  window.addEventListener("pagehide", leaving);

  window.addEventListener("pageswap", function (e) {
    leaving();
    var vt = e.viewTransition;
    if (!vt) return;
    quiet(vt);
    /* Leaving through a globe effect: no snapshot, the next page
       handles its own arrival. */
    if (root.classList.contains("is-globe-leaving") ||
        root.classList.contains("is-cloud-leaving")) {
      vt.skipTransition();
    }
  });

  /* ---------- Make the next page ready before the tap lands ---------- */
  function internal(link) {
    if (!link || !link.href || link.hasAttribute("download")) return null;
    if (link.target && link.target !== "_self") return null;
    var url;
    try { url = new URL(link.href, location.href); } catch (e) { return null; }
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname) return null;
    if (!/(\.html|\/)$/.test(url.pathname)) return null;
    return url;
  }

  /* Chrome / Edge: the browser fetches a page when a link is hovered or pressed */
  var canSpeculate = window.HTMLScriptElement && HTMLScriptElement.supports &&
    HTMLScriptElement.supports("speculationrules");
  if (canSpeculate) {
    var rules = document.createElement("script");
    rules.type = "speculationrules";
    rules.textContent = JSON.stringify({
      prefetch: [{
        where: { and: [{ href_matches: "/*" }, { not: { selector_matches: "[target=_blank], [download]" } }] },
        eagerness: "moderate"
      }]
    });
    document.head.appendChild(rules);
  } else if (window.fetch) {
    /* Safari / Firefox: warm the page the moment a finger or pointer lands on its link */
    var warmed = {};
    var warm = function (e) {
      var link = e.target && e.target.closest && e.target.closest("a[href]");
      var url = internal(link);
      if (!url || warmed[url.pathname]) return;
      var c = navigator.connection;
      if (c && c.saveData) return;
      warmed[url.pathname] = true;
      fetch(url.pathname + url.search, { credentials: "same-origin" }).catch(function () {});
    };
    document.addEventListener("touchstart", warm, { passive: true, capture: true });
    document.addEventListener("mouseover", warm, { passive: true, capture: true });
  }
})();
