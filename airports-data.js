/* ============================================================
   Fly Easy — airport guide directory.
   The ONE place airports are listed. The globe pins, the search
   bar and the "All airport guides" list on airports.html are all
   built from this array, so adding a new guide = adding one entry.

   Fields:
     iata, icao   3- and 4-letter codes (both searchable)
     name, city   shown on the card and searchable
     region       small eyebrow text on the card
     lat, lon     decimal degrees (north / east positive)
     page         the guide page to open
     photo        card photo (path under images/)
     photoPos     optional CSS background-position for the photo
     blurb        one or two sentences, same voice as the guide page
     facts        2–3 short [label, value] pairs
   ============================================================ */
window.FLY_EASY_AIRPORTS = [
  {
    iata: "SFO",
    icao: "KSFO",
    name: "San Francisco International",
    city: "San Francisco",
    region: "California · USA",
    lat: 37.6213,
    lon: -122.3790,
    page: "sfo.html",
    photo: "images/kollen/kollen-sfo-intl-terminal-bay-view.jpg",
    photoPos: "center 40%",
    blurb: "SFO rewards travelers who know its layout. Start with your terminal, then browse what locals know.",
    facts: [["Terminals", "1, 2, 3 + Intl"], ["AirTrain", "Free, 24/7"]]
  },
  {
    iata: "SJC",
    icao: "KSJC",
    name: "San José Mineta International",
    city: "San José",
    region: "California · USA",
    lat: 37.3639,
    lon: -121.9289,
    page: "sjc.html",
    photo: "images/alaska-gates-dusk-aerial.jpg",
    photoPos: "center 55%",
    blurb: "Silicon Valley's airport is one connected building: 36 gates, under a mile end to end, no tram.",
    facts: [["Gates", "1–36"], ["Terminals", "A + B, 1 building"]]
  }
];

/* ============================================================
   Sharp "detail patches" for the globe. The base Earth image is
   ~10 km per pixel; a patch is ~0.9 km per pixel for one region,
   blended on top and only downloaded when someone zooms near it.
   Make one with tools/make_globe_patch.py (instructions inside).
   Airports outside every patch still work, just a little softer.
     bounds: [lonMin, latMin, lonMax, latMax] in degrees
   ============================================================ */
window.FLY_EASY_GLOBE_PATCHES = [
  { id: "bayarea", bounds: [-130, 30, -114, 44], day: "images/globe/patches/bayarea-day.jpg", night: "images/globe/patches/bayarea-night.jpg" }
];
