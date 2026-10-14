# Tournament Buddy

A free GitHub Pages frontend for discovering players at an upcoming PDGA tournament who have participated in the same historical events as you.

## Current status
- The matching engine in `matching.js` is **implemented** and independently testable.
- The website runs the engine against explicitly **fictional** `demo-data.js` records.
- The live search form validates PDGA URLs and player numbers but does **not** fetch live PDGA data or claim to produce real matches.
- Waiting for PDGA to confirm approved registration and player historical participation access.

## Matching engine contract
Call `TournamentBuddy.matchBuddies({playerId, registrants, historyByPlayer})`.

`registrants`: array of `{pdgaNumber, name, city, state, division}`.

`historyByPlayer`: object keyed by PDGA number, each value an array of `{eventId, name, date, division}`.

The result has `matches` sorted by descending shared event count and same-division count. Each match contains `sharedEvents` with `sameDivision` flags, plus `sharedCount` and `sameDivisionCount`. Event IDs are canonicalized to numeric strings. Duplicate entries for the same event are merged, retaining division evidence. A registrant with missing history is **skipped**, not counted as zero overlap; the result reports `skippedMissingHistory`.

## Test
`node tests/matching.test.js`

## Hosting and data
GitHub Pages serves static files; it cannot run Python or securely store API credentials. To go live, a separate authorized data integration and backend must retrieve upcoming registrants and historical participation, then supply normalized records to the matching engine. Do not put PDGA API keys in public JavaScript. The earlier Apps Script approach received 403 from PDGA pages.

## Player hometown map
The map uses Leaflet and OpenStreetMap tiles with clickable city-count markers. City selection expands a player list with divisions and PDGA links, and provides an Open in Google Maps link. The grouping engine in locations.js deduplicates player numbers and groups city/state/country. Demo city-center coordinates in demo-coordinates.js are approximate and fictional. Live registrant data and city geocoding remain pending. No player street addresses are displayed. Run node tests/locations.test.js for grouping tests.

## Registration roster workspace
The public app now supports manual, permission-based roster preview from pasted comma/tab-separated `Division, Name, PDGA number, Status` rows (optional city/state). The browser parses rows locally using `roster-import.js` and displays separate registered/waitlisted totals and PDGA links. It does **not** automatically fetch or scrape Disc Golf Scene, and the imported roster is not yet fed into the demo map or buddy matcher. This is an intermediate adapter awaiting an authorized feed. No contact details are imported.
