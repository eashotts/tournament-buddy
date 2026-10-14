"use strict";
(function(){
const root=document.getElementById("player-map"),summary=document.getElementById("map-summary"),listing=document.getElementById("location-list"),buttons=document.getElementById("city-buttons"),tag=document.getElementById("map-source");
if(!root)return;
let map=null,markers=null;
function clear(){summary.textContent="Search an event to view hometown information.";listing.replaceChildren();buttons.replaceChildren();tag.textContent="AWAITING SEARCH";if(markers)markers.clearLayers();}
function update(players){clear();const grouped=BuddyLocations.group(players);tag.textContent="PDGA DATA";summary.textContent=grouped.locations.length+" cities · "+grouped.locations.reduce((n,g)=>n+g.count,0)+" players with hometowns · "+grouped.unknown+" unknown or undisclosed";
if(!grouped.locations.length){listing.textContent="No hometown data was supplied by PDGA for this event.";return;}
const note=document.createElement("p");note.className="meta";note.textContent="Locations below come from PDGA. Pins are not displayed until verified city-center coordinates are available.";listing.append(note);
for(const g of grouped.locations){const btn=document.createElement("button");btn.type="button";btn.className="city-option";btn.textContent=g.city+", "+g.state+" · "+g.count;btn.addEventListener("click",()=>{buttons.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");listing.replaceChildren();const title=document.createElement("h3");title.textContent=g.city+", "+g.state;listing.append(title);for(const p of g.players){const row=document.createElement("div");row.className="map-player";const label=document.createElement("span");label.textContent=p.name+" · "+p.division;row.append(label);if(/^\d+$/.test(p.pdgaNumber)){const a=document.createElement("a");a.href="https://www.pdga.com/player/"+p.pdgaNumber;a.textContent="#"+p.pdgaNumber+" ↗";a.target="_blank";a.rel="noopener noreferrer";row.append(a);}listing.append(row);}});buttons.append(btn);}
}
if(typeof L!=="undefined"){map=L.map(root,{scrollWheelZoom:false}).setView([38,-96],4);markers=L.layerGroup().addTo(map);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);setTimeout(()=>map.invalidateSize(),200);}else root.textContent="Map tiles unavailable.";
window.BuddyMapUI={update,clear};clear();
})();
