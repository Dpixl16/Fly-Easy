# Graph Report - Claude Fly Easy Website  (2026-08-22)

## Corpus Check
- Large corpus: 60 files · ~631,483 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 268 nodes · 382 edges · 51 communities (25 shown, 26 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.82)
- Token cost: 1,651,288 input · 0 output

## Community Hubs (Navigation)
- Timeblocker Plan Logic
- Site Interactions & Motion
- Packer Bag Builder Logic
- Site Pages & Features
- Time Picker Popover
- Frontend Design Skill
- JAL Golden-Hour Aviation
- United Airlines at SFO
- Emirates & Red Wings Takeoff
- Fly Easy Brand Mark
- Air France at LAX Sunset
- Garuda Volcano Takeoff
- Overcast Gate Boarding
- City Landing Approach
- Golden-Hour Boarding Scene
- Control Tower Sunset
- Fly Easy Brand Logo
- Flight Phase Tracker
- ITA Airways at Gate
- Flight Info Display Board
- Don't-Be-Late Punctuality Imagery
- Virgin Atlantic Climbout
- Sunset Landing Hero Imagery
- Dev Server (Python)
- Above-the-Clouds Aerial View
- Narita JAL Tarmac
- Cloud Window View
- Wing, Clouds & Ground View
- Night Terminal Wide Shot
- Runway Sunset Takeoff
- Sky & Clouds Landscape
- Vertical Sky & Clouds
- ITA A220 Dusk Takeoff
- Wing & City Lights Dusk
- Sunset Above the Clouds
- Pink Dusk Clouds
- Sunset Boarding Photo
- Ocean Horizon Sunset
- Hand with Passports
- Plane Overhead Blue Sky
- Golden Gate Bridge Photo
- Teal Suitcase Terminal
- Golden Sunset Sky
- Golden-Hour Apron Takeoff
- Emirates A380 Overcast Takeoff
- Twilight Gate Portrait
- United 777 Above Clouds
- United 767 Pushback
- Vietnam Airlines City Takeoff
- Wing Over Ocean
- Wing at Dark Dawn

