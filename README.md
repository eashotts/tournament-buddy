# Tournament Buddy

Responsive GitHub Pages preview for a disc golf tournament buddy checker.

## Status
This is a **visual preview**, not a live matching tool. The player cards are fictional. The form intentionally does not claim to return real matches because historical PDGA event participation cannot currently be retrieved through a verified authorized data provider. The earlier Google Apps Script prototype received HTTP 403 from PDGA player pages.

## Matching requirements
1. Accept a PDGA player number and upcoming event URL.
2. Obtain all upcoming event registrants from an authorized data source.
3. Obtain historical PDGA event IDs and divisions for the searching player and each registrant.
4. Match on historical event ID **across every division**.
5. Highlight shared events where divisions also match, without filtering by division.

## Hosting
GitHub Pages serves index.html, style.css, and app.js as static files. It does not run Python or provide a database/backend. A separate permitted data provider and server-side service are needed for live matching.
