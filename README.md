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
