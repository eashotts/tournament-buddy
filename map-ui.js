"use strict";
(function(){
const root=document.getElementById("player-map");if(!root)return;
const grouped=BuddyLocations.group(window.BUDDY_DEMO.registrants);
const summary=document.getElementById("map-summary"),listing=document.getElementById("location-list");
summary.textContent=grouped.locations.length+" cities · "+grouped.locations.reduce((n,g)=>n+g.count,0)+" players with locations"+(grouped.unknown?" · "+grouped.unknown+" unknown":"");
function key(g){return g.city.toLocaleLowerCase("en-US")+"|"+g.state+"|"+g.country;}
function googleLink(g){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(g.city+", "+g.state+", "+g.country);}
function locationPanel(g){const wrapper=document.createElement("div");wrapper.className="map-players";const heading=document.createElement("h3");heading.textContent=g.city+", "+g.state+" · "+g.count+" player"+(g.count===1?"":"s");wrapper.append(heading);
for(const p of g.players){const row=document.createElement("div");row.className="map-player";const label=document.createElement("span");label.textContent=p.name+" · "+p.division;row.append(label);if(/^\d+$/.test(p.pdgaNumber)){const link=document.createElement("a");link.href="https://www.pdga.com/player/"+p.pdgaNumber;link.target="_blank";link.rel="noopener noreferrer";link.textContent="#"+p.pdgaNumber+" ↗";row.append(link);}wrapper.append(row);}
const maps=document.createElement("a");maps.href=googleLink(g);maps.target="_blank";maps.rel="noopener noreferrer";maps.textContent="Open city in Google Maps ↗";maps.className="map-external";wrapper.append(maps);return wrapper;}
function select(g){listing.replaceChildren(locationPanel(g));for(const btn of document.querySelectorAll(".city-option"))btn.classList.toggle("selected",btn.dataset.city===key(g));}
const buttons=document.getElementById("city-buttons");for(const g of grouped.locations){const btn=document.createElement("button");btn.type="button";btn.className="city-option";btn.dataset.city=key(g);btn.textContent=g.city+", "+g.state+" · "+g.count;btn.addEventListener("click",()=>{select(g);const coord=window.BUDDY_DEMO_COORDS[key(g)];if(coord&&window.buddyMap)window.buddyMap.flyTo(coord,9);});buttons.append(btn);}
if(grouped.locations.length)select(grouped.locations[0]);
if(typeof L==="undefined"){root.textContent="Map tiles could not load. Select a city below to view players.";return;}
const map=L.map(root,{scrollWheelZoom:false}).setView([31.2,-86.7],6);window.buddyMap=map;
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
const bounds=[];for(const g of grouped.locations){const coord=window.BUDDY_DEMO_COORDS[key(g)];if(!coord)continue;bounds.push(coord);const marker=L.marker(coord,{icon:L.divIcon({className:"buddy-marker",html:"<span>"+g.count+"</span>",iconSize:[42,42],iconAnchor:[21,21]})}).addTo(map);marker.bindTooltip(g.city+", "+g.state+" · "+g.count+" players");marker.on("click",()=>select(g));}
if(bounds.length)map.fitBounds(bounds,{padding:[35,35],maxZoom:8});setTimeout(()=>map.invalidateSize(),200);
})();
