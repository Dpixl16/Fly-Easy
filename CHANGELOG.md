# Changelog

All notable changes to Fly Easy are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) — pre-1.0,
so a minor bump can still include larger changes as the site finds its shape.

## [Unreleased]

### Changed

- **About page reorganized into Who · What · Why · How · Contact**
  (same order in the pinned bar and the nav's About ▾ menu):
  - Who: Kollen's intro plus a strip of five of his photos (replaces
    the separate Gallery section).
  - What: the problem — airport stress (replaces "The problem").
  - Why: favorite quote plus why Fly Easy exists (the beauty of
    aviation; air travel as a relaxing start to a vacation).
  - How: the four tools/guides and how every tip is checked, combined.
  - Page is ~8% shorter on desktop (4,462 → 4,120px).
  - Copy refresh: Who now covers Kollen's yearly flights to Hong Kong,
    SFO as his home airport and planespotting at the SFO Marriott
    Waterfront over runway 28L; What reframed as "best-kept secrets"
    travelers never hear; Contact renamed "Contact me!".
  - "How the tips are made" is now four steps (2×2 grid, one column on
    phones) with an honest "to the best of my ability" note: Researched;
    Reviewed by people who know (aviation professionals such as
    Mr. Strange, who worked with Alaska Airlines at SFO); Kept current;
    and Shaped by the community, with a "Contact me" button. The note
    now stresses that airports change and tips can go out of date.
  - Section "flights": clicking Who / What / Why / How / Contact me
    (pinned bar, nav menu, or in-page links) glides to the section with
    an eased scroll, a small plane taxis along the pinned bar to the new
    tab, and the section "lands" with a runway-light sweep on its label.
    Touch/wheel/keys cancel the glide instantly; reduced-motion users
    jump straight there; a safety timer guarantees the jump completes
    even if animation frames are paused.

### Added

- **Home-screen web app + offline.** Fly Easy can be added to an iPhone or
  Android home screen (Safari: Share → Add to Home Screen) and opens full
  screen like an app.
  - `manifest.webmanifest` (name, colors, standalone display, Android
    long-press shortcuts to Airports / Global Tips / Time Blocker / Packer).
  - App icon: the Fly Easy mark on a soft sky gradient with the logo's
    clouds (`tools/app-icon.svg`, rebuilt into `images/app/` with
    `sh tools/make_app_icons.sh`). Fits Android's "maskable" safe zone.
  - Head tags on all 7 pages: manifest, apple-touch-icon, theme color,
    app title, translucent status bar.
  - Notch / home-bar spacing: the nav grows by the status-bar height and
    gets a soft navy wash in app mode so the clock stays readable; side
    insets keep landscape content clear of the notch; the sticky offsets
    (scroll padding, globe stage, SJC board) include the inset.
  - `sw.js` service worker: all 7 pages plus their CSS/JS are saved on
    the first visit, so the tips open with no signal. Pages load fresh
    when online; CSS/JS/photos show the saved copy and refresh behind it;
    photos are saved as they're viewed (big globe textures are skipped).
    Off on localhost unless a page is opened with `?sw=1` (`?sw=0` turns
    it off and clears it), so it never serves stale files while editing.

- **Airports globe (`airports.html`)**: one page that leads to every airport
  guide. It shows a 3D Earth (Three.js 0.160 from jsDelivr) with NASA Blue
  Marble / Black Marble imagery, lit by the real current position of the sun,
  so city lights glow on the night side. Pick an airport from the search bar
  (IATA, ICAO, name or city; arrow keys, Enter, `/` to focus) or from a pin.
  The camera then arcs over the planet to a region view, and an airport card
  opens. "Open guide" dives in and hands off to the plane page-transition.
  - Airports live in one file, `airports-data.js`; pins, search and the
    "All airport guides" list are all built from it.
  - Pins that are close together (SFO and SJC) flip their labels left and
    right, and merge into one "SFO · SJC" cluster pin only when they'd
    overlap. Tapping the cluster zooms in until they split.
  - Deep links: `airports.html#sfo` and `#sjc`.
  - Frames are only drawn while something moves, and drawing pauses while the
    globe is off-screen. Textures load as a tiny 512px preview first, then 4K
    (2K on low-memory devices).
  - Reduced motion: no idle spin, and fly-to jumps instantly. Without WebGL
    (or if Three.js fails to load) the page shows a search bar plus the guide
    list.
  - Textures are in `images/globe/` (NASA imagery, public domain, credited in
    the page footer).
