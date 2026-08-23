# Changelog

All notable changes to Fly Easy are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) — pre-1.0,
so a minor bump can still include larger changes as the site finds its shape.

## [Unreleased]

Nothing yet.

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
