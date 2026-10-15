"use strict";
const status=document.getElementById("status");
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
let searchToken=0;
document.getElementById("search").addEventListener("submit",async e=>{
 e.preventDefault();const token=++searchToken;
 let eventId,player;try{eventId=BuddyLookup.eventId();player=BuddyLookup.playerId();}catch(err){status.textContent=err.message;return;}
 const url="https://www.pdga.com/tour/event/"+eventId;
 const button=e.currentTarget.querySelector("button");button.disabled=true;button.textContent="Finding buddies…";
 BuddyResults.clear();document.getElementById("count-matches").textContent="—";document.getElementById("count-events").textContent="—";
 document.getElementById("result-label").textContent="SEARCHING";document.getElementById("live-roster").replaceChildren();
 if(window.BuddyMapUI)window.BuddyMapUI.clear();
 if(window.BuddyLodging)window.BuddyLodging.setEvent(url);
 try{
  const pdgaUrl=url;status.textContent="Step 1 of 2: loading PDGA Live players for event #"+eventId+"…";
  const roster=await PDGAData.registration(pdgaUrl);if(token!==searchToken)return;
  const summary=el("p","meta",roster.players.length+" players · "+roster.divisions.length+" divisions · PDGA Live player records");
  document.getElementById("live-roster").append(summary);
  if(window.BuddyMapUI)window.BuddyMapUI.update(roster.players);
  if(window.BuddyLodging)window.BuddyLodging.setEvent(pdgaUrl,roster.metadata);
  if(window.BuddyTravel)window.BuddyTravel.setEvent(roster.players,player,roster.metadata);
  status.textContent="Step 2 of 2: comparing tournament histories for "+roster.players.length+" players…";
  const histories={};histories[player]=await PDGAData.history(player);if(!histories[player].length)throw Error("No recognizable event IDs in your history response.");
  const candidates=roster.players.filter(p=>p.pdgaNumber!==player),queue=[...candidates];let done=0,failed=0;
  const workers=Array.from({length:3},async()=>{while(queue.length&&token===searchToken){
   const p=queue.shift();try{histories[p.pdgaNumber]=await PDGAData.history(p.pdgaNumber);}catch{failed++;}
   done++;if(done%10===0||done===candidates.length)status.textContent="Comparing tournament histories: "+done+" / "+candidates.length+" checked · "+failed+" unavailable";
  }});
  await Promise.all(workers);if(token!==searchToken)return;
  const result=TournamentBuddy.matchBuddies({playerId:player,registrants:roster.players,historyByPlayer:histories});
  BuddyResults.render(result,roster.players,player);document.getElementById("result-label").textContent="PDGA LIVE · "+(failed?"PARTIAL HISTORIES":"HISTORIES COMPARED");
  status.textContent=result.matches.length+" familiar players found among "+result.comparedCount+" comparable histories. "+failed+" histories unavailable; missing histories are not counted as nonmatches. Player hometowns are not included in this endpoint.";
 }catch(err){if(token===searchToken){status.textContent="Search unavailable: "+err.message+" Results may be incomplete.";document.getElementById("result-label").textContent="SEARCH INCOMPLETE";}}
 finally{if(token===searchToken){button.disabled=false;button.textContent="Find my buddies ↗";}}
});
