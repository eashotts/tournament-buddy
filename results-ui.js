"use strict";
(function(){
const host=document.getElementById("cards"),filters=document.getElementById("result-filters");
let all=[],active={states:new Set(),cities:new Set(),events:new Set()},home=null,coordinates=new Map(),sortMode="nearby",pageSize=10,shown=10;
const node=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
function key(p){return [p.city,p.state].filter(Boolean).join(", ");}
function choices(label,items,set,changed){const d=node("details","filter-menu"),s=node("summary","",label+" ("+set.size+")");d.append(s);const body=node("div","filter-options");for(const [value,count] of items){const l=node("label","filter-check"),c=document.createElement("input");c.type="checkbox";c.checked=set.has(value);c.addEventListener("change",()=>{c.checked?set.add(value):set.delete(value);changed();});l.append(c,document.createTextNode(" "+value+" ("+count+")"));body.append(l);}d.append(body);return d;}
function options(items,fn){const m=new Map();items.forEach(p=>fn(p).forEach(v=>{if(v)m.set(v,(m.get(v)||0)+1);}));return [...m].sort((a,b)=>a[0].localeCompare(b[0]));}
function refreshControls(){filters.replaceChildren();if(!all.length)return;const changed=()=>{shown=pageSize;refreshControls();draw();syncMap();};filters.append(choices("States",options(all,p=>[p.state||"Unknown"]),active.states,changed),choices("Cities",options(all,p=>[key(p)||"Unknown"]),active.cities,changed),choices("Shared events",options(all,p=>p.sharedEvents.map(e=>e.eventId+" · "+e.name)),active.events,changed));
const reset=node("button","city-option","Clear filters");reset.type="button";reset.addEventListener("click",()=>{active={states:new Set(),cities:new Set(),events:new Set()};changed();});filters.append(reset);}
function matches(p){return (!active.states.size||active.states.has(p.state||"Unknown"))&&(!active.cities.size||active.cities.has(key(p)||"Unknown"))&&(!active.events.size||p.sharedEvents.some(e=>active.events.has(e.eventId+" · "+e.name)));}
function distance(p){if(!home)return Infinity;const a=coordinates.get(home.city+"|"+home.state),b=coordinates.get(p.city+"|"+p.state);if(!a||!b)return Infinity;const rad=Math.PI/180,lat=(b[0]-a[0])*rad,lon=(b[1]-a[1])*rad,h=Math.sin(lat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(lon/2)**2;return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(h)));}
function priority(p){if(!home||!home.state)return 2;if(p.city&&home.city&&p.city.toLowerCase()===home.city.toLowerCase()&&p.state===home.state)return 0;if(p.state===home.state)return 1;return 2;}
function latest(p){const dates=p.sharedEvents.map(e=>Date.parse(e.date||"")).filter(Number.isFinite);return dates.length?Math.max(...dates):-Infinity;}
function compare(a,b){
 const fallback=b.sharedCount-a.sharedCount||b.sameDivisionCount-a.sameDivisionCount||a.name.localeCompare(b.name);
 if(sortMode==="recent")return latest(b)-latest(a)||fallback;
 if(sortMode==="shared")return fallback;
 if(sortMode==="division")return b.sameDivisionCount-a.sameDivisionCount||fallback;
 return (Number.isFinite(distance(a))&&Number.isFinite(distance(b))?distance(a)-distance(b):priority(a)-priority(b))||fallback;
}
function draw(){host.replaceChildren();const visible=all.filter(matches).sort(compare),page=visible.slice(0,shown);
document.getElementById("visible-count").textContent="Showing "+page.length+" of "+visible.length+" matching players"+(visible.length!==all.length?" ("+all.length+" total)":"");
const table=node("table","buddy-table");const thead=document.createElement("thead"),head=document.createElement("tr");for(const text of ["Player","Hometown","Shared events","Same division","Details"]){head.append(node("th","",text));}thead.append(head);table.append(thead);const tbody=document.createElement("tbody");
for(const p of page){const tr=document.createElement("tr");tr.className="buddy-main";const name=node("td");const link=node("a","",p.name);link.href="https://www.pdga.com/player/"+encodeURIComponent(p.pdgaNumber);link.target="_blank";link.rel="noopener noreferrer";name.append(link,node("div","meta","#"+p.pdgaNumber+" · "+p.registeredDivision));tr.append(name,node("td","",key(p)||"Undisclosed"),node("td","",String(p.sharedCount)),node("td","",String(p.sameDivisionCount)));
const action=node("td"),btn=node("button","city-option","Expand ▾");btn.type="button";action.append(btn);tr.append(action);tbody.append(tr);
const detail=document.createElement("tr");detail.hidden=true;const cell=document.createElement("td");cell.colSpan=5;const inner=node("div","buddy-detail");inner.append(node("strong","",p.sharedCount+" shared tournaments"));
const unresolved=[];for(const e of p.sharedEvents){const line=node("div","buddy-event");const known=e.name&&!/^Event #/.test(e.name)&&e.name!=="PDGA tournament";const a=node("a","",known?e.name:"Loading tournament name…");if(!known)unresolved.push({eventId:e.eventId,link:a});a.href="https://www.pdga.com/tour/event/"+encodeURIComponent(e.eventId);a.target="_blank";a.rel="noopener noreferrer";line.append(a);if(e.date)line.append(node("span","meta"," · "+e.date));line.append(node("div","division",e.sameDivision?"✓ Same division: "+e.myDivisions.filter(d=>e.theirDivisions.includes(d)).join(", "):"Different divisions"));inner.append(line);}
cell.append(inner);detail.append(cell);tbody.append(detail);let requested=false;btn.addEventListener("click",()=>{detail.hidden=!detail.hidden;btn.textContent=detail.hidden?"Expand ▾":"Collapse ▴";if(!detail.hidden&&!requested){requested=true;for(const item of unresolved){PDGAData.eventTitle(item.eventId).then(title=>{item.link.textContent=title||"PDGA event #"+item.eventId;});}}});}
table.append(tbody);host.append(table);if(shown<visible.length){const more=node("button","load-more","Load 10 more players ("+(visible.length-shown)+" remaining) ↓");more.type="button";more.addEventListener("click",()=>{shown+=pageSize;draw();});host.append(more);}if(!visible.length)host.append(node("p","meta","No players match these filters."));

}
function syncMap(){if(window.BuddyMapUI)window.BuddyMapUI.filterMatched(all.filter(matches));}
function setSort(value){sortMode=value;shown=pageSize;draw();}
function render(result,roster,playerId){shown=pageSize;all=result.matches;active={states:new Set(),cities:new Set(),events:new Set()};const self=roster.find(p=>p.pdgaNumber===playerId);home=self?.city&&self?.state?{city:self.city,state:self.state}:null;document.getElementById("sort-note").textContent=home?"Nearby first: "+home.city+", "+home.state+" (same city, then state; precise distance unavailable).":"Home location unavailable from PDGA; sorting by shared events, then same-division overlaps.";document.getElementById("count-matches").textContent=all.length;document.getElementById("count-events").textContent=Math.max(0,...all.map(p=>p.sharedCount));refreshControls();draw();syncMap();}
function setCoordinates(map){coordinates=map; if(all.length){document.getElementById("sort-note").textContent=home?"Sorted by approximate hometown distance where mapped, then shared events and same-division overlaps. Unmapped cities use city/state proximity tiers.":"Home location unavailable from PDGA; sorted by shared events and same-division overlaps.";draw();}}
function clear(){shown=pageSize;all=[];active={states:new Set(),cities:new Set(),events:new Set()};host.replaceChildren();filters.replaceChildren();document.getElementById("visible-count").textContent="";document.getElementById("sort-note").textContent="";}
document.getElementById("sort-mode").addEventListener("change",e=>setSort(e.target.value));
window.BuddyResults={render,clear,setCoordinates,setSort};
})();
