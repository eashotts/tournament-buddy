"use strict";
(function(){const textarea=document.getElementById("roster-text"),status=document.getElementById("roster-status"),results=document.getElementById("roster-results");if(!textarea)return;
document.getElementById("clear-roster").addEventListener("click",()=>{textarea.value="";status.textContent="";results.replaceChildren();});
document.getElementById("import-roster").addEventListener("click",()=>{results.replaceChildren();const roster=BuddyRoster.parse(textarea.value);if(!roster.players.length){status.textContent="No valid rows found. Use: MA2, Player Name, 123456, registered";return;}
status.textContent=roster.registered+" registered · "+roster.waitlisted+" waitlisted · "+roster.invalid+" unrecognized rows. This is locally supplied data, not a live DGS feed.";
const heading=document.createElement("h3");heading.textContent="Imported registration preview";results.append(heading);
for(const p of roster.players){const row=document.createElement("div");row.className="map-player";const name=document.createElement("span");name.textContent=p.name+" · "+p.division+" · "+p.status;const a=document.createElement("a");a.textContent="PDGA #"+p.pdgaNumber+" ↗";a.href="https://www.pdga.com/player/"+p.pdgaNumber;a.target="_blank";a.rel="noopener noreferrer";row.append(name,a);results.append(row);}
});})();
