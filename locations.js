// Location grouping is independent of the map renderer and can consume authorized live registrants later.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.BuddyLocations=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
function group(registrants){if(!Array.isArray(registrants))throw Error("Expected a registrant list");const groups=new Map();let unknown=0;const seen=new Set();
for(const p of registrants){if(!p||typeof p!=="object")continue;const number=String(p.pdgaNumber??"").trim();if(number&&seen.has(number))continue;if(number)seen.add(number);
const city=String(p.city||"").trim(),state=String(p.state||"").trim().toUpperCase(),country=String(p.country||"USA").trim().toUpperCase();if(!city||!state){unknown++;continue;}
const key=[city.toLocaleLowerCase("en-US"),state,country].join("|");if(!groups.has(key))groups.set(key,{city,state,country,players:[]});
groups.get(key).players.push({name:String(p.name||"Unknown player"),pdgaNumber:number,division:String(p.division||"—")});}
return {locations:[...groups.values()].map(g=>({...g,count:g.players.length,players:g.players.sort((a,b)=>a.name.localeCompare(b.name))})).sort((a,b)=>b.count-a.count||a.city.localeCompare(b.city)),unknown};}
return {group};
});
