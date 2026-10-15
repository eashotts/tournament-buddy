"use strict";
(function(){
const origin=document.getElementById("route-origin"),destination=document.getElementById("route-destination"),width=document.getElementById("route-width"),status=document.getElementById("route-status"),only=document.getElementById("route-only");
let route=null,coordinates=new Map(),originPoint=null,threshold=50;
function cityKey(p){return String(p.city||"")+"|"+String(p.state||"");}
function rad(x){return x*Math.PI/180;}
function miles(a,b){const dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]);const h=Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2;return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(h)));}
function segmentDistance(p,a,b){const mid=rad((a[0]+b[0]+p[0])/3),x=Math.cos(mid)*69.1,y=69.0;const ax=a[1]*x,ay=a[0]*y,bx=b[1]*x,by=b[0]*y,px=p[1]*x,py=p[0]*y;const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
function distance(p){if(!route)return Infinity;const point=coordinates.get(cityKey(p));if(!point)return Infinity;let best=Infinity;for(let i=1;i<route.length;i++)best=Math.min(best,segmentDistance(point,route[i-1],route[i]));return best;}
function matches(p){return distance(p)<=threshold;}
function isFilterActive(){return Boolean(route&&only.checked);}
function refresh(){window.BuddyResults?.refreshTravel();}
function setCoordinates(next){for(const [key,value] of next)coordinates.set(key,value);if(route&&only.checked){const count=next.size;if(count)refresh();}}
function setEvent(roster,playerId,metadata){reset();const self=roster.find(p=>p.pdgaNumber===playerId);origin.value=self?.city&&self?.state?self.city+", "+self.state:"";const meta=metadata?.event&&typeof metadata.event==="object"?metadata.event:metadata;const city=meta?.City||meta?.city||meta?.TournCity||meta?.tournCity||meta?.EventCity||"";const state=meta?.State||meta?.state||meta?.StateProv||meta?.stateProv||"";destination.value=city?[city,state].filter(Boolean).join(", "):document.getElementById("lodging-destination").value||"";status.textContent="Enter your starting city and the tournament city, then calculate the driving corridor.";}
function reset(){route=null;originPoint=null;coordinates.clear();only.checked=false;window.BuddyMapUI?.setTravelRoute(null);refresh();}
async function geocode(place){const response=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(place),{headers:{Accept:"application/json"}});if(!response.ok)throw Error("Location search unavailable");const rows=await response.json();if(!rows.length)throw Error("Could not locate "+place);return [Number(rows[0].lat),Number(rows[0].lon)];}
document.getElementById("route-form").addEventListener("submit",async e=>{e.preventDefault();const button=e.currentTarget.querySelector("button");button.disabled=true;status.textContent="Looking up cities and calculating a driving route…";try{
 const [from,to]=await Promise.all([geocode(origin.value.trim()),geocode(destination.value.trim())]);
 const url="https://router.project-osrm.org/route/v1/driving/"+from[1]+","+from[0]+";"+to[1]+","+to[0]+"?overview=full&geometries=geojson";
 const response=await fetch(url);if(!response.ok)throw Error("Driving route service unavailable");
 const data=await response.json();const points=data.routes?.[0]?.geometry?.coordinates;
 if(!points?.length)throw Error("No driving route was found between those cities");
 route=points.map(p=>[p[1],p[0]]);originPoint=from;threshold=Number(width.value)||50;
 window.BuddyMapUI?.setTravelRoute(route);status.textContent="Driving corridor calculated. Hometowns within approximately "+threshold+" miles of the route qualify. Choose 'Only players along route' to filter results.";
 refresh();
 }catch(err){status.textContent=err.message+". Try another city or retry later.";route=null;window.BuddyMapUI?.setTravelRoute(null);refresh();}finally{button.disabled=false;}});
width.addEventListener("change",()=>{threshold=Number(width.value)||50;refresh();if(route)status.textContent="Route corridor updated to "+threshold+" miles from the driving route.";});
only.addEventListener("change",()=>{if(only.checked&&!route){only.checked=false;status.textContent="Calculate a driving route first.";return;}refresh();});
window.BuddyTravel={setEvent,setCoordinates,isFilterActive,matches,distance};
})();
