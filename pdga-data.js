// PDGA Live integration: public CORS-enabled endpoints; historical results endpoint requires validation.
// This file intentionally contains no private documentation or credentials.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.PDGAData=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const base="https://www.pdga.com/apps/tournament/live-api";
async function json(url){const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw Error("PDGA returned HTTP "+r.status);const body=await r.json();return Object.prototype.hasOwnProperty.call(body,"data")?body.data:body;}
function eventId(input){const m=String(input).match(/(?:\/tour\/event\/|\/live\/event\/)([1-9]\d*)/);if(!m)throw Error("Use a PDGA event or Live event URL");return m[1];}
function divisionCodes(event){const raw=event?.Divisions||event?.divisions||[];const rows=Array.isArray(raw)?raw:Object.entries(raw).map(([code,val])=>({code,...(val&&typeof val==="object"?val:{})}));return [...new Set(rows.map(d=>String(d.Division||d.division||d.code||d.DivisionCode||d.Code||"").toUpperCase()).filter(x=>/^[A-Z]{2,4}\d{0,2}$/.test(x)))];}
function extractRows(payload,code){const blocks=Array.isArray(payload)?payload:[payload];const result=[];for(const block of blocks){if(!block||typeof block!=="object")continue;for(const row of block.scores||block.Scores||[]){const number=Number(row.PDGANum);if(!Number.isSafeInteger(number)||number<=0)continue;result.push({pdgaNumber:String(number),name:String(row.Name||"PDGA #"+number),division:String(row.Division||block.division||code),city:String(row.City||""),state:String(row.StateProv||""),country:String(row.Country||"USA"),status:"registered"});}}return result;}
async function registration(event){const id=eventId(event);const metadata=await json(base+"/live_results_fetch_event?TournID="+id);const divisions=divisionCodes(metadata);if(!divisions.length)throw Error("PDGA Live has no division codes for this event. A pre-event registration endpoint may be needed.");
const all=[];let succeeded=0;const failed=[];for(let i=0;i<divisions.length;i+=4){const batch=divisions.slice(i,i+4);await Promise.all(batch.map(async code=>{try{const data=await json(base+"/live_results_fetch_standings?TournID="+id+"&Division="+encodeURIComponent(code));all.push(...extractRows(data,code));succeeded++;}catch(err){failed.push(code+": "+err.message);}}));}
if(!succeeded)throw Error("No PDGA Live standings available. This event may not have published Live scoring yet.");
const seen=new Set();const players=all.filter(p=>{if(seen.has(p.pdgaNumber))return false;seen.add(p.pdgaNumber);return true;});
return {eventId:id,players,divisions,failed,complete:failed.length===0,source:"PDGA Live standings (not verified pre-event registration list)"};}
function historyRows(payload){const data=payload?.data??payload;const arr=Array.isArray(data)?data:Array.isArray(data?.results)?data.results:Array.isArray(data?.Results)?data.Results:null;if(!arr)throw Error("Historical endpoint returned an unrecognized structure; inspect response schema before enabling matching.");
return arr.map(row=>({eventId:row.eventId??row.EventID??row.TournID??row.tournament_id,name:row.name??row.EventName??row.TournName??"",date:row.date??row.StartDate??"",division:row.division??row.Division??""})).filter(row=>/^\d+$/.test(String(row.eventId??""))); }
async function history(playerId){if(!/^[1-9]\d*$/.test(String(playerId)))throw Error("Invalid PDGA number");return historyRows(await json("https://www.pdga.com/api/v1/feat/members/"+playerId+"/results"));}
return {eventId,divisionCodes,extractRows,registration,historyRows,history};
});
