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
  status.textContent="Loading hometowns for the top 20 familiar players…";
  const priorityIds=new Set([player,...result.matches.slice(0,20).map(p=>p.pdgaNumber)]);
  const priorityPlayers=roster.players.filter(p=>priorityIds.has(p.pdgaNumber));
  const hometowns=await PDGAData.enrichHometowns(priorityPlayers);if(token!==searchToken)return;
  if(window.BuddyMapUI)window.BuddyMapUI.update(roster.players);
  if(window.BuddyTravel)window.BuddyTravel.setEvent(roster.players,player,roster.metadata);
  const locations=new Map(priorityPlayers.map(p=>[p.pdgaNumber,p]));
  for(const match of result.matches){const p=locations.get(match.pdgaNumber);if(p){match.city=p.city;match.state=p.state;}}
  const loadedHometowns=new Set(priorityPlayers.map(p=>p.pdgaNumber));
  const loadMoreHometowns=async(matches)=>{
   const pending=matches.filter(p=>!loadedHometowns.has(p.pdgaNumber));
   if(!pending.length||token!==searchToken)return;
   for(const p of pending)loadedHometowns.add(p.pdgaNumber);
   try{
    const records=await PDGAData.batchPlayers(pending.map(p=>p.pdgaNumber));
    if(token!==searchToken)return;
    const byId=new Map(records.filter(r=>r.found&&r.player).map(r=>[String(r.pdga_number),r.player]));
    for(const match of pending){
     const details=byId.get(String(match.pdgaNumber));if(!details)continue;
     match.city=details.city||match.city;match.state=details.state_prov||match.state;
     const rosterPlayer=roster.players.find(p=>p.pdgaNumber===match.pdgaNumber);
     if(rosterPlayer){rosterPlayer.city=match.city;rosterPlayer.state=match.state;}
    }
    BuddyResults.refreshHometowns();
    if(window.BuddyMapUI)window.BuddyMapUI.update(roster.players);
   }catch(err){
    for(const p of pending)loadedHometowns.delete(p.pdgaNumber);
    status.textContent="Additional hometowns temporarily unavailable; try Load 10 more again.";
   }
  };
  BuddyResults.render(result,roster.players,player,loadMoreHometowns);document.getElementById("result-label").textContent="PDGA LIVE · "+(failed?"PARTIAL HISTORIES":"HISTORIES COMPARED");
  status.textContent=result.matches.length+" familiar players found among "+result.comparedCount+" comparable histories. "+failed+" histories unavailable; missing histories are not counted as nonmatches. Hometowns checked for "+hometowns.enriched+" of the top "+priorityPlayers.length+" players; "+hometowns.failed+" lookups unavailable.";
 }catch(err){if(token===searchToken){status.textContent="Search unavailable: "+err.message+" Results may be incomplete.";document.getElementById("result-label").textContent="SEARCH INCOMPLETE";}}
 finally{if(token===searchToken){button.disabled=false;button.textContent="Find my buddies ↗";}}
});