- **SJC Tips: Terminal A and Terminal B cards rebuilt** (`sjc-terminal.js`).
  Each terminal is now an illustrated, zoomable schematic: planes at their
  gates, the concourse, and the curb → ticketing → security path, drawn in
  the same circuit-board style as the board above.
  - **The walk**: seven stops per terminal. The camera glides to each one
    while a signal runs the copper trace; swipe, arrow keys or the numbered
    pins move between stops.
  - **What's near my gate?**: pick a gate (or tap a plane) to see the nearest
    water refill, restrooms, Power Suite, nursing room, ATM and the lounge,
    counted in gates.
  - **Show me**: light up one kind of amenity across the map.
  - Drag to pan, +/− to zoom; phones get a closer camera rather than a
    different layout. Reduced motion skips the camera glides.
  - Facts re-checked against flysanjose.com on Nov 10, 2026. Added: either
    checkpoint works with carry-on only, CLEAR hours, PreCheck Touchless ID,
    Power Suites (Gates 9, 18, 28), The Club's hours and $60 day pass,
    Terminal B water refills (Gates 17, 24, 32), Uber/Lyft stop numbers.
    Removed the Asian Box / Bad Egg note (couldn't be confirmed).
- **Airports globe, round 2**
  - **Sharp regional imagery**: a Bay Area "detail patch" cut from NASA's
    500 m Blue Marble and Black Marble 2016 tiles, about 18× sharper than the
    base globe. It's blended in with feathered edges, downloaded only when you
    zoom near it, and fades out again as you pull back to space. Picked
    airports inside a patch arrive a little lower (and can zoom closer).
    `tools/make_globe_patch.py` cuts patches for new airports (uses macOS
    `sips`; the big NASA source tiles stay out of the repo).
  - **Opening a guide is obvious**: the selected pin grows a glowing
    "Open guide →" segment, and clicking it (or anywhere on the card) dives
    into the guide. On phones and near screen edges the pin stays compact so
    labels never run off-screen.
  - **"Back to space"** pill under the search whenever you're zoomed in (Esc
    works too).
  - **Scrolling**: the wheel zooms the globe; once it's fully zoomed out,
    scrolling down continues the page to "All airport guides". "All guides"
    glides there with an eased scroll. The globe parallaxes and fades as you
    leave, and the guide cards drift in.
  - **Back to globe from a guide**: SFO and SJC get a floating mini Earth
    (a tiny NASA Earth turning inside the button; hover shows "Back to
    globe"). Clicking it opens a field of space from the button while the
    page sinks back, then `airports.html?rise=sfo` starts just above that
    airport and climbs to the whole Earth. The "← All airports" pill uses the
    same return.
- **Nav: "SFO Tips" and "SJC Tips" replaced by a single "Airports" link** in
  the top nav, the mobile tab bar (new pin icon) and the footer on every page.
  Airport guides mark Airports as current and get an "← All airports" link
  back to the globe.
- **Global Tips: accuracy and responsive pass** — check-in copy now says most
  airlines open at 24 hours and some international ones at 48; the Japan
  tip is worded as the Visit Japan Web QR "lets you do immigration and
  customs steps online"; the layover chart notes the numbers are rules of
  thumb; removed the "One more thing" photo band at the bottom; the hero's
  "Pre-Departure." no longer splits at the hyphen on phones; fixed a
  clipped "90+ min" bar label, overflowing name-match cards and the mock
  phone on narrow screens.
- **Global Tips: Pre-Departure redesigned** with the same numbered-section
  look as Booking, and "Pack it" removed (the Packer tool covers packing):
  "01 Check in" (check in 24 hours early, plus a
  name-matches-your-ID comparison), "02 Be prepared for the flight" (check your flight
  in the airline app, shown as a mock phone screen with delay / gate-change
  tags; plan your ride to the airport; "Get your phone flight-ready" as a
  lock-screen of notification cards for boarding pass, arrival forms,
  charging and downloads). The section is titled "Be prepared for the
  flight". Baggage-rules and power-bank tips were removed because the
  Packer already covers them; the tab now ends with an "Open the Packer"
  card linking to packer.html.
- **Global Tips: new "Booking" phase** — a fifth tab (now the first stop on
  the plane tracker, berry accent) for what happens before the airport,
  with Kollen's Singapore A350 sunset photo as the cover and the headline
  "Book smart."
  - Two numbered sections, each with its own format instead of a repeating
    tip list. "01 Book it": a photo band ("Arrive a day early"), a
    boarding-pass callout ("Book directly with the airline"), and a
    nonstop-vs-connection route comparison leading into an animated
    "How long should a layover be?" meter (90+ min domestic, 2.5–3 hrs
    international, 4+ hrs on separate tickets). "02 Stay covered": two
    tiles (airline app + Flighty / FlightAware / Flightradar24; credit
    card travel protections) and a photo band for entry requirements.
  - "Research entry requirements early" moved here from Pre-Departure.
  - Hero now reads "five phases"; plane positions re-spaced for five stops.

- **About page v3: section navigation and Kollen's own photos**
  - "About ▾" dropdown in the top nav on every page (hover on desktop,
    tap the caret on touch, full keyboard support, inline in the
    hamburger menu) linking to each About section.
  - Pinned section bar on the About page (Problem · Why · Who · What ·
    How · Gallery · Contact) with scroll-spy highlighting; scrolls
    sideways with an edge fade on phones.
  - New "The problem" and "From my camera roll" gallery sections;
    sections are now content-height instead of full-screen.
  - `images/kollen/`: 41 of Kollen's photos renamed
    `kollen-<place>-<subject>.jpg`, resized for the web, with camera,
    date and location metadata stripped. Originals kept in the
    git-ignored `images/kollen/_originals/`; index in
    `images/kollen/README.md`.
  - Kollen's photos replace stock on the About page, the Global Tips
    hero, phase covers and photo band, the SFO postcards and the
    Timeblocker card. Each carries a "Photo by Kollen · <place>" credit.
    Footer credit now reads "Photography by Kollen, with a few from
    Unsplash & Pexels."
- **About page (replaces Home)**: `index.html` is now "About Fly Easy",
  designed as a photo essay. Every section is a full-bleed photograph
  with text set directly on it, with a gentle parallax on desktop and no
  cards:
  - Hero with a flight-manifest style detail row (Created by Kollen ·
    Junipero Serra HS · Class of 2028 · Home airport SFO).
  - "About me" written in Kollen's own voice, as a split section with a
    photo that fades into the text side; "My favorite quote" over a night
    takeoff; and a five-photo mosaic.
  - "How the tips are made" (Researched / Verified / Kept current).
  - Edge-to-edge photo panels linking all four tools, and a Contact
    section styled as "Contact the tower", split with a control-tower photo.
  - Nine new photos (Singapore A350 at SFO, United 777 takeoff, Starlux
    A350 at night, Vietnam A350 on approach, Qatar A380, Southwest
    wingtips, Istanbul tower, Alaska gates at dusk, United tails at SFO)
    renamed descriptively and resized for the web (~300–530 KB each).
    The full-size originals are kept in `images/_originals/`, which git
    ignores.
  - Contact offers the Google Form plus an "Email Kollen" button. The
    address is assembled in `script.js` only when the button is used, so
    it never appears as text or a plain `mailto:` in the page source.
  - "Home" is renamed "About" in the top nav, mobile tab bar (new person
    icon, which the icon-only nav tier picks up automatically), and
    footer on every page.
- **SFO Tips: Parking stop** — a new AirTrain-map stop covering Long-Term,
  Short-Term, Valet (Grand Hyatt), and Off-Airport parking. Positioned
  directly under Transportation and connected by the AirTrain line, so the
  map stays symmetric, with a warning that parking can get expensive on
  longer trips and a nudge to compare against other transportation.
  - No prices are listed — official rates couldn't be confirmed from an
    authoritative source, so every category points to flysfo.com/parking
    instead of guessing.
- **SFO Tips: Transportation warning** — a reminder at the top of the
  Transportation stop to double-check travel time to SFO (traffic, BART
  schedules, commute congestion) rather than trusting a flat estimate.
- **Global Tips: name/ID check-in tip** — the "Check in 24 hours early"
  card now also calls out double-checking that your name matches your ID,
  since a typo can mean delays, fees, or denied boarding.
- Terminal-explorer and phase-card tips can now show an optional
  highlighted warning banner (title + text), reusing the existing
  `.airline-warning` styling — powers the new SFO warnings above plus the
  "ask airport staff nicely" Global Tips card.

### Fixed

- Phone pass over every page (320 / 375 / 390 / 430 / 768 wide):
  - Global Tips: the five-stop phase tracker was 4px wider than a 375px
    phone, so the whole page could be dragged sideways. Stops now share
    the width and "Pre-Departure" wraps at its hyphen.
  - Dusk/night nav was only 50% opaque, so its white text washed out
    over white cards; now 80%.
  - White text on the evening sky (Timeblocker's "Add an activity" hint,
    tracker labels, etc.) gets a soft halo so passing clouds can't hide it.
  - iPhone Safari zoomed the page in when tapping a text field under
    16px (Packer's item names) and stayed zoomed; iOS now skips that
    automatic zoom (pinch-zoom still works).
  - The floating "Back to globe" Earth on SFO/SJC sat on top of text
    while reading; on phones it tucks away while scrolling down and
    returns on scroll-up or at the end of the page, where the footer
    now leaves room for it.
  - SJC terminal map label wrapped to three lines and crowded the zoom
    buttons; it's one line ("Terminal A · 1–16") on phones.
  - The phone tab bar replayed its rise-in and slid with the page on
    every navigation. The nav and tab bar now stay put during page
    changes (own view-transition layers) and only animate on the first
    page of a visit.

- About section navigation, found in a full desktop / iPad / phone pass:
  - Jumping in from another page (e.g. About ▾ → How) could land ~26px
    short because positions were measured while `<main>`'s entrance
    slide was still running; scroll targets now use layout offsets.
  - The pinned bar could keep the previous tab highlighted after a
    glide, and on 320px phones the active tab could stay scrolled out
    of view; both are re-checked when a glide lands (and update
    directly in background tabs, where animation frames pause).
  - Closing the About ▾ menu now also clears keyboard focus from its
    items, so it can't linger open via :focus-within.
- Leaving the About page for Global Tips could crash the tab on
  memory-limited devices. Removed `background-attachment: fixed` from the
  About photo sections (full-image repaints on every scroll, a known
  iPad Safari crash trigger), resized Kollen's web photos from 2000px to
  1600px (14.6 MB → 9.3 MB, ~36% less decoded memory each), and skip the
  cross-document view-transition snapshot when leaving About.
- About ▾ dropdown was white-on-white once the sky turned dusk/night;
  it now switches to a dark panel.
- Phone: survey toast covered the bottom tab bar; now sits above it.
- Phone: Global Tips phase covers clipped long titles at a fixed 190px.
- 320px phones: Timeblocker duration sliders pushed the page 9px wide.
- Packer: climate picker poked past its card on narrow phones; the
  hidden "Cleared for departure" badge squeezed the progress text.
- Footer text was unreadable on short pages (Packer) where it landed on
  the pale dawn sky; it now has its own dark backing.
- Nav width-measuring clone duplicated element IDs.
- Silenced harmless "Transition was skipped" console errors from
  cross-page view transitions.
- Top nav "ALT 00,000 FT" readout was injected as a third top-level flex
  child of the nav row, breaking its `space-between` layout and stranding
  the "Suggest a tip" button + hamburger toggle off-center. Now grouped
  with them so the row stays a clean two-sided layout at every width.

### Changed

- Top nav collapse is now adaptive instead of a fixed `1024px` breakpoint:
  it measures actual rendered content width and only shrinks when the full
  text nav genuinely doesn't fit — recovering a ~64–200px dead zone where
  iPads and small laptops were being force-collapsed with room to spare.
- Added a new icon-only nav tier (reusing the bottom mobile-tab-bar icons)
  as a mid-step between the full text nav and the hamburger dropdown, so
  narrower screens keep one-tap access to every page instead of jumping
  straight to a hidden menu.
- **Global Tips: Check-in moved to Pre-Departure** — "Check in 24 hours
  early" now leads the Pre-Departure phase instead of Departure, since
  that's when it's actually actionable.
- **Global Tips: Departure reordered** — with check-in moved out, the
  2-hour/3-hour arrival-time rule is now the first thing shown on
  Departure, and a new "ask airport staff — they're there to help, just
  ask nicely" tip was added below it.

## [0.5.0] - 2026-08-22

### Added

- **Packer Assistant** (`/packer.html`) — suggests what to pack, organized by
  bag, tuned to trip length and climate, and checked against TSA carry-on
  rules
  - 4-step guided wizard (Trip → Essentials → Bags → Review), every step
    reachable at any time via a clickable step tracker
  - Essentials: a flat, always-with-you checklist tracked by its own
    progress "runway," separate from any bag
  - Bags: 5 types (carry-on backpack, personal item, carry-on luggage,
    checked bag, sports/ski bag), each with its own color-themed tab;
    suggestions sized to trip length and climate, filtered to where TSA
    actually allows them
  - Quick-add search (type to filter, Enter adds the top match or your own
    free text), a curated "Popular for this bag" row, and a "Browse all
    suggestions" toggle for the full categorized pool
  - Contextual TSA badges on individual items (liquids, batteries, blades)
    plus a simplified, always-available TSA basics reference
  - Review step: live progress summary, each row expandable into a
    check-off-only view of its items
  - Redesigned printable list: trip length/climate in the header, bag type
    labeled next to any custom name, items grouped by category, and a
    2-column layout to cut down on page count
  - localStorage persistence (trip, essentials, every bag and its items,
    current step) with defensive validation on restore
- Nav, footer, mobile tab bar, and the home page promo card now link to
  the Packer page site-wide

### Fixed

- Local dev server no longer fails when a port is already taken by another
  session — falls back to `$PORT`/`autoPort` instead of a hardcoded port

## [0.4.0] - 2026-08-20

### Added

- Mobile bottom tab bar navigation (replacing the hamburger dropdown);
  the top bar keeps the brand and the "Suggest a tip" CTA, page links
  live in the tab bar
- "Suggest a tip" link added to the footer nav on every page, so it stays
  reachable once the survey toast has been dismissed
- No-cache local dev server for development

### Changed

- Redrew the AirTrain map with a dedicated mobile track so it no longer
  stretches on phones
- Corrected further airline/terminal facts: Southwest's move to Terminal 2
  and its new checked-bag fee, Aer Lingus's move to Terminal 1, Mustards'
  actual closing time, a stale museum exhibit end date, and the CDC's
  actual in-flight circulation guidance

### Fixed

- SFO Explorer/Airline Searcher toggle buttons wrapping unevenly on mobile
- Footer nav links overflowing/clipping symmetrically on mobile after a
  6th link was added — now wraps onto a second row instead

## [0.3.0] - 2026-07-21

### Added

- "Suggest a tip" nav CTA and a dismissible bottom-right survey toast
  linking to the feedback form
- Live SFO Terminal 3 construction notice

### Changed

- Corrected airline/terminal assignments (American, Delta, and Hawaiian
  moved to Terminal 1; Air Canada, Breeze, and WestJet moved to Terminal 2)
  and fixed Southwest's tip, which described a boarding process the
  airline had already retired
- Corrected SFO terminal-tip data to match (boarding areas, carrier chips,
  gate numbers) and fixed a rideshare pickup-vs-drop-off tip
- Replaced a "Terminal G art" tip pointing at a restricted-access space
  with a verified walking-time note for Boarding Area G

### Fixed

- Survey toast covering the homepage hero's CTA buttons on mobile

## [0.2.0] - 2026-07-20

### Added

- Security-wait-time warning step in Timeblocker
- Printable PDF export for Timeblocker itineraries
- Support for up to 3 simultaneous activities per Timeblocker step,
  with calendar (`.ics`) and PDF export updated to include every one
- 8 additional Timeblocker activity types (parking, curbside drop-off,
  passport control, printing, currency exchange, sit-down meal,
  stretch/walk, music), reordered to follow a travel day's actual shape

### Fixed

- Timeblocker step notes (security warning, transit hint) no longer lost
  on save/reload
- Sidebar category-heading contrast bug in night mode (inline styles were
  defeating the CSS override); "Relax & explore" given its own distinct
  color so it no longer reads the same as "Food & drink"
- Removed dead Google Calendar stepper code left over from an earlier
  removal

## [0.1.0] - 2026-07-19

Initial release: the original site as first built.

### Added

- Home, Global Tips, SFO Tips, and Timeblocker pages with the Window Seat
  design theme (scroll-driven sky, day/night transitions)
- AirTrain-style interactive SFO terminal/airline explorer
- Timeblocker: backward-planning tool that schedules the steps between
  home and boarding, with `.ics` calendar export

[Unreleased]: https://github.com/Dpixl16/Fly-Easy/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/Dpixl16/Fly-Easy/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Dpixl16/Fly-Easy/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Dpixl16/Fly-Easy/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Dpixl16/Fly-Easy/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Dpixl16/Fly-Easy/releases/tag/v0.1.0
