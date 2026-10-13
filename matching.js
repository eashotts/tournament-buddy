// Pure, dependency-free tournament matching engine. No PDGA scraping or network calls.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TournamentBuddy=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const id=x=>{const s=String(x??"").trim();return /^[1-9][0-9]*$/.test(s)?s:null;};
const division=x=>String(x??"").trim().toUpperCase();
function normalizeHistory(history){if(!Array.isArray(history))throw Error("History must be an array");
 const events=new Map();
 for(const row of history){if(!row||typeof row!=="object")continue;
 const eventId=id(row.eventId);if(!eventId)continue;
 let e=events.get(eventId);if(!e){e={eventId,name:String(row.name||"Event #"+eventId).trim(),date:String(row.date||""),divisions:new Set()};events.set(eventId,e);}
 if(!e.date&&row.date)e.date=String(row.date);
 if((!e.name||e.name==="Event #"+eventId)&&row.name)e.name=String(row.name);
 const d=division(row.division);if(d)e.divisions.add(d);
 }
 return events;
}
function matchBuddies({playerId,registrants,historyByPlayer}){
 const self=id(playerId);if(!self)throw Error("Valid player PDGA number required");
 if(!Array.isArray(registrants)||!historyByPlayer||typeof historyByPlayer!=="object")throw Error("Registrants and histories are required");
 const mine=normalizeHistory(historyByPlayer[self]||[]);
 const seen=new Set();const matches=[];let skippedMissingHistory=0;
 for(const player of registrants){if(!player||typeof player!=="object")continue;
 const pid=id(player.pdgaNumber);if(!pid||pid===self||seen.has(pid))continue;seen.add(pid);
 if(!Object.prototype.hasOwnProperty.call(historyByPlayer,pid)){skippedMissingHistory++;continue;}
 const theirs=normalizeHistory(historyByPlayer[pid]);const shared=[];
 for(const [eventId,me] of mine){const them=theirs.get(eventId);if(!them)continue;
 const sameDivision=[...me.divisions].some(d=>them.divisions.has(d));
 shared.push({eventId,name:me.name||them.name,date:me.date||them.date,sameDivision,myDivisions:[...me.divisions],theirDivisions:[...them.divisions]});
 }
 if(!shared.length)continue;
 shared.sort((a,b)=>b.date.localeCompare(a.date)||a.eventId.localeCompare(b.eventId));
 matches.push({pdgaNumber:pid,name:String(player.name||"PDGA #"+pid),city:String(player.city||""),state:String(player.state||""),registeredDivision:division(player.division),sharedCount:shared.length,sameDivisionCount:shared.filter(e=>e.sameDivision).length,sharedEvents:shared});
 }
 matches.sort((a,b)=>b.sharedCount-a.sharedCount||b.sameDivisionCount-a.sameDivisionCount||a.name.localeCompare(b.name)||a.pdgaNumber.localeCompare(b.pdgaNumber));
 return {playerId:self,registrantCount:seen.size,comparedCount:seen.size-skippedMissingHistory,skippedMissingHistory,matches};
}
return {matchBuddies,normalizeHistory};
});
