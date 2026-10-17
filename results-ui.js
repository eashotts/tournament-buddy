"use strict";
(function(){
const host=document.getElementById("cards"),filters=document.getElementById("result-filters");
let loadMoreHometowns=null;let all=[],active={states:new Set(),cities:new Set(),events:new Set()},home=null,coordinates=new Map(),sortMode="nearby",pageSize=10,shown=10;
const node=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
function key(p){return [p.city,p.state].filter(Boolean).join(", ");}
function choices(label,items,set,changed){const d=node("details","filter-menu"),s=node("summary","",label+" ("+set.size+")");d.append(s);const body=node("div","filter-options");for(const [value,count] of items){const l=node("label","filter-check"),c=document.createElement("input");c.type="checkbox";c.checked=set.has(value);c.addEventListener("change",()=>{c.checked?set.add(value):set.delete(value);changed();});l.append(c,document.createTextNode(" "+value+" ("+count+")"));body.append(l);}d.append(body);return d;}
function eventChoices(players,selection,changed){
 const events=new Map();
 for(const p of players)for(const e of p.sharedEvents||[]){
  const id=String(e.eventId),known=e.name&&!/^Event #/i.test(e.name)&&e.name!=="PDGA tournament";
  if(!events.has(id))events.set(id,{count:0,name:known?e.name:null});
  const entry=events.get(id);entry.count++;if(known)entry.name=e.name;
 }
 const details=node("details","filter-menu"),summary=node("summary","","Events ("+selection.size+")"),body=node("div","filter-options");
 details.append(summary);
 const pending=[];
 details.addEventListener("toggle",()=>{if(details.open)for(const resolve of pending.splice(0))resolve();});
 for(const [id,entry] of [...events].sort((a,b)=>(a[1].name||"").localeCompare(b[1].name||"")||a[0].localeCompare(b[0]))){
  const row=node("label","filter-check"),check=document.createElement("input"),label=node("span","",entry.name||"Loading tournament name…");
  check.type="checkbox";check.checked=selection.has(id);check.addEventListener("change",()=>{check.checked?selection.add(id):selection.delete(id);summary.textContent="Events ("+selection.size+")";changed();});
  row.append(check,label);body.append(row);
  if(!entry.name)pending.push(()=>PDGAData.eventTitle(id).then(title=>{label.textContent=title||"PDGA event #"+id;}).catch(()=>{label.textContent="PDGA event #"+id;}));
 }
 details.append(body);return details;
}
function options(items,fn){const m=new Map();items.forEach(p=>fn(p).forEach(v=>{if(v)m.set(v,(m.get(v)||0)+1);}));return [...m].sort((a,b)=>a[0].localeCompare(b[0]));}
function refreshControls(){filters.replaceChildren();if(!all.length)return;const changed=()=>{shown=pageSize;refreshControls();draw();syncMap();};filters.append(choices("States",options(all,p=>[p.state||"Unknown"]),active.states,changed),choices("Cities",options(all,p=>[key(p)||"Unknown"]),active.cities,changed),eventChoices(all,active.events,changed));
const reset=node("button","city-option","Clear filters");reset.type="button";reset.addEventListener("click",()=>{active={states:new Set(),cities:new Set(),events:new Set()};changed();});filters.append(reset);}
function matches(p){return (!active.states.size||active.states.has(p.state||"Unknown"))&&(!active.cities.size||active.cities.has(key(p)||"Unknown"))&&(!active.events.size||p.sharedEvents.some(e=>active.events.has(String(e.eventId))));}
function distance(p){if(!home)return Infinity;const a=coordinates.get(home.city+"|"+home.state),b=coordinates.get(p.city+"|"+p.state);if(!a||!b)return Infinity;const rad=Math.PI/180,lat=(b[0]-a[0])*rad,lon=(b[1]-a[1])*rad,h=Math.sin(lat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(lon/2)**2;return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(h)));}
function priority(p){if(!home||!home.state)return 2;if(p.city&&home.city&&p.city.toLowerCase()===home.city.toLowerCase()&&p.state===home.state)return 0;if(p.state===home.state)return 1;return 2;}
function familiarity(p){const now=Date.now(),year=365.25*86400000;return p.sharedEvents.reduce((score,e)=>{const date=Date.parse(e.date||"");const age=Number.isFinite(date)?Math.max(0,now-date):Infinity;return score+(age<=year?4:age<=3*year?2:1)+(e.sameDivision?2:0);},0);}
function latest(p){const dates=p.sharedEvents.map(e=>Date.parse(e.date||"")).filter(Number.isFinite);return dates.length?Math.max(...dates):-Infinity;}
function compare(a,b){
 const fallback=b.sharedCount-a.sharedCount||b.sameDivisionCount-a.sameDivisionCount||a.name.localeCompare(b.name);
 if(sortMode==="familiarity")return familiarity(b)-familiarity(a)||fallback;
 if(sortMode==="corridor")return (window.BuddyTravel?.distance(a)??Infinity)-(window.BuddyTravel?.distance(b)??Infinity)||fallback;
 if(sortMode==="recent")return latest(b)-latest(a)||fallback;
 if(sortMode==="shared")return fallback;
 if(sortMode==="division")return b.sameDivisionCount-a.sameDivisionCount||fallback;
 const da=distance(a),db=distance(b);if(Number.isFinite(da)&&Number.isFinite(db))return da-db||fallback;
 if(Number.isFinite(da)!==Number.isFinite(db))return Number.isFinite(da)?-1:1;
 return priority(a)-priority(b)||fallback;
}
function draw(){host.replaceChildren();const visible=all.filter(p=>matches(p)&&(!window.BuddyTravel?.isFilterActive()||window.BuddyTravel.matches(p))).sort(compare),page=visible.slice(0,shown);
document.getElementById("visible-count").textContent="Showing "+page.length+" of "+visible.length+" matching players"+(visible.length!==all.length?" ("+all.length+" total)":"");
const table=node("table","buddy-table");const thead=document.createElement("thead"),head=document.createElement("tr");for(const text of ["Player","Hometown","Shared events","Familiarity","Same division","Details"]){head.append(node("th","",text));}thead.append(head);table.append(thead);const tbody=document.createElement("tbody");
for(const p of page){const tr=document.createElement("tr");tr.className="buddy-main";const name=node("td");const link=node("a","",p.name);link.href="https://www.pdga.com/player/"+encodeURIComponent(p.pdgaNumber);link.target="_blank";link.rel="noopener noreferrer";name.append(link,node("div","meta","#"+p.pdgaNumber+" · "+p.registeredDivision));tr.append(name,node("td","",key(p)||"Undisclosed"),node("td","",String(p.sharedCount)),node("td","",String(familiarity(p))),node("td","",String(p.sameDivisionCount)));
const action=node("td"),btn=node("button","city-option","Expand ▾");btn.type="button";action.append(btn);tr.append(action);tbody.append(tr);
const detail=document.createElement("tr");detail.hidden=true;const cell=document.createElement("td");cell.colSpan=6;const inner=node("div","buddy-detail");inner.append(node("strong","",p.sharedCount+" shared tournaments · Familiarity score "+familiarity(p)));
const unresolved=[];for(const e of p.sharedEvents){const line=node("div","buddy-event");const known=e.name&&!/^Event #/.test(e.name)&&e.name!=="PDGA tournament";const a=node("a","",known?e.name:"Loading tournament name…");if(!known)unresolved.push({eventId:e.eventId,link:a});a.href="https://www.pdga.com/tour/event/"+encodeURIComponent(e.eventId);a.target="_blank";a.rel="noopener noreferrer";line.append(a);if(e.date)line.append(node("span","meta"," · "+e.date));line.append(node("div","division",e.sameDivision?"✓ Same division: "+e.myDivisions.filter(d=>e.theirDivisions.includes(d)).join(", "):"Different divisions"));inner.append(line);}
cell.append(inner);detail.append(cell);tbody.append(detail);let requested=false;btn.addEventListener("click",()=>{detail.hidden=!detail.hidden;btn.textContent=detail.hidden?"Expand ▾":"Collapse ▴";if(!detail.hidden&&!requested){requested=true;for(const item of unresolved){PDGAData.eventTitle(item.eventId).then(title=>{item.link.textContent=title||"PDGA event #"+item.eventId;});}}});}
table.append(tbody);host.append(table);if(shown<visible.length){const more=node("button","load-more","Load 10 more players ("+(visible.length-shown)+" remaining) ↓");more.type="button";more.addEventListener("click",async()=>{
  const previous=shown;
  const visible=all.filter(p=>matches(p)&&(!window.BuddyTravel?.isFilterActive()||window.BuddyTravel.matches(p))).sort(compare);
  const newlyVisible=visible.slice(previous,previous+pageSize);
  shown+=pageSize;draw();
  if(loadMoreHometowns)await loadMoreHometowns(newlyVisible);
 });host.append(more);}if(!visible.length)host.append(node("p","meta","No players match these filters."));

}
function syncMap(){if(window.BuddyMapUI)window.BuddyMapUI.filterMatched(all.filter(p=>matches(p)&&(!window.BuddyTravel?.isFilterActive()||window.BuddyTravel.matches(p))));}
function setSort(value){sortMode=value;shown=pageSize;draw();}
function render(result,roster,playerId,onLoadMoreHometowns){loadMoreHometowns=onLoadMoreHometowns||null;coordinates=new Map();shown=pageSize;all=result.matches;active={states:new Set(),cities:new Set(),events:new Set()};const self=roster.find(p=>p.pdgaNumber===playerId);home=self?.city&&self?.state?{city:self.city,state:self.state}:null;document.getElementById("sort-note").textContent=home?"Nearby first: "+home.city+", "+home.state+" (same city, then state; precise distance unavailable).":"Home location unavailable from PDGA; sorting by shared events, then same-division overlaps.";document.getElementById("count-matches").textContent=all.length;document.getElementById("count-events").textContent=Math.max(0,...all.map(p=>p.sharedCount));refreshControls();draw();syncMap();if(home&&window.BuddyMapUI?.setHome)window.BuddyMapUI.setHome(self);}
function setCoordinates(map){for(const [key,point] of map)coordinates.set(key,point);if(window.BuddyTravel)window.BuddyTravel.setCoordinates(map); if(all.length){document.getElementById("sort-note").textContent=home?(coordinates.has(home.city+"|"+home.state)?"Sorted by approximate city-center distance from "+home.city+", "+home.state+". Hometowns still being located may change order.":"Locating your hometown and other players’ cities to calculate nearest-first order…"):"Home location unavailable from PDGA; sorted by shared events and same-division overlaps.";draw();}}
function refreshHometowns(){refreshControls();draw();syncMap();}
function clear(){loadMoreHometowns=null;coordinates=new Map();home=null;shown=pageSize;all=[];active={states:new Set(),cities:new Set(),events:new Set()};host.replaceChildren();filters.replaceChildren();document.getElementById("visible-count").textContent="";document.getElementById("sort-note").textContent="";}
document.getElementById("sort-mode").addEventListener("change",e=>setSort(e.target.value));
function refreshTravel(){shown=pageSize;draw();syncMap();}
window.BuddyResults={render,clear,setCoordinates,setSort,refreshTravel,refreshHometowns};
})();
