"use strict";
const cards=document.getElementById("cards"),status=document.getElementById("status");
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function render(result){cards.replaceChildren();document.getElementById("count-matches").textContent=result.matches.length;document.getElementById("count-events").textContent=Math.max(0,...result.matches.map(m=>m.sharedCount));for(const p of result.matches){const article=el("article","card");const top=el("div","cardtop");const initials=p.name.split(/\s+/).slice(0,2).map(s=>s[0]||"").join("");top.append(el("div","avatar",initials),el("span","pill",p.sharedCount+" SHARED EVENT"+(p.sharedCount===1?"":"S")));article.append(top,el("h3","",p.name),el("div","meta","PDGA #"+p.pdgaNumber+" · "+[p.city,p.state].filter(Boolean).join(", ")),el("div","rule"),el("h4","","TOURNAMENTS IN COMMON"));for(const e of p.sharedEvents){const row=el("div","event","↗ "+e.name+" · #"+e.eventId);article.append(row);if(e.sameDivision)article.append(el("div","division","✓ Same division ("+e.myDivisions.filter(d=>e.theirDivisions.includes(d)).join(", ")+")"));}article.append(el("div","rule"));const summary=el("div","division",p.sameDivisionCount+" of "+p.sharedCount+" shared events in same division");article.append(summary);const a=el("a","","PDGA profile ↗");a.href="https://www.pdga.com/player/"+encodeURIComponent(p.pdgaNumber);a.target="_blank";a.rel="noopener noreferrer";article.append(el("div","rule"),a);cards.append(article);}if(!result.matches.length)cards.append(el("p","meta","No shared historical events found among successfully compared players."));}
let liveRoster=null,livePlayer=null;
document.getElementById("search").addEventListener("submit",async e=>{
e.preventDefault();const form=new FormData(e.currentTarget),url=String(form.get("event")||""),player=String(form.get("player")||"");
if(!/^[1-9]\d*$/.test(player)){status.textContent="Enter a valid PDGA number.";return;}
const button=e.currentTarget.querySelector("button");button.disabled=true;liveRoster=null;livePlayer=player;cards.replaceChildren();document.getElementById("count-matches").textContent="—";document.getElementById("count-events").textContent="—";document.getElementById("result-label").textContent="SEARCHING";document.getElementById("live-roster").replaceChildren();document.getElementById("compare-live").hidden=true;if(window.BuddyMapUI)window.BuddyMapUI.clear();
try{const eventId=PDGAData.eventId(url);status.textContent="Checking PDGA Live for event #"+eventId+"…";
const roster=await PDGAData.registration(url);liveRoster=roster;
status.textContent="PDGA Live returned "+roster.players.length+" unique players from "+roster.divisions.length+" divisions. Source: Live standings, which may NOT be a complete upcoming registration list. "+(roster.failed.length?"Some divisions failed: "+roster.failed.join("; "):"");
document.getElementById("result-label").textContent="LIVE ROSTER · HISTORY NOT YET VERIFIED";
document.getElementById("live-roster").replaceChildren();
const summary=el("p","meta",roster.players.length+" players found · "+roster.divisions.length+" divisions. This is a Live standings feed, not a confirmed complete registration roster.");document.getElementById("live-roster").append(summary);if(window.BuddyMapUI)window.BuddyMapUI.update(roster.players);
const compare=document.getElementById("compare-live");compare.hidden=false;
}catch(err){status.textContent="Live lookup unavailable: "+err.message+" No results have been displayed.";document.getElementById("compare-live").hidden=true;}
finally{button.disabled=false;}
});
document.getElementById("compare-live").addEventListener("click",async()=>{
if(!liveRoster)return;const btn=document.getElementById("compare-live");btn.disabled=true;const histories={};const candidates=liveRoster.players.filter(p=>p.pdgaNumber!==livePlayer);
try{
status.textContent="Checking your historical results…";histories[livePlayer]=await PDGAData.history(livePlayer);
if(!histories[livePlayer].length)throw Error("No recognizable event IDs in your history response.");
let done=0,failed=0;const queue=[...candidates];const workers=Array.from({length:3},async()=>{while(queue.length){const p=queue.shift();try{histories[p.pdgaNumber]=await PDGAData.history(p.pdgaNumber);}catch{failed++;}done++;if(done%10===0)status.textContent="Historical comparisons: "+done+"/"+candidates.length+" checked; "+failed+" unavailable."; }});
await Promise.all(workers);const result=TournamentBuddy.matchBuddies({playerId:livePlayer,registrants:liveRoster.players,historyByPlayer:histories});render(result);document.getElementById("result-label").textContent="PDGA LIVE · PARTIAL IF ERRORS";
status.textContent=result.matches.length+" familiar players found from "+result.comparedCount+" comparable player histories. "+failed+" histories could not be retrieved. Missing histories are not counted as nonmatches. Live standings may omit unscored registrants.";
}catch(err){status.textContent="Historical comparison unavailable: "+err.message+". Live roster lookup may still work. Existing results were not changed.";}
finally{btn.disabled=false;}
});
