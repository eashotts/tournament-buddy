# Tournament Buddy

**Live prototype:** https://eashotts.github.io/tournament-buddy/

Tournament Buddy is an **independent, experimental disc golf travel-planning project**. It helps a player discover familiar competitors at an upcoming PDGA tournament and explore potential carpools and shared lodging.

It is **not operated or endorsed by PDGA**. PDGA player and tournament data are attributed to PDGA, with links to source player/event pages.

## Try the prototype

1. Enter a PDGA tournament URL, such as `https://www.pdga.com/tour/event/97743`.
2. Enter your PDGA player number.
3. Select **Find my buddies**. The app attempts to retrieve available PDGA Live standings and each player's historical results.
4. Explore the familiar-player list, shared event histories, filters, approximate hometown map, familiarity scores, and optional driving-corridor planner.
5. Use the lodging form to open external hotel or campsite searches.

**Important:** The app currently uses PDGA Live *standings*, **not a verified complete pre-event registration roster**. Before live scoring is published, some events may return no players or incomplete coverage. Historical-results requests may fail, be rate-limited, or be blocked by browser cross-origin restrictions. Missing histories are excluded rather than treated as nonmatches. The app does not claim to verify live travel plans, carpool availability, lodging prices, or reservations.

## Features

- Single-click tournament and historical participation comparison across divisions
- Player links to PDGA, shared event details, and event name lookups
- First ten familiar players initially, with **Load 10 more**
- Sort by approximate hometown proximity, shared tournaments, same-division events, recent overlaps, or a recency-weighted familiarity score
- Filter players and hometown map by state, city, and shared event
- Approximate city-center map using Leaflet, OpenStreetMap, and geocoding
- Optional driving-route corridor (25/50/100 miles) using an external routing service
- External hotel, cabin, and RV campsite discovery links

**Familiarity score:** 4 points for a shared tournament within the past year, 2 for one 1–3 years ago, 1 for an older or undated event, plus 2 points when both players competed in the same division. This is an informal comparison aid, not a PDGA metric.

**Privacy:** Public hometown city/state data are used only at approximate city-center granularity. No home addresses, direct messages, personal contact details, or user accounts are collected by this frontend.

## Technical overview

Static GitHub Pages application built with vanilla JavaScript. Main modules: `pdga-data.js` (live data adapters), `matching.js` (event matching), `results-ui.js` (familiar-player results), `map-ui.js` and `locations.js` (hometowns), `travel-ui.js` (route corridor), and `lodging-ui.js` (external lodging searches).

The browser attempts to call:
- PDGA Live event metadata and per-division standings endpoints
- PDGA historical member results endpoint
- Public geocoding and driving-route services

Browser access, response formats, and request limits must be confirmed with PDGA before relying on this as a production integration. No private PDGA documentation or API keys are included in the repository. Any future credentialed integration should use a secure backend, not client-side secrets.

## Developer review requested

Feedback is particularly welcome on:
- Whether PDGA Live standings are appropriate for discovering **upcoming registrants**, or whether there is an approved registration feed
- Historical results API schema, browser CORS behavior, pagination, and rate limits
- Appropriate PDGA logo/attribution usage
- Recommended caching and privacy safeguards before broader public release

This repository is a prototype and has not undergone comprehensive live browser or production security testing.