## God Nodes (most connected - your core abstractions)
1. `runTimeblocker()` - 43 edges
2. `runPackerAssistant()` - 22 edges
3. `buildTimePicker()` - 13 edges
4. `push()` - 13 edges
5. `render()` - 13 edges
6. `render()` - 10 edges
7. `boardingMin()` - 9 edges
8. `renderBagPanels()` - 9 edges
9. `renderChecklist()` - 9 edges
10. `Frontend Design Skill` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Fly Easy Flight Day Plan (Sample PDF Export, July 19 2026)` --shares_data_with--> `Timeblocker Feature Preview Card (Homepage)`  [INFERRED]
  Claude.pdf → index.html
- `Fly Easy Flight Day Plan (Sample PDF Export, July 19 2026)` --shares_data_with--> `Timeblocker Print / Save PDF Export`  [INFERRED]
  Claude.pdf → timeblocker.html
- `Timeblocker Feature Preview Card (Homepage)` --shares_data_with--> `Timeblocker Timeline Builder (Leave-Home-By Calculator)`  [INFERRED]
  index.html → timeblocker.html
- `Global Tips Page (global.html)` --references--> `Fly Easy Home Page (index.html)`  [EXTRACTED]
  global.html → index.html
- `Fly Easy Home Page (index.html)` --references--> `SFO Tips Page (sfo.html)`  [EXTRACTED]
  index.html → sfo.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared Site Navigation, Mobile Tabbar & Footer Chrome** — index_home_page, global_global_tips_page, sfo_sfo_tips_page, timeblocker_timeblocker_page, packer_packer_assistant_page [EXTRACTED 1.00]
- **TSA Carry-On Compliance Flow (bag builder + rules panel + official source)** — packer_bag_builder, packer_tsa_basics_panel, packer_tsa_gov_citation [INFERRED 0.85]
- **Timeblocker Plan Generation & Export Flow** — timeblocker_timeline_tool, timeblocker_print_export_feature, claude_flight_day_plan_export, index_timeblocker_feature_preview [INFERRED 0.85]

## Communities (51 total, 26 thin omitted)

### Community 0 - "Timeblocker Plan Logic"
Cohesion: 0.10
Nodes (39): runTimeblocker(), boardingMin(), boardingRawMin(), buildICS(), addEvent(), buildPrintSheet(), buildShareURL(), canPairWith() (+31 more)

### Community 1 - "Site Interactions & Motion"
Cohesion: 0.10
Nodes (28): activeConfigKey(), armIdle(), buildRoute(), driveTo(), phaseDrive(), phaseSpurOut(), easeInOut(), frame() (+20 more)

### Community 2 - "Packer Bag Builder Logic"
Cohesion: 0.20
Nodes (21): runPackerAssistant(), activeBag(), addCustomToBag(), addEssentialFromInput(), bagLabel(), buildItemRow(), buildPrintSheet(), buildSuggestionPool() (+13 more)

### Community 3 - "Site Pages & Features"
Cohesion: 0.18
Nodes (17): Fly Easy Flight Day Plan (Sample PDF Export, July 19 2026), Flight Phase Tracker (Pre-Departure / Departure / In-Flight / Arrival), Global Tips Page (global.html), Fly Easy Home Page (index.html), Timeblocker Feature Preview Card (Homepage), Packer Bag Builder (Carry-on, Personal Item, Checked, Sports), Packer Essentials Checklist, Packer Assistant Page (packer.html) (+9 more)

### Community 4 - "Time Picker Popover"
Cohesion: 0.35
Nodes (10): buildTimePicker(), clampPopoverPosition(), closePopover(), currentParts(), highlightSelection(), onDocClick(), onKeydown(), openPopover() (+2 more)

### Community 5 - "Frontend Design Skill"
Cohesion: 0.24
Nodes (10): Apache License 2.0, AI-Generated Design Clichés (Three Default Looks), Frontend Design Skill, Hero as Thesis, Leverage Motion Deliberately, Restraint and Self-Critique, Structure Is Information, Two-Pass Design Process (Brainstorm, Plan, Critique, Build, Critique Again) (+2 more)

### Community 6 - "JAL Golden-Hour Aviation"
Cohesion: 0.24
Nodes (10): Air Travel / Flight Booking Hero Imagery, Airport Ground Operations (Cargo, Catering, Tow), Airport Twilight/Sunset Atmosphere, Golden Hour Airport Photography, Japan Airlines (JAL), Narita International Airport, Turkish Airlines Aircraft at Gate, JAL Gates Golden Hour (+2 more)

### Community 7 - "United Airlines at SFO"
Cohesion: 0.28
Nodes (9): Airport Gate / Tarmac, San Francisco International Airport (SFO), San Francisco Skyline (Salesforce Tower), Sunrise Travel Imagery, United Airlines, Gate Sunrise United, United Airlines Jet at SFO Gate G1, SFO Terminal Sign at Night (+1 more)

### Community 8 - "Emirates & Red Wings Takeoff"
Cohesion: 0.33
Nodes (7): Aircraft Takeoff, Boeing 777-200LR Aircraft, Cloudy Sky Atmosphere, Emirates Airline, Red Wings Airlines, Emirates Boeing 777 Takeoff, Takeoff Cloudy Sky

### Community 9 - "Fly Easy Brand Mark"
Cohesion: 0.48
Nodes (7): Ascending Jet Icon Motif, Cloud Cluster Motif, Flight Path / Orbit Arc Motif, Fly Easy Brand, Sky Blue Color Palette, Tagline: Calm Skies, Easy Travel, Fly Easy Logo - Ascending Jet Orbit

### Community 10 - "Air France at LAX Sunset"
Cohesion: 0.40
Nodes (5): Air France Aircraft Livery, Los Angeles International Airport (LAX), Sunset Aviation Photography, Wide-body 'Heavy' Aircraft, Runway Sunset with Heavy Jets

### Community 11 - "Garuda Volcano Takeoff"
Cohesion: 0.60
Nodes (5): Airbus A330 Widebody Aircraft, Aircraft Takeoff Scene, Garuda Indonesia (Airline), Volcano Landscape Scenery, Garuda Volcano Takeoff Photo

### Community 12 - "Overcast Gate Boarding"
Cohesion: 0.50
Nodes (5): Airport Boarding Gate, Commercial Aircraft, Air Travel Experience, Overcast Weather Conditions, Gate Overcast (Airplane at Jet Bridge)

### Community 13 - "City Landing Approach"
Cohesion: 0.50
Nodes (4): Air Travel / Flying, Airport Landing/Takeoff Scene, Urban City Skyline Backdrop, Landing City Day (Airplane Landing Over City)

### Community 14 - "Golden-Hour Boarding Scene"
Cohesion: 0.50
Nodes (4): Airport Boarding Experience, Fly Easy Website Hero/Marketing Imagery, Golden Hour Travel Photography Style, Boarding at Golden Hour (Airport Tarmac Photo)

### Community 15 - "Control Tower Sunset"
Cohesion: 0.50
Nodes (4): Airport Control Tower, Aviation Sunset Atmosphere, Parked Aircraft Fleet, Airport Control Tower at Sunset

### Community 16 - "Fly Easy Brand Logo"
Cohesion: 1.00
Nodes (4): Stylized Airplane Glyph, Fly Easy Brand Identity, Dual Flight-Path Swoosh, Fly Easy Brand Mark (SVG)

### Community 17 - "Flight Phase Tracker"
Cohesion: 0.83
Nodes (4): runFlightTracker(), revealPanel(), setPhase(), showPanel()

### Community 18 - "ITA Airways at Gate"
Cohesion: 0.67
Nodes (3): Airport Gate Boarding Scene, ITA Airways (Star Alliance member), ITA Airways Aircraft at Gate

### Community 19 - "Flight Info Display Board"
Cohesion: 0.67
Nodes (3): Airport Terminal Environment, Flight Information Display System (FIDS), Airport Departure Board Photo

### Community 20 - "Don't-Be-Late Punctuality Imagery"
Cohesion: 0.67
Nodes (3): Airport Arrival Timeliness (Flying/Travel Context), Punctuality / Urgency Messaging, Don't Be Late Scrabble Tiles with Alarm Clock

### Community 21 - "Virgin Atlantic Climbout"
Cohesion: 0.67
Nodes (3): Boeing 787-9 Dreamliner Aircraft, Virgin Atlantic Airline, Virgin Atlantic Boeing 787-9 Climbout Photo

### Community 22 - "Sunset Landing Hero Imagery"
Cohesion: 0.67
Nodes (3): Flight Landing / Air Travel, Website Hero/Landing Imagery, Landing City Sunset (Airplane Approach Photo)

### Community 24 - "Above-the-Clouds Aerial View"
Cohesion: 0.67
Nodes (3): Above the Clouds (image), Aerial Cloudscape View from Aircraft Window, Flight/Travel Visual Theme

### Community 25 - "Narita JAL Tarmac"
Cohesion: 0.67
Nodes (3): Narita JAL Tarmac Photo, Japan Airlines (JAL), Narita International Airport

## Knowledge Gaps
- **82 isolated node(s):** `Apache License 2.0`, `Flight Phase Tracker (Pre-Departure / Departure / In-Flight / Arrival)`, `SFO Explorer Terminal Map View`, `Airline Searcher View`, `Packer Essentials Checklist` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `runTimeblocker()` connect `Timeblocker Plan Logic` to `Site Interactions & Motion`, `Packer Bag Builder Logic`, `Time Picker Popover`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `runPackerAssistant()` connect `Packer Bag Builder Logic` to `Site Interactions & Motion`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `buildTimePicker()` connect `Time Picker Popover` to `Timeblocker Plan Logic`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `runTimeblocker()` (e.g. with `fail()` and `ok()`) actually correct?**
  _`runTimeblocker()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Apache License 2.0`, `Flight Phase Tracker (Pre-Departure / Departure / In-Flight / Arrival)`, `SFO Explorer Terminal Map View` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Timeblocker Plan Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.10104529616724739 - nodes in this community are weakly interconnected._
- **Should `Site Interactions & Motion` be split into smaller, more focused modules?**
  _Cohesion score 0.09682539682539683 - nodes in this community are weakly interconnected._