# Changelog

All notable changes to Fly Easy are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) — pre-1.0,
so a minor bump can still include larger changes as the site finds its shape.

## [Unreleased]

Nothing yet.

## [0.2.0] - 2026-08-22

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

## [0.1.0] - 2026-08-20

Initial release: the original four-page site as first pushed to GitHub.

### Added

- Home, Global Tips, SFO Tips, and Timeblocker pages with the Window Seat
  design theme (scroll-driven sky, day/night transitions)
- AirTrain-style interactive SFO terminal/airline explorer
- Timeblocker: backward-planning tool that schedules the steps between
  home and boarding, with `.ics` calendar and printable PDF export
- Security-wait-time warning step in Timeblocker
- Support for up to 3 simultaneous activities per Timeblocker step
- 8 additional Timeblocker activity types, reordered to follow a travel
  day's actual shape
- "Suggest a tip" nav CTA and a dismissible survey-feedback toast
- Live SFO Terminal 3 construction notice
- Mobile bottom tab bar navigation (replacing the hamburger dropdown)
- No-cache local dev server for development

### Changed

- Corrected numerous airline/terminal facts across SFO content: terminal
  and boarding-area assignments for American, Delta, Hawaiian, Air Canada,
  Breeze, WestJet, and Aer Lingus; Southwest's retired boarding process and
  new checked-bag fee; Mustards' closing time; a stale museum exhibit
  date; CDC in-flight air-circulation guidance
- Replaced an inaccessible "Terminal G art" tip with a verified
  walking-time note for Boarding Area G
- Redrew the AirTrain map with a dedicated mobile track so it no longer
  stretches on phones
- Reworked mobile Timeblocker step cards: step name takes priority over
  time, warning callout spans the full card width

### Fixed

- Timeblocker step notes (security warning, transit hint) no longer lost
  on save/reload
- Sidebar category-heading contrast bug in night mode (inline styles were
  defeating the CSS override)
- SFO Explorer/Airline Searcher toggle buttons wrapping unevenly on mobile
- Survey toast covering the homepage hero's CTA buttons on mobile
- Removed dead Google Calendar stepper code left over from an earlier
  removal

[Unreleased]: https://github.com/Dpixl16/Fly-Easy/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Dpixl16/Fly-Easy/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Dpixl16/Fly-Easy/releases/tag/v0.1.0
