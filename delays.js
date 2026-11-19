/* Delays page: the two mini pages and their switch, the tab sets inside
   them, the wait checklist, and the diagrams that draw themselves as
   they come into view. Uses swapCard and FE_REDUCED from script.js. */
(function () {
  var root = document.querySelector(".dl");
  if (!root) return;
  var reduced = typeof FE_REDUCED !== "undefined" && FE_REDUCED;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* the dock pins itself right under the site nav, whatever its height */
  var nav = document.querySelector(".site-nav");
  function syncNav() {
    if (nav) document.documentElement.style.setProperty("--site-nav-h", nav.offsetHeight + "px");
  }
  syncNav();
  if (nav && window.ResizeObserver) new ResizeObserver(syncNav).observe(nav);
  else window.addEventListener("resize", syncNav);

  /* ---------- "Say this instead": three pairs take turns ---------- */
  (function () {
    var say = root.querySelector(".dl-say");
    var pairs = root.querySelectorAll(".dl-say__pair");
    var pips = root.querySelectorAll(".dl-say__pips i");
    if (!say || pairs.length < 2) return;
    if (reduced) { say.classList.add("is-static"); return; }
    var at = 0;
    window.setInterval(function () {
      if (document.hidden) return;
      pairs[at].classList.remove("is-on");
      if (pips[at]) pips[at].classList.remove("is-on");
      at = (at + 1) % pairs.length;
      pairs[at].classList.add("is-on");
      if (pips[at]) pips[at].classList.add("is-on");
    }, 6000);
  })();

  /* ---------- The tip follows you: show the reminder once it scrolls away ---------- */
  (function () {
    var tip = document.getElementById("dlTip");
    var nice = document.getElementById("dlNice");
    if (!tip || !nice) return;
    if (!("IntersectionObserver" in window)) { nice.classList.add("is-shown"); return; }
    new IntersectionObserver(function (entries) {
      nice.classList.toggle("is-shown", !entries[0].isIntersecting);
    }, { rootMargin: "-90px 0px 0px 0px" }).observe(tip);
  })();

  /* ---------- Dots for the airline-promise rows ---------- */
  each(root.querySelectorAll(".dl-dots"), function (el) {
    var n = parseInt(el.getAttribute("data-n"), 10) || 0;
    for (var i = 0; i < 9; i++) {
      var d = document.createElement("i");
      if (i < n) d.className = "is-on";
      d.style.setProperty("--i", i);
      el.appendChild(d);
    }
  });

  /* step order for the staggered arrival of each flight path */
  each(root.querySelectorAll(".dl-path"), function (ol) {
    each(ol.children, function (li, i) { li.style.setProperty("--i", i); });
  });

  /* ---------- Draw-on-scroll ---------- */
  var canAnimate = !reduced && "IntersectionObserver" in window;
  if (canAnimate) root.classList.add("dl-anim");
  var io = canAnimate ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      entry.target.classList.add("is-drawn");
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }) : null;

  /* (re)arm every diagram inside scope so it draws when next seen */
  function arm(scope) {
    if (!io) return;
    var targets = Array.prototype.slice.call(scope.querySelectorAll("[data-dl-draw]"));
    if (scope.hasAttribute && scope.hasAttribute("data-dl-draw")) targets.push(scope);
    targets.forEach(function (el) {
      el.classList.remove("is-drawn");
      io.unobserve(el);
      io.observe(el);
    });
  }
  arm(root);

  /* ---------- Tabs: the page switch, the situations, the regions ---------- */
  var dock = document.getElementById("dlDock");
  var selectors = {};

  each(root.querySelectorAll("[data-dl-tabs]"), function (list) {
    var name = list.getAttribute("data-dl-tabs");
    var wrap = root.querySelector('[data-dl-panels="' + name + '"]');
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panelOf = function (tab) { return document.getElementById(tab.getAttribute("aria-controls")); };
    var current = 0;

    function select(i, focus) {
      if (i === current || !tabs[i]) return;
      var dir = i > current ? 1 : -1;
      current = i;
      list.setAttribute("data-at", i);
      tabs.forEach(function (tab, n) {
        var on = n === i;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
      });
      if (focus) tabs[i].focus();
      swapCard(wrap, dir, function () {
        tabs.forEach(function (tab, n) { panelOf(tab).hidden = n !== i; });
        arm(panelOf(tabs[i]));
        if (name === "view") landOnView(wrap, tabs[i]);
      });
    }
    selectors[name] = select;

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i, false); });
      tab.addEventListener("keydown", function (e) {
        var to = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = tabs.length - 1;
        if (to < 0) return;
        e.preventDefault();
        select(to, true);
      });
    });
  });

  /* a new mini page always starts at its top, just under the dock */
  function landOnView(wrap, tab) {
    try { history.replaceState(null, "", "#" + tab.getAttribute("aria-controls")); } catch (e) {}
    if (!dock) return;
    var limit = dock.getBoundingClientRect().bottom + 14;
    var top = wrap.getBoundingClientRect().top;
    if (top < limit - 1) window.scrollBy({ top: top - limit, behavior: "instant" });
  }

  each(root.querySelectorAll("[data-dl-goto]"), function (btn) {
    btn.addEventListener("click", function () {
      if (selectors.view) selectors.view(parseInt(btn.getAttribute("data-dl-goto"), 10) || 0, false);
    });
  });
  if (window.location.hash === "#owed" && selectors.view) selectors.view(1, false);

  /* ---------- The wait checklist ---------- */
  (function () {
    var boxes = Array.prototype.slice.call(root.querySelectorAll(".dl-check input"));
    var flight = document.getElementById("dlFlight");
    var count = document.getElementById("dlWaitCount");
    var reset = document.getElementById("dlWaitReset");
    if (!boxes.length || !flight || !count) return;
    var KEY = "fe-delay-wait";
    var saved = [];
    try { saved = JSON.parse(window.localStorage.getItem(KEY)) || []; } catch (e) { saved = []; }
    boxes.forEach(function (box) { box.checked = saved.indexOf(box.getAttribute("data-k")) > -1; });

    function sync(store) {
      var done = boxes.filter(function (box) { return box.checked; });
      flight.style.setProperty("--p", done.length / boxes.length);
      flight.classList.toggle("is-done", done.length === boxes.length);
      count.textContent = done.length === boxes.length ? "All done. Now relax." : done.length + " of " + boxes.length + " done";
      if (reset) reset.hidden = done.length === 0;
      if (!store) return;
      try {
        window.localStorage.setItem(KEY, JSON.stringify(done.map(function (box) { return box.getAttribute("data-k"); })));
      } catch (e) {}
    }
    boxes.forEach(function (box) { box.addEventListener("change", function () { sync(true); }); });
    if (reset) reset.addEventListener("click", function () {
      boxes.forEach(function (box) { box.checked = false; });
      sync(true);
    });
    sync(false);
  })();
})();
